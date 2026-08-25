import type { PostHog as PostHogClient } from 'posthog-js/dist/module.slim'

type AnalyticsProperties = Record<string, boolean | number | string | undefined>

let clientPromise: Promise<PostHogClient | null> | null = null
let lastTrackedHref = ''
let warnedAboutMissingToken = false

function analyticsEnvironment(): 'production' | 'development' {
  const configured = import.meta.env.VITE_PUBLIC_POSTHOG_ENVIRONMENT
  if (configured === 'production') return 'production'
  if (configured === 'development') return 'development'
  return window.location.hostname === 'pitchslap.xyz'
    ? 'production'
    : 'development'
}

function getPostHogClient(): Promise<PostHogClient | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (clientPromise) return clientPromise

  const token = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!token) {
    if (import.meta.env.DEV && !warnedAboutMissingToken) {
      warnedAboutMissingToken = true
      console.error(
        'VITE_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_PUBLIC_POSTHOG_PROJECT_TOKEN is configured',
      )
    }
    return Promise.resolve(null)
  }

  clientPromise = import('posthog-js/dist/module.slim').then(
    ({ default: client }) => {
      client.init(token, {
        api_host:
          import.meta.env.VITE_PUBLIC_POSTHOG_API_HOST ??
          'https://us.i.posthog.com',
        ui_host:
          import.meta.env.VITE_PUBLIC_POSTHOG_UI_HOST ??
          'https://us.posthog.com',
        defaults: '2026-05-30',
        autocapture: true,
        capture_exceptions: true,
        capture_pageleave: true,
        capture_pageview: false,
        disable_session_recording: true,
        person_profiles: 'identified_only',
        tracing_headers: [window.location.hostname],
        loaded: (loadedClient) => {
          loadedClient.register({ environment: analyticsEnvironment() })
        },
      })
      return client
    },
  )

  return clientPromise
}

export function initAnalytics(): void {
  void getPostHogClient()
}

export function captureAnalyticsEvent(
  event: string,
  properties?: AnalyticsProperties,
): void {
  void getPostHogClient().then((client) => client?.capture(event, properties))
}

export function captureAnalyticsException(error: unknown): void {
  void getPostHogClient().then((client) => client?.captureException(error))
}

export function captureAnalyticsPageview(href: string): void {
  if (href === lastTrackedHref) return
  lastTrackedHref = href
  void getPostHogClient().then((client) => client?.capture('$pageview'))
}

export function identifyAnalyticsUser(user: {
  id: string
  email: string
  name: string | null
}): void {
  void getPostHogClient().then((client) =>
    client?.identify(user.id, {
      email: user.email,
      name: user.name ?? undefined,
    }),
  )
}

export function resetAnalytics(): void {
  void getPostHogClient().then((client) => client?.reset())
}
