import { ConvexError, v } from 'convex/values'

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { storedMessage } from './validators'

const STALE_RESERVATION_MS = 15 * 60 * 1_000

async function authenticatedUserId(ctx: {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>
  }
}): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError({ code: 'UNAUTHENTICATED' })
  return identity.subject
}

export const getSnapshot = query({
  args: { threadKey: v.string() },
  handler: async (ctx, { threadKey }) => {
    const userId = await authenticatedUserId(ctx)
    const [thread, wallet] = await Promise.all([
      ctx.db
        .query('threads')
        .withIndex('by_user_key', (q) =>
          q.eq('userId', userId).eq('threadKey', threadKey),
        )
        .unique(),
      ctx.db
        .query('wallets')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .unique(),
    ])

    return {
      messages: thread?.messages ?? [],
      balanceMicros: wallet?.balanceMicros ?? 0,
      reservedMicros: wallet?.reservedMicros ?? 0,
      hasWallet: wallet !== null,
    }
  },
})

export const clearThread = mutation({
  args: { threadKey: v.string() },
  handler: async (ctx, { threadKey }) => {
    const userId = await authenticatedUserId(ctx)
    const thread = await ctx.db
      .query('threads')
      .withIndex('by_user_key', (q) =>
        q.eq('userId', userId).eq('threadKey', threadKey),
      )
      .unique()
    if (thread) await ctx.db.delete(thread._id)
  },
})

export const loadThread = internalQuery({
  args: { userId: v.string(), threadKey: v.string() },
  handler: async (ctx, { userId, threadKey }) => {
    const thread = await ctx.db
      .query('threads')
      .withIndex('by_user_key', (q) =>
        q.eq('userId', userId).eq('threadKey', threadKey),
      )
      .unique()
    return thread?.messages ?? []
  },
})

export const reserveUsage = internalMutation({
  args: {
    userId: v.string(),
    requestId: v.string(),
    reserveMicros: v.number(),
  },
  handler: async (ctx, { userId, requestId, reserveMicros }) => {
    const existing = await ctx.db
      .query('usageReservations')
      .withIndex('by_request', (q) => q.eq('requestId', requestId))
      .unique()
    if (existing) return 'existing'

    const wallet = await ctx.db
      .query('wallets')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    if (!wallet) throw new ConvexError({ code: 'INSUFFICIENT_CREDITS' })

    const now = Date.now()
    const staleReservations = await ctx.db
      .query('usageReservations')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', userId).eq('status', 'pending'),
      )
      .collect()

    let releasedMicros = 0
    for (const reservation of staleReservations) {
      if (reservation.createdAt > now - STALE_RESERVATION_MS) continue
      releasedMicros += reservation.reservedMicros
      await ctx.db.patch(reservation._id, {
        status: 'released',
        settledAt: now,
      })
    }

    const reservedMicros = Math.max(0, wallet.reservedMicros - releasedMicros)
    if (wallet.balanceMicros - reservedMicros < reserveMicros) {
      if (releasedMicros > 0) {
        await ctx.db.patch(wallet._id, { reservedMicros, updatedAt: now })
      }
      throw new ConvexError({ code: 'INSUFFICIENT_CREDITS' })
    }

    await ctx.db.patch(wallet._id, {
      reservedMicros: reservedMicros + reserveMicros,
      updatedAt: now,
    })
    await ctx.db.insert('usageReservations', {
      userId,
      requestId,
      reservedMicros: reserveMicros,
      status: 'pending',
      createdAt: now,
    })
    return 'pending'
  },
})

