/**
 * sheet-to-cangjie.ts — 接口契约 A：美学约束单 → CangjieRawDesignIR
 *
 * 纯函数：AestheticConstraintSheet → { cangjieIR, advisorRulePack, unmappedDimensions, aestheticScore }。
 * 对齐 docs/fusion-architecture.md §2.1：
 *   - 15 条映射规则（PARAMETER_PATH_MAPPINGS，展开为 21 条参数 path）；
 *   - 7 条 requiredPaths 硬约束（confidence≥0.85 && calibration.status=PRODUCTION）；
 *   - P0 violation → range.fatalBelow + CangjieConstraint{type:threshold}；
 *   - P1 violation → range.hard:[min,max]；
 *   - aestheticScore 只进结果 metadata，绝不写进参数 confidence；
 *   - 时间戳由调用方传入，禁 new Date()，保证 1000× 哈希恒等。
 *
 * 路径约定（对齐 DC compiler-intent/pointer-map.ts POINTER_MAP）：
 *   - 所有产出 path 均为**节点级 JSON Pointer**（如 "/color/dominant"），
 *     指向参数节点本身，**不带 /value 后缀**（旧 CAS 写法 "/color/dominant/value" 已废弃）。
 *
 * @module modules/frontend/runtime/sheet-to-cangjie
 */

import type {
  AdvisorGrammarRule,
  CangjieConstraint,
  CangjieEstimatedParameter,
  CangjieRawDesignIR,
  RuntimeExecutionPlan,
} from "./types/dc-types.ts";
import type { AestheticConstraintSheet, SheetColorEntry } from "./types/aesthetic-sheet.ts";
import type { SheetToCangjieOptions, SheetToCangjieResult } from "./types/cangjie.ts";
import {
  DIMENSION_TO_TARGET,
  type CanonicalDimensionId,
} from "./dimension-registry.ts";

/* ------------------------------------------------------------------ *
 * 常量：7 条 requiredPaths（G1 必过门槛，见 fusion-arch §2.1 / §4.4）
 * ------------------------------------------------------------------ */

/** 7 条 G1 requiredPaths：缺置信度即 BLOCKED_DATA */
export const REQUIRED_PATHS: ReadonlyArray<string> = [
  "/composition/focalPoint",
  "/composition/negativeSpaceRatio",
  "/camera/fov",
  "/lighting/keyLight/azimuth",
  "/lighting/keyLight/elevation",
  "/color/dominant",
  "/materials/0/baseType",
];

/** requiredPaths 最低置信度 */
export const REQUIRED_CONFIDENCE_FLOOR = 0.85;
/** G1 全局置信度地板 */
export const G1_CONFIDENCE_FLOOR = 0.6;

/** G1 requiredPaths 校验结果（纯数据，不抛错） */
export interface G1RequiredPathsReport {
  /** params 中完全缺失的 requiredPath */
  missing: string[];
  /** 命中但 confidence<0.85 或 calibration.status!=PRODUCTION 的 requiredPath */
  lowConfidence: string[];
}

/**
 * G1 前置：7 条 requiredPaths 硬约束校验（纯函数，供测试与主入口共用）。
 *
 * 对每条 requiredPath：
 *   - params 中无任何 path 以其为前缀 → 计入 `missing`；
 *   - 命中但 confidence < REQUIRED_CONFIDENCE_FLOOR 或
 *     calibration.status !== "PRODUCTION" → 计入 `lowConfidence`。
 *
 * 不抛错、不修改入参；调用方据此决定是否抛 BLOCKED_DATA。
 */
export function validateRequiredPaths(params: CangjieEstimatedParameter[]): G1RequiredPathsReport {
  const missing: string[] = [];
  const lowConfidence: string[] = [];
  for (const req of REQUIRED_PATHS) {
    const hit = params.find((p) => p.path.startsWith(req));
    if (!hit) {
      missing.push(req);
    } else if (hit.confidence < REQUIRED_CONFIDENCE_FLOOR || hit.calibration.status !== "PRODUCTION") {
      lowConfidence.push(req);
    }
  }
  return { missing, lowConfidence };
}

