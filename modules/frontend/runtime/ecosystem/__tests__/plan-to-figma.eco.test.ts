/**
 * plan-to-figma.eco.test.ts — Figma 富生态投影（variables/styles/effects）测试
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planToFigma,
  buildFigmaExport,
  hexToHsl,
  hexToCssRgb,
  hexToFigmaRgb,
} from "../plan-to-figma.ts";
import type { FigmaEcosystemPlan } from "../plan-to-figma.ts";
import type { RuntimeExecutionPlan } from "../../types/dc-types.ts";
import { makeValidParams } from "../../__tests__/fixtures.ts";

const basePlan: FigmaEcosystemPlan = {
  style: "song-elegant",
  colors: {
    dominant: { name: "月白", hex: "#EDEAE4" },
    secondary: { name: "黛青", hex: "#2C3E50" },
    accent: { name: "朱砂", hex: "#C93B3E" },
  },
};

function legacyPlan(): RuntimeExecutionPlan {
  return {
    planId: "p1",
    runtimePlan: {
      sceneBindings: {
        cameraRig: { type: "orbit", params: {} },
        lights: [],
        materials: [{ bindingId: "mat-a", shaderType: "standard", uniforms: {} }],
      },
      pipeline: { rendererType: "WebGL2Renderer", toneMapping: "ACESFilmicToneMapping", postprocessing: [] },
    },
    negotiation: { selectedTier: "A", downgrades: [] },
    hashes: { rawIRHash: "r", validatedIRHash: "v", executionPlanHash: "e" },
  };
}

test("① 基本转换：宋韵计划产出 variables/styles/effects/layout 四段", () => {
  const out = buildFigmaExport(basePlan);
  assert.equal(out.variables.length, 2); // colors + scalars
  assert.equal(out.styles.paints.length, 4);
  assert.equal(out.effects.length, 1);
  assert.equal(out.layout.grids.length, 1);
  assert.equal(out.layout.autoLayout.length, 1);
});

test("② 边界：最小计划（仅三色）全部缺省值正确推导，不抛错", () => {
  const out = buildFigmaExport(basePlan);
  // 缺省 background → #F5F2EA
  const bgVar = out.variables[0].variables.find((v) => v.name === "color/background")!;
  assert.deepEqual(bgVar.value, hexToFigmaRgb("#F5F2EA"));
  // 缺省 typography → 16px / 1.6 / 3 weights
  assert.equal(out.styles.textStyles.length, 3);
  assert.equal(out.styles.textStyles[0].fontSize, 16);
  // 缺省 layout → 12 栏
  assert.equal(out.layout.grids[0].numberOfColumns, 12);
});

test("③ 不同风格：唐韵提供渐变时产出 gradient，宋韵最小计划无 gradient", () => {
  const song = buildFigmaExport(basePlan);
  assert.equal(song.styles.gradients.length, 0);

  const tang: FigmaEcosystemPlan = {
    ...basePlan,
    style: "tang-ornate",
    effects: { gradient: { from: "#2A1E1A", to: "#C93B3E", angleDeg: 90 }, backgroundBlurPx: 20 },
  };
  const tangOut = buildFigmaExport(tang);
  assert.equal(tangOut.styles.gradients.length, 1);
  assert.equal(tangOut.styles.gradients[0].angleDeg, 90);
  // backgroundBlurPx>0 → 额外 haze-blur effect
  assert.equal(tangOut.effects.length, 2);
});

test("④ 输出格式：可 JSON 序列化；颜色变量为 0..1 归一 RGB；HSL 校验朱砂", () => {
  const out = buildFigmaExport(basePlan);
  const json = JSON.parse(JSON.stringify(out)); // 必须可往返
  assert.equal(json.variables[0].name, "chinese-aesthetic/colors@song-elegant");
  const cinnabar = out.variables[0].variables.find((v) => v.name === "color/accent")!;
  const rgb = cinnabar.value as ReturnType<typeof hexToFigmaRgb>;
  assert.ok(rgb.r > 0.7 && rgb.r < 0.85); // 朱砂红分量高
  // HSL
  const hsl = hexToHsl("#C93B3E");
  assert.ok(hsl.h >= 350 || hsl.h <= 10);
  assert.equal(typeof hexToCssRgb("#FFFFFF"), "string");
  assert.match(hexToCssRgb("#FFFFFF"), /^rgb\(255, 255, 255\)$/);
});

test("⑤ API 兼容：planToFigma 重载——旧 G2/G3 输入仍返回冻结 FigmaVariableDefinitions", () => {
  // 旧分支
  const legacy = planToFigma({ validatedParams: makeValidParams(), plan: legacyPlan() });
  assert.equal(legacy.collections.length, 2);
  assert.equal(legacy.paintStyles.length, 3);
  // 新分支
  const rich = planToFigma(basePlan);
  assert.ok("variables" in rich && "styles" in rich && "effects" in rich);
  // 判别不误伤：旧输入不会走富分支
  assert.ok(!("layout" in legacy));
});

test("⑥ 数值变量：spacingScale 与 negativeSpaceRatio 正确展开为 FLOAT", () => {
  const out = buildFigmaExport({
    ...basePlan,
    layout: { baseUnitPx: 8, spacingScale: [1, 2, 3], negativeSpaceRatio: 0.7 },
  });
  const scalars = out.variables[1].variables.map((v) => v.name);
  assert.ok(scalars.includes("space/scale-1"));
  assert.ok(scalars.includes("space/scale-3"));
  const s3 = out.variables[1].variables.find((v) => v.name === "space/scale-3")!;
  assert.equal(s3.value, 24); // 3 * 8
  // 留白比 >=0.5 → VERTICAL
  assert.equal(out.layout.autoLayout[0].layoutMode, "VERTICAL");
});
