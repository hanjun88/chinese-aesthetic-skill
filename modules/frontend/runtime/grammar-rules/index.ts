/**
 * grammar-rules/index.ts — 扩展规则集的 TS 索引与查询
 *
 * 与 DC config/grammar-rules.json 物理对齐：本文件内嵌的
 * `EXTENDED_RULES` 即 DC 侧 CA-RULE-06 … CA-RULE-38 共 33 条新规则的 TS 镜像。
 * DC JSON 仍是 SSOT；本侧为前端运行时提供类型安全的规则索引与维度反查。
 *
 * 设计：
 * - RULE 条目严格符合 GrammarRule（可直接 JSON.stringify 回灌 DC 校验）；
 * - 维度关联不污染规则本体，另经 RULE_DIMENSION 表反查（与 dimension-registry 联动）。
 *
 * @module modules/frontend/runtime/grammar-rules
 */

import type { CanonicalDimensionId } from "../dimension-registry.ts";
import type {
  GrammarRule,
  GrammarRuleCategory,
  GrammarRulePack,
} from "./types.ts";

/* ------------------------------------------------------------------ */
/* 33 条扩展规则（CA-RULE-06..38），按 11 维度 × 3 条组织               */
/* ------------------------------------------------------------------ */

/**
 * 扩展规则集。注意：与 DC config/grammar-rules.json 保持一一对应；
 * 若 DC 侧增删规则，须同步本数组并更新 RULE_DIMENSION。
 */