/** BLOCKED_DATA 错误的形状（带机器可读 code / missing / lowConfidence） */
export interface BlockedDataError extends Error {
  code: "BLOCKED_DATA";
  missing: string[];
  lowConfidence: string[];
}

/**
 * G1 前置校验的抛错版本：requiredPaths 缺失或置信度不足时抛 BLOCKED_DATA。
 * 主入口与测试共用，保证测试覆盖到真正的抛错分支。
 * @throws {BlockedDataError} 当 missing 或 lowConfidence 非空
 */
export function assertRequiredPaths(params: CangjieEstimatedParameter[]): asserts params {
  const { missing, lowConfidence } = validateRequiredPaths(params);
  if (missing.length > 0 || lowConfidence.length > 0) {
    const err = new Error(
      `[sheet-to-cangjie] G1 BLOCKED_DATA: requiredPaths 校验失败 ` +
        `missing=[${missing.join(", ")}] lowConfidence=[${lowConfidence.join(", ")}]`,
    ) as BlockedDataError;
    err.code = "BLOCKED_DATA";
    err.missing = missing;
    err.lowConfidence = lowConfidence;
    throw err;
  }
}

/* ------------------------------------------------------------------ *
 * plan.hashes 安全访问（DC HASH FLOW CONTRACT 降级）
 * ------------------------------------------------------------------ */

/**
 * plan.hashes 缺省时的空降级对象（冻结，防误写）。
 * @see resolvePlanHashes
 */
export const EMPTY_PLAN_HASHES: Readonly<Record<string, string>> = Object.freeze({});

/**
 * 安全读取 G3 RuntimeExecutionPlan 的因果链哈希。
 *
 * DC HASH FLOW CONTRACT（compiler-core/contracts.ts §1-4 + pipeline-runner.ts）规定：
 * RuntimeExecutionPlan **内部严禁携带任何自身 hash 字段**；hashChain 是 PipelineOutput
 * 上与 executionPlan **平级**的独立对象。因此经融合层注入的真实 DC plan 缺省 hashes
 * （undefined）。本函数统一降级为空对象，避免 `{...plan.hashes}` / 解构时崩溃。
 *
 * @param plan 任意 RuntimeExecutionPlan（可能缺省 hashes）
 * @returns 存在则原样返回；否则返回冻结的空对象
 */
export function resolvePlanHashes(
  plan: Pick<RuntimeExecutionPlan, "hashes">,
): Record<string, string> {
  return plan.hashes ?? (EMPTY_PLAN_HASHES as Record<string, string>);
}

/* ------------------------------------------------------------------ *
 * 15 条映射规则（展开为 21 条参数 path；fusion-arch §2.1 确定性映射表）
 * ------------------------------------------------------------------ */

export interface PathMapping {
  /** sheet 来源描述（人读） */
  source: string;
  /** 目标 Cangjie 节点路径（parameters[].path，节点级，无 /value 后缀） */
  targetPath: string;
  unit: string;
  confidence: number;
  /** 是否 requiredPath */
  required: boolean;
  /** 驱动该参数的 canonical 维度 */
  dimension: CanonicalDimensionId;
}

/**
 * 15 条映射规则（materials 与 camera 各为一条映射规则、展开为多 path，
 * 与架构文档 §2.1 表格行一一对应；contrastRatio / intensity 为
 * DC POINTER_MAP 必选路径的兜底派生值）。
 * 路径均为节点级（对齐 DC POINTER_MAP），无 /value 后缀。
 */
