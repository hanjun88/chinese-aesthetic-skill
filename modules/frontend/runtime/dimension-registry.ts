/**
 * dimension-registry.ts — 维度双轨统一 SSOT
 *
 * 三套命名并存（见 docs/fusion-architecture.md §4.1）：
 *   - legacy 10 维（skill.yaml / guidelines / lib/*-engine.js）：
 *       spatial-order, void-solid, proportion, material, light-shadow, color,
 *       motion, time, taboo, interaction
 *   - v2 11 维（modules/01..11-*.md）：
 *       philosophy, spatial-order, void-solid, proportion, material, light,
 *       color, motion, architecture, interaction, anti-cliche
 *   - DC 分析报告术语：spatial, void-solid, proportion, material, light, color,
 *       motion, temporal, architecture, interaction, anti-cliche
 *
 * 本文件是**唯一权威注册表**：不改 lib/、不改 modules/01..11，纯增量查表。
 *
 * @module modules/frontend/runtime/dimension-registry
 */

/** Canonical 维度 id（三命名统一后的唯一标识） */
export type CanonicalDimensionId =
  | "philosophy"
  | "spatial-order"
  | "void-solid"
  | "proportion"
  | "material"
  | "light"
  | "color"
  | "motion"
  | "architecture"
  | "interaction"
  | "anti-cliche"
  | "temporal";

/**
 * 别名 → canonical 三向映射表。
 * key 覆盖：v2 numbered modules（11）、legacy skill.yaml（10）、DC 术语别名。
 */
export const DIMENSION_REGISTRY: Record<string, CanonicalDimensionId> = {
  // ---- v2 numbered modules（modules/01..11-*.md）----
  "01-philosophy": "philosophy",
  "02-spatial-order": "spatial-order",
  "03-void-solid": "void-solid",
  "04-proportion": "proportion",
  "05-material": "material",
  "06-light": "light",
  "07-color": "color",
  "08-motion": "motion",
  "09-architecture": "architecture",
  "10-interaction": "interaction",
  "11-anti-cliche": "anti-cliche",

  // ---- legacy skill.yaml rules[].id（10 维）----
  "spatial-order": "spatial-order",
  "void-solid": "void-solid",
  "proportion": "proportion",
  "material": "material",
  "light-shadow": "light", // legacy 光影 → canonical light
  "color": "color",
  "motion": "motion",
  "time": "temporal", // legacy 时间感 → canonical temporal（走 runtime）
  "taboo": "anti-cliche", // legacy 禁忌 → canonical anti-cliche
  "interaction": "interaction",

  // ---- DC 分析报告术语别名 ----
  "spatial": "spatial-order",
  "temporal": "temporal",
};

/**
 * canonical 维度落点：DC 四 category / runtime 注入 / sidecar 语义裁决。
 * 详见 fusion-architecture §3 接入点② 与 §4.1。
 */
export const DIMENSION_TO_TARGET: Record<
  CanonicalDimensionId,
  { category: "composition" | "lighting" | "color" | "materials" | "runtime" | "sidecar"; dcCategory: string | null }
> = {
  "spatial-order": { category: "composition", dcCategory: "composition" },
  "void-solid": { category: "composition", dcCategory: "composition" },
  "proportion": { category: "composition", dcCategory: "composition" },
  "architecture": { category: "composition", dcCategory: "composition" },
  "interaction": { category: "composition", dcCategory: "composition" },
  "anti-cliche": { category: "composition", dcCategory: "composition" },
  "light": { category: "lighting", dcCategory: "lighting" },
  "color": { category: "color", dcCategory: "color" },
  "material": { category: "materials", dcCategory: "materials" },
  "motion": { category: "runtime", dcCategory: null },
  "temporal": { category: "runtime", dcCategory: null },
  "philosophy": { category: "sidecar", dcCategory: null },
};

/**
 * canonical → legacy skill.yaml id 的反向映射。
 * v2 新增的 philosophy / architecture 在 legacy 10 维中没有对应项，返回 null。
 */
