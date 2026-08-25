import { createFileRoute } from '@tanstack/react-router'
import type {} from '@tanstack/react-start'
import { getAuth } from '@workos/authkit-tanstack-react-start'

import { isSameOriginRequest } from '@/lib/billing'
import { getBillingAccess } from '@/lib/billing.server'

const MAX_REQUEST_BYTES = 100_000

function convexChatUrl(): string | null {
  const siteUrl =
    process.env.CONVEX_SITE_URL ?? process.env.VITE_CONVEX_SITE_URL
  return siteUrl ? `${siteUrl}/chat` : null
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOriginRequest(request)) {
          return new Response('Cross-site request rejected.', { status: 403 })
        }

        const auth = await getAuth()
        const { user } = auth
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

        const chatUrl = convexChatUrl()
        if (!chatUrl) {
          return Response.json(
            { error: 'Pitchslap backend is not configured.' },
            { status: 503 },
          )
        }

        const body = await request.text()
        if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
          return Response.json(
            { error: 'This case file is too large. Start a new one.' },
            { status: 413 },
          )
        }

        return fetch(chatUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
            'Content-Type':
              request.headers.get('content-type') ?? 'application/json',
          },
          body,
        })
      },
    },
  },
})
