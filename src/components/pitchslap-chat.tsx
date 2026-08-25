import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchServerSentEvents,
  localStoragePersistence,
  useChat,
} from '@tanstack/ai-react'
import type { UIMessage } from '@tanstack/ai-react'
import { ArrowUp, CircleHelp, Search, Square, Trash2 } from 'lucide-react'
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
        'message',
        `message-${message.role}`,
        verdict && 'message-verdict',
      )}
    >
      <div className="message-label">
        <span>
          {message.role === 'user'
            ? 'FOUNDER STATEMENT'
            : verdict
              ? 'TARGET DISPOSITION'
              : 'INTERROGATOR'}
        </span>
        <span>
          {message.role === 'user' ? 'INPUT' : active ? 'LIVE' : 'FILED'}
        </span>
      </div>
      {searched && (
        <div className="research-flag">
          <Search aria-hidden="true" /> WEB RECON DEPLOYED
        </div>
      )}
      {message.role === 'assistant' ? (
        <div className="prose-terminal">
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
  const [booted, setBooted] = useState(false)
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
    const timer = window.setTimeout(() => setBooted(true), 850)
    void import('botid/client/core').then(({ initBotId }) => {
      initBotId({ protect: [{ path: '/api/chat', method: 'POST' }] })
    })
    return () => window.clearTimeout(timer)
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
    <div className="app-shell">
      <div
        className={cn('boot-screen', booted && 'boot-screen-done')}
        aria-hidden="true"
      >
        <span>PITCHSLAP SYSTEMS</span>
        <span>OFFICE-HOURS MODULE........ONLINE</span>
        <span>OPTIMISM FILTER............ARMED</span>
      </div>

      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Pitchslap home">
          PITCH<span>SLAP</span>
          <small>.XYZ</small>
        </a>
        <div className="header-actions">
          {hasMessages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="erase-button"
                  variant="ghost"
                  size="sm"
                  onClick={eraseCase}
                >
                  <Trash2 aria-hidden="true" /> ERASE CASE
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Deletes this case from this browser.
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
                <DialogTitle>PITCHSLAP IS NOT MAGIC.</DialogTitle>
                <DialogDescription>
                  It is an OpenAI API call with one office-hours skill and a
                  suspicious amount of amber CSS.
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="about-copy">
                <p>
                  No account. No database. Your case file stays in this browser
                  and survives reloads.
                </p>
                <p>
                  Your messages are sent to OpenAI to generate answers. Erase
                  Case deletes the local transcript.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className={cn('terminal', hasMessages && 'terminal-active')}>
        {!hasMessages ? (
          <section className="intake" aria-labelledby="intake-title">
            <div className="eyebrow">
              <span /> UNVALIDATED OBJECT DETECTED
            </div>
            <h1 id="intake-title">
              YOUR IDEA IS
              <br />
              <em>PROBABLY WRONG.</em>
            </h1>
            <p className="lede">Good. Finding out now is cheaper.</p>
            <div className="protocol-grid" aria-label="Interrogation protocol">
              <div>
                <b>01</b>
                <span>State the idea</span>
              </div>
              <div>
                <b>02</b>
                <span>Face evidence</span>
              </div>
              <div>
                <b>03</b>
                <span>Run one test</span>
              </div>
            </div>
          </section>
        ) : (
          <section className="transcript" aria-label="Interrogation transcript">
            <div className="case-heading">
              <span>CASE 001 / ACTIVE</span>
              <span>LOCAL RECORD</span>
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
                INTERROGATOR IS REVIEWING THE EVIDENCE<span>_</span>
              </div>
            )}
            <div ref={bottomRef} />
          </section>
        )}

        <section className="composer" aria-label="Message composer">
          <div className="composer-topline">
            <span>SUBMIT STATEMENT</span>
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
            placeholder="Describe the company before optimism contaminates the record."
            aria-label="Describe your startup idea"
          />
          <div className="composer-footer">
            <span>ENTER TO SEND · SHIFT+ENTER FOR NEW LINE</span>
            {isLoading ? (
              <Button className="send-button" onClick={stop}>
                <Square aria-hidden="true" /> ABORT
              </Button>
            ) : (
              <Button
                className="send-button"
                disabled={!input.trim()}
                onClick={() => void submit()}
              >
                {hasMessages ? 'RESPOND' : 'BEGIN INTERROGATION'}{' '}
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
            TRANSMISSION FAILED. The terminal may be missing its API key or the
            network is down.
          </div>
        )}
      </main>

      <footer>
        <span>OPENAI API + OFFICE-HOURS. THAT’S LITERALLY IT.</span>
        <a
          href="https://github.com/bustakar/pitchslap"
          target="_blank"
          rel="noreferrer"
        >
          SOURCE CODE ↗
        </a>
      </footer>
    </div>
  )
}
