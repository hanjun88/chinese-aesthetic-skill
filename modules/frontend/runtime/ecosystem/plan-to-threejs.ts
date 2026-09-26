/**
 * ecosystem/plan-to-threejs.ts — Three.js MeshStandardMaterial 材质参数映射（§5.2）
 *
 * 输入：RuntimeExecutionPlan.runtimePlan.sceneBindings.materials[].uniforms
 *       （开放 Record<string, unknown>）。
 * 输出：Three.js MeshStandardMaterial 构造参数对象。
 *
 * 映射表：
 *   color / baseColor / diffuse (hex) → color (number 0xRRGGBB)
 *   roughness / uRoughness           → roughness
 *   metalness / metallic / uMetalness→ metalness
 *   opacity                          → opacity（<1 时自动 transparent=true）
 *   side                            → side
 *
 * 纯 mapper：未知 uniform key 忽略；合法 key 才写进结果。
 *
 * @module modules/frontend/runtime/ecosystem/plan-to-threejs
 */

import type { RuntimeExecutionPlan } from "../types/dc-types.ts";

/** Three.js MeshStandardMaterial 相关构造参数（子集） */
export interface ThreeMeshStandardParams {
  /** 0xRRGGBB */
  color?: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  /** FrontSide / BackSide / DoubleSide */
  side?: string;
  envMapIntensity?: number;
}

/**
 * 把 #RRGGBB 转为 Three.js 颜色整数。
 * @throws 非法 hex 抛错
 */
export function hexToThreeColor(hex: string): number {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) throw new Error(`[plan-to-threejs] 非法 hex: ${hex}`);
  return parseInt(m[1], 16);
}

/**
 * 把单个材质绑定的 uniforms 投影为 MeshStandardMaterial 参数。
 * 未知键忽略；不发明默认值。
 */
export function planUniformsToThreeJS(
  uniforms: Record<string, unknown>,
): ThreeMeshStandardParams {
  const out: ThreeMeshStandardParams = {};

  // color：接受多个常见 uniform 键名
  const colorRaw = uniforms.color ?? uniforms.baseColor ?? uniforms.diffuse;
  if (typeof colorRaw === "string") {
    out.color = hexToThreeColor(colorRaw);
  } else if (typeof colorRaw === "number") {
    out.color = colorRaw;
  }

  // roughness
  const rough = uniforms.roughness ?? uniforms.uRoughness;
  if (typeof rough === "number") out.roughness = rough;

  // metalness
  const metal = uniforms.metalness ?? uniforms.metallic ?? uniforms.uMetalness;
  if (typeof metal === "number") out.metalness = metal;

  // opacity（<1 自动开 transparent）
  const opacity = uniforms.opacity ?? uniforms.uOpacity;
  if (typeof opacity === "number") {
    out.opacity = opacity;
    if (opacity < 1) out.transparent = true;
  }

  // side
  const side = uniforms.side;
  if (typeof side === "string") out.side = side;

  // envMapIntensity
  const env = uniforms.envMapIntensity;
  if (typeof env === "number") out.envMapIntensity = env;

  return out;
}

/**
 * 批量：把计划内全部材质绑定投影为 [bindingId, params][]。
 */
export function planMaterialsToThreeJS(
  plan: RuntimeExecutionPlan,
): Array<{ bindingId: string; params: ThreeMeshStandardParams }> {
  return plan.runtimePlan.sceneBindings.materials.map((m) => ({
    bindingId: m.bindingId,
    params: planUniformsToThreeJS(m.uniforms),
  }));
}

/* ================================================================== */
/* 富生态 §5.2 扩展：materials / lights / scene 三段式 Three.js 配置   */
/* ================================================================== */

/** 东方美学材料原型（绢 / 纸 / 瓷 / 木 / 金属 / 墨） */
export type ThreeMaterialKind =
  | "silk"
  | "paper"
  | "porcelain"
  | "wood"
  | "metal"
  | "ink"
  | (string & {});

/** 单个生态材质规格 */
export interface ThreeMaterialEcosystemSpec {
  id: string;
  kind: ThreeMaterialKind;
  color: string;
  emissive?: string;
  /** 覆盖预设 roughness */
  roughness?: number;
  /** 覆盖预设 metalness */
  metalness?: number;
  opacity?: number;
}

/** 光影情绪（柔光 / 侧光 / 逆光 / 禅意阴影） */
export type ThreeLightMood =
  | "soft-diffuse"
  | "side"
  | "backlit"
  | "zen-shadow"
  | (string & {});

/** 投影出的 Three.js 光源配置 */
export interface ThreeLightEcosystemSpec {
  type: "directional" | "ambient" | "point";
  name: string;
  position?: [number, number, number];
  intensity: number;
  color: string;
}

/** 投影出的 Three.js Scene 配置 */
export interface ThreeSceneEcosystemSpec {
  background: string;
  environmentIntensity: number;
  fog?: { color: string; near: number; far: number };
}

/** 富生态 Three.js 计划输入 */
export interface ThreeJSEcosystemPlan {
  style: "song-elegant" | "chan-minimal" | "tang-ornate" | (string & {});
  materials: ThreeMaterialEcosystemSpec[];
  lightMood: ThreeLightMood;
  /** 光源色 hex，默认随风格 */
  lightColor?: string;
}

