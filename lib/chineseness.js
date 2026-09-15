/**
 * chineseness.js — "为什么是中国的"判定引擎
 *
 * 核心哲学：不是检测"有没有中国元素"，而是判定"去掉所有显性中国元素后，
 * 结构东方性是否仍然成立"。
 *
 * 10个维度，每维0-10分，总分100。
 * ≥80：真正的东方设计（去掉元素仍成立）
 * 60-79：有东方骨架但依赖表面元素
 * 40-59：表面中式但结构西方
 * <40：不是中国的
 */

import { hexToHsl, isHighSaturation, isPureRed, isBrightGold, avgSaturation } from './utils/color.js';
import { ratioDeviation, isRatioValid, SQRT2, clamp } from './utils/math.js';

/** 维度定义 */
const DIMENSIONS = {
  'spatial-order': { name: '空间秩序', weight: 12, description: '中轴/层级/递进/尺度' },
  'void-solid': { name: '虚实关系', weight: 12, description: '留白/不完整入画/通透' },
  'proportion': { name: '比例克制', weight: 12, description: '√2/三段式/巨构/出檐' },
  'material': { name: '材料逻辑', weight: 8, description: '木石土金纸/粗糙度/包浆' },
  'light-shadow': { name: '光影哲学', weight: 10, description: '明暗比/逆光/体积光/软影' },
  'color': { name: '色彩体系', weight: 12, description: '五方正色/低饱和/君臣佐使' },
  'motion': { name: '动势气韵', weight: 8, description: '缓慢连续/自然运动/云水烟风' },
  'time': { name: '时间痕迹', weight: 6, description: '风化/包浆/昼夜/痕迹' },
  'taboo': { name: '禁忌免疫', weight: 10, description: '无俗套/无西方符号/无滥用' },
  'interaction': { name: '交互语义', weight: 10, description: '动作→意象映射/递进/物我同生' },
};

/**
 * 主入口：判定一个设计的中国性
 * @param {Object} design - 设计参数
 * @returns {Object} 判定结果
 */
export function assessChineseness(design = {}) {
  const scores = {};
  const details = {};
  const recommendations = [];

  // 10个维度逐项评分
  scores['spatial-order'] = scoreSpatialOrder(design, details);
  scores['void-solid'] = scoreVoidSolid(design, details);
  scores['proportion'] = scoreProportion(design, details);
  scores['material'] = scoreMaterial(design, details);
  scores['light-shadow'] = scoreLightShadow(design, details);
  scores['color'] = scoreColor(design, details);
  scores['motion'] = scoreMotion(design, details);
  scores['time'] = scoreTime(design, details);
  scores['taboo'] = scoreTaboo(design, details);
  scores['interaction'] = scoreInteraction(design, details);

  // 加权总分
  let totalScore = 0;
  for (const [key, dim] of Object.entries(DIMENSIONS)) {
    totalScore += (scores[key] / 10) * dim.weight;
  }
  totalScore = Math.round(totalScore);

  // 核心测试：去掉显性中国元素后结构东方性是否成立
  const structuralTest = runStructuralEasternnessTest(design);

  // 生成改进建议（低于6分的维度）
  for (const [key, score] of Object.entries(scores)) {
    if (score < 6) {
      recommendations.push(generateRecommendation(key, score, design, details[key]));
    }
  }

  // 判定等级
  const level = getLevel(totalScore, structuralTest.pass);

  return {
    score: totalScore,
    level,
    levelDescription: getLevelDescription(level),
    dimensions: Object.entries(DIMENSIONS).map(([key, dim]) => ({
      key,
      name: dim.name,
      score: scores[key],
      maxScore: 10,
      weight: dim.weight,
      description: dim.description,
      details: details[key],
    })),
    structuralEasternnessTest: structuralTest,
    coreQuestion: '这个设计为什么是中国的？',
    coreAnswer: generateCoreAnswer(totalScore, structuralTest, details),
    recommendations,
    pass: totalScore >= 60 && structuralTest.pass,
  };
}

/* ==================== 各维度评分函数 ==================== */

