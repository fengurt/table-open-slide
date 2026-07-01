import type { SlideMeta } from '@open-slide/core';
import { buildCaseDeck, type CaseData, design } from '../_casekit/kit';

const data: CaseData = {
  id: 'CASE 03',
  archetype: '社区正餐中餐',
  name: '家宴小馆',
  cover: {
    kicker: '社区正餐复盘',
    titleA: '房租人工重',
    titleB: '先把人效救回来',
    sub: '5 个月：人效 +35%，房租占比回到 15%，净利转正。',
    photo: '门店堂食 / 招牌硬菜 实拍',
  },
  profile: {
    stats: [
      { big: '160㎡', label: '营业面积' },
      { big: '88 座', label: '堂食座位' },
      { big: '¥75', label: '客单价' },
      { big: '¥46 万', label: '月营业额' },
    ],
    note: '社区正餐，午市冷清、晚市旺，8 人团队。房租人工双高，利润被吃光。',
    photo: '门店外观 / 晚市满座 实拍',
  },
  symptom: {
    quote: '看着热闹，人工房租把利润吃光',
    cards: [
      { tag: '症状 1', t: '午市空置浪费', b: '午市客流稀，固定成本照付。' },
      { tag: '症状 2', t: '人效偏低', b: '排班靠经验，人手忙闲不均。' },
      { tag: '症状 3', t: '菜单太长备货重', b: '48 道菜，备货与损耗压成本。' },
    ],
  },
  baseline: {
    metrics: [
      { k: '月营业额', v: '¥46 万' },
      { k: '毛利率', v: '58%' },
      { k: '人效(万/人)', v: '5.75', tone: 'bad' },
      { k: '房租占比', v: '19%', tone: 'bad' },
      { k: '翻台(次)', v: '1.8', tone: 'bad' },
    ],
    note: '人效与翻台双低、房租占比高——正餐的利润藏在效率里，不在涨价里。',
  },
  leak: {
    bars: [
      { label: '流量', pct: 35 },
      { label: '转化', pct: 40 },
      { label: '客单', pct: 45 },
      { label: '翻台', pct: 70, tone: 'bad' },
      { label: '人效', pct: 78, tone: 'bad' },
    ],
    verdict: '人效与翻台最短：排班 SOP、午市产品、出餐提速。',
  },
  root: {
    causes: [
      { tag: '根因 1', t: '排班靠经验', b: '不靠流程，忙闲不均，人效拉不起。', tone: 'bad' },
      { tag: '根因 2', t: '午市没有产品', b: '缺午市专属套餐，空置成固定亏损。', tone: 'bad' },
      { tag: '根因 3', t: '出餐慢翻台低', b: '后厨无克重化，晚市高峰翻不动台。', tone: 'bad' },
    ],
  },
  strategy: {
    model: '防御型 · 控本提效',
    modelNote: '守住存量客群，把人效和翻台拉起来，让同样的人产出更多。',
    levers: [
      { t: '午市套餐', b: '专属午市产品，填平空置时段。' },
      { t: '排班 SOP', b: '按客流排班，释放人效。' },
      { t: '出餐提速', b: '核心菜克重化，晚市翻得动台。' },
    ],
  },
  menu: {
    cut: '28 道',
    keep: '20 道',
    add: '6 道',
    roles: '主君款=招牌硬菜；毛利款=家常小炒；凑单=凉菜/汤；引流=午市套餐。',
    note: '备货项降一半，损耗下降，后厨更顺。',
    photo: '后厨出品 / 招牌硬菜 实拍',
  },
  pricing: {
    moves: [
      { item: '午市套餐', from: '—', to: '¥38', why: '一人食套餐，拉午市客流、填平空置。' },
      { item: '招牌硬菜', from: '锚点不动', to: '撑客单', why: '保留高客单心智，不打折。' },
      { item: '凉菜/小炒', from: '微调', to: '提毛利', why: '高频家常款做毛利款。' },
    ],
    note: '午市靠引流套餐拉量，晚市靠招牌硬菜撑客单。',
  },
  execution: {
    steps: [
      { d: '第 30 天', t: '午市套餐 + 排班表', b: '店长上线午市产品，按客流排班。', tone: 'cool' },
      { d: '第 60 天', t: '出餐 SOP 克重化', b: '后厨标准化出品，晚市提速。' },
      { d: '第 90 天', t: '会员储值锁客', b: '老板上线储值，沉淀社区复购。', tone: 'good' },
    ],
    photo: '后厨备餐 / 团队排班 实拍',
  },
  timeline: {
    milestones: [
      { w: '第 1 周', t: '人效/翻台诊断' },
      { w: '第 4 周', t: '午市套餐上线' },
      { w: '第 8 周', t: '排班 SOP 落地' },
      { w: '第 12 周', t: '人效翻台回升' },
    ],
    note: '正餐改造重在流程，12 周把“靠人”变“靠系统”，人效自然回来。',
  },
  results: {
    headline: '5 个月后，同样的人多赚三成',
    rows: [
      { k: '人效(万/人)', before: '5.75', after: '7.8' },
      { k: '翻台(次)', before: '1.8', after: '2.6' },
      { k: '房租占比', before: '19%', after: '15%' },
      { k: '毛利率', before: '58%', after: '64%' },
      { k: '净利率', before: '-2%', after: '9%' },
    ],
  },
  turning: {
    quote: '把排班从老板拍脑袋变成一张表，人效立刻上来了',
    body: '正餐的利润藏在人效和翻台里——靠流程，不靠加班，也不靠涨价。',
  },
  takeaways: {
    items: [
      { t: '排班 SOP 化释放人效', b: '按客流排班，告别忙闲不均。' },
      { t: '午市要有专属产品', b: '用引流套餐填平空置时段。' },
      { t: '出餐速度决定翻台', b: '核心菜克重化，晚市翻得动。' },
      { t: '储值是社区店护城河', b: '锁客复购，抵御周边竞争。' },
    ],
  },
  close: {
    quote: '热闹不等于赚钱',
    sub: '正餐的胜负，在人效和翻台两块板。',
    photo: '满座晚市 / 老板巡台 实拍',
  },
};

const { pages, notes } = buildCaseDeck(data);

export { design };
export const meta: SlideMeta = { title: '案例 03 · 家宴小馆（社区正餐）' };
export { notes };
export default pages;
