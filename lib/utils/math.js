/**
 * 数学工具函数
 * 比例计算、区间映射、阈值判定
 */

/** √2 常量 — 方五斜七的核心比例 */
export const SQRT2 = Math.SQRT2; // ≈1.4142

/** 经典比例库（来自唐代建筑蒸馏 + 博主验证） */
export const CLASSIC_RATIOS = {
  'sqrt2': { value: SQRT2, name: '方五斜七', source: '佛光寺/营造法式' },
  '7:5': { value: 1.4, name: '七比五', source: '王南古建研究' },
  '2:1': { value: 2.0, name: '二比一', source: '佛光寺东大殿面阔:进深' },
  '3:2': { value: 1.5, name: '三比二', source: '常见开间比例' },
  'golden': { value: 1.618, name: '黄金比例', source: '西方（非中式首选）' },
};

/** 三段式竖向比例（台基:屋身:屋顶） */
export const THREE_PART_RATIOS = {
  'tang-palace': { base: 1, body: 2, roof: 1.5, name: '唐代宫殿' },
  'song-residence': { base: 1, body: 3, roof: 1, name: '宋代民居' },
  'ming-palace': { base: 1.2, body: 2.5, roof: 1.3, name: '明清宫殿' },
  'minimal': { base: 0.8, body: 3.5, roof: 0.7, name: '极简东方' },
};

/** 计算比例偏差百分比 */
export function ratioDeviation(actual, target) {
  return Math.abs(actual - target) / target;
}

/** 判断比例是否在容差范围内 */
export function isRatioValid(actual, target, tolerance = 0.10) {
  return ratioDeviation(actual, target) <= tolerance;
}

/** 找到最接近的经典比例 */
export function closestClassicRatio(actual) {
  let best = null, minDev = Infinity;
  for (const [key, ratio] of Object.entries(CLASSIC_RATIOS)) {
    const dev = ratioDeviation(actual, ratio.value);
    if (dev < minDev) { minDev = dev; best = { key, ...ratio, deviation: dev }; }
  }
  return best;
}

/** 数值钳制 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** 线性插值 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** 区间映射：把 value 从 [inMin, inMax] 映射到 [outMin, outMax] */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

/** 计算面积占比 */
export function areaRatio(elementArea, totalArea) {
  return totalArea > 0 ? elementArea / totalArea : 0;
}

/** 计算尺度比（大/小） */
export function scaleRatio(large, small) {
  return small > 0 ? large / small : Infinity;
}
