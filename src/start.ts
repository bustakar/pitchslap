import { authkitMiddleware } from '@workos/authkit-tanstack-react-start'
import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

const previewRedirectUri =
  process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/auth/callback`
    : undefined

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [
    csrfMiddleware,
    authkitMiddleware({ redirectUri: previewRedirectUri }),
  ],
}))
