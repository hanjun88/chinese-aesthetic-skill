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

import type {
  ComponentKind,
  DomComponentPlan,
} from "../types/dom-component-plan.ts";

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

/* ================================================================== */
/* 富生态 §5.3 扩展：6 个东方美学 React 组件代码生成                    */
/* ================================================================== */

/** 富生态调色板（hex） */
export interface ReactPalette {
  /** 页面底色 */
  bg: string;
  /** 墨色（主文字） */
  ink: string;
  /** 点缀色（印章/强调） */
  accent: string;
  /** 纸面（卡片表面） */
  paper: string;
}

/** 富生态 React 计划输入 */
export interface ReactEcosystemConfig {
  style: "song-elegant" | "chan-minimal" | "tang-ornate" | (string & {});
  palette: ReactPalette;
  /** 只生成指定组件；缺省 = 全部 6 个 */
  kinds?: ComponentKind[];
}

/** 单个生成出的 React 组件 */
export interface ReactComponentDef {
  kind: ComponentKind;
  /** 组件名（PascalCase） */
  name: string;
  /** props 接口 TS 源码 */
  propsInterface: string;
  /** 完整函数组件 TSX 源码（含 import） */
  componentCode: string;
  /** 使用示例源码 */
  usage: string;
}

/** 富生态 React 组件包 */
export interface ReactComponents {
  components: ReactComponentDef[];
  /** 桶文件 re-export 源码 */
  barrel: string;
}

/** kind → 组件 PascalCase 名 + aria role */
const KIND_META: Record<ComponentKind, { name: string; role: string; cn: string }> = {
  "moon-gate": { name: "MoonGateNav", role: "navigation", cn: "月洞门导航" },
  "scroll-panel": { name: "ScrollCard", role: "region", cn: "卷轴卡片" },
  "folding-screen": { name: "FoldingScreen", role: "region", cn: "折叠屏风" },
  "lattice-window": { name: "LatticeWindow", role: "img", cn: "花窗" },
  plaque: { name: "PlaqueTitle", role: "heading", cn: "匾额标题" },
  "curio-shelf": { name: "CurioShelf", role: "list", cn: "博古架" },
};

const ALL_KINDS: ComponentKind[] = [
  "moon-gate",
  "scroll-panel",
  "folding-screen",
  "lattice-window",
  "plaque",
  "curio-shelf",
];

/** 公共 props 接口（所有组件一致） */
function propsInterfaceOf(name: string): string {
  return [
    `interface ${name}Props {`,
    `  children?: React.ReactNode;`,
    `  variant?: "default" | "alt";`,
    `  size?: "sm" | "md" | "lg";`,
    `  colorScheme?: "light" | "dark";`,
    `  className?: string;`,
    `  style?: React.CSSProperties;`,
    `}`,
  ].join("\n");
}

/** 尺寸 → 像素映射（内联样式注入用） */
const SIZE_MAP = { sm: 220, md: 320, lg: 440 } as const;

/** 生成单个组件的完整 TSX 代码字符串 */
function buildComponent(kind: ComponentKind, palette: ReactPalette): ReactComponentDef {
  const meta = KIND_META[kind];
  const name = meta.name;

  const body = componentBody(kind, name, meta.role, palette);

  const componentCode = [
    `import React from "react";`,
    ``,
    propsInterfaceOf(name),
    ``,
    body,
  ].join("\n");

  const usage = [
    `import ${name} from "./${name}";`,
    ``,
    `export default function Demo() {`,
    `  return (`,
    `    <${name} variant="default" size="md" colorScheme="light">`,
    `      {/* ${meta.cn}：在此放入内容 */}`,
    `    </${name}>`,
    `  );`,
    `}`,
  ].join("\n");

  return { kind, name, propsInterface: propsInterfaceOf(name), componentCode, usage };
}

