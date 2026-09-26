/**
 * dimension-catalog.test.ts — 11 维编号制四向映射与元数据正确性
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getDimensionCatalog,
  getDimensionByNumber,
  getDimensionByKebab,
  getDimensionByChinese,
  DIMENSION_CATALOG,
} from "../dimension-registry.ts";
import { EXTENDED_RULES, getRuleById } from "../grammar-rules/index.ts";

const ALLOWED_CATS = new Set([
  "composition", "lighting", "color", "materials", "runtime", "sidecar",
]);

test("目录恰好 11 维且编号 1..11 连续", () => {
  const cat = getDimensionCatalog();
  assert.equal(cat.length, 11);
  cat.forEach((d, i) => assert.equal(d.id, i + 1, `编号应连续: idx ${i}`));
});

test("四向映射往返：编号↔kebab↔中文名 一致", () => {
  for (let n = 1; n <= 11; n++) {
    const byNum = getDimensionByNumber(n);
    const byKebab = getDimensionByKebab(byNum.kebabName);
    assert.equal(byKebab.id, n, `kebab 反查应回到编号 ${n}`);
    const byZh = getDimensionByChinese(byNum.chineseName);
    assert.ok(byZh, `中文名可反查: ${byNum.chineseName}`);
    assert.equal(byZh!.kebabName, byNum.kebabName, "中文名反查应回到同一 kebab");
  }
});

test("category 均为合法落点枚举", () => {
  for (const d of DIMENSION_CATALOG) {
    assert.ok(ALLOWED_CATS.has(d.category), `非法 category: ${d.kebabName}=${d.category}`);
  }
});

test("每维 ≥3 条 relatedRules，且 ruleId 在规则索引中真实存在", () => {
  for (const d of DIMENSION_CATALOG) {
    assert.ok(d.relatedRules.length >= 3, `${d.kebabName} 规则不足 3 条`);
    for (const rid of d.relatedRules) {
      assert.ok(getRuleById(rid), `目录引用了不存在的规则: ${rid}`);
    }
  }
});

test("11 维权重和 = 1.0", () => {
  const sum = DIMENSION_CATALOG.reduce((a, d) => a + d.weight, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-9, `权重和应≈1.0, 实得 ${sum}`);
});

test("规则索引覆盖 33 条且每条都能反查回某一维度", () => {
  assert.equal(EXTENDED_RULES.length, 33);
  for (const r of EXTENDED_RULES) {
    const owner = DIMENSION_CATALOG.find((d) => d.relatedRules.includes(r.ruleId));
    assert.ok(owner, `规则 ${r.ruleId} 未被任何维度引用`);
  }
});

test("越界编号 / 未知 kebab 抛错", () => {
  assert.throws(() => getDimensionByNumber(0));
  assert.throws(() => getDimensionByNumber(12));
  // @ts-expect-error 故意传非法 kebab
  assert.throws(() => getDimensionByKebab("not-a-dim"));
});
