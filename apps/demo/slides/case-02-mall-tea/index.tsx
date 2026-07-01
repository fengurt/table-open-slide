import type { SlideMeta } from '@open-slide/core';
import { buildCaseDeck, type CaseData, design } from '../_casekit/kit';

const data: CaseData = {
  id: 'CASE 02',
  archetype: '商场茶饮店',
  name: '茶集',
  cover: {
    kicker: '商场茶饮复盘',
    titleA: '流量很贵',
    titleB: '别用毛利去填',
    sub: '4 个月：转化 +12pt，租效比回到健康线，单店净利翻倍。',
    photo: '商场门店 / 吧台出杯 实拍',
  },
  profile: {
    stats: [
      { big: '22㎡', label: '营业面积' },
      { big: '外带', label: '以外带为主' },
      { big: '¥19', label: '客单价' },
      { big: '¥28 万', label: '月营业额' },
    ],
    note: '商场 L1，过路流量大但贵，主打现制茶。人流不缺，缺的是转化与客单。',
    photo: '商场动线 / 门店立面 实拍',
  },
  symptom: {
    quote: '人流不少，转化太低、租金压顶',
    cards: [
      { tag: '症状 1', t: '进店多下单少', b: '招牌不聚焦，顾客站在柜台前选不出。' },
      { tag: '症状 2', t: '租金占比过高', b: '高租金侵蚀利润，单靠毛利填不平。' },
      { tag: '症状 3', t: '爆品单一', b: '只有一款撑场，抗风险与连带都弱。' },
    ],
  },
  baseline: {
    metrics: [
      { k: '月营业额', v: '¥28 万' },
      { k: '毛利率', v: '68%' },
      { k: '进店转化', v: '9%', tone: 'bad' },
      { k: '租金占比', v: '26%', tone: 'bad' },
      { k: '客单价', v: '¥19' },
    ],
    note: '毛利不低、流量不缺——漏点在转化效率与租效比，不是营销预算。',
  },
  leak: {
    bars: [
      { label: '流量', pct: 20 },
      { label: '毛利', pct: 30 },
      { label: '复购', pct: 50 },
      { label: '客单', pct: 55 },
      { label: '转化', pct: 80, tone: 'bad' },
    ],
    verdict: '转化是主漏点：动线、招牌墙、出杯速度一起改。',
  },
  root: {
    causes: [
      { tag: '根因 1', t: '招牌不聚焦', b: '20 款选项让决策变慢，进店不下单。', tone: 'bad' },
      { tag: '根因 2', t: '出杯慢排队流失', b: '高峰出杯 4 分钟，队伍一长就走人。', tone: 'bad' },
      { tag: '根因 3', t: '缺凑单组合', b: '没有加料/小料连带，客单上不去。', tone: 'bad' },
    ],
  },
  strategy: {
    model: '扩张型 · 提效',
    modelNote: '流量已经买了，重点把转化和客单提上来，让每一波客流多产出。',
    levers: [
      { t: '聚焦 3 款招牌', b: '降低决策成本，进店即下单。' },
      { t: '提速出杯', b: '高峰 2 分钟出杯，队伍不流失。' },
      { t: '小料凑单', b: '加料 +5 元，连带提客单。' },
    ],
  },
  menu: {
    cut: '15 款',
    keep: '8 款',
    add: '3 款',
    roles: '主君款=招牌奶茶；毛利款=厚乳/特调；凑单=小料/加料；引流=季节限定。',
    note: '出杯 SOP 从 4 分钟压到 2 分钟，高峰不再流失订单。',
    photo: '改造后招牌墙 / 菜单 实拍',
  },
  pricing: {
    moves: [
      { item: '招牌奶茶', from: '¥19', to: '¥18', why: '微降做引流锚点，拉高进店转化。' },
      { item: '厚乳特调', from: '—', to: '¥26', why: '高毛利主推款，撑客单与利润。' },
      { item: '加料/小料', from: '—', to: '+¥5', why: '最轻的客单杠杆，连带自然发生。' },
    ],
    note: '引流款拉转化，主推款拉毛利，加料拉客单——三层结构。',
  },
  execution: {
    steps: [
      {
        d: '第 30 天',
        t: '招牌聚焦 + 动线改造',
        b: '店长重排招牌墙，缩短决策路径。',
        tone: 'cool',
      },
      { d: '第 60 天', t: '出杯提速 SOP', b: '吧台分工标准化，高峰达标 2 分钟。' },
      { d: '第 90 天', t: '会员小程序复购', b: '老板上线积分与复购券，沉淀私域。', tone: 'good' },
    ],
    photo: '吧台出杯 / 高峰排队 实拍',
  },
  timeline: {
    milestones: [
      { w: '第 1 周', t: '转化漏斗诊断' },
      { w: '第 2 周', t: '招牌墙 + 动线改造' },
      { w: '第 5 周', t: '出杯提速达标' },
      { w: '第 10 周', t: '客单转化双升' },
    ],
    note: '商场店改造周期短，2 周就能看到转化变化，10 周完成结构升级。',
  },
  results: {
    headline: '4 个月后，每波客流多产出一倍',
    rows: [
      { k: '进店转化', before: '9%', after: '21%' },
      { k: '客单价', before: '¥19', after: '¥25' },
      { k: '租金占比', before: '26%', after: '17%' },
      { k: '毛利率', before: '68%', after: '71%' },
      { k: '净利率', before: '6%', after: '14%' },
    ],
  },
  turning: {
    quote: '把 20 款砍到 8 款、招牌只留 3 个，队伍快了一倍',
    body: '商场店拼的是转化效率：聚焦招牌、提速出杯，比花钱拉新更省、更快。',
  },
  takeaways: {
    items: [
      { t: '聚焦招牌降决策成本', b: '选项越少，进店转化越高。' },
      { t: '出杯速度=隐形转化率', b: '排队越短，流失越少。' },
      { t: '用引流款做锚点', b: '微降招牌价拉转化，靠主推款赚毛利。' },
      { t: '加料是最轻的客单杠杆', b: '不涨价也能抬客单。' },
    ],
  },
  close: {
    quote: '流量很贵，转化更值钱',
    sub: '商场店别用高毛利去填转化的洞。',
    photo: '门店排队 / 顾客取杯 实拍',
  },
};

const { pages, notes } = buildCaseDeck(data);

export { design };
export const meta: SlideMeta = { title: '案例 02 · 茶集（商场茶饮店）' };
export { notes };
export default pages;
