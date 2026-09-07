import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  // 브라우저 PUT이 checksum 헤더를 못 넣어서 SignatureDoesNotMatch 나는 것 방지
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

const PREFIX = process.env.PREFIX || 'guest-snaps'
const MAX_BYTES = Number(process.env.MAX_BYTES || 15 * 1024 * 1024)
const PUT_EXPIRES = 5 * 60
const GET_EXPIRES = 60 * 60
const LIST_CAP = 2000

const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

function corsHeaders(origin) {
  const allowed = (process.env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const allow = allowed.includes('*')
    ? '*'
    : origin && allowed.includes(origin)
      ? origin
      : allowed[0] || '*'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
  }
}

function json(event, statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(event.headers?.origin || event.headers?.Origin),
    },
    body: JSON.stringify(body),
  }
}

function methodOf(event) {
  return (event.requestContext?.http?.method || event.httpMethod || 'GET').toUpperCase()
}

function pathOf(event) {
  const raw = event.rawPath || event.path || '/'
  return raw.replace(/\/+$/, '') || '/'
}

function queryOf(event) {
  if (event.queryStringParameters) return event.queryStringParameters
  const raw = event.rawQueryString || ''
  return Object.fromEntries(new URLSearchParams(raw))
}

function kstDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function decodeCursor(cursor) {
  if (!cursor) return 0
  try {
    const n = Number(Buffer.from(cursor, 'base64url').toString('utf8'))
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

function encodeCursor(offset) {
  return Buffer.from(String(offset), 'utf8').toString('base64url')
}

async function handlePresign(event) {
  const bucket = process.env.BUCKET_NAME
  if (!bucket) return json(event, 500, { error: 'BUCKET_NAME 없음' })

  let payload
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body || '{}'
    payload = JSON.parse(raw)
  } catch {
    return json(event, 400, { error: 'JSON 본문이 필요해요' })
  }

  const contentType = String(payload.contentType || '').toLowerCase()
  const contentLength = Number(payload.contentLength)
  const ext = ALLOWED_TYPES[contentType]
  if (!ext) return json(event, 400, { error: '허용되지 않는 이미지 형식' })
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return json(event, 400, { error: '파일 크기가 필요해요' })
  }
  if (contentLength > MAX_BYTES) return json(event, 400, { error: '파일이 15MB를 넘어요' })

  const key = `${PREFIX}/${kstDate()}/${crypto.randomUUID()}.${ext}`
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  })
  const url = await getSignedUrl(s3, command, { expiresIn: PUT_EXPIRES })
  return json(event, 200, {
    url,
    key,
    headers: { 'Content-Type': contentType },
  })
}

async function listAll(bucket) {
  const items = []
  let token
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${PREFIX}/`,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    )
    for (const obj of res.Contents || []) {
      if (!obj.Key || obj.Key.endsWith('/')) continue
      items.push(obj)
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token && items.length < LIST_CAP)

  items.sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))
  return items
}

async function handleList(event) {
  const bucket = process.env.BUCKET_NAME
  if (!bucket) return json(event, 500, { error: 'BUCKET_NAME 없음' })

  const q = queryOf(event)
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 60))
  const offset = decodeCursor(q.cursor)
  const all = await listAll(bucket)
  const slice = all.slice(offset, offset + limit)
  const items = await Promise.all(
    slice.map(async (obj) => {
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket, Key: obj.Key }),
        { expiresIn: GET_EXPIRES },
      )
      return {
        key: obj.Key,
        url,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : null,
      }
    }),
  )
  const nextOffset = offset + slice.length
  return json(event, 200, {
    items,
    nextToken: nextOffset < all.length ? encodeCursor(nextOffset) : null,
  })
}

export async function handler(event) {
  const method = methodOf(event)
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event.headers?.origin || event.headers?.Origin), body: '' }
  }

  const path = pathOf(event)
  try {
    if (method === 'POST' && path.endsWith('/presign')) return await handlePresign(event)
    if (method === 'GET' && path.endsWith('/list')) return await handleList(event)
    return json(event, 404, { error: '없는 경로' })
  } catch (err) {
    console.error(err)
    return json(event, 500, { error: '서버 오류' })
  }
}
