import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import { createContext, useContext } from 'react';

/** Authoring helper: lets us attach a presenter note next to each page; the
 *  ordered `export const notes` below is what Presenter View actually reads. */
type WithNotes = Page & { notes?: string };

/* Page number is injected from the ordered list below (1-based) so that
 * inserting/reordering slides never requires hand-renumbering. */
const PageNumCtx = createContext(0);
let TOTAL_PAGES = 0;

/* ============================================================
   餐饮盈利突围 · 单店复制模型 — Day 2（重建② + 复制 + 结营 + 附录）
   1920×1080 · worldclass editorial · 深墨 + 暖金
   页脚 = 模块 · 半天 · NN/总页 + 计划时长（页码 + 节奏）
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
  meta: { totalPages: 32, deck: '餐饮盈利突围 · Day 2' },
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

/* ─────────── reusable bits (matching Day 1) ─────────── */

const Footer = ({ mod, half, min }: { n?: number; mod: string; half: string; min?: string }) => {
  const n = useContext(PageNumCtx);
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
        <span style={{ color: tokens.color.muted }}>{mod}</span> · {half}
        {min ? (
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
            计划 {min}
          </span>
        ) : null}
      </span>
      <span style={{ letterSpacing: '0.06em' }}>
        <span style={{ color: 'var(--osd-text)' }}>{String(n).padStart(2, '0')}</span>
        <span style={{ color: tokens.color.faint }}> / {TOTAL_PAGES}</span>
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
      margin: '20px 0 0',
      letterSpacing: '-0.01em',
    }}
  >
    {children}
  </h2>
);

const Lead = ({ children }: { children: React.ReactNode }) => (
  <p
    className="r-up"
    style={{ fontSize: 34, lineHeight: 1.55, color: tokens.color.muted, maxWidth: 1300, margin: 0 }}
  >
    {children}
  </p>
);

const Card = ({
  title,
  body,
  tone,
  tag,
}: {
  title: string;
  body: string;
  tone?: 'good' | 'bad' | 'gold' | 'cool';
  tag?: string;
}) => {
  const edge =
    tone === 'good'
      ? tokens.color.good
      : tone === 'bad'
        ? tokens.color.bad
        : tone === 'cool'
          ? tokens.color.cool
          : 'var(--osd-accent)';
  return (
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.line}`,
        borderLeft: `5px solid ${edge}`,
        borderRadius: 'var(--osd-radius)',
        padding: '28px 30px',
        flex: 1,
      }}
    >
      {tag ? (
        <div style={{ fontSize: 20, color: edge, fontWeight: 700, letterSpacing: '0.08em' }}>
          {tag}
        </div>
      ) : null}
      <div style={{ fontSize: 30, fontWeight: 700, marginTop: tag ? 8 : 0 }}>{title}</div>
      <div style={{ fontSize: 25, lineHeight: 1.5, color: tokens.color.muted, marginTop: 12 }}>
        {body}
      </div>
    </div>
  );
};

const Pill = ({ children, tone }: { children: React.ReactNode; tone?: 'gold' | 'good' }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '8px 18px',
      borderRadius: 999,
      fontSize: 24,
      fontWeight: 700,
      color: tone === 'good' ? tokens.color.good : 'var(--osd-accent)',
      border: `1px solid ${tone === 'good' ? tokens.color.good : 'var(--osd-accent)'}`,
    }}
  >
    {children}
  </span>
);

const Beat = ({ label }: { label: string }) => (
  <span
    style={{
      fontSize: 22,
      color: tokens.color.faint,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: 999,
      padding: '6px 16px',
    }}
  >
    {label}
  </span>
);
const BeatStrip = ({ active }: { active: 0 | 1 | 2 }) => {
  const labels = ['讲逻辑', 'AI 实操', '当场产出'];
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      {labels.map((l, i) => (
        <span key={l} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {i === active ? <Pill>{l}</Pill> : <Beat label={l} />}
          {i < 2 ? <span style={{ color: tokens.color.faint }}>→</span> : null}
        </span>
      ))}
    </div>
  );
};

const AICol = ({ title, items }: { title: string; items: string[] }) => (
  <div
    style={{
      flex: 1,
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: 14,
      padding: '28px 30px',
    }}
  >
    <div style={{ fontSize: 27, fontWeight: 800, color: 'var(--osd-accent)' }}>{title}</div>
    <ul
      style={{
        margin: '18px 0 0',
        paddingLeft: 26,
        fontSize: 25,
        lineHeight: 1.7,
        color: tokens.color.muted,
      }}
    >
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  </div>
);

const Divider = ({
  phase,
  title,
  sub,
  half,
}: {
  phase: string;
  title: string;
  sub: string;
  n?: number;
  half: string;
}) => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${tokens.space.padX}px`,
      background:
        'radial-gradient(1200px 600px at 78% 18%, rgba(224,168,94,0.10), transparent 60%), var(--osd-bg)',
    }}
  >
    <Style />
    <Eyebrow>{phase}</Eyebrow>
    <h1
      className="r-up"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 132,
        fontWeight: 900,
        margin: '18px 0 24px',
        lineHeight: 1.04,
      }}
    >
      {title}
    </h1>
    <div
      className="r-grow"
      style={{ width: 200, height: 5, background: 'var(--osd-accent)', borderRadius: 4 }}
    />
    <p
      className="r-up"
      style={{ fontSize: 36, color: tokens.color.muted, marginTop: 30, maxWidth: 1200 }}
    >
      {sub}
    </p>
    <Footer mod="阶段" half={half} />
  </div>
);

