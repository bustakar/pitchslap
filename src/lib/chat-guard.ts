const MAX_MESSAGES = 40
const MAX_TEXT_CHARACTERS = 24_000

function countText(value: unknown): number {
  if (typeof value === 'string') return value.length
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countText(item), 0)
  }
  if (!value || typeof value !== 'object') return 0

  return Object.entries(value).reduce((total, [key, item]) => {
    if (key === 'metadata' || key === 'reasoning' || key === 'thinking') {
      return total
    }
    return total + countText(item)
  }, 0)
}

export function validateChatHistory(messages: unknown): string | null {
  if (!Array.isArray(messages)) return 'Messages must be an array.'
  if (messages.length === 0) return 'Send an idea to begin.'
  if (messages.length > MAX_MESSAGES)
    return 'This case file is full. Start a new one.'
  if (countText(messages) > MAX_TEXT_CHARACTERS) {
    return 'This case file is too large. Start a new one.'
  }
  return null
}
