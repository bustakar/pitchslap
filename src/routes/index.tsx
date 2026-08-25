import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowDown, ArrowRight, Check, Search, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { captureAnalyticsEvent } from '@/lib/analytics'

const pageTitle = 'Pitchslap | Your pitch needs a slap'
const description =
  'Pressure-test your startup idea with blunt AI office hours, current market research, and one concrete validation experiment.'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: pageTitle },
      { name: 'description', content: description },
      {
        name: 'robots',
        content: 'index, follow, max-image-preview:large',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Pitchslap' },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: 'https://pitchslap.xyz/' },
      {
        property: 'og:image',
        content: 'https://pitchslap.xyz/assets/pitchslap-og.png',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/png' },
      {
        property: 'og:image:alt',
        content: 'Pitchslap, your startup pitch needs a slap',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: pageTitle },
      { name: 'twitter:description', content: description },
      {
        name: 'twitter:image',
        content: 'https://pitchslap.xyz/assets/pitchslap-og.png',
      },
      {
        name: 'twitter:image:alt',
        content: 'Pitchslap, your startup pitch needs a slap',
      },
      {
        'script:ld+json': {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Pitchslap',
          url: 'https://pitchslap.xyz/',
          description,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: {
            '@type': 'Offer',
            price: 9.99,
            priceCurrency: 'USD',
            url: 'https://pitchslap.xyz/chat',
          },
        },
      },
    ],
    links: [{ rel: 'canonical', href: 'https://pitchslap.xyz/' }],
  }),
  component: Home,
})

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
  const trackChatClick = (placement: 'nav' | 'hero' | 'final') => {
    captureAnalyticsEvent('landing_cta_clicked', { placement })
  }

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
            <Link to="/chat" onClick={() => trackChatClick('nav')}>
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
                <Link to="/chat" onClick={() => trackChatClick('hero')}>
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
              $9.99/month. Cancel anytime. No pitch-deck theatre.
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
              srcSet="/assets/pitchslap-mascot-480.webp 480w, /assets/pitchslap-mascot-720.webp 720w, /assets/pitchslap-mascot-960.webp 960w, /assets/pitchslap-mascot.webp 1254w"
              sizes="(max-width: 680px) 92vw, (max-width: 980px) 72vw, min(720px, 57vw)"
              alt="A cartoon pitch deck carrying an oversized verdict stamp"
              width="1254"
              height="1254"
              fetchPriority="high"
              decoding="async"
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
                <Check aria-hidden="true" /> Account-synced case files
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
            <Link to="/chat" onClick={() => trackChatClick('final')}>
              Enter office hours <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="final-price">$9.99/month · cancel anytime</p>
        </section>
      </main>

      <footer className="landing-footer">
        <Link className="brand-lockup" to="/">
          <span className="brand-burst">P!</span>
          <span>pitchslap</span>
        </Link>
        <span>Built in public. Optimism sold separately.</span>
        <div className="footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a
            href="https://github.com/bustakar/pitchslap"
            target="_blank"
            rel="noreferrer"
          >
            Source ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
