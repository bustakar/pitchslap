import { createFileRoute } from '@tanstack/react-router'

import { LegalPage } from '@/components/legal-page'

const description =
  'How Pitchslap handles account, billing, chat, and usage information.'

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy policy | Pitchslap' },
      { name: 'description', content: description },
      { name: 'robots', content: 'index, follow' },
    ],
    links: [{ rel: 'canonical', href: 'https://pitchslap.xyz/privacy' }],
  }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <LegalPage eyebrow="THE DATA RECEIPTS" title="Privacy policy">
      <p>
        Pitchslap is operated by Karel Busta. This policy explains what data
        Pitchslap uses and why.
      </p>

      <h2>Account information</h2>
      <p>
        WorkOS handles sign-in. Pitchslap receives basic account information
        such as your name, email address, and WorkOS user ID so it can identify
        your account and protect paid features.
      </p>

      <h2>Billing information</h2>
      <p>
        Stripe handles subscriptions, payments, invoices, and payment methods.
        Pitchslap stores the Stripe customer reference needed to check your
        subscription. Pitchslap does not receive or store your full card number.
      </p>

      <h2>Your chats</h2>
      <p>
        Your messages and the conversation context are sent to OpenAI to
        generate responses and perform the research you request. Chat history is
        saved in your browser. Pitchslap does not currently maintain its own
        chat-history database.
      </p>

      <h2>Site usage</h2>
      <p>
        Vercel hosts Pitchslap and provides basic site analytics. Its systems
        may process technical information such as your IP address, browser,
        device, and pages visited to deliver and secure the service.
      </p>

      <h2>Sharing and retention</h2>
      <p>
        Pitchslap does not sell personal data. Data is shared with WorkOS,
        Stripe, OpenAI, and Vercel only as needed to operate the service. Each
        provider applies its own retention and security practices.
      </p>

      <h2>Your choices</h2>
      <p>
        You can erase local chat history from the chat page, cancel billing in
        the Stripe customer portal, or request access to or deletion of your
        account information by emailing{' '}
        <a href="mailto:hello@karelbusta.dev">hello@karelbusta.dev</a>.
      </p>

      <h2>Changes</h2>
      <p>
        This policy may change when the product or its providers change. The
        date above will be updated when that happens.
      </p>
    </LegalPage>
  )
}
