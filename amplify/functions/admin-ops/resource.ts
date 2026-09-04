import { defineFunction, secret } from '@aws-amplify/backend'

export const adminOps = defineFunction({
  name: 'admin-ops',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    ADMIN_PASSWORD: secret('ADMIN_PASSWORD'),
  },
})
