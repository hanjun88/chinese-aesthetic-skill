/**
 * dc-types.ts — Design-Compiler 类型的本地 type-only 镜像
 *
 * 本文件物理镜像 design-compiler（master 1.0.0-rc）中以下模块的形状：
 *   - compiler-intent/types.ts  → CangjieRawDesignIR / CangjieEstimatedParameter / CangjieConstraint
 *   - compiler-core/contracts.ts → RuntimeExecutionPlan / sceneBindings 开放 Record
 *
 * 纪律（见 docs/fusion-architecture.md §0）：
 *   - 这里只做类型锁定，**不 import DC 源码**，避免运行时耦合；
 *   - 任何形状变更必须与 DC FROZEN schema（raw-design-ir / execution-plan）对齐；
 *   - 运行时字段均为开放 Record 的地方（sceneBindings.*.uniforms/params）保持 Record<string, unknown>。
 *
 * @module modules/frontend/runtime/types/dc-types
 */

/** Cangjie 参数的来源（对齐 compiler-intent CangjieSource） */
export interface CangjieSource {
  /** 来源类型：expert-judgment=美学引擎裁决 / observation / grammar-rule */
  type: "expert-judgment" | "observation" | "grammar-rule" | string;
  /** 来源引用（规则 id / 证据文件路径） */
  ref: string;
  /** 原文引用（可选） */
  quote?: string;
}

/** Cangjie 参数校准状态（对齐 CangjieCalibration） */
export interface CangjieCalibration {
  /** 校准方法描述 */
  method: string;
  /** PRODUCTION=可进 G1；EXPERIMENTAL=仅留 lowConfidenceWarnings */
  status: "PRODUCTION" | "EXPERIMENTAL" | "DEPRECATED";
}

/** 四级 range（对齐 estimated-parameter.schema.json 的 range） */
export interface CangjieRange {
  /** 理想区间 */
  preferred?: [number, number];
  /** 软告警区间 */
  warning?: [number, number];
  /** 硬区间（G2 replace 拉回） */
  hard?: [number, number];
  /** 低于此值 = 美学致命阈值（P0 软门禁只写 diagnostics） */
  fatalBelow?: number;
}

/** 扁平估计参数（对齐 CangjieEstimatedParameter） */
export interface CangjieEstimatedParameter {
  /** JSON Pointer，如 "/color/dominant/value" */
  path: string;
  /** 参数值（hex 字符串 / number / [x,y] / 字符串枚举） */
  value: unknown;
  /** 单位 */
  unit: "hex" | "ratio" | "scalar" | "degrees" | "kelvin" | "vector2" | string;
  /** 0..1，G1 地板 0.6；requiredPaths 要求 ≥0.85 */
  confidence: number;
  /** G1 净化后的状态标记 */
  status: "estimated" | "observed" | "grammar-derived" | "unknown";
  source: CangjieSource;
  calibration: CangjieCalibration;
  range?: CangjieRange;
  /** 证据引用（canonical 维度 id 等） */
  evidence?: string[];
}

/** Cangjie 约束（violations 转写） */
export interface CangjieConstraint {
  type: "threshold" | "range";
  targetPath: string;
  condition: { operator: string; value: unknown };
  assertionId?: string;
}

/** 概念节点（对齐 CangjieConcept） */
export interface CangjieConcept {
  name: string;
  ontologyPath: string;
}

/**
 * Cangjie 扁平层设计 IR（蒸馏层形状，喂 compiler-intent/normalizeIntent）。
 * 注意：这不是 contracts.ts 的嵌套 RawDesignIR，而是上游蒸馏产物。
 */
export interface CangjieRawDesignIR {
  irId: string;
  concept: CangjieConcept;
  intent: { statement: string; heuristicIds: string[]; priority: number };
  parameters: CangjieEstimatedParameter[];
  constraints: CangjieConstraint[];
  provenance: Record<string, unknown>;
  distillerVersion: string;
  grammarVersion: string;
}

/** G2 GrammarRule 追加规则（对齐 config/grammar-rules.json 条目） */
export interface AdvisorGrammarRule {
  /** 形如 CA-ADVISOR-06-JIEJING / CA-TABOO-01-GUOCHAO */
  ruleId: string;
  principle: string;
  /** 硬枚举四值（ScoringEngine 权重和=1.0，本期不扩第 5 类） */
  category: "composition" | "lighting" | "color" | "materials";
  targetPath: string;
  condition: { operator: string; value: unknown };
  mutation: { op: "replace" | "test" | "none"; value?: unknown };
  severity: "P0_CRITICAL" | "P1_WARNING" | "P2_INFO";
  reason: string;
}

/**
 * RuntimeExecutionPlan — G3 CapabilityNegotiator 产物（对齐 execution-plan.schema.json）。
 * sceneBindings 的 uniforms/params/parameters 均为开放 Record，融合层在此缝隙注入扩展。
 */
export interface RuntimeExecutionPlan {
  planId: string;
  runtimePlan: {
    sceneBindings: {
      cameraRig: { type: string; params: Record<string, unknown> };
      lights: Array<{ type: string; parameters: Record<string, unknown> }>;
      materials: Array<{ bindingId: string; shaderType: string; uniforms: Record<string, unknown> }>;
    };
    pipeline: {
      rendererType: string;
      toneMapping: string;
      /** 开放 string[]，可追加 "grain" / "vignette" / "clamp-gamut:..." */
      postprocessing: string[];
    };
  };
  negotiation: {
    selectedTier: "A" | "B" | "C";
    downgrades: Array<{ feature: string; reason: string; fallbackStrategy: string }>;
  };
  /** 因果链（本地模拟用 sha256 摘要字符串） */
  hashes: { rawIRHash: string; validatedIRHash: string; executionPlanHash: string };
}
