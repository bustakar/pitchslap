import { Link } from '@tanstack/react-router'

type LegalPageProps = {
  children: React.ReactNode
  eyebrow: string
  title: string
}

export function LegalPage({ children, eyebrow, title }: LegalPageProps) {
  return (
    <div className="legal-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link className="brand-lockup" to="/" aria-label="Pitchslap home">
          <span className="brand-burst">P!</span>
          <span>pitchslap</span>
        </Link>
        <Link className="legal-back" to="/">
          Back home
        </Link>
      </nav>

      <main className="legal-shell">
        <header>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>Last updated August 25, 2026</p>
        </header>
        <article className="legal-copy">{children}</article>
      </main>

      <footer className="landing-footer legal-footer">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <a href="mailto:hello@karelbusta.dev">hello@karelbusta.dev</a>
      </footer>
    </div>
  )
}
