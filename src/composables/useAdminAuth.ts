import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth'
import { isAmplifyConfigured } from '../amplify'

const adminEmail = ((import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '').trim()

export async function currentAdmin() {
  if (!isAmplifyConfigured()) return null
  try {
    return await getCurrentUser()
  } catch {
    return null
  }
}

function loginErrorMessage(err: unknown) {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
  if (
    name === 'NotAuthorizedException' ||
    name === 'UserNotFoundException' ||
    name === 'EmptySignInUsername'
  ) {
    return '비밀번호가 올바르지 않습니다'
  }
  if (err instanceof Error && err.message) return err.message
  return '들어가지 못했습니다'
}

export async function loginAdmin(password: string) {
  if (!isAmplifyConfigured()) throw new Error('백엔드가 아직 연결되지 않았습니다')
  if (!adminEmail) throw new Error('관리자 설정을 확인하세요')
  if (!password) throw new Error('비밀번호를 입력하세요')

  try {
    await signOut()
  } catch {
    // 기존 세션이 없으면 무시
  }

  try {
    const result = await signIn({ username: adminEmail, password })
    if (result.nextStep.signInStep !== 'DONE') {
      throw new Error('비밀번호가 올바르지 않습니다')
    }
  } catch (err) {
    throw new Error(loginErrorMessage(err))
  }
}

export async function logoutAdmin() {
  try {
    await signOut()
  } catch {
    // 이미 로그아웃된 경우
  }
}

