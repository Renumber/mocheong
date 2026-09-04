import { defineAuth } from '@aws-amplify/backend'

/**
 * Identity Pool만 쓴다. 게스트가 로그인 없이 참석/방명록/스냅을 남기기 위함.
 * 관리자 Cognito 계정은 만들지 않는다.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
})