const PageBase = ({
  children,
  mod,
  half,
  min,
}: {
  children: React.ReactNode;
  n?: number;
  mod: string;
  half: string;
  min?: string;
}) => (
  <div
    style={{
      ...fill,
      padding: '92px 120px 132px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Style />
    {children}
    <Footer mod={mod} half={half} min={min} />
  </div>
);

/* ============================================================
   PAGES
   ============================================================ */

/* 01 — Cover */
const Cover: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${tokens.space.padX}px`,
      background:
        'radial-gradient(1100px 700px at 80% 12%, rgba(224,168,94,0.12), transparent 55%), var(--osd-bg)',
    }}
  >
    <Style />
    <Eyebrow>餐饮盈利突围 · 单店复制模型 · DAY 2</Eyebrow>
    <h1
      className="r-up"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 150,
        fontWeight: 900,
        margin: '20px 0 0',
        lineHeight: 1.02,
      }}
    >
      把菜单变成
      <span style={{ color: 'var(--osd-accent)' }}>印钞机</span>
    </h1>
    <p
      className="r-up"
      style={{
        fontSize: 38,
        color: tokens.color.muted,
        marginTop: 32,
        maxWidth: 1300,
        lineHeight: 1.5,
      }}
    >
      重建② → 复制：菜单工程 · 主辅佐引 · 双峰定价 · 九宫格 · 连锁化 · 60 天承诺。
    </p>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 22 }}>
      菜单不是点菜工具，是你无声的销售员。
    </p>
    <Footer n={1} mod="开场" half="Day2 上午" />
  </div>
);
(Cover as WithNotes).notes =
  '0:00–0:05｜Day2 开场。昨天找漏洞、定方向，今天全是工具落地，每个模块都带走一张图纸。';

/* 02 — 昨日复盘 */
const Recap: Page = () => (
  <PageBase n={2} mod="昨日复盘" half="Day2 上午" min="30min">
    <Eyebrow>昨日作业复盘</Eyebrow>
    <H>菜单的几个通病</H>
    <div style={{ display: 'flex', gap: 22, marginTop: 48 }}>
      <Card
        tag="通病 1"
        tone="bad"
        title="主不主，辅不辅"
        body="主菜有 5 个 = 没有主君，顾客不知道点啥。"
      />
      <Card
        tag="通病 2"
        tone="bad"
        title="全是辅菜，没主菜"
        body="菜单全是贵菜，没人敢点，转化崩。"
      />
      <Card tag="通病 3" tone="bad" title="高毛利被埋没" body="该赚钱的菜放在没人看的角落。" />
    </div>
    <p style={{ fontSize: 32, color: tokens.color.muted, marginTop: 44 }}>
      今天，把这些乱七八糟的菜，<b style={{ color: 'var(--osd-accent)' }}>填进工具表</b>
      里——算着卖，不再随便搭。
    </p>
  </PageBase>
);
(Recap as WithNotes).notes =
  '0:00–0:30｜展示 3 张打码学员菜单，点名通病。引出今天的工具：菜单工程 + 主辅佐引。';

/* 03 — 重建② divider */
const PhaseRebuild2: Page = () => (
  <Divider
    phase="阶段二 · REBUILD ②"
    title="重建 — 造印钞机"
    sub="M7 菜单工程矩阵 · M8 主辅佐引 · M9 双峰定价 —— 让每道菜都有明确的财务角色。"
    n={3}
    half="Day2 上午"
  />
);
(PhaseRebuild2 as WithNotes).notes =
  '过场｜三步：先分类（四象限）、再定角色（主辅佐引）、最后定价（双峰）。';

/* 04 — M7 cover */
const M7Cover: Page = () => (
  <PageBase n={4} mod="M7 菜单工程矩阵" half="Day2 上午" min="75min">
    <Eyebrow>MODULE 07 · 重建</Eyebrow>
    <H size={84}>产品组合诊断 · 菜单工程矩阵</H>
    <Lead>销量 × 毛利的四象限，再加上「标准化」第三维——揪出最危险的「连锁陷阱款」。</Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M7Cover as WithNotes).notes =
  '0:00–0:05｜目标：从「菜越多越好」转向「算着留」。引出四象限手术刀。';

/* 05 — 四象限 visual */
const Quad = ({
  title,
  sub,
  tone,
  area,
}: {
  title: string;
  sub: string;
  tone: 'good' | 'bad' | 'gold' | 'cool';
  area: string;
}) => {
  const c =
    tone === 'good'
      ? tokens.color.good
      : tone === 'bad'
        ? tokens.color.bad
        : tone === 'cool'
          ? tokens.color.cool
          : 'var(--osd-accent)';
  return (
    <div
      style={{
        gridArea: area,
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.line}`,
        borderTop: `5px solid ${c}`,
        borderRadius: 14,
        padding: '22px 24px',
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 800, color: c }}>{title}</div>
      <div style={{ fontSize: 23, color: tokens.color.muted, marginTop: 8, lineHeight: 1.4 }}>
        {sub}
      </div>
    </div>
  );
};
const MenuQuadrant: Page = () => (
  <PageBase n={5} mod="M7 菜单工程矩阵" half="Day2 上午" min="75min">
    <Eyebrow>招牌信息图 · 菜单工程四象限</Eyebrow>
    <H>给菜单做手术</H>
    <div style={{ display: 'flex', gap: 22, marginTop: 40, alignItems: 'stretch' }}>
      <div
        style={{
          width: 40,
          height: 540,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 22,
            letterSpacing: '0.12em',
            color: tokens.color.faint,
            whiteSpace: 'nowrap',
          }}
        >
          毛利　低 ↓ 高
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 16,
            gridTemplateAreas: '"q1 q2" "q3 q4"',
            height: 540,
          }}
        >
          <Quad area="q2" title="明星（高销高毛）" sub="命根子，重点陈列，别动。" tone="good" />
          <Quad
            area="q1"
            title="潜力 / 问号（低销高毛）"
            sub="值得推：换版位、改话术、做组合。"
            tone="gold"
          />
          <Quad area="q4" title="引流（高销低毛）" sub="保留但控量：用它带毛利款。" tone="cool" />
          <Quad
            area="q3"
            title="瘦狗 / 淘汰（低销低毛）"
            sub="直接砍——哪怕是你最爱吃的菜。"
            tone="bad"
          />
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: 22,
            letterSpacing: '0.12em',
            color: tokens.color.faint,
            marginTop: 14,
          }}
        >
          销量　低 → 高
        </div>
      </div>
    </div>
  </PageBase>
);
(MenuQuadrant as WithNotes).notes =
  '0:05–0:25｜四象限逐格讲。重点：瘦狗直接砍、潜力款靠陈列/组合救活。';

/* 06 — 标准化第三维 + 圈砍3捧2 */
const M7Third: Page = () => (
  <PageBase n={6} mod="M7 菜单工程矩阵" half="Day2 上午" min="75min">
    <Eyebrow>第三维 · 标准化</Eyebrow>
    <H>连锁陷阱款</H>
    <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
      <Card
        tone="bad"
        tag="连锁陷阱款"
        title="高销 + 高毛 + 难标准化"
        body="单店明星，一开分店就翻车：极度依赖某位厨师 / 难复制的工序。"
      />
      <Card
        tone="good"
        tag="可复制款"
        title="高毛 + 易标准化"
        body="SOP≤3 步、去厨师化——这才是能复制的利润担当。"
      />
    </div>
    <p style={{ fontSize: 32, color: 'var(--osd-text)', marginTop: 44 }}>
      实操：在你的菜单上圈出 <b style={{ color: tokens.color.bad }}>3 道该砍</b> +{' '}
      <b style={{ color: tokens.color.good }}>2 道该捧</b>。给 20 分钟，看谁下手最狠。
    </p>
  </PageBase>
);
(M7Third as WithNotes).notes =
  '0:25–0:55｜引入标准化第三维（单店赚钱≠能复制）。实操圈 3 砍 2 捧，助教标记错配学员。';

/* 07 — M7 AI + 产出 */
const M7AI: Page = () => (
  <PageBase n={7} mod="M7 菜单工程矩阵" half="Day2 上午" min="75min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ⑦</Eyebrow>
        <H>菜单工程矩阵</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
      <AICol
        title="喂给 AI"
        items={['每道菜：销量 / 售价 / 毛利', '是否依赖特定厨师/工序', '近 3 个月动销']}
      />
      <AICol
        title="AI 产出"
        items={['三维自动归类（含连锁陷阱款）', '砍 / 捧 / 改的处理建议', '组合套餐建议']}
      />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 40 }}>
      当场产出：<b style={{ color: 'var(--osd-text)' }}>《产品结构优化清单》</b>（下周回去砍哪 3
      道、推哪 3 道）。
    </p>
  </PageBase>
);
(M7AI as WithNotes).notes = '0:55–1:15｜AI 把整本菜单一次分类。强调它把「舍不得」变成「算清楚」。';

/* 08 — M8 cover */
const M8Cover: Page = () => (
  <PageBase n={8} mod="M8 主辅佐引" half="Day2 上午" min="90min">
    <Eyebrow>MODULE 08 · 重建 · 主工具 ②</Eyebrow>
    <H size={84}>产品角色矩阵 · 主辅佐引</H>
    <Lead>不讲中医，只讲赚钱。每道菜都有明确的财务角色：引流、赚毛利、拉客单、勾复购。</Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M8Cover as WithNotes).notes =
  '0:00–0:08｜本模块是 Day2 主工具②。先讲四角色，再用辣可可产品地图坐实。';

