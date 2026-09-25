# 模块：色彩体系（color）

对应规则：guidelines/color.md | 优先级：P0

## 核心算法

### 五方正色距离计算

```javascript
/**
 * 计算颜色与最近的五方正色的色差（简化版ΔE）
 * @param {string} hex - 十六进制颜色
 * @returns {Object} { nearestColor, distance, inRange }
 */
function calculateFiveColorDistance(hex) {
  const rgb = hexToRgb(hex);
  const FIVE_COLORS = {
    qing:  { name: '青', r: [20, 80],  g: [60, 130], b: [30, 80] },
    chi:   { name: '赤', r: [100, 180], g: [20, 60],  b: [0, 40] },
    huang: { name: '黄', r: [160, 220], g: [130, 180], b: [50, 100] },
    bai:   { name: '白', r: [220, 255], g: [220, 255], b: [210, 245] },
    hei:   { name: '黑', r: [10, 50],   g: [10, 50],   b: [20, 60] }
  };

  let nearest = null;
  let minDist = Infinity;

  for (const [key, color] of Object.entries(FIVE_COLORS)) {
    const centerR = (color.r[0] + color.r[1]) / 2;
    const centerG = (color.g[0] + color.g[1]) / 2;
    const centerB = (color.b[0] + color.b[1]) / 2;
    const dist = Math.sqrt(
      Math.pow(rgb.r - centerR, 2) +
      Math.pow(rgb.g - centerG, 2) +
      Math.pow(rgb.b - centerB, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = { key, ...color };
    }
  }

  // 检查是否在范围内
  const inRange = rgb.r >= nearest.r[0] && rgb.r <= nearest.r[1] &&
                  rgb.g >= nearest.g[0] && rgb.g <= nearest.g[1] &&
                  rgb.b >= nearest.b[0] && rgb.b <= nearest.b[1];

  return { nearestColor: nearest.name, distance: minDist, inRange };
}
```

### 饱和度检测

```javascript
function checkSaturation(hex, maxSaturation = 0.60) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return {
    saturation: hsl.s,
    pass: hsl.s <= maxSaturation,
    violation: hsl.s > maxSaturation ? `饱和度 ${(hsl.s*100).toFixed(0)}% > ${(maxSaturation*100).toFixed(0)}%` : null
  };
}
```

### 禁忌色检测

```javascript
const FORBIDDEN_COLORS = {
  '#FF0000': { name: '正红', replacement: '#8B2500（暗朱砂）' },
  '#FFD700': { name: '亮金', replacement: '#B8860B~#DAA520（哑金）' },
  '#00FF00': { name: '霓虹绿', replacement: '禁止' },
  '#FF00FF': { name: '紫外光', replacement: '禁止' },
  '#00FFFF': { name: '霓虹青', replacement: '禁止' }
};

function checkForbiddenColors(hex) {
  const upper = hex.toUpperCase();
  if (FORBIDDEN_COLORS[upper]) {
    return { forbidden: true, ...FORBIDDEN_COLORS[upper] };
  }
  // 检测高饱和高明度（霓虹色特征）
  const hsl = rgbToHsl(...Object.values(hexToRgb(hex)));
  if (hsl.s > 0.8 && hsl.l > 0.5) {
    return { forbidden: true, name: '疑似霓虹色', replacement: '降低饱和度至≤50%' };
  }
  return { forbidden: false };
}
```

## 已验证配色方案

| 方案 | 主色 | 辅色 | 点缀 | 适用场景 |
|---|---|---|---|---|
| 宋韵清雅 | 月白 #E8E4D9 (60%) | 黛青 #2C3E50 (25%) | 古金 #B8860B (5%) | ACT0云海+单门 |
| 宫墙朱门 | 暗朱砂 #8B2500 (50%) | 墨灰 #2C2C2C (30%) | 哑金 #DAA520 (10%) | 宫殿/红墙 |
| 青绿山水 | 石青 #0D47A1+石绿 #1B5E20 (50%) | 月白 #E8E4D9 (40%) | 赭黄 #C4A35A (5%) | 山水/自然 |
| 国色单色 | 石绿 #558B2F (85%) | 深色人物 (10%) | - (5%) | 人物肖像 |
| 红金绿 | 暗朱砂 #8B2500 (50%) | 石绿 #2E7D32 (30%) | 哑金 #B8860B (10%) | 华丽/国画 |
| 紫金东方 | 深紫 #4A148C (60%) | 哑金 #DAA520 (15%) | - | 品牌/商业 |

