import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  fetchServerSentEvents,
  localStoragePersistence,
  useChat,
} from '@tanstack/ai-react'
import type { UIMessage } from '@tanstack/ai-react'
import {
  ArrowLeft,
  ArrowUp,
  CircleHelp,
  CreditCard,
  LogOut,
  Search,
  ShieldCheck,
  Square,
  Trash2,
} from 'lucide-react'
import 'streamdown/styles.css'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { deserializeChatState } from '@/lib/chat-persistence'
import type { ChatAccess } from '@/lib/chat-access'
import { cn } from '@/lib/utils'

const STARTERS = [
  'I want to build an AI agent for…',
  'I found a painful workflow where…',
  'I have users, but they are not paying…',
]

const CHAT_THREAD = 'case-file'

const Streamdown = lazy(async () => {
  const module = await import('streamdown')
  return { default: module.Streamdown }
})

function textFromMessage(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.content)
    .join('\n')
}

function Message({ message, active }: { message: UIMessage; active: boolean }) {
  const text = textFromMessage(message)
  const searched = message.parts.some(
    (part) => part.type === 'tool-call' && part.name === 'web_search',
  )
  const verdict = text.includes('TARGET DISPOSITION:')

  if (message.role === 'system') return null
  if (!text && !searched) return null

  return (
    <article
      className={cn(
        'chat-message',
        `chat-message-${message.role}`,
        verdict && 'chat-message-verdict',
      )}
    >
      <div className="chat-message-label">
        <span>
          {message.role === 'user'
            ? 'YOU'
            : verdict
              ? 'THE VERDICT'
              : 'PITCHSLAP'}
        </span>
        <span>{message.role === 'assistant' && active ? 'TYPING…' : ''}</span>
      </div>
      {searched && (
        <div className="research-flag">
          <Search aria-hidden="true" /> Checking the market
        </div>
      )}
      {message.role === 'assistant' ? (
        <div className="chat-prose">
          <Suspense fallback={<p className="whitespace-pre-wrap">{text}</p>}>
            <Streamdown isAnimating={active}>{text}</Streamdown>
          </Suspense>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{text}</p>
      )}
    </article>
  )
}

export function PitchslapChat({ access }: { access: ChatAccess }) {
  if (access.state !== 'paid') return <AccessGate access={access} />

  return <PaidChat />
}

function PaidChat() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <ChatLoadingShell />

  return (
    <TooltipProvider>
      <BrowserChat />
    </TooltipProvider>
  )
}