/* 09 — 主辅佐引 visual */
const Role = ({ z, duty, fin }: { z: string; duty: string; fin: string }) => (
  <div
    style={{
      flex: 1,
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.line}`,
      borderTop: '5px solid var(--osd-accent)',
      borderRadius: 14,
      padding: '26px 24px',
    }}
  >
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 58,
        fontWeight: 900,
        color: 'var(--osd-accent)',
      }}
    >
      {z}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{duty}</div>
    <div style={{ fontSize: 23, color: tokens.color.muted, marginTop: 12, lineHeight: 1.45 }}>
      {fin}
    </div>
  </div>
);
const RoleMatrix: Page = () => (
  <PageBase n={9} mod="M8 主辅佐引" half="Day2 上午" min="90min">
    <Eyebrow>招牌信息图 · 四角色</Eyebrow>
    <H>主 · 辅 · 佐 · 引</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 48 }}>
      <Role
        z="主"
        duty="认知 / 引流担当"
        fin="强认知招牌，80% 桌桌必点；流量型卖低价，利润型卖高价。"
      />
      <Role z="辅" duty="毛利发动机" fin="高毛利（≥65%）配菜/饮品，与主强搭配，是真正赚钱的。" />
      <Role z="佐" duty="客单拉升器" fin="加价换购、填补空白时段；狙击竞品、填价格带空白。" />
      <Role z="引" duty="复购钩子" fin="外卖小零食、第二份半价；低价高频，提升进店与回头。" />
    </div>
  </PageBase>
);
(RoleMatrix as WithNotes).notes =
  '0:08–0:25｜四角色逐个讲清财务目标。强调「主」不一定赚钱，它是拉流量的。';

/* 10 — 辣可可产品地图 */
const MapRow = ({
  z,
  name,
  price,
  gm,
  note,
}: {
  z: string;
  name: string;
  price: string;
  gm: string;
  note: string;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: 12,
      padding: '18px 26px',
    }}
  >
    <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--osd-accent)', width: 56 }}>
      {z}
    </span>
    <span style={{ fontSize: 28, fontWeight: 800, width: 230 }}>{name}</span>
    <span style={{ fontSize: 26, width: 130, color: 'var(--osd-text)' }}>{price}</span>
    <span style={{ fontSize: 24, width: 150, color: tokens.color.muted }}>毛利 {gm}</span>
    <span style={{ fontSize: 24, color: tokens.color.muted, flex: 1 }}>{note}</span>
  </div>
);
const RoleCase: Page = () => (
  <PageBase n={10} mod="M8 主辅佐引" half="Day2 上午" min="90min">
    <Eyebrow>案例 · 辣可可产品地图</Eyebrow>
    <H>同一本菜单，四种分工</H>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 38 }}>
      <MapRow z="主" name="黄牛肉" price="69 元" gm="57%" note="不指望它赚大钱，用来拉流量" />
      <MapRow z="辅" name="花龙" price="89 元" gm="67%" note="占比 3%→8%，一年多赚几十万" />
      <MapRow z="佐" name="有机土白菜" price="29 元" gm="—" note="凑单神器，拉客单" />
      <MapRow z="引" name="虾仁水蒸蛋" price="22 元" gm="—" note="复购钩子，下次还点它" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 36 }}>
      只要把<b style={{ color: 'var(--osd-accent)' }}>辅类</b>
      销量占比抬一点，利润就上一个台阶——这就是结构的力量。
    </p>
  </PageBase>
);
(RoleCase as WithNotes).notes =
  '0:25–0:45｜用辣可可的真实数字讲「结构红利」。花龙 3%→8% 是全场记忆点。';

/* 11 — M8 配比 + AI + 产出 */
const M8AI: Page = () => (
  <PageBase n={11} mod="M8 主辅佐引" half="Day2 上午" min="90min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ⑧ · 主工具 ②</Eyebrow>
        <H>产品角色 + 单店/连锁配比</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 44 }}>
      <AICol
        title="喂给 AI"
        items={['现有菜按角色初填', '门店模式（生存/扩张/防御）', '目标客单与毛利']}
      />
      <AICol
        title="AI 产出"
        items={[
          '每道菜的角色判定 + 缺位提醒',
          '单店 vs 连锁的角色配比',
          '补位建议（缺「佐」就设计凑单）',
        ]}
      />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 38 }}>
      当场产出：<b style={{ color: 'var(--osd-text)' }}>《主辅佐引产品地图》</b>
      ——填进去，看哪里空了。
    </p>
  </PageBase>
);
(M8AI as WithNotes).notes =
  '0:45–1:30｜实操：打开产品地图模板，先把菜按角色填进去，再看缺位。助教检查角色填错（如把引流当辅）。';

/* 12 — M9 cover */
const M9Cover: Page = () => (
  <PageBase n={12} mod="M9 价格带结构" half="Day2 上午" min="60min">
    <Eyebrow>MODULE 09 · 重建</Eyebrow>
    <H size={84}>价格带结构 · 双峰定价</H>
    <Lead>菜填好了，怎么定价？记住双峰带：低价带抢客、高价带赚钱，中间价格带是死路。</Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M9Cover as WithNotes).notes = '0:00–0:05｜定价不靠勇气靠结构。先立「双峰」心智，再讲陷阱。';

/* 13 — M 型双峰价格带 */
const PriceBand: Page = () => (
  <PageBase n={13} mod="M9 价格带结构" half="Day2 上午" min="60min">
    <Eyebrow>招牌信息图 · M 型双峰</Eyebrow>
    <H>南城香的两座峰</H>
    <div style={{ marginTop: 30 }}>
      <svg
        viewBox="0 0 1180 440"
        style={{ width: 1180, height: 440 }}
        role="img"
        aria-label="M型双峰价格带曲线"
      >
        <title>M型双峰价格带</title>
        {/* axis */}
        <line x1="60" y1="380" x2="1140" y2="380" stroke={tokens.color.line} strokeWidth="2" />
        {/* M curve */}
        <polyline
          points="80,360 240,120 420,300 590,330 760,300 940,120 1100,360"
          fill="none"
          stroke="#e0a85e"
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* peak labels */}
        <circle cx="240" cy="120" r="9" fill="#7bb27e" />
        <circle cx="940" cy="120" r="9" fill="#e0a85e" />
        <circle cx="590" cy="330" r="9" fill="#d9694e" />
        <text x="240" y="92" textAnchor="middle" fill="#7bb27e" fontSize="28" fontWeight="800">
          低价带 · 抢客
        </text>
        <text x="240" y="412" textAnchor="middle" fill="#a99c87" fontSize="24">
          主食 8–12 元
        </text>
        <text x="940" y="92" textAnchor="middle" fill="#e0a85e" fontSize="28" fontWeight="800">
          高价带 · 赚钱
        </text>
        <text x="940" y="412" textAnchor="middle" fill="#a99c87" fontSize="24">
          荤菜 10–15 元（溢价）
        </text>
        <text x="590" y="372" textAnchor="middle" fill="#d9694e" fontSize="26" fontWeight="800">
          中间死亡带
        </text>
      </svg>
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 8 }}>
      千万不要把价格定在中间——那是<b style={{ color: tokens.color.bad }}>死路</b>。
    </p>
  </PageBase>
);
(PriceBand as WithNotes).notes =
  '0:05–0:25｜画 M 曲线。南城香主食 8-12 抢客、荤菜 10-15 赚钱。中间带不上不下。';

/* 14 — 三个定价陷阱 + 外卖 */
const M9Traps: Page = () => (
  <PageBase n={14} mod="M9 价格带结构" half="Day2 上午" min="60min">
    <Eyebrow>定价三陷阱 + 外卖溢价</Eyebrow>
    <H>别宰客，要分层</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
      <Card tone="bad" tag="陷阱 1" title="天价锚点" body="强行推最贵的，顾客算计你，关系崩。" />
      <Card tone="bad" tag="陷阱 2" title="全线居中" body="挤在中间死亡带，没记忆点。" />
      <Card tone="bad" tag="陷阱 3" title="不敢加价" body="该溢价的招牌不敢动，把利润让出去。" />
    </div>
    <div style={{ marginTop: 26 }}>
      <Pill tone="good">
        外卖客单必须比堂食高 20%–40%（覆盖包装费 + 平台抽成）；堂食卖单点，外卖卖套餐
      </Pill>
    </div>
  </PageBase>
);
(M9Traps as WithNotes).notes =
  '0:25–0:40｜三陷阱 + 外卖溢价规则。互动：重定 3 个核心产品价格（引流款定多少？）。';

/* 15 — 四表合一 + AI + 产出 */
const M9AI: Page = () => (
  <PageBase n={15} mod="M9 价格带结构" half="Day2 上午" min="60min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ⑨ · 收口：四表合一</Eyebrow>
        <H>定价 + 四表合一</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={2} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
      <Card tag="表 1" title="生死线" body="保本与目标毛利" tone="cool" />
      <Card tag="表 2" title="角色地图" body="主辅佐引配比" />
      <Card tag="表 3" title="价格带" body="双峰 + 跨城容差" tone="good" />
      <Card tag="表 4" title="竞争卡位" body="商圈空白带" />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 36 }}>
      AI 产出双峰价格带 + 跨城价格容差；当场产出{' '}
      <b style={{ color: 'var(--osd-text)' }}>《价格带调整方案》</b>，四表合一成「上午成果」。
    </p>
  </PageBase>
);
(M9AI as WithNotes).notes =
  '0:40–1:00｜AI 生成双峰建议与跨城容差。把四张表订在一起 = 上午重建成果，午后用于落地。';

/* 16 — 复制 divider */
const PhaseReplicate: Page = () => (
  <Divider
    phase="阶段三 · REPLICATE"
    title="复制 — 落地 · 离场"
    sub="M10 九宫格陈列 · M11 连锁化诊断 —— 把「老板的能力」变成「店的规矩」，抽走你也转得动。"
    n={16}
    half="Day2 下午"
  />
);
(PhaseReplicate as WithNotes).notes =
  '过场｜下午主题：从「能赚钱」到「能复制」。核心问题——抽走你本人，店还转得动吗？';

/* 17 — M10 cover */
const M10Cover: Page = () => (
  <PageBase n={17} mod="M10 九宫格陈列" half="Day2 下午" min="75min">
    <Eyebrow>MODULE 10 · 复制</Eyebrow>
    <H size={84}>菜单陈列优化 · 九宫格</H>
    <Lead>菜单即货架，顾客的眼睛走 Z 型动线。黄金视线区，必须放你的主君款。</Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M10Cover as WithNotes).notes = '0:00–0:05｜菜单是无声的销售员。先讲货架/动线，再讲九宫格热区。';

/* 18 — 九宫格热区 */
const NineGrid: Page = () => (
  <PageBase n={18} mod="M10 九宫格陈列" half="Day2 下午" min="75min">
    <Eyebrow>招牌信息图 · 3×3 九宫格</Eyebrow>
    <H>黄金视线区</H>
    <div style={{ display: 'flex', gap: 56, marginTop: 36, alignItems: 'center' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 180px)',
          gridTemplateRows: 'repeat(3, 150px)',
          gap: 12,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const center = i === 4;
          return (
            <div
              key={`cell-${i}`}
              style={{
                background: center ? 'var(--osd-accent)' : tokens.color.surface,
                color: center ? '#1a130a' : tokens.color.faint,
                border: `1px solid ${center ? 'var(--osd-accent)' : tokens.color.line}`,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                fontSize: center ? 26 : 22,
                fontWeight: center ? 800 : 500,
                textAlign: 'center',
                whiteSpace: 'pre-line',
                padding: 8,
              }}
            >
              {center ? '黄金视线区\n放主君款' : '边位'}
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }}>
        <ul
          style={{
            fontSize: 30,
            lineHeight: 1.8,
            paddingLeft: 28,
            color: tokens.color.muted,
            margin: 0,
          }}
        >
          <li>中间红区：翻开第一眼，放主君款。</li>
          <li>两侧：辅类毛利款。</li>
          <li>绝不放：高毛利却无人点的菜（会被埋没）。</li>
        </ul>
      </div>
    </div>
  </PageBase>
);
(NineGrid as WithNotes).notes =
  '0:05–0:25｜九宫格中心=黄金视线区。提醒别把高毛利款埋在边角。实操：主菜放中间、辅菜放两侧。';

/* 19 — 五种版位错误 + 双菜单 */
const M10Errors: Page = () => (
  <PageBase n={19} mod="M10 九宫格陈列" half="Day2 下午" min="75min">
    <Eyebrow>双菜单 · 堂食 vs 外卖</Eyebrow>
    <H>同店两套打法</H>
    <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
      <Card
        tag="堂食菜单"
        title="现做 / 新鲜 · 卖单点"
        body="突出体验与招牌，引导现场加点升级。"
        tone="good"
      />
      <Card
        tag="外卖菜单"
        title="套餐 + 凑单 · 客单 +20–40%"
        body="结构化套餐覆盖包装费与抽成，话术与堂食一致。"
        tone="cool"
      />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      画出你的<b style={{ color: 'var(--osd-text)' }}>双菜单结构差异表</b>
      ：堂食主打什么？外卖主打什么？
    </p>
  </PageBase>
);
(M10Errors as WithNotes).notes = '0:25–0:45｜双菜单实操。强调外卖必须单独设计，不是把堂食搬上线。';

/* 20 — 四个一工程 + AI + 产出 */
const M10AI: Page = () => (
  <PageBase n={20} mod="M10 九宫格陈列" half="Day2 下午" min="75min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ⑩ · 四个一工程</Eyebrow>
        <H>菜单版位 + 物料</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
      <Card tag="一套" title="产品语言屋" body="别写「秘制传承」，要写「每天卖出 300 份」" />
      <Card tag="一个" title="三端统一菜单" body="堂食/外卖/海报话术一致" tone="cool" />
      <Card tag="一组" title="终端海报" body="3 秒让人看懂你卖啥" tone="good" />
      <Card tag="一组" title="活动节奏" body="周 / 月 / 季度活动" />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 36 }}>
      AI 据销量热力 + 标准化给版位方案；当场产出
      <b style={{ color: 'var(--osd-text)' }}>九宫格版位图</b>，回去一周内换掉物料。
    </p>
  </PageBase>
);
(M10AI as WithNotes).notes =
  '0:45–1:15｜四个一工程：菜单只是开始，物料三端统一。实操写下「每天卖300份」那道菜的卖点，助教收。';

/* 21 — M11 cover */
const M11Cover: Page = () => (
  <PageBase n={21} mod="M11 连锁化诊断" half="Day2 下午" min="75min">
    <Eyebrow>MODULE 11 · 复制 · 主工具 ③</Eyebrow>
    <H size={84}>连锁化诊断 · 可复制性三要素</H>
    <Lead>把「盐少许」变成「盐 5 克」。抽走你本人，店还转得动吗？这才是连锁的起点。</Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M11Cover as WithNotes).notes =
  '0:00–0:08｜本模块主工具③ + AI 核心演示。核心拷问：去厨师化、去老板化。';

/* 22 — 三要素 */
const Meter = ({ label, sub, w }: { label: string; sub: string; w: number }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 30, fontWeight: 800 }}>{label}</div>
    <div style={{ fontSize: 23, color: tokens.color.muted, margin: '8px 0 16px', lineHeight: 1.4 }}>
      {sub}
    </div>
    <div
      style={{ height: 22, background: tokens.color.surface, borderRadius: 8, overflow: 'hidden' }}
    >
      <div
        className="r-grow"
        style={{ width: `${w}%`, height: '100%', background: 'var(--osd-accent)', opacity: 0.85 }}
      />
    </div>
  </div>
);
const ChainTriad: Page = () => (
  <PageBase n={22} mod="M11 连锁化诊断" half="Day2 下午" min="75min">
    <Eyebrow>招牌信息图 · 可复制性三要素</Eyebrow>
    <H>能复制 = 不靠你</H>
    <div style={{ display: 'flex', gap: 40, marginTop: 56 }}>
      <Meter label="标准化" sub="消除对你/某个厨师的依赖（SOP）" w={70} />
      <Meter label="数字化" sub="数据驱动，不靠记忆与经验" w={55} />
      <Meter label="模型验证" sub="单店模型经得起复算" w={80} />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 48 }}>
      三个验证问题：换个厨师会变味吗？换个店长还转吗？把你抽走，模型还成立吗？
    </p>
  </PageBase>
);
(ChainTriad as WithNotes).notes =
  '0:08–0:25｜三要素 = 标准化/数字化/模型验证。三个验证问题直击「能不能离开你」。';

/* 23 — SOP + 二店测算 */
const M11SOP: Page = () => (
  <PageBase n={23} mod="M11 连锁化诊断" half="Day2 下午" min="75min">
    <Eyebrow>SOP 与扩张测算</Eyebrow>
    <H>「盐少许」 → 「盐 5 克」</H>
    <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
      <Card
        tone="bad"
        tag="不可复制"
        title="盐少许 · 火候看感觉"
        body="换个厨师就变味，全靠老师傅的手。"
      />
      <Card
        tone="good"
        tag="可复制"
        title="盐 5 克 · 90 秒出餐"
        body="傻瓜式 SOP，新手也能做出老味道。"
      />
    </div>
    <p style={{ fontSize: 32, color: tokens.color.muted, marginTop: 44 }}>
      用第一天的模型算<b style={{ color: 'var(--osd-text)' }}>二店账</b>
      ：很多人发现——现在的模式根本不适合开分店，先把自己救活。
    </p>
  </PageBase>
);
(M11SOP as WithNotes).notes =
  '0:25–0:45｜SOP 量化对照。二店测算常给人当头一棒：先稳单店模型再谈扩张。';

/* 24 — M11 AI core demo + 产出 */
const M11AI: Page = () => (
  <PageBase n={24} mod="M11 连锁化诊断" half="Day2 下午" min="75min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ⑪ · 主工具 ③ · 核心演示</Eyebrow>
        <H>连锁化诊断 + SOP 生成</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 44 }}>
      <AICol
        title="喂给 AI"
        items={['标准化/数字化/模型验证现状', '核心菜品工序', '两天累计的四表合一']}
      />
      <AICol
        title="AI 产出"
        items={['连锁化准备度评分（雷达）', '核心菜品 SOP 草稿', '《一页诊断与方向》+ 60 天路线']}
      />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 36 }}>
      当场产出：<b style={{ color: 'var(--osd-text)' }}>《连锁化准备度自评表》</b> + 60 天行动承诺。
    </p>
  </PageBase>
);
(M11AI as WithNotes).notes =
  '0:45–1:15｜AI 核心演示：算准备度、生成 SOP、汇总一页诊断、输出 60 天路线。两天成果在此收束。';

/* 25 — 结营 cover */
const ClosingCover: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${tokens.space.padX}px`,
      background:
        'radial-gradient(1100px 700px at 50% 30%, rgba(224,168,94,0.14), transparent 55%), var(--osd-bg)',
    }}
  >
    <Style />
    <Eyebrow>结营 · GRADUATION</Eyebrow>
    <div
      className="r-up"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 300,
        fontWeight: 900,
        color: 'var(--osd-accent)',
        lineHeight: 0.9,
      }}
    >
      60<span style={{ fontSize: 120 }}>天</span>
    </div>
    <p
      className="r-up"
      style={{ fontSize: 38, color: tokens.color.muted, marginTop: 24, maxWidth: 1300 }}
    >
      课程结束，不是真的结束。我只关心 60 天后，你的毛利、客单、复购有没有变化。
    </p>
    <Footer n={25} mod="结营" half="Day2 下午" min="30min" />
  </div>
);
(ClosingCover as WithNotes).notes = '0:00–0:05｜满版 60 天。把课程从「学得热闹」转向「指标变化」。';

