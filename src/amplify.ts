import { Amplify } from 'aws-amplify'
import { fetchAuthSession } from 'aws-amplify/auth'

let configured = false

export function isAmplifyConfigured() {
  return configured
}

export function configureAmplify(outputs: Record<string, unknown>) {
  if (!outputs.auth || !outputs.data || !outputs.storage) return
  Amplify.configure(outputs)
  configured = true
}

export async function ensureGuestSession() {
  if (!configured) return
  await fetchAuthSession()
}
