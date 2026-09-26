/**
 * plan-to-threejs.eco.test.ts — Three.js 富生态（materials/lights/scene）测试
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planToThreeJS,
  materialKindToThreeParams,
  lightMoodToLights,
  styleToThreeScene,
  planUniformsToThreeJS,
  hexToThreeColor,
} from "../plan-to-threejs.ts";
import type { ThreeJSEcosystemPlan } from "../plan-to-threejs.ts";

test("① 基本转换：禅意计划产出 materials/lights/scene 三段", () => {
  const plan: ThreeJSEcosystemPlan = {
    style: "chan-minimal",
    lightMood: "zen-shadow",
    materials: [
      { id: "floor", kind: "paper", color: "#E8E6E1" },
      { id: "vase", kind: "porcelain", color: "#C9D6D9" },
    ],
  };
  const cfg = planToThreeJS(plan);
  assert.equal(cfg.materials.length, 2);
  assert.equal(cfg.lights.length, 2);
  assert.equal(cfg.scene.background, "#E8E6E1");
});

test("② 材料映射：瓷低 roughness、金属高 metalness、纸高 roughness；可被覆盖", () => {
  const porcelain = materialKindToThreeParams({ id: "v", kind: "porcelain", color: "#FFFFFF" });
  assert.ok(porcelain.roughness! < 0.3);
  const metal = materialKindToThreeParams({ id: "m", kind: "metal", color: "#B8860B" });
  assert.ok(metal.metalness! > 0.8);
  const paper = materialKindToThreeParams({ id: "p", kind: "paper", color: "#EEEEEE" });
  assert.ok(paper.roughness! > 0.9);
  // 显式覆盖
  const overridden = materialKindToThreeParams({ id: "o", kind: "ink", color: "#000000", roughness: 0.5 });
  assert.equal(overridden.roughness, 0.5);
});

test("③ 不同光影：side / backlit / zen-shadow / soft-diffuse 光源数量与强度不同", () => {
  assert.equal(lightMoodToLights("side").length, 2);
  assert.equal(lightMoodToLights("backlit").length, 3);
  assert.equal(lightMoodToLights("zen-shadow").length, 2);
  assert.equal(lightMoodToLights("soft-diffuse").length, 2);
  // 禅意 ambient 最低
  const zenAmbient = lightMoodToLights("zen-shadow").find((l) => l.type === "ambient")!;
  const softAmbient = lightMoodToLights("soft-diffuse").find((l) => l.type === "ambient")!;
  assert.ok(zenAmbient.intensity < softAmbient.intensity);
});

test("④ 风格场景：宋韵有雾、唐韵无雾且背景深、未知风格回退宋韵", () => {
  assert.ok(styleToThreeScene("song-elegant").fog);
  assert.ok(!styleToThreeScene("tang-ornate").fog);
  assert.equal(styleToThreeScene("tang-ornate").background, "#2A1E1A");
  // 未知风格回退
  const fallback = styleToThreeScene("unknown-style");
  assert.equal(fallback.background, "#EDEAE4");
});

test("⑤ 边界：空 materials 数组 → materials 为空但 lights/scene 仍完整", () => {
  const cfg = planToThreeJS({ style: "song-elegant", lightMood: "soft-diffuse", materials: [] });
  assert.deepEqual(cfg.materials, []);
  assert.ok(cfg.lights.length > 0);
  assert.ok(cfg.scene.background.length > 0);
});

test("⑥ API 兼容：旧 planUniformsToThreeJS 行为不变；emissive 注入", () => {
  const legacy = planUniformsToThreeJS({ color: "#2C3E50", roughness: 0.7, opacity: 0.5 });
  assert.equal(legacy.color, 0x2c3e50);
  assert.equal(legacy.transparent, true);
  // emissive
  const withEmissive = materialKindToThreeParams({ id: "e", kind: "silk", color: "#FFFFFF", emissive: "#FF0000" });
  assert.equal(withEmissive.emissive, 0xff0000);
  assert.ok(typeof withEmissive.emissiveIntensity === "number");
  assert.equal(hexToThreeColor("#00FF00"), 0x00ff00);
});