/* 26 — 结业四图纸 */
const M12Sheets: Page = () => (
  <PageBase n={26} mod="结营" half="Day2 下午" min="30min">
    <Eyebrow>结业交付 · 四图纸</Eyebrow>
    <H>入场带账本，离场带图纸</H>
    <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
      <Card
        tag="图纸 1"
        title="一页诊断与方向"
        body="你这家店的主漏洞 + 模式 + 60 天方向"
        tone="cool"
      />
      <Card tag="图纸 2" title="九宫格图" body="菜单版位 + 主辅佐引落位" />
      <Card tag="图纸 3" title="档口图纸" body="菜单热区 1:1 投射到出餐动线" tone="good" />
      <Card tag="图纸 4" title="执行动作表" body="下周回去先砍 / 先推 / 先换" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      再加一套 <b style={{ color: 'var(--osd-text)' }}>门店 AI 副驾（11+ prompt/GPT）</b>
      ，回去持续可用。
    </p>
  </PageBase>
);
(M12Sheets as WithNotes).notes =
  '0:05–0:20｜一对一通关，导师审核 60 天计划。把四图纸 + AI 副驾作为带走资产强调。';

/* 27 — 60 天承诺 */
const Commit: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${tokens.space.padX}px`,
      background:
        'radial-gradient(1100px 600px at 22% 78%, rgba(123,178,126,0.12), transparent 60%), var(--osd-bg)',
    }}
  >
    <Style />
    <Eyebrow>全体起立 · 大声朗读</Eyebrow>
    <h1
      className="r-up"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 110,
        fontWeight: 900,
        margin: '20px 0 0',
        lineHeight: 1.15,
      }}
    >
      「我承诺，60 天内，
      <br />
      改善我的经营指标！」
    </h1>
    <p style={{ fontSize: 34, color: tokens.color.muted, marginTop: 40, maxWidth: 1300 }}>
      签下《60 天落地承诺书》，群里跟进——第 7 天提醒、第 30 天复盘、第 60 天前后对比。
    </p>
    <Footer n={27} mod="结营" half="Day2 下午" min="30min" />
  </div>
);
(Commit as WithNotes).notes =
  '0:20–0:30｜请全体起立朗读承诺。签字、合影、下课。课后行动闭环（7/30/60）说明。';

/* 28 — 附录 A 进场数据卡 */
const DataCard: Page = () => (
  <PageBase n={28} mod="附录 A" half="素材包">
    <Eyebrow>课前《进场数据卡》· 手写带来</Eyebrow>
    <H>7 项种子数据</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 44 }}>
      <AICol
        title="必填数字"
        items={[
          '1 月度房租（实际金额）',
          '2 月度人工（含社保提成）',
          '3 月度水电杂费',
          '4 食材成本率（去年全年）',
        ]}
      />
      <AICol
        title="必填数字"
        items={[
          '5 日均客流量（近一月）',
          '6 实际客单价（近一月）',
          '7 主要竞争对手（3 公里最怕谁）',
          '思考题：房租涨 20% 还活吗？',
        ]}
      />
    </div>
    <p style={{ fontSize: 26, color: tokens.color.faint, marginTop: 34 }}>
      必带：笔记本电脑、计算器、填好的数据表。心态：空杯——这堂课会推翻你过去的经验。
    </p>
  </PageBase>
);
(DataCard as WithNotes).notes = '附录｜课前预习包核心。没有种子数据，两天课无法落地。';

/* 29 — 附录 B AI 副驾清单 */
const TwoColList = ({ left, right }: { left: string[]; right: string[] }) => (
  <div style={{ display: 'flex', gap: 28, marginTop: 40 }}>
    {[left, right].map((col, idx) => (
      <ul
        key={idx === 0 ? 'L' : 'R'}
        style={{
          flex: 1,
          margin: 0,
          paddingLeft: 28,
          fontSize: 26,
          lineHeight: 1.85,
          color: tokens.color.muted,
        }}
      >
        {col.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    ))}
  </div>
);
const AIPack: Page = () => (
  <PageBase n={29} mod="附录 B" half="素材包">
    <Eyebrow>门店 AI 副驾 · 11+ prompt / GPT</Eyebrow>
    <H>每模块一套，课后持续可用</H>
    <TwoColList
      left={[
        '① 成本结构速诊（M1）',
        '② 营收漏损诊断（M2 · 主工具①）',
        '③ 商圈竞争扫描（M3）',
        '④ 盈亏平衡测算器 GPT（M4）',
        '⑤ 模式自检（M5）',
        '⑥ 菜单诊断包：SKU/价格带/新品/砍菜（M6）',
      ]}
      right={[
        '⑦ 菜单工程矩阵 GPT（M7）',
        '⑧ 产品角色矩阵（M8 · 主工具②）',
        '⑨ 价格带定价（M9）',
        '⑩ 菜单版位 + 四个一（M10）',
        '⑪ 连锁化诊断 + SOP 生成 GPT（M11 · 主工具③）',
        '原则：AI 做副驾 · 不演示要交付 · 贯穿不外挂',
      ]}
    />
  </PageBase>
);
(AIPack as WithNotes).notes =
  '附录｜11 套 AI 副驾总览。强调它们直接服务「减少对老板依赖」的核心承诺。';

/* 30 — 附录 C 带走工具 */
const Tools: Page = () => (
  <PageBase n={30} mod="附录 C" half="素材包">
    <Eyebrow>带走工具 · 四表合一</Eyebrow>
    <H>填数即可，无需美化</H>
    <TwoColList
      left={[
        '三张主工具：营收漏损自诊表',
        '· 产品角色矩阵（主辅佐引地图）',
        '· 连锁化准备度自评表',
        '门店保本测算表（生死线）',
        '利润敏感度计算器',
      ]}
      right={[
        '菜品毛利透视表 · 产品结构优化清单',
        '价格带调整方案 · 商圈竞争卡位图',
        '双菜单结构差异表 · 二店可行性测算表',
        '四表合一 = 生死线 + 角色地图 + 价格带 + 竞争卡位',
        '结业四图纸：一页诊断 / 九宫格 / 档口图纸 / 执行动作表',
      ]}
    />
  </PageBase>
);
(Tools as WithNotes).notes = '附录｜工具与图纸清单。现场发放、即填即用，是两天的物理交付物。';

/* 31 — 附录 D 助教口令 + 行动闭环 */
const Facilitator: Page = () => (
  <PageBase n={31} mod="附录 D" half="素材包">
    <Eyebrow>助教实操口令 + 课后行动闭环</Eyebrow>
    <H>落地由口令驱动</H>
    <TwoColList
      left={[
        'Day1 上午 · 生死线：「算出你的保本客流量」',
        'Day1 下午 · 产品诊断：「圈 3 道砍、2 道捧」',
        'Day2 上午 · 主辅佐引：「按角色填，看哪空了」',
        'Day2 下午 · 九宫格：「主菜放红区，凑单放边」',
      ]}
      right={[
        '第 7 天：群提醒，确认动作开工',
        '第 30 天：集体复盘，调参数',
        '第 60 天：前后对比毛利/客单/复购',
        '优秀案例反哺案例库，滚动迭代',
      ]}
    />
  </PageBase>
);
(Facilitator as WithNotes).notes = '附录｜助教口令表 + 7/30/60 行动闭环，保证课程效果延伸到课后。';

/* 32 — 谢幕 */
const End: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${tokens.space.padX}px`,
    }}
  >
    <Style />
    <Eyebrow>单店复制模型</Eyebrow>
    <h1
      className="r-up"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 120,
        fontWeight: 900,
        margin: '20px 0 0',
        lineHeight: 1.1,
      }}
    >
      开得更多，<span style={{ color: 'var(--osd-accent)' }}>管得更少</span>。
    </h1>
    <p style={{ fontSize: 34, color: tokens.color.muted, marginTop: 36, maxWidth: 1300 }}>
      从盯店到掌舵——把老板的能力，变成店的规矩，变成可复制的模型。下课！
    </p>
    <Footer n={32} mod="谢幕" half="Day2 下午" />
  </div>
);
(End as WithNotes).notes = '谢幕｜回扣招牌方法论与主标语。合影留念，导出 PDF 作为学员留档。';

