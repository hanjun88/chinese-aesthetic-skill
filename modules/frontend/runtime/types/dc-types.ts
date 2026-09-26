/**
 * dc-types.ts — Design-Compiler 类型的本地 type-only 镜像
 *
 * 本文件物理镜像 design-compiler（分支 feat/aesthetic-integration）中以下模块的形状：
 *   - compiler-intent/types.ts      → CangjieRawDesignIR / CangjieEstimatedParameter / CangjieConstraint
 *   - compiler-intent/pointer-map.ts → 参数 path 约定（节点级，无 /value 后缀）
 *   - compiler-core/contracts.ts    → RuntimeExecutionPlan / sceneBindings 开放 Record / HASH FLOW CONTRACT
 *   - compiler-core/pipeline-runner.ts → hashChain 与 executionPlan 平级、不内嵌
 *
 * 纪律（见 docs/fusion-architecture.md §0）：
 *   - 这里只做类型锁定，**不 import DC 源码**，避免运行时耦合；
 *   - 任何形状变更必须与 DC FROZEN schema（raw-design-ir / execution-plan）对齐；
 *   - 运行时字段均为开放 Record 的地方（sceneBindings.*.uniforms/params）保持 Record<string, unknown>；
 *   - FROZEN ABI：DC 有而本镜像缺的字段一律**以可选字段补齐并标注来源**；
 *     本镜像多余而 DC 没有的字段一律标 **@deprecated 保留**，不删除、不破坏既有消费方。
 *
 * @module modules/frontend/runtime/types/dc-types
 */

// ============================================================================
// Cangjie 参数来源（对齐 compiler-intent/types.ts CangjieSourceType / CangjieParameterSource）
// ============================================================================

/** DC CangjieSourceType 枚举（compiler-intent/types.ts） */
export type CangjieSourceType =
  | "literature"
  | "film-lexicon"
  | "master-cluster"
  | "expert-judgment"
  | "dataset-prior"
  | "derived";

/** Cangjie 参数的来源（对齐 CangjieParameterSource） */
export interface CangjieSource {
  /** 来源类型；保留 | string 以兼容本地模拟历史取值（observation / grammar-rule 等） */
  type: CangjieSourceType | string;
  /** 来源引用（规则 id / 证据文件路径） */
  ref: string;
  /** 原文引用（可选） */
  quote?: string;
  /** DC: CangjieParameterSource.corpusId — Cangjie 语料库文献 id */
  corpusId?: string;
}

// ============================================================================
// Cangjie 参数校准（对齐 CangjieCalibrationMethod / Status / CangjieParameterCalibration）
// ============================================================================

/** DC CangjieCalibrationMethod 枚举 */
export type CangjieCalibrationMethod =
  | "expert-calibrated"
  | "dataset-empirical-priors"
  | "uncalibrated";

/** DC CangjieCalibrationStatus 枚举 */
export type CangjieCalibrationStatus = "PRODUCTION" | "EXPERIMENTAL" | "DEPRECATED";

/** Cangjie 参数校准（对齐 CangjieParameterCalibration） */
export interface CangjieCalibration {
  /** 校准方法；保留 | string 兼容本地历史取值（skill-10d-engine 等） */
  method: CangjieCalibrationMethod | string;
  /** PRODUCTION=可进 G1；EXPERIMENTAL=仅留 lowConfidenceWarnings */
  status: CangjieCalibrationStatus;
  /** DC: calibratedBy — 校准人或校准过程标识 */
  calibratedBy?: string;
  /** DC: calibratedAt — 校准时间（date-time） */
  calibratedAt?: string;
  /** DC: variance — Master 样本集聚类方差 */
  variance?: number;
}

// ============================================================================
// 四级 range（对齐 CangjieParameterRange / estimated-parameter.schema.json）
// ============================================================================

/** 四级 range */
export interface CangjieRange {
  /** 理想区间（零补丁） */
  preferred?: [number, number];
  /** 软告警区间（阻尼平滑） */
  warning?: [number, number];
  /** 硬区间（G2 replace 拉回） */
  hard?: [number, number];
  /** 低于此值 = 美学致命阈值 */
  fatalBelow?: number;
}

/** 焦点保护（对齐 compiler-intent/types.ts CangjieFocalProtection） */
export interface CangjieFocalProtection {
  /** 最大允许焦点位移 D_focal，默认 0.05 */
  maxFocalDisplacement?: number;
  /** 冲突时规则介入权重降低比例（0-1） */
  weightReductionOnConflict?: number;
}

