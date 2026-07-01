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
   餐饮盈利突围 · 单店复制模型 — Day 1（诊断 + 重建①）
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
  meta: { totalPages: 32, deck: '餐饮盈利突围 · Day 1' },
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
@keyframes rDrop { 0%{opacity:0; transform:translateY(-6px);} 30%{opacity:1;} 100%{opacity:.15; transform:translateY(26px);} }
.r-up { animation:rUp .8s cubic-bezier(.16,1,.3,1) both; }
.r-fade { animation:rFade 1s ease-out both; }
.r-grow { animation:rGrow .9s cubic-bezier(.16,1,.3,1) both; transform-origin:left center; }
`;
const Style = () => <style>{keyframes}</style>;

/* ─────────── reusable bits ─────────── */

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
    style={{
      fontSize: 24,
      fontWeight: 600,
      color: 'var(--osd-accent)',
      letterSpacing: '0.22em',
    }}
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

/* a module/phase cover */
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

/* the three-beat strip used on AI/产出 pages */
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
    <Eyebrow>餐饮盈利突围 · 单店复制模型 · DAY 1</Eyebrow>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, marginTop: 8 }}>
      <div
        className="r-up"
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 280,
          fontWeight: 900,
          color: 'var(--osd-accent)',
          lineHeight: 0.9,
          letterSpacing: '-0.03em',
        }}
      >
        77.2<span style={{ fontSize: 140 }}>%</span>
      </div>
      <div
        className="r-up"
        style={{ fontSize: 32, color: tokens.color.muted, maxWidth: 560, lineHeight: 1.5 }}
      >
        2026 年中国餐饮 <b style={{ color: 'var(--osd-text)' }}>77.2%</b> 的单店无增长，
        <b style={{ color: tokens.color.bad }}>45.7%</b> 在下滑。
      </div>
    </div>
    <h1
      className="r-up"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 64,
        fontWeight: 800,
        margin: '36px 0 0',
        lineHeight: 1.2,
      }}
    >
      算清账 · 找漏洞 —— 从盯店到掌舵
    </h1>
    <p style={{ fontSize: 30, color: tokens.color.faint, marginTop: 22 }}>
      不熬鸡汤，只算账。今天 12 小时，把你的店拆开，看钱漏在哪。
    </p>
    <Footer n={1} mod="开场" half="Day1 上午" />
  </div>
);
(Cover as WithNotes).notes =
  '0:00–0:05｜满版 77.2%。开场白：不用鼓掌，今天不熬鸡汤只算账。45.7% 在下滑。锚点先立：不是餐饮不赚钱，是你的模型不赚钱。';

/* 02 — 一句话戳痛 */
const Punch: Page = () => (
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
    <Eyebrow>核心判断</Eyebrow>
    <h1
      className="r-up"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 100,
        fontWeight: 900,
        lineHeight: 1.18,
        margin: '24px 0 0',
        maxWidth: 1500,
      }}
    >
      不是餐饮不赚钱，
      <br />
      是你的<span style={{ color: 'var(--osd-accent)' }}>模型</span>不赚钱。
    </h1>
    <p
      style={{
        fontSize: 34,
        color: tokens.color.muted,
        marginTop: 40,
        maxWidth: 1300,
        lineHeight: 1.5,
      }}
    >
      市场不认「你觉得」，市场只认数据。今天我们把脑子里的「觉得」，换成纸面上的「数字」。
    </p>
    <Footer n={2} mod="开场" half="Day1 上午" />
  </div>
);
(Punch as WithNotes).notes =
  '0:05–0:10｜重锤这一句。讲 12 年咨询见过太多老板死在「我觉得」。引出今天的工作方式：用自己的账本上课。';

/* 03 — 核心公式 */
const FormulaTerm = ({ t, s, op }: { t: string; s: string; op?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.line}`,
        borderRadius: 16,
        padding: '26px 30px',
        textAlign: 'center',
        minWidth: 200,
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 800 }}>{t}</div>
      <div style={{ fontSize: 22, color: tokens.color.muted, marginTop: 8 }}>{s}</div>
    </div>
    {op ? (
      <span style={{ fontSize: 56, color: 'var(--osd-accent)', fontWeight: 800 }}>{op}</span>
    ) : null}
  </div>
);
const Formula: Page = () => (
  <PageBase n={3} mod="开场" half="Day1 上午">
    <Eyebrow>营收公式</Eyebrow>
    <H>这是一个乘法，不是加法</H>
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginTop: 64 }}
    >
      <FormulaTerm t="进店流量" s="多少人进来" op="×" />
      <FormulaTerm t="点单转化率" s="坐下点了吗" op="×" />
      <FormulaTerm t="实际客单价" s="花了多少" op="×" />
      <FormulaTerm t="真实复购率" s="还会再来吗" op="+" />
      <FormulaTerm t="外卖 / 零售" s="第二增长曲线" />
    </div>
    <p
      style={{
        fontSize: 32,
        color: tokens.color.muted,
        marginTop: 56,
        lineHeight: 1.5,
        maxWidth: 1500,
      }}
    >
      流量涨 10%、转化掉 10% → 营收只剩 <b style={{ color: tokens.color.bad }}>99%</b>。 任一项掉
      20%，前三项全涨也可能<b style={{ color: 'var(--osd-text)' }}>亏钱</b>。
    </p>
  </PageBase>
);
(Formula as WithNotes).notes =
  '0:10–0:30｜逐项拆。用 99% 的算术让大家体感「乘法」。点到孟子王道vs霸道埋伏笔（下一节讲流量哲学）。';

/* 04 — 现场调研 + 两天地图 */
const RoadStep = ({ k, t, s, on }: { k: string; t: string; s: string; on?: boolean }) => (
  <div
    style={{
      flex: 1,
      background: on ? tokens.color.surface2 : tokens.color.surface,
      border: `1px solid ${on ? 'var(--osd-accent)' : tokens.color.line}`,
      borderRadius: 14,
      padding: '24px 26px',
    }}
  >
    <div style={{ fontSize: 22, color: 'var(--osd-accent)', fontWeight: 700 }}>{k}</div>
    <div style={{ fontSize: 30, fontWeight: 800, marginTop: 10 }}>{t}</div>
    <div style={{ fontSize: 23, color: tokens.color.muted, marginTop: 8, lineHeight: 1.45 }}>
      {s}
    </div>
  </div>
);
const Map2Day: Page = () => (
  <PageBase n={4} mod="开场" half="Day1 上午">
    <Eyebrow>两天地图</Eyebrow>
    <H>诊断 → 重建 → 复制</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 56 }}>
      <RoadStep k="Day1 上午" t="诊断" s="算清账，找到漏钱的窟窿（M1–M4）" on />
      <RoadStep k="Day1 下午" t="重建 ①" s="选模型、定产品结构（M5–M6）" on />
      <RoadStep k="Day2 上午" t="重建 ②" s="造印钞机：菜单工程 / 主辅佐引 / 定价（M7–M9）" />
      <RoadStep k="Day2 下午" t="复制" s="九宫格落地 + 连锁化 + 60 天承诺（M10–M11）" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 48 }}>
      现场调研：今年营收上涨的点头 / 持平的点头 / 下跌的——我们就来解决「跌」和「平」。
    </p>
  </PageBase>
);
(Map2Day as WithNotes).notes =
  '0:00 衔接｜用眼神调研（上涨<10%、持平≈40%、其余下跌）。强调今天没有笔记只有计算，要求拿出《进场数据卡》。';

