import { createFileRoute } from '@tanstack/react-router'
import { getAuth } from '@workos/authkit-tanstack-react-start'

import { isSameOriginRequest } from '@/lib/billing'
import { clearBackendThread, getBackendSnapshot } from '@/lib/backend.server'
import { captureServerEvent } from '@/lib/posthog.server'

async function authenticatedToken(): Promise<{
  accessToken: string
  userId: string
} | null> {
  const auth = await getAuth()
  return auth.user
    ? { accessToken: auth.accessToken, userId: auth.user.id }
    : null
}

export const Route = createFileRoute('/api/chat/state')({
  server: {
    handlers: {
      GET: async () => {
        const auth = await authenticatedToken()
        if (!auth) {
          return Response.json({ error: 'Sign in.' }, { status: 401 })
        }
        return Response.json(await getBackendSnapshot(auth.accessToken))
      },
      DELETE: async ({ request }) => {
        if (!isSameOriginRequest(request)) {
          return new Response('Cross-site request rejected.', { status: 403 })
        }
        const auth = await authenticatedToken()
        if (!auth) {
          return Response.json({ error: 'Sign in.' }, { status: 401 })
        }
        await clearBackendThread(auth.accessToken)
        await captureServerEvent({
          distinctId: auth.userId,
          event: 'case_file_cleared',
          request,
        })
        return new Response(null, { status: 204 })
      },
    },
  },
})
