/**
 * severity-map.ts — severity 双轨统一
 *
 * 三套并存（见 docs/fusion-architecture.md §4.2）：
 *   - CAS skill.yaml：P0 / P1（rule priority、violations.severity）
 *   - CAS architecture.md：hard / soft、hard_fail 数组
 *   - DC：GrammarRule.severity = P0_CRITICAL | P1_WARNING | P2_INFO；
 *         range = preferred | warning | hard | fatalBelow
 *
 * 本文件定义 canonical 四级 BLOCK | REPAIR | WARN | OK，并双向翻译。
 *
 * @module modules/frontend/runtime/severity-map
 */

/** canonical 四级 */
export type CanonicalSeverity = "BLOCK" | "REPAIR" | "WARN" | "OK";

/** DC GrammarRule.severity 枚举（硬枚举） */
export type DcRuleSeverity = "P0_CRITICAL" | "P1_WARNING" | "P2_INFO";

/** DC range 级别 */
export type DcRangeLevel = "preferred" | "warning" | "hard" | "fatalBelow";

/** CAS skill.yaml severity → canonical */
export const CAS_SEVERITY_TO_CANONICAL: Record<"P0" | "P1", CanonicalSeverity> = {
  P0: "BLOCK", // skill.yaml 硬否决
  P1: "REPAIR", // skill.yaml 建议修补
};

/** CAS architecture.md hard/soft → canonical */
export const CAS_HARDSOFT_TO_CANONICAL: Record<"hard" | "soft", CanonicalSeverity> = {
  hard: "BLOCK",
  soft: "REPAIR",
};

/** canonical → DC GrammarRule.severity + range 级别 + G2 op */
export const CANONICAL_TO_DC: Record<
  CanonicalSeverity,
  { ruleSeverity: DcRuleSeverity; rangeLevel: DcRangeLevel; op: "test" | "replace" | "none" }
> = {
  BLOCK: { ruleSeverity: "P0_CRITICAL", rangeLevel: "fatalBelow", op: "test" },
  REPAIR: { ruleSeverity: "P1_WARNING", rangeLevel: "hard", op: "replace" },
  WARN: { ruleSeverity: "P2_INFO", rangeLevel: "warning", op: "none" },
  OK: { ruleSeverity: "P2_INFO", rangeLevel: "preferred", op: "none" },
};

/** DC GrammarRule.severity → canonical（反向查表） */
const DC_RULE_TO_CANONICAL: Record<DcRuleSeverity, CanonicalSeverity> = {
  P0_CRITICAL: "BLOCK",
  P1_WARNING: "REPAIR",
  P2_INFO: "OK",
};

/** DC range 级别 → canonical（反向查表） */
const DC_RANGE_TO_CANONICAL: Record<DcRangeLevel, CanonicalSeverity> = {
  fatalBelow: "BLOCK",
  hard: "REPAIR",
  warning: "WARN",
  preferred: "OK",
};

/**
 * 跨体系 severity 翻译。
 *
 * @example
 *   mapSeverity("cas", "canonical", "P0")           // => "BLOCK"
 *   mapSeverity("canonical", "dcRule", "BLOCK")      // => "P0_CRITICAL"
 *   mapSeverity("dcRange", "canonical", "hard")      // => "REPAIR"
 *
 * @param from 来源体系
 * @param to 目标体系
 * @param value 来源值
 */
export function mapSeverity(
  from: "cas" | "hardsoft" | "canonical" | "dcRule" | "dcRange",
  to: "canonical" | "dcRule" | "dcRange",
  value: string,
): string {
  let canonical: CanonicalSeverity;
  switch (from) {
    case "cas":
      if (value !== "P0" && value !== "P1") {
        throw new Error(`[severity-map] unknown CAS severity: "${value}"`);
      }
      canonical = CAS_SEVERITY_TO_CANONICAL[value];
      break;
    case "hardsoft":
      if (value !== "hard" && value !== "soft") {
        throw new Error(`[severity-map] unknown hard/soft: "${value}"`);
      }
      canonical = CAS_HARDSOFT_TO_CANONICAL[value];
      break;
    case "canonical":
      if (!isCanonicalSeverity(value)) {
        throw new Error(`[severity-map] unknown canonical: "${value}"`);
      }
      canonical = value;
      break;
    case "dcRule":
      canonical = DC_RULE_TO_CANONICAL[value as DcRuleSeverity] ?? "OK";
      break;
    case "dcRange":
      canonical = DC_RANGE_TO_CANONICAL[value as DcRangeLevel] ?? "OK";
      break;
    default:
      throw new Error(`[severity-map] unknown from-domain: "${from}"`);
  }

  if (to === "canonical") return canonical;
  const dc = CANONICAL_TO_DC[canonical];
  if (to === "dcRule") return dc.ruleSeverity;
  return dc.rangeLevel;
}

/** 类型守卫：是否 canonical severity */
export function isCanonicalSeverity(v: string): v is CanonicalSeverity {
  return v === "BLOCK" || v === "REPAIR" || v === "WARN" || v === "OK";
}

/**
 * 判断该 severity 是否为阻塞级（P0 / BLOCK / P0_CRITICAL / fatalBelow）。
 * 入参接受任意体系的 severity 字符串。
 */
export function isBlocking(severity: string): boolean {
  let canonical: CanonicalSeverity;
  if (severity === "P0" || severity === "hard") canonical = "BLOCK";
  else if (severity === "P1" || severity === "soft") canonical = "REPAIR";
  else if (severity === "P0_CRITICAL" || severity === "fatalBelow") canonical = "BLOCK";
  else if (severity === "P1_WARNING" || severity === "hard") canonical = "REPAIR";
  else if (severity === "P2_INFO" || severity === "warning" || severity === "preferred") canonical = "OK";
  else if (isCanonicalSeverity(severity)) canonical = severity;
  else throw new Error(`[severity-map] cannot classify severity: "${severity}"`);
  return canonical === "BLOCK";
}
