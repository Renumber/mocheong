import { adminPassword } from './useAdminAuth'
import { ensureGuestSession } from '../amplify'
import { dataClient } from './useDataClient'

export type RsvpSide = 'groom' | 'bride'

export type RsvpInput = {
  name: string
  side: RsvpSide
  attending: boolean
  guestCount: number
}

export type RsvpRecord = RsvpInput & {
  id: string
  createdAt?: string | null
}

function firstError(errors: { message?: string }[] | undefined, fallback: string) {
  const message = errors?.[0]?.message || fallback
  if (/unauthor/i.test(message)) return '비밀번호가 올바르지 않습니다'
  return message
}

export async function createRsvp(input: RsvpInput) {
  const client = dataClient()
  if (!client) throw new Error('지금은 참석 여부를 받을 수 없습니다')
  await ensureGuestSession()
  const { errors } = await client.models.Rsvp.create(input)
  if (errors?.length) throw new Error(firstError(errors, '참석 여부를 저장하지 못했습니다'))
}

export async function listRsvps(): Promise<RsvpRecord[]> {
  const client = dataClient()
  if (!client) throw new Error('관리자 기능을 사용할 수 없습니다')
  const password = adminPassword()
  if (!password) throw new Error('비밀번호가 올바르지 않습니다')

  await ensureGuestSession()
  const { data, errors } = await client.queries.adminListRsvps({ password })
  if (errors?.length) throw new Error(firstError(errors, '참석 목록을 불러오지 못했습니다'))

  return (data ?? [])
    .filter((row): row is NonNullable<typeof row> => Boolean(row?.id && row.name && row.attending != null && row.guestCount != null))
    .map((row) => ({
      id: row.id,
      name: row.name,
      side: row.side === 'bride' ? 'bride' : 'groom',
      attending: row.attending,
      guestCount: row.guestCount,
      createdAt: row.createdAt,
    }))
}

export async function deleteRsvp(id: string) {
  const client = dataClient()
  if (!client) throw new Error('관리자 기능을 사용할 수 없습니다')
  const password = adminPassword()
  if (!password) throw new Error('비밀번호가 올바르지 않습니다')

  await ensureGuestSession()
  const { errors } = await client.mutations.adminDeleteRsvp({ password, id })
  if (errors?.length) throw new Error(firstError(errors, '삭제하지 못했습니다'))
}
