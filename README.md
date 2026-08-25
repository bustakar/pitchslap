# Pitchslap

A blunt AI office-hours agent for pressure-testing startup ideas.

It is intentionally small: one streamed chat, one server-only skill, native web search, and a transcript stored in the browser. WorkOS handles accounts, Stripe handles subscriptions, and there is no application database.

## Stack

- TanStack Start, React 19, TypeScript, Vite, and Nitro
- TanStack AI with OpenAI Responses API (`gpt-5.6-luna`, low reasoning)
- WorkOS AuthKit for authentication
- Stripe Checkout and customer portal for subscriptions
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

Fill in `.env.local` with the OpenAI, WorkOS, and Stripe test credentials. Configure WorkOS to use `/api/auth/callback` as the redirect URI and `/api/auth/sign-in` as the sign-in endpoint. Create a recurring Stripe Price and set its ID as `STRIPE_PRICE_ID`.

The subscription is $9.99 USD per month.

Stripe remains the billing source of truth. Pitchslap checks the current subscription when loading chat and before every model call, so the MVP needs neither a database nor webhook synchronization.

Vercel previews use their deployment URL for the WorkOS callback automatically. Register `https://*.vercel.app/api/auth/callback` in the WorkOS staging environment.

Run `pnpm check` before deploying.

The office-hours behavior is adapted from Garry Tan's MIT-licensed [gstack](https://github.com/garrytan/gstack) office-hours skill.
