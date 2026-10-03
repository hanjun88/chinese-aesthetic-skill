import test from 'node:test';
import assert from 'node:assert/strict';
import { REGISTRY, getRule, rulePayload } from '../../lib/rules/registry.js';
import { contextKey } from '../../lib/rules/derive.js';
import { emitSheet, enumerateContexts } from '../../scripts/lib/sheet-emitter.mjs';
import { detectCliches } from '../../lib/cliche-detector.js';

const STATE = { commit: 'a'.repeat(40), dirty: false };
/** One sheet decision per anti-pattern gate (ANTI-01..05); enforcing the gates is the consumer's job, deciding their thresholds is the skill's. */
const GATE_RULES = {
  'symbolic-stacking': 'CAS-AP-GATE-SYMBOLIC-STACKING',
  'unphysical-glow': 'CAS-AP-GATE-UNPHYSICAL-GLOW',
  'dead-void': 'CAS-AP-GATE-DEAD-VOID',
  'conflicted-hierarchy': 'CAS-AP-GATE-CONFLICTED-HIERARCHY',
  'toxic-saturation': 'CAS-AP-GATE-TOXIC-SATURATION',
};
const ENGINE_RULES = [
  'CAS-AP-CLICHE-GUIDELINE-THRESHOLDS', 'CAS-AP-CLICHE-ENGINE-THRESHOLDS',
  'CAS-AP-CLICHE-SCORING-GUOCHAO', 'CAS-AP-CLICHE-SCORING-GUZHUANG', 'CAS-AP-CLICHE-SCORING-FANGGU', 'CAS-AP-CLICHE-SCORING-AI-GUOFENG',
];

test('every valid context carries exactly one decision per anti-pattern gate, and no engine-only cliche rule', () => {
  const { valid } = enumerateContexts();
  for (const ctx of valid) {
    const sheet = emitSheet(ctx, { state: STATE });
    const gates = sheet.constraints.filter((c) => c.rule_id.startsWith('CAS-AP-GATE-'));
    assert.deepEqual(gates.map((c) => c.payload.subject).sort(), Object.keys(GATE_RULES).sort(), contextKey(ctx));
    for (const c of gates) {
      assert.equal(c.kind, 'ANTI_PATTERN_THRESHOLD');
      assert.equal(c.rule_id, GATE_RULES[c.payload.subject]);
      for (const [k, v] of Object.entries(c.payload.params)) assert.equal(typeof v, 'number', `${c.rule_id}.${k}`);
    }
    assert.ok(!sheet.constraints.some((c) => c.rule_id.startsWith('CAS-AP-CLICHE-')), `${contextKey(ctx)} leaks an engine-only rule`);
  }
});

test('the gate thresholds are the same in every context (a gate threshold is one decision, not a period-dependent one)', () => {
  const byRule = new Map();
  for (const ctx of enumerateContexts().valid) {
    for (const c of emitSheet(ctx, { state: STATE }).constraints.filter((x) => x.rule_id.startsWith('CAS-AP-GATE-'))) {
      const json = JSON.stringify(c.payload);
      assert.equal(byRule.get(c.rule_id) ?? json, json, `${c.rule_id} differs in ${contextKey(ctx)}`);
      byRule.set(c.rule_id, json);
    }
  }
  assert.equal(byRule.size, Object.keys(GATE_RULES).length);
});

test('the exempt paradigms of the toxic-saturation gate are periods of the vocabulary', () => {
  const periods = Object.keys(REGISTRY.vocabulary.periods);
  const lists = rulePayload('CAS-AP-GATE-TOXIC-SATURATION').lists;
  assert.ok(lists.high_saturation_paradigms.length > 0);
  for (const p of lists.high_saturation_paradigms) assert.ok(periods.includes(p), `${p} is not a period`);
});

test('ADR-0001: the dead-void candidate trigger is a policy parameter of its own, not a void_ratio band and not derived from one', () => {
  const rule = getRule('CAS-AP-GATE-DEAD-VOID');
  assert.equal(rule.kind, 'ANTI_PATTERN_THRESHOLD');
  assert.equal(typeof rule.payload.params.candidate_void_ratio_above, 'number', 'an authored literal, not a $band / $clamp node');
  assert.ok(!/\$band|\$clamp|\$ref/.test(JSON.stringify(rule.payload)));
  assert.ok(rule.sources.includes('SRC-ADR-0001'));
  assert.ok(rule.sources.some((id) => REGISTRY.sources[id].kind === 'guideline' && REGISTRY.sources[id].ref.startsWith('guidelines/void-solid.md')));
  assert.deepEqual(REGISTRY.rules.filter((r) => r.kind === 'PARAMETER_BAND' && r.rule_id.startsWith('CAS-AP-')), []);
});

test('the engine-only cliche rules never reach a sheet and carry provenance; their guideline thresholds are quoted from the guidelines', () => {
  for (const id of ENGINE_RULES) {
    const r = getRule(id);
    assert.deepEqual(r.audience, ['engine'], id);
    assert.ok(r.sources.length > 0, id);
  }
  const g = getRule('CAS-AP-CLICHE-GUIDELINE-THRESHOLDS');
  assert.ok(g.sources.every((id) => REGISTRY.sources[id].kind === 'guideline' && REGISTRY.sources[id].quote), 'verbatim guideline quotes');
  const weights = ['GUOCHAO', 'GUZHUANG', 'FANGGU', 'AI-GUOFENG'].map((t) => rulePayload(`CAS-AP-CLICHE-SCORING-${t}`).params.type_weight);
  assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-9, 'the four type weights sum to 1');
});

