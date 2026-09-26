/**
 * ecosystem/plan-to-figma.ts — Figma 插件生态投影（架构文档 §5.1）
 *
 * 输入：G2 后的已验证参数（ValidatedDesignIR 场景图的扁平投影）+ G3 RuntimeExecutionPlan。
 * 输出：Figma Variables（颜色/数值变量集合）、Paint Styles、Effect Styles、
 *       Component Properties —— 即把 CSS 变量语义槽投影为 Figma 设计变量。
 *
 * 纯 mapper，不发明默认值；缺参数抛 EcosystemError。
 * 纪律：hex→RGB 仅做 0..1 归一，不在此二次降饱和。
 *
 * @module modules/frontend/runtime/ecosystem/plan-to-figma
 */

import type {
  CangjieEstimatedParameter,
  RuntimeExecutionPlan,
} from "../types/dc-types.ts";

/** 生态映射错误 */
export class EcosystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EcosystemError";
  }
}

/* ------------------------------------------------------------------ */
/* Figma 输出类型                                                      */
/* ------------------------------------------------------------------ */

/** Figma 颜色（0..1 归一线性空间） */
export interface FigmaRGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

type FigmaVariableValue = FigmaRGB | number;

/** 单个 Figma Variable */
export interface FigmaVariable {
  /** 变量名（含 collection 内语义槽，如 "color/dominant"） */
  name: string;
  type: "COLOR" | "FLOAT";
  value: FigmaVariableValue;
}

/** Variable Collection（一个集合 = 一种 mode 维度） */
export interface FigmaVariableCollection {
  name: string;
  modes: string[];
  variables: FigmaVariable[];
}

/** Paint Style（纯色） */
export interface FigmaPaintStyle {
  name: string;
  paintType: "SOLID";
  color: FigmaRGB;
}

/** Effect Style（投影/模糊） */
export interface FigmaEffectStyle {
  name: string;
  effects: Array<{
    type: "DROP_SHADOW" | "BACKGROUND_BLUR";
    radius: number;
    color: FigmaRGB;
  }>;
}

/** Component Property（组件属性） */
export interface FigmaComponentProperty {
  component: string;
  propertyName: string;
  propType: "BOOLEAN" | "VARIANT" | "TEXT" | "INSTANCE_SWAP";
  defaultValue: unknown;
}

/** 聚合输出：一份 Figma 变量定义包 */
export interface FigmaVariableDefinitions {
  collections: FigmaVariableCollection[];
  paintStyles: FigmaPaintStyle[];
  effectStyles: FigmaEffectStyle[];
  componentProperties: FigmaComponentProperty[];
}

/* ------------------------------------------------------------------ */
/* 输入类型                                                            */
/* ------------------------------------------------------------------ */

/** plan-to-figma 输入 */
export interface PlanToFigmaInput {
  /** G2 补丁后的已验证参数（ValidatedDesignIR 场景图扁平投影） */
  validatedParams: CangjieEstimatedParameter[];
  /** G3 执行计划（取 sceneBindings 生成 componentProperties） */
  plan: RuntimeExecutionPlan;
}

/* ------------------------------------------------------------------ */
/* 富生态输入/输出（§5.1 扩展：variables / styles / effects 三段式包） */
/* ------------------------------------------------------------------ */

/** 东方美学风格标签（宋韵淡雅 / 禅意极简 / 唐韵华丽 …） */
export type AestheticStyleTag = "song-elegant" | "chan-minimal" | "tang-ornate" | (string & {});

/** 一个具名东方色样（朱砂 / 石青 / 藤黄 / 月白 …） */
export interface FigmaColorToken {
  /** 色名（中文矿物色名，仅作元信息） */
  name: string;
  /** #RRGGBB */
  hex: string;
}

/** 富生态计划：一份可直接投影为 Figma 变量包的高规格美学计划 */
export interface FigmaEcosystemPlan {
  /** 整体风格标签 */
  style: AestheticStyleTag;
  colors: {
    dominant: FigmaColorToken;
    secondary: FigmaColorToken;
    accent: FigmaColorToken;
    background?: FigmaColorToken;
    shadow?: FigmaColorToken;
  };
  typography?: {
    fontFamily: string;
    /** px，默认 16 */
    baseSizePx?: number;
    /** 行高倍率，默认 1.6 */
    lineHeight?: number;
    /** 字距 px，默认 0 */
    letterSpacingPx?: number;
    weights?: Array<{ name: string; weight: number }>;
  };
  layout?: {
    /** 基准单位 px，默认 8 */
    baseUnitPx?: number;
    /** 间距刻度（×baseUnit），默认 [1,2,3,4,6,8] */
    spacingScale?: number[];
    /** 栏数，默认 12 */
    columns?: number;
    gutterPx?: number;
    marginPx?: number;
    /** 留白占比 0..1，默认 0.6 */
    negativeSpaceRatio?: number;
  };
  effects?: {
    /** 投影柔化半径 px，默认 8 */
    shadowSoftnessPx?: number;
    /** 投影色 hex，默认取 colors.shadow */
    shadowColor?: string;
    /** 背景模糊 px，默认 0（>0 才产出） */
    backgroundBlurPx?: number;
    gradient?: { from: string; to: string; angleDeg: number };
  };
}

