/** 权威数据补充 · 标注来源供 slide foot 引用 */
export const SOURCES = {
  ccfa2026: 'CCFA《2026中国餐饮连锁化发展白皮书》/ 美团研究院',
  stats2025: '国家统计局 · 2025餐饮收入5.79万亿',
  nanchengxiang: '餐饮老板内参 / 红餐网 · 南城香公开分享',
  haidilao: '海底捞年报 / 外卖平台公开数据',
  yuanji: '袁记云饺 · 行业观察',
  guoquan: '锅圈食汇 · 招股书/行业报道',
  chaoyixing: '超意兴 · 行业案例',
};

/** 课件原数据 + 权威数据校准（保留教学叙事，标注可验证区间） */
export const INDUSTRY_STATS = {
  noGrowth: { n: '77.2', unit: '%', label: '门店营收无增长（教学模型）', note: '存量博弈：大部分门店停滯' },
  declining: { n: '45.7', unit: '%', label: '门店营收下滑（教学模型）', note: '与行业洗牌期体感一致' },
  churn: { n: '65.1', unit: '%', label: '停业商户经营不足2年', source: 'ccfa2026', note: '2025年停业339万家' },
  closureYoY: { n: '9.4', unit: '%', label: '停业商户同比增速', source: 'ccfa2026' },
  chainRate: { n: '25', unit: '%', label: '餐饮连锁化率2025', source: 'ccfa2026' },
  revenueYoY: { n: '3.2', unit: '%', label: '2025餐饮收入增速', source: 'stats2025' },
  costTriple: { n: '72', unit: '%', label: '房租+人工+食材（行业均值）', note: '教学拆解：三座大山' },
  disposable: { n: '28', unit: '%', label: '可支配利润池', note: '100元剩28元' },
};

export const CASE_DATA = {
  南城香: {
    breakfastPrice: '3元自助',
    breakfastFlow: '5000→8000+元/日',
    lunchAvg: '约30元',
    profitGrowth: '净利润+114%（2025分享）',
    model: '全时段社区快餐 · 中央厨房降本',
    source: 'nanchengxiang',
  },
  海底捞: {
    tactic: '甜品/小吃外卖拉新',
    logic: '前置培育新客 · 沉淀堂食复购',
    source: 'haidilao',
  },
  袁记云饺: {
    tactic: '堂食+生鲜外带双线',
    scene: '家庭餐+便捷快餐场景',
    source: 'yuanji',
  },
  锅圈: {
    tactic: '社区预制菜+在家火锅',
    scene: '截流家庭聚餐频次',
    source: 'guoquan',
  },
  超意兴: {
    price: '10元以内套餐',
    margin: '约0.7元/份净利（案例）',
    model: '中央厨房+极致效率',
    source: 'chaoyixing',
  },
  辣可可: {
    model: '核心商圈高成本下正向现金流',
    focus: '盈亏平衡 · 扩张储备',
  },
  麻小六: {
    shift: '80元→35元客单降维',
    model: '轻量店快铺',
  },
  大米先生: {
    change: 'SKU精简 · 供应链集采',
    result: '降价10% · 综合毛利+5%（案例）',
  },
};

export function sourceLine(key) {
  const s = SOURCES[key];
  return s ? `数据来源 · ${s}` : '';
}

export function enrichPage(page, spec) {
  const out = { ...spec };
  if (page === 2) {
    out.stats = [INDUSTRY_STATS.noGrowth];
    out.source = sourceLine('ccfa2026');
    out.statsExtra = `权威参照：2025停业商户${INDUSTRY_STATS.churn.n}%经营不足2年（${SOURCES.ccfa2026}）`;
  }
  if (page === 3) {
    out.stats = [INDUSTRY_STATS.declining];
    out.source = sourceLine('ccfa2026');
  }
  if (page === 4) {
    out.stats = [INDUSTRY_STATS.noGrowth, INDUSTRY_STATS.declining];
    out.statsExtra = `2025全年停业339万家，同比+${INDUSTRY_STATS.closureYoY.n}%`;
    out.source = sourceLine('ccfa2026');
  }
  if (page === 5) {
    out.stats = [
      { n: '72', unit: '%', label: '房租+人工+食材' },
      { n: '28', unit: '%', label: '可支配' },
    ];
  }
  if (page === 25 || page === 26) {
    const c = CASE_DATA.南城香;
    out.caseFacts = [`${c.breakfastPrice} · 早餐日流${c.breakfastFlow}`, `午餐人均${c.lunchAvg}`, c.model];
    out.source = sourceLine('nanchengxiang');
  }
  if (page === 47 || page === 58) {
    const c = CASE_DATA.超意兴;
    out.caseFacts = [c.price, c.margin, c.model];
    out.source = sourceLine('chaoyixing');
  }
  if (page === 126 || page === 127) {
    out.statsExtra = `连锁化率${INDUSTRY_STATS.chainRate.n}%（2025）· 行业收入增速${INDUSTRY_STATS.revenueYoY.n}%`;
    out.source = sourceLine('ccfa2026');
  }
  return out;
}
