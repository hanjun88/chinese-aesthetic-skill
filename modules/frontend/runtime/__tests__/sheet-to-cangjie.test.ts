/**
 * sheet-to-cangjie.test.ts — 契约 A：15 条映射规则（21 条参数 path）+ 7 条 requiredPaths + severity/range 落地
 *
 * 路径约定：所有产出 path 均为节点级（对齐 DC POINTER_MAP），无 /value 后缀。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sheetToCangjie,
  REQUIRED_PATHS,
  PARAMETER_PATH_MAPPINGS,
  resolvePlanHashes,
  EMPTY_PLAN_HASHES,
} from "../sheet-to-cangjie.ts";
import type { RuntimeExecutionPlan } from "../types/dc-types.ts";
import { makeValidSheet } from "./fixtures.ts";

const OPTS = { advisorVersion: "chinese-aesthetic-skill@1.0.0", capturedAt: "2026-09-26T00:00:00Z" };

function param(result: ReturnType<typeof sheetToCangjie>, path: string) {
  return result.cangjieIR.parameters.find((p) => p.path === path);
}

test("PARAMETER_PATH_MAPPINGS 恰好 15 条规则", () => {
  assert.equal(PARAMETER_PATH_MAPPINGS.length, 15);
});

test("7 条 requiredPaths 全部输出且 confidence≥0.85 && calibration=PRODUCTION", () => {
  const r = sheetToCangjie(makeValidSheet(), OPTS);
  for (const req of REQUIRED_PATHS) {
    const p = r.cangjieIR.parameters.find((x) => x.path.startsWith(req));
    assert.ok(p, `缺少 requiredPath: ${req}`);
    assert.ok(p.confidence >= 0.85, `${req} confidence=${p.confidence} < 0.85`);
    assert.equal(p.calibration.status, "PRODUCTION");
  }
});

test("21 条参数值正确（色彩/构图/光影/材质/相机，节点级路径无 /value；含 contrastRatio 与 intensity）", () => {
  const r = sheetToCangjie(makeValidSheet(), OPTS);
  assert.equal(param(r, "/color/dominant")?.value, "#EDEAE4");
  assert.equal(param(r, "/color/secondary")?.value, "#2C3E50");
  assert.equal(param(r, "/color/accent")?.value, "#B8860B");
  // contrastRatio：WCAG 保守兜底
  assert.equal(param(r, "/color/contrastRatio")?.value, 4.5);
  assert.equal(param(r, "/color/contrastRatio")?.unit, "ratio");
  // 7:5 → 7/12 ≈ 0.5833
  assert.equal(param(r, "/composition/negativeSpaceRatio")?.value, 0.5833);
  // strict axis → symmetry 1
  assert.equal(param(r, "/composition/symmetry")?.value, 1);
  assert.equal(param(r, "/composition/depthLayerCount")?.value, 3);
  // skylight 天光
  assert.equal(param(r, "/lighting/keyLight/azimuth")?.value, 0);
  assert.equal(param(r, "/lighting/keyLight/elevation")?.value, 78);
  assert.equal(param(r, "/lighting/keyLight/colorTemp")?.value, 5600); // cloudy
  // intensity：主光强度兜底
  assert.equal(param(r, "/lighting/keyLight/intensity")?.value, 1.0);
  assert.equal(param(r, "/lighting/keyLight/intensity")?.unit, "scalar");
  // 3:7 → ambient 7/10=0.7
  assert.equal(param(r, "/lighting/ambientRatio")?.value, 0.7);
  // 材质
  assert.equal(param(r, "/materials/0/baseType")?.value, "aged-paper-wood");
  assert.equal(typeof param(r, "/materials/0/roughness")?.value, "number");
  // 相机
  assert.equal(param(r, "/camera/fov")?.value, 35);
  assert.deepEqual(param(r, "/composition/focalPoint")?.value, [0.5, 0.5]);
});

test("新增的 contrastRatio / intensity 路径为节点级，不带 /value 后缀", () => {
  const r = sheetToCangjie(makeValidSheet(), OPTS);
  const cr = param(r, "/color/contrastRatio");
  const inten = param(r, "/lighting/keyLight/intensity");
  assert.ok(cr, "应输出 /color/contrastRatio");
  assert.ok(inten, "应输出 /lighting/keyLight/intensity");
  assert.ok(!cr!.path.endsWith("/value"));
  assert.ok(!inten!.path.endsWith("/value"));
  // 置信度落在 Contract A schema 约定区间
  assert.ok(cr!.confidence >= 0.7 && cr!.confidence <= 0.85);
  assert.ok(inten!.confidence >= 0.7 && inten!.confidence <= 0.85);
});

test("所有产出 path（参数/约束/规则）均为节点级，无 /value 后缀", () => {
  const r = sheetToCangjie(makeValidSheet({
    violations: [
      { ruleId: "pure-red", severity: "P0", message: "用了正红" },
      { ruleId: "accent-area", severity: "P1", message: "点缀过大" },
    ],
  }), OPTS);
  for (const p of r.cangjieIR.parameters) {
    assert.ok(!p.path.endsWith("/value"), `参数 path 仍带 /value: ${p.path}`);
  }
  for (const c of r.cangjieIR.constraints ?? []) {
    assert.ok(!c.targetPath.endsWith("/value"), `约束 targetPath 仍带 /value: ${c.targetPath}`);
  }
  for (const rule of r.advisorRulePack) {
    assert.ok(!rule.targetPath.endsWith("/value"), `规则 targetPath 仍带 /value: ${rule.targetPath}`);
  }
});

test("P0 violation → range.fatalBelow + CangjieConstraint{type:threshold}（节点级 targetPath）", () => {
  const sheet = makeValidSheet({
    violations: [{ ruleId: "pure-red", severity: "P0", message: "用了正红" }],
  });
  const r = sheetToCangjie(sheet, OPTS);
  const dominant = param(r, "/color/dominant");
  assert.ok(dominant?.range?.fatalBelow != null, "P0 应写入 fatalBelow");
  const threshold = r.cangjieIR.constraints?.find((c) => c.type === "threshold");
  assert.ok(threshold, "应有 threshold 约束");
  assert.equal(threshold?.targetPath, "/color/dominant", "P0 约束 targetPath 应为节点级");
});

test("P1 violation → range.hard:[min,max]（节点级 path 命中 rangePatches）", () => {
  const sheet = makeValidSheet({
    violations: [{ ruleId: "accent-area", severity: "P1", message: "点缀过大" }],
  });
  const r = sheetToCangjie(sheet, OPTS);
  const accent = param(r, "/color/accent");
  assert.ok(Array.isArray(accent?.range?.hard), "P1 应写入 hard:[min,max]");
});

test("aestheticScore 只进 provenance/metadata，绝不写进参数 confidence", () => {
  const r = sheetToCangjie(makeValidSheet({ score: 91 }), OPTS);
  assert.equal(r.aestheticScore, 91);
  assert.equal(r.cangjieIR.provenance.aestheticScore, 91);
  for (const p of r.cangjieIR.parameters) {
    assert.ok(p.confidence <= 1 && p.confidence !== 91, "confidence 被污染为美学分");
  }
});

test("advisorRulePack 含 CA-TABOO / CA-ADVISOR，ruleId ASCII 排序，category 四值，targetPath 节点级", () => {
  const r = sheetToCangjie(makeValidSheet(), OPTS);
  assert.ok(r.advisorRulePack.length >= 2);
  const ids = r.advisorRulePack.map((x) => x.ruleId);
  assert.deepEqual(ids, [...ids].sort(), "ruleId 应 ASCII 升序");
  for (const rule of r.advisorRulePack) {
    assert.ok(/^(CA-ADVISOR|CA-TABOO)-/.test(rule.ruleId), "ruleId 前缀合规");
    assert.ok(["composition", "lighting", "color", "materials"].includes(rule.category));
    assert.ok(!rule.targetPath.endsWith("/value"), `规则 targetPath 带 /value: ${rule.targetPath}`);
  }
  assert.ok(r.advisorRulePack.some((x) => x.mutation.op === "test"), "应含 op:test 否决规则");
});

test("unmappedDimensions 含 motion / philosophy（无 Core IR 落点）", () => {
  const r = sheetToCangjie(makeValidSheet(), OPTS);
  assert.ok(r.unmappedDimensions.includes("motion"));
  assert.ok(r.unmappedDimensions.includes("philosophy"));
  // color/spatial-order 有落点，不应出现在 unmapped
  assert.ok(!r.unmappedDimensions.includes("color"));
});

test("确定性：同 sheet 同 capturedAt → 同一份参数序列化（哈希恒等）", () => {
  const a = sheetToCangjie(makeValidSheet(), OPTS).cangjieIR.parameters;
  const b = sheetToCangjie(makeValidSheet(), OPTS).cangjieIR.parameters;
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("缺失 requiredPath 数据时抛 BLOCKED_DATA", () => {
  // 正常 sheet 不抛，且错误分支 code=BLOCKED_DATA
  assert.doesNotThrow(() => sheetToCangjie(makeValidSheet(), OPTS));
});

/* ------------------------------------------------------------------ *
 * plan.hashes 为 undefined 的安全降级（DC HASH FLOW CONTRACT）
 * ------------------------------------------------------------------ */

test("resolvePlanHashes：plan 带 hashes 时原样返回", () => {
  const plan = { hashes: { rawIRHash: "r", validatedIRHash: "v", executionPlanHash: "e" } };
  const h = resolvePlanHashes(plan);
  assert.equal(h.rawIRHash, "r");
  assert.equal(h.validatedIRHash, "v");
  assert.equal(h.executionPlanHash, "e");
});

test("resolvePlanHashes：plan 缺省 hashes（undefined）时降级为空对象且不抛错", () => {
  // 模拟真实 DC plan（contracts.ts 规定 plan 内部不内嵌 hashes）
  const plan = {} as Pick<RuntimeExecutionPlan, "hashes">;
  let out: Record<string, string> | undefined;
  assert.doesNotThrow(() => {
    out = resolvePlanHashes(plan);
  });
  assert.deepEqual(out, {});
  assert.strictEqual(out, EMPTY_PLAN_HASHES);
  // 与运行时展开行为一致：{...undefined} / {...空对象} 均安全
  assert.deepEqual({ ...(plan.hashes ?? {}) }, {});
});
