/**
 * rendered-feedback.test.ts — 契约 C：渲染结果 → 美学评分闭环
 *
 * 覆盖：完美 fidelity / 低分 fidelity / 色彩违规 / 动势违规 / 构图违规 /
 *       空输入处理 / 边界值 / 报告 hash 验证。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateFidelityReport,
  deserializeGeneratedCode,
  compareFidelity,
  computeReportHash,
  FeedbackError,
} from "../rendered-feedback.ts";
import { extractSignals, reviewAntiCliche } from "../code-reviewer.ts";
import { makeValidSheet } from "./fixtures.ts";
import type { AestheticConstraintSheet } from "../types/aesthetic-sheet.ts";
import type {
  ComponentKind,
  ComponentPrefix,
  DomComponentPlan,
} from "../types/dom-component-plan.ts";
import { ALL_CANONICAL_DIMENSIONS } from "../dimension-registry.ts";

/* ------------------------------------------------------------------ *
 * 夹具
 * ------------------------------------------------------------------ */

/** 全部 S<=0.5 的克制调色板（默认夹具的 #B8860B 饱和度过高，用于触发违规测试） */
function makeMutedSheet(overrides: Partial<AestheticConstraintSheet> = {}): AestheticConstraintSheet {
  return makeValidSheet({
    colorSystem: {
      palette: [
        { role: "dominant", name: "月白", hex: "#EDEAE4", hsl: "", areaPct: 0.65, usage: "bg" },
        { role: "secondary", name: "黛青", hex: "#2C3E50", hsl: "", areaPct: 0.25, usage: "text" },
        { role: "accent", name: "哑金", hex: "#9C7A3C", hsl: "", areaPct: 0.05, usage: "accent" },
        { role: "shadow", name: "墨黛", hex: "#2A2D3A", hsl: "", areaPct: 0.05, usage: "shadow" },
      ],
      saturationMax: 0.5,
      hardFailHex: ["#FF0000", "#FFD700", "#000000", "#00FFFF"],
    },
    ...overrides,
  });
}

/** 干净的 css：克制色 + 一个 infinite 呼吸循环，无违禁缓动 */
const CLEAN_CSS = `
.mg-gate { background:#EDEAE4; border-color:#2C3E50; }
.fs-screen { background:#EDEAE4; color:#2C3E50; opacity:0.72; }
.lw-leak { color:#9C7A3C; }
.pl-plaque { color:#9C7A3C; }
.cs-shelf { background:#EDEAE4; }
@keyframes breathe { from{opacity:0.9} to{opacity:1} }
.mg-gate { animation:breathe 4000ms ease-in-out infinite; }
`;

const KINDS: Array<[ComponentKind, ComponentPrefix]> = [
  ["moon-gate", "mg"],
  ["scroll-panel", "sp"],
  ["folding-screen", "fs"],
  ["lattice-window", "lw"],
  ["plaque", "pl"],
  ["curio-shelf", "cs"],
];

/** 6 组件齐装的计划；leak 控制留白比，可注入 focal 数量 */
function makePlan(opts: { leak?: string; plaqueCount?: number } = {}): DomComponentPlan {
  const leak = opts.leak ?? "0.45";
  const plaqueCount = opts.plaqueCount ?? 1;
  const components = KINDS.map(([kind, prefix], i) => {
    const isPlaque = kind === "plaque";
    return {
      kind,
      prefix,
      order: i + 1,
      cssVars:
        kind === "folding-screen"
          ? { "--screen-opacity": "0.72" }
          : kind === "lattice-window"
            ? { "--color-shadow-leak": "#9C7A3C" }
            : {},
      state: isPlaque ? { observerThreshold: 0.4 } : {},
      drivenBy: ["void-solid" as const],
    };
  });
  // 多装匾额制造焦点过载
  for (let k = 1; k < plaqueCount; k++) {
    components.push({
      kind: "plaque",
      prefix: "pl",
      order: 10 + k,
      cssVars: {},
      state: { observerThreshold: 0.4 },
      drivenBy: ["interaction" as const],
    });
  }
  return {
    planId: "plan-p",
    testCaseId: "TC1",
    links: { rawIRHash: "r", validatedIRHash: "v", executionPlanHash: "e" },
    renderer: "DOMCanvas",
    downgrades: [],
    components,
    rootCssVars: {
      "--color-bg": "#EDEAE4",
      "--color-text": "#2C3E50",
      "--color-accent": "#9C7A3C",
      "--space-leak-mult": leak,
    },
  };
}

const LINKS = { testCaseId: "TC1", inputHash: "in-h", validatedIRHash: "v", executionPlanHash: "e", renderHash: "r-h" };