export const PARAMETER_PATH_MAPPINGS: PathMapping[] = [
  { source: "colorSystem.palette[dominant]", targetPath: "/color/dominant", unit: "hex", confidence: 0.9, required: true, dimension: "color" },
  { source: "colorSystem.palette[secondary]", targetPath: "/color/secondary", unit: "hex", confidence: 0.9, required: false, dimension: "color" },
  { source: "colorSystem.palette[accent]", targetPath: "/color/accent", unit: "hex", confidence: 0.9, required: false, dimension: "color" },
  { source: "WCAG 保守兜底=4.5", targetPath: "/color/contrastRatio", unit: "ratio", confidence: 0.8, required: false, dimension: "color" },
  { source: "proportion.voidSolidRatio→ratio", targetPath: "/composition/negativeSpaceRatio", unit: "ratio", confidence: 0.88, required: true, dimension: "void-solid" },
  { source: "spatial.axis=strict", targetPath: "/composition/symmetry", unit: "ratio", confidence: 0.85, required: false, dimension: "spatial-order" },
  { source: "spatial.hierarchyLevelsMin", targetPath: "/composition/depthLayerCount", unit: "scalar", confidence: 0.8, required: false, dimension: "architecture" },
  { source: "lighting.primarySource→azimuth", targetPath: "/lighting/keyLight/azimuth", unit: "degrees", confidence: 0.85, required: true, dimension: "light" },
  { source: "lighting.primarySource→elevation", targetPath: "/lighting/keyLight/elevation", unit: "degrees", confidence: 0.85, required: true, dimension: "light" },
  { source: "lighting.timeSetting→colorTemp", targetPath: "/lighting/keyLight/colorTemp", unit: "kelvin", confidence: 0.82, required: false, dimension: "light" },
  { source: "主光强度兜底=1.0", targetPath: "/lighting/keyLight/intensity", unit: "scalar", confidence: 0.8, required: false, dimension: "light" },
  { source: "lighting.lightDarkRatio", targetPath: "/lighting/ambientRatio", unit: "ratio", confidence: 0.8, required: false, dimension: "light" },
  { source: "material.role=dominant→{baseType,roughness,metalness,wear}", targetPath: "/materials/0/{baseType,roughness,metalness,wear}", unit: "scalar", confidence: 0.85, required: true, dimension: "material" },
  { source: "proportion.focalPointsMax=1", targetPath: "/composition/focalPoint", unit: "vector2", confidence: 0.85, required: true, dimension: "interaction" },
  { source: "camera 默认→{fov,shotSize,angle,height}", targetPath: "/camera/{fov,shotSize,angle,height}", unit: "degrees/scalar", confidence: 0.85, required: true, dimension: "spatial-order" },
];

/* ------------------------------------------------------------------ *
 * 确定性派生表（sheet 枚举 → DC 物理参数值）
 * ------------------------------------------------------------------ */

/** primarySource → keyLight 方位角/高度角（deg） */
const LIGHT_SOURCE_ANGLES: Record<string, { azimuth: number; elevation: number }> = {
  skylight: { azimuth: 0, elevation: 78 }, // 天光自顶
  leaked: { azimuth: 45, elevation: 30 }, // 漏光自窗侧高位
  side: { azimuth: 80, elevation: 40 }, // 侧光
  bounced: { azimuth: 180, elevation: 18 }, // 反射光低位
  moonlight: { azimuth: 315, elevation: 60 }, // 月光冷月
};

/** timeSetting → 色温（kelvin） */
const TIME_COLOR_TEMP: Record<string, number> = {
  dawn: 4200,
  noon: 6500,
  dusk: 3200,
  night: 7200,
  cloudy: 5600,
};

/** mood → 主材质 baseType / PBR 包浆 */
const MOOD_MATERIAL: Record<string, { baseType: string; roughness: number; metalness: number; wear: number }> = {
  "song-elegant": { baseType: "aged-paper-wood", roughness: 0.72, metalness: 0.04, wear: 0.32 },
  "chan-zen": { baseType: "raw-plaster-wood", roughness: 0.85, metalness: 0.02, wear: 0.45 },
  "tang-tang": { baseType: "lacquered-wood", roughness: 0.55, metalness: 0.12, wear: 0.2 },
  "night-feast": { baseType: "dark-lacquer-bronze", roughness: 0.48, metalness: 0.22, wear: 0.28 },
  "misty-blue": { baseType: "mist-silk-stone", roughness: 0.8, metalness: 0.03, wear: 0.38 },
};