export const EXTENDED_RULES: readonly GrammarRule[] = [
  // ---- D1 philosophy 道论 ----
  { ruleId: "CA-RULE-06-XIASHENG", principle: "大音希声", category: "lighting", targetPath: "/lighting/keyLight/intensity/value", condition: { operator: ">", value: 0.9 }, mutation: { op: "replace", value: 0.7 }, severity: "P1_WARNING", reason: "压顶过亮主光归于含蓄，以光不言声，合于大音希声的道家节制" },
  { ruleId: "CA-RULE-07-XUANLAN", principle: "澄怀观道", category: "composition", targetPath: "/composition/symmetry/value", condition: { operator: ">", value: 0.93 }, mutation: { op: "replace", value: 0.8 }, severity: "P2_INFO", reason: "破绝对对称的凝滞，留一线呼吸，使观者澄怀而能静观道" },
  { ruleId: "CA-RULE-08-JIANSU", principle: "见素抱朴", category: "color", targetPath: "/color/temperatureBias/value", condition: { operator: ">", value: 0.25 }, mutation: { op: "replace", value: 0.05 }, severity: "P2_INFO", reason: "收敛人为加暖的色偏，复归素朴本色，去雕琢而近道" },

  // ---- D2 spatial-order 空间秩序 ----
  { ruleId: "CA-RULE-09-ZHONGZHOU", principle: "中轴秩序", category: "composition", targetPath: "/composition/symmetry/value", condition: { operator: "<", value: 0.4 }, mutation: { op: "replace", value: 0.6 }, severity: "P1_WARNING", reason: "对称度过散则失章法，回补中轴，立空间秩序的骨架" },
  { ruleId: "CA-RULE-10-CIDENG", principle: "次第纵深", category: "composition", targetPath: "/composition/depthLayerCount/value", condition: { operator: "<", value: 2 }, mutation: { op: "replace", value: 3 }, severity: "P1_WARNING", reason: "景深层次过平则无远近次第，补一层进深以立空间层级" },
  { ruleId: "CA-RULE-11-YINLU", principle: "引景玄关", category: "composition", targetPath: "/camera/fov/value", condition: { operator: ">", value: 65 }, mutation: { op: "replace", value: 48 }, severity: "P2_INFO", reason: "视角过广则一览无余，收窄视域如玄关引流，引人入内" },

  // ---- D3 void-solid 虚实 ----
  { ruleId: "CA-RULE-12-JIBAI", principle: "计白当黑", category: "composition", targetPath: "/composition/negativeSpaceRatio/value", condition: { operator: "<", value: 0.4 }, mutation: { op: "replace", value: 0.5 }, severity: "P1_WARNING", reason: "负空间不足则画面壅塞，提留白使空白亦成为经营对象" },
  { ruleId: "CA-RULE-13-XUSHI", principle: "虚实相生", category: "composition", targetPath: "/composition/negativeSpaceRatio/value", condition: { operator: ">", value: 0.72 }, mutation: { op: "replace", value: 0.58 }, severity: "P2_INFO", reason: "留白过空则气散，收回至虚实相生的平衡区间" },
  { ruleId: "CA-RULE-14-SHUKE", principle: "疏可走马", category: "composition", targetPath: "/composition/depthLayerCount/value", condition: { operator: ">", value: 5 }, mutation: { op: "replace", value: 4 }, severity: "P2_INFO", reason: "层叠过密则密不透风，减一层以留疏可走马处" },

  // ---- D4 proportion 比例尺度 ----
  { ruleId: "CA-RULE-15-GUCHUAN", principle: "古制开间", category: "composition", targetPath: "/camera/fov/value", condition: { operator: "<", value: 28 }, mutation: { op: "replace", value: 40 }, severity: "P2_INFO", reason: "视角过窄逼仄如局促，放宽至古制开间的舒展比例" },
  { ruleId: "CA-RULE-16-HUANGJIN", principle: "黄金观照", category: "composition", targetPath: "/composition/symmetry/value", condition: { operator: ">=", value: 0.95 }, mutation: { op: "replace", value: 0.85 }, severity: "P2_INFO", reason: "近于全等则板滞，引入微妙偏移趋近黄金观照的动势" },
  { ruleId: "CA-RULE-17-PINGZHENG", principle: "平正安稳", category: "composition", targetPath: "/camera/angle/value", condition: { operator: ">", value: 12 }, mutation: { op: "replace", value: 6 }, severity: "P2_INFO", reason: "俯仰过倾则失平正，回正相机角度以立安稳构图" },

  // ---- D5 material 材质 ----
  { ruleId: "CA-RULE-18-CANGRUN", principle: "苍润并济", category: "materials", targetPath: "/materials/0/roughness/value", condition: { operator: "<", value: 0.45 }, mutation: { op: "replace", value: 0.65 }, severity: "P1_WARNING", reason: "粗糙度偏低则光浮，提苍润的亚光质感，去塑料亮泽" },
  { ruleId: "CA-RULE-19-CHUHUA", principle: "黜华还璞", category: "materials", targetPath: "/materials/0/metalness/value", condition: { operator: ">", value: 0.6 }, mutation: { op: "replace", value: 0.3 }, severity: "P1_WARNING", reason: "金属感过强则近浮华，压回质朴，黜华而还璞" },
  { ruleId: "CA-RULE-20-BAOJIANG", principle: "岁月包浆", category: "materials", targetPath: "/materials/0/wear/value", condition: { operator: "<", value: 0.15 }, mutation: { op: "replace", value: 0.3 }, severity: "P2_INFO", reason: "磨损为零则崭新假气，注入包浆微痕以显岁月温润" },

  // ---- D6 light 光影 ----
  { ruleId: "CA-RULE-21-TIANGUANG", principle: "天光下临", category: "lighting", targetPath: "/lighting/keyLight/elevation/value", condition: { operator: "<", value: 25 }, mutation: { op: "replace", value: 48 }, severity: "P1_WARNING", reason: "主光仰角过低则光从地起非天光，抬升至天光下临的高度" },
  { ruleId: "CA-RULE-22-FUSHE", principle: "漫射反弹", category: "lighting", targetPath: "/lighting/ambientRatio/value", condition: { operator: "<", value: 0.25 }, mutation: { op: "replace", value: 0.4 }, severity: "P1_WARNING", reason: "环境填充过薄则死黑，补漫射反弹光使暗部透气" },
  { ruleId: "CA-RULE-23-BANYING", principle: "半影柔边", category: "lighting", targetPath: "/lighting/keyLight/softness/value", condition: { operator: "<", value: 0.45 }, mutation: { op: "replace", value: 0.72 }, severity: "P1_WARNING", reason: "光过硬则切割形体，柔化半影边缘，氤氲而不生割" },

  // ---- D7 color 设色 ----
  { ruleId: "CA-RULE-24-SHESE", principle: "设色雅正", category: "color", targetPath: "/color/contrastRatio/value", condition: { operator: ">", value: 4.5 }, mutation: { op: "replace", value: 3.0 }, severity: "P1_WARNING", reason: "对比过强则艳俗刺激，降至雅正设色的含蓄对比" },
  { ruleId: "CA-RULE-25-HUIMING", principle: "晦明相生", category: "color", targetPath: "/color/contrastRatio/value", condition: { operator: "<", value: 1.4 }, mutation: { op: "replace", value: 2.0 }, severity: "P2_INFO", reason: "对比过糊则层次尽失，回提至晦明相生的可读区间" },
  { ruleId: "CA-RULE-26-QINGDAN", principle: "清淡去甚", category: "color", targetPath: "/color/temperatureBias/value", condition: { operator: "<", value: -0.3 }, mutation: { op: "replace", value: 0.0 }, severity: "P2_INFO", reason: "色温过冷则青寒失温，归零偏以归清淡中正" },

  // ---- D8 motion 动势 ----
  { ruleId: "CA-RULE-27-JINGYUANDONG", principle: "静中寓动", category: "composition", targetPath: "/composition/symmetry/value", condition: { operator: ">", value: 0.96 }, mutation: { op: "replace", value: 0.78 }, severity: "P2_INFO", reason: "绝对居中则万马齐喑，微偏构图以藏动势于静" },
  { ruleId: "CA-RULE-28-WANQU", principle: "动线蜿蜒", category: "composition", targetPath: "/camera/angle/value", condition: { operator: ">", value: 18 }, mutation: { op: "replace", value: 9 }, severity: "P2_INFO", reason: "倾角过险则动线躁进，收缓为蜿蜒徐徐之势" },
  { ruleId: "CA-RULE-29-YUNXING", principle: "行云流水", category: "lighting", targetPath: "/lighting/keyLight/azimuth/value", condition: { operator: "==", value: 0 }, mutation: { op: "replace", value: 35 }, severity: "P2_INFO", reason: "光源死对正前方则平板无向，侧移方位角使光如行云有流向" },

  // ---- D9 architecture 营造 ----
  { ruleId: "CA-RULE-30-CHUYAN", principle: "出檐深远", category: "composition", targetPath: "/composition/negativeSpaceRatio/value", condition: { operator: "<", value: 0.35 }, mutation: { op: "replace", value: 0.48 }, severity: "P1_WARNING", reason: "檐下留白不足则建筑压抑，扩负空间以显出檐深远" },
  { ruleId: "CA-RULE-31-JIEGUANG", principle: "借景采光", category: "lighting", targetPath: "/lighting/keyLight/intensity/value", condition: { operator: "<", value: 0.3 }, mutation: { op: "replace", value: 0.55 }, severity: "P1_WARNING", reason: "主光过弱则内室幽暗，补借景之光使建筑可居可读" },
  { ruleId: "CA-RULE-32-YANXIA", principle: "檐下投影", category: "lighting", targetPath: "/lighting/rimLightPresent/value", condition: { operator: "==", value: true }, mutation: { op: "replace", value: false }, severity: "P2_INFO", reason: "关闭漂浮无源的轮廓光，归檐下自然投影，去灵异边缘光" },

  // ---- D10 interaction 交互 ----
  { ruleId: "CA-RULE-33-KEQI", principle: "留白可触", category: "composition", targetPath: "/composition/negativeSpaceRatio/value", condition: { operator: "<", value: 0.42 }, mutation: { op: "replace", value: 0.5 }, severity: "P2_INFO", reason: "留白不足则无可点触的呼吸区，补边距以安放手与视线" },
  { ruleId: "CA-RULE-34-DAJI", principle: "层级可达", category: "composition", targetPath: "/composition/depthLayerCount/value", condition: { operator: ">", value: 6 }, mutation: { op: "replace", value: 5 }, severity: "P2_INFO", reason: "层级过繁则迷失可达性，收束层级使路径清晰可循" },
  { ruleId: "CA-RULE-35-SHOUGAN", principle: "拟物手感", category: "materials", targetPath: "/materials/0/roughness/value", condition: { operator: ">", value: 0.95 }, mutation: { op: "replace", value: 0.75 }, severity: "P2_INFO", reason: "过度磨砂如橡胶失手感，回至可触可感的温润阻尼" },

  // ---- D11 anti-cliche 反套路 ----
  { ruleId: "CA-RULE-36-QUSULIAO", principle: "去塑料感", category: "materials", targetPath: "/materials/0/roughness/value", condition: { operator: "<", value: 0.2 }, mutation: { op: "replace", value: 0.35 }, severity: "P1_WARNING", reason: "镜面低糙是 AI 塑料感通病，拉回物理合理的微表面" },
  { ruleId: "CA-RULE-37-POJU", principle: "破除模板", category: "composition", targetPath: "/composition/symmetry/value", condition: { operator: ">", value: 0.9 }, mutation: { op: "replace", value: 0.82 }, severity: "P2_INFO", reason: "模板化居中对称一眼假，破对称注入人工难以察觉的失衡" },
  { ruleId: "CA-RULE-38-GUOBAO", principle: "去过曝溢光", category: "lighting", targetPath: "/lighting/keyLight/intensity/value", condition: { operator: ">", value: 0.95 }, mutation: { op: "replace", value: 0.75 }, severity: "P1_WARNING", reason: "过曝溢光是合成图通病，压高光回落到物理曝光区间" },
];

