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
        A secure identity provider handles sign-in. Pitchslap receives basic
        account information such as your name, email address, and account ID so
        it can identify your account and protect paid features.
      </p>

      <h2>Billing information</h2>
      <p>
        A secure payment provider handles subscriptions, payments, invoices, and
        payment methods. Pitchslap stores the customer reference needed to check
        your subscription. Pitchslap does not receive or store your full card
        number.
      </p>

      <h2>Your chats</h2>
      <p>
        Your messages and the conversation context are sent to OpenAI to
        generate responses and perform the research you request. Pitchslap
        stores your account-linked case file in its application database so it
        survives reloads and is available across your signed-in devices.
      </p>

      <h2>Credits and usage</h2>
      <p>
        Pitchslap stores your API balance and a usage ledger containing model
        token counts, web-search calls, prices applied, and payment references.
        This lets the service grant subscription credit, deduct actual API
        usage, and prevent duplicate charges.
      </p>

      <h2>Site usage</h2>
      <p>
        Pitchslap's hosting and analytics providers may process technical
        information such as your IP address, browser, device, and pages visited
        to deliver and secure the service.
      </p>

      <h2>Sharing and retention</h2>
      <p>
        Pitchslap does not sell personal data. Data is shared with identity,
        payment, infrastructure, and analytics providers only as needed to run
        the service. Messages are shared with OpenAI to generate responses. Each
        provider applies its own retention and security practices.
      </p>

      <h2>Your choices</h2>
      <p>
        You can erase your case file from the chat page, cancel through the
        billing portal, or request access to or deletion of your account
        information by emailing{' '}
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
