import type { SlideMeta } from '@open-slide/core';
import { buildCaseDeck, type CaseData, design } from '../_casekit/kit';

const data: CaseData = {
  id: 'CASE 01',
  archetype: '社区小面馆',
  name: '巷口面馆',
  cover: {
    kicker: '社区小面馆复盘',
    titleA: '一碗面',
    titleB: '也能算明白账',
    sub: '6 个月：客单 +6 元，复购翻倍，净利由负转正。',
    photo: '门店招牌 / 招牌牛肉面 实拍',
  },
  profile: {
    stats: [
      { big: '38㎡', label: '营业面积' },
      { big: '24 座', label: '堂食座位' },
      { big: '¥18', label: '客单价' },
      { big: '¥12 万', label: '月营业额' },
    ],
    note: '夫妻店 + 2 名帮工，午晚两餐，外卖占四成。位置好、客流稳，却存不下钱。',
    photo: '门店外观 / 排队场景 实拍',
  },
  symptom: {
    quote: '天天满座，月底却剩不下钱',
    cards: [
      { tag: '症状 1', t: '流水不错不赚钱', b: '营业额看着稳，利润却薄如纸。' },
      { tag: '症状 2', t: '外卖抽成吃毛利', b: '外卖占四成，平台抽成把毛利削掉一截。' },
      { tag: '症状 3', t: 'SKU 太多备料浪费', b: '58 项备料，冷门菜拖累出餐与损耗。' },
    ],
  },
  baseline: {
    metrics: [
      { k: '月营业额', v: '¥12 万' },
      { k: '毛利率', v: '52%', tone: 'bad' },
      { k: '客单价', v: '¥18' },
      { k: '复购率', v: '28%', tone: 'bad' },
      { k: '外卖占比', v: '42%', tone: 'bad' },
    ],
    note: '毛利偏低、客单偏低、复购偏低——三块板同时短，问题在结构不在流量。',
  },
  leak: {
    bars: [
      { label: '流量', pct: 25 },
      { label: '转化', pct: 40 },
      { label: '毛利', pct: 55 },
      { label: '复购', pct: 68, tone: 'bad' },
      { label: '客单', pct: 78, tone: 'bad' },
    ],
    verdict: '客单太低、复购没系统，靠套餐与会员补。',
  },
  root: {
    causes: [
      { tag: '根因 1', t: '菜单太杂', b: '58 项 SKU，主次不分，顾客点不出高毛利款。', tone: 'bad' },
      { tag: '根因 2', t: '定价没锚点', b: '招牌款定价偏低，撑不起客单与心智。', tone: 'bad' },
      { tag: '根因 3', t: '复购没钩子', b: '吃完就走，没有会员、没有复购理由。', tone: 'bad' },
    ],
  },
  strategy: {
    model: '生存型 · 守利',
    modelNote: '先把毛利和客单救活，稳住现金流，不盲目扩张。',
    levers: [
      { t: '精简 SKU', b: '砍掉拖累毛利的冷门菜，备料聚焦。' },
      { t: '套餐锚点', b: '面 + 卤味 + 饮品组套，抬升客单。' },
      { t: '会员钩子', b: '储值 + 复购券，把一次客变常客。' },
    ],
  },
  menu: {
    cut: '22 道',
    keep: '12 道',
    add: '4 道',
    roles: '主君款=招牌牛肉面；毛利款=拌面/小吃；凑单=卤味；引流=9.9 特价面。',
    note: '备料从 58 项降到 26 项，出餐更快、损耗更低。',
    photo: '改造后菜单牌 / 套餐海报 实拍',
  },
  pricing: {
    moves: [
      { item: '招牌牛肉面', from: '¥18', to: '¥22', why: '加量加蛋，立招牌、撑客单与心智。' },
      { item: '面 + 卤味套餐', from: '—', to: '¥28', why: '组合锚点，自然抬高客单。' },
      { item: '引流特价面', from: '—', to: '¥9.9', why: '工作日午市拉新，引流不亏本。' },
    ],
    note: '一个锚点（套餐）+ 一个引流款，价格带立刻立体。',
  },
  execution: {
    steps: [
      { d: '第 30 天', t: '上套餐与会员', b: '店长把卤味做成凑单，群发储值券。', tone: 'cool' },
      { d: '第 60 天', t: '砍 SKU + 备料 SOP', b: '后厨克重化，出餐稳定、损耗下降。' },
      { d: '第 90 天', t: '外卖结构优化', b: '只把高毛利款放外卖，抽成不吃利润。', tone: 'good' },
    ],
    photo: '后厨出餐 / 备料区 实拍',
  },
  timeline: {
    milestones: [
      { w: '第 1 周', t: '数据盘点，定基线' },
      { w: '第 3 周', t: '菜单重排上线' },
      { w: '第 6 周', t: '会员系统跑通' },
      { w: '第 12 周', t: '毛利客单回正' },
    ],
    note: '12 周完成一轮诊断→重建→复制，节奏可被任何社区店复用。',
  },
  results: {
    headline: '6 个月后，账本变了样',
    rows: [
      { k: '月营业额', before: '¥12 万', after: '¥15.6 万' },
      { k: '毛利率', before: '52%', after: '63%' },
      { k: '客单价', before: '¥18', after: '¥24' },
      { k: '复购率', before: '28%', after: '49%' },
      { k: '净利率', before: '-3%', after: '11%' },
    ],
  },
  turning: {
    quote: '把菜单从 58 项砍到 26 项的那天，毛利就涨了',
    body: '不是卖更多，而是把拖累毛利的 SKU 清掉、把高毛利款摆到顾客眼前。少即是多。',
  },
  takeaways: {
    items: [
      { t: 'SKU 不是越多越好', b: '冷门菜拖累毛利与出餐，按销量×毛利做减法。' },
      { t: '套餐是最便宜的客单杠杆', b: '不靠涨价，用组合自然抬升客单。' },
      { t: '复购要有系统', b: '会员储值+复购券，把人情变成机制。' },
      { t: '外卖只放高毛利款', b: '抽成削毛利，结构上先筛选。' },
    ],
  },
  close: {
    quote: '一碗面，也要算清账',
    sub: '社区店的胜负，藏在客单和复购两块板里。',
    photo: '老板与门店合影 实拍',
  },
};

const { pages, notes } = buildCaseDeck(data);

export { design };
export const meta: SlideMeta = { title: '案例 01 · 巷口面馆（社区小面馆）' };
export { notes };
export default pages;