const CANONICAL_TO_LEGACY: Partial<Record<CanonicalDimensionId, string>> = {
  "spatial-order": "spatial-order",
  "void-solid": "void-solid",
  "proportion": "proportion",
  "material": "material",
  "light": "light-shadow",
  "color": "color",
  "motion": "motion",
  "temporal": "time",
  "anti-cliche": "taboo",
  "interaction": "interaction",
  // philosophy: 无 legacy 对应（v2 新增）
  // architecture: 无 legacy 对应（v2 新增）
};

/** 全部 canonical 维度（固定顺序，v2 11 维 + temporal 展开） */
export const ALL_CANONICAL_DIMENSIONS: CanonicalDimensionId[] = [
  "philosophy",
  "spatial-order",
  "void-solid",
  "proportion",
  "material",
  "light",
  "color",
  "motion",
  "architecture",
  "interaction",
  "anti-cliche",
  "temporal",
];

/**
 * 把任意别名（legacy id / v2 module id / DC 术语）解析为 canonical id。
 * @param alias 如 "light-shadow" | "06-light" | "spatial"
 * @throws 未知别名时抛错（SSOT 严格模式，避免静默漏映射）
 */
export function getDimensionId(alias: string): CanonicalDimensionId {
  const canonical = DIMENSION_REGISTRY[alias];
  if (!canonical) {
    throw new Error(
      `[dimension-registry] 未知维度别名: "${alias}"。` +
        `已知别名覆盖 legacy(10)/v2(11)/DC 术语；如需新增请在 DIMENSION_REGISTRY 登记。`,
    );
  }
  return canonical;
}

/**
 * 安全版 getDimensionId：未知别名返回 undefined 而不抛错。
 */
export function tryGetDimensionId(alias: string): CanonicalDimensionId | undefined {
  return DIMENSION_REGISTRY[alias];
}

/**
 * 把 canonical id 反查为 legacy skill.yaml id。
 * v2 新增维度（philosophy/architecture）无 legacy 对应，返回 null。
 */
export function getLegacyId(canonical: CanonicalDimensionId): string | null {
  return CANONICAL_TO_LEGACY[canonical] ?? null;
}

/**
 * 列出全部 canonical 维度及其落点归类。
 */
export function getAllDimensions(): Array<{
  id: CanonicalDimensionId;
  legacyId: string | null;
  target: (typeof DIMENSION_TO_TARGET)[CanonicalDimensionId];
}> {
  return ALL_CANONICAL_DIMENSIONS.map((id) => ({
    id,
    legacyId: getLegacyId(id),
    target: DIMENSION_TO_TARGET[id],
  }));
}

/* ============================================================================
 * 任务 2：11 维编号制（v2 modules/01..11）完整元数据目录
 * ----------------------------------------------------------------------------
 * 在不改 lib/、不改 modules/01..11、不破坏上方既有 SSOT 的前提下，
 * 追加「维度编号 ↔ kebab 名称 ↔ 中文名 ↔ category」四向查表与权重/评分元数据。
 * temporal 为 legacy 时间感展开项（runtime），不属于 v2 编号 1..11。
 * ========================================================================== */

/** v2 编号制 11 维（modules/01..11-*.md），是 CanonicalDimensionId 的子集 */
export type NumberedDimensionId =
  | "philosophy"
  | "spatial-order"
  | "void-solid"
  | "proportion"
  | "material"
  | "light"
  | "color"
  | "motion"
  | "architecture"
  | "interaction"
  | "anti-cliche";

/** DC 四 category + runtime/sidecar 落点（与 DIMENSION_TO_TARGET.category 同构） */
export type DimensionLanding =
  | "composition"
  | "lighting"
  | "color"
  | "materials"
  | "runtime"
  | "sidecar";

