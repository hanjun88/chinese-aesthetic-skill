/**
 * code-reviewer.ts — 契约 C 的反俗套 lint 审查器
 *
 * 对生成的前端代码（HTML/CSS/JS 文本，或结构化 DomComponentPlan）做
 * **静态**反序列化信号提取与反俗套规则审查。等价于浏览器端
 * computed style / animation / 覆盖面积采样，但纯函数、无 DOM、可单测。
 *
 * 规则三族（见 docs/fusion-architecture.md §2.3 采样手段与 architecture.md §9）：
 *   - 色彩规则：违禁 hex、饱和度 S<=0.5 铁律、主色占比<=70%、色温偏差；
 *   - 动势规则：违禁缓动关键字、动画时长越界、呼吸循环缺失；
 *   - 构图规则：留白比越界、视觉焦点超限。
 *
 * @module modules/frontend/runtime/code-reviewer
 */

import type { AestheticConstraintSheet } from "./types/aesthetic-sheet.ts";
import type { DomComponentPlan } from "./types/dom-component-plan.ts";
import type { RuleViolation, AntiClicheCategory } from "./types/aesthetic-evaluation-report.ts";

/* ------------------------------------------------------------------ *
 * 输入形状
 * ------------------------------------------------------------------ */

/**
 * 待审查的渲染产物。文本与结构化计划二选一或并用：
 *   - css/js：生成产物的样式与脚本文本（正则 grep 违禁色/缓动）；
 *   - plan：契约 B 产出的 DomComponentPlan（结构化读 cssVars / motion / 留白）。
 */
export interface RenderedCode {
  html?: string;
  css?: string;
  js?: string;
  /** 契约 B 结构化产物（可选，提供更精确的留白/动势信号） */
  plan?: DomComponentPlan;
}

/* ------------------------------------------------------------------ *
 * 颜色工具（纯函数，无依赖）
 * ------------------------------------------------------------------ */

/** HSL（h:0..360, s:0..1, l:0..1） */
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** 归一化 hex（小写，#rrggbb）。非法输入返回 null。 */
export function normalizeHex(hex: string): string | null {
  let h = hex.trim().toLowerCase();
  if (!h.startsWith("#")) return null;
  h = h.slice(1);
  if (/^[0-9a-f]{3}$/.test(h)) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return "#" + h;
}

/** hex → HSL（s/l 为 0..1）。非法 hex 返回 null。 */
export function hexToHsl(hex: string): Hsl | null {
  const norm = normalizeHex(hex);
  if (!norm) return null;
  const n = parseInt(norm.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d) + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return { h, s, l };
}

/** 环形色相距离（0..180） */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/* ------------------------------------------------------------------ *
 * 信号提取
 * ------------------------------------------------------------------ */

/** 提取出的全部反序列化信号 */
export interface ExtractedSignals {
  /** 出现过的颜色（归一化 hex → 出现次数） */
  colorCounts: Record<string, number>;
  /** 各角色占比（dominant/secondary/accent/shadow → 0..1） */
  paletteCoverage: Record<string, number>;
  /** 命中的违禁 hex（归一化） */
  forbiddenHexHits: string[];
  /** 实测最高饱和度 S（0..1） */
  maxSaturation: number;
  /** 出现次数最多的颜色的色相 */
  dominantHue: number;
  /** 主色（最高频色）占比 0..1 */
  dominantCoveragePct: number;
  /** 动画/过渡时长集合（ms） */
  animationDurationsMs: number[];
  /** 命中的违禁缓动关键字 */
  bannedEasingHits: string[];
  /** 呼吸循环（infinite animation）计数 */
  breathingLoops: number;
  /** 实测留白比（无信号为 null） */
  negativeSpaceRatio: number | null;
  /** 视觉焦点数（plaque 类组件 / observerThreshold） */
  focalPoints: number;
  /** 已装配组件数 */
  componentCount: number;
  /** 是否出现半透材质槽位（--screen-opacity） */
  hasMaterialOpacity: boolean;
}

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
/** CSS 中只有时长使用 ms/s 单位，直接抓全部时长令牌（兼容 shorthand `transition:all 600ms`） */
const DURATION_RE = /(\d+(?:\.\d+)?)\s*(ms|s)\b/g;
const BANNED_EASING = ["bounce", "back", "spin", "linear", "particle"] as const;

/** 从一段文本里抓全部 hex 并累计计数 */
function countHexInText(text: string, out: Record<string, number>): void {
  const matches = text.match(HEX_RE);
  if (!matches) return;
  for (const m of matches) {
    const norm = normalizeHex(m);
    if (!norm) continue;
    out[norm] = (out[norm] ?? 0) + 1;
  }
}

/**
 * 从渲染产物提取反序列化信号（纯函数、无 DOM）。
 * 同时 grep css/js/html 文本与 plan 的结构化 cssVars。
 */
