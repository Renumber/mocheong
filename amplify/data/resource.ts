import { type ClientSchema, a, defineData } from '@aws-amplify/backend'
import { adminOps } from '../functions/admin-ops/resource'

const schema = a.schema({
  Rsvp: a
    .model({
      name: a.string().required(),
      side: a.enum(['groom', 'bride']),
      attending: a.boolean().required(),
      guestCount: a.integer().required(),
    })
    .authorization((allow) => [allow.guest().to(['create'])]),

  Guestbook: a
    .model({
      name: a.string().required(),
      message: a.string().required(),
    })
    .authorization((allow) => [allow.guest().to(['create', 'read'])]),

  AdminRsvp: a.customType({
    id: a.string().required(),
    name: a.string().required(),
    side: a.string(),
    attending: a.boolean().required(),
    guestCount: a.integer().required(),
    createdAt: a.string(),
  }),

  AdminSnap: a.customType({
    path: a.string().required(),
    size: a.integer(),
    lastModified: a.string(),
  }),

  adminUnlock: a
    .query()
    .arguments({ password: a.string().required() })
    .returns(a.boolean())
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(adminOps)),

  adminListRsvps: a
    .query()
    .arguments({ password: a.string().required() })
    .returns(a.ref('AdminRsvp').array())
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(adminOps)),

  adminDeleteRsvp: a
    .mutation()
    .arguments({ password: a.string().required(), id: a.string().required() })
    .returns(a.boolean())
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(adminOps)),

  adminDeleteGuestbook: a
    .mutation()
    .arguments({ password: a.string().required(), id: a.string().required() })
    .returns(a.boolean())
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(adminOps)),

  adminListSnaps: a
    .query()
    .arguments({ password: a.string().required() })
    .returns(a.ref('AdminSnap').array())
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(adminOps)),

  adminGetSnapUrl: a
    .query()
    .arguments({ password: a.string().required(), path: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(adminOps)),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
})