/* ------------------------------------------------------------------ */
/* 维度反查表：ruleId → 所属 canonical 维度                             */
/* ------------------------------------------------------------------ */

/**
 * 每条扩展规则所属的 canonical 维度。与 dimension-registry 的 relatedRules 对称。
 */
export const RULE_DIMENSION: Readonly<Record<string, CanonicalDimensionId>> = {
  "CA-RULE-06-XIASHENG": "philosophy",
  "CA-RULE-07-XUANLAN": "philosophy",
  "CA-RULE-08-JIANSU": "philosophy",

  "CA-RULE-09-ZHONGZHOU": "spatial-order",
  "CA-RULE-10-CIDENG": "spatial-order",
  "CA-RULE-11-YINLU": "spatial-order",

  "CA-RULE-12-JIBAI": "void-solid",
  "CA-RULE-13-XUSHI": "void-solid",
  "CA-RULE-14-SHUKE": "void-solid",

  "CA-RULE-15-GUCHUAN": "proportion",
  "CA-RULE-16-HUANGJIN": "proportion",
  "CA-RULE-17-PINGZHENG": "proportion",

  "CA-RULE-18-CANGRUN": "material",
  "CA-RULE-19-CHUHUA": "material",
  "CA-RULE-20-BAOJIANG": "material",

  "CA-RULE-21-TIANGUANG": "light",
  "CA-RULE-22-FUSHE": "light",
  "CA-RULE-23-BANYING": "light",

  "CA-RULE-24-SHESE": "color",
  "CA-RULE-25-HUIMING": "color",
  "CA-RULE-26-QINGDAN": "color",

  "CA-RULE-27-JINGYUANDONG": "motion",
  "CA-RULE-28-WANQU": "motion",
  "CA-RULE-29-YUNXING": "motion",

  "CA-RULE-30-CHUYAN": "architecture",
  "CA-RULE-31-JIEGUANG": "architecture",
  "CA-RULE-32-YANXIA": "architecture",

  "CA-RULE-33-KEQI": "interaction",
  "CA-RULE-34-DAJI": "interaction",
  "CA-RULE-35-SHOUGAN": "interaction",

  "CA-RULE-36-QUSULIAO": "anti-cliche",
  "CA-RULE-37-POJU": "anti-cliche",
  "CA-RULE-38-GUOBAO": "anti-cliche",
};