/** 参数级溯源链（对齐 CangjieParameterProvenance） */
export interface CangjieParameterProvenance {
  /** ontology.json 中的概念节点 */
  ontologyNode?: string;
  /** heuristics.json 中的工程策略 id */
  heuristicId?: string;
  /** assertions.json 中的断言 id */
  assertionId?: string;
  /** 完整溯源向量 */
  chain?: string[];
}

// ============================================================================
// 扁平估计参数（对齐 compiler-intent/types.ts CangjieEstimatedParameter）
// ============================================================================

/** 扁平估计参数 */
export interface CangjieEstimatedParameter {
  /**
   * DC: CangjieEstimatedParameter.paramId — 全库唯一参数 id（^[a-z][a-z0-9-]*$）。
   * 本地模拟层可缺省（normalizeIntent 时由 DC 侧补齐），故为可选。
   */
  paramId?: string;
  /**
   * JSON Pointer **节点路径**（对齐 compiler-intent/pointer-map.ts POINTER_MAP）。
   * 例："/color/dominant"、"/materials/0/baseType" —— 指向参数节点本身，
   * **不带 /value 后缀**（旧 CAS 写法 "/color/dominant/value" 已废弃）。
   */
  path: string;
  /** 参数值（hex 字符串 / number / [x,y] / 字符串枚举） */
  value: unknown;
  /** 物理单位（DC CangjieEstimatedParameter.unit 为可选） */
  unit?: string;
  /** 0..1，G1 地板 0.6；requiredPaths 要求 ≥0.85 */
  confidence: number;
  /**
   * @deprecated DC Cangjie 层（compiler-intent/types.ts）参数**不携带 status 字段**；
   * status 在 normalizeIntent 之后落到 Core IR RawEstimatedParameter.status。
   * 保留仅为本地模拟向后兼容，勿在新代码中新增依赖。
   */
  status?: "estimated" | "observed" | "grammar-derived" | "unknown";
  source: CangjieSource;
  calibration: CangjieCalibration;
  range?: CangjieRange;
  /** DC: focalProtection */
  focalProtection?: CangjieFocalProtection;
  /** DC: 参数级 provenance 溯源链 */
  provenance?: CangjieParameterProvenance;
  /**
   * @deprecated 本地模拟残留的扁平证据数组；DC 对应 provenance.chain。
   */
  evidence?: string[];
}

// ============================================================================
// Cangjie 约束（对齐 compiler-intent/types.ts CangjieConstraint*）
// ============================================================================

/** DC CangjieConstraintType 枚举 */
export type CangjieConstraintType =
  | "range"
  | "mutual-exclusion"
  | "dependency"
  | "proportion"
  | "threshold";

/** Cangjie 约束（violations 转写） */
export interface CangjieConstraint {
  /** DC: CangjieConstraint.constraintId — 全库唯一约束 id（本地模拟可缺省） */
  constraintId?: string;
  /** DC: CangjieConstraintType；保留 | string 兼容本地历史取值 */
  type: CangjieConstraintType | string;
  /** JSON Pointer 节点路径 */
  targetPath: string;
  /** 约束条件（DC 为开放 Record） */
  condition: Record<string, unknown>;
  assertionId?: string;
}

// ============================================================================
// 概念节点（对齐 CangjieConcept）
// ============================================================================

/** 概念节点 */
export interface CangjieConcept {
  name: string;
  ontologyPath: string;
  /** DC: CangjieConcept.definition — 概念定义 */
  definition?: string;
  /** DC: CangjieConcept.sourceText — 概念出处原文 */
  sourceText?: string;
}

/**
 * Cangjie 扁平层设计 IR（蒸馏层形状，喂 compiler-intent/normalizeIntent）。
 * 注意：这不是 contracts.ts 的嵌套 RawDesignIR，而是上游蒸馏产物。
 */
