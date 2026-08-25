import { signOut } from '@workos/authkit-tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/sign-out')({
  server: {
    handlers: {
      GET: async () => signOut({ data: { returnTo: '/' } }),
    },
  },
})
