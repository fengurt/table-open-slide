/** 运行时补全短 spec · 合并权威数据 */
import { enrichPage } from './authority-data.mjs';
import { MODULES } from './constants.mjs';

const EXPANSIONS = {
  场景决策链: {
    visual:
      '全屏三层箭头：场景（谁在什么时刻需要吃饭）→ 品类（选择什么形态）→ 门店（具体进哪家）。每层配生活剪影：加班白领、带娃家庭、独居青年。底部脚注：竞争不在同街，在同场景。',
    notes: '讲师沿箭头滑动讲解；第三层停留10秒，让学员写下自己的「场景词」。',
    script:
      '顾客从来不是先想「我要吃火锅」，而是先有一个场景：「周五晚上不想做饭」。场景决定品类，品类决定门店。你的对手不在你那条街——而在隔壁那条满足同一场景的品类里。菜单上的每一道菜，都应该回答：我为哪个场景而存在？',
  },
  三类竞争: {
    visual:
      '三列对照：①横向竞争（同品类同价格带）②维度竞争（外卖/零售/预制菜跨维截流）③内耗竞争（SKU互抢毛利与工时）。每列配一个真实品牌Logo剪影与箭头指向同一客群。',
    notes: '每列讲解不超过90秒；第三列「内耗」需投屏学员自家菜单红圈。',
    script:
      '大多数老板只看见横向竞争——隔壁又开了一家。真正致命的是维度竞争：顾客没进你店，订单却进了锅圈或外卖。更隐蔽的是内耗：86个SKU里，30个在互相抢后厨、抢库存、抢顾客注意力。三类竞争，三类解法，不能混为一谈。',
  },
  找僵尸产品: {
    visual:
      '投屏真实菜单照片，低销量高工时SKU用红色毒瘤圈标注。旁侧表格：销量、毛利、工时占比、废弃率四列。右侧「斩首区」留白待填。',
    notes: '准备2–3家匿名学员菜单；红圈由讲师现场画，制造痛感。',
    script:
      '僵尸产品不是卖得不好那么简单——它占用工时、占用库存、占用菜单版面，还误导顾客以为你是「什么都有」的杂货铺。今天我们不凭感觉，用四列数据找毒瘤：销量、毛利、工时、废弃率。四个都差的，没有改良价值，只有斩首价值。',
  },
  营收金字塔: {
    visual: '经典营收金字塔四层（流量/转化/客单/复购）从中间碎裂，碎片化为乘法公式：客流×转化率×客单价×复购率×外卖系数。',
    notes: '碎裂动画配合短音效；碎后停留在乘法公式页。',
    script:
      '旧时代我们讲营收金字塔——四层平均发力。存量时代这套逻辑破产了：四个指标是相乘关系，不是相加。任何一个指标微跌3%，总营收可能跌10%以上。平均发力=均匀失效。',
  },
  数据资产: {
    visual: '第六块木板「数据资产」高亮接入水桶图。三库图标：顾客资产库、产品资产库、时段资产库，各配一条样例数据。',
    notes: '与16–20页水桶步进衔接；强调「数据是第六个乘数」。',
    script:
      '高峰几点来、爆款是谁买、外卖哪个时段爆——这些数据不是报表，是资产。能回答「谁会在什么时候为什么买单」的店，才有资格谈连锁复制。数据资产，是第六块木板。',
  },
};

function moduleFor(page) {
  return MODULES.find((m) => m.id.startsWith('m') && page >= m.start && page <= m.end);
}

export function enrichTeaching(spec) {
  if (!spec) return spec;
  let out = { ...spec };

  const exp = EXPANSIONS[out.title];
  if (exp) {
    out = { ...out, ...exp };
  }

  if ((out.script?.length ?? 0) < 45 && !exp) {
    const mod = moduleFor(out.page);
    out.script = `${out.script || ''} 【${mod?.title ?? '本模块'}】${out.title}：回店用真实后台数据验证，写进诊断卡。`.trim();
  }
  if ((out.visual?.length ?? 0) < 60) {
    const mod = moduleFor(out.page);
    out.visual = `PPT全幅呈现「${out.title}」：${out.kicker || mod?.title || '模块主线'}。结构图+关键数字高亮，左文右图或全屏闪频，底部脚注标注案例/数据来源。`;
  }
  if (!out.notes || out.notes.length < 20) {
    out.notes = `场控：${out.pace || '推演流'}；与${moduleFor(out.page)?.title ?? '课程'}主线对齐；需要学员拍照或填表时给足90秒静默。`;
  }
  if (!out.grain) out.grain = '标准教学页';
  if (!out.prototype) out.prototype = out.layout || 'structure';

  return enrichPage(out.page, out);
}

export function enrichVisual(spec) {
  if (!spec) return spec;
  const out = { ...spec };
  if ((out.script?.length ?? 0) < 50 && out.caption) {
    out.script = `${out.caption}。静默观看≤3秒/镜，讲师仅点屏：「对照你店，同类机会还是风险？」`;
  }
  return out;
}
