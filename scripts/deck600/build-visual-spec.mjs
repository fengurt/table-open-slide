/** 动态生成 139–600 视觉流 spec（替代静态 VISUAL_SPEC_MAP） */
import { VISUAL_STREAMS } from './constants.mjs';
import { getSceneName } from './visual-scenes.mjs';

const PAGES_PER_BEAT = 10;

export function buildVisualSpec(page) {
  const stream = VISUAL_STREAMS.find((s) => page >= s.start && page <= s.end);
  if (!stream) return null;

  const offset = page - stream.start;
  const beatIdx = Math.min(stream.beats.length - 1, Math.floor(offset / PAGES_PER_BEAT));
  const sceneIdx = (offset % PAGES_PER_BEAT) + 1;
  const beat = stream.beats[beatIdx];
  const sceneName = getSceneName(stream.brand, beat, sceneIdx);
  const layout = 'flash';
  const beatSeq = `${sceneIdx}/${PAGES_PER_BEAT}`;

  let script;
  if (sceneIdx === 1) {
    script = `案例视觉流 · ${stream.brand}「${stream.tag}」。Beat「${beat}」开镜：${sceneName}。对照上午${stream.module}模型。`;
  } else if (sceneIdx === 10) {
    script = `本组「${beat}」十镜收束：${sceneName}。带走一个可迁移动作，本周回店试。`;
  } else {
    script = `第${sceneIdx}镜 · ${sceneName}。看你店：同类机会，还是同类风险？`;
  }

  const visual = `${stream.brand} · ${beat} · ${sceneName}。全屏${layout === 'flash' ? '闪频' : '分栏'}实拍/示意，叠加关键数据标注，字幕${beatSeq}，底部脚注公开报道或学员匿名案例。`;

  const notes =
    sceneIdx === 1
      ? '先报品牌+beat；闪频≤3秒/镜，静默观看。'
      : sceneIdx === 10
        ? '本beat结束切回讲师，可留5秒黑场。'
        : '无需解说，让画面说话；讲师仅点屏。';

  return {
    page,
    layout,
    kicker: `${stream.brand} · ${stream.tag}`,
    title: sceneName,
    grain: '案例视觉流',
    pace: '闪频流',
    prototype: layout,
    brand: stream.brand,
    tag: stream.tag,
    beat,
    beatIdx: beatIdx + 1,
    sceneIdx,
    beatSeq,
    mediaCaption: sceneName,
    linkedModule: stream.module,
    // 讲者备注（不上屏）
    visual,
    notes,
    script,
  };
}

export function buildAllVisualSpecs() {
  const specs = [];
  for (let p = 139; p <= 600; p++) {
    const s = buildVisualSpec(p);
    if (s) specs.push(s);
  }
  return specs;
}
