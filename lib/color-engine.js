/**
 * color-engine.js — 色彩决策器
 *
 * 输入场景类型/情绪/时间，自动输出：
 * - 五方正色选择（青/赤/黄/白/黑）
 * - 君臣佐使70:20:10配色比例
 * - 具体HEX色值（基于45个博主验证色值 + 传统色体系）
 * - 色彩禁忌检测
 *
 * 核心原则：低饱和（≤50%）、暗部有色、金只做点缀（≤10%）、不用正红亮金。
 */

import { hexToHsl, isHighSaturation, isPureRed, isBrightGold, avgSaturation } from './utils/color.js';
import { clamp } from './utils/math.js';

/** 五方正色色板（低饱和传统色，非正红亮金） */
export const FIVE_DIRECTION_COLORS = {
  qing: {
    name: '青',
    direction: '东',
    element: '木',
    shades: [
      { name: '石青', hex: '#2E5C5A', hsl: { h: 177, s: 0.33, l: 0.27 } },
      { name: '黛青', hex: '#2C3E50', hsl: { h: 210, s: 0.29, l: 0.24 } },
      { name: '竹青', hex: '#5B7B5E', hsl: { h: 126, s: 0.15, l: 0.42 } },
      { name: '靛蓝', hex: '#1B3A5C', hsl: { h: 210, s: 0.54, l: 0.23 } },
    ],
  },
  chi: {
    name: '赤',
    direction: '南',
    element: '火',
    shades: [
      { name: '暗朱砂', hex: '#8B2500', hsl: { h: 16, s: 1.0, l: 0.27 } },
      { name: '赭石', hex: '#8B4513', hsl: { h: 25, s: 0.75, l: 0.31 } },
      { name: '胭脂', hex: '#9D2933', hsl: { h: 355, s: 0.59, l: 0.39 } },
      { name: '绛红', hex: '#722F37', hsl: { h: 352, s: 0.42, l: 0.32 } },
    ],
  },
  huang: {
    name: '黄',
    direction: '中',
    element: '土',
    shades: [
      { name: '藤黄', hex: '#C4A35A', hsl: { h: 42, s: 0.47, l: 0.56 } },
      { name: '赭黄', hex: '#A67C52', hsl: { h: 28, s: 0.33, l: 0.49 } },
      { name: '米黄', hex: '#E8DCC4', hsl: { h: 40, s: 0.42, l: 0.84 } },
      { name: '秋香', hex: '#9B8B3A', hsl: { h: 51, s: 0.45, l: 0.42 } },
    ],
  },
  bai: {
    name: '白',
    direction: '西',
    element: '金',
    shades: [
      { name: '月白', hex: '#E8E4D9', hsl: { h: 43, s: 0.24, l: 0.88 } },
      { name: '玉白', hex: '#F0EBE3', hsl: { h: 38, s: 0.31, l: 0.92 } },
      { name: '缟白', hex: '#F5F2EC', hsl: { h: 40, s: 0.25, l: 0.94 } },
      { name: '霜白', hex: '#EDEAE4', hsl: { h: 42, s: 0.14, l: 0.91 } },
    ],
  },
  hei: {
    name: '黑',
    direction: '北',
    element: '水',
    shades: [
      { name: '墨黑', hex: '#1A1A2E', hsl: { h: 240, s: 0.28, l: 0.14 } },
      { name: '黛蓝', hex: '#1B2A4A', hsl: { h: 220, s: 0.46, l: 0.19 } },
      { name: '玄色', hex: '#1C1C1C', hsl: { h: 0, s: 0, l: 0.11 } },
      { name: '黛紫', hex: '#2D1B4A', hsl: { h: 263, s: 0.46, l: 0.19 } },
    ],
  },
};

/** 点缀色（金/银/铜，仅≤10%面积使用） */
export const ACCENT_COLORS = {
  gold: {
    name: '哑金',
    hex: '#B8860B',
    hsl: { h: 43, s: 0.88, l: 0.38 },
    maxArea: 0.10,
    note: '金只做线/点/光，配深色底才发光，禁止大面积使用',
  },
  bronze: {
    name: '青铜',
    hex: '#6B5B4E',
    hsl: { h: 28, s: 0.15, l: 0.36 },
    maxArea: 0.15,
  },
  silver: {
    name: '亚银',
    hex: '#A8A8A8',
    hsl: { h: 0, s: 0, l: 0.66 },
    maxArea: 0.10,
  },
};

