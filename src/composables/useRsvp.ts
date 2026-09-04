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
  return errors?.[0]?.message || fallback
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

  const items: RsvpRecord[] = []
  let nextToken: string | null | undefined
  do {
    const result = await client.models.Rsvp.list({
      authMode: 'userPool',
      limit: 200,
      nextToken,
    })
    if (result.errors?.length) {
      throw new Error(firstError(result.errors, '참석 목록을 불러오지 못했습니다'))
    }
    for (const row of result.data ?? []) {
      if (!row?.id || !row.name || row.attending == null || row.guestCount == null) continue
      items.push({
        id: row.id,
        name: row.name,
        side: row.side === 'bride' ? 'bride' : 'groom',
        attending: row.attending,
        guestCount: row.guestCount,
        createdAt: row.createdAt,
      })
    }
    nextToken = result.nextToken
  } while (nextToken)

  return items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}

export async function deleteRsvp(id: string) {
  const client = dataClient()
  if (!client) throw new Error('관리자 기능을 사용할 수 없습니다')
  const { errors } = await client.models.Rsvp.delete({ id }, { authMode: 'userPool' })
  if (errors?.length) throw new Error(firstError(errors, '삭제하지 못했습니다'))
}
