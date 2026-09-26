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
