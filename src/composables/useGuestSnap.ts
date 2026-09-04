import { uploadData } from 'aws-amplify/storage'
import { adminPassword } from './useAdminAuth'
import { ensureGuestSession, isAmplifyConfigured } from '../amplify'
import { dataClient } from './useDataClient'

export type SnapItem = {
  path: string
  size?: number
  lastModified?: Date
}

function fileNameOf(path: string) {
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

function firstError(errors: { message?: string }[] | undefined, fallback: string) {
  const message = errors?.[0]?.message || fallback
  if (/unauthor/i.test(message)) return '비밀번호가 올바르지 않습니다'
  return message
}

export async function uploadSnap(blob: Blob) {
  if (!isAmplifyConfigured()) throw new Error('지금은 사진을 받을 수 없습니다')
  await ensureGuestSession()
  const id = crypto.randomUUID()
  const path = `snaps/${Date.now()}_${id}.jpg`
  await uploadData({
    path,
    data: blob,
    options: { contentType: 'image/jpeg' },
  }).result
}

export async function listSnaps(): Promise<SnapItem[]> {
  const client = dataClient()
  if (!client) throw new Error('관리자 기능을 사용할 수 없습니다')
  const password = adminPassword()
  if (!password) throw new Error('비밀번호가 올바르지 않습니다')

  await ensureGuestSession()
  const { data, errors } = await client.queries.adminListSnaps({ password })
  if (errors?.length) throw new Error(firstError(errors, '사진을 불러오지 못했습니다'))

  return (data ?? [])
    .filter((item): item is NonNullable<typeof item> => Boolean(item?.path))
    .map((item) => ({
      path: item.path,
      size: item.size ?? undefined,
      lastModified: item.lastModified ? new Date(item.lastModified) : undefined,
    }))
}

export async function downloadSnap(path: string) {
  const client = dataClient()
  if (!client) throw new Error('관리자 기능을 사용할 수 없습니다')
  const password = adminPassword()
  if (!password) throw new Error('비밀번호가 올바르지 않습니다')

  await ensureGuestSession()
  const { data, errors } = await client.queries.adminGetSnapUrl({ password, path })
  if (errors?.length || !data) throw new Error(firstError(errors, '내려받지 못했습니다'))

  const response = await fetch(data)
  if (!response.ok) throw new Error('내려받지 못했습니다')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileNameOf(path)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadAllSnaps(items: SnapItem[]) {
  for (const item of items) {
    await downloadSnap(item.path)
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
}