function AccessGate({
  access,
}: {
  access: Exclude<ChatAccess, { state: 'paid' }>
}) {
  const signedOut = access.state === 'signed-out'
  const unavailable = access.state === 'unavailable'
  const unconfigured = access.state === 'unconfigured'

  return (
    <div className="chat-page access-page">
      <header className="chat-header">
        <Link className="brand-lockup" to="/" aria-label="Pitchslap home">
          <span className="brand-burst">P!</span>
          <span>pitchslap</span>
        </Link>
        <span className="chat-status">
          <i /> OFFICE HOURS OPEN
        </span>
        {!signedOut && (
          <Button className="erase-button" variant="ghost" size="sm" asChild>
            <a href="/api/auth/sign-out">
              <LogOut aria-hidden="true" /> Sign out
            </a>
          </Button>
        )}
      </header>

      <main className="access-stage">
        <section className="access-card" aria-labelledby="access-title">
          <span className="chat-kicker">
            {signedOut ? 'IDENTIFY YOURSELF' : 'ONE LAST THING'}
          </span>
          <h1 id="access-title">
            {signedOut
              ? 'Sign in. Get slapped.'
              : unavailable
                ? 'Stripe went quiet.'
                : unconfigured
                  ? 'The till is not open yet.'
                  : 'Enter office hours.'}
          </h1>
          <p>
            {signedOut
              ? 'Your account unlocks paid office hours. Your actual chat still stays in this browser.'
              : unavailable
                ? 'We could not verify your subscription. Your account and chat are safe—try again in a moment.'
                : unconfigured
                  ? 'Your account works, but billing has not been connected in this environment yet.'
                  : 'Pressure-test startup ideas with blunt questions, current market research, and one cheap validation experiment.'}
          </p>

          {signedOut ? (
            <Button className="access-button" size="lg" asChild>
              <a href="/api/auth/sign-in?returnPathname=/chat">
                Continue with WorkOS <ArrowUp aria-hidden="true" />
              </a>
            </Button>
          ) : unavailable || unconfigured ? (
            <Button className="access-button" size="lg" asChild>
              <a href="/chat">Try again</a>
            </Button>
          ) : (
            <>
              <div className="price-lockup">
                <strong>$9.99</strong>
                <span>/ month</span>
              </div>
              <ul className="access-list">
                <li>
                  <ShieldCheck aria-hidden="true" /> Unlimited office-hours
                  chats
                </li>
                <li>
                  <Search aria-hidden="true" /> Live market research
                </li>
                <li>
                  <CreditCard aria-hidden="true" /> Cancel anytime in Stripe
                </li>
              </ul>
              <form method="post" action="/api/billing/checkout">
                <Button className="access-button" size="lg" type="submit">
                  Start getting slapped <ArrowUp aria-hidden="true" />
                </Button>
              </form>
              {access.hasCustomer && (
                <form method="post" action="/api/billing/portal">
                  <Button variant="link" type="submit">
                    Manage existing billing
                  </Button>
                </form>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="chat-footer">
        <span>Identity by WorkOS. Billing by Stripe.</span>
        <span>Your chat stays in this browser.</span>
      </footer>
    </div>
  )
}

function ChatLoadingShell() {
  return (
    <div className="chat-page">
      <header className="chat-header">
        <Link className="brand-lockup" to="/" aria-label="Pitchslap home">
          <span className="brand-burst">P!</span>
          <span>pitchslap</span>
        </Link>
        <span className="chat-status">
          <i /> OFFICE HOURS OPEN
        </span>
        <Button
          className="info-button"
          variant="ghost"
          size="icon-sm"
          aria-label="About Pitchslap"
        >
          <CircleHelp aria-hidden="true" />
        </Button>
      </header>

      <main className="chat-stage">
        <div className="chat-scroll-area">
          <div className="chat-empty-state">
            <section className="chat-intro" aria-labelledby="chat-title">
              <Link className="back-home" to="/">
                <ArrowLeft aria-hidden="true" /> Back to the sales pitch
              </Link>
              <span className="chat-kicker">YOUR TURN, FOUNDER</span>
              <h1 id="chat-title">Okay. Pitch me.</h1>
              <p>
                Give me the idea, who has the problem, and why your solution
                wins. Rough is fine. Vague is not.
              </p>
            </section>
            <div className="starter-row" aria-label="Example openings">
              {STARTERS.map((starter) => (
                <Button key={starter} variant="ghost">
                  {starter}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="chat-dock">
          <section className="chat-composer" aria-label="Message composer">
            <div className="composer-topline">
              <span>YOUR PITCH</span>
              <span>0/4000</span>
            </div>
            <Textarea
              rows={3}
              readOnly
              placeholder="We help [specific person] solve [painful problem] by…"
              aria-label="Describe your startup idea"
            />
            <div className="composer-footer">
              <span>ENTER TO SEND · SHIFT+ENTER FOR NEW LINE</span>
              <Button className="send-button" disabled>
                Slap it <ArrowUp aria-hidden="true" />
              </Button>
            </div>
          </section>
        </div>
      </main>

      <footer className="chat-footer">
        <span>OpenAI API + office-hours. That's literally it.</span>
        <span>Your chat stays in this browser.</span>
      </footer>
    </div>
  )
}

function BrowserChat() {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const pendingMessagesRef = useRef<Array<UIMessage> | null>(null)
  const pendingInputRef = useRef('')
  const connection = useMemo(() => fetchServerSentEvents('/api/chat'), [])
  const persistence = useMemo(
    () =>
      localStoragePersistence({
        keyPrefix: 'pitchslap:',
        deserialize: deserializeChatState,
      }),
    [],
  )
  const { messages, sendMessage, isLoading, error, stop, clear, setMessages } =
    useChat({
      connection,
      persistence,
      threadId: CHAT_THREAD,
      queue: 'drop',
      onFinish: () => {
        pendingMessagesRef.current = null
        pendingInputRef.current = ''
      },
    })

  useEffect(() => {
    const previousMessages = pendingMessagesRef.current
    if (!error || !previousMessages) return

    setMessages(previousMessages)
    setInput(pendingInputRef.current)
    pendingMessagesRef.current = null
    pendingInputRef.current = ''
  }, [error, setMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isLoading ? 'instant' : 'smooth',
    })
  }, [messages, isLoading])

  async function submit() {
    const content = input.trim()
    if (!content || isLoading) return
    pendingMessagesRef.current = messages
    pendingInputRef.current = content
    setInput('')
    await sendMessage(content)
  }

  function eraseCase() {
    stop()
    clear()
    setInput('')
  }

  const hasMessages = messages.length > 0

  return (
    <div className="chat-page">
      <header className="chat-header">
        <Link className="brand-lockup" to="/" aria-label="Pitchslap home">
          <span className="brand-burst">P!</span>
          <span>pitchslap</span>
        </Link>
        <span className="chat-status">
          <i /> OFFICE HOURS OPEN
        </span>
        <div className="chat-header-actions">
          <form method="post" action="/api/billing/portal">
            <Button
              className="erase-button"
              variant="ghost"
              size="sm"
              type="submit"
            >
              <CreditCard aria-hidden="true" /> Billing
            </Button>
          </form>
          {hasMessages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="erase-button"
                  variant="ghost"
                  size="sm"
                  onClick={eraseCase}
                >
                  <Trash2 aria-hidden="true" /> Start over
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Delete this chat from this browser.
              </TooltipContent>
            </Tooltip>
          )}
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    className="info-button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="About Pitchslap"
                  >
                    <CircleHelp aria-hidden="true" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>What is this?</TooltipContent>
            </Tooltip>
            <DialogContent className="about-dialog">
              <DialogHeader>
                <DialogTitle>No magic tricks.</DialogTitle>
                <DialogDescription>
                  Pitchslap is an OpenAI API call with one office-hours skill.
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="about-copy">
                <p>
                  Your account is handled by WorkOS and billing by Stripe. The
                  chat transcript stays in your browser and survives reloads.
                </p>
                <p>
                  Your messages go to OpenAI to generate answers. Start over
                  deletes the local transcript.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="info-button"
                variant="ghost"
                size="icon-sm"
                asChild
              >
                <a href="/api/auth/sign-out" aria-label="Sign out">
                  <LogOut aria-hidden="true" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <main className="chat-stage">
        <div className="chat-scroll-area">
          {!hasMessages ? (
            <div className="chat-empty-state">
              <section className="chat-intro" aria-labelledby="chat-title">
                <Link className="back-home" to="/">
                  <ArrowLeft aria-hidden="true" /> Back to the sales pitch
                </Link>
                <span className="chat-kicker">YOUR TURN, FOUNDER</span>
                <h1 id="chat-title">Okay. Pitch me.</h1>
                <p>
                  Give me the idea, who has the problem, and why your solution
                  wins. Rough is fine. Vague is not.
                </p>
              </section>
              <div className="starter-row" aria-label="Example openings">
                {STARTERS.map((starter) => (
                  <Button
                    key={starter}
                    variant="ghost"
                    onClick={() => setInput(starter)}
                  >
                    {starter}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <section
              className="chat-transcript"
              aria-label="Office hours transcript"
            >
              <div className="case-heading">
                <span>YOUR CURRENT IDEA</span>
                <span>SAVED IN THIS BROWSER</span>
              </div>
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  active={
                    isLoading &&
                    index === messages.length - 1 &&
                    message.role === 'assistant'
                  }
                />
              ))}
              {isLoading && messages.at(-1)?.role !== 'assistant' && (
                <div className="thinking-line">
                  Judging your assumptions<span>…</span>
                </div>
              )}
              <div ref={bottomRef} />
            </section>
          )}
        </div>

        <div className="chat-dock">
          <section className="chat-composer" aria-label="Message composer">
            <div className="composer-topline">
              <span>YOUR PITCH</span>
              <span>{input.length}/4000</span>
            </div>
            <Textarea
              value={input}
              maxLength={4000}
              rows={3}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void submit()
                }
              }}
              placeholder="We help [specific person] solve [painful problem] by…"
              aria-label="Describe your startup idea"
            />
            <div className="composer-footer">
              <span>ENTER TO SEND · SHIFT+ENTER FOR NEW LINE</span>
              {isLoading ? (
                <Button className="send-button" onClick={stop}>
                  <Square aria-hidden="true" /> Stop
                </Button>
              ) : (
                <Button
                  className="send-button"
                  disabled={!input.trim()}
                  onClick={() => void submit()}
                >
                  {hasMessages ? 'Send' : 'Slap it'}{' '}
                  <ArrowUp aria-hidden="true" />
                </Button>
              )}
            </div>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              Couldn't reach Pitchslap. Your pitch is back in the box, so you
              can retry it.
            </div>
          )}
        </div>
      </main>

      <footer className="chat-footer">
        <span>OpenAI API + office-hours. That's literally it.</span>
        <span>Your chat stays in this browser.</span>
      </footer>
    </div>
  )
}