/* 05 — 诊断 divider */
const PhaseDiagnose: Page = () => (
  <Divider
    phase="阶段一 · DIAGNOSE"
    title="诊断 — 找漏在哪"
    sub="M1 现状 · M2 漏损 · M3 竞争 · M4 盈亏平衡 —— 入场带账本，先把窟窿找出来。"
    n={5}
    half="Day1 上午"
  />
);
(PhaseDiagnose as WithNotes).notes =
  '过场｜把四个诊断模块的因果链点一遍：先看全局压力，再定位漏损，再看竞争，最后算生死线。';

/* 06 — M1 cover */
const M1Cover: Page = () => (
  <PageBase n={6} mod="M1 经营现状诊断" half="Day1 上午" min="45min">
    <Eyebrow>MODULE 01 · 诊断</Eyebrow>
    <H size={84}>经营现状诊断</H>
    <Lead>
      先看清外部三压力（行业 / 成本 / 竞争）与组织依赖度——你，是不是这家店唯一不可替代的节点？
    </Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M1Cover as WithNotes).notes =
  '0:00–0:05｜本模块目标：建立「现状是被三股力量挤压」的全局视角，并埋下「依赖你=不可复制」的钩子。';

/* 07 — 营收公式金字塔 */
const PyramidRow = ({
  w,
  label,
  sub,
  top,
}: {
  w: number;
  label: string;
  sub: string;
  top?: boolean;
}) => (
  <div
    style={{
      width: `${w}%`,
      margin: '0 auto',
      background: top ? 'var(--osd-accent)' : tokens.color.surface,
      color: top ? '#1a130a' : 'var(--osd-text)',
      border: `1px solid ${top ? 'var(--osd-accent)' : tokens.color.line}`,
      borderRadius: 12,
      padding: '16px 22px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <span style={{ fontSize: 30, fontWeight: 800 }}>{label}</span>
    <span style={{ fontSize: 23, color: top ? '#5a4218' : tokens.color.muted }}>{sub}</span>
  </div>
);
const Pyramid: Page = () => (
  <PageBase n={7} mod="M1 经营现状诊断" half="Day1 上午" min="45min">
    <Eyebrow>营收公式金字塔</Eyebrow>
    <H>看不懂财报，也看得懂这座塔</H>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 44 }}>
      <PyramidRow w={36} label="口碑" sub="复利的源头" top />
      <PyramidRow w={52} label="复购率" sub="未雨绸缪 · 真正的资产" />
      <PyramidRow w={68} label="客单价" sub="求值不求高" />
      <PyramidRow w={84} label="转化率" sub="求清不求急" />
      <PyramidRow w={100} label="流量" sub="求准不求多" />
    </div>
  </PageBase>
);
(Pyramid as WithNotes).notes =
  '0:05–0:20｜从塔基到塔尖逐层讲。每层一句口诀：流量求准、转化求清、客单求值、复购未雨绸缪。';

/* 08 — 王道 vs 霸道 */
const WayDao: Page = () => (
  <PageBase n={8} mod="M1 经营现状诊断" half="Day1 上午" min="45min">
    <Eyebrow>流量哲学 · 孟子</Eyebrow>
    <H>霸道买的是流量，王道攒的是资产</H>
    <div style={{ display: 'flex', gap: 24, marginTop: 52 }}>
      <Card
        tag="霸道 · 以力服人"
        tone="bad"
        title="靠恐吓 / 夸大 / 极致低价"
        body="「全城最好吃」「9.9 团购」。不补贴就跑光，永远在花钱买战马、永远在打仗。"
      />
      <Card
        tag="王道 · 以德服人"
        tone="good"
        title="可兑现的确定性"
        body="图片即实物、排队预估准、带爸妈吃也不心疼。把路人变信任，信任才是资产。"
      />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      流量上求准不求多——把精力花在「可兑现的确定性」上，而不是把路人骗进来。
    </p>
  </PageBase>
);
(WayDao as WithNotes).notes =
  '0:20–0:35｜跨界讲孟子「以力假仁者霸，以德行仁者王」。落点回到流量策略：从买流量转向攒资产。';

/* 09 — M1 AI + 产出 */
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
const M1AI: Page = () => (
  <PageBase n={9} mod="M1 经营现状诊断" half="Day1 上午" min="45min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ①</Eyebrow>
        <H>成本结构速诊</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
      <AICol
        title="喂给 AI"
        items={['《进场数据卡》7 项种子数据', '近一月客流 / 客单 / 复购', '主要竞争对手']}
      />
      <AICol
        title="AI 产出"
        items={['你最大的压力点在哪一环', '成本结构红黑榜', '组织依赖度自评提示']}
      />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 40 }}>
      当场产出：<b style={{ color: 'var(--osd-text)' }}>最大压力点结论</b> + 组织依赖度自评。
    </p>
  </PageBase>
);
(M1AI as WithNotes).notes =
  '0:35–0:45｜现场用 prompt 跑一遍学员数据。强调 AI 是副驾、不是表演——要带走结论。';

/* 10 — M2 cover */
const M2Cover: Page = () => (
  <PageBase n={10} mod="M2 漏损定位" half="Day1 上午" min="75min">
    <Eyebrow>MODULE 02 · 诊断 · 主工具 ①</Eyebrow>
    <H size={84}>营收结构诊断与漏损定位</H>
    <Lead>营收是一只漏水的桶。流量、转化、客单、复购，哪道缝漏得最凶？先堵最大那道。</Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M2Cover as WithNotes).notes =
  '0:00–0:08｜本模块是 Day1 的核心。给出「漏桶」隐喻 + 二八聚焦：不要四处补，先堵最大的缝。';

/* 11 — 漏桶图 (signature visual) */
const LeakRow = ({ label, pct }: { label: string; pct: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
    <span
      className="r-grow"
      style={{
        display: 'inline-block',
        width: 56,
        height: 4,
        background: tokens.color.cool,
        borderRadius: 4,
        flexShrink: 0,
      }}
    />
    <span style={{ fontSize: 28, color: tokens.color.muted }}>
      <b style={{ color: 'var(--osd-text)', fontSize: 30 }}>{label}</b>
      <span style={{ margin: '0 10px', color: tokens.color.faint }}>·</span>漏损 {pct}
    </span>
  </div>
);
const Bucket: Page = () => (
  <PageBase n={11} mod="M2 漏损定位" half="Day1 上午" min="75min">
    <Eyebrow>招牌信息图 · 漏桶</Eyebrow>
    <H>钱从哪道缝漏走的？</H>
    <div style={{ display: 'flex', gap: 90, marginTop: 44, alignItems: 'center' }}>
      {/* SVG leaky bucket — vector, no overlap */}
      <svg
        width={440}
        height={470}
        viewBox="0 0 440 470"
        role="img"
        aria-label="漏桶示意图"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--osd-accent)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--osd-accent)" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* bucket body (trapezoid) */}
        <path
          d="M86 96 L354 96 L322 432 L118 432 Z"
          fill={tokens.color.surface}
          stroke={tokens.color.line}
          strokeWidth={3}
        />
        {/* water */}
        <path d="M99 150 L341 150 L322 432 L118 432 Z" fill="url(#water)" />
        {/* rim */}
        <ellipse
          cx={220}
          cy={96}
          rx={134}
          ry={22}
          fill={tokens.color.surface2}
          stroke={tokens.color.line}
          strokeWidth={3}
        />
        <ellipse cx={220} cy={150} rx={121} ry={16} fill="var(--osd-accent)" opacity={0.85} />
        {/* leak drips on the right wall */}
        {[
          [349, 168],
          [341, 246],
          [333, 324],
          [325, 402],
        ].map(([x, y]) => (
          <g key={y}>
            <circle cx={x} cy={y} r={6} fill={tokens.color.cool} />
            <path
              d={`M${x} ${y} q 26 6 30 36`}
              fill="none"
              stroke={tokens.color.cool}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.7}
            />
          </g>
        ))}
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <LeakRow label="流量" pct="进店少" />
          <LeakRow label="转化" pct="点单流失" />
          <LeakRow label="客单" pct="不敢加价" />
          <LeakRow label="复购" pct="不再回头" />
        </div>
        <p style={{ fontSize: 30, color: tokens.color.muted, lineHeight: 1.6, marginTop: 32 }}>
          往桶里加水（拉新引流）很贵；先把<b style={{ color: 'var(--osd-text)' }}>最大的缝</b>堵上，
          每一分投入的<b style={{ color: 'var(--osd-accent)' }}>改善弹性</b>最高。
        </p>
        <div style={{ marginTop: 26 }}>
          <Pill>二八聚焦：先堵 1 道，不要四处补</Pill>
        </div>
      </div>
    </div>
  </PageBase>
);
(Bucket as WithNotes).notes =
  '0:08–0:30｜用漏桶讲清「为什么不该一上来就砸钱拉新」。引导学员先猜自己最大的缝，再用 AI 验证。';

