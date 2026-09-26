/**
 * aesthetic-evaluation-report.ts — 契约 C 的 sidecar 报告类型
 *
 * 形状对齐 docs/fusion-architecture.md §2.3（契约 C rendered-feedback）与
 * §3 接入点⑥（Evaluation sidecar）。
 *
 * 铁律（§2.3）：
 *   - 绝不把 11 维塞进 DC 的 FidelityEvaluationResult.metrics（FROZEN 1.0.0，
 *     additionalProperties:false，semantic-gate.ts 正则锁死 metricRef）；
 *   - 本报告是**旁挂文档**，仅靠 testCaseId + inputHash + validatedIRHash +
 *     renderHash 链接主链；
 *   - 自算 reportHash，但**不进** FROZEN 的 5 元 hashChain。
 *
 * @module modules/frontend/runtime/types/aesthetic-evaluation-report
 */

import type { CanonicalDimensionId } from "../dimension-registry.ts";

/**
 * 维度裁决三态（§2.3：保留 INCONCLUSIVE，不做还原论数值等价）。
 * 静态反序列化无法判定的维度（如 philosophy 语义层）走 INCONCLUSIVE。
 */
export type DimensionVerdict = "PASS" | "FAIL" | "INCONCLUSIVE";

/** 反俗套规则分类（与 code-reviewer 的 lint 规则一一对应） */
export type AntiClicheCategory = "color" | "motion" | "composition";

/**
 * 生成代码反序列化出的单维度实测分。
 * 这是"渲染/生成结果在该维度上实际达成了多少"，不是 sheet 的目标分。
 */
export interface DimensionScore {
  dimension: CanonicalDimensionId;
  /** 实测分 0-100 */
  actualScore: number;
  verdict: DimensionVerdict;
  /** 中文裁决理由 */
  rationale: string;
  /** 证据引用（CSS 选择器 / 组件 prefix / 规则 id） */
  evidenceRefs: string[];
}

/** sheet.structuralDimensions 的权重（未登记维度记 unspecified） */
export type DimensionWeight = "primary" | "secondary" | "tertiary" | "unspecified";

/**
 * 维度级 fidelity 对比条目：原始约束目标 vs 生成代码实测。
 */
export interface FidelityDimensionEntry {
  dimension: CanonicalDimensionId;
  weight: DimensionWeight;
  /** 原始约束目标分（由 sheet.structuralDimensions.weight 确定性推导） */
  expectedScore: number;
  /** 生成代码反序列化实测分（来自 DimensionScore.actualScore） */
  actualScore: number;
  /**
   * 维度级 fidelity 0-100 = clamp(100 - |expected - actual|, 0, 100)。
   * 越接近期望分越高；实测远低于期望则 fidelity 塌陷。
   */
  fidelityScore: number;
  verdict: DimensionVerdict;
  rationale: string;
}

/** 反俗套 lint 命中的一条违例 */
export interface RuleViolation {
  /** 形如 CA-TABOO-COLOR-02-SATURATION */
  ruleId: string;
  category: AntiClicheCategory;
  severity: "P0" | "P1";
  /** 中文描述 */
  description: string;
  /** 命中位置（CSS 属性 / 组件 prefix / 选择器） */
  location: string;
  /** 命中证据（命中的 hex / 关键字 / 数值） */
  evidence: string;
}

/** 面向回灌 CAS Step3 反俗套复检的改进建议 */
export interface ImprovementSuggestion {
  dimension: CanonicalDimensionId;
  priority: "P0" | "P1";
  /** 中文可执行建议 */
  suggestion: string;
}

/**
 * sidecar 因果链接。
 * 与 FROZEN FidelityEvaluationResult 对齐，但本结构**不参与** 5 元 hashChain。
 */
export interface ReportLinks {
  /** 回指 DC 主链测试用例 */
  testCaseId: string;
  /** 链接主链（rawIR 摘要） */
  inputHash: string;
  validatedIRHash: string;
  executionPlanHash: string;
  /** 渲染产物摘要（可选，浏览器采样后补） */
  renderHash?: string;
}

/**
 * 渲染后实测采样信号（静态分析等价于浏览器 computed style 采样）。
 * 对齐 §2.3 renderedMeasures。
 */
export interface RenderedMeasures {
  /** 实测主/辅/点缀占比（role → 0..1） */
  actualPaletteCoveragePct: Record<string, number>;
  /** 实测留白比 0..1（null 表示无信号 → INCONCLUSIVE） */
  actualNegativeSpaceRatio: number | null;
  /** 生成 CSS 里 grep 到的违禁 hex */
  forbiddenHexHits: string[];
  /** 生成 CSS 里 grep 到的违禁缓动（bounce/back/spin/linear/particle） */
  bannedEasingHits: string[];
  /** 呼吸循环计数（>=1 为佳） */
  breathingLoops: number;
  /** 实测最高饱和度 S（0..1，铁律 <=0.5） */
  maxSaturation: number;
}

/**
 * AestheticEvaluationReport — 契约 C 的 sidecar 文档（独立版本 0.1.0）。
 *
 * 生命周期：渲染产物 → deserializeGeneratedCode → compareFidelity →
 * generateFidelityReport。产出后靠 links 挂在 FROZEN 评估旁，回灌 CAS
 * Step3 反俗套复检，形成闭环。
 */
export interface AestheticEvaluationReport {
  /** sidecar schema id（独立版本，不与 DC FROZEN schema 同目录） */
  $schema: string;
  /** 报告 id（确定性：通常 = `${testCaseId}@${renderHash}`） */
  reportId: string;
  /** 因果链接（不进 FROZEN hashChain） */
  links: ReportLinks;
  /** 顾问版本号，形如 chinese-aesthetic-skill@1.0.0 */
  advisorVersion: string;
  /** 来自 sheet 的原始美学分 0-100（仅 metadata，不写进参数 confidence） */
  advisorScore: number;
  /** 总体 fidelity 0-100（按 sheet 权重加权） */
  overallFidelity: number;
  /** 渲染后实测采样 */
  measures: RenderedMeasures;
  /** 11 维（canonical 全量）fidelity 对比 */
  dimensions: FidelityDimensionEntry[];
  /** 反俗套违例清单 */
  violations: RuleViolation[];
  /** 改进建议（回灌反俗套复检） */
  suggestions: ImprovementSuggestion[];
  /**
   * 本报告自算 hash（canonical JSON 摘要，剔除 reportHash 自身）。
   * 仅用于 sidecar 自身去重/校验，**绝不**并入 FROZEN 的 5 元 hashChain。
   */
  reportHash: string;
}