/** violation.ruleId → 对应的 Cangjie 节点路径（节点级，无 /value 后缀；未登记的落到负空间比） */
const VIOLATION_RULE_PATH: Record<string, string> = {
  saturation: "/color/dominant",
  "pure-red": "/color/dominant",
  "bright-gold": "/color/accent",
  "pure-black": "/color/secondary",
  "accent-area": "/color/accent",
  "main-area": "/color/dominant",
  "void-solid": "/composition/negativeSpaceRatio",
  symmetry: "/composition/symmetry",
  "light-ratio": "/lighting/ambientRatio",
};

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

/** 把 "7:5" 这样的比例字符串解析为 [a, b]；解析失败抛错 */
function parseRatioPair(ratio: string): [number, number] {
  const m = /^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/.exec(ratio);
  if (!m) throw new Error(`[sheet-to-cangjie] 无法解析比例字符串: "${ratio}"`);
  return [Number(m[1]), Number(m[2])];
}

/** 查 palette 中某角色的色卡 */
function pickColor(palette: SheetColorEntry[], role: SheetColorEntry["role"]): SheetColorEntry {
  const found = palette.find((c) => c.role === role);
  if (!found) throw new Error(`[sheet-to-cangjie] palette 缺少角色: ${role}`);
  return found;
}

/** 构造一条 Cangjie 参数 */
function makeParam(
  path: string,
  value: unknown,
  unit: string,
  confidence: number,
  dimension: CanonicalDimensionId,
  opts: SheetToCangjieOptions,
  extra?: Partial<CangjieEstimatedParameter>,
): CangjieEstimatedParameter {
  return {
    path,
    value,
    unit,
    confidence,
    status: "estimated",
    source: { type: "expert-judgment", ref: `chinese-aesthetic-skill:${dimension}` },
    calibration: { method: "skill-10d-engine", status: "PRODUCTION" },
    evidence: [dimension],
    ...extra,
  };
}

/* ------------------------------------------------------------------ *
 * violations → range + constraints
 * ------------------------------------------------------------------ */

function buildViolationArtifacts(
  sheet: AestheticConstraintSheet,
): { constraints: CangjieConstraint[]; rangePatches: Map<string, { fatalBelow?: number; hard?: [number, number] }> } {
  const constraints: CangjieConstraint[] = [];
  const rangePatches = new Map<string, { fatalBelow?: number; hard?: [number, number] }>();

  for (const v of sheet.violations) {
    // 节点级路径（无 /value 后缀），既用于 rangePatches 索引，也作为 constraint.targetPath
    const targetPath = VIOLATION_RULE_PATH[v.ruleId] ?? "/composition/negativeSpaceRatio";
    if (v.severity === "P0") {
      // P0 → fatalBelow + threshold 约束（BLOCK）
      const existing = rangePatches.get(targetPath) ?? {};
      existing.fatalBelow = 0.0; // P0 致命阈值：该值不允许出现（色值类用黑名单表达）
      rangePatches.set(targetPath, existing);
      constraints.push({
        type: "threshold",
        targetPath,
        condition: { operator: "not-in", value: sheet.colorSystem.hardFailHex },
        assertionId: v.ruleId,
      });
    } else {
      // P1 → hard:[min,max]（REPAIR）
      const existing = rangePatches.get(targetPath) ?? {};
      existing.hard = [0.3, 0.7];
      rangePatches.set(targetPath, existing);
    }
  }

  return { constraints, rangePatches };
}

/* ------------------------------------------------------------------ *
 * advisorRulePack（接入点②）
 * ------------------------------------------------------------------ */

