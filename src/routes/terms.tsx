import { createFileRoute } from '@tanstack/react-router'

import { LegalPage } from '@/components/legal-page'

const description = 'The terms for using Pitchslap startup office hours.'

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      { title: 'Terms of service | Pitchslap' },
      { name: 'description', content: description },
      { name: 'robots', content: 'index, follow' },
    ],
    links: [{ rel: 'canonical', href: 'https://pitchslap.xyz/terms' }],
  }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <LegalPage eyebrow="THE BORING BUT USEFUL BIT" title="Terms of service">
      <p>
        Pitchslap is an AI startup-idea review service operated by Karel Busta.
        By using it, you agree to these terms.
      </p>

      <h2>The service</h2>
      <p>
        Pitchslap challenges product ideas, researches markets, and suggests
        validation experiments. AI output can be incomplete or wrong. Treat it
        as research and opinion, not legal, financial, medical, or professional
        advice. You remain responsible for your decisions.
      </p>

      <h2>Accounts</h2>
      <p>
        You are responsible for activity under your account and for keeping
        access to it secure. Do not share an account or use someone else's
        account without permission.
      </p>

      <h2>Subscription and cancellation</h2>
      <p>
        Pitchslap costs $9.99 USD per month. The payment provider charges the
        subscription automatically until you cancel it. You can cancel through
        the billing portal, and access continues through the end of the paid
        billing period. Fees are non-refundable except where the law requires
        otherwise.
      </p>

      <h2>API balance and usage</h2>
      <p>
        Each successful subscription payment adds a non-cash API balance equal
        to the actual processor net for that payment, less the billing service's
        0.7% fee. The exact amount varies by payment method and currency. The
        balance rolls over, has no cash value, cannot be transferred, and is
        reduced by measured OpenAI model and web-search usage. Pitchslap blocks
        new requests when the remaining balance is too low and may reverse
        credits for refunds or chargebacks.
      </p>

      <h2>Your content</h2>
      <p>
        You keep ownership of the ideas and text you submit. You allow Pitchslap
        and its providers to process that content only as needed to run the
        service. Do not submit material you lack permission to use or highly
        sensitive information you do not want processed by an AI service.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not use Pitchslap to break the law, harm others, probe or disrupt the
        service, bypass access controls, or abuse third-party systems. Access
        may be suspended when needed to stop misuse or protect the service.
      </p>

      <h2>Availability and liability</h2>
      <p>
        The service is provided as available and may change or experience
        downtime. To the extent allowed by law, Pitchslap is not liable for
        indirect losses, lost profits, or decisions made from AI output.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to{' '}
        <a href="mailto:hello@karelbusta.dev">hello@karelbusta.dev</a>.
      </p>
    </LegalPage>
  )
}