/** 1. 空间秩序 */
function scoreSpatialOrder(design, details) {
  let score = 0;
  const d = [];

  // 中轴对称（偏移≤10%得满分，10-20%得半分）
  const offset = design.axisOffsetPercent ?? 5;
  if (offset <= 10) { score += 3; d.push(`中轴偏移${offset}%≤10%`); }
  else if (offset <= 20) { score += 1.5; d.push(`中轴偏移${offset}%（10-20%）`); }
  else d.push(`中轴偏移${offset}%>20%，秩序感弱`);

  // 空间层级（≥3层得满分）
  const layers = design.spatialLayers ?? 2;
  if (layers >= 3) { score += 3; d.push(`空间层级${layers}层≥3`); }
  else if (layers === 2) { score += 1.5; d.push(`空间层级2层`); }
  else d.push('空间层级不足2层');

  // 递进感（有明确的前→中→后序列）
  if (design.hasProgression) { score += 2; d.push('有前→中→后递进序列'); }
  else d.push('缺少递进序列');

  // 尺度锚点（有人或物做尺度参照）
  if (design.hasScaleAnchor) { score += 2; d.push('有尺度锚点（人/物参照）'); }
  else d.push('缺少尺度锚点');

  details['spatial-order'] = d;
  return clamp(score, 0, 10);
}

/** 2. 虚实关系 */
function scoreVoidSolid(design, details) {
  let score = 0;
  const d = [];

  // 留白比例（≥60%满分，40-60%半分，<40%零分）
  const voidRatio = design.voidRatio ?? 0.3;
  if (voidRatio >= 0.60) { score += 4; d.push(`留白${(voidRatio*100).toFixed(0)}%≥60%`); }
  else if (voidRatio >= 0.40) { score += 2; d.push(`留白${(voidRatio*100).toFixed(0)}%（40-60%）`); }
  else d.push(`留白${(voidRatio*100).toFixed(0)}%<40%，太满`);

  // 不完整入画（有元素被边缘裁切）
  if (design.hasIncompleteFraming) { score += 3; d.push('不完整入画（元素被边缘裁切）'); }
  else d.push('所有元素完整入画（缺想象空间）');

  // 通透感（有视线穿透/框景/借景）
  if (design.hasTransparency) { score += 2; d.push('有通透感（框景/借景/视线穿透）'); }
  else d.push('缺少通透感');

  // 大虚小实（虚:实 ≥ 7:3）
  if (voidRatio >= 0.70) { score += 1; d.push('大虚小实7:3'); }

  details['void-solid'] = d;
  return clamp(score, 0, 10);
}

/** 3. 比例克制 */
function scoreProportion(design, details) {
  let score = 0;
  const d = [];

  // 主体宽高比（接近√2或2:1得满分）
  const ratio = design.aspectRatio ?? 1.0;
  const devSqrt2 = ratioDeviation(ratio, SQRT2);
  const dev2to1 = ratioDeviation(ratio, 2.0);
  const minDev = Math.min(devSqrt2, dev2to1);
  if (minDev <= 0.10) { score += 3; d.push(`宽高比${ratio.toFixed(2)}接近经典比例（偏差${(minDev*100).toFixed(0)}%）`); }
  else if (minDev <= 0.20) { score += 1.5; d.push(`宽高比${ratio.toFixed(2)}偏离经典比例（偏差${(minDev*100).toFixed(0)}%）`); }
  else d.push(`宽高比${ratio.toFixed(2)}偏离经典比例>20%`);

  // 巨构尺度（建筑:人 ≥5:1）
  const scaleRatio = design.buildingToHumanRatio ?? 1;
  if (scaleRatio >= 10) { score += 3; d.push(`巨构尺度比${scaleRatio.toFixed(0)}:1≥10:1`); }
  else if (scaleRatio >= 5) { score += 2; d.push(`巨构尺度比${scaleRatio.toFixed(0)}:1≥5:1`); }
  else if (scaleRatio >= 3) { score += 1; d.push(`尺度比${scaleRatio.toFixed(0)}:1`); }
  else d.push(`尺度比${scaleRatio.toFixed(0)}:1<3:1，无巨构感`);

  // 三段式竖向比例
  if (design.hasThreePartComposition) { score += 2; d.push('三段式竖向构图（台基/屋身/屋顶）'); }
  else d.push('缺少三段式竖向构图');

  // 出檐比例（出檐:柱高 = 1/3~1/2）
  const eaveRatio = design.eaveToColumnRatio;
  if (eaveRatio !== undefined && eaveRatio >= 1/3 && eaveRatio <= 1/2) {
    score += 2; d.push(`出檐比例${eaveRatio.toFixed(2)}在1/3~1/2范围内`);
  } else if (eaveRatio !== undefined) {
    d.push(`出檐比例${eaveRatio.toFixed(2)}偏离1/3~1/2`);
  } else {
    d.push('未指定出檐比例');
  }

  details['proportion'] = d;
  return clamp(score, 0, 10);
}

