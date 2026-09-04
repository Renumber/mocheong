import { ensureGuestSession, isAmplifyConfigured } from '../amplify'
import { dataClient } from './useDataClient'

const STORAGE_KEY = 'mocheong-admin-password'

export function adminPassword() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function isAdminUnlocked() {
  return Boolean(adminPassword())
}

export async function loginAdmin(password: string) {
  if (!isAmplifyConfigured()) throw new Error('백엔드가 아직 연결되지 않았습니다')
  if (!password) throw new Error('비밀번호를 입력하세요')

  const client = dataClient()
  if (!client) throw new Error('백엔드가 아직 연결되지 않았습니다')

  await ensureGuestSession()
  const { data, errors } = await client.queries.adminUnlock({ password })
  if (errors?.length || !data) throw new Error('비밀번호가 올바르지 않습니다')
  sessionStorage.setItem(STORAGE_KEY, password)
}

export function logoutAdmin() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
