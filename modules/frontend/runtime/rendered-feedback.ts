/**
 * rendered-feedback.ts — 接口契约 C：渲染结果 → 美学评分闭环
 *
 * 对齐 docs/fusion-architecture.md §2.3 与 §3 接入点⑥。
 *
 * 闭环：生成的前端代码（HTML/CSS/JS 或 DomComponentPlan）
 *   → deserializeGeneratedCode 反序列化为 11 维美学评分
 *   → compareFidelity 与原始 AestheticConstraintSheet 约束对比
 *   → generateFidelityReport 产出 AestheticEvaluationReport（sidecar）
 *
 * 铁律：报告自算 reportHash，但**不进** FROZEN 的 5 元 hashChain；
 * 绝不往 DC FidelityEvaluationResult.metrics 塞任何维度。
 *
 * @module modules/frontend/runtime/rendered-feedback
 */

import { createHash } from "node:crypto";
import type { AestheticConstraintSheet } from "./types/aesthetic-sheet.ts";
import {
  ALL_CANONICAL_DIMENSIONS,
  type CanonicalDimensionId,
} from "./dimension-registry.ts";
import {
  extractSignals,
  reviewAntiCliche,
  type ExtractedSignals,
  type RenderedCode,
} from "./code-reviewer.ts";
import type {
  AestheticEvaluationReport,
  DimensionScore,
  FidelityDimensionEntry,
  DimensionVerdict,
  ImprovementSuggestion,
  RenderedMeasures,
  ReportLinks,
  RuleViolation,
  DimensionWeight,
} from "./types/aesthetic-evaluation-report.ts";

/** 评估错误（空输入 / 形状不符） */
export class FeedbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackError";
  }
}

/** sheet 权重 → 期望目标分（确定性映射，不发明业务判断） */
const EXPECTED_BY_WEIGHT: Record<DimensionWeight, number> = {
  primary: 90,
  secondary: 80,
  tertiary: 70,
  unspecified: 60,
};