/** 4. 材料逻辑 */
function scoreMaterial(design, details) {
  let score = 0;
  const d = [];
  const materials = design.materials || [];

  // 天然材料占比（木/石/土/金/纸/砖 ≥70%）
  const naturalTypes = ['wood', 'stone', 'earth', 'brick', 'paper', 'bamboo', 'tile'];
  const naturalCount = materials.filter(m => naturalTypes.includes(m.type)).length;
  const naturalRatio = materials.length > 0 ? naturalCount / materials.length : 0;
  if (naturalRatio >= 0.70) { score += 3; d.push(`天然材料占比${(naturalRatio*100).toFixed(0)}%≥70%`); }
  else if (naturalRatio >= 0.40) { score += 1.5; d.push(`天然材料占比${(naturalRatio*100).toFixed(0)}%`); }
  else d.push(`天然材料占比${(naturalRatio*100).toFixed(0)}%<40%`);

  // 粗糙度（平均roughness ≥0.5）
  const avgRoughness = materials.length > 0
    ? materials.reduce((s, m) => s + (m.roughness ?? 0.5), 0) / materials.length
    : 0.5;
  if (avgRoughness >= 0.6) { score += 3; d.push(`平均粗糙度${avgRoughness.toFixed(2)}≥0.6（哑光）`); }
  else if (avgRoughness >= 0.4) { score += 1.5; d.push(`平均粗糙度${avgRoughness.toFixed(2)}`); }
  else d.push(`平均粗糙度${avgRoughness.toFixed(2)}<0.4（塑料感）`);

  // 包浆/风化痕迹
  if (design.hasPatina) { score += 2; d.push('有包浆/风化痕迹（时间感）'); }
  else d.push('材质全新无风化（缺时间感）');

  // 无塑料感/玻璃感现代合成材质
  const hasPlastic = materials.some(m => m.roughness < 0.3 && m.metalness < 0.1);
  if (!hasPlastic) { score += 2; d.push('无塑料感材质'); }
  else d.push('存在塑料感材质（roughness<0.3且metalness<0.1）');

  details['material'] = d;
  return clamp(score, 0, 10);
}

/** 5. 光影哲学 */
function scoreLightShadow(design, details) {
  let score = 0;
  const d = [];

  // 明暗比（≥3:1得满分）
  const brightnessRatio = design.brightnessRatio ?? 1.5;
  if (brightnessRatio >= 4) { score += 3; d.push(`明暗比${brightnessRatio.toFixed(1)}:1≥4:1`); }
  else if (brightnessRatio >= 3) { score += 2; d.push(`明暗比${brightnessRatio.toFixed(1)}:1≥3:1`); }
  else if (brightnessRatio >= 2) { score += 1; d.push(`明暗比${brightnessRatio.toFixed(1)}:1`); }
  else d.push(`明暗比${brightnessRatio.toFixed(1)}:1<2:1（均匀打光）`);

  // 逆光/侧逆光
  const lightAngle = design.lightAngle ?? 45;
  if (lightAngle >= 90 && lightAngle <= 150) { score += 2; d.push(`侧逆光${lightAngle}°`); }
  else if (lightAngle >= 150) { score += 3; d.push(`逆光${lightAngle}°`); }
  else if (lightAngle >= 60) { score += 1; d.push(`侧光${lightAngle}°`); }
  else d.push(`顺光${lightAngle}°（平）`);

  // 体积光/漏光
  if (design.hasGodRay) { score += 2; d.push('有体积光/漏光（云缝/窗格）'); }
  else d.push('无体积光');

  // 软阴影（无硬边阴影）
  if (design.hasSoftShadow) { score += 2; d.push('软阴影（出檐/遮挡物形成的层次阴影）'); }
  else d.push('硬阴影或缺阴影层次');

  // 暗部有色（非纯黑）
  if (design.darkPartHasColor) { score += 1; d.push('暗部有色（深蓝/深灰，非纯黑）'); }
  else d.push('暗部纯黑（死黑）');

  details['light-shadow'] = d;
  return clamp(score, 0, 10);
}

