import type { DesignSystem, Page } from '@open-slide/core';
import { createContext, useContext } from 'react';

/* ============================================================
   餐饮盈利突围 · 案例复盘套件（Case-Study Kit）
   6 个案例 · 每个 15 页 · 1920×1080 · 深墨 + 暖金（与 Day1/Day2 同系）
   图片均为占位框，可后续替换为实拍图。
   ------------------------------------------------------------
   每个案例 deck 只需：
     import { buildCaseDeck, design } from '../_casekit/kit';
     const { pages, notes } = buildCaseDeck(data);
     export { design }; export const meta = {...};
     export { notes }; export default pages;
   ============================================================ */

export const design: DesignSystem = {
  palette: { bg: '#15110c', text: '#f4efe6', accent: '#e0a85e' },
  fonts: {
    display:
      "'PingFang SC','Hiragino Sans GB','Microsoft YaHei',system-ui,-apple-system,sans-serif",
    body: "'PingFang SC','Hiragino Sans GB','Microsoft YaHei',system-ui,-apple-system,sans-serif",
  },
  typeScale: { hero: 168, body: 36 },
  radius: 14,
};

const tokens = {
  color: {
    surface: '#211a12',
    surface2: '#2c2317',
    line: '#3a2f22',
    muted: '#a99c87',
    faint: '#6f6453',
    good: '#7bb27e',
    bad: '#d9694e',
    cool: '#6fa7b3',
  },
  space: { padX: 120 },
} as const;

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
} as const;

const keyframes = `
@keyframes rUp { from { opacity:0; transform:translateY(22px);} to {opacity:1; transform:translateY(0);} }
@keyframes rFade { from { opacity:0;} to {opacity:1;} }
@keyframes rGrow { from { transform:scaleX(0);} to { transform:scaleX(1);} }
.r-up { animation:rUp .8s cubic-bezier(.16,1,.3,1) both; }
.r-fade { animation:rFade 1s ease-out both; }
.r-grow { animation:rGrow .9s cubic-bezier(.16,1,.3,1) both; transform-origin:left center; }
`;
const Style = () => <style>{keyframes}</style>;

/* page number is provided per-page (no shared mutable state) */
const SlideCtx = createContext<{ n: number; total: number }>({ n: 0, total: 0 });

/* ─────────── data contract ─────────── */

type Tone = 'good' | 'bad' | 'cool' | 'gold';
type Phase = '诊断' | '重建' | '复制' | '结果';

export interface CaseData {
  id: string; // CASE 01
  archetype: string; // 社区小面馆
  name: string; // 巷口面馆
  /** cover */
  cover: { kicker: string; titleA: string; titleB: string; sub: string; photo: string };
  /** profile stats (4) */
  profile: { stats: { big: string; label: string }[]; note: string; photo: string };
  /** symptoms */
  symptom: { quote: string; cards: { tag: string; t: string; b: string; tone?: Tone }[] };
  /** baseline metrics before (5) */
  baseline: { metrics: { k: string; v: string; tone?: Tone }[]; note: string };
  /** leak bars (5 dims) */
  leak: { bars: { label: string; pct: number; tone?: Tone }[]; verdict: string };
  /** root causes (3) */
  root: { causes: { tag: string; t: string; b: string; tone?: Tone }[]; photo?: string };
  /** rebuild strategy */
  strategy: { model: string; modelNote: string; levers: { t: string; b: string; tone?: Tone }[] };
  /** menu surgery */
  menu: { cut: string; keep: string; add: string; roles: string; note: string; photo: string };
  /** pricing moves */
  pricing: { moves: { item: string; from: string; to: string; why: string }[]; note: string };
  /** execution 30/60/90 */
  execution: { steps: { d: string; t: string; b: string; tone?: Tone }[]; photo: string };
  /** timeline milestones (4) */
  timeline: { milestones: { w: string; t: string }[]; note: string };
  /** results before/after (5) */
  results: { rows: { k: string; before: string; after: string; tone?: Tone }[]; headline: string };
  /** turning point */
  turning: { quote: string; body: string };
  /** replicable takeaways (4) */
  takeaways: { items: { t: string; b: string }[] };
  /** close */
  close: { quote: string; sub: string; photo: string };
}