/** 按 kind 生成组件函数体（内联 CSS-in-JS，无外部 CSS 依赖） */
function componentBody(
  kind: ComponentKind,
  name: string,
  role: string,
  palette: ReactPalette,
): string {
  const { bg, ink, accent, paper } = palette;
  const sizeObj = `({ sm: ${SIZE_MAP.sm}, md: ${SIZE_MAP.md}, lg: ${SIZE_MAP.lg} } as const)[size]`;

  switch (kind) {
    case "moon-gate":
      return [
        `export default function ${name}(`,
        `  { children, variant = "default", size = "md", colorScheme = "light", className, style, ...rest }: ${name}Props,`,
        `) {`,
        `  const dim = ${sizeObj};`,
        `  const dark = colorScheme === "dark";`,
        `  const root: React.CSSProperties = {`,
        `    width: dim, height: dim, borderRadius: "50%", position: "relative",`,
        `    border: \`1px solid ${ink}\`, background: dark ? "${ink}" : "${paper}",`,
        `    display: "flex", alignItems: "center", justifyContent: "center",`,
        `    overflow: "hidden", cursor: "pointer", boxShadow: "0 8px 30px rgba(0,0,0,0.12)",`,
        `    ...style,`,
        `  };`,
        `  return (`,
        `    <div role="${role}" aria-label="月洞门导航" data-variant={variant}`,
        `      className={className} style={root} {...rest}>`,
        `      <div style={{ padding: 24, textAlign: "center", color: dark ? "${paper}" : "${ink}" }}>`,
        `        {children}`,
        `      </div>`,
        `    </div>`,
        `  );`,
        `}`,
      ].join("\n");

    case "scroll-panel":
      return [
        `export default function ${name}(`,
        `  { children, variant = "default", size = "md", colorScheme = "light", className, style, ...rest }: ${name}Props,`,
        `) {`,
        `  const w = ${sizeObj};`,
        `  const dark = colorScheme === "dark";`,
        `  const root: React.CSSProperties = {`,
        `    width: w, padding: "20px 28px", background: dark ? "${ink}" : "${paper}",`,
        `    borderLeft: \`4px solid ${accent}\`, borderRight: \`4px solid ${accent}\`,`,
        `    color: dark ? "${paper}" : "${ink}", boxShadow: "0 4px 18px rgba(0,0,0,0.10)",`,
        `    ...style,`,
        `  };`,
        `  return <div role="${role}" aria-label="卷轴卡片" data-variant={variant} className={className} style={root} {...rest}>{children}</div>;`,
        `}`,
      ].join("\n");

    case "folding-screen":
      return [
        `export default function ${name}(`,
        `  { children, variant = "default", size = "md", colorScheme = "light", className, style, ...rest }: ${name}Props,`,
        `) {`,
        `  const w = ${sizeObj};`,
        `  const dark = colorScheme === "dark";`,
        `  const root: React.CSSProperties = {`,
        `    width: w, display: "flex", gap: 2, padding: 8, background: dark ? "${ink}" : "${paper}",`,
        `    border: \`1px solid ${ink}\`, color: dark ? "${paper}" : "${ink}", ...style,`,
        `  };`,
        `  const panel: React.CSSProperties = { flex: 1, background: dark ? "${paper}22" : "${bg}", padding: 16 };`,
        `  return (`,
        `    <div role="${role}" aria-label="折叠屏风" data-variant={variant} className={className} style={root} {...rest}>`,
        `      <div style={panel}>{children}</div>`,
        `      <div style={panel} />`,
        `    </div>`,
        `  );`,
        `}`,
      ].join("\n");

    case "lattice-window":
      return [
        `export default function ${name}(`,
        `  { children, variant = "default", size = "md", colorScheme = "light", className, style, ...rest }: ${name}Props,`,
        `) {`,
        `  const d = ${sizeObj};`,
        `  const bar: React.CSSProperties = { position: "absolute", background: "${ink}", opacity: 0.35 };`,
        `  const root: React.CSSProperties = {`,
        `    width: d, height: d, borderRadius: 8, position: "relative", overflow: "hidden",`,
        `    background: \`linear-gradient(135deg, ${paper}, ${bg})\`, ...style,`,
        `  };`,
        `  return (`,
        `    <div role="${role}" aria-label="花窗" data-variant={variant} className={className} style={root} {...rest}>`,
        `      <div style={{ ...bar, left: "33%", top: 0, bottom: 0, width: 1 }} />`,
        `      <div style={{ ...bar, left: "66%", top: 0, bottom: 0, width: 1 }} />`,
        `      <div style={{ ...bar, top: "33%", left: 0, right: 0, height: 1 }} />`,
        `      <div style={{ ...bar, top: "66%", left: 0, right: 0, height: 1 }} />`,
        `      {children}`,
        `    </div>`,
        `  );`,
        `}`,
      ].join("\n");

    case "plaque":
      return [
        `export default function ${name}(`,
        `  { children, variant = "default", size = "md", colorScheme = "light", className, style, ...rest }: ${name}Props,`,
        `) {`,
        `  const fontSize = ({ sm: 20, md: 28, lg: 40 } as const)[size];`,
        `  const dark = colorScheme === "dark";`,
        `  const root: React.CSSProperties = {`,
        `    display: "inline-flex", alignItems: "center", gap: 12,`,
        `    fontFamily: "Songti SC, serif", fontSize, letterSpacing: "0.15em",`,
        `    color: dark ? "${paper}" : "${ink}", ...style,`,
        `  };`,
        `  const seal: React.CSSProperties = {`,
        `    width: fontSize * 1.2, height: fontSize * 1.2, background: "${accent}",`,
        `    borderRadius: 4, color: "${paper}", display: "flex", alignItems: "center",`,
        `    justifyContent: "center", fontSize: fontSize * 0.6,`,
        `  };`,
        `  return (`,
        `    <h1 role="${role}" aria-level={1} aria-label="匾额标题" data-variant={variant} className={className} style={root} {...rest}>`,
        `      <span>{children}</span>`,
        `      <span style={seal} aria-hidden>印</span>`,
        `    </h1>`,
        `  );`,
        `}`,
      ].join("\n");

    case "curio-shelf":
    default:
      return [
        `export default function ${name}(`,
        `  { children, variant = "default", size = "md", colorScheme = "light", className, style, ...rest }: ${name}Props,`,
        `) {`,
        `  const w = ${sizeObj};`,
        `  const dark = colorScheme === "dark";`,
        `  const root: React.CSSProperties = {`,
        `    width: w, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,`,
        `    padding: 16, background: dark ? "${ink}" : "${paper}",`,
        `    border: \`1px solid ${accent}\`, ...style,`,
        `  };`,
        `  const cell: React.CSSProperties = {`,
        `    aspectRatio: "1", background: dark ? "${paper}22" : "${bg}",`,
        `    border: \`1px solid ${ink}44\`, display: "flex", alignItems: "center", justifyContent: "center",`,
        `    color: dark ? "${paper}" : "${ink}",`,
        `  };`,
        `  return (`,
        `    <div role="${role}" aria-label="博古架" data-variant={variant} className={className} style={root} {...rest}>`,
        `      {React.Children.toArray(children).slice(0, 9).map((child, i) => (`,
        `        <div key={i} style={cell}>{child}</div>`,
        `      ))}`,
        `    </div>`,
        `  );`,
        `}`,
      ].join("\n");
  }
}

/**
 * 富生态主入口：把调色板 + 风格投影为 6 个自包含 React 组件源码字符串。
 * 纯函数：只产出字符串，不做任何运行时副作用。
 */
export function planToReactComponents(config: ReactEcosystemConfig): ReactComponents {
  const kinds = config.kinds ?? ALL_KINDS;
  const components = kinds.map((k) => buildComponent(k, config.palette));
  const barrel = [
    `// 由 planToReactComponents 生成（风格：${config.style}）`,
    ...components.map((c) => `export { default as ${c.name} } from "./${c.name}";`),
  ].join("\n");
  return { components, barrel };
}
