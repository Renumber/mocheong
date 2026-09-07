const MAX_BYTES = 15 * 1024 * 1024
const LIST_LIMIT = 60

function apiBase(): string {
  return (import.meta.env.VITE_GUEST_SNAP_API_URL as string | undefined)?.replace(/\/+$/, '') ?? ''
}

export function isGuestSnapConfigured(): boolean {
  return Boolean(apiBase())
}

export function guestSnapMaxBytes(): number {
  return MAX_BYTES
}

export type GuestSnapItem = {
  key: string
  url: string
  lastModified: string | null
}

export type PresignResponse = {
  url: string
  key: string
  headers: Record<string, string>
}

export type ListResponse = {
  items: GuestSnapItem[]
  nextToken: string | null
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    if (data.error) return data.error
  } catch {
    // ignore non-JSON
  }
  return `요청 실패 (${res.status})`
}

export async function presignUpload(
  contentType: string,
  contentLength: number,
): Promise<PresignResponse> {
  const res = await fetch(`${apiBase()}/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType, contentLength }),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json() as Promise<PresignResponse>
}

export async function listGuestSnaps(cursor?: string | null): Promise<ListResponse> {
  const url = new URL(`${apiBase()}/list`)
  url.searchParams.set('limit', String(LIST_LIMIT))
  if (cursor) url.searchParams.set('cursor', cursor)
  const res = await fetch(url)
  if (!res.ok) throw new Error(await readError(res))
  return res.json() as Promise<ListResponse>
}

export function putWithProgress(
  url: string,
  blob: Blob,
  headers: Record<string, string>,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        resolve()
        return
      }
      reject(new Error(`업로드 실패 (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('네트워크 오류'))
    xhr.send(blob)
  })
}
