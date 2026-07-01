import type { SlideMeta } from '@open-slide/core';
import { buildCaseDeck, type CaseData, design } from '../_casekit/kit';

const data: CaseData = {
  id: 'CASE 06',
  archetype: '火锅店',
  name: '围炉火锅',
  cover: {
    kicker: '火锅店复盘',
    titleA: '翻台是命',
    titleB: '供应链是底气',
    sub: '5 个月：翻台 +0.7，毛利 +8pt，锅底与供应链双升。',
    photo: '满座火锅 / 招牌锅底 实拍',
  },
  profile: {
    stats: [
      { big: '320㎡', label: '营业面积' },
      { big: '160 座', label: '堂食座位' },
      { big: '¥105', label: '客单价' },
      { big: '¥88 万', label: '月营业额' },
    ],
    note: '商场火锅，翻台决定生死，食材成本占比高，锅底缺乏记忆点。',
    photo: '门店大堂 / 用餐场景 实拍',
  },
  symptom: {
    quote: '满座却不赚钱，翻台和食材两头压',
    cards: [
      { tag: '症状 1', t: '翻台不够高', b: '上菜慢、排队管理弱，台子转不动。' },
      { tag: '症状 2', t: '食材成本高', b: '没集采、没净菜，食材占比偏高。' },
      { tag: '症状 3', t: '锅底没差异', b: '锅底平庸，缺记忆点与复购理由。' },
    ],
  },
  baseline: {
    metrics: [
      { k: '月营业额', v: '¥88 万' },
      { k: '毛利率', v: '56%', tone: 'bad' },
      { k: '翻台(次)', v: '2.4', tone: 'bad' },
      { k: '食材占比', v: '42%', tone: 'bad' },
      { k: '客单价', v: '¥105' },
    ],
    note: '翻台与食材成本双压——火锅的命门在效率与供应链，不在客单。',
  },
  leak: {
    bars: [
      { label: '流量', pct: 30 },
      { label: '转化', pct: 35 },
      { label: '客单', pct: 45 },
      { label: '食材', pct: 70, tone: 'bad' },
      { label: '翻台', pct: 78, tone: 'bad' },
    ],
    verdict: '翻台与食材最短：上菜提速、集采降本、招牌锅底。',
  },
  root: {
    causes: [
      { tag: '根因 1', t: '上菜慢翻台低', b: '出菜动线乱，高峰翻不动台。', tone: 'bad' },
      { tag: '根因 2', t: '食材没集采', b: '分散采购，成本与损耗双高。', tone: 'bad' },
      { tag: '根因 3', t: '锅底无记忆点', b: '锅底同质化，复购理由弱。', tone: 'bad' },
    ],
  },
  strategy: {
    model: '扩张型 · 提翻台控成本',
    modelNote: '把翻台拉高、食材成本压下来，毛利和复购一起改善。',
    levers: [
      { t: '上菜提速', b: '动线 + 分工，高峰翻得动台。' },
      { t: '集采降本', b: '集采 + 中央净菜，压食材成本。' },
      { t: '招牌锅底', b: '差异化锅底，立记忆点。' },
    ],
  },
  menu: {
    cut: '20 道',
    keep: '30 道',
    add: '6 款',
    roles: '主君款=招牌锅底；毛利款=特色肉/丸滑；凑单=小吃/饮品；引流=工作日套餐。',
    note: '按毛利×点击率重排，集采品类降本明显。',
    photo: '锅底/食材拼盘 实拍',
  },
  pricing: {
    moves: [
      { item: '招牌锅底', from: '同质', to: '差异化定价', why: '立记忆点，制造复购理由。' },
      { item: '特色肉', from: '—', to: '主推高毛利', why: '高毛利款重点推荐。' },
      { item: '工作日套餐', from: '—', to: '特惠', why: '拉非高峰翻台，填平时段。' },
    ],
    note: '锅底做记忆点，特色肉做毛利，套餐拉非高峰翻台。',
  },
  execution: {
    steps: [
      { d: '第 30 天', t: '上菜提速 + 排队管理', b: '店长重排动线，高峰提速。', tone: 'cool' },
      { d: '第 60 天', t: '集采 + 中央净菜', b: '老板统一集采，压食材成本。' },
      { d: '第 90 天', t: '招牌锅底 + 会员', b: '上线差异锅底与复购权益。', tone: 'good' },
    ],
    photo: '后厨净菜 / 上菜动线 实拍',
  },
  timeline: {
    milestones: [
      { w: '第 1 周', t: '翻台/食材诊断' },
      { w: '第 4 周', t: '上菜提速达标' },
      { w: '第 8 周', t: '集采降本落地' },
      { w: '第 12 周', t: '翻台毛利双升' },
    ],
    note: '火锅改造三件事同时上：提速、集采、招牌锅底，12 周见效。',
  },
  results: {
    headline: '5 个月后，台子转起来、成本降下来',
    rows: [
      { k: '翻台(次)', before: '2.4', after: '3.1' },
      { k: '食材占比', before: '42%', after: '34%' },
      { k: '毛利率', before: '56%', after: '64%' },
      { k: '客单价', before: '¥105', after: '¥118' },
      { k: '净利率', before: '5%', after: '15%' },
    ],
  },
  turning: {
    quote: '把上菜从 15 分压到 8 分、食材集采的那月，利润就回来了',
    body: '火锅的命门是翻台和食材成本——提速 + 集采 + 招牌锅底，三个一起上才有效。',
  },
  takeaways: {
    items: [
      { t: '上菜速度直接决定翻台', b: '动线与分工，是隐形的翻台杠杆。' },
      { t: '集采是毛利的底气', b: '统一采购 + 净菜，压成本降损耗。' },
      { t: '招牌锅底制造记忆点', b: '差异化锅底带来复购理由。' },
      { t: '非高峰用套餐拉翻台', b: '工作日套餐填平时段空置。' },
    ],
  },
  close: {
    quote: '翻台是命，供应链是底气',
    sub: '火锅店的胜负，在翻台和食材两块板。',
    photo: '满座火锅 / 招牌锅底 实拍',
  },
};

const { pages, notes } = buildCaseDeck(data);

export { design };
export const meta: SlideMeta = { title: '案例 06 · 围炉火锅（火锅店）' };
export { notes };
export default pages;