/* ------------------------------------------------------------------ */
/* 查询助手（纯函数）                                                  */
/* ------------------------------------------------------------------ */

/** 按 canonical 维度筛出扩展规则 */
export function getRulesByDimension(dim: CanonicalDimensionId): GrammarRule[] {
  return EXTENDED_RULES.filter((r) => RULE_DIMENSION[r.ruleId] === dim);
}

/** 按四分类筛出扩展规则 */
export function getRulesByCategory(category: GrammarRuleCategory): GrammarRule[] {
  return EXTENDED_RULES.filter((r) => r.category === category);
}

/** 按 ruleId 精确取规则 */
export function getRuleById(ruleId: string): GrammarRule | undefined {
  return EXTENDED_RULES.find((r) => r.ruleId === ruleId);
}

/** 反向：ruleId → 所属 canonical 维度（未登记返回 undefined） */
export function getRuleDimension(ruleId: string): CanonicalDimensionId | undefined {
  return RULE_DIMENSION[ruleId];
}

/** 组装成与 DC 同形的规则包（便于单测/文档回灌） */
export function buildExtendedRulePack(): GrammarRulePack {
  return {
    packName: "chinese-aesthetic",
    version: "1.1.0",
    description: "东方空间美学语法规则包 — 11 维度扩展规则集（CA-RULE-06..38）",
    rules: [...EXTENDED_RULES],
  };
}

export * from "./types.ts";
