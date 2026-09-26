/**
 * aesthetic-sheet.ts — AestheticConstraintSheet（美学约束单）TS 化定义
 *
 * 形状对齐 docs/fusion-architecture.md §2.1 与 architecture.md §3.1。
 * 这是 CAS 引擎（lib/ 原 10 维，零改动）输出给融合层的中间物。
 *
 * @module modules/frontend/runtime/types/aesthetic-sheet
 */

import type { CanonicalDimensionId } from "../dimension-registry.ts";

/** 色彩角色（君臣佐使） */
export type ColorRole = "dominant" | "secondary" | "accent" | "shadow";

/** 色彩条目（hex 已是降饱和执行值，S≤50% 铁律在 sheet 侧保证） */
export interface SheetColorEntry {
  role: ColorRole;
  /** 中文名：月白 / 黛青 / 古金 … */
  name: string;
  /** 执行 hex，已降饱和 */
  hex: string;
  hsl: string;
  /** 面积占比 0..1 */
  areaPct: number;
  usage: string;
}

/** 美学违例 */
export interface SheetViolation {
  ruleId: string;
  severity: "P0" | "P1";
  message: string;
}

/** 结构化维度裁决项 */
export interface SheetStructuralDimension {
  id: CanonicalDimensionId;
  weight: "primary" | "secondary" | "tertiary";
  /** 硬约束（人读） */
  hard?: string;
  /** 软建议（人读） */
  soft?: string;
}

/**
 * 美学约束单 — CAS 引擎输出的、喂给融合层的唯一输入物。
 */
export interface AestheticConstraintSheet {
  sheetId: string;
  designBrief: string;
  /** 情绪主题 */
  mood: "song-elegant" | "chan-zen" | "tang-tang" | "night-feast" | "misty-blue";
  /** ≤200 字的归因陈述 */
  attributionStatement: string;
  structuralDimensions: SheetStructuralDimension[];
  colorSystem: {
    palette: SheetColorEntry[];
    /** 铁律：最大饱和度 0.5 */
    saturationMax: number;
    /** 违禁 hex：正红/亮金/死黑/青 cyan */
    hardFailHex: string[];
  };
  proportion: {
    baseModulePx: number;
    spacingScale: number[];
    /** 形如 "7:5" */
    voidSolidRatio: string;
    focalPointsMax: number;
  };
  spatial: {
    axis: "strict" | "offset" | "hidden";
    bays: number;
    hierarchyLevelsMin: number;
  };
  lighting: {
    primarySource: "skylight" | "leaked" | "side" | "bounced" | "moonlight";
    timeSetting: "dawn" | "noon" | "dusk" | "night" | "cloudy";
    /** 形如 "3:7"（亮:暗） */
    lightDarkRatio: string;
  };
  motion: {
    prototypes: Array<"cloud" | "water" | "smoke" | "wind" | "light">;
    durationMs: [number, number];
    entryMode: "emerge" | "pop";
    /** 违禁动效：bounce/back/spin/linear/particle */
    hardFail: string[];
  };
  antiCliche: {
    scanned: boolean;
    hardFailHits: string[];
    forbidden: string[];
  };
  violations: SheetViolation[];
  /** 0-100，仅作 metadata，绝不写进参数 confidence */
  score: number;
}
