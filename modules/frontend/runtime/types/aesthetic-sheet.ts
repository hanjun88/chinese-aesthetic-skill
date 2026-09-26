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
  /**
   * 构图裁决 — CAS 引擎基于 spatial.axis / proportion.voidSolidRatio /
   * focalPointsMax 计算出的 canonical 数值。DC adapter 直接读取此字段，
   * 不再自行推导或硬编码。这是 G2.5 布局规则（AC-LAYOUT-001/002）
   * 在跨仓路径上可达的 SSOT。
   */
  composition: {
    /** 留白比 0..1，由 voidSolidRatio 计算（void/(void+solid)） */
    negativeSpaceRatio: number;
    /** 对称度 0..1，由 spatial.axis 推导（strict=1 / offset=0.5 / hidden=0.15） */
    symmetry: number;
    /** 焦点坐标 [x,y] 0..1，由开间/轴线推导，非硬编码中心 */
    focalPoint: [number, number];
  };
  /**
   * 字体族 — CAS 引擎根据 mood / designBrief 推荐的字体族列表。
   * DC AestheticGateContext.typography.families 直接读取此字段，
   * 使 AC-TYPE-001/002 在跨仓路径上可达。空数组表示无字体约束。
   */
  typography: {
    families: string[];
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

/**
 * 从 sheet 的 proportion.voidSolidRatio / spatial.axis / spatial.bays
 * 计算 canonical composition 字段。CAS 生产者在构造 sheet 时应调用此函数
 * 填充 composition，使 DC adapter 无需自行推导。
 *
 * @param sheet 含 proportion 和 spatial 的部分 sheet
 * @returns canonical composition 值
 */
export function computeComposition(sheet: {
  proportion: { voidSolidRatio: string; focalPointsMax: number };
  spatial: { axis: "strict" | "offset" | "hidden"; bays: number };
}): { negativeSpaceRatio: number; symmetry: number; focalPoint: [number, number] } {
  const [voidPart, solidPart] = parseRatioPair(sheet.proportion.voidSolidRatio);
  const negativeSpaceRatio = Number((voidPart / (voidPart + solidPart)).toFixed(4));

  const symmetry =
    sheet.spatial.axis === "strict" ? 1 : sheet.spatial.axis === "offset" ? 0.5 : 0.15;

  // 焦点推导：strict 轴单焦点时偏置到黄金分割点 (~0.62,0.38)，避免死中心；
  // 多焦点或 offset 轴时取开间中点偏左。不再硬编码 [0.5, 0.5]。
  const focalPoint: [number, number] =
    sheet.spatial.axis === "strict" && sheet.proportion.focalPointsMax <= 1
      ? [0.62, 0.38]
      : sheet.spatial.axis === "offset"
        ? [0.38, 0.5]
        : [0.5, 0.5];

  return { negativeSpaceRatio, symmetry, focalPoint };
}

function parseRatioPair(ratio: string): [number, number] {
  const m = ratio.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m) return [1, 1];
  return [Number(m[1]), Number(m[2])];
}
