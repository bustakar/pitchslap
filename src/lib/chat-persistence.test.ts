import { describe, expect, it } from 'vitest'

import { deserializeChatState } from './chat-persistence'

describe('deserializeChatState', () => {
  it('restores message timestamps as dates', () => {
    const state = deserializeChatState(
      JSON.stringify({
        messages: [
          {
            id: 'message-1',
            role: 'user',
            parts: [{ type: 'text', content: 'My idea' }],
            createdAt: '2026-08-25T10:00:00.000Z',
          },
        ],
      }),
    )

    expect(state.messages[0]?.createdAt).toEqual(
      new Date('2026-08-25T10:00:00.000Z'),
    )
  })

  it('removes duplicate retries left by failed requests', () => {
    const state = deserializeChatState(
      JSON.stringify({
        messages: [
          {
            id: 'message-1',
            role: 'user',
            parts: [{ type: 'text', content: 'My idea' }],
          },
          {
            id: 'message-2',
            role: 'user',
            parts: [{ type: 'text', content: 'My idea' }],
          },
        ],
      }),
    )

    expect(state.messages).toHaveLength(1)
  })
})
