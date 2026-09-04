import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth'
import { isAmplifyConfigured } from '../amplify'

export async function currentAdmin() {
  if (!isAmplifyConfigured()) return null
  try {
    return await getCurrentUser()
  } catch {
    return null
  }
}

export async function loginAdmin(email: string, password: string) {
  if (!isAmplifyConfigured()) throw new Error('백엔드가 아직 연결되지 않았습니다')
  await signIn({ username: email.trim(), password })
}

export async function logoutAdmin() {
  try {
    await signOut()
  } catch {
    // 이미 로그아웃된 경우
  }
}