/** 6. 色彩体系 */
function scoreColor(design, details) {
  let score = 0;
  const d = [];
  const colors = design.colors || [];

  // 平均饱和度（≤50%得满分）
  const avgSat = avgSaturation(colors);
  if (avgSat <= 0.40) { score += 3; d.push(`平均饱和度${(avgSat*100).toFixed(0)}%≤40%（高级）`); }
  else if (avgSat <= 0.50) { score += 2; d.push(`平均饱和度${(avgSat*100).toFixed(0)}%≤50%`); }
  else if (avgSat <= 0.60) { score += 1; d.push(`平均饱和度${(avgSat*100).toFixed(0)}%`); }
  else d.push(`平均饱和度${(avgSat*100).toFixed(0)}%>60%（艳俗）`);

  // 五方正色覆盖（青/赤/黄/白/黑中至少2种）
  const fiveDirections = {
    qing: { hRange: [100, 160], name: '青' },
    chi: { hRange: [0, 20], name: '赤' },
    huang: { hRange: [35, 55], name: '黄' },
    hei: { lMax: 0.15, name: '黑' },
  };
  let covered = 0;
  for (const c of colors) {
    const hsl = hexToHsl(c);
    if (hsl.h >= 100 && hsl.h <= 160 && hsl.s > 0.1) covered |= 1;
    if ((hsl.h <= 20 || hsl.h >= 340) && hsl.s > 0.2) covered |= 2;
    if (hsl.h >= 35 && hsl.h <= 55 && hsl.s > 0.1) covered |= 4;
    if (hsl.l <= 0.15) covered |= 8;
  }
  const coveredCount = covered.toString(2).replace(/0/g, '').length;
  if (coveredCount >= 3) { score += 2; d.push(`五方正色覆盖${coveredCount}种≥3`); }
  else if (coveredCount >= 2) { score += 1; d.push(`五方正色覆盖${coveredCount}种`); }
  else d.push('五方正色覆盖不足2种');

  // 无正红/亮金
  const hasPureRed = colors.some(c => isPureRed(c));
  const hasBrightGold = colors.some(c => isBrightGold(c));
  if (!hasPureRed && !hasBrightGold) { score += 2; d.push('无正红/亮金（用暗朱砂/哑金）'); }
  else {
    if (hasPureRed) d.push('存在正红#FF0000（应用暗朱砂#8B2500）');
    if (hasBrightGold) d.push('存在亮金#FFD700（应用哑金#B8860B）');
  }

  // 君臣佐使比例（主色≥60%，点缀色≤10%）
  if (design.colorHierarchy) {
    const { main, secondary, accent } = design.colorHierarchy;
    if (main >= 0.60 && accent <= 0.10) { score += 2; d.push(`君臣佐使${(main*100).toFixed(0)}/${(secondary*100).toFixed(0)}/${(accent*100).toFixed(0)}`); }
    else d.push('君臣佐使比例失调');
  } else {
    d.push('未指定君臣佐使比例');
  }

  // 暗部有色
  if (colors.some(c => { const hsl = hexToHsl(c); return hsl.l < 0.25 && hsl.s > 0.05; })) {
    score += 1; d.push('暗部有色（非纯黑）');
  }

  details['color'] = d;
  return clamp(score, 0, 10);
}

