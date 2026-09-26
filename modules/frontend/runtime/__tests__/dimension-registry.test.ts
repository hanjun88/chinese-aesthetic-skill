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