export interface CangjieRawDesignIR {
  irId: string;
  concept: CangjieConcept;
  intent: {
    statement: string;
    heuristicIds: string[];
    /** DC: CangjieIntent.priority 可选，默认 P1 */
    priority?: "P0" | "P1" | "P2";
  };
  parameters: CangjieEstimatedParameter[];
  /** DC: CangjieRawDesignIR.constraints 可选 */
  constraints?: CangjieConstraint[];
  /**
   * 本地模拟 provenance（开放 Record）。
   * DC CangjieProvenance 形状为 { corpusSources[], distillationMethod, verification? }；
   * 融合层在其上附加 sheetId / capturedAt / attributionStatement / aestheticScore 等本地元数据。
   */
  provenance: Record<string, unknown>;
  distillerVersion: string;
  /** DC: grammarVersion 可选 */
  grammarVersion?: string;
  /** DC: CangjieMetadata（additionalProperties: true） */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// G2 GrammarRule 追加规则（对齐 config/grammar-rules.json 条目；CAS 本地扩展）
// ============================================================================

/** G2 GrammarRule 追加规则 */
export interface AdvisorGrammarRule {
  /** 形如 CA-ADVISOR-06-JIEJING / CA-TABOO-01-GUOCHAO */
  ruleId: string;
  principle: string;
  /** 硬枚举四值（ScoringEngine 权重和=1.0，本期不扩第 5 类） */
  category: "composition" | "lighting" | "color" | "materials";
  /** JSON Pointer 节点路径 */
  targetPath: string;
  condition: { operator: string; value: unknown };
  mutation: { op: "replace" | "test" | "none"; value?: unknown };
  severity: "P0_CRITICAL" | "P1_WARNING" | "P2_INFO";
  reason: string;
}

// ============================================================================
// RuntimeExecutionPlan — G3 CapabilityNegotiator 产物
// （对齐 compiler-core/contracts.ts RuntimeExecutionPlan + HASH FLOW CONTRACT）
// ============================================================================

/** DC ExecutionTier 枚举（contracts.ts） */
export type DcExecutionTier = "TIER_A" | "TIER_B" | "TIER_C" | "TIER_D" | "NONE";
/** DC ResolutionStatus 枚举（contracts.ts） */
export type DcResolutionStatus = "ACCEPTED" | "DEGRADED" | "BLOCKED_ENV" | "BLOCKED_DATA";

/**
 * Plan 因果链哈希（本地模拟注入）。
 *
 * @deprecated DC HASH FLOW CONTRACT（contracts.ts §1-4）明确：RuntimeExecutionPlan
 * **内部严禁携带任何自身 hash 字段**；hashChain 是 pipeline-runner.ts 中与
 * executionPlan **平级**的独立对象。本字段仅为本地模拟便捷注入，真实 DC plan
 * 经融合层进入时缺省（undefined），消费方须经 resolvePlanHashes 安全读取。
 */
export interface PlanHashChain {
  rawIRHash: string;
  validatedIRHash: string;
  executionPlanHash: string;
}

/**
 * RuntimeExecutionPlan — G3 CapabilityNegotiator 产物（对齐 execution-plan.schema.json）。
 * sceneBindings 的 uniforms/params/parameters 均为开放 Record，融合层在此缝隙注入扩展。
 *
 * DC 真实形状（contracts.ts）：{ $schema, negotiation, runtimePlan{pipeline,sceneBindings}, assetManifest }。
 * 本镜像对 DC 缺字段一律以可选补齐（标注来源），对本地残留字段标 @deprecated 保留。
 */
export interface RuntimeExecutionPlan {
  /**
   * @deprecated DC 真实 RuntimeExecutionPlan 无 planId 字段（其标识为 $schema）。
   * 本地模拟残留，保留仅向后兼容；新代码勿依赖。
   */
  planId: string;

  /** DC: RuntimeExecutionPlan.$schema */
  $schema?: string;

  negotiation: {
    /** DC: negotiation.resolutionStatus */
    resolutionStatus?: DcResolutionStatus;
    /** 对齐 contracts.ts ExecutionTier：DC 真实产物为 "TIER_A" 等 */
    selectedTier: DcExecutionTier;
    /** DC: negotiation.requirements */
    requirements?: {
      requiredCapabilities: string[];
      preferredCapabilities: string[];
    };
    /** DC: negotiation.capabilities */
    capabilities?: Record<string, boolean | number>;
    downgrades: Array<{ feature: string; reason: string; fallbackStrategy: string }>;
    /** DC: negotiation.blockingFailures */
    blockingFailures?: string[];
  };

  runtimePlan: {
    sceneBindings: {
      cameraRig: { type: string; params: Record<string, unknown> };
      lights: Array<{ type: string; parameters: Record<string, unknown> }>;
      materials: Array<{ bindingId: string; shaderType: string; uniforms: Record<string, unknown> }>;
    };
    pipeline: {
      rendererType: string;
      toneMapping: string;
      /** DC: pipeline.colorSpace — "srgb-linear" | "srgb" */
      colorSpace?: "srgb-linear" | "srgb" | string;
      /** 开放 string[]，可追加 "grain" / "vignette" / "clamp-gamut:..." */
      postprocessing: string[];
    };
  };

  /** DC: assetManifest { shaders, geometryBuffers, textures } */
  assetManifest?: {
    shaders: string[];
    geometryBuffers: string[];
    textures: string[];
  };

  /**
   * 因果链哈希（本地模拟用 sha256 摘要字符串）。
   *
   * DC 契约下本字段**可缺省（undefined）**——真实 plan 不内嵌 hashes。
   * 消费方必须安全访问（可选链 / resolvePlanHashes），禁止直接解构/展开。
   */
  hashes?: PlanHashChain;
}