/** 7. 动势气韵 */
function scoreMotion(design, details) {
  let score = 0;
  const d = [];
  const animations = design.animations || [];

  // 缓慢连续（主动画时长≥3s）
  const hasSlow = animations.some(a => a.duration >= 3000);
  if (hasSlow) { score += 3; d.push('有缓慢连续动效（≥3s）'); }
  else d.push('动效过快（<3s），缺气韵');

  // 自然运动原型（云/水/烟/风/光）
  const naturalMotion = animations.filter(a => ['cloud', 'water', 'smoke', 'wind', 'light', 'fog'].includes(a.type));
  if (naturalMotion.length >= 2) { score += 3; d.push(`${naturalMotion.length}种自然运动原型（云水烟风光）`); }
  else if (naturalMotion.length === 1) { score += 1.5; d.push('1种自然运动原型'); }
  else d.push('无自然运动原型（只有UI动效）');

  // 无bounce/linear廉价动效
  const hasCheap = animations.some(a => ['bounce', 'linear', 'elastic'].includes(a.easing));
  if (!hasCheap) { score += 2; d.push('无bounce/linear廉价动效'); }
  else d.push('存在bounce/linear廉价动效');

  // 动效有呼吸感（循环/往复）
  if (design.hasBreathingMotion) { score += 2; d.push('有呼吸感动效（循环/往复）'); }
  else d.push('无呼吸感动效');

  details['motion'] = d;
  return clamp(score, 0, 10);
}

/** 8. 时间痕迹 */
function scoreTime(design, details) {
  let score = 0;
  const d = [];

  // 风化/包浆
  if (design.hasPatina) { score += 3; d.push('有风化/包浆痕迹'); }
  else d.push('无风化/包浆（全新感）');

  // 昼夜/时间变化
  if (design.hasTimeProgression) { score += 3; d.push('有昼夜/时间变化'); }
  else d.push('无时间变化（固定时刻）');

  // 痕迹（水渍/苔藓/磨损）
  if (design.hasWearTraces) { score += 2; d.push('有使用痕迹（水渍/苔藓/磨损）'); }
  else d.push('无使用痕迹');

  // 非sepia滤镜做旧
  if (!design.usesSepiaFilter) { score += 2; d.push('非sepia滤镜做旧（真实材质风化）'); }
  else d.push('用sepia滤镜假装老旧（假做旧）');

  details['time'] = d;
  return clamp(score, 0, 10);
}

/** 9. 禁忌免疫 */
function scoreTaboo(design, details) {
  let score = 10;
  const d = [];

  // 国潮贴图感（纹样>20%）
  const patternCoverage = design.patternCoverage ?? 0;
  if (patternCoverage > 0.20) { score -= 4; d.push(`纹样占比${(patternCoverage*100).toFixed(0)}%>20%（国潮贴图感）`); }
  else d.push(`纹样占比${(patternCoverage*100).toFixed(0)}%≤20%`);

  // 西方符号
  if (design.hasWesternSymbols) { score -= 4; d.push('存在西方符号（教堂尖顶/哥特窗/霓虹）'); }
  else d.push('无西方符号');

  // 皇家符号滥用
  if (design.hasRoyalAbuse) { score -= 3; d.push('皇家符号滥用（非宫殿用五爪龙/琉璃黄）'); }
  else d.push('无皇家符号滥用');

  // 高饱和色
  const colors = design.colors || [];
  const highSatCount = colors.filter(c => isHighSaturation(c, 0.65)).length;
  if (highSatCount > 0) { score -= 2; d.push(`${highSatCount}个高饱和色（>65%）`); }
  else d.push('无高饱和色');

  // 毛笔字大标题
  if (design.hasBrushTitle) { score -= 1; d.push('毛笔字大标题（可用但不可滥用）'); }

  details['taboo'] = d;
  return clamp(score, 0, 10);
}

