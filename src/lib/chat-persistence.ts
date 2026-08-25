import type { ChatPersistedState, UIMessage } from '@tanstack/ai-react'

function reviveMessageDates(key: string, value: unknown) {
  if (key !== 'createdAt' || typeof value !== 'string') return value

  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : date
}

export function deserializeChatState(value: string): ChatPersistedState {
  const state = JSON.parse(value, reviveMessageDates) as ChatPersistedState

  return {
    ...state,
    messages: state.messages.filter((message, index, messages) => {
      if (index === 0) return true
      const previous = messages[index - 1]
      return !(
        previous.role === 'user' &&
        message.role === 'user' &&
        messageText(previous) === messageText(message)
      )
    }),
  }
}

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.content)
    .join('\n')
}