/* ============================================================
   ENRICHMENT PAGES — depth slides interleaved into the flow
   ============================================================ */

/* shared big-number stat (Day2 local) */
const Stat = ({ big, label, tone }: { big: string; label: string; tone?: 'bad' | 'good' }) => (
  <div
    style={{
      flex: 1,
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: 14,
      padding: '26px 28px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 56,
        fontWeight: 900,
        color:
          tone === 'bad'
            ? tokens.color.bad
            : tone === 'good'
              ? tokens.color.good
              : 'var(--osd-accent)',
      }}
    >
      {big}
    </div>
    <div style={{ fontSize: 23, color: tokens.color.muted, marginTop: 8, lineHeight: 1.4 }}>
      {label}
    </div>
  </div>
);

/* 开场 · 今日地图 */
const Day2Map: Page = () => (
  <PageBase mod="开场" half="Day2 上午">
    <Eyebrow>今日地图 · DAY 2</Eyebrow>
    <H>工具落地的一天</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 52 }}>
      <Card
        tag="上午 · 重建②"
        title="造印钞机"
        body="菜单工程矩阵 → 主辅佐引 → 双峰定价。"
        tone="good"
      />
      <Card
        tag="下午 · 复制"
        title="可复制"
        body="九宫格陈列 → 连锁化诊断，抽走你也能转。"
        tone="cool"
      />
      <Card tag="收尾 · 结营" title="带图纸走" body="结业四图纸 + 60 天落地承诺。" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      规则不变：每个模块结束，手里<b style={{ color: 'var(--osd-text)' }}>多一张填好的图纸</b>。
    </p>
  </PageBase>
);
(Day2Map as WithNotes).notes =
  '0:02 衔接｜给 Day2 的“今天会带走什么”预期。强调全是工具与图纸，不是听讲。';

