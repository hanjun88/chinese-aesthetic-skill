/**
 * proportion-engine.js — 比例校验与生成器
 *
 * 经典比例库（来自唐代建筑蒸馏 + 博主验证）：
 * - 方五斜七 √2 (1.414) — 佛光寺/营造法式
 * - 7:5 (1.4) — 王南古建研究
 * - 2:1 — 佛光寺东大殿面阔:进深
 * - 三段式 台基:屋身:屋顶 = 1:2:1 ~ 1:3:1.5
 * - 出檐:柱高 = 1/3 ~ 1/2
 * - 斗拱:柱高 = 1/3 ~ 1/2
 * - 巨构 建筑:人 ≥ 5:1（推荐10:1~20:1）
 * - 人物占画面 ≤5%
 * - 留白 ≥60%
 */

import { SQRT2, CLASSIC_RATIOS, THREE_PART_RATIOS, ratioDeviation, isRatioValid, closestClassicRatio, clamp } from './utils/math.js';

/**
 * 校验建筑比例
 * @param {Object} params - 尺寸参数
 * @returns {Object} 校验结果
 */
export function validateProportions(params = {}) {
  const results = {};
  const violations = [];

  // 1. 面阔:进深
  if (params.width && params.depth) {
    const ratio = params.width / params.depth;
    const closest = closestClassicRatio(ratio);
    const valid = isRatioValid(ratio, closest.value, 0.15);
    results['width-depth'] = {
      ratio,
      closestClassic: closest,
      valid,
      deviation: ratioDeviation(ratio, closest.value),
      recommendation: valid ? null : `建议调整为接近 ${closest.name} (${closest.value.toFixed(3)})，当前偏差 ${(ratioDeviation(ratio, closest.value) * 100).toFixed(0)}%`,
    };
    if (!valid) violations.push({ rule: 'width-depth', severity: 'P1', ...results['width-depth'] });
  }

  // 2. 高宽比
  if (params.height && params.width) {
    const ratio = params.height / params.width;
    const valid = ratio >= 0.3 && ratio <= 0.8; // 中国古建普遍扁宽
    results['height-width'] = {
      ratio,
      valid,
      recommendation: valid ? null : `中国古建高宽比通常在0.3-0.8之间（扁宽），当前${ratio.toFixed(2)}`,
    };
    if (!valid) violations.push({ rule: 'height-width', severity: 'P1', ...results['height-width'] });
  }

  // 3. 出檐:柱高
  if (params.eave && params.columnHeight) {
    const ratio = params.eave / params.columnHeight;
    const valid = ratio >= 1/3 && ratio <= 1/2;
    results['eave-column'] = {
      ratio,
      valid,
      range: '1/3 ~ 1/2',
      recommendation: valid ? null : `出檐:柱高应在1/3~1/2之间，当前${ratio.toFixed(2)}`,
    };
    if (!valid) violations.push({ rule: 'eave-column', severity: 'P1', ...results['eave-column'] });
  }

  // 4. 斗拱:柱高
  if (params.dougong && params.columnHeight) {
    const ratio = params.dougong / params.columnHeight;
    const valid = ratio >= 1/3 && ratio <= 1/2;
    results['dougong-column'] = {
      ratio,
      valid,
      range: '1/3 ~ 1/2',
      recommendation: valid ? null : `斗拱:柱高应在1/3~1/2之间，当前${ratio.toFixed(2)}`,
    };
    if (!valid) violations.push({ rule: 'dougong-column', severity: 'P2', ...results['dougong-column'] });
  }

  // 5. 巨构尺度（建筑:人）
  if (params.buildingHeight && params.humanHeight) {
    const ratio = params.buildingHeight / params.humanHeight;
    const level = ratio >= 15 ? '巨构' : ratio >= 8 ? '宏大' : ratio >= 5 ? '标准' : '亲近';
    const valid = ratio >= 5;
    results['building-human'] = {
      ratio,
      level,
      valid,
      recommendation: valid ? null : `巨构感需要建筑:人≥5:1，当前${ratio.toFixed(1)}:1，建议拉到5:1以上`,
    };
    if (!valid) violations.push({ rule: 'building-human', severity: 'P1', ...results['building-human'] });
  }

  // 6. 人物占画面
  if (params.humanArea && params.totalArea) {
    const ratio = params.humanArea / params.totalArea;
    const valid = ratio <= 0.05;
    results['human-area'] = {
      ratio,
      valid,
      max: 0.05,
      recommendation: valid ? null : `人物占画面应≤5%，当前${(ratio * 100).toFixed(1)}%`,
    };
    if (!valid) violations.push({ rule: 'human-area', severity: 'P1', ...results['human-area'] });
  }

  // 7. 留白比例
  if (params.voidRatio !== undefined) {
    const valid = params.voidRatio >= 0.60;
    results['void-ratio'] = {
      ratio: params.voidRatio,
      valid,
      min: 0.60,
      recommendation: valid ? null : `留白应≥60%，当前${(params.voidRatio * 100).toFixed(0)}%`,
    };
    if (!valid) violations.push({ rule: 'void-ratio', severity: 'P0', ...results['void-ratio'] });
  }

  // 8. 三段式竖向比例
  if (params.threePart) {
    const { base, body, roof } = params.threePart;
    const total = base + body + roof;
    const baseR = base / total;
    const bodyR = body / total;
    const roofR = roof / total;
    const valid = baseR >= 0.15 && baseR <= 0.30 && bodyR >= 0.40 && bodyR <= 0.60 && roofR >= 0.15 && roofR <= 0.35;
    results['three-part'] = {
      ratios: { base: baseR, body: bodyR, roof: roofR },
      valid,
      recommendation: valid ? null : `三段式比例建议 台基15-30% / 屋身40-60% / 屋顶15-35%`,
    };
    if (!valid) violations.push({ rule: 'three-part', severity: 'P1', ...results['three-part'] });
  }

  const p0Count = violations.filter(v => v.severity === 'P0').length;
  const p1Count = violations.filter(v => v.severity === 'P1').length;

  return {
    results,
    violations,
    pass: p0Count === 0,
    p0Count,
    p1Count,
    score: clamp(10 - violations.length * 0.5, 0, 10),
  };
}

