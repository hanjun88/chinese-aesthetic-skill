/**
 * plan-to-figma.test.ts — Figma 变量投影测试
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planToFigma,
  hexToFigmaRgb,
  EcosystemError,
} from "../plan-to-figma.ts";
import type { RuntimeExecutionPlan } from "../../types/dc-types.ts";
import { makeValidParams } from "../../__tests__/fixtures.ts";

function makePlan(): RuntimeExecutionPlan {
  return {
    planId: "p1",
    runtimePlan: {
      sceneBindings: {
        cameraRig: { type: "orbit", params: {} },
        lights: [],
        materials: [
          { bindingId: "mat-dominant", shaderType: "standard", uniforms: {} },
          { bindingId: "mat-accent", shaderType: "physical", uniforms: {} },
        ],
      },
      pipeline: { rendererType: "WebGL2Renderer", toneMapping: "ACESFilmicToneMapping", postprocessing: [] },
    },
    negotiation: { selectedTier: "A", downgrades: [] },
    hashes: { rawIRHash: "r", validatedIRHash: "v", executionPlanHash: "e" },
  };
}

test("hexToFigmaRgb 正确归一化 #EDEAE4", () => {
  const rgb = hexToFigmaRgb("#EDEAE4");
  assert.ok(Math.abs(rgb.r - 237 / 255) < 1e-3);
  assert.ok(Math.abs(rgb.g - 234 / 255) < 1e-3);
  assert.ok(Math.abs(rgb.b - 228 / 255) < 1e-3);
  assert.equal(rgb.a, 1);
});

test("planToFigma 产出 collections/paintStyles/componentProperties", () => {
  const out = planToFigma({ validatedParams: makeValidParams(), plan: makePlan() });
  // 两个 collection（colors / scalars）
  assert.equal(out.collections.length, 2);
  const colorVars = out.collections[0].variables.map((v) => v.name);
  assert.deepEqual(colorVars, ["color/dominant", "color/secondary", "color/accent"]);
  // 三个 paint style
  assert.equal(out.paintStyles.length, 3);
  // 两个材质绑定 → 两个 component property
  assert.equal(out.componentProperties.length, 2);
  assert.equal(out.componentProperties[0].component, "mat-dominant");
  assert.equal(out.componentProperties[0].propType, "VARIANT");
});

test("缺少必需参数抛 EcosystemError", () => {
  assert.throws(
    () => planToFigma({ validatedParams: [], plan: makePlan() }),
    /缺少已验证参数/,
  );
  assert.throws(() => hexToFigmaRgb("not-a-hex"), EcosystemError);
});
