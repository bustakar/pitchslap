import { describe, expect, it } from 'vitest'

import { calculateOpenAiUsageMicros } from './usage-pricing'

describe('calculateOpenAiUsageMicros', () => {
  it('meters Luna input, cached input, output, and web searches', () => {
    expect(
      calculateOpenAiUsageMicros({
        promptTokens: 10_000,
        cachedInputTokens: 4_000,
        completionTokens: 2_000,
        webSearchCalls: 1,
      }),
    ).toBe(13_680)
  })

  it('never bills invalid or duplicated cached tokens', () => {
    expect(
      calculateOpenAiUsageMicros({
        promptTokens: 10,
        cachedInputTokens: 100,
        completionTokens: -1,
        webSearchCalls: Number.NaN,
      }),
    ).toBe(1)
  })
})