/* ─────────── primitives ─────────── */

const Footer = ({ left, phase }: { left: string; phase: Phase }) => {
  const { n, total } = useContext(SlideCtx);
  return (
    <div
      style={{
        position: 'absolute',
        left: tokens.space.padX,
        right: tokens.space.padX,
        bottom: 40,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 21,
        color: tokens.color.faint,
        borderTop: `1px solid ${tokens.color.line}`,
        paddingTop: 16,
      }}
    >
      <span>
        <span style={{ color: 'var(--osd-accent)' }}>●</span>{' '}
        <span style={{ color: tokens.color.muted }}>{left}</span>
        <span
          style={{
            marginLeft: 18,
            padding: '3px 12px',
            border: `1px solid ${tokens.color.line}`,
            borderRadius: 999,
            color: tokens.color.muted,
            fontSize: 18,
          }}
        >
          {phase}
        </span>
      </span>
      <span style={{ letterSpacing: '0.06em' }}>
        <span style={{ color: 'var(--osd-text)' }}>{String(n).padStart(2, '0')}</span>
        <span style={{ color: tokens.color.faint }}> / {total}</span>
      </span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    className="r-up"
    style={{ fontSize: 24, fontWeight: 600, color: 'var(--osd-accent)', letterSpacing: '0.22em' }}
  >
    {children}
  </div>
);

const H = ({ children, size = 72 }: { children: React.ReactNode; size?: number }) => (
  <h2
    className="r-up"
    style={{
      fontFamily: 'var(--osd-font-display)',
      fontSize: size,
      fontWeight: 800,
      lineHeight: 1.12,
      margin: '18px 0 0',
      letterSpacing: '-0.01em',
    }}
  >
    {children}
  </h2>
);

const toneColor = (t?: Tone) =>
  t === 'good'
    ? tokens.color.good
    : t === 'bad'
      ? tokens.color.bad
      : t === 'cool'
        ? tokens.color.cool
        : 'var(--osd-accent)';

const Card = ({
  title,
  body,
  tone,
  tag,
}: {
  title: string;
  body: string;
  tone?: Tone;
  tag?: string;
}) => {
  const edge = toneColor(tone);
  return (
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.line}`,
        borderLeft: `5px solid ${edge}`,
        borderRadius: 'var(--osd-radius)',
        padding: '26px 28px',
        flex: 1,
      }}
    >
      {tag ? (
        <div style={{ fontSize: 20, color: edge, fontWeight: 700, letterSpacing: '0.08em' }}>
          {tag}
        </div>
      ) : null}
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: tag ? 8 : 0 }}>{title}</div>
      <div style={{ fontSize: 24, lineHeight: 1.5, color: tokens.color.muted, marginTop: 10 }}>
        {body}
      </div>
    </div>
  );
};

const Stat = ({ big, label, tone }: { big: string; label: string; tone?: Tone }) => (
  <div
    style={{
      flex: 1,
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: 14,
      padding: '26px 22px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 52,
        fontWeight: 900,
        color: toneColor(tone),
      }}
    >
      {big}
    </div>
    <div style={{ fontSize: 22, color: tokens.color.muted, marginTop: 8, lineHeight: 1.4 }}>
      {label}
    </div>
  </div>
);

/* image placeholder — blank, replace later */
const Photo = ({ caption, h = 360 }: { caption: string; h?: number }) => (
  <div
    className="r-fade"
    style={{
      height: h,
      borderRadius: 16,
      border: `2px dashed ${tokens.color.line}`,
      background:
        'repeating-linear-gradient(135deg, rgba(224,168,94,0.05) 0 14px, transparent 14px 28px), var(--osd-surface, #1b150e)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      color: tokens.color.faint,
      position: 'relative',
    }}
  >
    <svg width="58" height="58" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke={tokens.color.muted}
        strokeWidth="1.4"
      />
      <circle cx="8.5" cy="10" r="1.7" stroke={tokens.color.muted} strokeWidth="1.4" />
      <path d="M5 17l4.5-4 3 2.5L16 11l3 3.5" stroke={tokens.color.muted} strokeWidth="1.4" />
    </svg>
    <div style={{ fontSize: 22, color: tokens.color.muted, fontWeight: 600 }}>{caption}</div>
    <div
      style={{
        position: 'absolute',
        top: 14,
        right: 16,
        fontSize: 16,
        letterSpacing: '0.16em',
        color: tokens.color.faint,
        border: `1px solid ${tokens.color.line}`,
        borderRadius: 999,
        padding: '3px 12px',
      }}
    >
      图片占位 · 可替换
    </div>
  </div>
);

/* horizontal bar (for leak chart) */
const Bar = ({ label, pct, tone }: { label: string; pct: number; tone?: Tone }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
    <div style={{ width: 150, fontSize: 26, color: tokens.color.muted, textAlign: 'right' }}>
      {label}
    </div>
    <div
      style={{
        flex: 1,
        height: 30,
        background: tokens.color.surface,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        className="r-grow"
        style={{ width: `${pct}%`, height: '100%', background: toneColor(tone), borderRadius: 8 }}
      />
    </div>
    <div style={{ width: 70, fontSize: 26, fontWeight: 800, color: toneColor(tone) }}>{pct}%</div>
  </div>
);

const PageBase = ({
  left,
  phase,
  children,
}: {
  left: string;
  phase: Phase;
  children: React.ReactNode;
}) => (
  <div
    style={{
      ...fill,
      padding: '88px 120px 128px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Style />
    {children}
    <Footer left={left} phase={phase} />
  </div>
);

const SectionTitle = ({ eyebrow, title }: { eyebrow: string; title: React.ReactNode }) => (
  <>
    <Eyebrow>{eyebrow}</Eyebrow>
    <H>{title}</H>
  </>
);

/* ─────────── 15 slide templates ─────────── */

const left = (c: CaseData) => `${c.id} · ${c.name}`;

const CaseCover = ({ c }: { c: CaseData }) => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateColumns: '1.15fr 1fr',
      alignItems: 'center',
      gap: 80,
      padding: `0 ${tokens.space.padX}px`,
      background:
        'radial-gradient(1100px 700px at 82% 18%, rgba(224,168,94,0.12), transparent 55%), var(--osd-bg)',
    }}
  >
    <Style />
    <div>
      <Eyebrow>
        {c.id} · {c.cover.kicker}
      </Eyebrow>
      <h1
        className="r-up"
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 116,
          fontWeight: 900,
          lineHeight: 1.04,
          margin: '22px 0 0',
        }}
      >
        {c.cover.titleA}
        <br />
        <span style={{ color: 'var(--osd-accent)' }}>{c.cover.titleB}</span>
      </h1>
      <div
        className="r-grow"
        style={{
          width: 200,
          height: 5,
          background: 'var(--osd-accent)',
          borderRadius: 4,
          margin: '34px 0',
        }}
      />
      <p
        className="r-up"
        style={{ fontSize: 34, color: tokens.color.muted, lineHeight: 1.55, maxWidth: 760 }}
      >
        {c.cover.sub}
      </p>
    </div>
    <Photo caption={c.cover.photo} h={560} />
  </div>
);

const CaseProfile = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="诊断">
    <SectionTitle eyebrow="门店档案 · PROFILE" title="先看清这家店长什么样" />
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 40, marginTop: 44 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 18 }}>
          {c.profile.stats.slice(0, 2).map((s) => (
            <Stat key={s.label} big={s.big} label={s.label} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {c.profile.stats.slice(2, 4).map((s) => (
            <Stat key={s.label} big={s.big} label={s.label} />
          ))}
        </div>
        <p style={{ fontSize: 26, color: tokens.color.muted, lineHeight: 1.55, margin: '6px 0 0' }}>
          {c.profile.note}
        </p>
      </div>
      <Photo caption={c.profile.photo} h={440} />
    </div>
  </PageBase>
);

const CaseSymptom = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="诊断">
    <SectionTitle eyebrow="症状 · 老板的原话" title={`“${c.symptom.quote}”`} />
    <div style={{ display: 'flex', gap: 20, marginTop: 48 }}>
      {c.symptom.cards.map((s) => (
        <Card key={s.t} tag={s.tag} title={s.t} body={s.b} tone={s.tone ?? 'bad'} />
      ))}
    </div>
    <p style={{ fontSize: 28, color: tokens.color.muted, marginTop: 44 }}>
      症状不是病因——<b style={{ color: 'var(--osd-accent)' }}>先把数字摆上桌</b>，再找漏在哪。
    </p>
  </PageBase>
);

const CaseBaseline = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="诊断">
    <SectionTitle eyebrow="基线数据 · BEFORE" title="改造前，先把数字摆上桌" />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 18,
        marginTop: 44,
      }}
    >
      {c.baseline.metrics.map((m) => (
        <Stat key={m.k} big={m.v} label={m.k} tone={m.tone} />
      ))}
    </div>
    <p style={{ fontSize: 28, color: tokens.color.muted, marginTop: 40, maxWidth: 1500 }}>
      {c.baseline.note}
    </p>
  </PageBase>
);

const CaseLeak = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="诊断">
    <SectionTitle eyebrow="漏洞定位 · 五维拆解" title="钱从哪一格漏走" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 44 }}>
      {c.leak.bars.map((b) => (
        <Bar key={b.label} label={b.label} pct={b.pct} tone={b.tone} />
      ))}
    </div>
    <p style={{ fontSize: 28, color: tokens.color.muted, marginTop: 36, maxWidth: 1500 }}>
      <b style={{ color: tokens.color.bad }}>最长的那条</b>就是主漏点——{c.leak.verdict}
    </p>
  </PageBase>
);

const CaseRoot = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="诊断">
    <SectionTitle eyebrow="根因分析 · WHY" title="漏的不是钱，是结构" />
    <div style={{ display: 'flex', gap: 20, marginTop: 48 }}>
      {c.root.causes.map((r) => (
        <Card key={r.t} tag={r.tag} title={r.t} body={r.b} tone={r.tone} />
      ))}
    </div>
    <p style={{ fontSize: 28, color: tokens.color.muted, marginTop: 44 }}>
      根因找准，<b style={{ color: 'var(--osd-accent)' }}>重建才有方向</b>——下一步选模型、定结构。
    </p>
  </PageBase>
);

const CaseStrategy = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="重建">
    <SectionTitle eyebrow="重建策略 · MODEL" title="选模型 · 定打法" />
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        marginTop: 40,
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.line}`,
        borderLeft: `5px solid var(--osd-accent)`,
        borderRadius: 14,
        padding: '24px 28px',
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--osd-accent)' }}>
        {c.strategy.model}
      </div>
      <div style={{ fontSize: 26, color: tokens.color.muted, lineHeight: 1.5 }}>
        {c.strategy.modelNote}
      </div>
    </div>
    <div style={{ display: 'flex', gap: 20, marginTop: 24 }}>
      {c.strategy.levers.map((l, i) => (
        <Card key={l.t} tag={`杠杆 ${i + 1}`} title={l.t} body={l.b} tone={l.tone ?? 'good'} />
      ))}
    </div>
  </PageBase>
);

