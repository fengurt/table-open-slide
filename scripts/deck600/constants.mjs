export const DECK_TITLE = '餐饮单店盈利实战';
export const DECK_SUB = '从活下去到可复制';
export const DECK_TAGLINE = '盈利模型 × 产品结构 × 连锁种子课';
export const TOTAL = 600;

export const MODULES = [
  { id: 'm1', act: 'Day 1 · AM', title: '模块一 · 三重死亡时钟', start: 1, end: 13 },
  { id: 'm2', act: 'Day 1 · AM', title: '模块二 · 营收公式', start: 14, end: 30 },
  { id: 'm3', act: 'Day 1 · AM', title: '模块三 · 夹层困境', start: 31, end: 41 },
  { id: 'm4', act: 'Day 1 · AM', title: '模块四 · 单店生死线', start: 42, end: 53 },
  { id: 'm5', act: 'Day 1 · PM', title: '模块五 · 三种模型', start: 54, end: 65 },
  { id: 'm6', act: 'Day 1 · PM', title: '模块六 · 产品结构翻译器', start: 66, end: 76 },
  { id: 'm7', act: 'Day 1 · PM', title: '模块七 · 产品诊断实战', start: 77, end: 90 },
  { id: 'm8', act: 'Day 2 · AM', title: '模块八 · 主辅佐引', start: 91, end: 103 },
  { id: 'm9', act: 'Day 2 · AM', title: '模块九 · 价格带策略', start: 104, end: 112 },
  { id: 'm10', act: 'Day 2 · PM', title: '模块十 · 双菜单战略', start: 113, end: 118 },
  { id: 'm11', act: 'Day 2 · PM', title: '模块十一 · 九宫格菜单', start: 119, end: 125 },
  { id: 'm12', act: 'Day 2 · PM', title: '模块十二 · 连锁种子', start: 126, end: 133 },
  { id: 'm13', act: 'Day 2 · Close', title: '模块十三 · 结营与承诺', start: 134, end: 138 },
  { id: 'v-case', act: 'Visual', title: '案例视觉流', start: 139, end: 558 },
  { id: 'v-close', act: 'Close', title: '结营回顾', start: 559, end: 600 },
];

export const MODULE_STARTS = new Set(
  MODULES.filter((m) => m.id.startsWith('m')).map((m) => m.start),
);