/** Figma 文字样式 */
export interface FigmaTextStyle {
  name: string;
  fontFamily: string;
  fontSize: number;
  lineHeightPx: number;
  letterSpacing: number;
  fontWeight: number;
}

/** Figma 布局网格 */
export interface FigmaLayoutGrid {
  name: string;
  pattern: "COLUMNS" | "ROWS";
  sectionSize: number;
  gutterSize: number;
  offset: number;
  numberOfColumns: number;
}

/** Figma Auto Layout 属性 */
export interface FigmaAutoLayout {
  name: string;
  layoutMode: "HORIZONTAL" | "VERTICAL";
  itemSpacing: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  primaryAxisAlignItems: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems: "MIN" | "CENTER" | "MAX";
}

/** Figma 渐变填充 */
export interface FigmaGradientPaint {
  name: string;
  gradientType: "GRADIENT_LINEAR";
  /** 0..1 stops */
  gradientStops: Array<{ position: number; color: FigmaRGB }>;
  angleDeg: number;
}

/**
 * 富生态 Figma 导出包：variables / styles / effects 三段式（+ layout 扩展）。
 * 可直接 JSON.stringify 后由 Figma 插件（variables.setVariableById 等）导入。
 */
export interface FigmaExport {
  variables: FigmaVariableCollection[];
  styles: {
    paints: FigmaPaintStyle[];
    textStyles: FigmaTextStyle[];
    gradients: FigmaGradientPaint[];
  };
  effects: FigmaEffectStyle[];
  layout: {
    grids: FigmaLayoutGrid[];
    autoLayout: FigmaAutoLayout[];
  };
}

/* ------------------------------------------------------------------ */
/* 富生态工具                                                          */
/* ------------------------------------------------------------------ */

