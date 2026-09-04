import { defineStorage } from '@aws-amplify/backend'
import { adminOps } from '../functions/admin-ops/resource'

/**
 * 게스트는 업로드만. 목록/다운로드는 admin-ops 람다가 비밀번호 확인 후 처리.
 */
export const storage = defineStorage({
  name: 'mocheongSnaps',
  access: (allow) => ({
    'snaps/*': [
      allow.guest.to(['write']),
      allow.resource(adminOps).to(['read', 'delete']),
    ],
  }),
})
