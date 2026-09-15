/**
 * spatial-engine.js — 空间秩序生成器
 *
 * 输入场景参数，自动计算：
 * - 中轴位置（严格中轴/似正非正/黄金分割）
 * - 开间数量与柱网布局
 * - 空间层级（前庭/中殿/后堂）
 * - 尺度比例（巨构/人体/建筑）
 * - 进深与递进序列
 * - 虚实分配（留白比例）
 *
 * 基于唐代建筑模数（方五斜七√2/三段式/出檐比例）+ 博主HIGH CONFIDENCE原则。
 */

import { SQRT2, THREE_PART_RATIOS, clamp, lerp } from './utils/math.js';

/** 场景类型预设 */
const SCENE_PRESETS = {
  'palace': {
    name: '宫殿',
    axisMode: 'strict',
    layers: 3,
    voidRatio: 0.40,
    threePart: 'tang-palace',
    buildingToHuman: 15,
    eaveRatio: 0.45,
  },
  'temple': {
    name: '寺庙',
    axisMode: 'strict',
    layers: 3,
    voidRatio: 0.50,
    threePart: 'tang-palace',
    buildingToHuman: 12,
    eaveRatio: 0.40,
  },
  'residence': {
    name: '民居',
    axisMode: 'near-axis',
    layers: 2,
    voidRatio: 0.55,
    threePart: 'song-residence',
    buildingToHuman: 6,
    eaveRatio: 0.35,
  },
  'landscape': {
    name: '山水',
    axisMode: 'golden',
    layers: 3,
    voidRatio: 0.70,
    threePart: 'minimal',
    buildingToHuman: 20,
    eaveRatio: 0.30,
  },
  'gate-act0': {
    name: 'ACT0云海单门',
    axisMode: 'near-axis',
    layers: 2,
    voidRatio: 0.65,
    threePart: 'minimal',
    buildingToHuman: 10,
    eaveRatio: 0.40,
  },
};

/**
 * 主入口：生成空间秩序方案
 * @param {Object} params - 场景参数
 * @returns {Object} 空间秩序方案
 */
export function generateSpatialOrder(params = {}) {
  const preset = SCENE_PRESETS[params.sceneType] || SCENE_PRESETS['residence'];
  const width = params.width || 1920;
  const height = params.height || 1080;

  // 1. 中轴位置
  const axis = calculateAxis(preset.axisMode, width, params.axisOffset);

  // 2. 开间与柱网
  const baySystem = calculateBaySystem(params.bayCount || 5, width, preset);

  // 3. 空间层级
  const layers = calculateLayers(preset.layers, height, preset.threePart);

  // 4. 尺度比例
  const scale = calculateScale(preset.buildingToHuman, params.humanHeight || 1.7);

  // 5. 进深与递进
  const depth = calculateDepthSequence(preset.layers, params.depthRatio || 0.6);

  // 6. 虚实分配
  const voidSolid = calculateVoidSolid(preset.voidRatio, width, height);

  // 7. 不完整入画
  const framing = calculateFraming(params.hasIncompleteFraming ?? true, width, height);

  return {
    sceneType: params.sceneType || 'residence',
    presetName: preset.name,
    canvas: { width, height },
    axis,
    baySystem,
    layers,
    scale,
    depth,
    voidSolid,
    framing,
    layoutSummary: generateLayoutSummary(axis, layers, voidSolid, scale),
  };
}

/* ==================== 各子生成器 ==================== */

/** 中轴位置计算 */
function calculateAxis(mode, width, offset = 0) {
  const center = width / 2;
  switch (mode) {
    case 'strict':
      return {
        mode: 'strict',
        x: center,
        offsetPercent: 0,
        description: '严格中轴对称——宫殿/寺庙的庄重秩序',
        tolerance: 0.05,
      };
    case 'near-axis':
      const nearOffset = offset || width * 0.05;
      return {
        mode: 'near-axis',
        x: center + nearOffset,
        offsetPercent: (nearOffset / width) * 100,
        description: '似正非正——有中轴感但主体微偏，东方高级感',
        tolerance: 0.10,
      };
    case 'golden':
      const goldenX = width * 0.382;
      return {
        mode: 'golden',
        x: goldenX,
        offsetPercent: Math.abs(goldenX - center) / width * 100,
        description: '黄金分割点——山水/写意的非对称构图',
        tolerance: 0.05,
      };
    default:
      return { mode: 'strict', x: center, offsetPercent: 0, description: '严格中轴', tolerance: 0.05 };
  }
}

/** 开间与柱网计算 */
function calculateBaySystem(bayCount, width, preset) {
  // 中国古建开间为单数（1/3/5/7/9/11），偶数开间不合礼制
  const validBayCount = bayCount % 2 === 0 ? bayCount + 1 : bayCount;
  const bayWidth = width / validBayCount;

  // 明间（中间开间）比次间宽1.2-1.5倍
  const mingBayWidth = bayWidth * 1.3;
  const ciBayWidth = (width - mingBayWidth) / (validBayCount - 1);

  const bays = [];
  const midIndex = Math.floor(validBayCount / 2);
  for (let i = 0; i < validBayCount; i++) {
    const isMing = i === midIndex;
    bays.push({
      index: i,
      name: isMing ? '明间' : (i < midIndex ? `次间${midIndex - i}` : `次间${i - midIndex}`),
      width: isMing ? mingBayWidth : ciBayWidth,
      isMing,
    });
  }

  return {
    bayCount: validBayCount,
    bayWidth,
    mingBayWidth,
    ciBayWidth,
    bays,
    columnCount: validBayCount + 1,
    description: `${validBayCount}开间（单数合礼制），明间宽${mingBayWidth.toFixed(0)}px，次间宽${ciBayWidth.toFixed(0)}px`,
  };
}