/** 单个编号维度的完整元数据 */
export interface DimensionCatalogEntry {
  /** v2 编号 1..11 */
  id: number;
  /** kebab 名称（canonical id） */
  kebabName: NumberedDimensionId;
  /** 中文名 */
  chineseName: string;
  /** 落点 category（DC 四值 / runtime / sidecar） */
  category: DimensionLanding;
  /** 一句话定义 */
  description: string;
  /** 关联的 G2 规则 ruleId 列表（≥3 条） */
  relatedRules: string[];
  /** 相对权重（11 维权重和 = 1.0；与 ScoringEngine 四分类权重正交） */
  weight: number;
  /** 默认评分区间（0..100，仅作 metadata，不写回参数 confidence） */
  scoreRange: [number, number];
  /** 评估方法描述 */
  evaluationMethod: string;
}

/**
 * 11 维完整目录（唯一权威，与 grammar-rules/index.ts 的 RULE_DIMENSION 对称）。
 * 顺序即 modules/01..11 物理顺序。
 */
export const DIMENSION_CATALOG: readonly DimensionCatalogEntry[] = [
  {
    id: 1,
    kebabName: "philosophy",
    chineseName: "道论",
    category: "sidecar",
    description: "以儒释道精神统领整体气韵，不直接投影工程参数",
    relatedRules: ["CA-RULE-06-XIASHENG", "CA-RULE-07-XUANLAN", "CA-RULE-08-JIANSU"],
    weight: 0.1,
    scoreRange: [0, 100],
    evaluationMethod: "sidecar 语义裁决：attributionStatement 与 mood 一致性",
  },
  {
    id: 2,
    kebabName: "spatial-order",
    chineseName: "空间秩序",
    category: "composition",
    description: "中轴、层级、景深构成的章法骨架",
    relatedRules: ["CA-RULE-09-ZHONGZHOU", "CA-RULE-10-CIDENG", "CA-RULE-11-YINLU"],
    weight: 0.12,
    scoreRange: [0, 100],
    evaluationMethod: "构图度量：symmetry / depthLayerCount / fov",
  },
  {
    id: 3,
    kebabName: "void-solid",
    chineseName: "虚实相生",
    category: "composition",
    description: "留白（虚）与实处（黑）之间的呼吸关系",
    relatedRules: ["CA-RULE-12-JIBAI", "CA-RULE-13-XUSHI", "CA-RULE-14-SHUKE"],
    weight: 0.12,
    scoreRange: [0, 100],
    evaluationMethod: "negativeSpaceRatio 区间合规（理想 0.40..0.60）",
  },
  {
    id: 4,
    kebabName: "proportion",
    chineseName: "比例尺度",
    category: "composition",
    description: "开间、比例、视点带来的尺度感",
    relatedRules: ["CA-RULE-15-GUCHUAN", "CA-RULE-16-HUANGJIN", "CA-RULE-17-PINGZHENG"],
    weight: 0.09,
    scoreRange: [0, 100],
    evaluationMethod: "对称度 / FOV / 俯仰角比例度量",
  },
  {
    id: 5,
    kebabName: "material",
    chineseName: "材质质感",
    category: "materials",
    description: "粗糙度、金属度、包浆磨损构成的 PBR 质感",
    relatedRules: ["CA-RULE-18-CANGRUN", "CA-RULE-19-CHUHUA", "CA-RULE-20-BAOJIANG"],
    weight: 0.1,
    scoreRange: [0, 100],
    evaluationMethod: "material 维度评测（PBR 参数物理合理性）",
  },
  {
    id: 6,
    kebabName: "light",
    chineseName: "光影明暗",
    category: "lighting",
    description: "天光、漫射、半影的光色逻辑",
    relatedRules: ["CA-RULE-21-TIANGUANG", "CA-RULE-22-FUSHE", "CA-RULE-23-BANYING"],
    weight: 0.1,
    scoreRange: [0, 100],
    evaluationMethod: "lighting 一致性：colorTemp / intensity / softness / ambient",
  },
  {
    id: 7,
    kebabName: "color",
    chineseName: "色彩设色",
    category: "color",
    description: "君臣佐使配色与降饱和（S≤0.5 铁律）",
    relatedRules: ["CA-RULE-24-SHESE", "CA-RULE-25-HUIMING", "CA-RULE-26-QINGDAN"],
    weight: 0.08,
    scoreRange: [0, 100],
    evaluationMethod: "color 评测：palette / contrast / temperature / dominantArea",
  },
  {
    id: 8,
    kebabName: "motion",
    chineseName: "动势韵律",
    category: "runtime",
    description: "云、水、烟、风、光五原型动势",
    relatedRules: ["CA-RULE-27-JINGYUANDONG", "CA-RULE-28-WANQU", "CA-RULE-29-YUNXING"],
    weight: 0.07,
    scoreRange: [0, 100],
    evaluationMethod: "运行时动效合规：hardFail（bounce/spin/linear）扫描",
  },
  {
    id: 9,
    kebabName: "architecture",
    chineseName: "营造形制",
    category: "composition",
    description: "出檐、借景、台基等建筑语汇的空间转译",
    relatedRules: ["CA-RULE-30-CHUYAN", "CA-RULE-31-JIEGUANG", "CA-RULE-32-YANXIA"],
    weight: 0.07,
    scoreRange: [0, 100],
    evaluationMethod: "构图 + 光影联合语义裁决",
  },
  {
    id: 10,
    kebabName: "interaction",
    chineseName: "交互体验",
    category: "composition",
    description: "可预期、可达、可触的交互留白与路径",
    relatedRules: ["CA-RULE-33-KEQI", "CA-RULE-34-DAJI", "CA-RULE-35-SHOUGAN"],
    weight: 0.07,
    scoreRange: [0, 100],
    evaluationMethod: "布局可达性度量：边距 / 层级数",
  },
  {
    id: 11,
    kebabName: "anti-cliche",
    chineseName: "反套路",
    category: "composition",
    description: "去塑料感、破模板、去溢光的反 AI 走样",
    relatedRules: ["CA-RULE-36-QUSULIAO", "CA-RULE-37-POJU", "CA-RULE-38-GUOBAO"],
    weight: 0.08,
    scoreRange: [0, 100],
    evaluationMethod: "antiCliche.hardFail 命中扫描 + 材质/高光物理校验",
  },
];

