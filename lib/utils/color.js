/**
 * 色彩工具函数
 * 中式美学引擎的基础依赖——所有色彩判定/生成都经过这里
 */

/** HEX → RGB */
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/** RGB → HSL */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100) / 100, l: Math.round(l * 100) / 100 };
}

/** HEX → HSL 快捷函数 */
export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

/** 计算两个 HEX 颜色的感知距离（简化版 CIE76） */
export function colorDistance(hex1, hex2) {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/** 判断颜色是否为高饱和（>60%） */
export function isHighSaturation(hex, threshold = 0.60) {
  return hexToHsl(hex).s > threshold;
}

/** 判断颜色是否为暗色（亮度<30%） */
export function isDark(hex, threshold = 0.30) {
  return hexToHsl(hex).l < threshold;
}

/** 判断颜色是否接近正红（H在0-15或345-360，S>80%，L在40-60%） */
export function isPureRed(hex) {
  const hsl = hexToHsl(hex);
  return (hsl.h <= 15 || hsl.h >= 345) && hsl.s > 0.80 && hsl.l > 0.40 && hsl.l < 0.60;
}

/** 判断颜色是否接近亮金（H在45-55，S>80%，L>50%） */
export function isBrightGold(hex) {
  const hsl = hexToHsl(hex);
  return hsl.h >= 45 && hsl.h <= 55 && hsl.s > 0.80 && hsl.l > 0.50;
}

/** 计算一组颜色的平均饱和度 */
export function avgSaturation(colors) {
  if (!colors || colors.length === 0) return 0;
  return colors.reduce((sum, c) => sum + hexToHsl(c).s, 0) / colors.length;
}

/** 计算一组颜色的平均亮度 */
export function avgLightness(colors) {
  if (!colors || colors.length === 0) return 0;
  return colors.reduce((sum, c) => sum + hexToHsl(c).l, 0) / colors.length;
}