/* M7 · 四步操作法 */
const QuadSteps: Page = () => (
  <PageBase mod="M7 菜单工程矩阵" half="Day2 上午" min="75min">
    <Eyebrow>菜单工程 · 四步操作法</Eyebrow>
    <H>把整本菜单跑一遍</H>
    <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
      <Card tag="步 1" title="列清单" body="每道菜：销量 / 售价 / 毛利，一行一道。" />
      <Card tag="步 2" title="打两个分" body="销量轴 + 毛利轴，定位每道菜的坐标。" tone="cool" />
      <Card tag="步 3" title="归四象限" body="再叠加“标准化”第三维，揪出陷阱款。" />
      <Card tag="步 4" title="定动作" body="砍 / 捧 / 改 / 组合，每道菜给一个处理。" tone="good" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      流程化之后，砍菜不再靠心情——<b style={{ color: 'var(--osd-accent)' }}>靠坐标</b>。
    </p>
  </PageBase>
);
(QuadSteps as WithNotes).notes =
  '0:25 衔接｜给四象限一套可复制的操作步骤，降低学员“看得懂、不会做”的门槛。';

/* M7 · 砍菜反增利案例 */
const CutProfitCase: Page = () => (
  <PageBase mod="M7 菜单工程矩阵" half="Day2 上午" min="75min">
    <Eyebrow>案例 · 砍菜反增利</Eyebrow>
    <H>从 86 道砍到 42 道，利润却涨了</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Stat big="86→42" label="SKU 数量（砍掉一半）" />
      <Stat big="-40%" label="后厨备货与损耗" tone="good" />
      <Stat big="+6pt" label="综合毛利率" tone="good" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      砍掉瘦狗与连锁陷阱款后，厨房更快、备货更准、出品更稳——
      <b style={{ color: 'var(--osd-accent)' }}>少即是多</b>。
    </p>
  </PageBase>
);
(CutProfitCase as WithNotes).notes =
  '0:45 衔接｜用“砍一半反而更赚”的案例，打消“菜多才显丰富”的执念。数字为示意，可换真实案例。';

/* M8 · 缺位补位案例 */
const GapCase: Page = () => (
  <PageBase mod="M8 主辅佐引" half="Day2 上午" min="90min">
    <Eyebrow>案例 · 缺位补位</Eyebrow>
    <H>缺了「佐」，客单永远上不去</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 48 }}>
      <Card
        tag="诊断"
        tone="bad"
        title="全是主 + 引"
        body="有招牌、有钩子，却没有“顺手加一个”的佐类。"
      />
      <Card
        tag="补位"
        title="加 2 道凑单 / 加购"
        body="设计 9–19 元的小食 / 饮品，话术引导加购。"
        tone="cool"
      />
      <Card tag="结果" tone="good" title="客单 +8 元" body="不靠涨价、不赶客，单靠补一个角色。" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      先看你的地图<b style={{ color: 'var(--osd-text)' }}>哪个角色空着</b>
      ，再针对性补——这就是结构的力量。
    </p>
  </PageBase>
);
(GapCase as WithNotes).notes =
  '0:25 衔接｜用“缺佐→补佐→客单涨”讲清角色缺位的代价，自然过渡到产品地图填写。';

