/**
 * dom-component-plan.ts — 契约 B 的输出形状（RuntimeExecutionPlan → 6 个 HTML 组件）
 *
 * 形状对齐 docs/fusion-architecture.md §2.2。
 *
 * @module modules/frontend/runtime/types/dom-component-plan
 */

import type { CanonicalDimensionId } from "../dimension-registry.ts";

/** 6 个东方美学组件 */
export type ComponentKind =
  | "moon-gate"
  | "scroll-panel"
  | "folding-screen"
  | "lattice-window"
  | "plaque"
  | "curio-shelf";

/** 类名前缀（对齐 components/README §0） */
export type ComponentPrefix = "mg" | "sp" | "fs" | "lw" | "pl" | "cs";

/** 五原型动效解析结果 */
export interface ResolvedMotion {
  prototype: "cloud" | "water" | "smoke" | "wind" | "light";
  /** 对应 tokens.css --dur-* 的毫秒值 */
  durationMs: number;
  easingToken: "--ease-cloud" | "--ease-water" | "--ease-smoke" | "--ease-wind" | "--ease-breath";
  amplitude: number;
}

/** 单个组件的装配计划 */
export interface DomComponentInstance {
  kind: ComponentKind;
  prefix: ComponentPrefix;
  /** 进入序列次序：门→卷→屏→窗→匾→架 */
  order: number;
  /** 写进该组件作用域的 CSS 变量 */
  cssVars: Record<string, string>;
  motion?: ResolvedMotion;
  /** 初始状态类（is-open / is-revealed / data-orientation …） */
  state?: Record<string, string | boolean | number>;
  /** 该组件消费了哪些 canonical 维度（回溯源） */
  drivenBy: CanonicalDimensionId[];
}

/** 渲染通道（DC negotiation.selectedTier → FE 投影） */
export type RendererChannel = "WebGL2Renderer" | "WebGL1Renderer" | "CSS3D" | "DOMCanvas";

/** 完整 DOM 装配计划 */
export interface DomComponentPlan {
  planId: string;
  testCaseId: string;
  /** 因果链接，回指 DC 主链 */
  links: { rawIRHash: string; validatedIRHash: string; executionPlanHash: string };
  renderer: RendererChannel;
  downgrades: Array<{ feature: string; reason: string; fallbackStrategy: string }>;
  components: DomComponentInstance[];
  /** 全局 :root 覆盖（tokens.css 为基线，只覆盖被美学决策改的槽位） */
  rootCssVars: Record<string, string>;
}
