/**
 * render.js — 端到端演示步骤 3：RuntimeExecutionPlan → DomComponentPlan（契约 B）
 *
 * 用法: node render.js
 * 输入: execution-plan.json + validated-params.json   输出: dom-plan.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { planToDom } from "../../modules/frontend/runtime/plan-to-dom.ts";

const here = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(here, "execution-plan.json"), "utf8"));
const validatedParams = JSON.parse(readFileSync(join(here, "validated-params.json"), "utf8"));

const domPlan = planToDom({ plan, validatedParams, testCaseId: "TC-SHUYUAN-01" });
writeFileSync(join(here, "dom-plan.json"), JSON.stringify(domPlan, null, 2));

console.log(JSON.stringify({
  step: "render",
  renderer: domPlan.renderer,
  rootCssVars: domPlan.rootCssVars,
  components: domPlan.components.map((c) => ({ kind: c.kind, order: c.order, motion: c.motion?.prototype ?? null, state: c.state })),
}, null, 2));
