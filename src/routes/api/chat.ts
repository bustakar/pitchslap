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
import { getAuth } from '@workos/authkit-tanstack-react-start'

import { getBillingAccess } from '@/lib/billing.server'
import { validateChatHistory } from '@/lib/chat-guard'
import { SYSTEM_PROMPT } from '@/lib/office-hours'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { user } = await getAuth()
        if (!user) {
          return Response.json(
            { error: 'Sign in to use Pitchslap.' },
            { status: 401 },
          )
        }

        try {
          const access = await getBillingAccess({
            id: user.id,
            email: user.email,
            name:
              [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
          })
          if (access.state === 'unconfigured') {
            return Response.json(
              { error: 'Billing is not configured yet.' },
              { status: 503 },
            )
          }
          if (access.state !== 'paid') {
            return Response.json(
              { error: 'A Pitchslap subscription is required.' },
              { status: 402 },
            )
          }
        } catch (error) {
          console.error('Unable to verify billing access', error)
          return Response.json(
            { error: 'Could not verify your subscription.' },
            { status: 503 },
          )
        }

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
          adapter: openaiText('gpt-5.6-luna'),
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