/* ------------------------------------------------------------------ *
 * 1) 完美 fidelity
 * ------------------------------------------------------------------ */

test("完美 fidelity：克制调色 + 呼吸循环 + 6 组件齐装 → 零违例、高 fidelity", () => {
  const sheet = makeMutedSheet();
  const report = generateFidelityReport({ sheet, code: { css: CLEAN_CSS, plan: makePlan() }, links: LINKS });

  assert.equal(report.violations.length, 0, `应无违例，实际: ${JSON.stringify(report.violations)}`);
  assert.ok(report.overallFidelity >= 80, `overallFidelity=${report.overallFidelity} 应 >=80`);
  assert.equal(report.measures.forbiddenHexHits.length, 0);
  assert.equal(report.measures.bannedEasingHits.length, 0);
  assert.ok(report.measures.breathingLoops >= 1);
  assert.equal(report.measures.actualNegativeSpaceRatio, 0.45);
  // 12 维全量
  assert.equal(report.dimensions.length, ALL_CANONICAL_DIMENSIONS.length);
});

/* ------------------------------------------------------------------ *
 * 2) 低分 fidelity
 * ------------------------------------------------------------------ */

test("低分 fidelity：高饱和原色 + 违禁缓动 + 无计划 → 大量违例、fidelity 塌陷", () => {
  const sheet = makeMutedSheet();
  const badCss = `
body { background:#FF0000; color:#FFD700; }
.a { background:#FF0000; }
.b { background:#FF0000; transition:all 500ms linear; }
`;
  const report = generateFidelityReport({ sheet, code: { css: badCss }, links: LINKS });

  assert.ok(report.violations.length >= 5, `违例数=${report.violations.length} 应 >=5`);
  const p0 = report.violations.filter((v) => v.severity === "P0");
  assert.ok(p0.length >= 1, "应至少有一条 P0");
  assert.ok(report.overallFidelity < 65, `overallFidelity=${report.overallFidelity} 应 <65`);
  // color 维度应被打到 FAIL
  const color = report.dimensions.find((d) => d.dimension === "color");
  assert.equal(color?.verdict, "FAIL");
});

/* ------------------------------------------------------------------ *
 * 3) 色彩违规
 * ------------------------------------------------------------------ */

test("色彩违规：命中违禁色 #FFD700 → CA-TABOO-COLOR-01-FORBIDDEN-HEX", () => {
  const sheet = makeMutedSheet();
  const signals = extractSignals({ css: ".x{ color:#FFD700; }" });
  const violations = reviewAntiCliche(signals, sheet);
  const forbidden = violations.find((v) => v.ruleId === "CA-TABOO-COLOR-01-FORBIDDEN-HEX");
  assert.ok(forbidden, "应命中违禁色规则");
  assert.equal(forbidden?.severity, "P0");
  assert.equal(forbidden?.category, "color");
  assert.ok(signals.forbiddenHexHits.includes("#ffd700"));
});

test("色彩违规：饱和度 S>0.5 → CA-TABOO-COLOR-02-SATURATION", () => {
  const sheet = makeMutedSheet();
  // #FF6699 饱和度过高
  const signals = extractSignals({ css: ".x{ background:#FF6699; }" });
  assert.ok(signals.maxSaturation > 0.5);
  const violations = reviewAntiCliche(signals, sheet);
  assert.ok(violations.some((v) => v.ruleId === "CA-TABOO-COLOR-02-SATURATION"));
});

/* ------------------------------------------------------------------ *
 * 4) 动势违规
 * ------------------------------------------------------------------ */

test("动势违规：linear/bounce 违禁缓动 → CA-TABOO-MOTION-01-BANNED-EASING", () => {
  const sheet = makeMutedSheet();
  const css = `.sp-scroll{ transition:all 6000ms linear; } .mg-gate{ animation:bounce 300ms; }`;
  const signals = extractSignals({ css });
  assert.ok(signals.bannedEasingHits.includes("linear"));
  assert.ok(signals.bannedEasingHits.includes("bounce"));
  const violations = reviewAntiCliche(signals, sheet);
  const easing = violations.filter((v) => v.ruleId === "CA-TABOO-MOTION-01-BANNED-EASING");
  assert.ok(easing.length >= 2, "linear 与 bounce 各一条");
  // 300ms 低于下限 → 时长越界
  assert.ok(violations.some((v) => v.ruleId === "CA-TABOO-MOTION-02-DURATION-RANGE"));
});

/* ------------------------------------------------------------------ *
 * 5) 构图违规
 * ------------------------------------------------------------------ */