/* 12 — 夹层困境 case */
const SandwichRow = ({
  pos,
  name,
  desc,
  tone,
}: {
  pos: string;
  name: string;
  desc: string;
  tone?: 'bad';
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: 14,
      padding: '22px 28px',
    }}
  >
    <span
      style={{
        fontSize: 23,
        color: tone === 'bad' ? tokens.color.bad : 'var(--osd-accent)',
        fontWeight: 800,
        width: 130,
      }}
    >
      {pos}
    </span>
    <span style={{ fontSize: 30, fontWeight: 800, width: 220 }}>{name}</span>
    <span style={{ fontSize: 25, color: tokens.color.muted }}>{desc}</span>
  </div>
);
const Sandwich: Page = () => (
  <PageBase n={12} mod="M2 漏损定位" half="Day1 上午" min="75min">
    <Eyebrow>案例 · 夹层困境</Eyebrow>
    <H>中型连锁最惨：上下夹击</H>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 }}>
      <SandwichRow
        pos="上 · 抢客流"
        name="麻六记「麻小六」"
        desc="客单 15 元、装修像星巴克，抢走大众客流"
        tone="bad"
      />
      <SandwichRow
        pos="你 · 在中间"
        name="单店 / 3–5 家店"
        desc="房租比不过京东七鲜（37% 社区流量），供应链比不过巨头"
      />
      <SandwichRow
        pos="下 · 抢刚需"
        name="超意兴 / 锅圈"
        desc="10 元管饱抢刚需；锅圈截胡「在家做饭」场景"
        tone="bad"
      />
    </div>
    <p style={{ fontSize: 32, color: tokens.color.muted, marginTop: 40 }}>
      唯一活路不是拼规模、不是拼低价，而是<b style={{ color: 'var(--osd-accent)' }}>拼效率</b>
      ——用更少的人、更准的产品、赚更确定的钱。
    </p>
  </PageBase>
);
(Sandwich as WithNotes).notes =
  '0:30–0:45｜用真实品牌讲夹层困境。落点：你的缝隙是效率。引《竞争挤压自评表》两题（巨头抢走我__%、会不会被轻量店替代）。';

/* 13 — M2 AI core demo */
const M2AI: Page = () => (
  <PageBase n={13} mod="M2 漏损定位" half="Day1 上午" min="75min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ② · 核心演示</Eyebrow>
        <H>营收漏损诊断</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
      <AICol title="喂给 AI" items={['四率现状 + 行业基准', '门店成本结构', '近 3 个月趋势']} />
      <AICol
        title="AI 产出"
        items={['主漏洞排序（哪环最拖后腿）', '每环的改善弹性 %', '优先级建议：先堵哪道缝']}
      />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 40 }}>
      当场产出：<b style={{ color: 'var(--osd-text)' }}>《营收漏损自诊表》</b> + 主漏洞排序卡。
    </p>
  </PageBase>
);
(M2AI as WithNotes).notes =
  '0:45–1:05｜核心演示。现场拿一位学员数据跑漏损诊断，全场对照填《营收漏损自诊表》。助教下场辅导。';

/* 14 — M2 output */
const M2Out: Page = () => (
  <PageBase n={14} mod="M2 漏损定位" half="Day1 上午" min="75min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>当场产出</Eyebrow>
        <H>《营收漏损自诊表》</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={2} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 20, marginTop: 52 }}>
      <Card
        tag="第 1 步"
        title="填四率现状"
        body="进店 / 转化 / 客单 / 复购，对照行业基准。"
        tone="cool"
      />
      <Card tag="第 2 步" title="标出主漏洞" body="哪一环离基准最远、改善弹性最高。" />
      <Card tag="第 3 步" title="定优先级" body="60 天只先堵 1 道缝——写下它。" tone="good" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      离场目标：能一句话说清「我这家店，是流量不行，还是客单不行」。
    </p>
  </PageBase>
);
(M2Out as WithNotes).notes =
  '1:05–1:15｜收口。每人念出自己的主漏洞，助教记录错配严重的学员，午后产品诊断重点跟进。';

/* 15 — M3 cover */
const M3Cover: Page = () => (
  <PageBase n={15} mod="M3 竞争格局诊断" half="Day1 上午" min="45min">
    <Eyebrow>MODULE 03 · 诊断</Eyebrow>
    <H size={84}>竞争格局诊断</H>
    <Lead>画出你的 3 公里战场，只解你能控制的竞争——别和你抢不同客人的对手死拼低价。</Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M3Cover as WithNotes).notes = '0:00–0:05｜目标：把模糊的「生意难做」收敛成一张可操作的商圈地图。';

/* 16 — 3 公里战场 */
const M3Battle: Page = () => (
  <PageBase n={16} mod="M3 竞争格局诊断" half="Day1 上午" min="45min">
    <Eyebrow>三类竞争 · 只打能赢的</Eyebrow>
    <H>3 公里战场</H>
    <div style={{ display: 'flex', gap: 22, marginTop: 52 }}>
      <Card tag="横向" title="同品类对手" body="同样的菜，谁更赚？比的是效率与结构，不是嗓门。" />
      <Card
        tag="维度"
        title="跨业态分流"
        body="超市餐饮、零售预制、外卖平台——抢的是场景。"
        tone="cool"
      />
      <Card tag="内部" title="菜单自我蚕食" body="自己的菜互相打架，把高毛利埋没了。" tone="bad" />
    </div>
    <p style={{ fontSize: 32, color: tokens.color.muted, marginTop: 44 }}>
      原来我抢的不是同一拨客人——<b style={{ color: 'var(--osd-accent)' }}>找到你的独家生存空间</b>
      ，而不是跟谁拼低价。
    </p>
  </PageBase>
);
(M3Battle as WithNotes).notes =
  '0:05–0:25｜区分三类竞争。强调「内部蚕食」常被忽略，为午后产品结构铺垫。';