export const settleUsage = internalMutation({
  args: {
    userId: v.string(),
    requestId: v.string(),
    actualMicros: v.number(),
    threadKey: v.string(),
    messages: v.array(storedMessage),
    model: v.string(),
    pricingVersion: v.string(),
    promptTokens: v.number(),
    cachedInputTokens: v.number(),
    completionTokens: v.number(),
    webSearchCalls: v.number(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db
      .query('usageReservations')
      .withIndex('by_request', (q) => q.eq('requestId', args.requestId))
      .unique()
    if (!reservation || reservation.status !== 'pending') return
    if (reservation.userId !== args.userId) {
      throw new ConvexError({ code: 'RESERVATION_OWNER_MISMATCH' })
    }

    const wallet = await ctx.db
      .query('wallets')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    if (!wallet) throw new ConvexError({ code: 'WALLET_NOT_FOUND' })

    const now = Date.now()
    const actualMicros = Math.max(0, Math.floor(args.actualMicros))
    await ctx.db.patch(wallet._id, {
      balanceMicros: wallet.balanceMicros - actualMicros,
      reservedMicros: Math.max(
        0,
        wallet.reservedMicros - reservation.reservedMicros,
      ),
      updatedAt: now,
    })
    await ctx.db.patch(reservation._id, {
      status: 'settled',
      actualMicros,
      settledAt: now,
    })

    await ctx.db.insert('ledger', {
      userId: args.userId,
      kind: 'usage',
      amountMicros: -actualMicros,
      externalId: `openai:${args.requestId}`,
      model: args.model,
      pricingVersion: args.pricingVersion,
      promptTokens: args.promptTokens,
      cachedInputTokens: args.cachedInputTokens,
      completionTokens: args.completionTokens,
      webSearchCalls: args.webSearchCalls,
      createdAt: now,
    })

    const thread = await ctx.db
      .query('threads')
      .withIndex('by_user_key', (q) =>
        q.eq('userId', args.userId).eq('threadKey', args.threadKey),
      )
      .unique()
    if (thread) {
      await ctx.db.patch(thread._id, {
        messages: args.messages,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('threads', {
        userId: args.userId,
        threadKey: args.threadKey,
        messages: args.messages,
        updatedAt: now,
      })
    }
  },
})

export const releaseUsage = internalMutation({
  args: { userId: v.string(), requestId: v.string() },
  handler: async (ctx, { userId, requestId }) => {
    const reservation = await ctx.db
      .query('usageReservations')
      .withIndex('by_request', (q) => q.eq('requestId', requestId))
      .unique()
    if (
      !reservation ||
      reservation.status !== 'pending' ||
      reservation.userId !== userId
    ) {
      return
    }

    const wallet = await ctx.db
      .query('wallets')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    const now = Date.now()
    if (wallet) {
      await ctx.db.patch(wallet._id, {
        reservedMicros: Math.max(
          0,
          wallet.reservedMicros - reservation.reservedMicros,
        ),
        updatedAt: now,
      })
    }
    await ctx.db.patch(reservation._id, {
      status: 'released',
      settledAt: now,
    })
  },
})

export const grantInvoiceCredit = internalMutation({
  args: {
    userId: v.string(),
    creditMicros: v.number(),
    stripeInvoiceId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.string(),
    cancelAtPeriodEnd: v.boolean(),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const externalId = `stripe:invoice:${args.stripeInvoiceId}`
    const existing = await ctx.db
      .query('ledger')
      .withIndex('by_external', (q) => q.eq('externalId', externalId))
      .unique()
    if (existing) return false

    const now = Date.now()
    const wallet = await ctx.db
      .query('wallets')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    if (wallet) {
      await ctx.db.patch(wallet._id, {
        balanceMicros: wallet.balanceMicros + args.creditMicros,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('wallets', {
        userId: args.userId,
        balanceMicros: args.creditMicros,
        reservedMicros: 0,
        updatedAt: now,
      })
    }

    await ctx.db.insert('ledger', {
      userId: args.userId,
      kind: 'grant',
      amountMicros: args.creditMicros,
      externalId,
      stripeInvoiceId: args.stripeInvoiceId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      createdAt: now,
    })

    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscription', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId),
      )
      .unique()
    const subscriptionPatch = {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      status: args.status,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      currentPeriodEnd: args.currentPeriodEnd,
      updatedAt: now,
    }
    if (subscription) {
      await ctx.db.patch(subscription._id, subscriptionPatch)
    } else {
      await ctx.db.insert('subscriptions', subscriptionPatch)
    }
    return true
  },
})

export const updateSubscription = internalMutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.string(),
    cancelAtPeriodEnd: v.boolean(),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscription', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId),
      )
      .unique()
    const value = { ...args, updatedAt: Date.now() }
    if (existing) await ctx.db.patch(existing._id, value)
    else await ctx.db.insert('subscriptions', value)
  },
})
