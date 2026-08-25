export const GPT_5_6_LUNA_PRICING_VERSION = '2026-08-25'

const NANODOLLARS_PER_INPUT_TOKEN = 200
const NANODOLLARS_PER_CACHED_INPUT_TOKEN = 20
const NANODOLLARS_PER_OUTPUT_TOKEN = 1_200
const NANODOLLARS_PER_WEB_SEARCH = 10_000_000
const NANODOLLARS_PER_MICRODOLLAR = 1_000

export type OpenAiUsage = {
  promptTokens: number
  cachedInputTokens: number
  completionTokens: number
  webSearchCalls: number
}

function wholeNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

export function calculateOpenAiUsageMicros(usage: OpenAiUsage): number {
  const promptTokens = wholeNonNegative(usage.promptTokens)
  const cachedInputTokens = Math.min(
    promptTokens,
    wholeNonNegative(usage.cachedInputTokens),
  )
  const uncachedInputTokens = promptTokens - cachedInputTokens
  const completionTokens = wholeNonNegative(usage.completionTokens)
  const webSearchCalls = wholeNonNegative(usage.webSearchCalls)

  const nanodollars =
    uncachedInputTokens * NANODOLLARS_PER_INPUT_TOKEN +
    cachedInputTokens * NANODOLLARS_PER_CACHED_INPUT_TOKEN +
    completionTokens * NANODOLLARS_PER_OUTPUT_TOKEN +
    webSearchCalls * NANODOLLARS_PER_WEB_SEARCH

  return Math.ceil(nanodollars / NANODOLLARS_PER_MICRODOLLAR)
}

export function formatUsageBalance(microdollars: number): string {
  return `$${(Math.max(0, microdollars) / 1_000_000).toFixed(2)}`
}
