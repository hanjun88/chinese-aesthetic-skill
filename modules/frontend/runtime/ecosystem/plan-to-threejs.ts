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
