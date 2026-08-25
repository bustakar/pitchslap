import { useEffect, useMemo, useRef, useState } from 'react'
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
  Search,
  Square,
  Trash2,
} from 'lucide-react'
import { Streamdown } from 'streamdown'
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
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const STARTERS = [
  'I want to build an AI agent for…',
  'I found a painful workflow where…',
  'I have users, but they are not paying…',
]

const CHAT_THREAD = 'case-file'

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
          <Streamdown isAnimating={active}>{text}</Streamdown>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{text}</p>
      )}
    </article>
  )
}

export function PitchslapChat() {
  const [input, setInput] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const connection = useMemo(() => fetchServerSentEvents('/api/chat'), [])
  const persistence = useMemo(
    () => localStoragePersistence({ keyPrefix: 'pitchslap:' }),
    [],
  )
  const { messages, sendMessage, isLoading, error, stop, clear } = useChat(
    hydrated
      ? { connection, persistence, threadId: CHAT_THREAD, queue: 'drop' }
      : { connection, queue: 'drop' },
  )

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isLoading ? 'instant' : 'smooth',
    })
  }, [messages, isLoading])

  async function submit() {
    const content = input.trim()
    if (!content || isLoading) return
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
                  No account. No database. This chat stays in your browser and
                  survives reloads.
                </p>
                <p>
                  Your messages go to OpenAI to generate answers. Start over
                  deletes the local transcript.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className={cn('chat-stage', hasMessages && 'chat-stage-active')}>
        {!hasMessages ? (
          <section className="chat-intro" aria-labelledby="chat-title">
            <Link className="back-home" to="/">
              <ArrowLeft aria-hidden="true" /> Back to the sales pitch
            </Link>
            <span className="chat-kicker">YOUR TURN, FOUNDER</span>
            <h1 id="chat-title">Okay. Pitch me.</h1>
            <p>
              Give me the idea, who has the problem, and why your solution wins.
              Rough is fine. Vague is not.
            </p>
          </section>
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

        {!hasMessages && (
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
        )}

        {error && (
          <div className="error-banner" role="alert">
            Couldn't reach Pitchslap. The API key may be missing, or the network
            is down.
          </div>
        )}
      </main>

      <footer className="chat-footer">
        <span>OpenAI API + office-hours. That's literally it.</span>
        <span>Your chat stays in this browser.</span>
      </footer>
    </div>
  )
}
