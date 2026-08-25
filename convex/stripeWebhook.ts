import { calculateStripeNetCreditMicros } from '../src/lib/stripe-credit'
import { internal } from './_generated/api'
import { httpAction } from './_generated/server'
import type { ActionCtx } from './_generated/server'

const WORKOS_USER_KEY = 'workos_user_id'
const SIGNATURE_TOLERANCE_SECONDS = 300

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function booleanValue(value: unknown): boolean {
  return value === true
}

function hexBytes(value: string): Uint8Array | null {
  if (value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) return null
  const bytes = new Uint8Array(value.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index]
  }
  return difference === 0
}

async function validStripeSignature(
  body: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const fields = signatureHeader.split(',')
  const timestamp = fields.find((field) => field.startsWith('t='))?.slice(2)
  const signatures = fields
    .filter((field) => field.startsWith('v1='))
    .map((field) => field.slice(3))
  const timestampNumber = timestamp ? Number(timestamp) : Number.NaN
  if (
    !Number.isFinite(timestampNumber) ||
    Math.abs(Date.now() / 1_000 - timestampNumber) > SIGNATURE_TOLERANCE_SECONDS
  ) {
    return false
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const expected = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${timestamp}.${body}`),
    ),
  )
  return signatures.some((signature) => {
    const candidate = hexBytes(signature)
    return candidate ? sameBytes(expected, candidate) : false
  })
}

async function stripeGet(path: string, params?: URLSearchParams) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured.')
  const url = new URL(`https://api.stripe.com/v1${path}`)
  if (params) url.search = params.toString()
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  if (!response.ok) {
    throw new Error(`Stripe request failed with ${response.status}.`)
  }
  const value: unknown = await response.json()
  if (!isRecord(value)) throw new Error('Stripe returned an invalid object.')
  return value
}

async function expandedPaymentBalanceTransaction(invoiceId: string) {
  const params = new URLSearchParams({
    invoice: invoiceId,
    status: 'paid',
    limit: '10',
  })
  params.append(
    'expand[]',
    'data.payment.payment_intent.latest_charge.balance_transaction',
  )
  params.append('expand[]', 'data.payment.charge.balance_transaction')
  const response = await stripeGet('/invoice_payments', params)
  const payments = Array.isArray(response.data) ? response.data : []

  for (const value of payments) {
    if (!isRecord(value) || !isRecord(value.payment)) continue
    const paymentIntent = value.payment.payment_intent
    if (isRecord(paymentIntent) && isRecord(paymentIntent.latest_charge)) {
      const balanceTransaction = paymentIntent.latest_charge.balance_transaction
      if (isRecord(balanceTransaction)) return balanceTransaction
    }
    const charge = value.payment.charge
    if (isRecord(charge) && isRecord(charge.balance_transaction)) {
      return charge.balance_transaction
    }
  }
  throw new Error('Stripe invoice has no expanded paid balance transaction.')
}

async function stripeCustomer(customer: unknown): Promise<JsonRecord> {
  if (isRecord(customer)) return customer
  const customerId = stringValue(customer)
  if (!customerId) throw new Error('Stripe invoice has no customer.')
  return stripeGet(`/customers/${encodeURIComponent(customerId)}`)
}

async function stripeSubscription(subscription: unknown): Promise<JsonRecord> {
  if (isRecord(subscription)) return subscription
  const subscriptionId = stringValue(subscription)
  if (!subscriptionId) throw new Error('Stripe invoice has no subscription.')
  return stripeGet(`/subscriptions/${encodeURIComponent(subscriptionId)}`)
}

function workosUserId(...objects: Array<JsonRecord>): string | null {
  for (const object of objects) {
    if (!isRecord(object.metadata)) continue
    const userId = stringValue(object.metadata[WORKOS_USER_KEY])
    if (userId) return userId
  }
  return null
}

function subscriptionFromInvoice(invoice: JsonRecord): unknown {
  if (!isRecord(invoice.parent)) return null
  if (!isRecord(invoice.parent.subscription_details)) return null
  return invoice.parent.subscription_details.subscription
}

function currentPeriodEnd(subscription: JsonRecord, invoice?: JsonRecord) {
  const direct = numberValue(subscription.current_period_end)
  if (direct) return direct
  const invoicePeriodEnd = invoice ? numberValue(invoice.period_end) : null
  return invoicePeriodEnd ?? undefined
}

async function handleInvoicePaid(
  ctx: ActionCtx,
  invoice: JsonRecord,
  expectedUserId?: string,
) {
  const invoiceId = stringValue(invoice.id)
  const amountPaid = numberValue(invoice.amount_paid)
  const currency = stringValue(invoice.currency)
  if (!invoiceId || !amountPaid || currency !== 'usd') {
    throw new Error('Only paid USD subscription invoices can grant credits.')
  }

  const [customer, subscription, balanceTransaction] = await Promise.all([
    stripeCustomer(invoice.customer),
    stripeSubscription(subscriptionFromInvoice(invoice)),
    expandedPaymentBalanceTransaction(invoiceId),
  ])
  const userId = workosUserId(subscription, customer)
  const customerId = stringValue(customer.id)
  const subscriptionId = stringValue(subscription.id)
  const settlementNetMinor = numberValue(balanceTransaction.net)
  const settlementCurrency = stringValue(balanceTransaction.currency)
  const exchangeRate = numberValue(balanceTransaction.exchange_rate)
  if (
    !userId ||
    !customerId ||
    !subscriptionId ||
    !settlementNetMinor ||
    !settlementCurrency
  ) {
    throw new Error('Stripe invoice metadata is incomplete.')
  }
  if (expectedUserId && userId !== expectedUserId) {
    throw new Error('Stripe invoice belongs to another user.')
  }

  const creditMicros = calculateStripeNetCreditMicros({
    invoiceAmountUsdMinor: amountPaid,
    settlementNetMinor,
    settlementCurrency,
    exchangeRate,
  })
  await ctx.runMutation(internal.backend.grantInvoiceCredit, {
    userId,
    creditMicros,
    stripeInvoiceId: invoiceId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    status: stringValue(subscription.status) ?? 'active',
    cancelAtPeriodEnd: booleanValue(subscription.cancel_at_period_end),
    currentPeriodEnd: currentPeriodEnd(subscription, invoice),
  })
}

async function latestPaidInvoice(userId: string): Promise<JsonRecord | null> {
  const customerSearch = await stripeGet(
    '/customers/search',
    new URLSearchParams({
      query: `metadata['${WORKOS_USER_KEY}']:'${userId}'`,
      limit: '1',
    }),
  )
  const customers = Array.isArray(customerSearch.data)
    ? customerSearch.data
    : []
  const customer = customers.find(isRecord)
  const customerId = customer ? stringValue(customer.id) : null
  if (!customerId) return null

  const response = await stripeGet(
    '/invoices',
    new URLSearchParams({
      customer: customerId,
      status: 'paid',
      limit: '10',
    }),
  )
  const invoices = Array.isArray(response.data) ? response.data : []
  return (
    invoices.find(
      (invoice): invoice is JsonRecord =>
        isRecord(invoice) &&
        numberValue(invoice.amount_paid) !== null &&
        subscriptionFromInvoice(invoice) !== null,
    ) ?? null
  )
}

async function handleSubscriptionChanged(
  ctx: ActionCtx,
  subscription: JsonRecord,
) {
  const customer = await stripeCustomer(subscription.customer)
  const userId = workosUserId(subscription, customer)
  const customerId = stringValue(customer.id)
  const subscriptionId = stringValue(subscription.id)
  if (!userId || !customerId || !subscriptionId) return

  await ctx.runMutation(internal.backend.updateSubscription, {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    status: stringValue(subscription.status) ?? 'unknown',
    cancelAtPeriodEnd: booleanValue(subscription.cancel_at_period_end),
    currentPeriodEnd: currentPeriodEnd(subscription),
  })
}

export const handleStripeWebhook = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')
  const body = await request.text()
  if (
    !webhookSecret ||
    !signature ||
    !(await validStripeSignature(body, signature, webhookSecret))
  ) {
    return new Response('Invalid Stripe signature.', { status: 400 })
  }

  const event: unknown = JSON.parse(body)
  if (!isRecord(event) || !isRecord(event.data)) {
    return new Response('Invalid Stripe event.', { status: 400 })
  }
  const object = event.data.object
  if (!isRecord(object)) {
    return new Response('Invalid Stripe event object.', { status: 400 })
  }

  if (event.type === 'invoice.paid') {
    await handleInvoicePaid(ctx, object)
  } else if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    await handleSubscriptionChanged(ctx, object)
  }

  return Response.json({ received: true })
})

export const handleStripeSync = httpAction(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    return Response.json({ error: 'Sign in to sync billing.' }, { status: 401 })
  }

  const invoice = await latestPaidInvoice(identity.subject)
  if (!invoice) return Response.json({ synced: false })

  await handleInvoicePaid(ctx, invoice, identity.subject)
  return Response.json({ synced: true })
})
