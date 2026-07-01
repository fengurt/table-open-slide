import Link from 'next/link';

import styles from './site-home.module.css';

const DEMO_URL = process.env.NEXT_PUBLIC_SLIDE_DEMO_URL ?? 'http://localhost:5173';

function demoHref(path: string) {
  return `${DEMO_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

const BOOK_SAMPLES = [
  {
    id: 'table-samples',
    title: 'The Content Graph',
    subtitle: 'Why tables beat scattered documents',
    kicker: 'Chapter 2 · about 4 min read',
    paragraphs: [
      {
        key: 'drift',
        text: 'When every surface owns its own copy, drift is inevitable. Marketing rewrites a line; the slide deck still says last quarter; the brief quotes a PDF nobody can find. A content graph fixes that by making each idea addressable once, then referenced everywhere it belongs.',
      },
      {
        key: 'blocks',
        text: 'Structured blocks—not unstructured blobs—are how humans and machines agree on what changed. You edit the block; bindings decide whether it appears in a landing page, a speaker deck, or a partner memo. The reader sees coherent prose; the system sees stable identifiers.',
      },
    ],
  },
  {
    id: 'llm-fundamentals',
    title: 'Field Notes on Models',
    subtitle: 'Latency, limits, and when to trust output',
    kicker: 'Essay · about 6 min read',
    paragraphs: [
      {
        key: 'mirrors',
        text: 'Large language models are mirrors with momentum: they finish patterns confidently whether or not the pattern is true. The craft is not “asking nicely”; it is constraining the surface area—schemas, citations, human checkpoints—and measuring failure modes the way you measure outages.',
      },
      {
        key: 'verification',
        text: 'Treat completions as drafts bound for verification. Put immutable facts in your CMS, let models assemble narrative around them, and keep localization explicit so translators—and auditors—know exactly what shipped.',
      },
    ],
  },
  {
    id: 'open-slide-launch',
    title: 'Present Like You Mean It',
    subtitle: 'Notes, pacing, and a single storyline',
    kicker: 'Craft primer · about 5 min read',
    paragraphs: [
      {
        key: 'tempo',
        text: 'Slides fail when they pretend to be documents squeezed sideways. A strong deck is a tempo instrument: one claim per beat, visuals that earn their pixels, speaker notes that hold what you refuse to put on screen.',
      },
      {
        key: 'rigor',
        text: 'Pair narrative slack with operational rigor. When prose lives in Payload and decks bind into React canvases, you rehearse against live strings—not pasted placeholders—and ship corrections once.',
      },
    ],
  },
  {
    id: 'claude-code-intro',
    title: 'The Coding Partner Room',
    subtitle: 'How agents fit beside deliberate engineers',
    kicker: 'Guide extract · about 5 min read',
    paragraphs: [
      {
        key: 'memory',
        text: 'Pair-programming with an agent is less “delegate everything” and more “expand short-term working memory.” You keep architectural veto; it drafts migrations, traces regressions, and proposes shapes faster than you can type—but merges remain yours.',
      },
      {
        key: 'reviewability',
        text: 'Good workflows bias toward reviewability: small diffs, explicit prompts locked beside specs, and a CMS trail when marketing-facing strings touch engineering repos.',
      },
    ],
  },
] as const;

const SLIDE_EDITIONS = [
  { id: 'table-samples', label: 'Table samples' },
  { id: 'vercel-ai-sdk', label: 'Vercel AI SDK' },
  { id: 'nextjs-ppr-cache', label: 'Next.js PPR' },
  { id: 'ssh-explained', label: 'SSH explained' },
  { id: 'material-design-2014', label: 'Material Design 2014' },
  { id: 'harness-engineering', label: 'Harness engineering' },
] as const;

export default function HomePage() {
  return (
    <>
      <a href="#main" className={styles.skipLink}>
        Skip to main content
      </a>
      <main id="main" className={styles.wrap} tabIndex={-1}>
        <header className={styles.nav}>
          <span className={styles.brand}>Table Content OS</span>
          <nav className={styles.navLinks} aria-label="On this page">
            <a href="#samples">Samples</a>
            <a href="#reading-tips">Reading</a>
            <a href="#slides">Slide editions</a>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>

        <section className={styles.introBand} aria-labelledby="hero-heading">
          <p className={styles.eyebrow}>For readers first</p>
          <h1 id="hero-heading" className={styles.heroTitle}>
            One manuscript. Many surfaces.
          </h1>
          <div className={styles.readingIntro}>
            <p>
              Payload holds long-form strings per locale; open-slide turns selected narratives into
              decks without cloning copy by hand. Skim the excerpts below as if they lived in your
              CMS—the spacing and measure follow typical print ergonomics so tired eyes move
              smoothly line to line.
            </p>
            <p>
              When you need projection mode, each sample lists a matching{' '}
              <strong className={styles.introStrong}>slide edition</strong> that binds to the same
              folder IDs used in the demo app.
            </p>
          </div>
          <div className={styles.ctaRow}>
            <Link href="/admin" className={styles.btnPrimary}>
              Open admin
            </Link>
            <a
              href={demoHref('/')}
              className={styles.btnGhost}
              target="_blank"
              rel="noopener noreferrer"
            >
              Browse decks (slides UI)
            </a>
          </div>
        </section>

        <section id="samples" className={styles.samplesRegion} aria-labelledby="samples-heading">
          <div className={styles.samplesInner}>
            <h2 id="samples-heading" className={styles.samplesHeading}>
              Book samples
            </h2>
            <p className={styles.samplesDeck}>
              Excerpts are illustrative—they show how Payload-hosted prose can feel on the web
              before it splits into slides or sibling surfaces.
            </p>
          </div>
          <ul className={styles.bookGrid}>
            {BOOK_SAMPLES.map((book) => (
              <li key={book.id} className={styles.bookGridItem}>
                <article className={styles.bookSample} aria-labelledby={`book-${book.id}-title`}>
                  <div className={styles.bookSpine} aria-hidden="true" />
                  <div className={styles.bookBody}>
                    <p className={styles.bookKicker}>{book.kicker}</p>
                    <h3 id={`book-${book.id}-title`} className={styles.bookTitle}>
                      {book.title}
                    </h3>
                    <p className={styles.bookSubtitle}>{book.subtitle}</p>
                    <div className={styles.bookProse}>
                      {book.paragraphs.map((paragraph) => (
                        <p key={`${book.id}-${paragraph.key}`}>{paragraph.text}</p>
                      ))}
                    </div>
                    <p className={styles.bookEdition}>
                      <a
                        href={demoHref(`/s/${encodeURIComponent(book.id)}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open slide edition
                      </a>
                      <span aria-hidden="true"> · </span>
                      <a
                        href={demoHref(`/s/${encodeURIComponent(book.id)}/presenter`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Presenter console
                      </a>
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section id="reading-tips" className={styles.readerGuide} aria-labelledby="reading-heading">
          <h2 id="reading-heading" className={styles.readerGuideTitle}>
            Reading comfort built into layout
          </h2>
          <div className={styles.readerColumns}>
            <div className={styles.readerNote}>
              <h3>Measure & rhythm</h3>
              <p>
                Body excerpts stay near sixty-eight characters per line where screens allow—about
                what paperback pages use—so saccades stay predictable.
              </p>
            </div>
            <div className={styles.readerNote}>
              <h3>Contrast zones</h3>
              <p>
                Samples sit on warm paper behind dark chrome navigation so long passages feel
                separate from UI chrome, matching how readers focus in physical books.
              </p>
            </div>
            <div className={styles.readerNote}>
              <h3>Motion & focus</h3>
              <p>
                Background glow respects reduced-motion preferences; keyboard users get a skip link
                and visible focus rings on every actionable element.
              </p>
            </div>
          </div>
        </section>

        <section id="slides" aria-labelledby="slides-heading">
          <div className={styles.sectionHead}>
            <h2 id="slides-heading">Slide editions in the demo</h2>
            <p>
              Horizontal reel for fast scanning—hop into canvas view when you want presenter pacing
              instead of paginated reading.
            </p>
          </div>
          <ul className={styles.roadshowTrack}>
            {SLIDE_EDITIONS.map((deck) => (
              <li key={deck.id} className={styles.roadshowItem}>
                <a
                  href={demoHref(`/s/${encodeURIComponent(deck.id)}`)}
                  className={styles.slideCard}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open slide canvas for ${deck.label}`}
                >
                  <span className={styles.slideCardAccent} aria-hidden="true" />
                  <div className={styles.slideMeta}>
                    <span>Slide edition</span>
                    <h3>{deck.label}</h3>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <footer className={styles.footer}>
          <span>Table Content OS · Payload {process.env.NEXT_PUBLIC_PAYLOAD_VERSION ?? '3.x'}</span>
          <span>
            Demo host: <code className={styles.footerCode}>NEXT_PUBLIC_SLIDE_DEMO_URL</code>
          </span>
          <Link href="/admin">Sign in →</Link>
        </footer>
      </main>
    </>
  );
}