export function extractSignals(code: RenderedCode): ExtractedSignals {
  const colorCounts: Record<string, number> = {};
  const blob = [code.html ?? "", code.css ?? "", code.js ?? ""].join("\n");

  // 1) 文本里的 hex
  countHexInText(blob, colorCounts);

  // 2) plan 结构化 cssVars（root + 每个组件作用域）
  if (code.plan) {
    for (const [, v] of Object.entries(code.plan.rootCssVars)) {
      if (/^#/.test(v)) {
        const norm = normalizeHex(v);
        if (norm) colorCounts[norm] = (colorCounts[norm] ?? 0) + 1;
      }
    }
    for (const comp of code.plan.components) {
      for (const [, v] of Object.entries(comp.cssVars)) {
        if (/^#/.test(v)) {
          const norm = normalizeHex(v);
          if (norm) colorCounts[norm] = (colorCounts[norm] ?? 0) + 1;
        }
      }
    }
  }

  // 3) 最高频色 / 主色占比 / 最高饱和度 / 主色相
  let total = 0;
  let dominantHex = "#000000";
  let dominantCount = 0;
  let maxSaturation = 0;
  for (const [hex, n] of Object.entries(colorCounts)) {
    total += n;
    if (n > dominantCount) {
      dominantCount = n;
      dominantHex = hex;
    }
    const hsl = hexToHsl(hex);
    if (hsl && hsl.s > maxSaturation) maxSaturation = hsl.s;
  }
  const dominantCoveragePct = total > 0 ? dominantCount / total : 0;
  const dominantHue = hexToHsl(dominantHex)?.h ?? 0;

  // 4) 时长
  const animationDurationsMs: number[] = [];
  let dm: RegExpExecArray | null;
  DURATION_RE.lastIndex = 0;
  while ((dm = DURATION_RE.exec(blob)) !== null) {
    const val = parseFloat(dm[1]);
    const ms = dm[2] === "ms" ? val : val * 1000;
    animationDurationsMs.push(ms);
  }

  // 5) 违禁缓动
  const bannedEasingHits: string[] = [];
  for (const kw of BANNED_EASING) {
    if (new RegExp(`\\b${kw}\\b`).test(blob)) bannedEasingHits.push(kw);
  }

  // 6) 呼吸循环：animation ... infinite
  const breathingLoops = (blob.match(/animation[^;{}]*\binfinite\b/g) ?? []).length;

  // 7) 留白比：plan.rootCssVars['--space-leak-mult']（契约 B resolveTokens 写入）
  let negativeSpaceRatio: number | null = null;
  if (code.plan?.rootCssVars["--space-leak-mult"]) {
    const v = parseFloat(code.plan.rootCssVars["--space-leak-mult"]);
    if (Number.isFinite(v)) negativeSpaceRatio = v;
  }

  // 8) 焦点数：plaque 组件（带 observerThreshold）
  let focalPoints = 0;
  let componentCount = 0;
  let hasMaterialOpacity = false;
  if (code.plan) {
    componentCount = code.plan.components.length;
    for (const c of code.plan.components) {
      if (typeof c.state?.observerThreshold === "number") focalPoints += 1;
      if (c.cssVars["--screen-opacity"]) hasMaterialOpacity = true;
    }
  }

  // 9) 角色占比：按 sheet 角色 hex 统计（由 review 阶段结合 sheet 填充）
  const paletteCoverage: Record<string, number> = {};

  return {
    colorCounts,
    paletteCoverage,
    forbiddenHexHits: [],
    maxSaturation,
    dominantHue,
    dominantCoveragePct,
    animationDurationsMs,
    bannedEasingHits,
    breathingLoops,
    negativeSpaceRatio,
    focalPoints,
    componentCount,
    hasMaterialOpacity,
  };
}

/* ------------------------------------------------------------------ *
 * 反俗套规则审查
 * ------------------------------------------------------------------ */

function violation(
  ruleId: string,
  category: AntiClicheCategory,
  severity: "P0" | "P1",
  description: string,
  location: string,
  evidence: string,
): RuleViolation {
  return { ruleId, category, severity, description, location, evidence };
}

/**
 * 反俗套 lint 主入口。
 *
 * @param signals extractSignals 的产物
 * @param sheet   原始美学约束单（提供违禁清单/时长区间/焦点上限/期望主色相）
 * @returns 违例清单（P0 阻塞 / P1 需修补）
 */