/**
 * 根据场景类型生成推荐比例
 */
export function generateRecommendedProportions(sceneType = 'residence') {
  const presets = {
    palace: {
      name: '宫殿',
      widthDepth: 2.0,
      heightWidth: 0.4,
      eaveColumn: 0.45,
      dougongColumn: 0.45,
      buildingHuman: 15,
      threePart: { base: 1, body: 2, roof: 1.5 },
      voidRatio: 0.40,
    },
    temple: {
      name: '寺庙',
      widthDepth: 1.8,
      heightWidth: 0.45,
      eaveColumn: 0.40,
      dougongColumn: 0.40,
      buildingHuman: 12,
      threePart: { base: 1, body: 2, roof: 1.5 },
      voidRatio: 0.50,
    },
    residence: {
      name: '民居',
      widthDepth: 1.5,
      heightWidth: 0.5,
      eaveColumn: 0.35,
      dougongColumn: 0.30,
      buildingHuman: 6,
      threePart: { base: 1, body: 3, roof: 1 },
      voidRatio: 0.55,
    },
    landscape: {
      name: '山水',
      widthDepth: 1.414,
      heightWidth: 0.3,
      eaveColumn: 0.30,
      dougongColumn: 0.25,
      buildingHuman: 20,
      threePart: { base: 0.8, body: 3.5, roof: 0.7 },
      voidRatio: 0.70,
    },
    'act0-cloud-gate': {
      name: 'ACT0云海单门',
      widthDepth: 1.414,
      heightWidth: 0.35,
      eaveColumn: 0.40,
      dougongColumn: 0.35,
      buildingHuman: 10,
      threePart: { base: 0.8, body: 3, roof: 1.2 },
      voidRatio: 0.65,
    },
  };

  return presets[sceneType] || presets['residence'];
}

/** 获取所有经典比例 */
export function listClassicRatios() {
  return Object.entries(CLASSIC_RATIOS).map(([key, r]) => ({
    key,
    name: r.name,
    value: r.value,
    source: r.source,
  }));
}

/** 获取所有三段式比例 */
export function listThreePartRatios() {
  return Object.entries(THREE_PART_RATIOS).map(([key, r]) => ({
    key,
    name: r.name,
    base: r.base,
    body: r.body,
    roof: r.roof,
  }));
}
