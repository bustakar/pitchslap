import { v } from 'convex/values'

export const storedMessage = v.object({
  id: v.string(),
  role: v.union(v.literal('user'), v.literal('assistant')),
  content: v.string(),
  searched: v.boolean(),
  createdAt: v.number(),
})

export type StoredMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  searched: boolean
  createdAt: number
}