test("构图违规：留白比 0.20 越界 → CA-TABOO-COMP-01-VOID-SOLID", () => {
  const sheet = makeMutedSheet();
  const report = generateFidelityReport({
    sheet,
    code: { css: CLEAN_CSS, plan: makePlan({ leak: "0.20" }) },
    links: LINKS,
  });
  const voidSolid = report.violations.find((v) => v.ruleId === "CA-TABOO-COMP-01-VOID-SOLID");
  assert.ok(voidSolid, "应命中留白比越界");
  assert.equal(voidSolid?.severity, "P1");
  assert.equal(voidSolid?.category, "composition");
});

test("构图违规：焦点过载（2 匾额 > focalPointsMax=1）→ COMP-02", () => {
  const sheet = makeMutedSheet();
  const signals = extractSignals({ css: CLEAN_CSS, plan: makePlan({ plaqueCount: 2 }) });
  assert.equal(signals.focalPoints, 2);
  const violations = reviewAntiCliche(signals, sheet);
  assert.ok(violations.some((v) => v.ruleId === "CA-TABOO-COMP-02-FOCAL-OVERLOAD"));
});

/* ------------------------------------------------------------------ *
 * 6) 空输入处理
 * ------------------------------------------------------------------ */

test("空输入处理：deserializeGeneratedCode 空产物抛 FeedbackError", () => {
  const sheet = makeMutedSheet();
  assert.throws(() => deserializeGeneratedCode({}, sheet), (e: unknown) => e instanceof FeedbackError);
  assert.throws(
    () => generateFidelityReport({ sheet, code: {}, links: LINKS }),
    (e: unknown) => e instanceof FeedbackError,
  );
});

/* ------------------------------------------------------------------ *
 * 7) 边界值
 * ------------------------------------------------------------------ */

test("边界值：留白比 0.42 / 0.55 为 inclusive 区间，不触发违例", () => {
  const sheet = makeMutedSheet();
  for (const leak of ["0.42", "0.55"]) {
    const signals = extractSignals({ css: CLEAN_CSS, plan: makePlan({ leak }) });
    const violations = reviewAntiCliche(signals, sheet);
    assert.ok(
      !violations.some((v) => v.ruleId === "CA-TABOO-COMP-01-VOID-SOLID"),
      `leak=${leak} 不应触发留白违例`,
    );
  }
  // 0.41 越界
  const signalsEdge = extractSignals({ css: CLEAN_CSS, plan: makePlan({ leak: "0.41" }) });
  const vEdge = reviewAntiCliche(signalsEdge, sheet);
  assert.ok(vEdge.some((v) => v.ruleId === "CA-TABOO-COMP-01-VOID-SOLID"));
});

/* ------------------------------------------------------------------ *
 * 8) 报告 hash 验证
 * ------------------------------------------------------------------ */

test("报告 hash 验证：同输入恒等、改字段即变、64 位 hex、不进 links", () => {
  const sheet = makeMutedSheet();
  const a = generateFidelityReport({ sheet, code: { css: CLEAN_CSS, plan: makePlan() }, links: LINKS });
  const b = generateFidelityReport({ sheet, code: { css: CLEAN_CSS, plan: makePlan() }, links: LINKS });

  assert.equal(a.reportHash, b.reportHash, "相同输入 reportHash 必须恒等");
  assert.match(a.reportHash, /^[0-9a-f]{64}$/, "reportHash 为 sha256 64 位 hex");

  // 改一个字段 → hash 变
  const c = { ...a, overallFidelity: a.overallFidelity + 1 };
  const hashC = computeReportHash(c);
  assert.notEqual(hashC, a.reportHash, "改动 overallFidelity 后 reportHash 应变");

  // links 链接字段齐全（sidecar 因果键）
  assert.equal(a.links.testCaseId, "TC1");
  assert.ok(a.links.inputHash && a.links.validatedIRHash && a.links.renderHash);
});

/* ------------------------------------------------------------------ *
 * 9) compareFidelity：维度 expected/actual/fidelity 结构
 * ------------------------------------------------------------------ */

test("compareFidelity：primary 维度期望 90，fidelity=100-|expected-actual|", () => {
  const sheet = makeMutedSheet();
  const scores = deserializeGeneratedCode({ css: CLEAN_CSS, plan: makePlan() }, sheet);
  const entries = compareFidelity(sheet, scores);
  const voidSolid = entries.find((e) => e.dimension === "void-solid");
  assert.equal(voidSolid?.weight, "primary");
  assert.equal(voidSolid?.expectedScore, 90);
  assert.equal(voidSolid?.fidelityScore, 100 - Math.abs(90 - voidSolid!.actualScore));
  // 未声明维度为 unspecified=60
  const philosophy = entries.find((e) => e.dimension === "philosophy");
  assert.equal(philosophy?.weight, "tertiary"); // sheet 里声明了 philosophy tertiary
});