// ---- the cliche detector decides on the registry's numbers -------------------------------------------------------
const GUIDELINE = rulePayload('CAS-AP-CLICHE-GUIDELINE-THRESHOLDS').params;
const ENGINE = rulePayload('CAS-AP-CLICHE-ENGINE-THRESHOLDS').params;
const EPS = 1e-9;
const rulesOf = (design, type) => detectCliches(design).details[type].violations.map((v) => v.rule);
const person = (over) => ({ type: 'person', faceDirection: 'side', areaRatio: 0, detailRatio: 0, ...over });
const building = (over) => ({ type: 'building', detailRatio: 0, isBlockSilhouette: false, isCropped: true, ...over });

/** [label, type, rule, build(valueAtThreshold + delta)] — a violation exactly beyond the threshold, none at it (strict comparisons). */
const ABOVE = [
  ['traditional-pattern coverage', 'guochao', 'pattern-overuse', GUIDELINE.guochao_pattern_coverage_above, (v) => ({ patternCoverage: v })],
  ['frontal person area', 'guzhuang', 'front-face-closeup', GUIDELINE.guzhuang_front_face_area_above, (v) => ({ elements: [person({ faceDirection: 'front', areaRatio: v })] })],
  ['person area', 'guzhuang', 'person-too-large', ENGINE.guzhuang_person_area_above, (v) => ({ elements: [person({ areaRatio: v })] })],
  ['ornate costume detail', 'guzhuang', 'ornate-costume', ENGINE.guzhuang_ornate_detail_above, (v) => ({ elements: [person({ detailRatio: v, costume: 'ornate' })] })],
  ['building detail without block silhouette', 'fanggu', 'building-detail-overload', GUIDELINE.fanggu_building_detail_above, (v) => ({ elements: [building({ detailRatio: v })] })],
  ['main elements', 'aiGuofeng', 'element-overload', ENGINE.ai_main_elements_above, (v) => ({ elements: Array.from({ length: v }, () => ({ type: 'tree', isMain: true })) })],
];

for (const [label, type, rule, threshold, build] of ABOVE) {
  test(`cliche detector: ${label} is a violation only strictly above the registry threshold`, () => {
    const beyond = Number.isInteger(threshold) ? threshold + 1 : threshold + EPS;
    assert.ok(!rulesOf(build(threshold), type).includes(rule), `at ${threshold}`);
    assert.ok(rulesOf(build(beyond), type).includes(rule), `at ${beyond}`);
  });
}

test('cliche detector: flat lighting is a violation only strictly below the registry ratio; a missing ratio counts as the registry default', () => {
  const t = ENGINE.flat_lighting_ratio_below;
  for (const [type, rule] of [['fanggu', 'flat-lighting'], ['aiGuofeng', 'flat-ai-lighting']]) {
    assert.ok(!rulesOf({ brightnessRatio: t }, type).includes(rule), `at ${t}`);
    assert.ok(rulesOf({ brightnessRatio: t - EPS }, type).includes(rule), `below ${t}`);
    assert.equal(rulesOf({}, type).includes(rule), ENGINE.brightness_ratio_default < t, 'default ratio');
  }
});

test('cliche detector: a material is plastic only strictly below the registry roughness and metalness; missing values take the registry defaults', () => {
  const r = GUIDELINE.ai_plastic_roughness_below;
  const m = GUIDELINE.ai_plastic_metalness_below;
  const plastic = (material) => rulesOf({ materials: [material] }, 'aiGuofeng').includes('plastic-material');
  assert.ok(plastic({ roughness: r - EPS, metalness: m - EPS }));
  assert.ok(!plastic({ roughness: r, metalness: m - EPS }));
  assert.ok(!plastic({ roughness: r - EPS, metalness: m }));
  assert.equal(plastic({}), ENGINE.ai_plastic_roughness_default < r && ENGINE.ai_plastic_metalness_default < m);
});

test('cliche detector: the type weights, violation scores and detection floor of the result are the registry values', () => {
  const full = detectCliches({
    patternCoverage: 1, hasBrushTitle: true, hasPatternBorder: true,
    elements: [person({ faceDirection: 'front', areaRatio: 1 })], hasDramaticLighting: true,
  }).details;
  assert.equal(full.guochao.weight, rulePayload('CAS-AP-CLICHE-SCORING-GUOCHAO').params.type_weight);
  assert.equal(full.guzhuang.weight, rulePayload('CAS-AP-CLICHE-SCORING-GUZHUANG').params.type_weight);
  assert.equal(full.fanggu.weight, rulePayload('CAS-AP-CLICHE-SCORING-FANGGU').params.type_weight);
  assert.equal(full.aiGuofeng.weight, rulePayload('CAS-AP-CLICHE-SCORING-AI-GUOFENG').params.type_weight);
  // pattern overuse + brush title + pattern border (no colour clash in this design)
  const S = rulePayload('CAS-AP-CLICHE-SCORING-GUOCHAO').params;
  const expected = Math.min(1, S.score_pattern_overuse + S.score_brush_title + S.score_pattern_border);
  assert.equal(full.guochao.score, expected);
  assert.equal(full.guochao.detected, expected >= S.detected_score_min);
  // frontal close-up + dramatic lighting
  const G = rulePayload('CAS-AP-CLICHE-SCORING-GUZHUANG').params;
  assert.equal(full.guzhuang.score, Math.min(1, G.score_front_face_closeup + G.score_dramatic_lighting));
});