/* ---- 四向查表索引（构建一次，O(1) 反查） ---- */

const NUMBER_TO_ENTRY: ReadonlyMap<number, DimensionCatalogEntry> =
  new Map(DIMENSION_CATALOG.map((d) => [d.id, d]));

const KEBAB_TO_ENTRY: ReadonlyMap<NumberedDimensionId, DimensionCatalogEntry> =
  new Map(DIMENSION_CATALOG.map((d) => [d.kebabName, d]));

const CHINESE_TO_ENTRY: ReadonlyMap<string, DimensionCatalogEntry> =
  new Map(DIMENSION_CATALOG.map((d) => [d.chineseName, d]));

/**
 * 按 v2 编号（1..11）取维度目录条目。
 * @throws 编号越界时抛错（严格模式）
 */
export function getDimensionByNumber(id: number): DimensionCatalogEntry {
  const hit = NUMBER_TO_ENTRY.get(id);
  if (!hit) throw new Error(`[dimension-registry] 未知维度编号: ${id}（合法 1..11）`);
  return hit;
}

/** 按 kebab 名称取维度目录条目 */
export function getDimensionByKebab(kebab: NumberedDimensionId): DimensionCatalogEntry {
  const hit = KEBAB_TO_ENTRY.get(kebab);
  if (!hit) throw new Error(`[dimension-registry] 未知 kebab 维度: ${kebab}`);
  return hit;
}

/** 按中文名取维度目录条目 */
export function getDimensionByChinese(chineseName: string): DimensionCatalogEntry | undefined {
  return CHINESE_TO_ENTRY.get(chineseName);
}

/** 列出全部 11 个编号维度（按 id 升序） */
export function getDimensionCatalog(): readonly DimensionCatalogEntry[] {
  return DIMENSION_CATALOG;
}