/* 17 — M3 AI + 产出 */
const M3AI: Page = () => (
  <PageBase n={17} mod="M3 竞争格局诊断" half="Day1 上午" min="45min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ③</Eyebrow>
        <H>商圈竞争扫描</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
      <AICol
        title="喂给 AI"
        items={['门店位置 + 3 公里商圈', '主要竞品名单与客单', '你的招牌与价格带']}
      />
      <AICol
        title="AI 产出"
        items={['竞品结构与软肋', '空白价格带 / 空白时段', '差异化卡位建议']}
      />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 40 }}>
      当场产出：<b style={{ color: 'var(--osd-text)' }}>《商圈竞争卡位图》</b> 初稿。
    </p>
  </PageBase>
);
(M3AI as WithNotes).notes =
  '0:25–0:45｜AI 扫商圈找软肋与空白带。提醒：卡位不是模仿对手，是找他做不到的那一块。';

/* 18 — M4 cover */
const M4Cover: Page = () => (
  <PageBase n={18} mod="M4 盈亏平衡测算" half="Day1 上午" min="75min">
    <Eyebrow>MODULE 04 · 诊断</Eyebrow>
    <H size={84}>盈亏平衡与扩张测算</H>
    <Lead>
      房租、人工、原料是刚性的。用倒推法算清生死三线：你每天必须卖多少、接待多少人才能活？
    </Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M4Cover as WithNotes).notes =
  '0:00–0:05｜公式先行：保本客流 = 总成本 ÷ 人均利润。强调固定成本雷打不动。';

/* 19 — 生死三线 */
const LineBar = ({
  label,
  sub,
  w,
  tone,
}: {
  label: string;
  sub: string;
  w: number;
  tone: 'bad' | 'gold' | 'good';
}) => {
  const c =
    tone === 'bad' ? tokens.color.bad : tone === 'good' ? tokens.color.good : 'var(--osd-accent)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ width: 200, textAlign: 'right' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: c }}>{label}</div>
        <div style={{ fontSize: 21, color: tokens.color.muted }}>{sub}</div>
      </div>
      <div
        style={{
          flex: 1,
          height: 36,
          background: tokens.color.surface,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          className="r-grow"
          style={{ width: `${w}%`, height: '100%', background: c, opacity: 0.85 }}
        />
      </div>
    </div>
  );
};
const SurvivalLines: Page = () => (
  <PageBase n={19} mod="M4 盈亏平衡测算" half="Day1 上午" min="75min">
    <Eyebrow>招牌信息图 · 生死三线</Eyebrow>
    <H>保本 · 盈利 · 扩张</H>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginTop: 56 }}>
      <LineBar label="保本线" sub="不亏的底线" w={55} tone="bad" />
      <LineBar label="盈利线" sub="净利率达标" w={75} tone="gold" />
      <LineBar label="扩张线" sub="能复制第二家" w={100} tone="good" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 48 }}>
      <b style={{ color: 'var(--osd-text)' }}>保本客流 = 总成本 ÷ 人均利润</b>
      。先知道底线在哪，才能谈扩张。
    </p>
  </PageBase>
);
(SurvivalLines as WithNotes).notes =
  '0:05–0:20｜三线逐条解释。多数老板只模糊知道「大概盈亏平衡」，今天要算到具体数字。';

/* 20 — 辣可可 case */
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
        fontSize: 60,
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
    <div style={{ fontSize: 24, color: tokens.color.muted, marginTop: 8 }}>{label}</div>
  </div>
);
const Laceco: Page = () => (
  <PageBase n={20} mod="M4 盈亏平衡测算" half="Day1 上午" min="75min">
    <Eyebrow>案例 · 辣可可（北京核心商圈）</Eyebrow>
    <H>同一座店，客单决定生死</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Stat big="36万" label="月固定成本（房租15+人工18+水电3）" />
      <Stat big="2万" label="每天保本营业额" />
    </div>
    <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
      <Stat big="308人" label="若卖 65 元客单，每天需进店" tone="bad" />
      <Stat big="235人" label="若卖 85 元客单，每天只需进店" tone="good" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      它死磕 80–90 元客单带，不是傲娇——是
      <b style={{ color: 'var(--osd-text)' }}>房租逼着它必须这么做</b>。
    </p>
  </PageBase>
);
(Laceco as WithNotes).notes =
  '0:20–0:40｜算辣可可的账。让学员体会客单带是被成本结构「算」出来的，不是拍脑袋定的。';

/* 21 — M4 AI + 产出 */
const M4AI: Page = () => (
  <PageBase n={21} mod="M4 盈亏平衡测算" half="Day1 上午" min="75min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ④</Eyebrow>
        <H>盈亏平衡测算器</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
      <AICol
        title="喂给 AI"
        items={['固定成本（房租/人工/水电）', '食材成本率 + 目标净利率', '日均客流 + 实际客单']}
      />
      <AICol
        title="AI 产出"
        items={['保本日营业额 / 保本客单', '敏感性：涨1元、减1人各影响多少', '你能不能开第二家']}
      />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 40 }}>
      当场产出：<b style={{ color: 'var(--osd-text)' }}>《门店保本测算表》《利润敏感度计算器》</b>。
    </p>
  </PageBase>
);
(M4AI as WithNotes).notes =
  '0:40–1:15｜实操：每人算出自己的保本客流与目标毛利率。助教解决 Excel/公式卡壳。算完举手。';

/* 22 — 重建 divider */
const PhaseRebuild: Page = () => (
  <Divider
    phase="阶段二 · REBUILD ①"
    title="重建 — 选模型 · 定结构"
    sub="先选一种活法（生存/扩张/防御），再让产品结构成为模型的「翻译器」。"
    n={22}
    half="Day1 下午"
  />
);
(PhaseRebuild as WithNotes).notes =
  '过场｜上午找到漏洞，下午开始修。先解决「方向」（模式），再解决「结构」（产品）。';

/* 23 — M5 cover */
const M5Cover: Page = () => (
  <PageBase n={23} mod="M5 商业模式选型" half="Day1 下午" min="75min">
    <Eyebrow>MODULE 05 · 重建</Eyebrow>
    <H size={84}>商业模式选型</H>
    <Lead>你开店到底为了什么？别说梦想，说人话。生存、扩张、防御——只能选一种活法。</Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M5Cover as WithNotes).notes =
  '0:00–0:05｜下午开场提问「你开店为了什么」。逼出明确目标，反对「既要又要还要」。';

