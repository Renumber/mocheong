import { defineStorage } from '@aws-amplify/backend'

/**
 * 게스트는 업로드만. 목록/다운로드는 로그인한 관리자만.
 */
export const storage = defineStorage({
  name: 'mocheongSnaps',
  access: (allow) => ({
    'snaps/*': [
      allow.guest.to(['write']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
})
