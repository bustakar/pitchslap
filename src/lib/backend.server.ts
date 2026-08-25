import { ConvexHttpClient } from 'convex/browser'

import { api } from '../../convex/_generated/api'

const THREAD_KEY = 'case-file'

function siteUrl(): string {
  const value = process.env.CONVEX_SITE_URL ?? process.env.VITE_CONVEX_SITE_URL
  if (!value) throw new Error('CONVEX_SITE_URL is not configured.')
  return value
}

function convexUrl(): string {
  const value = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL
  if (!value) throw new Error('CONVEX_URL is not configured.')
  return value
}

function client(accessToken: string): ConvexHttpClient {
  const convex = new ConvexHttpClient(convexUrl())
  convex.setAuth(accessToken)
  return convex
}

export async function getBackendSnapshot(accessToken: string) {
  return client(accessToken).query(api.backend.getSnapshot, {
    threadKey: THREAD_KEY,
  })
}

export async function clearBackendThread(accessToken: string): Promise<void> {
  await client(accessToken).mutation(api.backend.clearThread, {
    threadKey: THREAD_KEY,
  })
}

export async function syncStripeCredit(accessToken: string): Promise<void> {
  const response = await fetch(`${siteUrl()}/stripe/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error(`Convex billing sync failed with ${response.status}.`)
  }
}
