import { createFileRoute } from '@tanstack/react-router'

import { PitchslapChat } from '@/components/pitchslap-chat'

export const Route = createFileRoute('/chat')({
  head: () => ({
    meta: [
      { title: 'Office hours | Pitchslap' },
      {
        name: 'description',
        content: 'Pressure-test your startup idea with Pitchslap.',
      },
    ],
  }),
  component: PitchslapChat,
})
