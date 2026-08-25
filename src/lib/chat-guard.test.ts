import { describe, expect, it } from 'vitest'

import { validateChatHistory } from './chat-guard'

describe('validateChatHistory', () => {
  it('accepts a small conversation', () => {
    expect(
      validateChatHistory([
        { role: 'user', parts: [{ type: 'text', content: 'My idea' }] },
      ]),
    ).toBeNull()
  })

  it('rejects an empty or oversized case file', () => {
    expect(validateChatHistory([])).toBe('Send an idea to begin.')
    expect(
      validateChatHistory(
        Array.from({ length: 41 }, () => ({ role: 'user', content: 'idea' })),
      ),
    ).toBe('This case file is full. Start a new one.')
  })

  it('does not count hidden reasoning fields toward user input', () => {
    expect(
      validateChatHistory([
        { role: 'user', content: 'idea', reasoning: 'x'.repeat(25_000) },
      ]),
    ).toBeNull()
  })
})
