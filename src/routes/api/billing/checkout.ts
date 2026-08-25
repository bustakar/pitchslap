import { getAuth } from '@workos/authkit-tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

import { isSameOriginRequest } from '@/lib/billing'
import { createCheckoutUrl, requestOrigin } from '@/lib/billing.server'

export const Route = createFileRoute('/api/billing/checkout')({
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

        const url = await createCheckoutUrl(user, requestOrigin(request))
        return Response.redirect(url, 303)
      },
    },
  },
})
