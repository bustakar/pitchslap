# Pitchslap

A blunt AI office-hours agent for pressure-testing startup ideas.

It is intentionally small: one streamed chat, one server-only skill, native web search, and an account-backed case file. WorkOS handles accounts, Stripe handles subscriptions, and Convex stores sessions, credits, and usage.

## Stack

- TanStack Start, React 19, TypeScript, Vite, and Nitro
- TanStack AI with OpenAI Responses API (`gpt-5.6-luna`, low reasoning)
- WorkOS AuthKit for authentication
- Stripe Checkout and customer portal for subscriptions
- Convex for case files, Stripe webhooks, and the credit ledger
- Tailwind CSS 4 and shadcn/ui primitives
- Streamdown for streaming-safe Markdown
- Vercel Web Analytics
- Vitest
- Vercel hosting

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Fill in `.env.local` with the WorkOS, Stripe, and Convex development values. Configure WorkOS to use `/api/auth/callback` as the redirect URI and `/api/auth/sign-in` as the sign-in endpoint. Create a recurring Stripe Price and set its ID as `STRIPE_PRICE_ID`. Put the OpenAI and Stripe secrets in Convex, then point a Stripe webhook at `/stripe/webhook` on the Convex site URL.

The subscription is $9.99 USD per month.

Each paid invoice grants Stripe's actual processor net minus the 0.7% Stripe Billing fee. Convex reserves credit before a model call, settles measured Luna and web-search usage afterward, and blocks calls with insufficient credit.

Vercel previews use their deployment URL for the WorkOS callback automatically. Register `https://*.vercel.app/api/auth/callback` in the WorkOS staging environment.

Run `pnpm check` before deploying.

The office-hours behavior is adapted from Garry Tan's MIT-licensed [gstack](https://github.com/garrytan/gstack) office-hours skill.