/** 场景配色方案预设 */
const COLOR_PRESETS = {
  'palace-day': {
    name: '宫殿·昼',
    mood: '庄重/威严',
    main: { direction: 'chi', shade: '暗朱砂', hex: '#8B2500' },
    secondary: { direction: 'huang', shade: '藤黄', hex: '#C4A35A' },
    accent: { name: '哑金', hex: '#B8860B' },
    bg: { direction: 'hei', shade: '墨黑', hex: '#1A1A2E' },
    ratio: { main: 0.50, secondary: 0.30, accent: 0.05, bg: 0.15 },
  },
  'temple-dawn': {
    name: '寺庙·晨',
    mood: '静谧/空灵',
    main: { direction: 'qing', shade: '黛青', hex: '#2C3E50' },
    secondary: { direction: 'bai', shade: '月白', hex: '#E8E4D9' },
    accent: { name: '哑金', hex: '#B8860B' },
    bg: { direction: 'bai', shade: '霜白', hex: '#EDEAE4' },
    ratio: { main: 0.25, secondary: 0.15, accent: 0.03, bg: 0.57 },
  },
  'residence-dusk': {
    name: '民居·昏',
    mood: '温暖/质朴',
    main: { direction: 'chi', shade: '赭石', hex: '#8B4513' },
    secondary: { direction: 'huang', shade: '米黄', hex: '#E8DCC4' },
    accent: { name: '青铜', hex: '#6B5B4E' },
    bg: { direction: 'hei', shade: '黛蓝', hex: '#1B2A4A' },
    ratio: { main: 0.30, secondary: 0.25, accent: 0.05, bg: 0.40 },
  },
  'landscape-night': {
    name: '山水·夜',
    mood: '幽深/意境',
    main: { direction: 'hei', shade: '黛蓝', hex: '#1B2A4A' },
    secondary: { direction: 'qing', shade: '石青', hex: '#2E5C5A' },
    accent: { name: '哑金', hex: '#B8860B' },
    bg: { direction: 'hei', shade: '墨黑', hex: '#1A1A2E' },
    ratio: { main: 0.35, secondary: 0.20, accent: 0.02, bg: 0.43 },
  },
  'act0-cloud-gate': {
    name: 'ACT0云海单门',
    mood: '缥缈/神秘/东方意境',
    main: { direction: 'bai', shade: '月白', hex: '#E8E4D9' },
    secondary: { direction: 'qing', shade: '黛青', hex: '#2C3E50' },
    accent: { name: '哑金', hex: '#B8860B' },
    bg: { direction: 'qing', shade: '靛蓝', hex: '#1B3A5C' },
    ratio: { main: 0.45, secondary: 0.20, accent: 0.03, bg: 0.32 },
  },
  'song-minimal': {
    name: '宋韵极简',
    mood: '清雅/克制/高级',
    main: { direction: 'bai', shade: '玉白', hex: '#F0EBE3' },
    secondary: { direction: 'hei', shade: '墨黑', hex: '#1A1A2E' },
    accent: { name: '哑金', hex: '#B8860B' },
    bg: { direction: 'bai', shade: '缟白', hex: '#F5F2EC' },
    ratio: { main: 0.30, secondary: 0.10, accent: 0.02, bg: 0.58 },
  },
};

/**
 * 主入口：生成配色方案
 * @param {Object} params - 场景参数
 * @returns {Object} 配色方案
 */
export function generateColorScheme(params = {}) {
  const preset = COLOR_PRESETS[params.preset] || COLOR_PRESETS[params.sceneType] || COLOR_PRESETS['song-minimal'];

  const scheme = {
    preset: params.preset || params.sceneType || 'song-minimal',
    presetName: preset.name,
    mood: preset.mood,
    colors: {
      main: { ...preset.main, role: '君（主色定调）' },
      secondary: { ...preset.secondary, role: '臣（辅色稳场）' },
      accent: { ...preset.accent, role: '佐使（点缀提神）' },
      background: { ...preset.bg, role: '背景' },
    },
    ratio: {
      ...preset.ratio,
      description: `君臣佐使 — 主色${(preset.ratio.main * 100).toFixed(0)}% / 辅色${(preset.ratio.secondary * 100).toFixed(0)}% / 点缀${(preset.ratio.accent * 100).toFixed(0)}% / 背景${(preset.ratio.bg * 100).toFixed(0)}%`,
    },
    palette: [preset.main.hex, preset.secondary.hex, preset.accent.hex, preset.bg.hex],
  };

  // 校验配色
  const validation = validateColorScheme(scheme.palette, scheme.ratio);
  scheme.validation = validation;
  scheme.pass = validation.pass;

  // 生成CSS变量
  scheme.cssVariables = generateCSSVariables(scheme);

  return scheme;
}

