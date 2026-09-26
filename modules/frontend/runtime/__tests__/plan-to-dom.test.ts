/**
 * plan-to-dom.test.ts — 契约 B：6 组件映射 + tokens.css 桥接
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { planToDom, resolveTokens, MapperError } from "../plan-to-dom.ts";
import { makeValidParams } from "./fixtures.ts";
import type { RuntimeExecutionPlan } from "../types/dc-types.ts";

function makePlan(tier: "TIER_A" | "TIER_B" | "TIER_C" = "TIER_A"): RuntimeExecutionPlan {
  return {
    planId: "plan-test",
    runtimePlan: {
      sceneBindings: {
        cameraRig: { type: "orbit", params: { motion: { proto: "light", durationMs: [1500, 8000], amplitude: 0.04 } } },
        lights: [{ type: "area", parameters: {} }],
        materials: [{ bindingId: "mat-0", shaderType: "PBR", uniforms: {} }],
      },
      pipeline: { rendererType: "WebGL2Renderer", toneMapping: "sRGB", postprocessing: ["grain"] },
    },
    negotiation: { selectedTier: tier, downgrades: [{ feature: "bloom", reason: "low-power", fallbackStrategy: "css-vignette" }] },
    hashes: { rawIRHash: "r", validatedIRHash: "v", executionPlanHash: "e" },
  };
}

test("resolveTokens：hex/ratio → tokens.css 语义槽", () => {
  const vars = resolveTokens(makeValidParams());
  assert.equal(vars["--color-bg"], "#EDEAE4");
  assert.equal(vars["--color-text"], "#2C3E50");
  assert.equal(vars["--color-accent"], "#B8860B");
  // 0.58 ≥ 0.45 → space-4xl
  assert.equal(vars["--space-proportion"], "var(--space-4xl)");
  // 5600K 天光
  assert.equal(vars["--shadow-token"], "--shadow-skylight");
  // roughness 0.72 → opacity
  assert.equal(vars["--material-opacity"], "0.72");
});

test("planToDom 产出全部 6 个组件，顺序 1..6", () => {
  const out = planToDom({ plan: makePlan(), validatedParams: makeValidParams(), testCaseId: "TC1" });
  assert.equal(out.components.length, 6);
  assert.deepEqual(out.components.map((c) => c.order), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(out.components.map((c) => c.prefix), ["mg", "sp", "fs", "lw", "pl", "cs"]);
});

test("6 组件逐字段映射正确", () => {
  const out = planToDom({ plan: makePlan(), validatedParams: makeValidParams(), testCaseId: "TC1" });
  const byKind = Object.fromEntries(out.components.map((c) => [c.kind, c]));

  // 月洞门：门框色=secondary，state open:false
  assert.equal(byKind["moon-gate"].cssVars["--color-border-strong"], "#2C3E50");
  assert.equal(byKind["moon-gate"].state?.open, false);
  assert.equal(byKind["moon-gate"].motion?.prototype, "light");

  // 卷轴：water 原型，横向
  assert.equal(byKind["scroll-panel"].motion?.prototype, "water");
  assert.equal(byKind["scroll-panel"].motion?.easingToken, "--ease-water");
  assert.equal(byKind["scroll-panel"].state?.orientation, "horizontal");

  // 屏风：opacity 来自 roughness
  assert.equal(byKind["folding-screen"].cssVars["--screen-opacity"], "0.72");

  // 花窗：漏光色=accent，三层视差
  assert.equal(byKind["lattice-window"].cssVars["--color-shadow-leak"], "#B8860B");
  assert.deepEqual(byKind["lattice-window"].state?.parallaxLayers, [0.2, 0.5, 1.0]);

  // 匾额：accent 金线，IO 阈值 0.4
  assert.equal(byKind["plaque"].cssVars["--color-accent"], "#B8860B");
  assert.equal(byKind["plaque"].state?.observerThreshold, 0.4);

  // 博古架：格距
  assert.ok(byKind["curio-shelf"].cssVars["--space-cell"]);
});

test("renderer 通道随 negotiation.selectedTier 降级", () => {
  assert.equal(planToDom({ plan: makePlan("TIER_A"), validatedParams: makeValidParams(), testCaseId: "t" }).renderer, "WebGL2Renderer");
  assert.equal(planToDom({ plan: makePlan("TIER_B"), validatedParams: makeValidParams(), testCaseId: "t" }).renderer, "WebGL1Renderer");
  assert.equal(planToDom({ plan: makePlan("TIER_C"), validatedParams: makeValidParams(), testCaseId: "t" }).renderer, "DOMCanvas");
});

test("links 回指 DC 主链 hash", () => {
  const out = planToDom({ plan: makePlan(), validatedParams: makeValidParams(), testCaseId: "TC1" });
  assert.deepEqual(out.links, { rawIRHash: "r", validatedIRHash: "v", executionPlanHash: "e" });
});

test("缺少必需参数抛 MapperError（不发明默认值）", () => {
  const params = makeValidParams().filter((p) => p.path !== "/color/accent/value");
  assert.throws(
    () => planToDom({ plan: makePlan(), validatedParams: params, testCaseId: "t" }),
    (e: unknown) => e instanceof MapperError,
  );
});

test("每个组件都声明了 drivenBy 维度溯源", () => {
  const out = planToDom({ plan: makePlan(), validatedParams: makeValidParams(), testCaseId: "t" });
  for (const c of out.components) assert.ok(c.drivenBy.length >= 1);
});
