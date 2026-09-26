/**
 * compile.js — 端到端演示步骤 2：sheet → CangjieRawDesignIR → 模拟 DC G1/G2/G3 → RuntimeExecutionPlan
 *
 * 模拟 design-compiler 主流水线（本地内存版，不 import DC 源码）：
 *   G0  normalizeIntent      — sheet-to-cangjie.ts 已完成（扁平 IR 已在调用前得到）
 *   G1  DataGate             — requiredPaths 置信度地板 0.6 / required 0.85 校验
 *   G2  PatchEngine          — 按 advisorRulePack 应用确定性补丁（ruleId ASCII 序）
 *   G3  CapabilityNegotiator — assemblePlan：从 validated 参数装配 sceneBindings
 *   +  plan-enricher          — 开放 uniforms/params 注入 motion / postprocessing
 *
 * 用法: node compile.js
 * 输入: sheet.json  输出: cangjie-ir.json, validated-params.json, execution-plan.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { sheetToCangjie, REQUIRED_PATHS, G1_CONFIDENCE_FLOOR } from "../../modules/frontend/runtime/sheet-to-cangjie.ts";

const here = dirname(fileURLToPath(import.meta.url));
const sheet = JSON.parse(readFileSync(join(here, "sheet.json"), "utf8"));

function sha256(obj) {
  return "sha256:" + createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 24);
}

// —— G0：sheet → CangjieRawDesignIR（契约 A）——
const result = sheetToCangjie(sheet, {
  advisorVersion: "chinese-aesthetic-skill@1.0.0",
  capturedAt: "2026-09-26T00:00:00Z", // 确定性时间戳（调用方传入）
});
const { cangjieIR, advisorRulePack, unmappedDimensions } = result;
writeFileSync(join(here, "cangjie-ir.json"), JSON.stringify(cangjieIR, null, 2));

// —— G1：DataGate 置信度准入 ——
const g1 = { kind: "PASS", checks: [] };
for (const p of cangjieIR.parameters) {
  if (p.confidence < G1_CONFIDENCE_FLOOR) p.status = "unknown";
}
for (const req of REQUIRED_PATHS) {
  const hit = cangjieIR.parameters.find((p) => p.path.startsWith(req));
  const ok = hit && hit.status !== "unknown" && hit.confidence >= 0.85;
  g1.checks.push({ path: req, confidence: hit?.confidence ?? null, pass: !!ok });
  if (!ok) g1.kind = "BLOCKED_DATA";
}
const rawIRHash = sha256(cangjieIR.parameters);

// —— G2：PatchEngine（应用 advisor 补丁，ruleId ASCII 序已在 adapter 内排好）——
const validatedParams = cangjieIR.parameters.map((p) => ({ ...p }));
const appliedPatches = [];
for (const rule of advisorRulePack) {
  if (rule.mutation.op !== "replace") continue;
  const target = validatedParams.find((p) => p.path === rule.targetPath);
  if (!target) continue;
  const cond = rule.condition;
  let triggered = false;
  if (cond.operator === "<" && typeof target.value === "number" && target.value < cond.value) triggered = true;
  if (triggered) {
    target.value = rule.mutation.value;
    target.status = "grammar-derived";
    target.derivedFrom = rule.ruleId;
    appliedPatches.push({ ruleId: rule.ruleId, path: rule.targetPath, to: rule.mutation.value });
  }
}
const validatedIRHash = sha256(validatedParams);

// —— G3 + plan-enricher：assemblePlan ——
const get = (path) => validatedParams.find((p) => p.path === path)?.value;
const plan = {
  planId: "plan-" + cangjieIR.irId,
  runtimePlan: {
    sceneBindings: {
      cameraRig: {
        type: "orbit",
        params: {
          fov: get("/camera/fov/value"),
          height: get("/camera/height/value"),
          // plan-enricher：motion 唯一合法通道（Core IR 无 motion 节点）
          motion: { proto: sheet.motion.prototypes[0], durationMs: sheet.motion.durationMs, amplitude: 0.05 },
        },
      },
      lights: [
        {
          type: "area",
          parameters: {
            azimuth: get("/lighting/keyLight/azimuth/value"),
            elevation: get("/lighting/keyLight/elevation/value"),
            colorTemp: get("/lighting/keyLight/colorTemp/value"),
            ambientRatio: get("/lighting/ambientRatio/value"),
          },
        },
      ],
      materials: [
        {
          bindingId: "mat-0",
          shaderType: "PBR",
          uniforms: {
            baseType: get("/materials/0/baseType/value"),
            roughness: get("/materials/0/roughness/value"),
            metalness: get("/materials/0/metalness/value"),
            wear: get("/materials/0/wear/value"),
            // plan-enricher 预留扩展（开放 record）
            extensions: { normalPerturbation: { type: "MICRO_SCRATCHES", intensity: 0.08, scale: 12.5 } },
            layout: { padding: { t: 64, r: 48, b: 64, l: 48 } },
          },
        },
      ],
    },
    pipeline: {
      rendererType: "WebGL2Renderer",
      toneMapping: "clamp-gamut:REC709_D50",
      postprocessing: ["grain", "vignette"],
    },
  },
  negotiation: { selectedTier: "A", downgrades: [] },
  hashes: { rawIRHash, validatedIRHash, executionPlanHash: "" },
};
plan.hashes.executionPlanHash = sha256(plan.runtimePlan);

writeFileSync(join(here, "validated-params.json"), JSON.stringify(validatedParams, null, 2));
writeFileSync(join(here, "execution-plan.json"), JSON.stringify(plan, null, 2));

console.log(JSON.stringify({
  step: "compile",
  g1: g1.kind,
  requiredPathsChecked: g1.checks.length,
  g2PatchesApplied: appliedPatches,
  unmappedDimensions,
  hashes: plan.hashes,
}, null, 2));
