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
export function planToFigma(input: PlanToFigmaInput): FigmaVariableDefinitions {
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