/* 24 — 三型岔路口 */
const ModelCard = ({
  name,
  verb,
  who,
  who2,
  tone,
}: {
  name: string;
  verb: string;
  who: string;
  who2: string;
  tone: 'bad' | 'gold' | 'good';
}) => {
  const c =
    tone === 'bad' ? tokens.color.bad : tone === 'good' ? tokens.color.good : 'var(--osd-accent)';
  return (
    <div
      style={{
        flex: 1,
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.line}`,
        borderTop: `5px solid ${c}`,
        borderRadius: 14,
        padding: '30px 28px',
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 900 }}>{name}</div>
      <div style={{ fontSize: 70, fontWeight: 900, color: c, margin: '8px 0 14px' }}>{verb}</div>
      <div style={{ fontSize: 25, color: tokens.color.muted, lineHeight: 1.5 }}>{who}</div>
      <div style={{ fontSize: 23, color: c, fontWeight: 700, marginTop: 16 }}>案例：{who2}</div>
    </div>
  );
};
const ThreeModels: Page = () => (
  <PageBase n={24} mod="M5 商业模式选型" half="Day1 下午" min="75min">
    <Eyebrow>三种模型 · 三种活法</Eyebrow>
    <H>菜单跟着模式走</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 44 }}>
      <ModelCard
        name="生存型"
        verb="砍"
        who="亏损边缘：砍掉一切不赚钱的花哨菜，保净利。"
        who2="超意兴 10 元快餐"
        tone="bad"
      />
      <ModelCard
        name="扩张型"
        verb="简"
        who="5–50 家店：标准化、去厨师化，可复制优先。"
        who2="麻六记「麻小六」"
        tone="gold"
      />
      <ModelCard
        name="防御型"
        verb="特"
        who="区域头牌：做差异化、拉复购，守住护城河。"
        who2="南城香 22 元客单"
        tone="good"
      />
    </div>
  </PageBase>
);
(ThreeModels as WithNotes).notes =
  '0:05–0:25｜三型一句话+案例。提大米先生供应链降本（4.6→3.28 元/两）——降价反而利润高，是利润型的产品翻译。';

/* 25 — 只圈一个 */
const M5Pick: Page = () => (
  <PageBase n={25} mod="M5 商业模式选型" half="Day1 下午" min="75min">
    <Eyebrow>选型三问 · 互动</Eyebrow>
    <H>明年的核心目标，只能圈一个</H>
    <ul
      style={{
        fontSize: 36,
        lineHeight: 1.9,
        marginTop: 40,
        paddingLeft: 36,
        color: tokens.color.muted,
      }}
    >
      <li>我现在的店，在哪条生死线上？</li>
      <li>抽走我本人，店还转得动吗？（依赖度）</li>
      <li>我要的是规模、利润，还是品牌？</li>
    </ul>
    <p style={{ fontSize: 34, color: 'var(--osd-text)', marginTop: 36 }}>
      在《自检表》圈出唯一核心目标——
      <b style={{ color: 'var(--osd-accent)' }}>既要规模又要利润还要品牌，今天就白来了。</b>
    </p>
  </PageBase>
);
(M5Pick as WithNotes).notes = '0:25–0:40｜逼学员做单选。这一步决定后面所有产品/定价动作的方向。';

/* 26 — M5 AI + 产出 */
const M5AI: Page = () => (
  <PageBase n={26} mod="M5 商业模式选型" half="Day1 下午" min="75min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ⑤</Eyebrow>
        <H>模式自检</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
      <AICol
        title="喂给 AI"
        items={['你的生死线结果', '现有菜单与厨师依赖度', '门店数量与扩张意图']}
      />
      <AICol title="AI 产出" items={['你更接近哪一型', '模型与产品结构的错配点', '迁移路径建议']} />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 40 }}>
      当场产出：<b style={{ color: 'var(--osd-text)' }}>《模式自检表》</b> + 选型结论。
    </p>
  </PageBase>
);
(M5AI as WithNotes).notes =
  '0:40–1:15｜AI 给出客观判断，避免老板的一厢情愿。重点看「错配」——下一模块专治。';

/* 27 — M6 cover */
const M6Cover: Page = () => (
  <PageBase n={27} mod="M6 产品结构诊断" half="Day1 下午" min="90min">
    <Eyebrow>MODULE 06 · 重建 · 核心演示</Eyebrow>
    <H size={84}>产品结构是「翻译器」</H>
    <Lead>很多老板死在这：模型是生存型，产品结构却是扩张型。让模式、结构、感知三段对齐。</Lead>
    <div style={{ marginTop: 48 }}>
      <BeatStrip active={0} />
    </div>
  </PageBase>
);
(M6Cover as WithNotes).notes =
  '0:00–0:08｜本模块含 30min AI 核心演示。先讲「翻译器」概念，再讲四种错配，再讲财务护栏。';

/* 28 — translator visual */
const TBox = ({ t, s }: { t: string; s: string }) => (
  <div
    style={{
      flex: 1,
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: 14,
      padding: '30px 26px',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: 34, fontWeight: 800 }}>{t}</div>
    <div style={{ fontSize: 24, color: tokens.color.muted, marginTop: 10, lineHeight: 1.45 }}>
      {s}
    </div>
  </div>
);
const Translator: Page = () => (
  <PageBase n={28} mod="M6 产品结构诊断" half="Day1 下午" min="90min">
    <Eyebrow>招牌信息图 · 翻译器</Eyebrow>
    <H>模式 → 产品结构 → 顾客感知</H>
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 56 }}>
      <TBox t="商业模式" s="生存 / 扩张 / 防御" />
      <span style={{ fontSize: 54, color: 'var(--osd-accent)' }}>→</span>
      <TBox t="产品结构" s="主辅佐引 + 价格带 + SKU" />
      <span style={{ fontSize: 54, color: 'var(--osd-accent)' }}>→</span>
      <TBox t="顾客感知" s="值不值 / 来不来 / 回不回" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 48 }}>
      产品结构就是把抽象的「模式」翻译成顾客能感知的「菜单」。翻错了，再努力都白费。
    </p>
  </PageBase>
);
(Translator as WithNotes).notes =
  '0:08–0:25｜核心隐喻。把它说成一台翻译机：输入模式，输出顾客感知。';

/* 29 — 四种错配 */
const Mismatch: Page = () => (
  <PageBase n={29} mod="M6 产品结构诊断" half="Day1 下午" min="90min">
    <Eyebrow>四种典型错配</Eyebrow>
    <H>对照你的菜单，错配就画个大叉</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 44 }}>
      <Card
        tag="错配 1"
        tone="bad"
        title="生存型 × 功夫菜"
        body="想省钱，菜单全是复杂功夫菜——厨师贵、损耗大。"
      />
      <Card
        tag="错配 2"
        tone="bad"
        title="扩张型 × 难标准化"
        body="要开分店，核心产品却无法去厨师化。"
      />
    </div>
    <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
      <Card
        tag="错配 3"
        tone="bad"
        title="防御型 × 无差异"
        body="区域头牌却跟风大流，护城河被填平。"
      />
      <Card
        tag="错配 4"
        tone="bad"
        title="主不主 · 辅不辅"
        body="主菜 5 个=没有主君；全是贵菜=没人敢点。"
      />
    </div>
  </PageBase>
);
(Mismatch as WithNotes).notes =
  '0:25–0:40｜让学员现场对照打叉。第 4 种「主不主辅不辅」是 Day2 主辅佐引的引子。';

/* 30 — 财务护栏 */
const Guard = ({ k, v, s }: { k: string; v: string; s: string }) => (
  <div
    style={{
      flex: 1,
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: 14,
      padding: '26px 26px',
    }}
  >
    <div style={{ fontSize: 24, color: tokens.color.muted }}>{k}</div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 54,
        fontWeight: 900,
        color: 'var(--osd-accent)',
        margin: '6px 0',
      }}
    >
      {v}
    </div>
    <div style={{ fontSize: 23, color: tokens.color.muted, lineHeight: 1.45 }}>{s}</div>
  </div>
);
const Guardrails: Page = () => (
  <PageBase n={30} mod="M6 产品结构诊断" half="Day1 下午" min="90min">
    <Eyebrow>财务护栏 · 产品要算账</Eyebrow>
    <H>产品即盈利模型</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Guard k="EBITDA 占比" v="≥ 20%" s="产品矩阵需贡献足够毛利支撑现金流" />
      <Guard k="FLR（食材+人工+房租）" v="≤ 60–70%" s="避免产品过复杂导致成本失控" />
    </div>
    <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
      <Guard k="投资回收期" v="12–24月" s="降低单店复杂度、提升可复制性" />
      <Guard k="单店投资（一线）" v="≤8000元/㎡" s="核心 SOP≤3 步、减少专用设备" />
    </div>
  </PageBase>
);
(Guardrails as WithNotes).notes =
  '0:40–0:55｜给产品设计套上财务护栏。EBITDA<20% 的产品直接砍。为午后 AI 演示做铺垫。';

/* 31 — M6 AI core demo + 产出 */
const M6AI: Page = () => (
  <PageBase n={31} mod="M6 产品结构诊断" half="Day1 下午" min="90min">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Eyebrow>门店 AI 副驾 ⑥ · 核心演示 30min</Eyebrow>
        <H>菜单诊断包</H>
      </div>
      <div style={{ marginTop: 12 }}>
        <BeatStrip active={1} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Card tag="SKU 诊断" title="哪些该砍" body="按毛利+销量+标准化三维清洗" tone="bad" />
      <Card tag="价格带" title="结构是否健康" body="是否扎堆中间死亡带" />
      <Card tag="新品影响" title="加了会怎样" body="对成本/人工/复杂度的连锁影响" tone="cool" />
      <Card tag="砍菜判断" title="这道菜留不留" body="给出量化理由，不再舍不得" tone="good" />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 38 }}>
      当场产出：<b style={{ color: 'var(--osd-text)' }}>《菜品毛利透视表》</b> + 错配点清单。
    </p>
  </PageBase>
);
(M6AI as WithNotes).notes =
  '0:55–1:30｜30min AI 核心演示：现场剥洋葱，算每道菜真实毛利。「这道菜卖了10年，今天才知道它在亏钱」。';

/* 32 — Day1 复盘 */
const Day1Recap: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${tokens.space.padX}px`,
      background:
        'radial-gradient(1100px 600px at 22% 80%, rgba(123,178,126,0.10), transparent 60%), var(--osd-bg)',
    }}
  >
    <Style />
    <Eyebrow>DAY 1 · 复盘</Eyebrow>
    <h1
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 92,
        fontWeight: 900,
        margin: '20px 0 0',
        lineHeight: 1.12,
      }}
    >
      你的店，到底是
      <br />
      流量不行，还是客单不行？
    </h1>
    <p
      style={{
        fontSize: 34,
        color: tokens.color.muted,
        marginTop: 40,
        maxWidth: 1300,
        lineHeight: 1.55,
      }}
    >
      晚间作业：用今天的模板整理门店完整数据，完成《门店现状诊断书》初稿。明天我们解决「怎么改」。
    </p>
    <Footer n={32} mod="复盘" half="Day1 下午" />
  </div>
);
(Day1Recap as WithNotes).notes =
  '1:30–1:45｜当日复盘。逼出一句话结论（流量 vs 客单）。布置晚间作业，预告 Day2 是工具落地日。';

