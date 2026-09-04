import { timingSafeEqual } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DeleteCommand, DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '$amplify/env/admin-ops'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const s3 = new S3Client({})

type Event = {
  arguments: {
    password?: string | null
    id?: string | null
    path?: string | null
  }
  info?: { fieldName?: string }
  fieldName?: string
}

function assertPassword(input: string | null | undefined) {
  const expected = env.ADMIN_PASSWORD ?? ''
  const given = input ?? ''
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  const ok = expected.length > 0 && a.length === b.length && timingSafeEqual(a, b)
  if (!ok) throw new Error('Unauthorized')
}

function fieldNameOf(event: Event) {
  return event.info?.fieldName || event.fieldName || ''
}

async function scanAll(tableName: string) {
  const items: Record<string, unknown>[] = []
  let key: Record<string, unknown> | undefined
  do {
    const result = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: key,
      }),
    )
    items.push(...((result.Items ?? []) as Record<string, unknown>[]))
    key = result.LastEvaluatedKey
  } while (key)
  return items
}

export const handler = async (event: Event) => {
  assertPassword(event.arguments.password)
  const field = fieldNameOf(event)
  const rsvpTable = process.env.RSVP_TABLE_NAME
  const guestbookTable = process.env.GUESTBOOK_TABLE_NAME
  const bucket = env.mocheongSnaps_BUCKET_NAME

  if (field === 'adminUnlock') return true

  if (field === 'adminListRsvps') {
    if (!rsvpTable) throw new Error('Unauthorized')
    const items = await scanAll(rsvpTable)
    return items
      .map((row) => ({
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        side: typeof row.side === 'string' ? row.side : null,
        attending: Boolean(row.attending),
        guestCount: Number(row.guestCount ?? 0),
        createdAt: typeof row.createdAt === 'string' ? row.createdAt : null,
      }))
      .filter((row) => row.id && row.name)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  }

  if (field === 'adminDeleteRsvp') {
    const id = event.arguments.id
    if (!id || !rsvpTable) throw new Error('Unauthorized')
    await ddb.send(new DeleteCommand({ TableName: rsvpTable, Key: { id } }))
    return true
  }

  if (field === 'adminDeleteGuestbook') {
    const id = event.arguments.id
    if (!id || !guestbookTable) throw new Error('Unauthorized')
    await ddb.send(new DeleteCommand({ TableName: guestbookTable, Key: { id } }))
    return true
  }

  if (field === 'adminListSnaps') {
    const items: Array<{ path: string; size: number | null; lastModified: string | null }> = []
    let token: string | undefined
    do {
      const result = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: 'snaps/',
          ContinuationToken: token,
        }),
      )
      for (const object of result.Contents ?? []) {
        if (!object.Key || object.Key.endsWith('/')) continue
        items.push({
          path: object.Key,
          size: object.Size ?? null,
          lastModified: object.LastModified?.toISOString() ?? null,
        })
      }
      token = result.IsTruncated ? result.NextContinuationToken : undefined
    } while (token)
    return items.sort((a, b) => (b.lastModified ?? '').localeCompare(a.lastModified ?? ''))
  }

  if (field === 'adminGetSnapUrl') {
    const key = event.arguments.path
    if (!key || !key.startsWith('snaps/')) throw new Error('Unauthorized')
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn: 60 },
    )
  }

  throw new Error('Unauthorized')
}
