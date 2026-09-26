/**
 * grammar-rules/types.ts — G2 GrammarRule 的 TypeScript 类型镜像
 *
 * 物理对齐 DC 仓库 compiler-core/patch-engine.ts 的 GrammarRulePack 形状，
 * 以及 config/grammar-rules.json 的 JSON 条目。本侧只做类型锁定 + 规则索引，
 * **不 import DC 源码**（见 types/dc-types.ts 纪律）。
 *
 * 硬约束（不可破）：
 * - category 严格四值枚举（ScoringEngine 权重和=1.0，本期不扩第五类）；
 * - severity 三级；mutation.op 与 PatchEngine 消费方对齐为 replace|add|remove；
 * - targetPath 必须是 raw-design-ir 场景图中存在的 JSON Pointer（…/value 叶子）。
 *
 * @module modules/frontend/runtime/grammar-rules/types
 */

/** 规则分类 — 硬枚举四值，禁止新增 */
export type GrammarRuleCategory = "composition" | "lighting" | "color" | "materials";

/** 三级严重度 — 与 PatchEngine 阻尼系数对应（P0=1.0 / P1=0.8 / P2=0.5） */
export type GrammarRuleSeverity = "P0_CRITICAL" | "P1_WARNING" | "P2_INFO";

/** 条件操作符 — 对齐 PatchEngine.checkCondition */
export type GrammarRuleOperator =
  | "<"
  | ">"
  | "<="
  | ">="
  | "=="
  | "!="
  | "between"
  | "not_between";

/** 触发条件：对 targetPath 现值求值 */
export interface GrammarRuleCondition {
  operator: GrammarRuleOperator;
  value: number | string | boolean | [number, number];
}

/** 命中后执行的单补丁（与 PatchEngine 单 mutation 模式对齐） */
export interface GrammarRuleMutation {
  op: "replace" | "add" | "remove";
  value?: unknown;
}

/** G2 语法规则条目 */
export interface GrammarRule {
  /** 形如 CA-RULE-06-XIASHENG */
  ruleId: string;
  /** 中文美学原则，如「大音希声」 */
  principle: string;
  category: GrammarRuleCategory;
  /** 合法 JSON Pointer，指向场景图某参数的 /value 叶子 */
  targetPath: string;
  condition: GrammarRuleCondition;
  mutation: GrammarRuleMutation;
  severity: GrammarRuleSeverity;
  /** 中文：为何施加此规则（审计可读） */
  reason: string;
  /** 可选英文描述（审计/文档） */
  description?: string;
}

/** 规则包 — 对齐 config/grammar-rules.json 顶层 */
export interface GrammarRulePack {
  packName: string;
  version: string;
  description: string;
  rules: GrammarRule[];
}
