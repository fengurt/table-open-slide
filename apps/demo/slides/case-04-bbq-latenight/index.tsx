import type { SlideMeta } from '@open-slide/core';
import { buildCaseDeck, type CaseData, design } from '../_casekit/kit';

const data: CaseData = {
  id: 'CASE 04',
  archetype: '烧烤夜宵店',
  name: '夜宵江湖',
  cover: {
    kicker: '烧烤夜宵复盘',
    titleA: '旺季很猛',
    titleB: '别让损耗吃掉它',
    sub: '4 个月：损耗 -6pt，毛利 +9pt，淡季也能打平。',
    photo: '夜晚外摆 / 烤炉出品 实拍',
  },
  profile: {
    stats: [
      { big: '120㎡', label: '营业面积' },
      { big: '96 座', label: '含外摆座位' },
      { big: '¥88', label: '客单价' },
      { big: '¥52 万', label: '旺季月营业额' },
    ],
    note: '夜宵为主，旺季火爆、淡季亏损。食材损耗高，酒水占比偏低。',
    photo: '门店夜景 / 外摆区 实拍',
  },
  symptom: {
    quote: '旺季赚的，淡季全亏回去',
    cards: [
      { tag: '症状 1', t: '损耗高没盘点', b: '食材凭感觉备货，报损无人管。' },
      { tag: '症状 2', t: '淡旺季落差大', b: '淡季无产品策略，固定成本压亏。' },
      { tag: '症状 3', t: '酒水占比低', b: '不主动搭售，放掉最肥的毛利。' },
    ],
  },
  baseline: {
    metrics: [
      { k: '旺季营业额', v: '¥52 万' },
      { k: '毛利率', v: '55%', tone: 'bad' },
      { k: '损耗率', v: '9%', tone: 'bad' },
      { k: '酒水占比', v: '18%', tone: 'bad' },
      { k: '淡季净利', v: '-8%', tone: 'bad' },
    ],
    note: '钱漏在损耗与淡季亏损——把这两块堵上，旺季利润才留得住。',
  },
  leak: {
    bars: [
      { label: '流量', pct: 30 },
      { label: '转化', pct: 35 },
      { label: '客单', pct: 50 },
      { label: '酒水', pct: 65, tone: 'bad' },
      { label: '损耗', pct: 80, tone: 'bad' },
    ],
    verdict: '损耗与酒水最短：每日盘点、淡季套餐、酒水搭售。',
  },
  root: {
    causes: [
      { tag: '根因 1', t: '食材没盘点制度', b: '备货靠感觉，损耗吃掉毛利。', tone: 'bad' },
      { tag: '根因 2', t: '淡季无产品策略', b: '没有淡季专属套餐拉客流。', tone: 'bad' },
      { tag: '根因 3', t: '酒水不搭售', b: '高毛利酒水靠顾客自点，连带低。', tone: 'bad' },
    ],
  },
  strategy: {
    model: '防御型 · 控损',
    modelNote: '把损耗和淡季亏损堵上，旺季利润才留得住，全年才打得平。',
    levers: [
      { t: '损耗盘点 SOP', b: '每日盘点报损，备货按销量。' },
      { t: '淡季套餐', b: '工作日特惠，填平淡季客流。' },
      { t: '酒水搭售', b: '套餐配酒，抬高毛利占比。' },
    ],
  },
  menu: {
    cut: '18 串',
    keep: '24 串',
    add: '5 款',
    roles: '主君款=招牌串；毛利款=烤物拼盘；凑单=小吃；引流=淡季套餐。',
    note: '按销量×损耗砍冷门串，备货更准、报损更少。',
    photo: '烤炉/食材备货 实拍',
  },
  pricing: {
    moves: [
      { item: '招牌拼盘', from: '锚点', to: '撑客单', why: '保留高客单心智，做记忆点。' },
      { item: '啤酒套餐', from: '—', to: '折扣搭', why: '套餐配酒，提酒水占比与毛利。' },
      { item: '淡季套餐', from: '—', to: '工作日特惠', why: '拉淡季客流，填平空置。' },
    ],
    note: '旺季靠招牌撑客单，淡季靠套餐拉量，酒水全程做毛利放大器。',
  },
  execution: {
    steps: [
      { d: '第 30 天', t: '每日损耗盘点', b: '店长建立报损制度，备货按销量。', tone: 'cool' },
      { d: '第 60 天', t: '酒水搭售话术', b: '服务标准化推套餐配酒。' },
      { d: '第 90 天', t: '淡季套餐 + 会员', b: '老板上线淡季产品与复购券。', tone: 'good' },
    ],
    photo: '后厨备货 / 服务搭酒 实拍',
  },
  timeline: {
    milestones: [
      { w: '第 1 周', t: '损耗/酒水诊断' },
      { w: '第 3 周', t: '盘点制度上线' },
      { w: '第 6 周', t: '酒水搭售达标' },
      { w: '第 12 周', t: '淡季打平' },
    ],
    note: '夜宵店的关键是“堵漏 + 平淡季”，12 周让全年现金流稳下来。',
  },
  results: {
    headline: '4 个月后，淡季也能打平',
    rows: [
      { k: '损耗率', before: '9%', after: '3%' },
      { k: '毛利率', before: '55%', after: '64%' },
      { k: '酒水占比', before: '18%', after: '29%' },
      { k: '淡季净利', before: '-8%', after: '3%' },
      { k: '客单价', before: '¥88', after: '¥102' },
    ],
  },
  turning: {
    quote: '开始每天盘点损耗的那周，毛利就稳住了',
    body: '夜宵店的钱漏在损耗和淡季——把这两块堵上，旺季赚的才不会被淡季还回去。',
  },
  takeaways: {
    items: [
      { t: '损耗必须每日盘点', b: '报损制度化，备货按销量。' },
      { t: '淡季要有专属产品', b: '工作日套餐填平空置时段。' },
      { t: '酒水是毛利放大器', b: '主动搭售，抬高毛利占比。' },
      { t: '按销量×损耗砍菜单', b: '冷门高损耗串先下架。' },
    ],
  },
  close: {
    quote: '旺季的钱，别在淡季还回去',
    sub: '夜宵店的胜负，在损耗和淡旺季节奏。',
    photo: '夜晚满座外摆 实拍',
  },
};

const { pages, notes } = buildCaseDeck(data);

export { design };
export const meta: SlideMeta = { title: '案例 04 · 夜宵江湖（烧烤夜宵店）' };
export { notes };
export default pages;
