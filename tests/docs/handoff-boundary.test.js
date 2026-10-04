import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * The boundary this repository keeps toward a compiler:
 *   - it is the authority for aesthetic knowledge (rules, thresholds, provenance) and emits an explicit
 *     hand-off artefact (the AestheticConstraintSheet); it does not implement or enforce compiler logic;
 *   - the cross-repo binding is DEFERRED / UNBOUND: no compiler commit, schema version or contract hash is
 *     pinned or claimed anywhere, and no CI job reaches into another repository, until an independent
 *     binding task decides and verifies the consumer-side schema.
 * These tests make the second point impossible to break silently.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

function* walk(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return;
  if (statSync(abs).isFile()) { yield rel; return; }
  for (const name of readdirSync(abs).sort()) {
    if (['node_modules', '.git', 'dist'].includes(name)) continue;
    yield* walk(`${rel}/${name}`);
  }
}

// What would pin or vouch for a consumer. This file is not scanned, so it may name them.
const CLAIMS = /dc-contract|contract[-_.]pin|098b8e4|contract_hash|schema_version/;
const SCANNED = ['README.md', 'SKILL.md', 'skill.yaml', 'package.json', '.github', 'docs', 'playbooks', 'scripts', 'lib', 'rules/index.js'];

test('no document, script or CI file pins a compiler commit, schema version or contract hash', () => {
  const hits = [];
  for (const root of SCANNED) for (const f of walk(root)) if (CLAIMS.test(read(f))) hits.push(f);
  assert.deepEqual(hits, []);
});

test('there is no pin location: no contract/ directory and no *.pin.json file', () => {
  assert.ok(!existsSync(join(ROOT, 'contract')));
  const pins = [];
  for (const root of ['.', 'scripts', 'lib', 'rules', 'docs', 'playbooks']) {
    if (root === '.') { for (const f of readdirSync(ROOT)) if (/\.pin\.json$/.test(f)) pins.push(f); continue; }
    for (const f of walk(root)) if (/\.pin\.json$/.test(f)) pins.push(f);
  }
  assert.deepEqual(pins, []);
});

test('CI never reaches into another repository (no cross-repo checkout, no compiler job)', () => {
  for (const f of walk('.github/workflows')) {
    const t = read(f);
    assert.ok(!/design-compiler/.test(t), `${f} mentions design-compiler`);
    assert.ok(!/\.cross-repo/.test(t), `${f} uses a cross-repo checkout directory`);
    assert.ok(!/^\s+repository:\s/m.test(t), `${f} checks out another repository`);
  }
});

test('README and SKILL.md state the binding status explicitly: DEFERRED / UNBOUND', () => {
  for (const f of ['README.md', 'SKILL.md']) assert.match(read(f), /DEFERRED \/ UNBOUND/, f);
});

test('the skill emits constraints and decides nothing about enforcement: no engine or script imports a compiler', () => {
  const hits = [];
  for (const root of ['lib', 'scripts', 'rules']) {
    for (const f of walk(root)) {
      if (!/\.(m?js|cjs|ts)$/.test(f)) continue;
      const bad = read(f).split('\n').some((l) => /^\s*(import\b.*from|const .*require\()\s*['"][^'"]*(design-compiler|compiler-core|\.cross-repo)/.test(l));
      if (bad) hits.push(relative(ROOT, join(ROOT, f)));
    }
  }
  assert.deepEqual(hits, []);
});
