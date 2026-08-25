import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowDown, ArrowRight, Check, Search, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

const steps = [
  {
    number: '01',
    icon: Sparkles,
    title: 'Make your claim',
    copy: 'Tell it the idea, customer, and why anyone should care.',
    color: 'story-card-pink',
  },
  {
    number: '02',
    icon: Search,
    title: 'Face the receipts',
    copy: 'It questions the premise and checks the current market.',
    color: 'story-card-blue',
  },
  {
    number: '03',
    icon: Check,
    title: 'Run one real test',
    copy: 'Leave with one cheap experiment, not a 40-page strategy.',
    color: 'story-card-yellow',
  },
]

function Home() {
  return (
    <div className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link className="brand-lockup" to="/" aria-label="Pitchslap home">
          <span className="brand-burst">P!</span>
          <span>pitchslap</span>
        </Link>
        <div className="nav-side">
          <span className="honesty-chip">API + 1 SKILL</span>
          <Button className="nav-cta" asChild>
            <Link to="/chat">
              Slap my idea <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </nav>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-kicker">
              Startup office hours, minus the ego
            </span>
            <h1 id="hero-title">
              Your pitch
              <br />
              needs a <span>slap.</span>
            </h1>
            <p>
              A blunt little AI that challenges your startup idea, checks the
              market, and gives you one test worth running.
            </p>
            <div className="hero-actions">
              <Button className="hero-cta" size="lg" asChild>
                <Link to="/chat">
                  Slap my idea <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button className="how-link" variant="ghost" size="lg" asChild>
                <a href="#how-it-works">
                  How it works <ArrowDown aria-hidden="true" />
                </a>
              </Button>
            </div>
            <p className="micro-proof">
              No signup. No database. No pitch-deck theatre.
            </p>
          </div>

          <div
            className="hero-art"
            aria-label="Pitchslap mascot ready to test a pitch"
          >
            <div className="sticker sticker-no-fluff">NO FLUFF</div>
            <div className="sticker sticker-receipts">SHOW RECEIPTS</div>
            <img
              src="/assets/pitchslap-mascot.webp"
              alt="A cartoon pitch deck carrying an oversized verdict stamp"
            />
          </div>
        </section>

        <div className="truth-strip" aria-hidden="true">
          <span>QUESTION THE PREMISE</span>
          <i>✦</i>
          <span>SEARCH THE MARKET</span>
          <i>✦</i>
          <span>RUN THE CHEAP TEST</span>
          <i>✦</i>
          <span>KILL BAD IDEAS EARLY</span>
        </div>

        <section
          className="story"
          id="how-it-works"
          aria-labelledby="story-title"
        >
          <div className="section-heading">
            <span>THE WHOLE PROCESS</span>
            <h2 id="story-title">Three moves. Zero innovation cosplay.</h2>
          </div>
          <div className="story-board">
            {steps.map(({ number, icon: Icon, title, copy, color }) => (
              <article className={`story-card ${color}`} key={number}>
                <div className="story-number">{number}</div>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="honest-section" aria-labelledby="honest-title">
          <div className="honest-sticker">SERIOUSLY.</div>
          <div className="honest-copy">
            <span>WHAT'S UNDER THE HOOD?</span>
            <h2 id="honest-title">An API call with one good skill.</h2>
          </div>
          <div className="honest-details">
            <p>
              OpenAI API plus an office-hours prompt that knows how to push on
              shaky premises. That's literally the product.
            </p>
            <ul>
              <li>
                <Check aria-hidden="true" /> Current market research
              </li>
              <li>
                <Check aria-hidden="true" /> Browser-only chat history
              </li>
              <li>
                <Check aria-hidden="true" /> One concrete validation test
              </li>
            </ul>
          </div>
        </section>

        <section className="final-cta" aria-labelledby="final-title">
          <span className="final-scribble" aria-hidden="true">
            BE BRAVE
          </span>
          <h2 id="final-title">
            Enough nodding.
            <br />
            Let's test the damn thing.
          </h2>
          <Button className="final-button" size="lg" asChild>
            <Link to="/chat">
              Enter office hours <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="landing-footer">
        <Link className="brand-lockup" to="/">
          <span className="brand-burst">P!</span>
          <span>pitchslap</span>
        </Link>
        <span>Built in public. Optimism sold separately.</span>
        <a
          href="https://github.com/bustakar/pitchslap"
          target="_blank"
          rel="noreferrer"
        >
          Source ↗
        </a>
      </footer>
    </div>
  )
}
