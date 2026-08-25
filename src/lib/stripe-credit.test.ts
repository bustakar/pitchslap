import { describe, expect, it } from 'vitest'

import { calculateStripeNetCreditMicros } from './stripe-credit'

describe('calculateStripeNetCreditMicros', () => {
  it('subtracts the 0.7% Billing fee from Stripe processor net', () => {
    expect(
      calculateStripeNetCreditMicros({
        invoiceAmountUsdMinor: 999,
        settlementNetMinor: 953,
        settlementCurrency: 'usd',
        exchangeRate: null,
      }),
    ).toBe(9_460_070)
  })

  it('converts settlement currency back to invoice USD', () => {
    expect(
      calculateStripeNetCreditMicros({
        invoiceAmountUsdMinor: 999,
        settlementNetMinor: 20_000,
        settlementCurrency: 'czk',
        exchangeRate: 20,
      }),
    ).toBe(9_930_070)
  })

  it('rejects a non-USD settlement without an exchange rate', () => {
    expect(() =>
      calculateStripeNetCreditMicros({
        invoiceAmountUsdMinor: 999,
        settlementNetMinor: 20_000,
        settlementCurrency: 'czk',
        exchangeRate: null,
      }),
    ).toThrow('exchange rate')
  })
})
