# Pitchslap

A blunt AI office-hours agent for pressure-testing startup ideas.

It is intentionally small: one streamed chat, one server-only skill, native web search, and a transcript stored in the browser. There is no database, authentication, file upload, or model picker.

## Stack

- TanStack Start, React 19, TypeScript, Vite, and Nitro
- TanStack AI with OpenAI Responses API (`gpt-5.4-mini`)
- Tailwind CSS 4 and shadcn/ui primitives
- Streamdown for streaming-safe Markdown
- Vercel BotID and Web Analytics
- Vitest
- Vercel hosting

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Add an `OPENAI_API_KEY` to `.env.local`. Run `pnpm check` before deploying.

The office-hours behavior is adapted from Garry Tan's MIT-licensed [gstack](https://github.com/garrytan/gstack) office-hours skill.
