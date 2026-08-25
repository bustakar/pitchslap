import { getSignInUrl } from '@workos/authkit-tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

import { safeReturnPathname } from '@/lib/auth'

export const Route = createFileRoute('/api/auth/sign-in')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestedPath = new URL(request.url).searchParams.get(
          'returnPathname',
        )
        const url = await getSignInUrl({
          data: { returnPathname: safeReturnPathname(requestedPath) },
        })

        return new Response(null, {
          status: 307,
          headers: { Location: url },
        })
      },
    },
  },
})
