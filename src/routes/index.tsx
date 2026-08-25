import { createFileRoute } from '@tanstack/react-router'

import { PitchslapChat } from '@/components/pitchslap-chat'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return <PitchslapChat />
}