/** 10. 交互语义 */
function scoreInteraction(design, details) {
  let score = 0;
  const d = [];
  const interactions = design.interactions || [];

  // 动作→意象映射（鼠标→云/点击→生长/滚动→下潜）
  const semanticMap = {
    mousemove: ['cloud', 'fog', 'ripple', 'disturb'],
    click: ['grow', 'crack', 'light', 'bloom', 'moss'],
    scroll: ['dive', 'swirl', 'penetrate', 'advance'],
    drag: ['rotate', 'open', 'reveal'],
  };
  let semanticCount = 0;
  for (const inter of interactions) {
    const validEffects = semanticMap[inter.trigger] || [];
    if (validEffects.some(e => inter.effect?.includes(e))) semanticCount++;
  }
  if (semanticCount >= 3) { score += 4; d.push(`${semanticCount}种交互有东方意象映射`); }
  else if (semanticCount >= 2) { score += 2; d.push(`${semanticCount}种交互有东方意象映射`); }
  else d.push('交互缺少东方意象映射');

  // 递进式展开（非一次性全显）
  if (design.hasProgressiveReveal) { score += 3; d.push('递进式展开（物我同生）'); }
  else d.push('一次性全显（缺递进感）');

  // 交互有呼吸感/延迟响应
  if (design.hasResponsiveBreath) { score += 2; d.push('交互有呼吸感/延迟响应'); }
  else d.push('交互即时响应（缺呼吸感）');

  // 无按钮式交互（用场景元素交互）
  if (design.sceneElementInteraction) { score += 1; d.push('用场景元素交互（非按钮）'); }

  details['interaction'] = d;
  return clamp(score, 0, 10);
}

/* ==================== 核心测试 ==================== */

/**
 * 结构东方性测试：去掉所有显性中国元素后，设计仍然是东方的吗？
 * 这是"为什么是中国的"和"有没有中国元素"的根本区别。
 */
function runStructuralEasternnessTest(design) {
  const structuralSignals = [];
  let score = 0;

  // 空间结构（不依赖任何表面元素）
  if ((design.voidRatio ?? 0) >= 0.50) { score += 15; structuralSignals.push('留白≥50%'); }
  if (design.hasIncompleteFraming) { score += 10; structuralSignals.push('不完整入画'); }
  if ((design.spatialLayers ?? 0) >= 3) { score += 10; structuralSignals.push('空间层级≥3'); }
  if (design.hasProgression) { score += 10; structuralSignals.push('递进序列'); }

  // 比例结构
  const ratio = design.aspectRatio ?? 1;
  if (isRatioValid(ratio, SQRT2, 0.15) || isRatioValid(ratio, 2.0, 0.15)) {
    score += 10; structuralSignals.push('经典比例（√2或2:1）');
  }
  if ((design.buildingToHumanRatio ?? 1) >= 5) { score += 10; structuralSignals.push('巨构尺度≥5:1'); }

  // 光影结构
  if ((design.brightnessRatio ?? 1) >= 3) { score += 10; structuralSignals.push('明暗比≥3:1'); }
  if ((design.lightAngle ?? 0) >= 90) { score += 5; structuralSignals.push('逆光/侧逆光'); }

  // 色彩结构（不依赖红色/金色）
  const avgSat = avgSaturation(design.colors || []);
  if (avgSat <= 0.50) { score += 10; structuralSignals.push('低饱和≤50%'); }

  // 材质结构
  const materials = design.materials || [];
  const avgRoughness = materials.length > 0
    ? materials.reduce((s, m) => s + (m.roughness ?? 0.5), 0) / materials.length
    : 0.5;
  if (avgRoughness >= 0.5) { score += 5; structuralSignals.push('哑光材质≥0.5'); }

  const pass = score >= 50;
  return {
    score,
    maxScore: 100,
    pass,
    structuralSignals,
    removedElements: ['正红色', '飞檐造型', '毛笔字', '龙纹/祥云纹', '琉璃瓦'],
    conclusion: pass
      ? '去掉所有显性中国元素后，结构东方性仍然成立——这是真正的东方设计'
      : '去掉显性中国元素后失去东方性——当前依赖表面元素而非结构',
  };
}

