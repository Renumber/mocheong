import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

const schema = a.schema({
  Rsvp: a
    .model({
      name: a.string().required(),
      side: a.enum(['groom', 'bride']),
      attending: a.boolean().required(),
      guestCount: a.integer().required(),
    })
    .authorization((allow) => [
      allow.guest().to(['create']),
      allow.authenticated().to(['read', 'delete']),
    ]),

  Guestbook: a
    .model({
      name: a.string().required(),
      message: a.string().required(),
    })
    .authorization((allow) => [
      allow.guest().to(['create', 'read']),
      allow.authenticated().to(['read', 'delete']),
    ]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
})
