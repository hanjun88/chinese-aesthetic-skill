// Unit tests of the derivation logic on SYNTHETIC registries (numbers here are fixtures, not aesthetics).
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveContext, resolveValue, effectiveBands, RegistryConflictError, matches, contextKey } from '../../lib/rules/derive.js';

const P = 'scene.composition.x';
const ctx = { period: 'SONG', material: 'WOOD', lighting: 'DIM', scene_type: 'OBJECT_STUDY' };
const band = (id, semantics, min, max, applies_to) => ({
  rule_id: id, kind: 'PARAMETER_BAND', applies_to,
  payload: { parameter: P, metric: 'm', semantics, min, max, unit: 'ratio', rationale: 'fixture' },
});
const reg = (...rules) => ({ rules });

test('matches: absent selector is unconstrained, listed selector must contain the value', () => {
  assert.ok(matches(undefined, ctx));
  assert.ok(matches({ period: ['SONG', 'TANG'] }, ctx));
  assert.ok(!matches({ period: ['TANG'] }, ctx));
  assert.ok(!matches({ period: ['SONG'], lighting: ['DAYLIGHT'] }, ctx));
});

test('effective band is the intersection of hard bands; soft semantics do not narrow it', () => {
  const b = effectiveBands([
    { rule_id: 'A', decision_id: 'D:A', payload: band('A', 'PHYSICAL_RANGE', 0, 1).payload },
    { rule_id: 'B', decision_id: 'D:B', payload: band('B', 'PERIOD_BAND', 0.2, 0.8).payload },
    { rule_id: 'C', decision_id: 'D:C', payload: band('C', 'HARD_FLOOR', 0.5, 1).payload },
    { rule_id: 'D', decision_id: 'D:D', payload: band('D', 'STRUCTURAL_SIGNAL', 0.9, 1).payload },
  ]);
  assert.deepEqual(b.get(P), { lo: 0.5, hi: 0.8, ids: ['D:A', 'D:B', 'D:C'] });
});

test('an empty intersection is a conflict, never a silent winner', () => {
  assert.throws(
    () => effectiveBands([
      { rule_id: 'B', decision_id: 'D:B', payload: band('B', 'PERIOD_BAND', 0.1, 0.4).payload },
      { rule_id: 'C', decision_id: 'D:C', payload: band('C', 'HARD_FLOOR', 0.6, 1).payload },
    ]),
    RegistryConflictError,
  );
});

test('$by_* selects by context, falls back to "*", and fails without either', () => {
  const env = { ctx, bands: new Map(), rulesById: new Map(), stack: [] };
  const t = () => ({ inputs: new Set(), formula: [] });
  assert.equal(resolveValue({ $by_period: { TANG: 1, SONG: 2 } }, env, t()), 2);
  assert.equal(resolveValue({ $by_lighting: { DAYLIGHT: 1, '*': 9 } }, env, t()), 9);
  assert.throws(() => resolveValue({ $by_material: { BRONZE: 1 } }, env, t()), RegistryConflictError);
});

test('$band / $clamp / $min / $max / $ref resolve against the effective band and other rules', () => {
  const rules = [
    band('B1', 'PERIOD_BAND', 0.35, 0.8),
    { rule_id: 'CONST', kind: 'OPERATION_POLICY', payload: { params: { k: 0.45 } } },
    { rule_id: 'USE', kind: 'OPERATION_POLICY', payload: {
      lo: { $band: { parameter: P, edge: 'min' } },
      hi: { $band: { parameter: P, edge: 'max' } },
      clamped_hi: { $clamp: { value: 0.95, parameter: P } },
      clamped_lo: { $clamp: { value: 0.1, parameter: P } },
      ref: { $ref: 'CONST/payload/params/k' },
      mn: { $min: [0.6, { $ref: 'CONST/payload/params/k' }] },
      mx: { $max: [0.6, 0.2] },
    } },
  ];
  const { drafts } = resolveContext(reg(...rules.map((r) => ({ ...r, audience: ['sheet'], sources: ['S'] }))), ctx);
  const use = drafts.find((d) => d.rule.rule_id === 'USE');
  assert.deepEqual(use.payload, { lo: 0.35, hi: 0.8, clamped_hi: 0.8, clamped_lo: 0.35, ref: 0.45, mn: 0.45, mx: 0.6 });
  assert.deepEqual(use.derivation.inputs, ['D:B1:SONG.WOOD.DIM.OBJECT_STUDY']);
  assert.ok(use.derivation.formula.includes('clamp(0.95'));
});

test('soft band rules (DESIGN_DEFAULT) may derive from hard bands: resolved in the second pass', () => {
  const rules = [
    band('HARD', 'PERIOD_BAND', 0.3, 0.6),
    { rule_id: 'DEF', kind: 'PARAMETER_BAND', payload: { parameter: P, metric: 'm', semantics: 'DESIGN_DEFAULT', min: { $band: { parameter: P, edge: 'min' } }, max: { $band: { parameter: P, edge: 'max' } }, target: { $clamp: { value: 0.9, parameter: P } }, unit: 'ratio', rationale: 'fixture' } },
  ].map((r) => ({ ...r, sources: ['S'] }));
  const { drafts } = resolveContext(reg(...rules), ctx);
  const def = drafts.find((d) => d.rule.rule_id === 'DEF');
  assert.equal(def.payload.target, 0.6);
  assert.equal(def.payload.min, 0.3);
});

test('a $ref cycle, an unknown rule and an unknown operator are conflicts', () => {
  const mk = (payload) => reg({ rule_id: 'X', kind: 'OPERATION_POLICY', payload, sources: ['S'] }, { rule_id: 'Y', kind: 'OPERATION_POLICY', payload: { v: { $ref: 'X/payload/v' } }, sources: ['S'] });
  assert.throws(() => resolveContext(mk({ v: { $ref: 'Y/payload/v' } }), ctx), RegistryConflictError);
  assert.throws(() => resolveContext(mk({ v: { $ref: 'NOPE/payload/v' } }), ctx), RegistryConflictError);
  assert.throws(() => resolveContext(mk({ v: { $mystery: 1 } }), ctx), RegistryConflictError);
});

test('$band on a parameter without an applicable hard band is a conflict', () => {
  const r = reg({ rule_id: 'X', kind: 'OPERATION_POLICY', payload: { v: { $band: { parameter: P, edge: 'min' } } }, sources: ['S'] });
  assert.throws(() => resolveContext(r, ctx), RegistryConflictError);
});

test('decision ids are deterministic and context-qualified', () => {
  assert.equal(contextKey(ctx), 'SONG.WOOD.DIM.OBJECT_STUDY');
  const { drafts } = resolveContext(reg({ rule_id: 'R-1', kind: 'PRIORITY_ORDER', payload: { order: ['a', 'b'] }, sources: ['S'] }), ctx);
  assert.equal(drafts[0].decision_id, 'D:R-1:SONG.WOOD.DIM.OBJECT_STUDY');
});