const CaseMenu = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="重建">
    <SectionTitle eyebrow="菜单手术 · 主辅佐引" title="给菜单做手术" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 44 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 18 }}>
          <Stat big={c.menu.cut} label="砍掉 · 拖累毛利" tone="bad" />
          <Stat big={c.menu.keep} label="保留并强化" tone="good" />
          <Stat big={c.menu.add} label="新增 · 补结构" />
        </div>
        <p style={{ fontSize: 26, color: tokens.color.muted, lineHeight: 1.55, margin: 0 }}>
          <b style={{ color: 'var(--osd-accent)' }}>主辅佐引：</b>
          {c.menu.roles}
        </p>
        <p style={{ fontSize: 26, color: tokens.color.muted, lineHeight: 1.55, margin: 0 }}>
          {c.menu.note}
        </p>
      </div>
      <Photo caption={c.menu.photo} h={420} />
    </div>
  </PageBase>
);

const CasePricing = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="重建">
    <SectionTitle eyebrow="定价重构 · PRICING" title="价格带这样调" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 }}>
      {c.pricing.moves.map((m) => (
        <div
          key={m.item}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr 1.6fr',
            alignItems: 'center',
            gap: 24,
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.line}`,
            borderRadius: 12,
            padding: '20px 28px',
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700 }}>{m.item}</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            <span style={{ color: tokens.color.faint }}>{m.from}</span>
            <span style={{ color: 'var(--osd-accent)' }}> → {m.to}</span>
          </div>
          <div style={{ fontSize: 24, color: tokens.color.muted, lineHeight: 1.45 }}>{m.why}</div>
        </div>
      ))}
    </div>
    <p style={{ fontSize: 26, color: tokens.color.muted, marginTop: 30 }}>{c.pricing.note}</p>
  </PageBase>
);

const CaseExecution = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="复制">
    <SectionTitle eyebrow="落地执行 · SOP" title="30 / 60 / 90 天，谁做什么" />
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, marginTop: 44 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {c.execution.steps.map((s) => (
          <div
            key={s.t}
            style={{
              display: 'flex',
              gap: 22,
              alignItems: 'flex-start',
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.line}`,
              borderLeft: `5px solid ${toneColor(s.tone ?? 'cool')}`,
              borderRadius: 12,
              padding: '18px 24px',
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: toneColor(s.tone ?? 'cool'),
                whiteSpace: 'nowrap',
                minWidth: 96,
              }}
            >
              {s.d}
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{s.t}</div>
              <div
                style={{ fontSize: 23, color: tokens.color.muted, marginTop: 6, lineHeight: 1.45 }}
              >
                {s.b}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Photo caption={c.execution.photo} h={460} />
    </div>
  </PageBase>
);