/* M8 · 单店 vs 连锁配比 */
const RatioCompare: Page = () => (
  <PageBase mod="M8 主辅佐引" half="Day2 上午" min="90min">
    <Eyebrow>主辅佐引 · 配比差异</Eyebrow>
    <H>单店与连锁，配比不一样</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 44 }}>
      <AICol
        title="单店 · 重体验"
        items={[
          '主 30% · 强招牌拉流量',
          '辅 35% · 毛利发动机最大化',
          '佐 20% · 灵活凑单',
          '引 15% · 复购钩子',
        ]}
      />
      <AICol
        title="连锁 · 重复制"
        items={[
          '主 40% · 强标准化、去厨师化',
          '辅 30% · 易复制的毛利款',
          '佐 15% · 精简 SKU',
          '引 15% · 跨店统一钩子',
        ]}
      />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 36 }}>
      连锁化会把配比往<b style={{ color: 'var(--osd-text)' }}>“标准化、可复制”</b>
      方向调——配比就是战略。
    </p>
  </PageBase>
);
(RatioCompare as WithNotes).notes =
  '0:50 衔接｜对照单店/连锁配比，呼应 Day1 的模式选型。配比无标准答案，跟模式走。';

/* M9 · 心理定价技巧 */
const PsychPricing: Page = () => (
  <PageBase mod="M9 价格带结构" half="Day2 上午" min="60min">
    <Eyebrow>定价心理 · 小技巧</Eyebrow>
    <H>同样的价，感觉差很多</H>
    <div style={{ display: 'flex', gap: 16, marginTop: 44 }}>
      <Card tag="锚点" title="放个贵的衬托" body="高价款不为卖，为让主推显得“值”。" tone="cool" />
      <Card tag="去零" title="38 vs 40" body="差 2 元，心理跨档；别让价格压线整数。" />
      <Card tag="捆绑" title="套餐算不清" body="组合后单价模糊，更愿一次买齐。" tone="good" />
      <Card tag="慎用" title=".9 尾数" body="廉价感；中高端门店要克制使用。" tone="bad" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      技巧是<b style={{ color: 'var(--osd-text)' }}>分层</b>不是宰客——让顾客自己选到你想卖的那一档。
    </p>
  </PageBase>
);
(PsychPricing as WithNotes).notes =
  '0:25 衔接｜补四个定价心理技巧，落点重申“分层而非宰客”，与三陷阱呼应。';

/* M9 · 跨城价格容差 */
const CrossCity: Page = () => (
  <PageBase mod="M9 价格带结构" half="Day2 上午" min="60min">
    <Eyebrow>跨城定价 · 价格容差</Eyebrow>
    <H>同一道菜，异地不同价</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Stat big="+15~20%" label="一线核心商圈（高租金高消费）" />
      <Stat big="基准" label="二线主力市场" tone="good" />
      <Stat big="-10~15%" label="县域下沉市场" tone="bad" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      用城市消费力与租金系数设定<b style={{ color: 'var(--osd-accent)' }}>容差带</b>
      ，扩张前先把“异地怎么定价”写成规则。
    </p>
  </PageBase>
);
(CrossCity as WithNotes).notes =
  '0:35 衔接｜跨城容差是 M9 AI 的产出之一。强调连锁前要把定价做成“规则”而非“拍脑袋”。';

/* M10 · Z 型动线 */
const ZPath: Page = () => (
  <PageBase mod="M10 九宫格陈列" half="Day2 下午" min="75min">
    <Eyebrow>视线动线 · Z 型</Eyebrow>
    <H>顾客的眼睛这样走</H>
    <div style={{ display: 'flex', gap: 56, marginTop: 28, alignItems: 'center' }}>
      <svg width={620} height={420} viewBox="0 0 620 420" role="img" aria-label="菜单 Z 型视线动线">
        <title>Z 型视线动线</title>
        <rect
          x={20}
          y={20}
          width={580}
          height={380}
          rx={16}
          fill={tokens.color.surface}
          stroke={tokens.color.line}
          strokeWidth={2}
        />
        {/* golden first-glance zone */}
        <rect
          x={48}
          y={48}
          width={250}
          height={120}
          rx={10}
          fill="var(--osd-accent)"
          opacity={0.16}
        />
        <circle cx={80} cy={86} r={12} fill="var(--osd-accent)" />
        <circle cx={540} cy={86} r={10} fill={tokens.color.muted} />
        <circle cx={80} cy={330} r={10} fill={tokens.color.muted} />
        <circle cx={540} cy={330} r={10} fill={tokens.color.muted} />
        <polyline
          points="80,86 540,86 80,330 540,330"
          fill="none"
          stroke="var(--osd-accent)"
          strokeWidth={4}
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
        <text x={100} y={70} fill="var(--osd-text)" fontSize={24} fontWeight={800}>
          ① 主君款
        </text>
        <text x={524} y={70} textAnchor="end" fill={tokens.color.muted} fontSize={22}>
          ② 毛利款
        </text>
        <text x={100} y={368} fill={tokens.color.muted} fontSize={22}>
          ③ 凑单 / 佐
        </text>
        <text x={524} y={368} textAnchor="end" fill={tokens.color.muted} fontSize={22}>
          ④ 引流 / 钩子
        </text>
      </svg>
      <div style={{ flex: 1 }}>
        <ul
          style={{
            fontSize: 30,
            lineHeight: 1.8,
            paddingLeft: 28,
            color: tokens.color.muted,
            margin: 0,
          }}
        >
          <li>左上是第一落点：放主君款。</li>
          <li>右上接力：放高毛利的辅类。</li>
          <li>下行两格：凑单与复购钩子。</li>
          <li>别把高毛利款丢进视线盲区。</li>
        </ul>
      </div>
    </div>
  </PageBase>
);
(ZPath as WithNotes).notes =
  '0:15 衔接｜Z 型动线把“黄金视线区”讲到落点级别。承接九宫格，指导版位排布。';

/* M10 · 产品语言屋示例 */
const LanguageHouse: Page = () => (
  <PageBase mod="M10 九宫格陈列" half="Day2 下午" min="75min">
    <Eyebrow>产品语言屋 · 示例</Eyebrow>
    <H>别写「秘制传承」，要写「卖了多少份」</H>
    <div style={{ display: 'flex', gap: 22, marginTop: 40 }}>
      <Card
        tag="✗ 文艺空话"
        tone="bad"
        title="匠心秘制 · 传承三代"
        body="顾客无感、无法验证，3 秒就划过。"
      />
      <Card
        tag="✓ 可信卖点"
        tone="good"
        title="每天卖出 300 份 · 现点现炒 90 秒"
        body="有数字、有承诺，瞬间建立信任。"
      />
    </div>
    <div style={{ marginTop: 24 }}>
      <AICol
        title="可信卖点公式（任选其一）"
        items={[
          '销量证言：每天 300 份 / 复购第一',
          '时间承诺：现做 / 90 秒出餐',
          '食材溯源：当日鲜杀 / 产地直供',
          '场景占位：一人食刚好 / 三人份管饱',
        ]}
      />
    </div>
  </PageBase>
);
(LanguageHouse as WithNotes).notes =
  '0:35 衔接｜把“产品语言屋”落到可抄的公式。实操：给主推款写一句可信卖点，助教收。';

/* M11 · 三个验证问题 */
const ThreeTests: Page = () => (
  <PageBase mod="M11 连锁化诊断" half="Day2 下午" min="75min">
    <Eyebrow>能不能离开你 · 三问</Eyebrow>
    <H>换人不变味，才叫模型</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 48 }}>
      <Card
        tag="验证 1"
        title="换个厨师会变味吗？"
        body="核心菜有没有克重化 SOP，新人能否复刻。"
        tone="cool"
      />
      <Card tag="验证 2" title="换个店长还转吗？" body="排班、采购、对账是否靠流程而非靠人。" />
      <Card
        tag="验证 3"
        tone="good"
        title="把你抽走模型还成立吗？"
        body="老板不在，单店模型能否自洽复算。"
      />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      三问任何一个答“不行”，就是你
      <b style={{ color: tokens.color.bad }}>扩张前必须补的功课</b>。
    </p>
  </PageBase>
);
(ThreeTests as WithNotes).notes =
  '0:20 衔接｜把可复制性三要素翻译成三个尖锐问题，直击“能不能离开你”。';

