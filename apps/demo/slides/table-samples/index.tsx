import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import type { CSSProperties } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0f1419', text: '#e8ecf1', accent: '#5eead4' },
  fonts: {
    display: "'Instrument Sans', 'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },
  typeScale: { hero: 200, body: 32 },
  radius: 12,
};

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  padding: '96px 120px',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
};

const rail = (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 8,
      background: 'linear-gradient(180deg, var(--osd-accent), #38bdf8)',
    }}
    aria-hidden="true"
  />
);

const Eyebrow = ({ children }: { children: string }) => (
  <div
    style={{
      fontSize: 18,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      color: 'var(--osd-accent)',
      fontWeight: 600,
      marginBottom: 28,
    }}
  >
    {children}
  </div>
);

const H1 = ({ children }: { children: string }) => (
  <h1
    style={{
      margin: 0,
      fontFamily: 'var(--osd-font-display)',
      fontSize: 'var(--osd-type-hero)',
      lineHeight: 0.95,
      letterSpacing: '-0.04em',
      fontWeight: 700,
      maxWidth: '85%',
    }}
  >
    {children}
  </h1>
);

const Lead = ({ children }: { children: string }) => (
  <p
    style={{
      margin: '48px 0 0',
      maxWidth: 920,
      fontSize: 40,
      lineHeight: 1.45,
      color: 'rgba(232,236,241,0.78)',
    }}
  >
    {children}
  </p>
);

const Cover = () => (
  <div style={fill}>
    {rail}
    <Eyebrow>Sample deck</Eyebrow>
    <H1>Table Content OS — slide surface</H1>
    <Lead>
      Fixed 1920 × 1080 pages you can duplicate. Pair with Payload keys when you wire the CMS.
    </Lead>
    <div
      style={{
        position: 'absolute',
        right: 120,
        bottom: 96,
        width: 320,
        height: 320,
        borderRadius: 24,
        border: '2px solid rgba(94,234,212,0.35)',
        background: 'radial-gradient(circle at 30% 30%, rgba(94,234,212,0.15), transparent 55%)',
      }}
      aria-hidden="true"
    />
  </div>
);

const Agenda = () => (
  <div style={fill}>
    {rail}
    <Eyebrow>Outline</Eyebrow>
    <H1>What this deck demonstrates</H1>
    <ul
      style={{
        margin: '56px 0 0',
        padding: 0,
        listStyle: 'none',
        fontSize: 36,
        lineHeight: 1.75,
        maxWidth: 1100,
      }}
    >
      {[
        'Minimal layout tokens (margins, rail accent, type ramp)',
        'Multiple exported pages in one `index.tsx`',
        'Copy-paste starting point before CMS binding',
      ].map((item) => (
        <li
          key={item}
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'baseline',
            borderBottom: '1px solid rgba(232,236,241,0.08)',
            padding: '20px 0',
          }}
        >
          <span style={{ color: 'var(--osd-accent)', fontWeight: 700 }}>◆</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const TwoColumn = () => (
  <div style={fill}>
    {rail}
    <Eyebrow>Layout</Eyebrow>
    <H1>Two-column split</H1>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginTop: 56 }}>
      <div
        style={{
          borderRadius: 'var(--osd-radius)',
          border: '1px solid rgba(232,236,241,0.12)',
          padding: 48,
          background: 'rgba(15,20,25,0.6)',
        }}
      >
        <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 44, marginBottom: 20 }}>
          Narrative
        </div>
        <p style={{ margin: 0, fontSize: 28, lineHeight: 1.55, color: 'rgba(232,236,241,0.75)' }}>
          Use the left column for story, roadmap, or thesis. Keep line length under ~55 characters
          equivalent at this font size.
        </p>
      </div>
      <div
        style={{
          borderRadius: 'var(--osd-radius)',
          border: '1px solid rgba(94,234,212,0.25)',
          padding: 48,
          background: 'linear-gradient(160deg, rgba(56,189,248,0.08), rgba(94,234,212,0.06))',
        }}
      >
        <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 44, marginBottom: 20 }}>
          Evidence
        </div>
        <p style={{ margin: 0, fontSize: 28, lineHeight: 1.55, color: 'rgba(232,236,241,0.85)' }}>
          Right side for metrics, quotes, code, or diagrams. Align baselines with the companion
          block for a calmer grid.
        </p>
      </div>
    </div>
  </div>
);

const Checklist = () => (
  <div style={fill}>
    {rail}
    <Eyebrow>Ship checklist</Eyebrow>
    <H1>Before you present</H1>
    <div style={{ marginTop: 48, display: 'grid', gap: 20, maxWidth: 1000 }}>
      {[
        { label: 'Run `pnpm dev` in apps/demo', done: true },
        { label: 'Enter present mode and walk every transition', done: true },
        { label: 'Optional: `pnpm dev:up` for CMS + sibling surfaces', done: false },
      ].map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            fontSize: 30,
            padding: '22px 28px',
            borderRadius: 'var(--osd-radius)',
            background: 'rgba(232,236,241,0.05)',
            border: '1px solid rgba(232,236,241,0.08)',
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '2px solid var(--osd-accent)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 20,
              color: 'var(--osd-accent)',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {row.done ? '✓' : ''}
          </span>
          {row.label}
        </div>
      ))}
    </div>
  </div>
);

const Closing = () => (
  <div style={fill}>
    {rail}
    <Eyebrow>Next</Eyebrow>
    <H1>Duplicate this folder</H1>
    <Lead>
      {`Copy slides/table-samples to a new id, rename exports, and connect strings to Payload via <T contentKey="…" /> when your keys exist.`}
    </Lead>
    <div
      style={{
        marginTop: 64,
        fontFamily: 'var(--osd-font-body)',
        fontSize: 26,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(232,236,241,0.45)',
      }}
    >
      open-slide · table-content-os
    </div>
  </div>
);

export const meta: SlideMeta = { title: 'Table samples — layout starters' };
export default [Cover, Agenda, TwoColumn, Checklist, Closing] satisfies Page[];