function buildAdvisorRulePack(sheet: AestheticConstraintSheet): AdvisorGrammarRule[] {
  const rules: AdvisorGrammarRule[] = [];

  // 1) 反俗套否决规则：违禁 hex 出现即 REJECTED_ERROR（op:test，P0_CRITICAL）
  sheet.antiCliche.forbidden.forEach((token, i) => {
    rules.push({
      ruleId: `CA-TABOO-${String(i + 1).padStart(2, "0")}-${token.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`,
      principle: "反俗套",
      category: "color",
      targetPath: "/color/dominant",
      condition: { operator: "in", value: sheet.colorSystem.hardFailHex },
      mutation: { op: "test", value: "#SHOULD_NOT_APPEAR" },
      severity: "P0_CRITICAL",
      reason: `advisor: ${token}（高饱和原色=国潮贴图感），禁止`,
    });
  });

  // 2) 借景/留白建议：负空间比过低时 G2 replace 到 0.45（REPAIR）
  rules.push({
    ruleId: "CA-ADVISOR-06-JIEJING",
    principle: "借景",
    category: "composition",
    targetPath: "/composition/negativeSpaceRatio",
    condition: { operator: "<", value: 0.35 },
    mutation: { op: "replace", value: 0.45 },
    severity: "P1_WARNING",
    reason: "advisor: 借景需连续负空间（计白当黑）",
  });

  // 3) 光影：主光过顶时压 elevation（REPAIR）
  rules.push({
    ruleId: "CA-ADVISOR-07-LOUGUANG",
    principle: "漏光",
    category: "lighting",
    targetPath: "/lighting/keyLight/elevation",
    condition: { operator: ">", value: 70 },
    mutation: { op: "replace", value: 60 },
    severity: "P1_WARNING",
    reason: "advisor: 过顶光生硬，压到 60° 形成斜漏光",
  });

  // ASCII 升序排序（PATCH DETERMINISM：输入即哈希，这里仍按 ruleId 排一次保证幂等）
  rules.sort((a, b) => (a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0));
  return rules;
}

/* ------------------------------------------------------------------ *
 * 主入口
 * ------------------------------------------------------------------ */

/**
 * 把美学约束单编译为 DC 原生 CangjieRawDesignIR。
 *
 * @throws 当 7 条 requiredPaths 缺失或置信度不足时，抛 BLOCKED_DATA 错误（G1 前置校验）
 */
