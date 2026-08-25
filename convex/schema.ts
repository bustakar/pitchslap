import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

import { storedMessage } from './validators'

export default defineSchema({
  threads: defineTable({
    userId: v.string(),
    threadKey: v.string(),
    messages: v.array(storedMessage),
    updatedAt: v.number(),
  }).index('by_user_key', ['userId', 'threadKey']),

  wallets: defineTable({
    userId: v.string(),
    balanceMicros: v.number(),
    reservedMicros: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  usageReservations: defineTable({
    userId: v.string(),
    requestId: v.string(),
    reservedMicros: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('settled'),
      v.literal('released'),
    ),
    actualMicros: v.optional(v.number()),
    createdAt: v.number(),
    settledAt: v.optional(v.number()),
  })
    .index('by_request', ['requestId'])
    .index('by_user_status', ['userId', 'status']),

  ledger: defineTable({
    userId: v.string(),
    kind: v.union(v.literal('grant'), v.literal('usage')),
    amountMicros: v.number(),
    externalId: v.string(),
    model: v.optional(v.string()),
    pricingVersion: v.optional(v.string()),
    promptTokens: v.optional(v.number()),
    cachedInputTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    webSearchCalls: v.optional(v.number()),
    stripeInvoiceId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_external', ['externalId'])
    .index('by_user', ['userId']),

  subscriptions: defineTable({
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.string(),
    cancelAtPeriodEnd: v.boolean(),
    currentPeriodEnd: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_customer', ['stripeCustomerId'])
    .index('by_subscription', ['stripeSubscriptionId']),
})