/** 富生态 Three.js 配置输出：materials / lights / scene */
export interface ThreeJSConfig {
  materials: Array<{
    id: string;
    kind: string;
    params: ThreeMeshStandardParams & { emissive?: number; emissiveIntensity?: number };
  }>;
  lights: ThreeLightEcosystemSpec[];
  scene: ThreeSceneEcosystemSpec;
}

/** 材料原型 → MeshStandardMaterial 物理参数预设 */
const MATERIAL_PRESETS: Record<
  string,
  { roughness: number; metalness: number }
> = {
  silk: { roughness: 0.62, metalness: 0.0 },
  paper: { roughness: 0.92, metalness: 0.0 },
  porcelain: { roughness: 0.22, metalness: 0.08 },
  wood: { roughness: 0.78, metalness: 0.0 },
  metal: { roughness: 0.32, metalness: 0.9 },
  ink: { roughness: 0.98, metalness: 0.0 },
};

/** 风格 → Scene 氛围预设（背景 / 雾 / 环境强度） */
const SCENE_PRESETS: Record<
  string,
  {
    background: string;
    environmentIntensity: number;
    fog?: { color: string; near: number; far: number };
  }
> = {
  "song-elegant": {
    background: "#EDEAE4",
    environmentIntensity: 0.5,
    fog: { color: "#EDEAE4", near: 12, far: 34 },
  },
  "chan-minimal": {
    background: "#E8E6E1",
    environmentIntensity: 0.3,
    fog: { color: "#E8E6E1", near: 6, far: 20 },
  },
  "tang-ornate": {
    background: "#2A1E1A",
    environmentIntensity: 0.9,
  },
};

/**
 * 材料原型 → MeshStandardMaterial 参数。
 * 预设 roughness/metalness 可被 spec 显式覆盖；emissive 可选。
 */
export function materialKindToThreeParams(
  spec: ThreeMaterialEcosystemSpec,
): ThreeJSConfig["materials"][number]["params"] {
  const preset = MATERIAL_PRESETS[spec.kind] ?? MATERIAL_PRESETS.paper;
  const params: ThreeJSConfig["materials"][number]["params"] = {
    color: hexToThreeColor(spec.color),
    roughness: spec.roughness ?? preset.roughness,
    metalness: spec.metalness ?? preset.metalness,
  };
  if (spec.emissive) {
    params.emissive = hexToThreeColor(spec.emissive);
    params.emissiveIntensity = 0.35;
  }
  if (typeof spec.opacity === "number") {
    params.opacity = spec.opacity;
    if (spec.opacity < 1) params.transparent = true;
  }
  return params;
}

/**
 * 光影情绪 → Three.js 光源配置数组。
 * 返回 DirectionalLight / AmbientLight / PointLight 的构造参数。
 */
export function lightMoodToLights(
  mood: ThreeLightMood,
  lightColor?: string,
): ThreeLightEcosystemSpec[] {
  const color = lightColor ?? "#FFF6E8";
  switch (mood) {
    case "side":
      return [
        { type: "ambient", name: "ambient", intensity: 0.35, color },
        { type: "directional", name: "key", position: [6, 4, 2], intensity: 1.6, color },
      ];
    case "backlit":
      return [
        { type: "ambient", name: "ambient", intensity: 0.3, color },
        { type: "directional", name: "rim", position: [0, 3, -6], intensity: 2.0, color },
        { type: "point", name: "fill", position: [0, 2, 4], intensity: 0.4, color },
      ];
    case "zen-shadow":
      return [
        { type: "ambient", name: "ambient", intensity: 0.15, color },
        { type: "directional", name: "hard-key", position: [4, 8, 3], intensity: 1.2, color },
      ];
    case "soft-diffuse":
    default:
      return [
        { type: "ambient", name: "ambient", intensity: 0.7, color },
        { type: "directional", name: "overhead", position: [0, 8, 4], intensity: 0.5, color },
      ];
  }
}

/** 风格 → Scene 配置（背景 / 雾 / 环境强度） */
export function styleToThreeScene(style: string): ThreeSceneEcosystemSpec {
  const preset = SCENE_PRESETS[style] ?? SCENE_PRESETS["song-elegant"];
  return {
    background: preset.background,
    environmentIntensity: preset.environmentIntensity,
    ...(preset.fog ? { fog: { ...preset.fog } } : {}),
  };
}

/**
 * 富生态主入口：把东方美学材料 / 光影 / 氛围计划投影为
 * 可直接用于 Three.js 场景初始化的 materials / lights / scene 配置。
 * 纯函数，不实例化任何 Three.js 对象。
 */
export function planToThreeJS(plan: ThreeJSEcosystemPlan): ThreeJSConfig {
  return {
    materials: plan.materials.map((m) => ({
      id: m.id,
      kind: m.kind,
      params: materialKindToThreeParams(m),
    })),
    lights: lightMoodToLights(plan.lightMood, plan.lightColor),
    scene: styleToThreeScene(plan.style),
  };
}