/* ============================================================
   ENRICHMENT PAGES — depth slides interleaved into the flow
   ============================================================ */

/* 开场 · 学习契约三原则 */
const Contract: Page = () => (
  <PageBase mod="开场" half="Day1 上午">
    <Eyebrow>学习契约 · 三原则</Eyebrow>
    <H>今天，这堂课这么上</H>
    <div style={{ display: 'flex', gap: 24, marginTop: 52 }}>
      <Card
        tag="原则 1"
        title="不熬鸡汤，只算账"
        body="每个结论都落到你自己的数字上——听完能算、能改、能复算。"
      />
      <Card
        tag="原则 2"
        tone="cool"
        title="AI 做副驾，不做表演"
        body="每模块现场跑工具，带走结论与表格，不是看热闹。"
      />
      <Card
        tag="原则 3"
        tone="good"
        title="即学即用，当场产出"
        body="每节课结束，手里多一张填好的图纸，离场即可执行。"
      />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      请拿出《进场数据卡》。没有数据的课今天会很难受——
      <b style={{ color: 'var(--osd-text)' }}>这正是它值钱的地方</b>。
    </p>
  </PageBase>
);
(Contract as WithNotes).notes =
  '0:05 衔接｜立规矩：算账、AI 副驾、当场产出。把“记笔记”预期换成“带交付物”预期。';

/* 开场 · 终态倒推：盯店→掌舵 */
const EndState: Page = () => (
  <PageBase mod="开场" half="Day1 上午">
    <Eyebrow>终态倒推 · 两天后的你</Eyebrow>
    <H>从「盯店」到「掌舵」</H>
    <div style={{ display: 'flex', gap: 22, marginTop: 52, alignItems: 'stretch' }}>
      <Card
        tag="现在 · 盯店"
        tone="bad"
        title="人在店在，人走店乱"
        body="口味、调度、关键决策全压在你一个人身上，离不开。"
      />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 60, color: 'var(--osd-accent)', fontWeight: 800 }}>→</span>
      </div>
      <Card
        tag="两天后 · 掌舵"
        tone="good"
        title="模型在转，你在选方向"
        body="把你的能力沉淀成店的规矩，抽走你也能赚钱、能复制。"
      />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      目标不是让你更累，而是让这家店在你不盯着时<b style={{ color: 'var(--osd-text)' }}>照样赚钱</b>
      。
    </p>
  </PageBase>
);
(EndState as WithNotes).notes =
  '0:08 衔接｜先给“两天后的终态”，让学员带着目标听。掌舵 = 模型化 + 可复制。';

/* 开场 · 进场数据卡（Day1 现场版） */
const DataCardD1: Page = () => (
  <PageBase mod="开场" half="Day1 上午">
    <Eyebrow>进场数据卡 · 今天的「原料」</Eyebrow>
    <H>把这 7 个数字摆上桌</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 44 }}>
      <AICol
        title="成本三项 + 食材率"
        items={[
          '① 月度房租（实际金额）',
          '② 月度人工（含社保 / 提成）',
          '③ 月度水电杂费',
          '④ 食材成本率（去年全年）',
        ]}
      />
      <AICol
        title="经营两项 + 对手"
        items={[
          '⑤ 日均客流量（近一月）',
          '⑥ 实际客单价（近一月）',
          '⑦ 3 公里内最怕的对手',
          '思考：房租涨 20%，还活得了吗？',
        ]}
      />
    </div>
    <p style={{ fontSize: 28, color: tokens.color.faint, marginTop: 36 }}>
      没填的现在补——后面<b style={{ color: 'var(--osd-text)' }}>每一个工具都吃这些数</b>。
    </p>
  </PageBase>
);
(DataCardD1 as WithNotes).notes =
  '0:00 衔接｜确认人人有种子数据。缺数据的学员就近结对，助教补位，保证后续能跑工具。';

/* M1 · 外部三压力 */
const ThreePressures: Page = () => (
  <PageBase mod="M1 经营现状诊断" half="Day1 上午" min="45min">
    <Eyebrow>外部三压力</Eyebrow>
    <H>你被三股力量同时挤压</H>
    <div style={{ display: 'flex', gap: 22, marginTop: 52 }}>
      <Card
        tag="行业压力"
        tone="bad"
        title="77.2% 无增长"
        body="大盘从增量转存量，靠“水涨船高”的红利没了。"
      />
      <Card tag="成本压力" title="房租人工刚性涨" body="固定成本逐年抬升，挤压本就薄的净利。" />
      <Card
        tag="竞争压力"
        tone="cool"
        title="上下夹击"
        body="巨头抢规模、轻量店抢刚需，中间最难受。"
      />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      三股力你都改不了——能改的只有
      <b style={{ color: 'var(--osd-accent)' }}>自己的效率与结构</b>。这就是今天的全部工作。
    </p>
  </PageBase>
);
(ThreePressures as WithNotes).notes =
  '0:05 衔接｜先建立“外部不可控、内部才是战场”的全局框架，引出后续四个诊断工具。';

