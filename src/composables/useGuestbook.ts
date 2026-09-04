import { adminPassword } from './useAdminAuth'
import { ensureGuestSession } from '../amplify'
import { dataClient } from './useDataClient'

export type GuestbookEntry = {
  id: string
  name: string
  message: string
  createdAt?: string | null
}

function firstError(errors: { message?: string }[] | undefined, fallback: string) {
  const message = errors?.[0]?.message || fallback
  if (/unauthor/i.test(message)) return '비밀번호가 올바르지 않습니다'
  return message
}

export async function listGuestbook(): Promise<GuestbookEntry[]> {
  const client = dataClient()
  if (!client) return []

  await ensureGuestSession()
  const items: GuestbookEntry[] = []
  let nextToken: string | null | undefined
  do {
    const result = await client.models.Guestbook.list({
      limit: 200,
      nextToken,
    })
    if (result.errors?.length) {
      throw new Error(firstError(result.errors, '방명록을 불러오지 못했습니다'))
    }
    for (const row of result.data ?? []) {
      if (!row?.id || !row.name || !row.message) continue
      items.push({
        id: row.id,
        name: row.name,
        message: row.message,
        createdAt: row.createdAt,
      })
    }
    nextToken = result.nextToken
  } while (nextToken)

  return items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}

export async function createGuestbook(name: string, message: string) {
  const client = dataClient()
  if (!client) throw new Error('지금은 방명록을 받을 수 없습니다')
  await ensureGuestSession()
  const { errors } = await client.models.Guestbook.create({ name, message })
  if (errors?.length) throw new Error(firstError(errors, '방명록을 저장하지 못했습니다'))
}

export async function deleteGuestbook(id: string) {
  const client = dataClient()
  if (!client) throw new Error('관리자 기능을 사용할 수 없습니다')
  const password = adminPassword()
  if (!password) throw new Error('비밀번호가 올바르지 않습니다')

  await ensureGuestSession()
  const { errors } = await client.mutations.adminDeleteGuestbook({ password, id })
  if (errors?.length) throw new Error(firstError(errors, '삭제하지 못했습니다'))
}
