/**
 * ecosystem/plan-to-react.ts — React 受控组件模板生成（§5.3）
 *
 * 输入：DomComponentPlan（6 个东方美学组件装配计划）。
 * 输出：React 组件 props 接口（TS 字符串）+ 函数组件模板代码（字符串）。
 *
 * 纯代码生成器：依据计划里的 cssVars / state / motion 槽位，
 * 反推出受控组件的 props 形状，并产出可直接落盘的模板源码。
 *
 * @module modules/frontend/runtime/ecosystem/plan-to-react
 */

import type { DomComponentPlan } from "../types/dom-component-plan.ts";

/** React 模板生成结果 */
export interface ReactComponentTemplate {
  /** props 接口名 */
  interfaceName: string;
  /** props 接口 TS 源码（字符串） */
  propsInterface: string;
  /** 函数组件模板源码（字符串） */
  componentCode: string;
}

/** props 字段：name → TS 类型 */
type PropFields = Array<{ name: string; type: string; optional: boolean }>;

/** 把 state 值类型映射为 TS 类型 */
function tsTypeOf(value: string | boolean | number): string {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  // 字符串字面量联合（如 orientation: "horizontal"）
  return `"${value}"`;
}

/**
 * 由装配计划生成单个（根）受控 React 组件模板。
 * 聚合所有组件的 cssVars 与 state 为 props 槽位。
 */
export function planToReact(plan: DomComponentPlan): ReactComponentTemplate {
  const interfaceName = "AestheticSceneProps";

  // 聚合 props：rootCssVars → 字符串；各组件 state → 受控 props
  const fields: PropFields = [
    { name: "planId", type: "string", optional: false },
  ];

  for (const [varName, varValue] of Object.entries(plan.rootCssVars)) {
    // CSS 变量值统一为字符串
    fields.push({ name: cssVarToPropName(varName), type: "string", optional: true });
  }

  // 组件级 state → 受控 props（驼峰命名）
  for (const comp of plan.components) {
    if (!comp.state) continue;
    for (const [key, value] of Object.entries(comp.state)) {
      fields.push({
        name: `${comp.prefix}${capitalize(key)}`,
        type: tsTypeOf(value),
        optional: true,
      });
    }
  }

  // 生成 props 接口
  const propsInterface = [
    `interface ${interfaceName} {`,
    ...fields.map(
      (f) => `  ${f.name}${f.optional ? "?" : ""}: ${f.type};`,
    ),
    "}",
  ].join("\n");

  // 生成组件模板
  const destructure = fields.map((f) => f.name).join(", ");
  const rootVarLines = Object.keys(plan.rootCssVars).length
    ? `  const style = { ${Object.keys(plan.rootCssVars)
        .map((v) => `'${v}': ${cssVarToPropName(v)}`)
        .join(", ")} };`
    : "  const style = {};";

  const componentCode = [
    `import React from "react";`,
    ``,
    propsInterface,
    ``,
    `export default function AestheticScene({ ${destructure} }: ${interfaceName}) {`,
    rootVarLines,
    `  return (`,
    `    <div data-plan-id={planId} data-renderer="${plan.renderer}" style={style}>`,
    `      {/* ${plan.components.length} 个东方美学组件由 plan 装配 */}`,
    `    </div>`,
    `  );`,
    `}`,
  ].join("\n");

  return { interfaceName, propsInterface, componentCode };
}

/** --color-bg → colorBg（驼峰） */
function cssVarToPropName(cssVar: string): string {
  const body = cssVar.replace(/^--/, "");
  const parts = body.split("-");
  return (
    parts[0] +
    parts
      .slice(1)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("")
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
