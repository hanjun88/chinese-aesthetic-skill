/**
 * plan-to-react.test.ts — React 组件模板生成测试
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { planToReact } from "../plan-to-react.ts";
import type { DomComponentPlan } from "../../types/dom-component-plan.ts";

function makePlan(): DomComponentPlan {
  return {
    planId: "plan-1",
    testCaseId: "tc-1",
    links: { rawIRHash: "r", validatedIRHash: "v", executionPlanHash: "e" },
    renderer: "WebGL2Renderer",
    downgrades: [],
    rootCssVars: { "--color-bg": "#EDEAE4", "--color-accent": "#B8860B" },
    components: [
      {
        kind: "moon-gate",
        prefix: "mg",
        order: 1,
        cssVars: {},
        state: { open: false },
        drivenBy: ["void-solid", "interaction"],
      },
      {
        kind: "scroll-panel",
        prefix: "sp",
        order: 2,
        cssVars: {},
        state: { expanded: true },
        drivenBy: ["motion"],
      },
    ],
  };
}

test("props 接口聚合 rootCssVars 与组件 state，类型正确", () => {
  const t = planToReact(makePlan());
  assert.equal(t.interfaceName, "AestheticSceneProps");
  // rootCssVars → 驼峰 props
  assert.match(t.propsInterface, /colorBg\?: string;/);
  assert.match(t.propsInterface, /colorAccent\?: string;/);
  // 组件 state → 受控 props（前缀驼峰）
  assert.match(t.propsInterface, /mgOpen\?: boolean;/);
  assert.match(t.propsInterface, /spExpanded\?: boolean;/);
  // planId 必填
  assert.match(t.propsInterface, /planId: string;/);
});

test("组件模板可作为源码字符串输出，含渲染通道与组件数", () => {
  const t = planToReact(makePlan());
  assert.match(t.componentCode, /export default function AestheticScene/);
  assert.match(t.componentCode, /data-renderer="WebGL2Renderer"/);
  assert.match(t.componentCode, /import React from "react"/);
  // 引用了 propsInterface
  assert.match(t.componentCode, /: AestheticSceneProps/);
});

test("空 rootCssVars 时 style 为空对象，不报错", () => {
  const plan = { ...makePlan(), rootCssVars: {} };
  const t = planToReact(plan);
  assert.match(t.componentCode, /const style = \{\};/);
  assert.match(t.propsInterface, /planId: string;/);
});
