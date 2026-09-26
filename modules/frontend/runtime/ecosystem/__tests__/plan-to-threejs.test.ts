/**
 * plan-to-threejs.test.ts — Three.js MeshStandardMaterial 映射测试
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planUniformsToThreeJS,
  planMaterialsToThreeJS,
  hexToThreeColor,
} from "../plan-to-threejs.ts";
import type { RuntimeExecutionPlan } from "../../types/dc-types.ts";

test("hex + roughness + metalness + opacity 正确映射", () => {
  const p = planUniformsToThreeJS({
    color: "#2C3E50",
    roughness: 0.72,
    metalness: 0.04,
    opacity: 0.8,
  });
  assert.equal(p.color, 0x2c3e50);
  assert.equal(p.roughness, 0.72);
  assert.equal(p.metalness, 0.04);
  assert.equal(p.opacity, 0.8);
  // opacity<1 自动 transparent
  assert.equal(p.transparent, true);
});

test("未知 uniform 键忽略；别名键（metallic/baseColor/uRoughness）也映射", () => {
  const p = planUniformsToThreeJS({
    baseColor: "#B8860B",
    metallic: 0.6,
    uRoughness: 0.3,
    unknownKey: "ignored",
  });
  assert.equal(p.color, 0xb8860b);
  assert.equal(p.metalness, 0.6);
  assert.equal(p.roughness, 0.3);
  assert.ok(!("unknownKey" in p));
});

test("批量映射：planMaterialsToThreeJS 逐 bindingId 输出", () => {
  const plan = {
    planId: "p",
    runtimePlan: {
      sceneBindings: {
        cameraRig: { type: "orbit", params: {} },
        lights: [],
        materials: [
          { bindingId: "mat-a", shaderType: "standard", uniforms: { color: "#111111", roughness: 0.5 } },
          { bindingId: "mat-b", shaderType: "physical", uniforms: { metalness: 0.9 } },
        ],
      },
      pipeline: { rendererType: "WebGL2Renderer", toneMapping: "ACESFilmicToneMapping", postprocessing: [] },
    },
  } as unknown as RuntimeExecutionPlan;

  const out = planMaterialsToThreeJS(plan);
  assert.equal(out.length, 2);
  assert.equal(out[0].bindingId, "mat-a");
  assert.equal(out[0].params.color, 0x111111);
  assert.equal(out[1].params.metalness, 0.9);
  assert.throws(() => hexToThreeColor("bad"));
});
