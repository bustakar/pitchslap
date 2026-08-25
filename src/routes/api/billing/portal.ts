import { getAuth } from '@workos/authkit-tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

import { isSameOriginRequest } from '@/lib/billing'
import { createPortalUrl, requestOrigin } from '@/lib/billing.server'
import { captureServerEvent } from '@/lib/posthog.server'

export const Route = createFileRoute('/api/billing/portal')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOriginRequest(request)) {
          return new Response('Cross-site request rejected.', { status: 403 })
        }

        const { user } = await getAuth()
        if (!user) {
          return Response.redirect(
            new URL('/api/auth/sign-in?returnPathname=/chat', request.url),
            303,
          )
        }

        const origin = requestOrigin(request)
        const url = await createPortalUrl(user, origin)
        if (url) {
          await captureServerEvent({
            distinctId: user.id,
            event: 'billing_portal_opened',
            request,
          })
        }
        return Response.redirect(url ?? `${origin}/chat`, 303)
      },
    },
  },
})
