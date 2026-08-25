import {
  chat,
  chatParamsFromRequest,
  maxIterations,
  toServerSentEventsResponse,
} from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { webSearchTool } from '@tanstack/ai-openai/tools'

import { SYSTEM_PROMPT } from '../src/lib/office-hours'
import {
  GPT_5_6_LUNA_PRICING_VERSION,
  calculateOpenAiUsageMicros,
} from '../src/lib/usage-pricing'
import { internal } from './_generated/api'
import { httpAction } from './_generated/server'
import type { StoredMessage } from './validators'
import type { ChatMiddleware, ModelMessage } from '@tanstack/ai'

const THREAD_KEY = 'case-file'
const MODEL = 'gpt-5.6-luna'
const RESERVE_MICROS = 100_000
const MAX_MESSAGES = 40
const MAX_TEXT_CHARACTERS = 24_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function messageContent(value: unknown): string {
  if (!isRecord(value)) return ''
  if (typeof value.content === 'string') return value.content
  if (!Array.isArray(value.parts)) return ''

  return value.parts
    .filter(
      (part): part is Record<string, unknown> =>
        isRecord(part) &&
        part.type === 'text' &&
        typeof part.content === 'string',
    )
    .map((part) => String(part.content))
    .join('\n')
}

function currentUserMessage(value: unknown): StoredMessage | null {
  if (!isRecord(value) || value.role !== 'user') return null
  const content = messageContent(value).trim()
  if (!content) return null

  return {
    id: typeof value.id === 'string' ? value.id : crypto.randomUUID(),
    role: 'user',
    content,
    searched: false,
    createdAt: Date.now(),
  }
}

function validateConversation(messages: Array<StoredMessage>): string | null {
  if (messages.length > MAX_MESSAGES - 1) {
    return 'This case file is full. Start a new one.'
  }
  const textCharacters = messages.reduce(
    (total, message) => total + message.content.length,
    0,
  )
  return textCharacters > MAX_TEXT_CHARACTERS
    ? 'This case file is too large. Start a new one.'
    : null
}

function modelMessages(messages: Array<StoredMessage>): Array<ModelMessage> {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))
}

export const handleChat = httpAction(async (actionCtx, request) => {
  const identity = await actionCtx.auth.getUserIdentity()
  if (!identity) {
    return Response.json(
      { error: 'Sign in to use Pitchslap.' },
      { status: 401 },
    )
  }
  const userId = identity.subject
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'Pitchslap is waiting for its OpenAI API key.' },
      { status: 503 },
    )
  }

  const params = await chatParamsFromRequest(request)
  if (params.threadId !== THREAD_KEY) {
    return Response.json({ error: 'Unknown case file.' }, { status: 400 })
  }

  const latestMessage = currentUserMessage(params.messages.at(-1))
  if (!latestMessage) {
    return Response.json({ error: 'Send an idea to begin.' }, { status: 400 })
  }

  const storedMessages = await actionCtx.runQuery(internal.backend.loadThread, {
    userId,
    threadKey: THREAD_KEY,
  })
  const conversation = [...storedMessages, latestMessage]
  const validationError = validateConversation(conversation)
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 })
  }

  try {
    const reservation = await actionCtx.runMutation(
      internal.backend.reserveUsage,
      {
        userId,
        requestId: params.runId,
        reserveMicros: RESERVE_MICROS,
      },
    )
    if (reservation !== 'pending') {
      return Response.json(
        { error: 'This request was already handled.' },
        { status: 409 },
      )
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('INSUFFICIENT_CREDITS')
    ) {
      return Response.json(
        { error: 'Your Pitchslap API balance is empty.' },
        { status: 402 },
      )
    }
    throw error
  }

  let promptTokens = 0
  let cachedInputTokens = 0
  let completionTokens = 0
  const webSearchIds = new Set<string>()
  let terminalHandled = false

  async function release() {
    if (terminalHandled) return
    terminalHandled = true
    await actionCtx.runMutation(internal.backend.releaseUsage, {
      userId,
      requestId: params.runId,
    })
  }

  async function settle(content: string, assistantId: string | null) {
    if (terminalHandled) return
    terminalHandled = true
    const actualMicros = calculateOpenAiUsageMicros({
      promptTokens,
      cachedInputTokens,
      completionTokens,
      webSearchCalls: webSearchIds.size,
    })
    const messages: Array<StoredMessage> = [...conversation]
    if (content.trim()) {
      messages.push({
        id: assistantId ?? crypto.randomUUID(),
        role: 'assistant',
        content,
        searched: webSearchIds.size > 0,
        createdAt: Date.now(),
      })
    }

    await actionCtx.runMutation(internal.backend.settleUsage, {
      userId,
      requestId: params.runId,
      actualMicros,
      threadKey: THREAD_KEY,
      messages,
      model: MODEL,
      pricingVersion: GPT_5_6_LUNA_PRICING_VERSION,
      promptTokens,
      cachedInputTokens,
      completionTokens,
      webSearchCalls: webSearchIds.size,
    })
  }

  const accountingMiddleware: ChatMiddleware = {
    name: 'pitchslap-accounting',
    onChunk(_ctx, chunk) {
      if (
        chunk.type === 'TOOL_CALL_START' &&
        (chunk.toolCallName === 'web_search' || chunk.toolName === 'web_search')
      ) {
        webSearchIds.add(chunk.toolCallId)
      }
    },
    onUsage(_ctx, usage) {
      promptTokens += usage.promptTokens
      cachedInputTokens += usage.promptTokensDetails?.cachedTokens ?? 0
      completionTokens += usage.completionTokens
    },
    async onFinish(ctx, info) {
      await settle(info.content, ctx.currentMessageId)
    },
    async onAbort(ctx) {
      if (promptTokens || completionTokens || webSearchIds.size) {
        await settle(ctx.accumulatedContent, ctx.currentMessageId)
      } else {
        await release()
      }
    },
    async onError(ctx) {
      if (promptTokens || completionTokens || webSearchIds.size) {
        await settle(ctx.accumulatedContent, ctx.currentMessageId)
      } else {
        await release()
      }
    },
  }

  const stream = chat({
    adapter: openaiText(MODEL),
    messages: modelMessages(conversation),
    systemPrompts: [SYSTEM_PROMPT],
    tools: [
      webSearchTool({
        type: 'web_search',
        search_context_size: 'medium',
      }),
    ],
    modelOptions: {
      reasoning: { effort: 'low' },
      max_output_tokens: 2_400,
      max_tool_calls: 4,
      service_tier: 'default',
      store: false,
      safety_identifier: userId,
      prompt_cache_key: `pitchslap:${userId}:${THREAD_KEY}`,
      include: ['web_search_call.action.sources'],
    },
    agentLoopStrategy: maxIterations(4),
    middleware: [accountingMiddleware],
    threadId: params.threadId,
    runId: params.runId,
  })

  return toServerSentEventsResponse(stream)
})
