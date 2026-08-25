import type Stripe from 'stripe'

export const PAID_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
])

export function hasPaidAccess(status: Stripe.Subscription.Status): boolean {
  return PAID_SUBSCRIPTION_STATUSES.has(status)
}

export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false

  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}
