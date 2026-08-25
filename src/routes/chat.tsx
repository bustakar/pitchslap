import { createFileRoute } from '@tanstack/react-router'

import { PitchslapChat } from '@/components/pitchslap-chat'

export const Route = createFileRoute('/chat')({
  head: () => ({
    meta: [
      { title: 'Startup idea validator | Pitchslap office hours' },
      {
        name: 'description',
        content:
          'Pitch your startup idea to a blunt AI office-hours agent. Challenge the premise, check the market, and leave with one validation test.',
      },
      {
        name: 'robots',
        content: 'index, follow, max-image-preview:large',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Pitchslap' },
      {
        property: 'og:title',
        content: 'Startup idea validator | Pitchslap office hours',
      },
      {
        property: 'og:description',
        content:
          'Pitch your startup idea. Get questions, receipts, and a test.',
      },
      { property: 'og:url', content: 'https://pitchslap.xyz/chat' },
      {
        property: 'og:image',
        content: 'https://pitchslap.xyz/assets/pitchslap-og.png',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/png' },
      {
        property: 'og:image:alt',
        content: 'Pitchslap, your startup pitch needs a slap',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'Startup idea validator | Pitchslap office hours',
      },
      {
        name: 'twitter:description',
        content:
          'Pitch your startup idea. Get questions, receipts, and a test.',
      },
      {
        name: 'twitter:image',
        content: 'https://pitchslap.xyz/assets/pitchslap-og.png',
      },
      {
        name: 'twitter:image:alt',
        content: 'Pitchslap, your startup pitch needs a slap',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://pitchslap.xyz/chat' }],
  }),
  component: PitchslapChat,
})