/* M11 · 二店可行性测算 */
const SecondStore: Page = () => (
  <PageBase mod="M11 连锁化诊断" half="Day2 下午" min="75min">
    <Eyebrow>二店账 · 当头一棒</Eyebrow>
    <H>先算清楚，再开第二家</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Stat big="爬坡 3 月" label="二店达到一店水平的周期" />
      <Stat big="现金流" label="回正所需月份要先算出来" tone="bad" />
      <Stat big="回收期" label="12–24 月内能否收回投资" tone="good" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      用 Day1 的模型算二店账——很多人算完发现：
      <b style={{ color: tokens.color.bad }}>现在的模式根本不适合开分店</b>，先把单店救活。
    </p>
  </PageBase>
);
(SecondStore as WithNotes).notes =
  '0:35 衔接｜把二店测算讲成“理性刹车”，避免盲目扩张。呼应 Day1 盈亏平衡工具。';

/* M11 · 连锁化准备度雷达 */
const ReadinessRadar: Page = () => (
  <PageBase mod="M11 连锁化诊断" half="Day2 下午" min="75min">
    <Eyebrow>连锁化准备度 · 五维自评</Eyebrow>
    <H>先看最短的那块板</H>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 22,
        marginTop: 44,
      }}
    >
      <Meter label="标准化" sub="SOP 与克重化" w={70} />
      <Meter label="数字化" sub="数据驱动决策" w={55} />
      <Meter label="供应链" sub="集采与中央厨房" w={48} />
      <Meter label="人才梯队" sub="店长可批量复制" w={42} />
      <Meter label="单店模型" sub="盈利经得起复算" w={80} />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      AI 生成雷达图，<b style={{ color: 'var(--osd-accent)' }}>最低的一维</b>
      就是你扩张前要补的功课。
    </p>
  </PageBase>
);
(ReadinessRadar as WithNotes).notes =
  '0:55 衔接｜五维自评是 M11 AI 的产出形态。引导学员只盯短板，不盲目铺开。';

/* 结营 · 方法论总览 */
const Methodology: Page = () => (
  <PageBase mod="结营" half="Day2 下午" min="30min">
    <Eyebrow>两天方法论 · 一图收束</Eyebrow>
    <H>诊断 → 重建 → 复制</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 48 }}>
      <Card
        tag="诊断"
        tone="cool"
        title="算清账，找漏洞"
        body="三压力 / 漏桶 / 竞争卡位 / 生死线。"
      />
      <Card tag="重建" title="选模型，定结构" body="模式选型 / 主辅佐引 / 双峰定价 / 菜单工程。" />
      <Card
        tag="复制"
        tone="good"
        title="立规矩，能离手"
        body="九宫格 / 连锁化三要素 / SOP / 60 天承诺。"
      />
    </div>
    <p style={{ fontSize: 32, color: tokens.color.muted, marginTop: 44 }}>
      一句话：<b style={{ color: 'var(--osd-accent)' }}>入场带账本，离场带图纸</b>。
    </p>
  </PageBase>
);
(Methodology as WithNotes).notes =
  '0:03 衔接｜结营前把两天主线收成一张图，强化“方法论”记忆，便于复述给团队。';

/* 结营 · 一页诊断样例 */
const DiagnosisSample: Page = () => (
  <PageBase mod="结营" half="Day2 下午" min="30min">
    <Eyebrow>结业图纸 · 样例</Eyebrow>
    <H>《一页诊断与方向》长这样</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Card
        tag="① 主漏洞"
        tone="bad"
        title="客单偏低 + 复购弱"
        body="离行业基准最远、改善弹性最高的一环。"
      />
      <Card tag="② 选定模式" title="防御型" body="区域头牌，做差异化、拉复购、守护城河。" />
    </div>
    <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
      <Card
        tag="③ 三个动作"
        tone="cool"
        title="砍3 · 捧2 · 补佐"
        body="下周即可执行的产品结构动作。"
      />
      <Card
        tag="④ 60 天目标"
        tone="good"
        title="客单 +8 / 复购 +5pt"
        body="可量化、可复盘的硬指标。"
      />
    </div>
  </PageBase>
);
(DiagnosisSample as WithNotes).notes =
  '0:08 衔接｜给“一页诊断”一个具体样板，学员照着把自己的填满，导师审核。';

/* 结营 · 60 天路线图 */
const Roadmap60: Page = () => (
  <PageBase mod="结营" half="Day2 下午" min="30min">
    <Eyebrow>60 天路线图</Eyebrow>
    <H>回去，先做这三件</H>
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 16, marginTop: 48 }}>
      <Card tag="第 1 周" title="动结构 + 换物料" body="砍 3 道、捧 2 道，换掉菜单与终端海报。" />
      <span
        style={{ display: 'flex', alignItems: 'center', fontSize: 48, color: 'var(--osd-accent)' }}
      >
        →
      </span>
      <Card
        tag="第 30 天"
        title="复盘调参"
        body="看数据，微调价格带与版位，巩固动作。"
        tone="cool"
      />
      <span
        style={{ display: 'flex', alignItems: 'center', fontSize: 48, color: 'var(--osd-accent)' }}
      >
        →
      </span>
      <Card
        tag="第 60 天"
        title="前后对比"
        body="对比毛利 / 客单 / 复购，沉淀可复制经验。"
        tone="good"
      />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      课后群里跟进每个节点——把<b style={{ color: 'var(--osd-text)' }}>承诺变成指标</b>。
    </p>
  </PageBase>
);
(Roadmap60 as WithNotes).notes =
  '0:12 衔接｜把 60 天落地拆成 7/30/60 三个节点，承接承诺书与社群跟进。';

/* 附录 · 课后社群跟进 */
const Community: Page = () => (
  <PageBase mod="附录 E" half="素材包">
    <Eyebrow>课后不断更 · 社群跟进</Eyebrow>
    <H>结束，不是真的结束</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 48 }}>
      <Card
        tag="第 7 天"
        title="群提醒开工"
        body="确认每人第一周动作已落地，未动的点名。"
        tone="cool"
      />
      <Card tag="第 30 天" title="直播复盘" body="集体对数据、调参数，解决共性卡点。" />
      <Card tag="第 60 天" title="晒结果" body="前后对比毛利/客单/复购，评优秀案例。" tone="good" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      优秀案例<b style={{ color: 'var(--osd-accent)' }}>反哺案例库</b>，下一期课程滚动迭代。
    </p>
  </PageBase>
);
(Community as WithNotes).notes =
  '附录｜课后 7/30/60 社群运营节奏，保证课程效果延伸，沉淀案例资产。';

export const meta: SlideMeta = { title: '餐饮盈利突围 · Day2（重建②+复制+结营）' };

const rawPages = [
  Cover, // 01
  Day2Map, // 02
  Recap, // 03
  PhaseRebuild2, // 04
  M7Cover, // 05
  MenuQuadrant, // 06
  QuadSteps, // 07
  M7Third, // 08
  CutProfitCase, // 09
  M7AI, // 10
  M8Cover, // 11
  RoleMatrix, // 12
  RoleCase, // 13
  GapCase, // 14
  RatioCompare, // 15
  M8AI, // 16
  M9Cover, // 17
  PriceBand, // 18
  M9Traps, // 19
  PsychPricing, // 20
  CrossCity, // 21
  M9AI, // 22
  PhaseReplicate, // 23
  M10Cover, // 24
  NineGrid, // 25
  ZPath, // 26
  M10Errors, // 27
  LanguageHouse, // 28
  M10AI, // 29
  M11Cover, // 30
  ChainTriad, // 31
  ThreeTests, // 32
  M11SOP, // 33
  SecondStore, // 34
  ReadinessRadar, // 35
  M11AI, // 36
  ClosingCover, // 37
  Methodology, // 38
  M12Sheets, // 39
  DiagnosisSample, // 40
  Roadmap60, // 41
  Commit, // 42
  DataCard, // 43
  AIPack, // 44
  Tools, // 45
  Facilitator, // 46
  Community, // 47
  End, // 48
] satisfies Page[];

TOTAL_PAGES = rawPages.length;

/* Wrap each page so the footer reads its 1-based position from context —
 * inserting or reordering slides never needs manual renumbering. */
const pages = rawPages.map((PageComp, i) => {
  const Numbered: Page = (props) => (
    <PageNumCtx.Provider value={i + 1}>
      <PageComp {...props} />
    </PageNumCtx.Provider>
  );
  return Numbered;
});

export const notes = rawPages.map((p) => (p as WithNotes).notes);
export default pages;
