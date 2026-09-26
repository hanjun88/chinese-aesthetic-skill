/**
 * examples/figma-example.ts — 宋韵风格 DC 计划 → Figma 变量包
 *
 * 运行：npx tsx examples/figma-example.ts
 *
 * 演示：把一份"宋韵淡雅"的东方美学约束（矿物色 / 排版 / 网格 / 光影）
 *       投影为可被 Figma 插件直接导入的 variables / styles / effects 结构。
 */
import {
  planToFigma,
  hexToHsl,
  type FigmaEcosystemPlan,
} from "../plan-to-figma.ts";

const songDynastyPlan: FigmaEcosystemPlan = {
  style: "song-elegant",
  colors: {
    dominant: { name: "月白", hex: "#EDEAE4" },
    secondary: { name: "黛青", hex: "#2C3E50" },
    accent: { name: "朱砂", hex: "#C93B3E" },
    background: { name: "宣纸", hex: "#F5F2EA" },
    shadow: { name: "墨黛", hex: "#1A1A2E" },
  },
  typography: {
    fontFamily: "Songti SC, STSong, serif",
    baseSizePx: 16,
    lineHeight: 1.8,
    letterSpacingPx: 1,
    weights: [
      { name: "regular", weight: 400 },
      { name: "medium", weight: 500 },
      { name: "semibold", weight: 600 },
    ],
  },
  layout: {
    baseUnitPx: 8,
    spacingScale: [1, 2, 3, 4, 6, 8],
    columns: 12,
    gutterPx: 24,
    marginPx: 48,
    negativeSpaceRatio: 0.62,
  },
  effects: {
    shadowSoftnessPx: 10,
    backgroundBlurPx: 12,
    gradient: { from: "#F5F2EA", to: "#EDEAE4", angleDeg: 180 },
  },
};

const figma = planToFigma(songDynastyPlan);

console.log("=== 宋韵 → Figma 变量包 ===");
console.log("变量集合：", figma.variables.map((c) => c.name).join(", "));
console.log(
  "颜色变量数：",
  figma.variables[0].variables.length,
  "| 数值变量数：",
  figma.variables[1].variables.length,
);
console.log("Paint 样式：", figma.styles.paints.map((p) => p.name).join(", "));
console.log("Text 样式：", figma.styles.textStyles.map((t) => `${t.name}(${t.fontWeight})`).join(", "));
console.log("Effect 样式：", figma.effects.map((e) => e.name).join(", "));
console.log("Layout Grid：", figma.layout.grids[0].numberOfColumns, "栏 / gutter", figma.layout.grids[0].gutterSize, "px");
console.log("Auto Layout：", figma.layout.autoLayout[0].layoutMode, "/ spacing", figma.layout.autoLayout[0].itemSpacing, "px");

console.log("\n=== 朱砂 HSL 校验 ===");
console.log("#C93B3E →", hexToHsl("#C93B3E"));

console.log("\n=== 可导入 JSON（截断预览）===");
console.log(JSON.stringify(figma, null, 2).slice(0, 600) + "\n...");