export const VISUAL_STREAMS = [
  { start: 139, end: 168, brand: '南城香', tag: '转化率工程', module: 'm2', beats: ['清晨七点的客流洪峰', '三元早餐与自助小菜', '早餐→正餐转化数据链'] },
  { start: 169, end: 198, brand: '海底捞', tag: '甜品引流', module: 'm2', beats: ['外卖平台甜品标价', '社交媒体晒单穿透', '新客→会员→堂食链路'] },
  { start: 199, end: 228, brand: '袁记云饺', tag: '场景侵占', module: 'm3', beats: ['社区生鲜外带窗口', '堂食白领快食线', '周边竞品冷清反差'] },
  { start: 229, end: 258, brand: '锅圈食汇', tag: '跨界截流', module: 'm3', beats: ['标准化冷柜阵列', '周末居家火锅场景', '传统火锅上座率下滑'] },
  { start: 259, end: 288, brand: '辣可可', tag: '极限模型', module: 'm4', beats: ['核心商圈成本拆解', '翻台率时段热力', '扩张资金池压测'] },
  { start: 289, end: 318, brand: '超意兴', tag: '成本压榨', module: 'm4', beats: ['十元套餐视觉冲击', '中央厨房流水线', '七毛净利×恐怖出餐量'] },
  { start: 319, end: 348, brand: '麻小六', tag: '降维模型', module: 'm5', beats: ['正餐店 vs 轻量店', '八十元→三十五元路径', '次级商圈快速铺网'] },
  { start: 349, end: 378, brand: '大米先生', tag: '降本改良', module: 'm6', beats: ['改造前 SKU 密集墙', '供应链源头集采', '降价10%毛利反升5%'] },
  { start: 379, end: 408, brand: '辣可可', tag: '产品诊断', module: 'm7', beats: ['藕汤流量黑洞曲线', '花龙隐藏宝藏毛利', '水蒸蛋占位废弃率'] },
  { start: 409, end: 438, brand: '南城香', tag: '主辅佐引', module: 'm8', beats: ['米饭主食定场景', '十五元辅菜利润区', '季节引流弹性阵型'] },
  { start: 439, end: 468, brand: '价格带', tag: '双峰重塑', module: 'm9', beats: ['定价混乱菜单', '缺乏低价锚点', '南城香双峰曲线'] },
  { start: 469, end: 498, brand: '外卖热力图', tag: '选址核武', module: 'm10', beats: ['城市订单热力', '街道地图叠加', '二店首月盈利战报'] },
  { start: 499, end: 528, brand: '九宫格货架', tag: '视觉动线', module: 'm11', beats: ['劣质菜单红叉', '眼动热力覆盖', 'Z型黄金排版范本'] },
  { start: 529, end: 558, brand: '区域品牌', tag: '跨区溃败', module: 'm12', beats: ['大本营门庭若市', '新店客流断崖', '同菜不同色 SOP 崩塌'] },
  { start: 559, end: 588, brand: '孟子三问', tag: '结营回顾', module: 'm13', beats: ['流量之问', '现场手术讨论', '承诺墙全景'] },
  { start: 589, end: 600, brand: '六十天契约', tag: '行动闭环', module: 'm13', beats: ['周级里程碑铁律', '倒计时 60', '顶峰相见'] },
];