const CaseTimeline = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="复制">
    <SectionTitle eyebrow="时间线 · TIMELINE" title="改造发生在这几周" />
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginTop: 56 }}>
      {c.timeline.milestones.map((m, i) => (
        <div key={m.w} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: 'var(--osd-accent)',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                height: 3,
                background:
                  i < c.timeline.milestones.length - 1 ? tokens.color.line : 'transparent',
              }}
            />
          </div>
          <div style={{ paddingRight: 28 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--osd-accent)' }}>{m.w}</div>
            <div
              style={{ fontSize: 25, color: tokens.color.muted, marginTop: 10, lineHeight: 1.5 }}
            >
              {m.t}
            </div>
          </div>
        </div>
      ))}
    </div>
    <p style={{ fontSize: 28, color: tokens.color.muted, marginTop: 56, maxWidth: 1500 }}>
      {c.timeline.note}
    </p>
  </PageBase>
);

const CaseResults = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="结果">
    <SectionTitle eyebrow="结果 · BEFORE → AFTER" title={c.results.headline} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          gap: 24,
          padding: '0 28px',
          fontSize: 22,
          color: tokens.color.faint,
          letterSpacing: '0.06em',
        }}
      >
        <div>指标</div>
        <div>改造前</div>
        <div>改造后</div>
      </div>
      {c.results.rows.map((r) => (
        <div
          key={r.k}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr',
            alignItems: 'center',
            gap: 24,
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.line}`,
            borderRadius: 12,
            padding: '18px 28px',
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700 }}>{r.k}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: tokens.color.faint }}>{r.before}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: toneColor(r.tone ?? 'good') }}>
            {r.after}
          </div>
        </div>
      ))}
    </div>
  </PageBase>
);

const CaseTurning = ({ c }: { c: CaseData }) => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${tokens.space.padX}px`,
      background:
        'radial-gradient(1100px 600px at 24% 30%, rgba(224,168,94,0.12), transparent 58%), var(--osd-bg)',
    }}
  >
    <Style />
    <Eyebrow>关键转折 · TURNING POINT</Eyebrow>
    <h2
      className="r-up"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 84,
        fontWeight: 900,
        lineHeight: 1.12,
        margin: '22px 0 0',
        maxWidth: 1500,
      }}
    >
      “{c.turning.quote}”
    </h2>
    <p
      className="r-up"
      style={{
        fontSize: 32,
        color: tokens.color.muted,
        marginTop: 32,
        maxWidth: 1300,
        lineHeight: 1.6,
      }}
    >
      {c.turning.body}
    </p>
    <Footer left={left(c)} phase="结果" />
  </div>
);