/** #RRGGBB → HSL（h:0..360, s/l:0..100）。@throws 非法 hex */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToFigmaRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** #RRGGBB → "rgb(r,g,b)" 字符串（CSS 校验用） */
export function hexToCssRgb(hex: string): string {
  const { r, g, b } = hexToFigmaRgb(hex);
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

/* ------------------------------------------------------------------ */
/* 富生态主映射                                                        */
/* ------------------------------------------------------------------ */

/**
 * 把高规格美学计划投影为可被 Figma 插件直接导入的变量包。
 * 纯函数：所有缺省值在此显式推导，不读取全局状态。
 */
export function buildFigmaExport(plan: FigmaEcosystemPlan): FigmaExport {
  const { style, colors } = plan;
  const bg = colors.background ?? { name: "纸白", hex: "#F5F2EA" };
  const shadowToken = colors.shadow ?? { name: "墨", hex: "#1A1A2E" };

  const dominantRgb = hexToFigmaRgb(colors.dominant.hex);
  const secondaryRgb = hexToFigmaRgb(colors.secondary.hex);
  const accentRgb = hexToFigmaRgb(colors.accent.hex);
  const bgRgb = hexToFigmaRgb(bg.hex);
  const shadowRgb = hexToFigmaRgb(shadowToken.hex);

  // ---- variables：颜色集合 + 数值集合 ----
  const colorVariables: FigmaVariable[] = [
    { name: "color/dominant", type: "COLOR", value: dominantRgb },
    { name: "color/secondary", type: "COLOR", value: secondaryRgb },
    { name: "color/accent", type: "COLOR", value: accentRgb },
    { name: "color/background", type: "COLOR", value: bgRgb },
    { name: "color/shadow", type: "COLOR", value: shadowRgb },
  ];

  const typography = plan.typography ?? { fontFamily: "Songti SC, serif", baseSizePx: 16 };
  const baseSize = typography.baseSizePx ?? 16;
  const lineHeight = typography.lineHeight ?? 1.6;
  const letterSpacing = typography.letterSpacingPx ?? 0;

  const layout = plan.layout ?? {};
  const baseUnit = layout.baseUnitPx ?? 8;
  const spacingScale = layout.spacingScale ?? [1, 2, 3, 4, 6, 8];
  const negativeRatio = layout.negativeSpaceRatio ?? 0.6;

  const scalarVariables: FigmaVariable[] = [
    { name: "space/base-unit", type: "FLOAT", value: baseUnit },
    { name: "space/negative-ratio", type: "FLOAT", value: negativeRatio },
    { name: "type/base-size", type: "FLOAT", value: baseSize },
    { name: "type/line-height", type: "FLOAT", value: lineHeight },
    { name: "type/letter-spacing", type: "FLOAT", value: letterSpacing },
    ...spacingScale.map((mult, i) => ({
      name: `space/scale-${i + 1}`,
      type: "FLOAT" as const,
      value: mult * baseUnit,
    })),
  ];

  // ---- styles.paints ----
  const paints: FigmaPaintStyle[] = [
    { name: "paint/dominant", paintType: "SOLID", color: dominantRgb },
    { name: "paint/secondary", paintType: "SOLID", color: secondaryRgb },
    { name: "paint/accent", paintType: "SOLID", color: accentRgb },
    { name: "paint/background", paintType: "SOLID", color: bgRgb },
  ];

  // ---- styles.textStyles ----
  const weights = typography.weights ?? [
    { name: "regular", weight: 400 },
    { name: "medium", weight: 500 },
    { name: "semibold", weight: 600 },
  ];
  const textStyles: FigmaTextStyle[] = weights.map((w) => ({
    name: `text/${w.name}`,
    fontFamily: typography.fontFamily,
    fontSize: baseSize,
    lineHeightPx: Math.round(baseSize * lineHeight),
    letterSpacing,
    fontWeight: w.weight,
  }));

  // ---- styles.gradients ----
  const effects = plan.effects ?? {};
  const gradients: FigmaGradientPaint[] = effects.gradient
    ? [
        {
          name: "gradient/atmosphere",
          gradientType: "GRADIENT_LINEAR",
          angleDeg: effects.gradient.angleDeg,
          gradientStops: [
            { position: 0, color: hexToFigmaRgb(effects.gradient.from) },
            { position: 1, color: hexToFigmaRgb(effects.gradient.to) },
          ],
        },
      ]
    : [];

  // ---- effects：阴影 + 背景模糊 ----
  const effectStyles: FigmaEffectStyle[] = [
    {
      name: "effect/soft-shadow",
      effects: [
        {
          type: "DROP_SHADOW",
          radius: effects.shadowSoftnessPx ?? 8,
          color: { ...hexToFigmaRgb(effects.shadowColor ?? shadowToken.hex), a: 0.18 },
        },
      ],
    },
  ];
  if ((effects.backgroundBlurPx ?? 0) > 0) {
    effectStyles.push({
      name: "effect/haze-blur",
      effects: [
        { type: "BACKGROUND_BLUR", radius: effects.backgroundBlurPx ?? 24, color: bgRgb },
      ],
    });
  }

  // ---- layout.grids ----
  const columns = layout.columns ?? 12;
  const gutter = layout.gutterPx ?? 24;
  const margin = layout.marginPx ?? 48;
  const grids: FigmaLayoutGrid[] = [
    {
      name: "grid/columns",
      pattern: "COLUMNS",
      sectionSize: 0,
      gutterSize: gutter,
      offset: margin,
      numberOfColumns: columns,
    },
  ];

  // ---- layout.autoLayout（间距由留白比与基准单位推导） ----
  const autoLayout: FigmaAutoLayout[] = [
    {
      name: "autolayout/canvas",
      layoutMode: negativeRatio >= 0.5 ? "VERTICAL" : "HORIZONTAL",
      itemSpacing: spacingScale[2] * baseUnit,
      paddingLeft: margin,
      paddingRight: margin,
      paddingTop: spacingScale[4] * baseUnit,
      paddingBottom: spacingScale[4] * baseUnit,
      primaryAxisAlignItems: "CENTER",
      counterAxisAlignItems: "CENTER",
    },
  ];

  return {
    variables: [
      { name: `chinese-aesthetic/colors@${style}`, modes: [style], variables: colorVariables },
      { name: `chinese-aesthetic/scalars@${style}`, modes: [style], variables: scalarVariables },
    ],
    styles: { paints, textStyles, gradients },
    effects: effectStyles,
    layout: { grids, autoLayout },
  };
}

/* ------------------------------------------------------------------ */
/* 工具                                                                */
/* ------------------------------------------------------------------ */

function pick(params: CangjieEstimatedParameter[], path: string): CangjieEstimatedParameter {
  const hit = params.find((p) => p.path === path);
  if (!hit) throw new EcosystemError(`[plan-to-figma] 缺少已验证参数: ${path}`);
  return hit;
}

function num(params: CangjieEstimatedParameter[], path: string): number {
  return Number(pick(params, path).value);
}

/**
 * #RRGGBB / #RRGGBBAA → Figma RGB（0..1 归一）。
 * @throws 非法 hex 抛 EcosystemError
 */
export function hexToFigmaRgb(hex: string): FigmaRGB {
  const m = /^#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(hex.trim());
  if (!m) throw new EcosystemError(`[plan-to-figma] 非法 hex: ${hex}`);
  const int = parseInt(m[1], 16);
  const a = m[2] ? parseInt(m[2], 16) / 255 : 1;
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
    a,
  };
}

