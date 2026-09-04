import { defineAuth } from '@aws-amplify/backend'

/**
 * 관리자(신랑·신부)는 이메일 로그인.
 * 게스트 쓰기(참석/방명록/스냅)는 Identity Pool 비로그인 역할(allow.guest)을 쓴다.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
})