/* ==================== 辅助函数 ==================== */

function getLevel(score, structuralPass) {
  if (score >= 80 && structuralPass) return 'master';
  if (score >= 60 && structuralPass) return 'authentic';
  if (score >= 60) return 'surface';
  if (score >= 40) return 'western-structure';
  return 'not-chinese';
}

function getLevelDescription(level) {
  return {
    'master': '大师级东方设计——去掉所有中国元素后，结构、比例、光影、气韵仍然是中国的',
    'authentic': '真正的东方设计——有完整的东方空间骨架，不依赖表面元素',
    'surface': '表面中式——有中国元素但结构西方，去掉元素后失去东方性',
    'western-structure': '结构西方——仅靠红色/飞檐等表面元素伪装中式',
    'not-chinese': '不是中国的——无论结构还是元素都缺乏东方特征',
  }[level];
}

function generateCoreAnswer(score, structuralTest, details) {
  if (score >= 80 && structuralTest.pass) {
    return `这个设计是中国的，因为它的空间骨架是中国的——${structuralTest.structuralSignals.slice(0, 3).join('、')}。即使去掉红色、飞檐、毛笔字，它仍然是东方的。`;
  }
  if (score >= 60 && structuralTest.pass) {
    return `这个设计是中国的，主要因为${structuralTest.structuralSignals.slice(0, 2).join('、')}。但部分维度还可以加强，目前有东方骨架但不够极致。`;
  }
  if (score >= 60) {
    return `这个设计看起来是中国的，但主要靠表面元素（红色/飞檐/纹样）支撑。去掉这些元素后，结构东方性不成立——需要加强空间秩序、虚实比例和光影层次。`;
  }
  return `这个设计还不是中国的。当前缺少东方空间骨架——留白不足、比例不对、光影太平。需要从空间秩序和虚实关系开始重建，而不是加中国元素。`;
}

function generateRecommendation(dimKey, score, design, details) {
  const dim = DIMENSIONS[dimKey];
  const weakPoints = (details || []).filter(d => d.includes('缺') || d.includes('不足') || d.includes('偏离') || d.includes('太满') || d.includes('塑料') || d.includes('均匀') || d.includes('艳俗') || d.includes('假') || d.includes('平'));
  return {
    dimension: dim.name,
    currentScore: score,
    targetScore: 7,
    weakPoints: weakPoints.slice(0, 2),
    action: getActionForDimension(dimKey),
  };
}

function getActionForDimension(dimKey) {
  const actions = {
    'spatial-order': '建立明确中轴，增加空间层级到3层以上，添加前→中→后递进序列，加入人物做尺度锚点',
    'void-solid': '将留白提升到60%以上，让至少一个主要元素被画面边缘裁切，增加框景/借景的通透感',
    'proportion': '调整主体宽高比接近√2(1.414)或2:1，建筑与人的尺度比拉到5:1以上，建立三段式竖向构图',
    'material': '增加天然材料（木/石/砖）到70%以上，提高粗糙度到0.6以上，添加风化/包浆痕迹，去除塑料感材质',
    'light-shadow': '将明暗比拉到3:1以上，改用逆光或侧逆光(90-150°)，添加体积光/漏光，暗部用深蓝/深灰而非纯黑',
    'color': '将平均饱和度降到50%以下，用暗朱砂替代正红，用哑金替代亮金，建立君臣佐使70:20:10配色比例',
    'motion': '主动画时长拉到3s以上，使用云/水/烟等自然运动原型，去除bounce/linear，添加呼吸感循环动效',
    'time': '添加材质风化/包浆痕迹，模拟昼夜变化，加入水渍/苔藓等使用痕迹，避免用sepia滤镜假装老旧',
    'taboo': '将传统纹样占比降到20%以下，去除西方符号，检查皇家符号使用场景，降低色彩饱和度',
    'interaction': '建立鼠标→云扰动/点击→生长/滚动→下潜的意象映射，采用递进式展开，添加交互呼吸感',
  };
  return actions[dimKey] || '参考对应维度规则进行优化';
}
