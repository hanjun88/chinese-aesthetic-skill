import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANDOFF_BINDING, emitSheet, enumerateContexts, hashOf, registryHash, ledgerHash } from '../../scripts/lib/sheet-emitter.mjs';
import { REGISTRY } from '../../lib/rules/registry.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE = { commit: 'a'.repeat(40), dirty: false };
const emit = (ctx) => emitSheet(ctx, { state: STATE });
const C = (period, material, lighting, scene_type = 'OBJECT_STUDY') => ({ period, material, lighting, scene_type });

test('emission is deterministic: same registry + context + commit => identical bytes', () => {
  const a = JSON.stringify(emit(C('SONG', 'STONE', 'DIM')));
  const b = JSON.stringify(emit(C('SONG', 'STONE', 'DIM')));
  assert.equal(a, b);
});

test('the sheet is self-consistent: unique decision ids, confidence = min, hashes recompute', () => {
  const s = emit(C('TANG', 'BRONZE', 'DAYLIGHT'));
  const ids = s.constraints.map((c) => c.decision_id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(s.confidence, Math.min(...s.constraints.map((c) => c.confidence)));
  assert.equal(s.provenance.constraint_count, s.constraints.length);
  for (const c of s.constraints) {
    const { content_hash, ...prov } = c.provenance;
    assert.equal(content_hash, hashOf({ ...c, provenance: prov }));
    assert.ok(c.provenance.sources.length >= 1);
    assert.match(c.decision_id, /^D:/);
  }
  const { content_hash, ...prov } = s.provenance;
  assert.equal(content_hash, hashOf({ ...s, provenance: prov }));
  assert.equal(s.source_ref.registry_hash, registryHash());
  assert.equal(s.provenance.ledger_hash, ledgerHash());
});

test('the cross-repo binding is explicitly DEFERRED / UNBOUND: no compiler commit, schema version or contract hash is pinned or claimed', () => {
  assert.equal(HANDOFF_BINDING.status, 'UNBOUND');
  const s = emit(C('SONG', 'STONE', 'DIM'));
  assert.deepEqual(s.binding, { ...HANDOFF_BINDING });
  // a sheet vouches for no consumer schema, in any key at any depth
  const keys = new Set();
  const walk = (v) => { if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { keys.add(k); walk(x); } };
  walk(s);
  for (const k of ['schema_version', 'contract_hash', 'contract_range', 'compiler_commit', 'pin']) assert.ok(!keys.has(k), `sheet key "${k}" would claim a binding`);
  // nothing in the repository ships a pin file for it either
  assert.ok(!existsSync(join(ROOT, 'contract')), 'contract/ (a pin location) does not exist while the binding is deferred');
});

test('every valid context of the vocabulary emits; every excluded context is refused', () => {
  const { valid, excluded } = enumerateContexts();
  assert.ok(valid.length > 100);
  for (const ctx of valid) assert.doesNotThrow(() => emit(ctx), JSON.stringify(ctx));
  for (const ctx of excluded) assert.throws(() => emit(ctx), /excluded/, JSON.stringify(ctx));
});

test('ADR-0001 in the emitted sheets: bands, hard floor scope, derived repair targets', () => {
  const band = (s, sem) => s.constraints.find((c) => c.kind === 'PARAMETER_BAND' && c.payload.parameter === 'scene.composition.negativeSpaceRatio' && c.payload.semantics === sem);
  assert.deepEqual([band(emit(C('TANG', 'WOOD', 'DIM')), 'PERIOD_BAND').payload.min, band(emit(C('TANG', 'WOOD', 'DIM')), 'PERIOD_BAND').payload.max], [0.15, 0.4]);
  assert.deepEqual([band(emit(C('SONG', 'WOOD', 'DIM')), 'PERIOD_BAND').payload.min, band(emit(C('SONG', 'WOOD', 'DIM')), 'PERIOD_BAND').payload.max], [0.35, 0.8]);
  // the hard floor exists only for bright-tone landscape
  assert.equal(band(emit(C('SONG', 'WOOD', 'DAYLIGHT', 'LANDSCAPE')), 'HARD_FLOOR').payload.min, 0.6);
  assert.equal(band(emit(C('SONG', 'WOOD', 'DIM', 'LANDSCAPE')), 'HARD_FLOOR'), undefined);
  assert.equal(band(emit(C('SONG', 'WOOD', 'DAYLIGHT', 'PALACE')), 'HARD_FLOOR'), undefined);
  // CA-RULE-01: trigger = lower edge of the effective band, target inside the band
  for (const [period, lo, hi] of [['TANG', 0.15, 0.4], ['SONG', 0.35, 0.8], ['MING', 0.25, 0.5]]) {
    const r = emit(C(period, 'WOOD', 'DIM')).constraints.find((c) => c.rule_id === 'CA-RULE-01-XUSHI').payload;
    assert.equal(r.condition.value, lo);
    assert.ok(r.mutation.value >= lo && r.mutation.value <= hi);
  }
  // in the bright SONG landscape the hard floor lifts both the trigger and the repair target
  const r = emit(C('SONG', 'WOOD', 'DAYLIGHT', 'LANDSCAPE')).constraints.find((c) => c.rule_id === 'CA-RULE-01-XUSHI').payload;
  assert.equal(r.condition.value, 0.6);
  assert.equal(r.mutation.value, 0.6);
});

test('no superseded negative-space number survives in any emitted rule', () => {
  const { valid } = enumerateContexts();
  for (const ctx of valid.filter((c) => c.lighting === 'DIM' && c.material === 'WOOD')) {
    const s = emit(ctx);
    for (const c of s.constraints.filter((x) => x.kind === 'GRAMMAR_RULE' && x.payload.target_path.includes('negativeSpaceRatio'))) {
      assert.ok(![0.48, 0.58, 0.72, 0.3].includes(c.payload.mutation.value), `${c.rule_id} carries a superseded value in ${ctx.period}`);
    }
  }
});

test('capabilities requested by a sheet are exactly the kinds it uses', () => {
  const s = emit(C('SONG', 'STONE', 'DIM'));
  const kinds = new Set(s.constraints.map((c) => c.kind));
  const caps = new Set(s.compatibility.requires_capabilities);
  assert.ok(caps.has('cap.hash.rfc8785-sha256@1'));
  assert.ok(caps.has('cap.pointer.core-ir@1'));
  for (const k of kinds) assert.ok(caps.has(`cap.constraint.${k.toLowerCase().replaceAll('_', '-')}@1`), k);
  assert.equal(caps.size, kinds.size + 2);
});

test('the CLI refuses an excluded context with exit code 1 and an unknown value with exit code 1', () => {
  const run = (args) => spawnSync('node', [join(ROOT, 'scripts', 'emit-sheet.mjs'), ...args], { encoding: 'utf8' });
  const r = run(['--period', 'TANG', '--material', 'WOOD', '--lighting', 'DAYLIGHT', '--scene-type', 'LANDSCAPE']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /excluded/);
  assert.equal(run(['--period', 'YUAN', '--material', 'WOOD', '--lighting', 'DIM']).status, 1);
  assert.equal(run(['--period', 'TANG']).status, 2);
});

test('the registry hash ignores family file order but not content', () => {
  const rules = [...REGISTRY.rules].reverse();
  assert.equal(registryHash({ ...REGISTRY, rules }), registryHash());
  const tweaked = REGISTRY.rules.map((r, i) => (i === 0 ? { ...r, confidence: r.confidence - 0.01 } : r));
  assert.notEqual(registryHash({ ...REGISTRY, rules: tweaked }), registryHash());
});