/* ------------------------------------------------------------------ */
/* 主映射                                                              */
/* ------------------------------------------------------------------ */

/**
 * 把已验证参数 + 执行计划投影为 Figma 变量定义。
 *
 * @throws EcosystemError 当必需颜色/比例参数缺失时
 */
export function planToFigma(input: PlanToFigmaInput): FigmaVariableDefinitions;
/**
 * 把高规格美学计划投影为可被 Figma 插件导入的 variables/styles/effects 包。
 */
export function planToFigma(plan: FigmaEcosystemPlan): FigmaExport;
export function planToFigma(
  input: PlanToFigmaInput | FigmaEcosystemPlan,
): FigmaVariableDefinitions | FigmaExport {
  // 判别：带 validatedParams 的旧 G2/G3 投影输入走冻结 ABI 分支
  if ("validatedParams" in input) {
    return planToFigmaLegacy(input);
  }
  return buildFigmaExport(input);
}

/** 冻结 ABI：G2 已验证参数 + G3 执行计划 → 变量集合（保持旧行为不变） */
function planToFigmaLegacy(input: PlanToFigmaInput): FigmaVariableDefinitions {
  const { validatedParams: params, plan } = input;

  const dominant = String(pick(params, "/color/dominant/value").value);
  const secondary = String(pick(params, "/color/secondary/value").value);
  const accent = String(pick(params, "/color/accent/value").value);

  const dominantRgb = hexToFigmaRgb(dominant);
  const secondaryRgb = hexToFigmaRgb(secondary);
  const accentRgb = hexToFigmaRgb(accent);

  const nsr = num(params, "/composition/negativeSpaceRatio/value");
  const roughness = num(params, "/materials/0/roughness/value");
  const colorTemp = num(params, "/lighting/keyLight/colorTemp/value");

  // ---- 颜色变量集合 ----
  const colorCollection: FigmaVariableCollection = {
    name: "chinese-aesthetic/colors",
    modes: ["default"],
    variables: [
      { name: "color/dominant", type: "COLOR", value: dominantRgb },
      { name: "color/secondary", type: "COLOR", value: secondaryRgb },
      { name: "color/accent", type: "COLOR", value: accentRgb },
    ],
  };

  // ---- 数值变量集合（间距/材质/色温） ----
  const floatCollection: FigmaVariableCollection = {
    name: "chinese-aesthetic/scalars",
    modes: ["default"],
    variables: [
      { name: "space/negative-ratio", type: "FLOAT", value: nsr },
      { name: "material/roughness", type: "FLOAT", value: roughness },
      { name: "lighting/color-temp-k", type: "FLOAT", value: colorTemp },
    ],
  };

  // ---- Paint Styles（从配色角色直接建） ----
  const paintStyles: FigmaPaintStyle[] = [
    { name: "paint/dominant", paintType: "SOLID", color: dominantRgb },
    { name: "paint/secondary", paintType: "SOLID", color: secondaryRgb },
    { name: "paint/accent", paintType: "SOLID", color: accentRgb },
  ];

  // ---- Effect Style：粗糙度 → 背景模糊半径（越粗糙越柔） ----
  const effectStyles: FigmaEffectStyle[] = [
    {
      name: "effect/soft-shadow",
      effects: [
        {
          type: "BACKGROUND_BLUR",
          radius: Math.round(roughness * 40),
          color: secondaryRgb,
        },
      ],
    },
  ];

  // ---- Component Properties：从计划的材质绑定反推 ----
  const componentProperties: FigmaComponentProperty[] =
    plan.runtimePlan.sceneBindings.materials.map((m) => ({
      component: m.bindingId,
      propertyName: "shaderType",
      propType: "VARIANT" as const,
      defaultValue: m.shaderType,
    }));

  return {
    collections: [colorCollection, floatCollection],
    paintStyles,
    effectStyles,
    componentProperties,
  };
}
