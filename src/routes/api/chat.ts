import {
  chat,
  chatParamsFromRequest,
  maxIterations,
  toServerSentEventsResponse,
} from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { webSearchTool } from '@tanstack/ai-openai/tools'
import { createFileRoute } from '@tanstack/react-router'
import type {} from '@tanstack/react-start'

import { validateChatHistory } from '@/lib/chat-guard'
import { SYSTEM_PROMPT } from '@/lib/office-hours'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.OPENAI_API_KEY) {
          return Response.json(
            { error: 'Pitchslap is waiting for its OpenAI API key.' },
            { status: 503 },
          )
        }

        const params = await chatParamsFromRequest(request)
        const validationError = validateChatHistory(params.messages)
        if (validationError) {
          return Response.json({ error: validationError }, { status: 400 })
        }

        const stream = chat({
          adapter: openaiText('gpt-5.4-mini'),
          messages: params.messages,
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
            store: false,
            include: ['web_search_call.action.sources'],
          },
          agentLoopStrategy: maxIterations(4),
        })

        return toServerSentEventsResponse(stream)
      },
    },
  },
})
