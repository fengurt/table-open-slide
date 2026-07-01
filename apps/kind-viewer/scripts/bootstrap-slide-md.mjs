/**
 * Generate bilingual {slideId}.md from HTML + professional Chinese (kindbp-cn-v20260520.md).
 * Run: node apps/kind-viewer/scripts/bootstrap-slide-md.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const deckRoot = path.join(repoRoot, 'slides/kind-bp01/kind_presentation');

function extractInner(html) {
  const open = html.match(/<div class="slide-container"[^>]*>/i);
  if (!open) return '';
  const start = html.indexOf(open[0]) + open[0].length;
  const slice = html.slice(start);
  let depth = 1;
  let i = 0;
  while (i < slice.length && depth > 0) {
    const nextOpen = slice.indexOf('<div', i);
    const nextClose = slice.indexOf('</div>', i);
    if (nextClose === -1) break;
    const isDivOpen = nextOpen !== -1 && nextOpen < nextClose;
    if (isDivOpen) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) return slice.slice(0, nextClose).trim();
      i = nextClose + 6;
    }
  }
  return slice.trim();
}

function applyPairs(text, pairs) {
  let out = text;
  for (const [from, to] of pairs) {
    out = out.split(from).join(to);
  }
  return out;
}

/** @type {Record<string, [string, string][]>} */
const SLIDE_ZH = {
  title_slide: [
    ['Redefining Expertise', '重新定义专业力'],
    ['KiND: Redefining Expertise in the AI Era', 'KiND：在 AI 时代重新定义专业力'],
    [
      'Hardware-Software Integration | Expert Mentorship | Result Delivery',
      '软硬一体 · 专家陪跑 · 结果交付',
    ],
    ['Not for few. For all. KiND FOR ALL.', 'Not for few. For all. 普惠专业力'],
  ],
  mission_vision: [
    ['Our Mission', '愿景与使命'],
    [
      'Democratizing high-end expertise for every individual and enterprise.',
      '让每个专家变成一千个专家，让每个企业请得起世界级专家。',
    ],
    [
      'When AI makes <strong>knowing</strong> free, KiND makes <strong>experts</strong> reachable.',
      '当 AI 让<strong>「知道」</strong>变得免费，KiND 让<strong>「专家」</strong>变得人人可及。',
    ],
    ['KIND<br>FOR<br>ALL', '普惠<br>专业力'],
  ],
  problem_gap: [
    ['THE<br>GAP', '核心<br>缺口'],
    ['Knowledge vs. Action', '知道 ≠ 能交付'],
    [
      'Standard AI provides information but lacks execution depth and real-world nuance.',
      '通用 AI 提供信息，却缺乏执行深度与真实场景判断。',
    ],
    ['The Trust Deficit', '信任赤字'],
    [
      'Enterprises need verified expert insights, not generic, unverified model hallucinations.',
      '企业需要被验证的专家洞察，而非泛泛、未经验证的模型幻觉。',
    ],
    ['Decision Friction', '决策摩擦'],
    [
      'Software-only tools face long procurement cycles and suffer from low user adoption.',
      '纯软件工具采购周期长、落地难，难以承载高敏感、高价值知识。',
    ],
  ],
  solution_pillars: [
    ['Strategic Framework', '战略框架'],
    ['The KiND Solution:<br>Three Pillars', 'KiND 方案：三大支柱'],
    ['Hardware-Software Integration', '软硬一体'],
    [
      'Tangible presence that lowers decision barriers and creates a seamless interaction layer beyond standard SaaS.',
      '实体设备降低决策门槛，创造超越标准 SaaS 的沉浸式交互层。',
    ],
    ['Expert Deep Mentorship', '专家深度陪跑'],
    [
      'Moving beyond tools to active guidance, backed by real expert oversight and the OPC Global network.',
      '超越工具交付，由真实专家监督与 OPC Global 网络提供主动陪跑。',
    ],
    ['Result Delivery', '结果交付'],
    [
      "We don't sell features; we deliver business outcomes in marketing, sales, and consulting with measurable ROI.",
      '不卖功能，交付营销、销售、咨询等可量化业务成果。',
    ],
  ],
  product_clones: [
    ['AI Expert Clones', 'AI 专家分身'],
    ['Digital Twins', '高保真数字孪生'],
    [
      'Creating high-fidelity AI versions of top-tier experts, capturing their unique methodology, tone, and decision-making logic.',
      '复刻顶尖专家的方法论、语气与决策逻辑，构建高保真 AI 分身。',
    ],
    ['IP Protection', 'IP 保护'],
    [
      'Secure, private training on expert-specific datasets. We ensure the "Clone" remains the exclusive property of the expert.',
      '基于专家私有数据安全训练，分身 IP 归专家独家所有。',
    ],
    ['Massive Reach', '规模化触达'],
    [
      'One expert can serve thousands of clients simultaneously with "clone" precision, breaking the linear time-for-money trap.',
      '一位专家可同时服务数千客户，打破「时间换金钱」的线性瓶颈。',
    ],
  ],
  pillar_1_hardware: [
    ['PILLAR // 01', '支柱 // 01'],
    ['HARDWARE<br>SOFTWARE<br>INTEGRATION', '软硬<br>一体'],
    ['Physical Presence', '物理在场'],
    [
      'Tangible devices signify commitment and premium service, moving beyond the "invisible" nature of SaaS.',
      '专属硬件象征承诺与高端服务，超越 SaaS「无形」的局限。',
    ],
    ['Reduced Decision Cycles', '缩短决策周期'],
    [
      'Hardware presence lowers enterprise decision barriers by providing a clear, physical asset for procurement.',
      '实体设备为采购提供清晰资产锚点，显著降低企业决策门槛。',
    ],
    ['Seamless Interaction', '沉浸交互'],
    [
      'Dedicated hardware provides a focused, high-fidelity interaction experience that mobile apps cannot replicate.',
      '专用硬件提供 App 无法复制的专注、高保真交互体验。',
    ],
  ],
  pillar_2_mentorship: [
    ['PILLAR 02', '支柱 02'],
    ['EXPERT<br>DEEP<br>MENTOR', '专家<br>深度<br>陪跑'],
    ['Real Expert Oversight', '真实专家监督'],
    [
      'AI clones are not black boxes; they are backed by the actual methodologies and periodic reviews of top-tier experts.',
      '分身非黑箱，由顶尖专家方法论与定期审阅背书。',
    ],
    ['OPC Global Network', 'OPC Global 网络'],
    [
      'Leveraging 500+ certified coaches to provide localized, high-touch "deep accompaniment" for every client.',
      '依托 500+ 认证教练，为每位客户提供本地化、高触达的深度陪跑。',
    ],
    ['Active Implementation', '主动落地'],
    [
      "We don't just hand over a tool; we guide the entire journey from integration to measurable business results.",
      '不只交付工具，全程引导从集成到可量化业务结果。',
    ],
  ],
  pillar_3_results: [
    ['PILLAR // 03', '支柱 // 03'],
    ['DELIVERING<br>RESULTS', '交付<br>结果'],
    ['Content ROI', '内容 ROI'],
    [
      'High-converting marketing narratives and content strategies that drive measurable engagement.',
      '高转化营销叙事与内容策略，驱动可量化互动。',
    ],
    ['Closing Velocity', '成交提速'],
    [
      'AI-powered sales clones that coach teams in real-time to accelerate deal closure rates.',
      '销售分身实时辅导团队，加速成交周期。',
    ],
    ['Expert Reports', '专家级报告'],
    [
      'Data-driven consulting reports with the depth and nuance of top-tier industry experts.',
      '具备顶尖行业专家深度与细腻度的数据驱动咨询报告。',
    ],
  ],
  business_model_network: [
    ['Revenue & Growth', '收入与增长'],
    ['BUSINESS<br>MODEL', '商业<br>模式'],
    ['STRATEGY: DISTRIBUTED GROWTH', '策略：分布式增长'],
    ['Coaching Partner Network', '教练合伙人网络'],
    [
      "Leveraging OPC Global's network of certified coaches as regional partners for high-touch delivery and local acquisition.",
      '依托 OPC Global 认证教练网络，承担高触达交付与本地化获客。',
    ],
    ['STREAMS: MULTI-CHANNEL MONETIZATION', '多元变现'],
    ['IP Licensing & Hardware', 'IP 授权与硬件'],
    [
      'Recurring revenue from expert IP clones combined with high-margin hardware sales and enterprise subscriptions.',
      '专家 IP 分身订阅 + 高毛利硬件 + 企业年费。',
    ],
    ['Performance-Based Fees', '按结果计费'],
    [
      'Success-linked fees based on measurable business outcomes delivered in marketing, sales, and consulting.',
      '与营销、销售、咨询等可量化成果挂钩的成功费。',
    ],
  ],
  ecosystem_opc_global: [
    ['THE<br>ECOSYSTEM', '生态<br>闭环'],
    [
      'A self-sustaining loop of expertise, coaching, and delivery powered by OPC Global.',
      '由 OPC Global 驱动的专家、教练与交付自循环。',
    ],
    ['SOURCE<br>EXPERTS', '源头<br>专家'],
    ['1000+ Top-tier industry leaders providing exclusive IP.', '1000+ 行业领袖提供独家 IP。'],
    ['DELIVERY<br>COACHES', '交付<br>教练'],
    ['500+ Certified partners for deep accompaniment.', '500+ 认证教练深度陪跑。'],
    ['OUTCOME<br>CLIENTS', '成果<br>客户'],
    ['Enterprises achieving measurable results.', '企业获得可量化成果。'],
  ],
  use_cases_scenarios: [
    ['Real-World Impact', '真实场景'],
    ['Key Use Cases<br>& Scenarios', '核心场景<br>与应用'],
    ['Enterprise Marketing', '企业全员营销'],
    [
      'AI clones of top-tier CMOs driving brand narrative and high-converting content strategies across all channels.',
      '顶级 CMO 分身驱动品牌叙事与高转化内容，覆盖全渠道。',
    ],
    ['Sales Empowerment', '销售冠军分身'],
    [
      'AI "Top Sales" clones coaching junior teams in real-time, providing expert-level objection handling and closing techniques.',
      '销售冠军分身实时辅导新人，提供专家级异议处理与成交技巧。',
    ],
    ['Executive Consulting', '专家定制咨询'],
    [
      '24/7 access to strategy clones for rapid decision-making, providing data-driven reports with expert-level analysis.',
      '7×24 战略分身支持快速决策，输出专家级深度分析报告。',
    ],
  ],
  competitive_moat: [
    ['STRATEGIC // MOAT', '战略 // 护城河'],
    ['OUR<br>MOAT', '我们的<br>护城河'],
    ['DNA: ORGANIZATIONAL', '基因：组织型'],
    ['Expert Relationships vs. Tools', '专家关系，而非工具'],
    [
      'Big Tech builds standardized tools; KiND builds deep, personalized expert relationships that cannot be automated.',
      '大厂做标准化工具；KiND 做无法自动化的深度专家关系。',
    ],
    ['ASSET: EXCLUSIVITY', '资产：独家性'],
    ['Exclusive IP Contracts', '独家 IP 合约'],
    [
      'Securing exclusive digital twin rights with the top 1% of industry experts, creating a supply-side monopoly.',
      '锁定行业前 1% 专家数字孪生独家权，形成供给侧壁垒。',
    ],
    ['BARRIER: ECOSYSTEM', '壁垒：生态'],
    ['The Triple Threat', '三位一体'],
    [
      'The combination of proprietary hardware, exclusive expert IP, and the OPC Global coach network is impossible to replicate.',
      '专有硬件 + 独家专家 IP + OPC Global 教练网络，结构难复制。',
    ],
  ],
  roadmap_90_days: [
    ['BINARY // GOALS', '可证伪 // 目标'],
    ['90 DAY<br>ROAD', '90 天<br>里程碑'],
    ['3 Enterprise Paid Deliveries', '3 家企业付费交付（实际打款）'],
    [
      'Validating willingness to pay for "Expert Results" at 300k+ RMB.',
      '验证企业愿为「专家结果」支付 30 万以上。',
    ],
    ['100 Exclusive Expert Signings', '签约 100 位独家专家'],
    [
      'Securing the supply side with exclusive IP authorization contracts.',
      '以独家分身授权合同锁定供给侧。',
    ],
    ['Hardware Prototype Delivery', '智能硬件打样交付'],
    [
      'BOM &lt; 3000 RMB, validating the physical interaction experience.',
      'BOM ≤ 3000 元，验证物理交互体验。',
    ],
    ['$2M Angel Funding Secured', '天使轮 200 万美元到账'],
    [
      'Capital market validation of the "Hardware-Software-Expert" model.',
      '资本市场认可「软硬一体 + 专家交付」模式。',
    ],
  ],
  long_term_evolution: [
    ['Strategic Roadmap', '战略路线图'],
    ['Long-term Evolution<br>(24 Months)', '长期演进（24 个月）'],
    ['01 // 0–3 MONTHS', '01 // 0–3 个月'],
    ['Foundation & PoC', '基础与验证'],
    ['Software PoC for 3 core scenarios', '三大核心场景软件 PoC'],
    ['Hardware prototype &打样', '智能硬件打样'],
    ['Sign first 100 exclusive experts', '签约首批 100 位独家专家'],
    ['Launch 50 coach partners', '启动 50 位教练合伙人'],
    ['02 // 3–12 MONTHS', '02 // 3–12 个月'],
    ['Scale & Integration', '规模化与一体化'],
    ['Hardware mass production', '智能硬件量产'],
    ['Vertical industry solutions (SKU)', '行业垂直方案 SKU 化'],
    ['Expand to 500+ experts', '专家扩至 500+'],
    ['200+ coach partner network', '教练合伙人 200+'],
    ['03 // 12–24 MONTHS', '03 // 12–24 个月'],
    ['Platformization', '平台化'],
    ['Open expert marketplace', '开放专家入驻'],
    ['Enterprise self-selection mechanism', '企业自选机制'],
    ['Data assetization & IP tokenization', '数据资产化与 IP 证券化探索'],
    ['Global distributed growth engine', '全球分布式增长引擎'],
  ],
  founding_team: [
    ['Core Leadership', '核心领导团队'],
    ['The Founding Team', '创始团队'],
    ['CEO // Industry Veteran', 'CEO // 产业资源型'],
    ['Chief Executive Officer', '首席执行官'],
    [
      'Deep B2B network and enterprise-level delivery experience from industry-leading firms.',
      '深厚 B 端网络与企业级交付经验。',
    ],
    ['COO // Operations Expert', 'COO // 运营资源型'],
    ['Chief Operating Officer', '首席运营官'],
    [
      'Specialist in operational efficiency and scaling enterprise-grade service delivery models.',
      '擅长运营效率与企业级服务规模化。',
    ],
    ['CMO // Brand Architect', 'CMO // 品牌架构师'],
    [
      'Brand marketing expert with a track record of building powerful narratives and high-impact campaigns.',
      '品牌营销专家，擅长高影响力叙事与战役。',
    ],
    ['Ecosystem // Tech & Education', '生态 // 技术与教育'],
    [
      'Founder of architect education ecosystem, bringing deep technical expert resources and coach networks.',
      '架构师教育生态创始人，带来技术专家与教练网络资源。',
    ],
  ],
  talent_acquisition: [
    ['90-DAY // HARD CUTOFF', '90 天 // 硬截止'],
    ['TALENT<br>GAPS', '人才<br>缺口'],
    ['CTO', 'CTO'],
    ['AI / HARDWARE ARCHITECT', '大模型 / 端侧硬件架构师'],
    [
      'Leading technical vision across large models and edge hardware integration. Directing the "Clone" engine development.',
      '统筹大模型与端侧硬件，主导「分身」引擎研发。',
    ],
    ['Hardware PM', '硬件 PM'],
    ['SUPPLY CHAIN VETERAN', '供应链老兵'],
    [
      'Managing smart hardware prototyping, BOM optimization, and mass production scaling for Stage 2.',
      '负责智能硬件打样、BOM 优化与 Stage 2 量产。',
    ],
    ['Chief Expert Officer', '首席专家关系官'],
    ['IP & TALENT STRATEGIST', 'IP 与人才战略'],
    [
      'Scaling the expert acquisition pipeline and managing exclusive IP licensing contracts with top 1% talent.',
      '规模化专家签约管线，管理前 1% 人才独家 IP 授权。',
    ],
  ],
  financing_plan: [
    ['CAPITAL // ROUND', '资本 // 轮次'],
    ['FINANCING<br>PLAN', '融资<br>计划'],
    ['$2.0M', '$200 万'],
    ['Target Raise (USD)', '目标募资（美元）'],
    ['$8M-$12M', '$800–1200 万'],
    ['Pre-Money Valuation', '投前估值'],
    ['STRATEGIC ALLOCATION', '资金用途'],
    ['Expert IP & Legal', '专家签约与 IP 法务'],
    ['40%', '40%'],
    [
      'Securing exclusive rights for the first 100 top-tier experts.',
      '锁定首批 100 位顶尖专家独家权。',
    ],
    ['Hardware R&D & Supply Chain', '硬件研发与供应链'],
    ['25%', '25%'],
    ['Prototyping and initial production run of KiND devices.', 'KiND 设备打样与首批量产。'],
    ['Core Team Expansion', '核心团队补齐'],
    ['20%', '20%'],
    ['Hiring CTO, Hardware PM, and Chief Expert Officer.', '招聘 CTO、硬件 PM、首席专家关系官。'],
    ['Operations & Delivery', '运营与交付'],
    ['15%', '15%'],
    ['Initial enterprise client delivery and marketing.', '首批企业客户交付与市场。'],
  ],
  risk_management: [
    ['STRATEGIC // DEFENSE', '战略 // 防御'],
    ['RISK<br>MGMT', '风险<br>管理'],
    ['Expert Supply Gaps', '专家供给不足'],
    ['HIGH IMPACT', '高影响'],
    ['MITIGATION STRATEGY', '应对策略'],
    [
      'Leveraging the distributed OPC Global network to ensure a continuous pipeline of 1000+ experts, reducing dependency on any single individual.',
      '依托 OPC Global 分布式网络，保障 1000+ 专家供给，降低单点依赖。',
    ],
    ['Hardware Cost Overruns', '硬件成本超支'],
    ['MEDIUM IMPACT', '中影响'],
    [
      'Strict 90-day prototype validation before mass production. BOM optimization and supply chain veteran hiring to manage manufacturing risks.',
      '量产前严格 90 天打样验证；BOM 优化与供应链老兵控风险。',
    ],
    ['Big Tech Competition', '大厂竞争'],
    ['STRATEGIC RISK', '战略风险'],
    [
      'Focusing on exclusive IP contracts and "Result Delivery" rather than generic tools. Our moat is the expert relationship, not just the model.',
      '聚焦独家 IP 与「结果交付」，护城河是专家关系而非模型。',
    ],
  ],
  conclusion_cta: [
    ['FORALL', '普惠'],
    ['Join the Revolution', '共建专业力普惠'],
    [
      'Democratizing high-end expertise for every individual and enterprise.',
      '让每个专家变成一千个专家，让每个企业请得起世界级专家。',
    ],
    ["Let's build the future of expertise together.", '与 KiND 一起，共建专家普惠的未来。'],
    ['KiND FOR ALL', 'KiND 普惠专业力'],
    ['Not for few. For all.', 'Not for few. For all.'],
  ],
};

function composeMd(enWrap, zhWrap) {
  return `<!-- en -->\n${enWrap}\n\n<!-- zh -->\n${zhWrap}\n`;
}

const state = JSON.parse(await fs.readFile(path.join(deckRoot, 'slide_state.json'), 'utf8'));
for (const { id } of state.slides) {
  const htmlPath = path.join(deckRoot, `${id}.html`);
  const html = await fs.readFile(htmlPath, 'utf8');
  const inner = extractInner(html);
  const enWrap = `<div class="slide-container">\n${inner}\n</div>`;
  const pairs = SLIDE_ZH[id] ?? [];
  const zhInner = applyPairs(inner, pairs);
  const zhWrap = `<div class="slide-container">\n${zhInner}\n</div>`;
  const md = composeMd(enWrap, zhWrap);
  await fs.writeFile(path.join(deckRoot, `${id}.md`), md, 'utf8');
  console.log('wrote', id);
}
