import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, renderMd } from '../../scripts/lint-conflicts.mjs';

const r = check();

test('every threshold-conflict assertion holds in every valid context', () => {
  assert.deepEqual(r.problems, []);
});

test('no assertion is vacuous: each rule-based assertion applies in at least one context', () => {
  for (const x of r.report.filter((a) => !a.assertion.endsWith('absent_rule'))) assert.ok(x.contexts > 0, `${x.assertion} never applies`);
});

test('the ledger covers the migrated operator/plan conflicts and the negative-space ADR', () => {
  const ids = r.ledger.entries.map((e) => e.id);
  for (const id of ['TC-01', 'TC-02', 'TC-03', 'TC-04', 'TC-05']) assert.ok(ids.includes(id), `${id} missing`);
});

test('the Markdown view is generated from the JSON (no hand-written second copy)', () => {
  assert.match(renderMd(r), /^# Threshold-conflict ledger/);
});
