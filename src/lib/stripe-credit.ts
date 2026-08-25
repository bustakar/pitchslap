const MICRODOLLARS_PER_USD = 1_000_000
const MINOR_UNITS_PER_USD = 100

export type StripeNetCreditInput = {
  invoiceAmountUsdMinor: number
  settlementNetMinor: number
  settlementCurrency: string
  exchangeRate: number | null
  billingFeeBasisPoints?: number
}

export function calculateStripeNetCreditMicros({
  invoiceAmountUsdMinor,
  settlementNetMinor,
  settlementCurrency,
  exchangeRate,
  billingFeeBasisPoints = 70,
}: StripeNetCreditInput): number {
  if (!Number.isInteger(invoiceAmountUsdMinor) || invoiceAmountUsdMinor <= 0) {
    throw new Error('Invoice amount must be a positive USD minor-unit amount.')
  }
  if (!Number.isInteger(settlementNetMinor) || settlementNetMinor <= 0) {
    throw new Error('Stripe net amount must be positive.')
  }

  const normalizedCurrency = settlementCurrency.toLowerCase()
  const netUsd =
    normalizedCurrency === 'usd'
      ? settlementNetMinor / MINOR_UNITS_PER_USD
      : exchangeRate && exchangeRate > 0
        ? settlementNetMinor / MINOR_UNITS_PER_USD / exchangeRate
        : null

  if (netUsd === null) {
    throw new Error('Stripe did not provide a USD settlement exchange rate.')
  }

  const processorNetMicros = Math.floor(netUsd * MICRODOLLARS_PER_USD)
  const billingFeeMicros = Math.ceil(
    invoiceAmountUsdMinor * billingFeeBasisPoints,
  )

  return Math.max(0, processorNetMicros - billingFeeMicros)
}
