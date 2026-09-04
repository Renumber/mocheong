import { defineAuth } from '@aws-amplify/backend'

/**
 * 관리자 화면은 비밀번호만 받는다. Cognito 이메일은 VITE_ADMIN_EMAIL에 두고 숨긴다.
 * 게스트 쓰기(참석/방명록/스냅)는 Identity Pool 비로그인 역할(allow.guest)을 쓴다.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
})
