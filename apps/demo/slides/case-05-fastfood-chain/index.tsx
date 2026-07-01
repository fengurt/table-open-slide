import type { SlideMeta } from '@open-slide/core';
import { buildCaseDeck, type CaseData, design } from '../_casekit/kit';

const data: CaseData = {
  id: 'CASE 05',
  archetype: '快餐 · 连锁候选',
  name: '饭碗快餐',
  cover: {
    kicker: '快餐连锁化复盘',
    titleA: '单店跑通了',
    titleB: '再谈第二家',
    sub: '6 个月：单店模型跑正，二店测算通过，标准化可复制。',
    photo: '门店出餐线 / 招牌饭 实拍',
  },
  profile: {
    stats: [
      { big: '60㎡', label: '营业面积' },
      { big: '40 座', label: '堂食座位' },
      { big: '¥26', label: '客单价' },
      { big: '¥34 万', label: '月营业额' },
    ],
    note: '商务区快餐，午市爆、模型简单，老板想开二店，却算不清能不能复制。',
    photo: '门店外观 / 午市排队 实拍',
  },
  symptom: {
    quote: '想开二店，却算不清能不能复制',
    cards: [
      { tag: '症状 1', t: '流程靠人没 SOP', b: '换个店长就走样，复制无从谈起。' },
      { tag: '症状 2', t: '二店账没算过', b: '回收期、现金流回正没测算。' },
      { tag: '症状 3', t: '数字化缺失', b: '对账靠手工，决策没数据看板。' },
    ],
  },
  baseline: {
    metrics: [
      { k: '月营业额', v: '¥34 万' },
      { k: '毛利率', v: '62%' },
      { k: '人效(万/人)', v: '8.5' },
      { k: '标准化度', v: '40%', tone: 'bad' },
      { k: '数字化度', v: '30%', tone: 'bad' },
    ],
    note: '单店盈利没问题，短板在标准化与数字化——这正是复制的门票。',
  },
  leak: {
    bars: [
      { label: '流量', pct: 25 },
      { label: '转化', pct: 35 },
      { label: '客单', pct: 40 },
      { label: '标准化', pct: 70, tone: 'bad' },
      { label: '数字化', pct: 75, tone: 'bad' },
    ],
    verdict: '标准化与数字化最短：先补内功，再谈扩张。',
  },
  root: {
    causes: [
      { tag: '根因 1', t: '核心菜没克重化', b: '出品靠手感，换人就变味。', tone: 'bad' },
      { tag: '根因 2', t: '对账靠人工', b: '数据滞后，复制难以监控。', tone: 'bad' },
      { tag: '根因 3', t: '没有数据看板', b: '决策凭感觉，不可规模化。', tone: 'bad' },
    ],
  },
  strategy: {
    model: '扩张型 · 先固内功',
    modelNote: '单店先标准化、数字化，把模型做稳，再谈复制第二家。',
    levers: [
      { t: '核心菜克重化', b: '出品 SOP 化，新人 2 天上手。' },
      { t: '对账数字化', b: '收银/采购上系统，数据实时。' },
      { t: '数据看板', b: '关键指标可视化，支撑决策。' },
    ],
  },
  menu: {
    cut: '10 道',
    keep: '16 道',
    add: '3 道',
    roles: '主君款=招牌饭；毛利款=加料/小菜；凑单=饮品；引流=工作日套餐。',
    note: '核心菜全部克重化 SOP，新人 2 天上手，出品稳定可复制。',
    photo: '出餐线 / 打包区 实拍',
  },
  pricing: {
    moves: [
      { item: '招牌饭', from: '锚点', to: '稳客单', why: '保留高频心智，不轻易动价。' },
      { item: '加料', from: '—', to: '+¥3', why: '最轻的客单杠杆，连带提升。' },
      { item: '工作日套餐', from: '—', to: '特惠', why: '拉午市客流，稳定翻台。' },
    ],
    note: '定价稳定可预测，是连锁复制的前提之一。',
  },
  execution: {
    steps: [
      { d: '第 30 天', t: '核心菜克重化 SOP', b: '店长把出品标准化，落表落秤。', tone: 'cool' },
      { d: '第 60 天', t: '对账数字化 + 看板', b: '老板上线系统，指标可视化。' },
      { d: '第 90 天', t: '二店选址测算', b: '用单店模型算二店账，理性决策。', tone: 'good' },
    ],
    photo: '出餐 SOP / 数据看板 实拍',
  },
  timeline: {
    milestones: [
      { w: '第 1 周', t: '标准化/数字化诊断' },
      { w: '第 5 周', t: 'SOP 克重化达标' },
      { w: '第 9 周', t: '数据看板上线' },
      { w: '第 12 周', t: '二店账测算通过' },
    ],
    note: '复制不是开更多店，而是把单店做成可复制模型——先补内功再扩张。',
  },
  results: {
    headline: '6 个月后，模型可复制了',
    rows: [
      { k: '标准化度', before: '40%', after: '85%' },
      { k: '数字化度', before: '30%', after: '80%' },
      { k: '人效(万/人)', before: '8.5', after: '10.2' },
      { k: '毛利率', before: '62%', after: '66%' },
      { k: '二店回收期', before: '—', after: '16 个月' },
    ],
  },
  turning: {
    quote: '把核心菜克重化、对账上系统的那刻，复制才成立',
    body: '连锁不是开更多店，而是把单店做成可复制的模型——标准化 + 数字化是门票。',
  },
  takeaways: {
    items: [
      { t: '核心菜必须克重化', b: '出品稳定，换人不变味。' },
      { t: '对账数字化才可复制', b: '数据实时，复制可监控。' },
      { t: '数据看板支撑决策', b: '凭数据扩张，不凭感觉。' },
      { t: '二店先算账再开', b: '用单店模型测回收期与现金流。' },
    ],
  },
  close: {
    quote: '单店跑通，才谈第二家',
    sub: '复制的前提是模型，不是热情。',
    photo: '二店选址 / 新店筹备 实拍',
  },
};

const { pages, notes } = buildCaseDeck(data);

export { design };
export const meta: SlideMeta = { title: '案例 05 · 饭碗快餐（连锁候选）' };
export { notes };
export default pages;