/** sheet 权重 → 总体 fidelity 加权系数 */
const WEIGHT_FACTOR: Record<DimensionWeight, number> = {
  primary: 3,
  secondary: 2,
  tertiary: 1,
  unspecified: 1,
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function verdictFromScore(score: number): DimensionVerdict {
  if (score >= 70) return "PASS";
  if (score >= 50) return "INCONCLUSIVE";
  return "FAIL";
}

/* ------------------------------------------------------------------ *
 * 维度评分：信号 + 违例 → 0..100
 * ------------------------------------------------------------------ */

/** 按 category 分组违例计数 */
function groupByCategory(violations: RuleViolation[]): {
  color: RuleViolation[];
  motion: RuleViolation[];
  composition: RuleViolation[];
} {
  const g = { color: [], motion: [], composition: [] } as {
    color: RuleViolation[];
    motion: RuleViolation[];
    composition: RuleViolation[];
  };
  for (const v of violations) g[v.category].push(v);
  return g;
}

function penaltyBySeverity(vs: RuleViolation[]): number {
  let p = 0;
  for (const v of vs) p += v.severity === "P0" ? 30 : 12;
  return p;
}

/**
 * 把提取信号 + 反俗套违例裁决为 12 个 canonical 维度的实测分。
 * philosophy 无静态信号，恒 INCONCLUSIVE（§2.3 不做还原论数值等价）。
 */
export function scoreDimensions(
  signals: ExtractedSignals,
  violations: RuleViolation[],
): DimensionScore[] {
  const g = groupByCategory(violations);
  const out: DimensionScore[] = [];

  const push = (
    dimension: CanonicalDimensionId,
    score: number,
    rationale: string,
    evidenceRefs: string[],
    verdict?: DimensionVerdict,
  ): void => {
    out.push({
      dimension,
      actualScore: Math.round(clamp(score, 0, 100)),
      verdict: verdict ?? verdictFromScore(score),
      rationale,
      evidenceRefs,
    });
  };

  // color：受色彩族违例扣分
  push(
    "color",
    100 - penaltyBySeverity(g.color),
    g.color.length === 0
      ? "色彩未命中违禁清单，饱和度/占比/色温均在约束内"
      : `色彩族命中 ${g.color.length} 条反俗套违例`,
    g.color.map((v) => v.ruleId),
  );

  // motion：受动势族违例扣分
  push(
    "motion",
    100 - penaltyBySeverity(g.motion),
    g.motion.length === 0 ? "动势缓动/时长/呼吸均合规" : `动势族命中 ${g.motion.length} 条违例`,
    g.motion.map((v) => v.ruleId),
  );

  // anti-cliche：全体违例反向计分
  push(
    "anti-cliche",
    100 - violations.length * 18,
    violations.length === 0 ? "未命中任何反俗套规则" : `命中 ${violations.length} 条反俗套规则`,
    violations.map((v) => v.ruleId),
  );

  // void-solid：留白比铁区间
  if (signals.negativeSpaceRatio === null) {
    push("void-solid", 50, "无留白比信号（未提供 DomComponentPlan）", [], "INCONCLUSIVE");
  } else {
    const r = signals.negativeSpaceRatio;
    const inPreferred = r >= 0.42 && r <= 0.55;
    push(
      "void-solid",
      inPreferred ? 90 : r >= 0.35 && r <= 0.65 ? 60 : 30,
      inPreferred
        ? `留白比 ${r.toFixed(2)} 落在虚实 preferred 区间`
        : `留白比 ${r.toFixed(2)} 偏离 preferred 区间`,
      ["--space-leak-mult"],
    );
  }

  // spatial-order / architecture：组件装配完整度
  const assemblyRatio = signals.componentCount > 0 ? signals.componentCount / 6 : 0;
  if (signals.componentCount === 0) {
    push("spatial-order", 50, "无组件装配信号", [], "INCONCLUSIVE");
    push("architecture", 50, "无组件装配信号", [], "INCONCLUSIVE");
  } else {
    const s = Math.round(clamp(assemblyRatio * 100, 0, 100));
    push("spatial-order", s, `装配 ${signals.componentCount}/6 组件，层级序达成度`, ["components[]"]);
    push("architecture", s, `三段式建筑格由 ${signals.componentCount} 组件承载`, ["components[]"]);
  }

  // proportion：留白比已解析视为比例系统就绪
  push(
    "proportion",
    signals.negativeSpaceRatio !== null ? 78 : 50,
    signals.negativeSpaceRatio !== null ? "比例刻度已落到 --space-* 槽位" : "无比例刻度信号",
    signals.negativeSpaceRatio !== null ? ["--space-leak-mult"] : [],
    signals.negativeSpaceRatio !== null ? "PASS" : "INCONCLUSIVE",
  );

  // material：半透材质槽位
  push(
    "material",
    signals.hasMaterialOpacity ? 80 : 50,
    signals.hasMaterialOpacity ? "屏风/博古架半透材质槽位已解析" : "无材质半透信号",
    signals.hasMaterialOpacity ? ["--screen-opacity"] : [],
    signals.hasMaterialOpacity ? "PASS" : "INCONCLUSIVE",
  );

  // light：调色克制（饱和度低）视为光影克制的代理信号
  push(
    "light",
    signals.maxSaturation <= 0.5 ? 75 : 40,
    signals.maxSaturation <= 0.5 ? "调色克制（S<=0.5），符合漏光/天光调性" : "饱和度过高，光影调性失真",
    ["maxSaturation"],
  );

  // interaction：焦点数落在 [1, focalMax]
  if (signals.componentCount === 0) {
    push("interaction", 50, "无交互焦点信号", [], "INCONCLUSIVE");
  } else if (signals.focalPoints === 0) {
    push("interaction", 50, "未检测到匾额题眼焦点", ["plaque"]);
  } else {
    push("interaction", signals.focalPoints <= 1 ? 80 : 40, `检测到 ${signals.focalPoints} 个题眼焦点`, ["plaque"]);
  }

  // temporal：呼吸循环=时间风化感的代理
  push(
    "temporal",
    signals.breathingLoops >= 1 ? 75 : 45,
    signals.breathingLoops >= 1 ? `检测到 ${signals.breathingLoops} 个呼吸循环` : "缺少呼吸循环，时间感缺失",
    ["animation: infinite"],
  );

  // philosophy：语义层，静态不可判，恒 INCONCLUSIVE（§2.3）
  push("philosophy", 50, "哲学/意境层需语义评估，静态反序列化不裁决", [], "INCONCLUSIVE");

  return out;
}

/* ------------------------------------------------------------------ *
 * deserializeGeneratedCode：生成代码 → 11 维评分
 * ------------------------------------------------------------------ */

/**
 * 反序列化生成的前端代码为 12 个 canonical 维度的实测评分。
 *
 * @param code 渲染产物（css/js/html 文本与/或 DomComponentPlan）
 * @param sheet 原始约束单（提供违禁清单/区间，用于信号裁决）
 * @throws FeedbackError 当 code 全空（无任何可分析产物）
 */
export function deserializeGeneratedCode(
  code: RenderedCode,
  sheet: AestheticConstraintSheet,
): DimensionScore[] {
  const hasText = Boolean((code.css ?? "") || (code.html ?? "") || (code.js ?? ""));
  if (!hasText && !code.plan) {
    throw new FeedbackError(
      "[rendered-feedback] deserializeGeneratedCode 需要至少一段 css/html/js 文本或 DomComponentPlan",
    );
  }
  const signals = extractSignals(code);
  const violations = reviewAntiCliche(signals, sheet);
  return scoreDimensions(signals, violations);
}

/* ------------------------------------------------------------------ *
 * compareFidelity：原始约束 vs 实测评分
 * ------------------------------------------------------------------ */

function weightOf(sheet: AestheticConstraintSheet, dim: CanonicalDimensionId): DimensionWeight {
  const hit = sheet.structuralDimensions.find((s) => s.id === dim);
  return hit ? hit.weight : "unspecified";
}

/**
 * 对比原始约束与反序列化实测分，产出维度级 fidelity。
 *
 * @param sheet  原始美学约束单
 * @param scores deserializeGeneratedCode 的产物
 * @returns 12 维全量 fidelity 条目（含 expected/actual/fidelity）
 */
export function compareFidelity(
  sheet: AestheticConstraintSheet,
  scores: DimensionScore[],
): FidelityDimensionEntry[] {
  const byDim = new Map(scores.map((s) => [s.dimension, s]));
  return ALL_CANONICAL_DIMENSIONS.map((dim) => {
    const weight = weightOf(sheet, dim);
    const expected = EXPECTED_BY_WEIGHT[weight];
    const actual = byDim.get(dim)?.actualScore ?? 0;
    const base = byDim.get(dim);
    const verdict = base?.verdict ?? "INCONCLUSIVE";

    let fidelity: number;
    if (weight === "unspecified") {
      // 未声明维度无约束目标：按裁决给分——PASS 高、INCONCLUSIVE 中、FAIL 低
      fidelity = verdict === "PASS" ? 85 : verdict === "FAIL" ? 30 : 50;
    } else {
      // 已声明维度：fidelity = 100 - |期望-实测|，INCONCLUSIVE/FAIL 封顶
      fidelity = Math.round(clamp(100 - Math.abs(expected - actual), 0, 100));
      if (verdict === "INCONCLUSIVE") fidelity = Math.min(fidelity, 50);
      if (verdict === "FAIL") fidelity = Math.min(fidelity, 45);
    }

    return {
      dimension: dim,
      weight,
      expectedScore: expected,
      actualScore: actual,
      fidelityScore: fidelity,
      verdict,
      rationale: base?.rationale ?? "原始约束未声明该维度，按中性目标对比",
    };
  });
}

/* ------------------------------------------------------------------ *
 * generateFidelityReport：sidecar 报告
 * ------------------------------------------------------------------ */

/** generateFidelityReport 输入 */
export interface GenerateReportInput {
  sheet: AestheticConstraintSheet;
  code: RenderedCode;
  links: ReportLinks;
  /** 顾问版本号，默认 chinese-aesthetic-skill@1.0.0 */
  advisorVersion?: string;
}

/** 由违例推导改进建议（回灌 CAS Step3 反俗套复检） */
function buildSuggestions(violations: RuleViolation[]): ImprovementSuggestion[] {
  const dimByCategory: Record<RuleViolation["category"], CanonicalDimensionId> = {
    color: "color",
    motion: "motion",
    composition: "void-solid",
  };
  const seen = new Set<string>();
  const out: ImprovementSuggestion[] = [];
  for (const v of violations) {
    if (seen.has(v.ruleId)) continue;
    seen.add(v.ruleId);
    out.push({
      dimension: dimByCategory[v.category],
      priority: v.severity,
      suggestion: v.description,
    });
  }
  return out;
}

/** canonical JSON（递归排序 key），用于 reportHash 恒等计算 */
function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalStringify).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalStringify(obj[k])).join(",") + "}";
}

