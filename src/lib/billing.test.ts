import { describe, expect, it } from 'vitest'

import { hasPaidAccess, isSameOriginRequest } from './billing'

describe('hasPaidAccess', () => {
  it('allows paid subscriptions and a short payment-recovery grace period', () => {
    expect(hasPaidAccess('active')).toBe(true)
    expect(hasPaidAccess('trialing')).toBe(true)
    expect(hasPaidAccess('past_due')).toBe(true)
  })

  it('rejects incomplete, paused, and canceled subscriptions', () => {
    expect(hasPaidAccess('incomplete')).toBe(false)
    expect(hasPaidAccess('paused')).toBe(false)
    expect(hasPaidAccess('canceled')).toBe(false)
  })
})

describe('isSameOriginRequest', () => {
  it('accepts same-origin form posts', () => {
    const request = new Request('https://pitchslap.xyz/api/billing/checkout', {
      headers: { origin: 'https://pitchslap.xyz' },
    })

    expect(isSameOriginRequest(request)).toBe(true)
  })

  it('rejects cross-site form posts', () => {
    const request = new Request('https://pitchslap.xyz/api/billing/checkout', {
      headers: {
        origin: 'https://example.com',
        'sec-fetch-site': 'cross-site',
      },
    })

    expect(isSameOriginRequest(request)).toBe(false)
  })
})
