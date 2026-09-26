/**
 * plan-to-react.eco.test.ts — React 富生态（6 组件代码生成）测试
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planToReactComponents,
  planToReact,
} from "../plan-to-react.ts";
import type { ReactEcosystemConfig } from "../plan-to-react.ts";
import type { DomComponentPlan } from "../../types/dom-component-plan.ts";

const config: ReactEcosystemConfig = {
  style: "song-elegant",
  palette: { bg: "#EDEAE4", ink: "#2C3E50", accent: "#C93B3E", paper: "#F5F2EA" },
};

test("① 基本转换：默认生成全部 6 个组件，每个含 code/props/usage", () => {
  const out = planToReactComponents(config);
  assert.equal(out.components.length, 6);
  for (const c of out.components) {
    assert.ok(c.componentCode.length > 50);
    assert.match(c.propsInterface, /Props \{/);
    assert.match(c.usage, new RegExp(`<${c.name}`));
  }
});

test("② 每个组件是完整 TSX：含 import React、默认导出、role/aria 无障碍属性", () => {
  const out = planToReactComponents(config);
  for (const c of out.components) {
    assert.match(c.componentCode, /import React from "react"/);
    assert.match(c.componentCode, new RegExp(`export default function ${c.name}`));
    assert.match(c.componentCode, /role="/);
    assert.match(c.componentCode, /aria-label/);
  }
});

test("③ kinds 过滤：只生成指定组件；barrel 仅含这些", () => {
  const out = planToReactComponents({ ...config, kinds: ["moon-gate", "plaque"] });
  assert.equal(out.components.length, 2);
  assert.deepEqual(out.components.map((c) => c.kind), ["moon-gate", "plaque"]);
  assert.match(out.barrel, /MoonGateNav/);
  assert.match(out.barrel, /PlaqueTitle/);
  assert.ok(!out.barrel.includes("CurioShelf"));
});

test("④ 调色板注入：组件源码内含 hex 颜色与 variant/size/colorScheme props", () => {
  const out = planToReactComponents(config);
  const gate = out.components.find((c) => c.kind === "moon-gate")!;
  assert.match(gate.componentCode, /#2C3E50/); // ink
  assert.match(gate.propsInterface, /variant\?: "default" \| "alt"/);
  assert.match(gate.propsInterface, /size\?: "sm" \| "md" \| "lg"/);
  assert.match(gate.propsInterface, /colorScheme\?: "light" \| "dark"/);
  assert.match(gate.propsInterface, /children\?: React.ReactNode/);
});

test("⑤ 不同风格：唐韵暗色系注入不同 hex；组件数恒为 6", () => {
  const tang = planToReactComponents({
    style: "tang-ornate",
    palette: { bg: "#2A1E1A", ink: "#F0E6D2", accent: "#C93B3E", paper: "#3A2A22" },
  });
  assert.equal(tang.components.length, 6);
  const shelf = tang.components.find((c) => c.kind === "curio-shelf")!;
  assert.match(shelf.componentCode, /#2A1E1A/);
  assert.match(shelf.componentCode, /#3A2A22/);
});

test("⑥ API 兼容：旧 planToReact(DomComponentPlan) 行为不变", () => {
  const plan: DomComponentPlan = {
    planId: "plan-1",
    testCaseId: "tc-1",
    links: { rawIRHash: "r", validatedIRHash: "v", executionPlanHash: "e" },
    renderer: "WebGL2Renderer",
    downgrades: [],
    rootCssVars: { "--color-bg": "#EDEAE4" },
    components: [
      { kind: "moon-gate", prefix: "mg", order: 1, cssVars: {}, state: { open: false }, drivenBy: ["void-solid"] },
    ],
  };
  const t = planToReact(plan);
  assert.equal(t.interfaceName, "AestheticSceneProps");
  assert.match(t.componentCode, /export default function AestheticScene/);
});