/**
 * 校验配色方案是否符合中式美学规则
 */
export function validateColorScheme(colors = [], ratio = {}) {
  const violations = [];
  let score = 10;

  // 1. 平均饱和度 ≤50%
  const avgSat = avgSaturation(colors);
  if (avgSat > 0.60) {
    violations.push({ rule: 'saturation', severity: 'P0', message: `平均饱和度${(avgSat * 100).toFixed(0)}%>60%（艳俗）`, fix: '降到50%以下' });
    score -= 4;
  } else if (avgSat > 0.50) {
    violations.push({ rule: 'saturation', severity: 'P1', message: `平均饱和度${(avgSat * 100).toFixed(0)}%>50%`, fix: '降到50%以下' });
    score -= 2;
  }

  // 2. 无正红
  const pureRed = colors.find(c => isPureRed(c));
  if (pureRed) {
    violations.push({ rule: 'pure-red', severity: 'P0', message: `使用正红${pureRed}`, fix: '用暗朱砂#8B2500替代' });
    score -= 3;
  }

  // 3. 无亮金
  const brightGold = colors.find(c => isBrightGold(c));
  if (brightGold) {
    violations.push({ rule: 'bright-gold', severity: 'P0', message: `使用亮金${brightGold}`, fix: '用哑金#B8860B替代' });
    score -= 3;
  }

  // 4. 点缀色面积 ≤10%
  if (ratio.accent && ratio.accent > 0.10) {
    violations.push({ rule: 'accent-area', severity: 'P1', message: `点缀色占比${(ratio.accent * 100).toFixed(0)}%>10%`, fix: '降到10%以下，金只做线/点/光' });
    score -= 2;
  }

  // 5. 主色面积 ≥50%（君臣佐使）
  if (ratio.main && ratio.main < 0.40) {
    violations.push({ rule: 'main-area', severity: 'P1', message: `主色占比${(ratio.main * 100).toFixed(0)}%<40%（配色无主次）`, fix: '主色提升到50%以上' });
    score -= 2;
  }

  // 6. 暗部有色（非纯黑）
  const hasPureBlack = colors.some(c => { const hsl = hexToHsl(c); return hsl.l < 0.05 && hsl.s < 0.05; });
  if (hasPureBlack) {
    violations.push({ rule: 'pure-black', severity: 'P1', message: '暗部纯黑#000000（死黑）', fix: '用墨黑#1A1A2E或黛蓝#1B2A4A' });
    score -= 1;
  }

  return {
    score: clamp(score, 0, 10),
    pass: violations.filter(v => v.severity === 'P0').length === 0,
    avgSaturation: avgSat,
    violations,
    p0Count: violations.filter(v => v.severity === 'P0').length,
    p1Count: violations.filter(v => v.severity === 'P1').length,
  };
}

/** 生成CSS变量 */
function generateCSSVariables(scheme) {
  return `:root {
  /* 君（主色定调）— ${scheme.colors.main.name || scheme.colors.main.direction} */
  --color-main: ${scheme.colors.main.hex};
  /* 臣（辅色稳场）— ${scheme.colors.secondary.name || scheme.colors.secondary.direction} */
  --color-secondary: ${scheme.colors.secondary.hex};
  /* 佐使（点缀提神）— ${scheme.colors.accent.name} */
  --color-accent: ${scheme.colors.accent.hex};
  /* 背景 */
  --color-bg: ${scheme.colors.background.hex};
  /* 君臣佐使比例 */
  --ratio-main: ${(scheme.ratio.main * 100).toFixed(0)}%;
  --ratio-secondary: ${(scheme.ratio.secondary * 100).toFixed(0)}%;
  --ratio-accent: ${(scheme.ratio.accent * 100).toFixed(0)}%;
}`;
}

/** 获取所有可用预设 */
export function listPresets() {
  return Object.entries(COLOR_PRESETS).map(([key, p]) => ({
    key,
    name: p.name,
    mood: p.mood,
    colors: [p.main.hex, p.secondary.hex, p.accent.hex, p.bg.hex],
  }));
}
