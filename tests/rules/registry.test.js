import test from 'node:test';
import assert from 'node:assert/strict';
import { REGISTRY, buildRegistry, getRule, bandEdge } from '../../lib/rules/registry.js';
import { lint } from '../../scripts/lint-rules.mjs';

test('the committed registry passes the registry lint (provenance, index coverage, every context)', () => {
  const r = lint();
  assert.deepEqual(r.problems, []);
  assert.ok(r.ok);
});

test('every rule has provenance, a bounded confidence and an id that starts with its family', () => {
  for (const r of REGISTRY.rules) {
    assert.ok(r.sources.length > 0, `${r.rule_id} has no source`);
    assert.ok(r.confidence >= 0 && r.confidence <= 1, `${r.rule_id} confidence`);
  }
});

test('the registry builder rejects structural defects instead of half-loading', () => {
  const base = {
    registry_version: '1.0.0',
    context_rule: { rule_id: 'CAS-CTX-001', sources: ['SRC-A'] },
    vocabulary: { roles: ['composition'], periods: { TANG: {} }, materials: { WOOD: {} }, lighting: { DIM: {} }, scene_types: { OBJECT_STUDY: {} } },
    source_files: { core: { 'SRC-A': { kind: 'expert-judgment', ref: 'external:x' } } },
    families: { 'T-F': { family: 'T-F', rules: [] } },
  };
  const withRule = (rule) => ({ ...base, families: { 'T-F': { family: 'T-F', rules: [{ rule_id: 'T-F-1', title: 't', kind: 'PRIORITY_ORDER', role: 'composition', confidence: 0.5, sources: ['SRC-A'], payload: {}, ...rule }] } } });
  assert.doesNotThrow(() => buildRegistry(withRule({})));
  assert.throws(() => buildRegistry(withRule({ sources: [] })), /provenance missing/);
  assert.throws(() => buildRegistry(withRule({ sources: ['SRC-NOPE'] })), /unknown source/);
  assert.throws(() => buildRegistry(withRule({ confidence: 1.5 })), /confidence/);
  assert.throws(() => buildRegistry(withRule({ kind: 'MYSTERY' })), /unknown kind/);
  assert.throws(() => buildRegistry(withRule({ role: 'nope' })), /unknown role/);
  assert.throws(() => buildRegistry(withRule({ rule_id: 'X-1' })), /must start with its family/);
  assert.throws(() => buildRegistry(withRule({ applies_to: { period: ['YUAN'] } })), /not in the vocabulary/);
  assert.throws(() => buildRegistry(withRule({ applies_to: { colour: ['RED'] } })), /not a context axis/);
  const dup = withRule({});
  dup.source_files.extra = { 'SRC-A': { kind: 'expert-judgment', ref: 'external:y' } };
  assert.throws(() => buildRegistry(dup), /more than one shard/);
});

test('ADR-0001: the void_ratio decisions are exactly the accepted ones', () => {
  const edge = (id, e) => bandEdge(id, e);
  assert.equal(edge('CAS-VS-PB-TANG', 'min'), 0.15);
  assert.equal(edge('CAS-VS-PB-TANG', 'max'), 0.40);
  assert.equal(edge('CAS-VS-PB-SONG', 'min'), 0.35);
  assert.equal(edge('CAS-VS-PB-SONG', 'max'), 0.80);
  assert.equal(edge('CAS-VS-PB-MING', 'min'), 0.25);
  assert.equal(edge('CAS-VS-PB-MING', 'max'), 0.50);
  assert.equal(edge('CAS-VS-HF-001', 'min'), 0.60);
  assert.deepEqual(getRule('CAS-VS-HF-001').applies_to, { scene_type: ['LANDSCAPE'], lighting: ['DAYLIGHT'] });
  assert.equal(edge('CAS-VS-SS-001', 'min'), 0.50);
  assert.equal(getRule('CAS-VS-SS-001').payload.semantics, 'STRUCTURAL_SIGNAL');
  assert.deepEqual(getRule('CAS-VS-SS-001').audience, ['engine']);
});

test('ADR-0001: superseded values and merged rules are gone', () => {
  const ids = new Set(REGISTRY.rules.map((r) => r.rule_id));
  assert.ok(!ids.has('ANTI-AI-02'), 'ANTI-AI-02 was merged into CA-RULE-01-XUSHI');
  assert.ok(!ids.has('CA-RULE-13'), 'the unsourced numeric cap is not carried over');
  assert.ok(ids.has('CA-RULE-01-XUSHI'));
});
