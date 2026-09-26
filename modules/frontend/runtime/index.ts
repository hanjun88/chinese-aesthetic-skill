/**
 * runtime/index.ts — 融合运行时层统一导出入口
 *
 * 暴露三产品融合 P0 闭环的全部纯函数：
 *   - dimension-registry  维度双轨 SSOT
 *   - severity-map        severity 四级翻译
 *   - sheet-to-cangjie    接口契约 A：美学约束 → Cangjie IR
 *   - plan-to-dom         接口契约 B：执行计划 → DOM 组件计划
 *   - rendered-feedback   接口契约 C：渲染结果 → 美学评分闭环（sidecar）
 *
 * @module modules/frontend/runtime
 */

export * from "./dimension-registry.ts";
export * from "./severity-map.ts";
export * from "./sheet-to-cangjie.ts";
export * from "./plan-to-dom.ts";
export { MapperError, type PlanToDomInput } from "./plan-to-dom.ts";
export * from "./rendered-feedback.ts";
export { FeedbackError, type GenerateReportInput } from "./rendered-feedback.ts";
export {
  extractSignals,
  reviewAntiCliche,
  hexToHsl,
  normalizeHex,
  type RenderedCode,
  type ExtractedSignals,
} from "./code-reviewer.ts";

export type {
  AestheticConstraintSheet,
  SheetColorEntry,
  SheetViolation,
  SheetStructuralDimension,
} from "./types/aesthetic-sheet.ts";
export type {
  SheetToCangjieResult,
  SheetToCangjieOptions,
} from "./types/cangjie.ts";
export type {
  DomComponentPlan,
  DomComponentInstance,
  ComponentKind,
  ComponentPrefix,
  RendererChannel,
  ResolvedMotion,
} from "./types/dom-component-plan.ts";
export type {
  CangjieRawDesignIR,
  CangjieEstimatedParameter,
  CangjieConstraint,
  AdvisorGrammarRule,
  RuntimeExecutionPlan,
} from "./types/dc-types.ts";
export type {
  AestheticEvaluationReport,
  ReportLinks,
  RenderedMeasures,
  FidelityDimensionEntry,
  DimensionScore,
  DimensionVerdict,
  DimensionWeight,
  RuleViolation,
  ImprovementSuggestion,
} from "./types/aesthetic-evaluation-report.ts";
