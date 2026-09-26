/**
 * severity-map.test.ts — P0/P1 ↔ HARD_FAIL/WARNING ↔ BLOCK/REPAIR/WARN/OK 四级映射
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapSeverity,
  isBlocking,
  isCanonicalSeverity,
  CAS_SEVERITY_TO_CANONICAL,
  CANONICAL_TO_DC,
} from "../severity-map.ts";

test("CAS P0/P1 → canonical", () => {
  assert.equal(CAS_SEVERITY_TO_CANONICAL.P0, "BLOCK");
  assert.equal(CAS_SEVERITY_TO_CANONICAL.P1, "REPAIR");
});

test("canonical → DC rule severity / range", () => {
  assert.equal(CANONICAL_TO_DC.BLOCK.ruleSeverity, "P0_CRITICAL");
  assert.equal(CANONICAL_TO_DC.BLOCK.rangeLevel, "fatalBelow");
  assert.equal(CANONICAL_TO_DC.REPAIR.ruleSeverity, "P1_WARNING");
  assert.equal(CANONICAL_TO_DC.REPAIR.rangeLevel, "hard");
  assert.equal(CANONICAL_TO_DC.WARN.rangeLevel, "warning");
  assert.equal(CANONICAL_TO_DC.OK.rangeLevel, "preferred");
});

test("mapSeverity 跨体系翻译", () => {
  assert.equal(mapSeverity("cas", "canonical", "P0"), "BLOCK");
  assert.equal(mapSeverity("cas", "canonical", "P1"), "REPAIR");
  assert.equal(mapSeverity("canonical", "dcRule", "BLOCK"), "P0_CRITICAL");
  assert.equal(mapSeverity("canonical", "dcRange", "REPAIR"), "hard");
  assert.equal(mapSeverity("dcRange", "canonical", "fatalBelow"), "BLOCK");
  assert.equal(mapSeverity("dcRule", "canonical", "P1_WARNING"), "REPAIR");
  assert.equal(mapSeverity("hardsoft", "canonical", "hard"), "BLOCK");
});

test("isBlocking：P0/BLOCK/P0_CRITICAL/fatalBelow 阻塞，其余不阻塞", () => {
  assert.equal(isBlocking("P0"), true);
  assert.equal(isBlocking("BLOCK"), true);
  assert.equal(isBlocking("P0_CRITICAL"), true);
  assert.equal(isBlocking("fatalBelow"), true);
  assert.equal(isBlocking("P1"), false);
  assert.equal(isBlocking("REPAIR"), false);
  assert.equal(isBlocking("P1_WARNING"), false);
  assert.equal(isBlocking("P2_INFO"), false);
  assert.equal(isBlocking("OK"), false);
});

test("isCanonicalSeverity 类型守卫", () => {
  assert.equal(isCanonicalSeverity("BLOCK"), true);
  assert.equal(isCanonicalSeverity("nope"), false);
});

test("非法输入抛错", () => {
  assert.throws(() => mapSeverity("cas", "canonical", "P2" as string));
});