/* M1 · 组织依赖度自评 */
const DepRow = ({ q, bad }: { q: string; bad?: boolean }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: 12,
      padding: '20px 26px',
    }}
  >
    <span
      style={{
        fontSize: 26,
        fontWeight: 900,
        color: bad ? tokens.color.bad : tokens.color.good,
        width: 44,
      }}
    >
      {bad ? '✗' : '✓'}
    </span>
    <span style={{ fontSize: 28, color: tokens.color.muted }}>{q}</span>
  </div>
);
const DependencyCheck: Page = () => (
  <PageBase mod="M1 经营现状诊断" half="Day1 上午" min="45min">
    <Eyebrow>组织依赖度 · 自评</Eyebrow>
    <H>抽走你，这家店还转得动吗？</H>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40 }}>
      <DepRow q="核心菜的味道，离了某位师傅就变" bad />
      <DepRow q="排班、采购、收银对账，最后都要你拍板" bad />
      <DepRow q="新人不看你示范，靠 SOP 也能上手" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 36 }}>
      打叉越多，<b style={{ color: tokens.color.bad }}>越不可复制</b>
      。今天先记下来，Day2 用连锁化工具逐项拆解。
    </p>
  </PageBase>
);
(DependencyCheck as WithNotes).notes =
  '0:35 衔接｜埋“依赖你=不可复制”的钩子。让学员自评打叉，为 Day2 连锁化诊断蓄势。';

/* M2 · 营收驱动树 */
const DriverTree: Page = () => (
  <PageBase mod="M2 漏损定位" half="Day1 上午" min="75min">
    <Eyebrow>营收驱动树</Eyebrow>
    <H>每个数字背后，都有可拧的螺丝</H>
    <div
      style={{
        fontSize: 30,
        color: tokens.color.muted,
        marginTop: 28,
        marginBottom: 28,
      }}
    >
      营收 = <b style={{ color: 'var(--osd-text)' }}>流量 × 转化 × 客单 × 复购</b>
      ——别盯着“营收”发愁，去拧下面的螺丝。
    </div>
    <div style={{ display: 'flex', gap: 18 }}>
      <AICol title="流量" items={['选址 / 动线', '线上曝光', '招牌可见度']} />
      <AICol title="转化" items={['菜单清晰度', '出餐速度', '迎客服务']} />
      <AICol title="客单" items={['套餐 / 加购', '主辅佐引', '价格带设计']} />
      <AICol title="复购" items={['口味稳定', '会员钩子', '第二份机制']} />
    </div>
  </PageBase>
);
(DriverTree as WithNotes).notes =
  '0:08 衔接｜把抽象“营收”拆成可操作杠杆。每根螺丝都对应后面的某个工具/模块。';

/* M2 · 改善弹性排序 */
const ElasticityRank: Page = () => (
  <PageBase mod="M2 漏损定位" half="Day1 上午" min="75min">
    <Eyebrow>改善弹性排序</Eyebrow>
    <H>同样花一块钱，回报差十倍</H>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, marginTop: 48 }}>
      <LineBar label="复购" sub="留住老客，复利最高" w={100} tone="good" />
      <LineBar label="客单" sub="结构性提价，立竿见影" w={80} tone="gold" />
      <LineBar label="转化" sub="把进来的人留下" w={62} tone="gold" />
      <LineBar label="流量" sub="拉新最贵，弹性最低" w={40} tone="bad" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      多数老板第一反应是“拉新”——恰恰是
      <b style={{ color: tokens.color.bad }}>弹性最低</b>的那一环。先修弹性最高的。
    </p>
  </PageBase>
);
(ElasticityRank as WithNotes).notes =
  '0:30 衔接｜用弹性条排序纠正“一缺客就投流”的本能。指向漏桶最大缝优先。';

/* M3 · 差异化卡位案例 */
const DiffCase: Page = () => (
  <PageBase mod="M3 竞争格局诊断" half="Day1 上午" min="45min">
    <Eyebrow>案例 · 找到独家空间</Eyebrow>
    <H>别在红海里拼刀，去蓝海卡位</H>
    <div style={{ display: 'flex', gap: 20, marginTop: 48 }}>
      <Card
        tag="时段空白"
        tone="good"
        title="全时段经营"
        body="南城香靠早餐 + 全时段，吃下对手不做的时段。"
      />
      <Card
        tag="场景空白"
        title="一人食 / 家庭"
        body="对手做聚餐，你就做“一个人也舒服”的场景。"
        tone="cool"
      />
      <Card tag="价格带空白" title="被让出的中段" body="两端拥挤时，结构化吃下被忽略的价格带。" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 44 }}>
      卡位 = 做对手<b style={{ color: 'var(--osd-accent)' }}>做不到或不愿做</b>
      的那一块，而不是更便宜。
    </p>
  </PageBase>
);
(DiffCase as WithNotes).notes =
  '0:25 衔接｜把“差异化”讲具体：时段/场景/价格带三类空白。为午后产品结构铺路。';

/* M4 · 成本刚性 */
const CostRigidity: Page = () => (
  <PageBase mod="M4 盈亏平衡测算" half="Day1 上午" min="75min">
    <Eyebrow>成本是刚性的</Eyebrow>
    <H>房租人工不会等你</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Stat big="铁" label="房租 · 签了就跑不掉" tone="bad" />
      <Stat big="半铁" label="人工 · 短期难压缩" tone="bad" />
      <Stat big="可调" label="食材率 · 靠供应链与结构" tone="good" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      固定成本雷打不动，能动的只有
      <b style={{ color: 'var(--osd-accent)' }}>食材率与效率</b>
      ——这正是为什么要从产品结构下手。
    </p>
  </PageBase>
);
(CostRigidity as WithNotes).notes =
  '0:05 衔接｜让学员接受“成本端能动的很有限”，把注意力逼向客单/结构端。';

/* M4 · 利润敏感度沙盘 */
const Sensitivity: Page = () => (
  <PageBase mod="M4 盈亏平衡测算" half="Day1 上午" min="75min">
    <Eyebrow>利润敏感度 · 沙盘</Eyebrow>
    <H>动一个变量，利润抖三抖</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 40 }}>
      <Stat big="+5元" label="客单提 5 元 / 月利变化" tone="good" />
      <Stat big="+0.2" label="翻台提 0.2 次 / 月利变化" tone="good" />
    </div>
    <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
      <Stat big="-2%" label="食材率降 2 个点 / 月利变化" tone="good" />
      <Stat big="-1人" label="少排 1 个班 / 月利变化" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 36 }}>
      用《利润敏感度计算器》找出对你这家店
      <b style={{ color: 'var(--osd-text)' }}>最敏感</b>的那个杠杆，集中发力。
    </p>
  </PageBase>
);
(Sensitivity as WithNotes).notes =
  '0:55 衔接｜现场让每人按自己的数试算一个变量，体会“小变量、大利润”。';

