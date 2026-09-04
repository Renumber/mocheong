import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { adminOps } from './functions/admin-ops/resource'

const backend = defineBackend({
  auth,
  data,
  storage,
  adminOps,
})

const lambda = backend.adminOps.resources.lambda
const rsvpTable = backend.data.resources.tables['Rsvp']
const guestbookTable = backend.data.resources.tables['Guestbook']

rsvpTable.grantReadWriteData(lambda)
guestbookTable.grantReadWriteData(lambda)
lambda.addEnvironment('RSVP_TABLE_NAME', rsvpTable.tableName)
lambda.addEnvironment('GUESTBOOK_TABLE_NAME', guestbookTable.tableName)
