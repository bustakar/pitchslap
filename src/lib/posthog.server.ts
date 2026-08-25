import { PostHog } from 'posthog-node'

type ServerEvent = {
  distinctId: string
  event: string
  properties?: Record<string, boolean | number | string | undefined>
  request?: Request
}

let posthogClient: PostHog | null | undefined
let warnedAboutMissingToken = false

function analyticsEnvironment(): 'production' | 'development' {
  if (process.env.POSTHOG_ENVIRONMENT === 'production') return 'production'
  if (process.env.POSTHOG_ENVIRONMENT === 'development') return 'development'
  return process.env.VERCEL_ENV === 'production' ? 'production' : 'development'
}

function getPostHogClient(): PostHog | null {
  if (posthogClient !== undefined) return posthogClient

  const token = process.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!token) {
    if (process.env.NODE_ENV !== 'production' && !warnedAboutMissingToken) {
      warnedAboutMissingToken = true
      console.error(
        'VITE_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_PUBLIC_POSTHOG_PROJECT_TOKEN is configured',
      )
    }
    posthogClient = null
    return null
  }

  posthogClient = new PostHog(token, {
    host: process.env.POSTHOG_API_HOST ?? 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  })
  return posthogClient
}

export async function captureServerEvent({
  distinctId,
  event,
  properties,
  request,
}: ServerEvent): Promise<void> {
  const client = getPostHogClient()
  if (!client) return

  const sessionId = request?.headers.get('X-PostHog-Session-Id') ?? undefined
  try {
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        environment: analyticsEnvironment(),
        $session_id: sessionId,
      },
    })
    await client.flush()
  } catch (error) {
    console.error('Unable to send analytics event', error)
  }
}