/**
 * 计算报告自算 hash。剔除 reportHash 自身，保证同内容恒等。
 * 仅用于 sidecar 去重/校验，**不并入** FROZEN 5 元 hashChain。
 */
export function computeReportHash(report: Omit<AestheticEvaluationReport, "reportHash">): string {
  return createHash("sha256").update(canonicalStringify(report)).digest("hex");
}

/**
 * 生成完整 fidelity 报告（sidecar 0.1.0）。
 *
 * 流程：extractSignals → reviewAntiCliche → scoreDimensions →
 * compareFidelity → 组装报告 → 自算 reportHash。
 *
 * @throws FeedbackError 当 code 全空
 */
export function generateFidelityReport(input: GenerateReportInput): AestheticEvaluationReport {
  const { sheet, code, links } = input;
  const hasText = Boolean((code.css ?? "") || (code.html ?? "") || (code.js ?? ""));
  if (!hasText && !code.plan) {
    throw new FeedbackError("[rendered-feedback] generateFidelityReport 需要可分析的渲染产物");
  }

  const signals = extractSignals(code);
  const violations = reviewAntiCliche(signals, sheet);
  const scores = scoreDimensions(signals, violations);
  const dimensions = compareFidelity(sheet, scores);

  // 总体 fidelity：按 sheet 权重加权
  let num = 0;
  let den = 0;
  for (const d of dimensions) {
    const w = WEIGHT_FACTOR[d.weight];
    num += d.fidelityScore * w;
    den += w;
  }
  const overallFidelity = den > 0 ? Math.round(num / den) : 0;

  const measures: RenderedMeasures = {
    actualPaletteCoveragePct: signals.paletteCoverage,
    actualNegativeSpaceRatio: signals.negativeSpaceRatio,
    forbiddenHexHits: signals.forbiddenHexHits,
    bannedEasingHits: signals.bannedEasingHits,
    breathingLoops: signals.breathingLoops,
    maxSaturation: signals.maxSaturation,
  };

  const suggestions = buildSuggestions(violations);
  const reportId = `${links.testCaseId}@${links.renderHash ?? links.validatedIRHash}`;

  const skeleton: Omit<AestheticEvaluationReport, "reportHash"> = {
    $schema: "https://chinese-aesthetic.local/schemas/aesthetic-evaluation-report.schema.json",
    reportId,
    links,
    advisorVersion: input.advisorVersion ?? "chinese-aesthetic-skill@1.0.0",
    advisorScore: sheet.score,
    overallFidelity,
    measures,
    dimensions,
    violations,
    suggestions,
  };

  return { ...skeleton, reportHash: computeReportHash(skeleton) };
}
