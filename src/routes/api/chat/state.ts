import { createFileRoute } from '@tanstack/react-router'
import { getAuth } from '@workos/authkit-tanstack-react-start'

import { isSameOriginRequest } from '@/lib/billing'
import { clearBackendThread, getBackendSnapshot } from '@/lib/backend.server'

async function authenticatedToken(): Promise<string | null> {
  const auth = await getAuth()
  return auth.user ? auth.accessToken : null
}

export const Route = createFileRoute('/api/chat/state')({
  server: {
    handlers: {
      GET: async () => {
        const accessToken = await authenticatedToken()
        if (!accessToken) {
          return Response.json({ error: 'Sign in.' }, { status: 401 })
        }
        return Response.json(await getBackendSnapshot(accessToken))
      },
      DELETE: async ({ request }) => {
        if (!isSameOriginRequest(request)) {
          return new Response('Cross-site request rejected.', { status: 403 })
        }
        const accessToken = await authenticatedToken()
        if (!accessToken) {
          return Response.json({ error: 'Sign in.' }, { status: 401 })
        }
        await clearBackendThread(accessToken)
        return new Response(null, { status: 204 })
      },
    },
  },
})
