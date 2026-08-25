import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { captureAnalyticsPageview, initAnalytics } from './lib/analytics'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  if (typeof window !== 'undefined') {
    initAnalytics()
    captureAnalyticsPageview(window.location.href)
    router.subscribe('onResolved', ({ toLocation }) => {
      captureAnalyticsPageview(toLocation.href)
    })
  }

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
