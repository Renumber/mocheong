import { downloadData, list, uploadData } from 'aws-amplify/storage'
import { ensureGuestSession, isAmplifyConfigured } from '../amplify'

export type SnapItem = {
  path: string
  size?: number
  lastModified?: Date
}

function fileNameOf(path: string) {
  const parts = path.split('/')
  return parts[parts.length - 1] || path
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
  if (!isAmplifyConfigured()) throw new Error('관리자 기능을 사용할 수 없습니다')
  const result = await list({
    path: 'snaps/',
    options: { listAll: true },
  })
  return (result.items ?? [])
    .filter((item) => Boolean(item.path) && !item.path.endsWith('/'))
    .map((item) => ({
      path: item.path,
      size: item.size,
      lastModified: item.lastModified,
    }))
    .sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0))
}

export async function downloadSnap(path: string) {
  if (!isAmplifyConfigured()) throw new Error('관리자 기능을 사용할 수 없습니다')
  const { body } = await downloadData({ path }).result
  const blob = await body.blob()
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