export function reviewAntiCliche(
  signals: ExtractedSignals,
  sheet: AestheticConstraintSheet,
): RuleViolation[] {
  const out: RuleViolation[] = [];

  /* ---- 色彩规则 ---- */
  // 角色占比统计（按 sheet palette 角色）
  const coverage: Record<string, number> = {};
  let totalColor = 0;
  for (const n of Object.values(signals.colorCounts)) totalColor += n;
  for (const entry of sheet.colorSystem.palette) {
    const norm = normalizeHex(entry.hex);
    const c = norm ? signals.colorCounts[norm] ?? 0 : 0;
    coverage[entry.role] = totalColor > 0 ? c / totalColor : 0;
  }
  signals.paletteCoverage = coverage;

  // 规则 COLOR-01：违禁 hex（高饱和原色=国潮贴图感）
  const banned = new Set(sheet.colorSystem.hardFailHex.map((h) => normalizeHex(h)).filter(Boolean));
  const forbiddenHexHits: string[] = [];
  for (const hex of Object.keys(signals.colorCounts)) {
    if (banned.has(hex)) forbiddenHexHits.push(hex);
  }
  signals.forbiddenHexHits = forbiddenHexHits;
  for (const hex of forbiddenHexHits) {
    out.push(
      violation(
        "CA-TABOO-COLOR-01-FORBIDDEN-HEX", "color", "P0",
        `生成代码命中违禁色 ${hex}：高饱和原色=国潮贴图感，禁止`,
        "css:color", hex,
      ),
    );
  }

  // 规则 COLOR-02：饱和度铁律 S<=0.5
  if (signals.maxSaturation > 0.5) {
    out.push(
      violation(
        "CA-TABOO-COLOR-02-SATURATION", "color", "P0",
        `实测最高饱和度 S=${(signals.maxSaturation * 100).toFixed(0)}% 超过铁律 50%`,
        "css:color", `S=${signals.maxSaturation.toFixed(2)}`,
      ),
    );
  }

  // 规则 COLOR-03：主色占比 <=70%
  if (signals.dominantCoveragePct > 0.7) {
    out.push(
      violation(
        "CA-TABOO-COLOR-03-DOMINANT-RATIO", "color", "P1",
        `主色占比 ${(signals.dominantCoveragePct * 100).toFixed(0)}% 超过 70% 上限，画面壅塞`,
        "css:color-ratio", `${(signals.dominantCoveragePct * 100).toFixed(0)}%`,
      ),
    );
  }

  // 规则 COLOR-04：色温偏差（生成主色相 vs sheet 期望主色相，环形距离 >40°）
  const sheetDominant = sheet.colorSystem.palette.find((p) => p.role === "dominant");
  if (sheetDominant) {
    const expectHue = hexToHsl(sheetDominant.hex)?.h ?? 0;
    const dev = hueDistance(signals.dominantHue, expectHue);
    if (dev > 40) {
      out.push(
        violation(
          "CA-TABOO-COLOR-04-TEMPERATURE-BIAS", "color", "P1",
          `实测主色相 ${signals.dominantHue.toFixed(0)}° 与约束期望 ${expectHue.toFixed(0)}° 偏差 ${dev.toFixed(0)}°（>40°），色温跑调`,
          "css:color-temperature", `Δhue=${dev.toFixed(0)}°`,
        ),
      );
    }
  }

  /* ---- 动势规则 ---- */
  // 规则 MOTION-01：违禁缓动关键字（bounce/back/spin/linear/particle）
  for (const kw of signals.bannedEasingHits) {
    out.push(
      violation(
        "CA-TABOO-MOTION-01-BANNED-EASING", "motion", "P0",
        `生成代码使用违禁缓动 "${kw}"（弹簧/反弹/线性=塑料感）`,
        "css:easing", kw,
      ),
    );
  }

  // 规则 MOTION-02：动画时长越界（sheet.motion.durationMs 区间）
  const [lo, hi] = sheet.motion.durationMs;
  for (const d of signals.animationDurationsMs) {
    if (d < lo || d > hi) {
      out.push(
        violation(
          "CA-TABOO-MOTION-02-DURATION-RANGE", "motion", "P1",
          `动画时长 ${Math.round(d)}ms 超出约束区间 [${lo}, ${hi}]ms`,
          "css:animation-duration", `${Math.round(d)}ms`,
        ),
      );
      break; // 同规则只报一次
    }
  }

  // 规则 MOTION-03：呼吸循环缺失（>=1 个 infinite 呼吸）
  if (signals.breathingLoops < 1) {
    out.push(
      violation(
        "CA-TABOO-MOTION-03-NO-BREATHING", "motion", "P1",
        "缺少呼吸循环（>=1 个 infinite 缓动），动势层级缺失，画面僵死",
        "css:animation", "0 infinite loops",
      ),
    );
  }

  /* ---- 构图规则 ---- */
  // 规则 COMP-01：留白比（虚实比 7:5 ≈ 0.41..0.48，铁区间 [0.42,0.55]）
  if (signals.negativeSpaceRatio !== null) {
    const r = signals.negativeSpaceRatio;
    if (r < 0.42 || r > 0.55) {
      out.push(
        violation(
          "CA-TABOO-COMP-01-VOID-SOLID", "composition", "P1",
          `实测留白比 ${r.toFixed(2)} 偏离 preferred 区间 [0.42, 0.55]，虚实失衡`,
          "css:--space-leak-mult", r.toFixed(2),
        ),
      );
    }
  }

  // 规则 COMP-02：视觉焦点数超限（sheet.proportion.focalPointsMax）
  if (signals.focalPoints > sheet.proportion.focalPointsMax) {
    out.push(
      violation(
        "CA-TABOO-COMP-02-FOCAL-OVERLOAD", "composition", "P1",
        `视觉焦点 ${signals.focalPoints} 个超过上限 ${sheet.proportion.focalPointsMax}，题眼分散`,
        "dom:plaque", `${signals.focalPoints} focal points`,
      ),
    );
  }

  return out;
}
