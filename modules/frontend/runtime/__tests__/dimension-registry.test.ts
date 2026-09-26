/**
 * dimension-registry.test.ts — 维度三命名映射正确性
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getDimensionId,
  getLegacyId,
  getAllDimensions,
  tryGetDimensionId,
  DIMENSION_REGISTRY,
  DIMENSION_TO_TARGET,
  ALL_CANONICAL_DIMENSIONS,
  V2_NUMBERED_DIMENSIONS,
  getV2Dimensions,
  isLegacyExpansionDimension,
  getDimensionTier,
  type CanonicalDimensionId,
} from "../dimension-registry.ts";

test("legacy 10 维全部可解析为 canonical", () => {
  const legacy = ["spatial-order", "void-solid", "proportion", "material", "light-shadow", "color", "motion", "time", "taboo", "interaction"];
  for (const l of legacy) assert.ok(tryGetDimensionId(l), `legacy 维度未登记: ${l}`);
  assert.equal(getDimensionId("light-shadow"), "light");
  assert.equal(getDimensionId("time"), "temporal");
  assert.equal(getDimensionId("taboo"), "anti-cliche");
});

test("v2 11 个 numbered module 全部可解析", () => {
  for (let i = 1; i <= 11; i++) {
    const keys = Object.keys(DIMENSION_REGISTRY).filter((k) => k.startsWith(String(i).padStart(2, "0") + "-"));
    assert.ok(keys.length >= 1, `v2 module ${i} 未登记`);
  }
  assert.equal(getDimensionId("01-philosophy"), "philosophy");
  assert.equal(getDimensionId("11-anti-cliche"), "anti-cliche");
});

test("DC 术语别名解析", () => {
  assert.equal(getDimensionId("spatial"), "spatial-order");
  assert.equal(getDimensionId("temporal"), "temporal");
});

test("getLegacyId 反向映射：v2 新增维度返回 null", () => {
  assert.equal(getLegacyId("light"), "light-shadow");
  assert.equal(getLegacyId("anti-cliche"), "taboo");
  assert.equal(getLegacyId("temporal"), "time");
  // v2 新增
  assert.equal(getLegacyId("philosophy"), null);
  assert.equal(getLegacyId("architecture"), null);
});

test("getAllDimensions 覆盖 12 个 canonical 且落点归类合法", () => {
  const all = getAllDimensions();
  assert.equal(all.length, 12);
  for (const d of all) {
    assert.ok(DIMENSION_TO_TARGET[d.id], `canonical 维度 ${d.id} 无落点归类`);
  }
  // motion/temporal 走 runtime，philosophy 走 sidecar
  assert.equal(DIMENSION_TO_TARGET.motion.category, "runtime");
  assert.equal(DIMENSION_TO_TARGET.temporal.category, "runtime");
  assert.equal(DIMENSION_TO_TARGET.philosophy.category, "sidecar");
});

test("未知别名抛错（SSOT 严格模式）", () => {
  assert.throws(() => getDimensionId("not-a-dimension"));
  assert.equal(tryGetDimensionId("not-a-dimension"), undefined);
});

/* ------------------------------------------------------------------ *
 * 11D / 12D 边界：v2 编号维度 vs canonical 全量
 * ------------------------------------------------------------------ */

test("V2_NUMBERED_DIMENSIONS 恰好 11 维且不含 temporal", () => {
  assert.equal(V2_NUMBERED_DIMENSIONS.length, 11);
  assert.ok(!V2_NUMBERED_DIMENSIONS.includes("temporal"), "v2 编号维度不应含 temporal");
});

test("ALL_CANONICAL_DIMENSIONS 恰好 12 维（11 v2 + 1 legacy expansion）", () => {
  assert.equal(ALL_CANONICAL_DIMENSIONS.length, 12);
  // 前 11 项与 V2_NUMBERED_DIMENSIONS 一致
  for (let i = 0; i < 11; i++) {
    assert.equal(ALL_CANONICAL_DIMENSIONS[i], V2_NUMBERED_DIMENSIONS[i]);
  }
  // 第 12 项为 temporal
  assert.equal(ALL_CANONICAL_DIMENSIONS[11], "temporal");
});

test("getV2Dimensions 返回 11 维列表", () => {
  const v2 = getV2Dimensions();
  assert.equal(v2.length, 11);
  assert.deepEqual(v2, V2_NUMBERED_DIMENSIONS);
});

test("getDimensionTier：temporal=legacy-expansion，其余 11 维=v2", () => {
  assert.equal(getDimensionTier("temporal"), "legacy-expansion");
  for (const id of V2_NUMBERED_DIMENSIONS) {
    assert.equal(getDimensionTier(id as CanonicalDimensionId), "v2", `${id} 应为 v2 tier`);
  }
});

test("isLegacyExpansionDimension：仅 temporal 返回 true", () => {
  assert.equal(isLegacyExpansionDimension("temporal"), true);
  for (const id of V2_NUMBERED_DIMENSIONS) {
    assert.equal(isLegacyExpansionDimension(id), false, `${id} 不应是 legacy expansion`);
  }
  assert.equal(isLegacyExpansionDimension("not-a-dimension"), false);
});