export function sheetToCangjie(
  sheet: AestheticConstraintSheet,
  opts: SheetToCangjieOptions,
): SheetToCangjieResult {
  const [voidA, voidB] = parseRatioPair(sheet.proportion.voidSolidRatio);
  // void:solid = 7:5 → 负空间比 = void/(void+solid)
  const negativeSpaceRatio = Number((voidA / (voidA + voidB)).toFixed(4));

  const [lightPart, darkPart] = parseRatioPair(sheet.lighting.lightDarkRatio);
  const ambientRatio = Number((darkPart / (lightPart + darkPart)).toFixed(4));

  const dominant = pickColor(sheet.colorSystem.palette, "dominant");
  const secondary = pickColor(sheet.colorSystem.palette, "secondary");
  const accent = pickColor(sheet.colorSystem.palette, "accent");

  const angles = LIGHT_SOURCE_ANGLES[sheet.lighting.primarySource] ?? LIGHT_SOURCE_ANGLES.skylight;
  const colorTemp = TIME_COLOR_TEMP[sheet.lighting.timeSetting] ?? 5600;
  const mat = MOOD_MATERIAL[sheet.mood] ?? MOOD_MATERIAL["song-elegant"];

  const symmetry = sheet.spatial.axis === "strict" ? 1 : sheet.spatial.axis === "offset" ? 0.5 : 0.15;

  const params: CangjieEstimatedParameter[] = [];
  const push = (p: CangjieEstimatedParameter) => params.push(p);

  // —— 4 条色彩（节点级路径；contrastRatio 为 WCAG 保守兜底值）——
  push(makeParam("/color/dominant", dominant.hex, "hex", 0.9, "color", opts, { range: { preferred: [0.6, 0.7] } }));
  push(makeParam("/color/secondary", secondary.hex, "hex", 0.9, "color", opts));
  push(makeParam("/color/accent", accent.hex, "hex", 0.9, "color", opts, { range: { preferred: [0.02, 0.08] } }));
  push(makeParam("/color/contrastRatio", 4.5, "ratio", 0.8, "color", opts));

  // —— 4 条构图（节点级路径）——
  push(makeParam("/composition/negativeSpaceRatio", negativeSpaceRatio, "ratio", 0.88, "void-solid", opts, { range: { preferred: [0.42, 0.55], hard: [0.35, 0.42], fatalBelow: 0.3 } }));
  push(makeParam("/composition/symmetry", symmetry, "ratio", 0.85, "spatial-order", opts));
  push(makeParam("/composition/depthLayerCount", sheet.spatial.hierarchyLevelsMin, "scalar", 0.8, "architecture", opts));
  push(makeParam("/composition/focalPoint", [0.5, 0.5], "vector2", 0.85, "interaction", opts));

  // —— 5 条光影（节点级路径；intensity 为主光强度兜底值）——
  push(makeParam("/lighting/keyLight/azimuth", angles.azimuth, "degrees", 0.85, "light", opts));
  push(makeParam("/lighting/keyLight/elevation", angles.elevation, "degrees", 0.85, "light", opts, { range: { hard: [20, 70] } }));
  push(makeParam("/lighting/keyLight/colorTemp", colorTemp, "kelvin", 0.82, "light", opts));
  push(makeParam("/lighting/keyLight/intensity", 1.0, "scalar", 0.8, "light", opts));
  push(makeParam("/lighting/ambientRatio", ambientRatio, "ratio", 0.8, "light", opts));

  // —— 4 条材质（/materials/0/* 节点级路径）——
  push(makeParam("/materials/0/baseType", mat.baseType, "scalar", 0.85, "material", opts));
  push(makeParam("/materials/0/roughness", mat.roughness, "scalar", 0.8, "material", opts));
  push(makeParam("/materials/0/metalness", mat.metalness, "scalar", 0.8, "material", opts));
  push(makeParam("/materials/0/wear", mat.wear, "scalar", 0.8, "material", opts));

  // —— 4 条相机（节点级路径）——
  push(makeParam("/camera/fov", 35, "degrees", 0.85, "spatial-order", opts));
  push(makeParam("/camera/shotSize", "medium", "scalar", 0.8, "spatial-order", opts));
  push(makeParam("/camera/angle", 0, "degrees", 0.8, "spatial-order", opts));
  push(makeParam("/camera/height", 1.6, "scalar", 0.8, "spatial-order", opts));

  // —— violations → constraints + range 补丁 ——
  const { constraints, rangePatches } = buildViolationArtifacts(sheet);
  for (const p of params) {
    const patch = rangePatches.get(p.path);
    if (patch) p.range = { ...(p.range ?? {}), ...patch };
  }

  // —— G1 前置：7 条 requiredPaths 硬约束校验（失败抛 BLOCKED_DATA）——
  assertRequiredPaths(params);

  // —— unmappedDimensions：无 Core IR 落点的维度 ——
  const unmappedDimensions: CanonicalDimensionId[] = (
    sheet.structuralDimensions.map((d) => d.id) as CanonicalDimensionId[]
  ).filter((id) => DIMENSION_TO_TARGET[id]?.category === "runtime" || DIMENSION_TO_TARGET[id]?.category === "sidecar");

  const cangjieIR: CangjieRawDesignIR = {
    irId: opts.irId ?? `ir-${sheet.sheetId}`,
    concept: {
      name: sheet.mood,
      ontologyPath: `/eastern-aesthetic/${sheet.mood}`,
    },
    intent: {
      statement: sheet.designBrief,
      heuristicIds: sheet.structuralDimensions.map((d) => d.id),
      priority: "P1",
    },
    parameters: params,
    constraints,
    provenance: {
      sheetId: sheet.sheetId,
      capturedAt: opts.capturedAt, // 时间戳仅入 provenance，G1 会从 rawIRHash 预映像中排除
      attributionStatement: sheet.attributionStatement,
      // aestheticScore 绝不写进任何参数 confidence；只在 provenance 与返回值 metadata 出现
      aestheticScore: sheet.score,
    },
    distillerVersion: opts.advisorVersion,
    grammarVersion: "grammar-rules@1.0.0",
  };

  return {
    cangjieIR,
    advisorRulePack: buildAdvisorRulePack(sheet),
    unmappedDimensions,
    aestheticScore: sheet.score,
  };
}
