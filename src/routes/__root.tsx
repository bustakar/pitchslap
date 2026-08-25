import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Analytics } from '@vercel/analytics/react'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/michroma/latin-400.css'

import { TooltipProvider } from '@/components/ui/tooltip'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Pitchslap — Validate your startup before reality does',
      },
      {
        name: 'description',
        content:
          'A blunt AI office-hours agent that pressure-tests startup ideas and gives you one concrete validation experiment.',
      },
      {
        property: 'og:title',
        content: 'Pitchslap — Your idea is probably wrong',
      },
      {
        property: 'og:description',
        content: 'Submit your startup idea for interrogation.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
        <Scripts />
      </body>
    </html>
  )
}