const CaseTakeaways = ({ c }: { c: CaseData }) => (
  <PageBase left={left(c)} phase="结果">
    <SectionTitle eyebrow="可复制要点 · PLAYBOOK" title="哪些能搬到你的店" />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
        marginTop: 44,
      }}
    >
      {c.takeaways.items.map((t, i) => (
        <div
          key={t.t}
          style={{
            display: 'flex',
            gap: 22,
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.line}`,
            borderRadius: 14,
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 46,
              fontWeight: 900,
              color: 'var(--osd-accent)',
              lineHeight: 1,
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{t.t}</div>
            <div style={{ fontSize: 24, color: tokens.color.muted, marginTop: 8, lineHeight: 1.5 }}>
              {t.b}
            </div>
          </div>
        </div>
      ))}
    </div>
  </PageBase>
);

const CaseClose = ({ c }: { c: CaseData }) => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      alignItems: 'center',
      gap: 80,
      padding: `0 ${tokens.space.padX}px`,
      background:
        'radial-gradient(1000px 700px at 80% 80%, rgba(123,178,126,0.12), transparent 58%), var(--osd-bg)',
    }}
  >
    <Style />
    <div>
      <Eyebrow>{c.id} · 收尾</Eyebrow>
      <h1
        className="r-up"
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 92,
          fontWeight: 900,
          lineHeight: 1.1,
          margin: '22px 0 0',
        }}
      >
        {c.close.quote}
      </h1>
      <p
        className="r-up"
        style={{
          fontSize: 32,
          color: tokens.color.muted,
          marginTop: 30,
          maxWidth: 760,
          lineHeight: 1.6,
        }}
      >
        {c.close.sub}
      </p>
    </div>
    <Photo caption={c.close.photo} h={520} />
  </div>
);

/* ─────────── deck factory ─────────── */

export function buildCaseDeck(c: CaseData): { pages: Page[]; notes: (string | undefined)[] } {
  const seq: { Comp: (p: { c: CaseData }) => React.JSX.Element; note: string }[] = [
    { Comp: CaseCover, note: `封面｜${c.name}（${c.archetype}）。一句话亮结果：${c.cover.sub}` },
    { Comp: CaseProfile, note: '诊断｜门店档案，建立画面感：业态/面积/座位/客单/营业额。' },
    { Comp: CaseSymptom, note: '诊断｜用老板原话切入，三个症状卡片，强调“症状≠病因”。' },
    { Comp: CaseBaseline, note: '诊断｜改造前的基线数字，标红异常项，为后面对比做锚点。' },
    { Comp: CaseLeak, note: '诊断｜五维漏洞定位条形图，指出主漏点。呼应 Day1 乘法模型。' },
    { Comp: CaseRoot, note: '诊断｜把症状翻译成结构性根因（3 条），引出重建方向。' },
    {
      Comp: CaseStrategy,
      note: '重建｜选模型（生存/扩张/防御）+ 3 个杠杆。呼应 Day1 商业模式选型。',
    },
    { Comp: CaseMenu, note: '重建｜菜单手术：砍/留/增 + 主辅佐引重排。呼应 Day2 菜单工程。' },
    { Comp: CasePricing, note: '重建｜价格带调整逐项讲，给出 why。呼应 Day2 双峰定价/锚点。' },
    { Comp: CaseExecution, note: '复制｜30/60/90 落地动作，明确谁做什么，强调靠流程不靠人。' },
    { Comp: CaseTimeline, note: '复制｜改造时间线里程碑，给出节奏感。' },
    { Comp: CaseResults, note: '结果｜改造前后对比表，逐行念差值，制造冲击。' },
    { Comp: CaseTurning, note: '结果｜一句关键转折/复盘金句 + 解释，沉淀认知。' },
    { Comp: CaseTakeaways, note: '结果｜4 条可复制要点，帮学员迁移到自己的店。' },
    { Comp: CaseClose, note: `收尾｜金句收束：${c.close.quote}。引到“你的店能不能复制”。` },
  ];
  const total = seq.length;
  const pages = seq.map((s, i) => {
    const Numbered: Page = () => (
      <SlideCtx.Provider value={{ n: i + 1, total }}>
        <s.Comp c={c} />
      </SlideCtx.Provider>
    );
    return Numbered;
  });
  return { pages, notes: seq.map((s) => s.note) };
}