/** 空间层级计算（三段式竖向） */
function calculateLayers(layerCount, height, threePartKey) {
  const ratio = THREE_PART_RATIOS[threePartKey] || THREE_PART_RATIOS['song-residence'];
  const total = ratio.base + ratio.body + ratio.roof;

  const baseHeight = height * (ratio.base / total);
  const bodyHeight = height * (ratio.body / total);
  const roofHeight = height * (ratio.roof / total);

  const layers = [
    { name: '台基', y: 0, height: baseHeight, ratio: ratio.base, description: '基座/地面/台阶' },
    { name: '屋身', y: baseHeight, height: bodyHeight, ratio: ratio.body, description: '柱子/墙体/门窗' },
    { name: '屋顶', y: baseHeight + bodyHeight, height: roofHeight, ratio: ratio.roof, description: '梁架/屋面/出檐' },
  ];

  return {
    count: layerCount,
    threePart: ratio,
    layers,
    totalHeight: height,
    description: `三段式（${ratio.name}）台基:屋身:屋顶 = ${ratio.base}:${ratio.body}:${ratio.roof}`,
  };
}

/** 尺度比例计算 */
function calculateScale(buildingToHuman, humanHeight) {
  const buildingHeight = humanHeight * buildingToHuman;

  let scaleLevel;
  if (buildingToHuman >= 15) scaleLevel = '巨构（monumental）';
  else if (buildingToHuman >= 8) scaleLevel = '宏大（grand）';
  else if (buildingToHuman >= 5) scaleLevel = '标准（standard）';
  else scaleLevel = '亲近（intimate）';

  return {
    buildingToHuman,
    humanHeight,
    buildingHeight,
    scaleLevel,
    humanAreaRatio: buildingToHuman >= 10 ? 0.01 : buildingToHuman >= 5 ? 0.03 : 0.05,
    recommendation: buildingToHuman >= 5
      ? `人物占画面≤${(buildingToHuman >= 10 ? 1 : 3)}%，用背影/侧面/剪影做尺度锚点`
      : '尺度比<5:1，无巨构感，建议拉到5:1以上',
  };
}

/** 进深与递进序列 */
function calculateDepthSequence(layerCount, depthRatio) {
  const layers = [];
  let currentDepth = 1.0;

  for (let i = 0; i < layerCount; i++) {
    layers.push({
      level: i,
      name: ['前庭', '中殿', '后堂', '后院'][i] || `第${i + 1}层`,
      depth: currentDepth,
      opacity: 1 - (i * 0.15),
      blur: i * 2,
      description: i === 0 ? '入口层——最清晰，引导进入' : `递进层${i}——逐渐模糊，增加进深`,
    });
    currentDepth *= depthRatio;
  }

  return {
    layerCount,
    depthRatio,
    layers,
    hasProgression: layerCount >= 2,
    description: `前→中→后递进序列，每层深度递减${((1 - depthRatio) * 100).toFixed(0)}%，透明度递减15%`,
  };
}

/** 虚实分配 */
function calculateVoidSolid(voidRatio, width, height) {
  const totalArea = width * height;
  const voidArea = totalArea * voidRatio;
  const solidArea = totalArea - voidArea;

  let voidLevel;
  if (voidRatio >= 0.70) voidLevel = '大虚小实（7:3）——宋韵极简';
  else if (voidRatio >= 0.60) voidLevel = '虚实平衡（6:4）——标准东方';
  else if (voidRatio >= 0.40) voidLevel = '实多虚少（4:6）——偏满';
  else voidLevel = '过实（<4:6）——堵得慌';

  return {
    voidRatio,
    voidArea,
    solidArea,
    voidLevel,
    recommendation: voidRatio >= 0.60
      ? `留白${(voidRatio * 100).toFixed(0)}%，空的地方是呼吸不是没东西`
      : `留白仅${(voidRatio * 100).toFixed(0)}%，建议提升到60%以上`,
    skyWaterZone: { y: 0, height: height * voidRatio * 0.8, description: '天空/水面/云雾区域' },
    solidZone: { y: height * voidRatio * 0.8, height: height * (1 - voidRatio * 0.8), description: '建筑/人/山区域' },
  };
}

/** 不完整入画计算 */
function calculateFraming(enabled, width, height) {
  if (!enabled) {
    return { enabled: false, description: '所有元素完整入画' };
  }

  return {
    enabled: true,
    cropPercent: 0.15,
    recommendedCrops: [
      { edge: 'left', element: '建筑左侧', crop: '10-20%', reason: '暗示建筑延伸到画面外' },
      { edge: 'top', element: '屋顶顶部', crop: '5-15%', reason: '暗示建筑更高' },
      { edge: 'right', element: '山体/配景', crop: '15-30%', reason: '增加想象空间' },
    ],
    forbiddenCrops: [
      { edge: 'any', element: '人物关节处', reason: '切在脖子/腰/膝盖=不舒服' },
      { edge: 'any', element: '门中间', reason: '切在门的中线上=不完整感太强' },
    ],
    description: '至少一个主要元素被边缘裁切10-30%，不切在关节/门中线处',
  };
}

/* ==================== 布局摘要 ==================== */

function generateLayoutSummary(axis, layers, voidSolid, scale) {
  return [
    `中轴：${axis.description}（x=${axis.x.toFixed(0)}px，偏移${axis.offsetPercent.toFixed(1)}%）`,
    `竖向：${layers.description}`,
    `虚实：${voidSolid.voidLevel}（留白${(voidSolid.voidRatio * 100).toFixed(0)}%）`,
    `尺度：${scale.scaleLevel}（建筑:人=${scale.buildingToHuman}:1）`,
  ].join('；');
}
