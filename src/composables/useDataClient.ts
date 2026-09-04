import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { isAmplifyConfigured } from '../amplify'

export type DataClient = ReturnType<typeof generateClient<Schema>>

let client: DataClient | null = null

export function dataClient(): DataClient | null {
  if (!isAmplifyConfigured()) return null
  if (!client) client = generateClient<Schema>()
  return client
}