## 校验函数

```javascript
function checkColor(design) {
  const violations = [];
  for (const color of design.colors || []) {
    const sat = checkSaturation(color);
    if (!sat.pass) violations.push({ severity: 'P0', message: sat.violation, color });

    const forbidden = checkForbiddenColors(color);
    if (forbidden.forbidden) violations.push({ severity: 'P0', message: `禁止使用${forbidden.name} ${color}，应用${forbidden.replacement}`, color });

    const fiveColor = calculateFiveColorDistance(color);
    if (!fiveColor.inRange && fiveColor.distance > 50) {
      violations.push({ severity: 'P1', message: `颜色 ${color} 偏离五方正色（最近：${fiveColor.nearestColor}，距离：${fiveColor.distance.toFixed(0)}）` });
    }
  }
  if ((design.colors || []).length > 3) {
    violations.push({ severity: 'P1', message: `主色数量 ${design.colors.length} > 3，建议≤2主色+1点缀` });
  }
  return violations;
}
```

---

## 素材库实证（Distillation Evidence）

> 数据来源：`../distillation/` 4批素材，关联索引见 `evidence-index.md`

### 实证参数表（已验证推荐值）

| 参数 | 推荐值 | 实证来源 | 样本量 |
|---|---|---|---|
| 主色数量 | ≤2主色+1点缀 | ai-linggan, xiaoai | 26视频 |
| 点缀色面积比 | ≤15% | xiaoai | 11视频 |
| 饱和度上限 | ≤0.46（均值0.406） | ai-linggan | 15视频 |
| 对比度范围 | 8.2–12.5（均值9.89） | ai-linggan | 15视频 |
| 色温倾向 | 冷调主导（冷9/暖6） | ai-linggan | 15视频 |

### 五方正色实证分布（ai-linggan 15视频）

| 正色 | 占比 | 说明 |
|---|---|---|
| 青 | 28.0% | 主导色，`#2c4a5e`青灰蓝 |
| 黑 | 24.8% | 深蓝黑近黑，`#1b2a44` |
| 白 | 19.9% | 月白云雾，`#e9eef7` |
| 黄 | 17.4% | 赭金偏黄，`#d89048` |
| 赤 | 9.9% | **极度压制**，仅小面积点缀 |

> 核心发现：Ai灵感主义风格刻意压制赤色（仅9.9%），用青黑白营造冷调仙境感，赭金作为唯一暖色点缀。这与传统"朱红为尊"的国风俗套形成鲜明对比，是反AI国风感的关键识别特征。

### 白底编辑级美学（xiaoai 11视频）

- 11/11共享 `#FFFFFF` paper-white基底
- 8/11纯`#FFFFFF`，2/11浅灰`#F2F2F2`/`#E9E9EC`
- 主文字`#1A1A1A`（7/11），次要`#888888`
- 10/11为6500K中性日光白
- 唯一暗色例外：视频04黑洞（`#000000`+金色辉光bloom 1.8）
- 0个页面级渐变（渐变仅用于粒子尾迹和接触阴影）

### 可复用配色方案（从素材蒸馏）

**方案A：青灰仙境（ai-linggan主导）**
```json
{
  "primary": "#2c4a5e",
  "secondary": "#e9eef7",
  "accent": "#d89048",
  "background": "#1b2a44",
  "text": "#e9eef7",
  "saturation": 0.406,
  "contrast": 9.89
}
```

**方案B：编辑画廊（xiaoai主导）**
```json
{
  "primary": "#1A1A1A",
  "secondary": "#888888",
  "accent": "<15% area, low-saturation pastel>",
  "background": "#FFFFFF",
  "text": "#1A1A1A",
  "color_temp_k": 6500,
  "page_gradient": false
}
```