/* 上午小结 · 下午预告 */
const NoonRecap: Page = () => (
  <PageBase mod="复盘" half="Day1 上午">
    <Eyebrow>上午小结 · 下午预告</Eyebrow>
    <H>诊断完成，下午开修</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 48 }}>
      <RoadStep k="上午 · 已完成" t="诊断 ✓" s="三压力 / 漏损 / 竞争 / 生死线 全部算清" on />
      <RoadStep k="下午 · 即将开始" t="重建 ①" s="选模型（M5）+ 定产品结构（M6）" />
    </div>
    <p style={{ fontSize: 32, color: tokens.color.muted, marginTop: 44 }}>
      离场前先说清一句话：「我这家店最大的漏洞是
      <b style={{ color: 'var(--osd-accent)' }}>＿＿</b>，下一步方向是
      <b style={{ color: 'var(--osd-accent)' }}>＿＿</b>。」
    </p>
  </PageBase>
);
(NoonRecap as WithNotes).notes =
  '午间衔接｜收口上午、预告下午。逼出一句话结论模板，午饭时也在想答案。';

/* M5 · 大米先生供应链案例 */
const DamiCase: Page = () => (
  <PageBase mod="M5 商业模式选型" half="Day1 下午" min="75min">
    <Eyebrow>案例 · 大米先生</Eyebrow>
    <H>降价，反而更赚钱？</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Stat big="4.6→3.28" label="米饭成本 元/两（供应链下压）" tone="good" />
      <Stat big="↓售价" label="对客降价，体感更值" />
      <Stat big="↑翻台" label="客流与翻台齐升，总利更高" tone="good" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      扩张型的产品翻译：靠
      <b style={{ color: 'var(--osd-accent)' }}>供应链 + 标准化</b>
      把成本压下来，把“降价”变成竞争力。
    </p>
  </PageBase>
);
(DamiCase as WithNotes).notes =
  '0:20 衔接｜用大米先生说明“模式决定打法”。扩张型靠成本与标准化，不是靠手艺。';

/* M5 · 迁移路径 */
const MigrationPath: Page = () => (
  <PageBase mod="M5 商业模式选型" half="Day1 下午" min="75min">
    <Eyebrow>迁移路径 · 别原地纠结</Eyebrow>
    <H>从现状，走到目标型</H>
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 56 }}>
      <TBox t="现状" s="主不主、辅不辅，四不像" />
      <span style={{ fontSize: 54, color: 'var(--osd-accent)' }}>→</span>
      <TBox t="过渡 60 天" s="砍瘦狗、立主君、补缺位" />
      <span style={{ fontSize: 54, color: 'var(--osd-accent)' }}>→</span>
      <TBox t="目标型" s="生存 / 扩张 / 防御 任选其一" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 48 }}>
      选型不是贴个标签，是规划一条
      <b style={{ color: 'var(--osd-text)' }}>60 天能走完</b>的路。
    </p>
  </PageBase>
);
(MigrationPath as WithNotes).notes =
  '0:30 衔接｜避免学员“纠结哪一型”。强调先定目标型，再设计过渡动作。';

/* M6 · 剥洋葱真实毛利案例 */
const OnionCase: Page = () => (
  <PageBase mod="M6 产品结构诊断" half="Day1 下午" min="90min">
    <Eyebrow>案例 · 剥洋葱算真账</Eyebrow>
    <H>「卖了十年，今天才知它在亏钱」</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
      <Stat big="60%" label="账面毛利（只看食材）" />
      <Stat big="-损耗 -工时 -能耗" label="层层剥开看不见的成本" tone="bad" />
      <Stat big="18%" label="真实毛利（剥完之后）" tone="bad" />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      真实毛利要把损耗、人工工时、能耗摊销
      <b style={{ color: 'var(--osd-text)' }}>一层层剥进去</b>——AI 帮你算到见底。
    </p>
  </PageBase>
);
(OnionCase as WithNotes).notes =
  '0:40 衔接｜“剥洋葱”是 M6 AI 演示的预热，制造“原来在亏钱”的震撼记忆点。';

/* M6 · 砍菜决策树 */
const CutTree: Page = () => (
  <PageBase mod="M6 产品结构诊断" half="Day1 下午" min="90min">
    <Eyebrow>砍菜决策 · 不再舍不得</Eyebrow>
    <H>一道菜留不留，问三句</H>
    <div style={{ display: 'flex', gap: 18, marginTop: 48 }}>
      <Card tag="问 1" tone="bad" title="低销 + 低毛？" body="直接砍——哪怕是你最爱吃的那道。" />
      <Card tag="问 2" title="高毛却没人点？" body="先救一轮：换版位、改话术、做组合。" />
      <Card
        tag="问 3"
        tone="cool"
        title="单店明星却难标准化？"
        body="连锁陷阱款：单店留，扩张前必须改造。"
      />
    </div>
    <p style={{ fontSize: 30, color: tokens.color.muted, marginTop: 40 }}>
      把“舍不得”换成<b style={{ color: 'var(--osd-accent)' }}>三个问句</b>，决策就不再情绪化。
    </p>
  </PageBase>
);
(CutTree as WithNotes).notes =
  '0:50 衔接｜给“砍菜”一套可执行判据，承接 M6 AI 砍菜判断，避免凭感觉。';

/* Day1 → Day2 桥接预告 */
const DayBridge: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${tokens.space.padX}px`,
      background:
        'radial-gradient(1100px 640px at 78% 22%, rgba(224,168,94,0.12), transparent 58%), var(--osd-bg)',
    }}
  >
    <Style />
    <Eyebrow>承上启下 · DAY 1 → DAY 2</Eyebrow>
    <h1
      className="r-up"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 104,
        fontWeight: 900,
        margin: '18px 0 0',
        lineHeight: 1.12,
      }}
    >
      今天找到漏洞，
      <br />
      明天把菜单变成<span style={{ color: 'var(--osd-accent)' }}>印钞机</span>。
    </h1>
    <p style={{ fontSize: 34, color: tokens.color.muted, marginTop: 36, maxWidth: 1300 }}>
      Day2 全是工具落地：菜单工程 · 主辅佐引 · 双峰定价 · 九宫格 · 连锁化 · 60 天承诺。
    </p>
    <Footer mod="承上启下" half="Day1 下午" />
  </div>
);
(DayBridge as WithNotes).notes = '1:30 衔接｜在复盘前给一张“预告片”，制造对 Day2 工具日的期待。';

export const meta: SlideMeta = { title: '餐饮盈利突围 · Day1（诊断+重建①）' };

const rawPages = [
  Cover, // 01
  Punch, // 02
  Contract, // 03
  EndState, // 04
  Formula, // 05
  Map2Day, // 06
  DataCardD1, // 07
  PhaseDiagnose, // 08
  M1Cover, // 09
  ThreePressures, // 10
  Pyramid, // 11
  WayDao, // 12
  DependencyCheck, // 13
  M1AI, // 14
  M2Cover, // 15
  Bucket, // 16
  DriverTree, // 17
  ElasticityRank, // 18
  Sandwich, // 19
  M2AI, // 20
  M2Out, // 21
  M3Cover, // 22
  M3Battle, // 23
  DiffCase, // 24
  M3AI, // 25
  M4Cover, // 26
  SurvivalLines, // 27
  CostRigidity, // 28
  Laceco, // 29
  Sensitivity, // 30
  M4AI, // 31
  NoonRecap, // 32
  PhaseRebuild, // 33
  M5Cover, // 34
  ThreeModels, // 35
  DamiCase, // 36
  MigrationPath, // 37
  M5Pick, // 38
  M5AI, // 39
  M6Cover, // 40
  Translator, // 41
  Mismatch, // 42
  OnionCase, // 43
  Guardrails, // 44
  CutTree, // 45
  M6AI, // 46
  DayBridge, // 47
  Day1Recap, // 48
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
