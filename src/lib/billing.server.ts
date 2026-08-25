import { WorkOS } from '@workos-inc/node'
import Stripe from 'stripe'

import { hasPaidAccess } from './billing'

const STRIPE_CUSTOMER_KEY = 'stripe_customer_id'
const WORKOS_USER_KEY = 'workos_user_id'
const POSTHOG_PERSON_KEY = 'posthog_person_distinct_id'

export type BillingUser = {
  id: string
  email: string
  name?: string | null
}

export type BillingAccess =
  | { state: 'unconfigured' }
  | { state: 'unpaid'; customerId: string | null }
  | {
      state: 'paid'
      customerId: string
      status: Stripe.Subscription.Status
      cancelAtPeriodEnd: boolean
    }

let stripeClient: Stripe | undefined
let workosClient: WorkOS | undefined

function requireEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

function getStripe(): Stripe {
  return (stripeClient ??= new Stripe(requireEnvironment('STRIPE_SECRET_KEY')))
}

function getWorkOS(): WorkOS {
  return (workosClient ??= new WorkOS(requireEnvironment('WORKOS_API_KEY')))
}

function getPriceId(): string {
  return requireEnvironment('STRIPE_PRICE_ID')
}

export function billingIsConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_ID &&
    process.env.WORKOS_API_KEY,
  )
}

function validateWorkOSUserId(userId: string): void {
  if (!/^user_[A-Za-z0-9]+$/.test(userId)) {
    throw new Error('Unexpected WorkOS user ID.')
  }
}

async function syncCustomerId(
  userId: string,
  metadata: Record<string, string>,
  customerId: string,
): Promise<void> {
  await getWorkOS().userManagement.updateUser({
    userId,
    metadata: { ...metadata, [STRIPE_CUSTOMER_KEY]: customerId },
  })
}

async function validStoredCustomer(
  customerId: string,
  userId: string,
): Promise<string | null> {
  const customer = await getStripe().customers.retrieve(customerId)
  if (customer.deleted) return null
  return customer.metadata[WORKOS_USER_KEY] === userId ? customer.id : null
}

async function findMappedCustomer(user: BillingUser): Promise<{
  customerId: string | null
  metadata: Record<string, string>
}> {
  validateWorkOSUserId(user.id)
  const workosUser = await getWorkOS().userManagement.getUser(user.id)
  const storedCustomerId = workosUser.metadata[STRIPE_CUSTOMER_KEY]

  if (storedCustomerId) {
    const customerId = await validStoredCustomer(storedCustomerId, user.id)
    if (customerId) return { customerId, metadata: workosUser.metadata }
  }

  const matches = await getStripe().customers.search({
    query: `metadata['${WORKOS_USER_KEY}']:'${user.id}'`,
    limit: 1,
  })
  const customer = matches.data.at(0)

  if (!customer) return { customerId: null, metadata: workosUser.metadata }

  await syncCustomerId(user.id, workosUser.metadata, customer.id)
  return { customerId: customer.id, metadata: workosUser.metadata }
}

async function getOrCreateCustomer(user: BillingUser): Promise<string> {
  const mapped = await findMappedCustomer(user)
  if (mapped.customerId) return mapped.customerId

  const customer = await getStripe().customers.create(
    {
      email: user.email,
      name: user.name ?? undefined,
      metadata: {
        [WORKOS_USER_KEY]: user.id,
        [POSTHOG_PERSON_KEY]: user.id,
      },
    },
    { idempotencyKey: `pitchslap-customer-${user.id}` },
  )
  await syncCustomerId(user.id, mapped.metadata, customer.id)
  return customer.id
}

async function findPaidSubscription(
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const subscriptions = await getStripe().subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  })
  const priceId = getPriceId()

  return (
    subscriptions.data.find(
      (subscription) =>
        hasPaidAccess(subscription.status) &&
        subscription.items.data.some((item) => item.price.id === priceId),
    ) ?? null
  )
}

export async function getBillingAccess(
  user: BillingUser,
): Promise<BillingAccess> {
  if (!billingIsConfigured()) return { state: 'unconfigured' }

  const { customerId } = await findMappedCustomer(user)
  if (!customerId) return { state: 'unpaid', customerId: null }

  const subscription = await findPaidSubscription(customerId)
  if (!subscription) return { state: 'unpaid', customerId }

  return {
    state: 'paid',
    customerId,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  }
}

export async function createCheckoutUrl(
  user: BillingUser,
  origin: string,
): Promise<string> {
  const stripe = getStripe()
  const customerId = await getOrCreateCustomer(user)
  const existingSubscription = await findPaidSubscription(customerId)
  if (existingSubscription) return `${origin}/chat?checkout=already-paid`

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: getPriceId(), quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/chat?checkout=success`,
    cancel_url: `${origin}/chat?checkout=cancelled`,
    metadata: {
      [WORKOS_USER_KEY]: user.id,
      [POSTHOG_PERSON_KEY]: user.id,
    },
    subscription_data: {
      metadata: {
        [WORKOS_USER_KEY]: user.id,
        [POSTHOG_PERSON_KEY]: user.id,
      },
    },
  })

  if (!session.url) throw new Error('Stripe did not return a Checkout URL.')
  return session.url
}

export async function createPortalUrl(
  user: BillingUser,
  origin: string,
): Promise<string | null> {
  const { customerId } = await findMappedCustomer(user)
  if (!customerId) return null

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/chat`,
  })
  return session.url
}

export function requestOrigin(request: Request): string {
  const configured = process.env.PUBLIC_APP_URL
  return configured ? new URL(configured).origin : new URL(request.url).origin
}
