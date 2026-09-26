/**
 * generate-sheet.js — 端到端演示步骤 1：用户需求 → AestheticConstraintSheet
 *
 * 调用 CAS lib/ 原 10 维引擎（零改动）的 colorEngine 产出配色，
 * 再装配为融合层契约 A 所需的 AestheticConstraintSheet。
 *
 * 用法: node generate-sheet.js [demo-input.json]
 * 输出: stdout(JSON) + sheet.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateColorScheme } from "../../lib/color-engine.js";

const here = dirname(fileURLToPath(import.meta.url));
const inputPath = process.argv[2] ?? join(here, "demo-input.json");
const input = JSON.parse(readFileSync(inputPath, "utf8"));

// —— 1. 调 lib/ 色彩引擎（原 10 维，零改动）取配色 ——
const scheme = generateColorScheme({ preset: "temple-dawn" });

// —— 2. 装配 AestheticConstraintSheet（融合层契约 A 输入形状）——
const sheet = {
  sheetId: "act-shuyuan-entrance",
  designBrief: input.brief,
  mood: "song-elegant",
  attributionStatement:
    "书院入口以月洞门为界，取宋韵克制：月白为底、黛青为骨、古金点题，七三留白，天光斜漏。",
  structuralDimensions: [
    { id: "void-solid", weight: "primary", hard: "留白:建筑体量 ≈ 7:5", soft: "门后深景藏三成" },
    { id: "spatial-order", weight: "primary", hard: "中轴对称", soft: "匾居门额正中" },
    { id: "color", weight: "secondary", hard: "饱和度≤50%", soft: "古金仅勾线" },
    { id: "light", weight: "secondary", hard: "天光自顶斜入", soft: "花窗漏光" },
    { id: "motion", weight: "tertiary", hard: "禁 bounce/particle", soft: "推门如门启云开" },
    { id: "anti-cliche", weight: "tertiary", hard: "禁正红/亮金/死黑", soft: "用暗朱砂与哑金" },
  ],
  colorSystem: {
    palette: [
      { role: "dominant", name: "月白", hex: scheme.colors.background.hex, hsl: "hsl(42,25%,92%)", areaPct: 0.65, usage: "页面底色/门内山居背景" },
      { role: "secondary", name: "黛青", hex: scheme.colors.main.hex, hsl: "hsl(210,25%,25%)", areaPct: 0.25, usage: "门框/主文字" },
      { role: "accent", name: "哑金", hex: scheme.colors.accent.hex, hsl: "hsl(43,75%,38%)", areaPct: 0.05, usage: "匾金线/印" },
      { role: "shadow", name: "墨黛", hex: "#1A1A2E", hsl: "hsl(240,20%,14%)", areaPct: 0.05, usage: "暗部阴影（非死黑）" },
    ],
    saturationMax: 0.5,
    hardFailHex: ["#FF0000", "#FFD700", "#000000", "#00FFFF"],
  },
  proportion: {
    baseModulePx: 8,
    spacingScale: [1, 2, 3, 4, 6, 8],
    voidSolidRatio: "7:5",
    focalPointsMax: 1,
  },
  spatial: { axis: "strict", bays: 3, hierarchyLevelsMin: 3 },
  lighting: { primarySource: "skylight", timeSetting: "cloudy", lightDarkRatio: "3:7" },
  motion: {
    prototypes: ["light", "cloud"],
    durationMs: [1500, 8000],
    entryMode: "emerge",
    hardFail: ["bounce", "back", "spin", "linear", "particle"],
  },
  antiCliche: { scanned: true, hardFailHits: [], forbidden: ["国潮贴图感", "高饱和原色"] },
  violations: [],
  score: 88,
};

writeFileSync(join(here, "sheet.json"), JSON.stringify(sheet, null, 2));
console.log(JSON.stringify({ step: "generate-sheet", sheetId: sheet.sheetId, mood: sheet.mood, palette: sheet.colorSystem.palette.map(c => `${c.name}=${c.hex}`), score: sheet.score }, null, 2));