export const PREMIUM_CSS = `
  /* ── Atelier v2 · 编辑级幻灯片 ── */
  .slide-head{display:flex;justify-content:flex-end;padding-bottom:2vh}
  .slide-num{font-family:var(--mono);font-size:11px;letter-spacing:.28em;opacity:.38}
  .slide-foot{margin-top:auto;padding-top:3vh;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid rgba(var(--gold-rgb),.12)}
  .slide.light .slide-foot{border-top-color:rgba(var(--ink-rgb),.08)}
  .slide-module{font-family:var(--serif-zh);font-size:max(12px,.9vw);letter-spacing:.06em;opacity:.45}
  .slide.hero .slide-head,.slide.hero .slide-foot{opacity:.55}
  .slide.hero .slide-foot{border-top-color:rgba(var(--gold-rgb),.2)}

  .frame-main{flex:1;display:flex;flex-direction:column;min-height:0;justify-content:center}

  /* Stat · 巨型数字 + 幽灵字 */
  .stat-stage{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;flex:1;gap:2vh}
  .stat-stage .ghost-n{
    position:absolute;font-family:var(--serif-en);font-weight:700;font-size:clamp(8rem,38vw,22rem);
    line-height:1;opacity:.04;letter-spacing:-.04em;pointer-events:none;user-select:none;font-feature-settings:"tnum"
  }
  .stat-core{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:1.2vh}
  .stat-core .n{
    font-family:var(--serif-en);font-weight:600;font-size:clamp(4rem,18vw,12rem);
    line-height:.88;letter-spacing:-.03em;color:rgba(var(--gold-rgb),.97);font-feature-settings:"tnum"
  }
  .stat-core .unit{font-family:var(--serif-zh);font-size:.32em;font-weight:500;margin-left:.04em}
  .stat-core .label{
    font-family:var(--sans-zh);font-size:max(15px,1.15vw);letter-spacing:.12em;
    opacity:.72;max-width:28vw;line-height:1.5
  }
  .stat-foot{font-family:var(--mono);font-size:max(9px,.68vw);letter-spacing:.08em;opacity:.32;max-width:46vw;text-align:center;line-height:1.55;margin-top:2vh}

  /* Dual stat */
  .dual-grid{display:grid;grid-template-columns:1fr 1fr;gap:3vw;flex:1;align-items:center;padding:2vh 0}
  .dual-cell{
    text-align:center;padding:5vh 2vw;
    border:1px solid rgba(var(--gold-rgb),.16);
    background:linear-gradient(180deg,rgba(var(--gold-rgb),.04) 0%,transparent 100%)
  }
  .slide.light .dual-cell{border-color:rgba(var(--ink-rgb),.08);background:rgba(var(--ink-rgb),.02)}
  .dual-cell .n{font-family:var(--serif-en);font-weight:600;font-size:clamp(2.2rem,9vw,6.5rem);line-height:.9;color:rgba(var(--gold-rgb),.95)}
  .dual-cell .lbl{font-family:var(--sans-zh);font-size:max(13px,1vw);opacity:.65;margin-top:1.4vh;line-height:1.45}

  /* Quote · 全屏金句 */
  .quote-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;flex:1;gap:3vh;padding:0 12vw}
  .quote-stage .mark{font-family:var(--serif-en);font-size:clamp(3rem,8vw,6rem);line-height:1;color:rgba(var(--gold-rgb),.25);font-weight:400}
  .quote-stage .q{
    font-family:var(--serif-zh);font-weight:500;font-size:clamp(1.5rem,3.8vw,3rem);
    line-height:1.55;letter-spacing:.02em;max-width:58vw
  }

  /* Before / After */
  .ba-grid{display:grid;grid-template-columns:1fr 1px 1fr;gap:4vw;flex:1;align-items:stretch;padding-top:2vh}
  .ba-grid .divider{background:linear-gradient(180deg,transparent,rgba(var(--gold-rgb),.35),transparent)}
  .ba-card{display:flex;flex-direction:column;gap:1.4vh;padding:3vh 2vw;border-radius:2px}
  .ba-card.before{background:rgba(180,90,90,.06);border:1px solid rgba(180,90,90,.15)}
  .ba-card.after{background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.18)}
  .ba-tag{font-family:var(--mono);font-size:10px;letter-spacing:.26em;text-transform:uppercase;opacity:.5}
  .ba-card.before .ba-tag{color:rgba(196,112,112,.9)}
  .ba-card.after .ba-tag{color:rgba(var(--gold-rgb),.9)}
  .ba-title{font-family:var(--serif-zh);font-weight:600;font-size:max(18px,1.5vw);line-height:1.3;margin-top:.6vh}
  .ba-body{font-family:var(--sans-zh);font-size:max(14px,1.05vw);opacity:.72;line-height:1.65;margin-top:.4vh}

  /* Flow chain · 场景→品类→门店 */
  .flow-chain{display:flex;align-items:center;gap:clamp(12px,2vw,28px);flex-wrap:wrap;margin-top:4vh}
  .flow-node{
    font-family:var(--serif-zh);font-weight:600;font-size:clamp(1.1rem,2.2vw,2rem);
    padding:1.2vh 1.6vw;border:1px solid rgba(var(--gold-rgb),.35);
    background:rgba(var(--gold-rgb),.05);letter-spacing:.04em
  }
  .slide.light .flow-node{border-color:rgba(var(--gold-rgb),.45);background:rgba(var(--gold-rgb),.07)}
  .flow-arrow{width:clamp(24px,4vw,48px);height:1px;background:linear-gradient(90deg,rgba(var(--gold-rgb),.2),rgba(var(--gold-rgb),.8));position:relative}
  .flow-arrow::after{content:"";position:absolute;right:0;top:-3px;border:4px solid transparent;border-left:6px solid rgba(var(--gold-rgb),.75)}

  /* Case · 左文右图 */
  .case-split{display:grid;grid-template-columns:1fr 1.05fr;gap:5vw;flex:1;align-items:center;padding:1vh 0}
  .case-brand{font-family:var(--mono);font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:rgba(var(--gold-rgb),.85);margin-bottom:2vh}
  .case-title{font-family:var(--serif-zh);font-weight:600;font-size:clamp(1.6rem,3.4vw,2.8rem);line-height:1.25;letter-spacing:.01em}
  .fact-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:3.5vh}
  .fact-pill{
    font-family:var(--sans-zh);font-size:max(13px,.95vw);line-height:1.4;
    padding:10px 16px;border:1px solid rgba(var(--gold-rgb),.22);
    background:rgba(var(--gold-rgb),.04);letter-spacing:.02em
  }
  .slide.light .fact-pill{background:rgba(var(--ink-rgb),.03);border-color:rgba(var(--ink-rgb),.1)}

  /* Visual panel · 纯抽象画面，无 caption */
  .vis-panel{
    position:relative;min-height:52vh;border-radius:2px;overflow:hidden;
    border:1px solid rgba(var(--gold-rgb),.12)
  }
  .vis-panel::before{
    content:"";position:absolute;inset:0;
    background:linear-gradient(145deg,rgba(var(--gold-rgb),.12) 0%,rgba(var(--ink-rgb),.55) 55%,rgba(var(--ink-rgb),.85) 100%)
  }
  .slide.light .vis-panel::before{background:linear-gradient(145deg,rgba(var(--gold-rgb),.14) 0%,rgba(var(--paper-tint),.9) 60%,rgba(var(--ink-rgb),.04) 100%)}
  .vis-panel::after{
    content:"";position:absolute;inset:0;opacity:.55;
    background:radial-gradient(circle at 20% 25%,rgba(var(--gold-rgb),.22),transparent 45%),
               radial-gradient(circle at 80% 75%,rgba(var(--gold-rgb),.08),transparent 40%)
  }
  .vis-panel[data-v="1"]::before{background:linear-gradient(165deg,rgba(var(--ink-tint),.9),rgba(var(--gold-rgb),.18))}
  .vis-panel[data-v="2"]::before{background:linear-gradient(200deg,rgba(var(--gold-rgb),.2),rgba(var(--ink-rgb),.75))}
  .vis-panel[data-v="3"]::before{background:linear-gradient(120deg,rgba(var(--ink-rgb),.8),rgba(var(--gold-rgb),.25) 70%)}
  .vis-grain{position:absolute;inset:0;opacity:.04;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

  /* Flash · 全幅案例镜 */
  .flash-stage{position:relative;flex:1;min-height:0;border-radius:2px;overflow:hidden;border:1px solid rgba(var(--gold-rgb),.1)}
  .flash-stage::before{
    content:"";position:absolute;inset:0;
    background:linear-gradient(125deg,rgba(var(--ink-tint),.95) 0%,rgba(var(--gold-rgb),.15) 50%,rgba(var(--ink-rgb),.9) 100%)
  }
  .flash-stage[data-v="1"]::before{background:linear-gradient(160deg,#132a45,rgba(var(--gold-rgb),.2))}
  .flash-stage[data-v="2"]::before{background:linear-gradient(200deg,rgba(var(--gold-rgb),.25),#0A1626)}
  .flash-stage[data-v="3"]::before{background:linear-gradient(140deg,#0A1626 30%,rgba(var(--gold-rgb),.3))}
  .flash-stage .vis-grain{opacity:.06}
  .flash-overlay{
    position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;justify-content:flex-end;
    padding:6vh 5vw;background:linear-gradient(180deg,transparent 40%,rgba(var(--ink-rgb),.72) 100%)
  }
  .flash-brand{font-family:var(--mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:rgba(var(--gold-rgb),.9);margin-bottom:1.2vh}
  .flash-scene{font-family:var(--serif-zh);font-weight:600;font-size:clamp(1.4rem,3vw,2.6rem);line-height:1.35;max-width:52vw;letter-spacing:.02em}
  .flash-seq{position:absolute;top:4vh;right:4vw;font-family:var(--mono);font-size:11px;letter-spacing:.2em;opacity:.4;z-index:3}

  /* Action · 工作坊 */
  .action-stage{max-width:58vw;padding-top:2vh}
  .action-title{font-family:var(--serif-zh);font-weight:600;font-size:clamp(1.8rem,4vw,3.2rem);line-height:1.2;margin:1.5vh 0 2.5vh}
  .action-timer{
    font-family:var(--serif-en);font-weight:600;font-size:clamp(2.5rem,10vw,5.5rem);
    color:rgba(var(--gold-rgb),.92);letter-spacing:-.02em;margin-bottom:3vh;font-feature-settings:"tnum"
  }
  .action-list{display:flex;flex-direction:column;gap:1.8vh;list-style:none;padding:0}
  .action-list li{
    display:flex;align-items:baseline;gap:1.2vw;font-family:var(--sans-zh);
    font-size:max(15px,1.12vw);line-height:1.55;opacity:.88;padding-left:0
  }
  .action-list li::before{
    content:attr(data-i);font-family:var(--mono);font-size:10px;letter-spacing:.1em;
    color:rgba(var(--gold-rgb),.75);min-width:1.8em;opacity:.7
  }

  /* Pipeline step */
  .pipe-stage{padding-top:2vh}
  .pipe-step{
    margin-top:4vh;padding:3vh 0 0;border-top:2px solid rgba(var(--gold-rgb),.4);max-width:48vw
  }
  .pipe-nb{font-family:var(--mono);font-size:10px;letter-spacing:.22em;opacity:.45}
  .pipe-name{font-family:var(--serif-zh);font-weight:600;font-size:clamp(1.3rem,2.4vw,2rem);margin-top:1vh;line-height:1.3}
  .pipe-desc{font-family:var(--sans-zh);font-size:max(14px,1.05vw);opacity:.7;margin-top:1vh;line-height:1.6;max-width:40vw}

  /* Hero */
  .hero-stage{display:grid;gap:3vh;align-content:center;justify-items:center;text-align:center;flex:1;padding:4vh 8vw}
  .hero-kicker{font-family:var(--mono);font-size:11px;letter-spacing:.38em;text-transform:uppercase;opacity:.5}
  .hero-title{
    font-family:var(--serif-zh);font-weight:600;font-size:clamp(2.6rem,8vw,5.5rem);
    line-height:1.08;letter-spacing:.06em
  }
  .hero-sub{font-family:var(--serif-zh);font-weight:400;font-size:clamp(1.1rem,2.2vw,1.85rem);opacity:.78;letter-spacing:.08em}
  .hero-tag{font-family:var(--mono);font-size:max(10px,.78vw);letter-spacing:.2em;opacity:.42;margin-top:1vh}

  /* Act divider */
  .act-stage{display:grid;gap:3.5vh;align-content:center;min-height:75vh;padding-left:2vw}
  .act-num{font-family:var(--serif-en);font-style:italic;font-size:clamp(3rem,10vw,7rem);line-height:1;color:rgba(var(--gold-rgb),.18);font-weight:400}
  .act-title{font-family:var(--serif-zh);font-weight:600;font-size:clamp(2rem,5.5vw,4rem);line-height:1.12;max-width:52vw}
  .act-lead{font-family:var(--sans-zh);font-size:max(15px,1.15vw);opacity:.65;max-width:36vw;line-height:1.65}

  .gold-rule{width:56px;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--gold-rgb),.85),transparent)}
  .gold-rule.wide{width:100%;max-width:120px}
  .page-title{font-family:var(--serif-zh);font-weight:600;font-size:clamp(1.6rem,3.6vw,2.8rem);line-height:1.2;max-width:54vw}
  .page-kicker{font-family:var(--mono);font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.48;margin-bottom:2vh}
`;
