import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

function* textFiles(dir) {
  for (const name of readdirSync(dir).sort()) {
    if (['node_modules', '.git', 'dist', 'evidence', 'distillation'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* textFiles(p);
    else if (/\.(md|json|ya?ml|js|mjs|cjs|ts|tsx|html)$/.test(name)) yield relative(ROOT, p).split('\\').join('/');
  }
}

// the retired names are assembled here so that this file does not match its own scan
const RETIRED_PIN = ['cross-repo', 'binding'].join('-');
const RETIRED_POLICY = ['STRICT', 'MATCH', 'REQUIRED'].join('_');

test('the orphan cross-repo binding of the handoff playbook is gone, and nothing refers to it', () => {
  assert.ok(!existsSync(join(ROOT, 'playbooks', 'asset-to-runtime-handoff', `${RETIRED_PIN}.json`)));
  const hits = [...textFiles(ROOT)].filter((f) => f !== 'tests/docs/retired.test.js' && (read(f).includes(RETIRED_PIN) || read(f).includes(RETIRED_POLICY)));
  assert.deepEqual(hits, []);
});

test('README and SKILL.md document the hand-off artefact and how to generate it', () => {
  for (const f of ['README.md', 'SKILL.md']) {
    const t = read(f);
    assert.ok(t.includes('AestheticConstraintSheet') && t.includes('emit-sheet'), f);
  }
  assert.ok(!/API 调用/.test(read('README.md')), 'the descriptive API example is gone from the README');
});

test('no document keeps the retired v1 floor or the retired module grades', () => {
  const superseded = JSON.parse(read('rules/superseded.json')).map((s) => s.literal);
  const hits = [];
  for (const f of textFiles(ROOT)) {
    if (/^(docs\/decisions|docs\/closure|rules|tests)\//.test(f) || f.startsWith('modules/extracted/') || f.endsWith('lint-docs.mjs')) continue;
    for (const lit of superseded) if (read(f).includes(lit)) hits.push(`${f}: ${lit}`);
  }
  assert.deepEqual(hits, []);
  assert.ok(!/voidRatio >= 0\.3\b/.test(read('modules/void_solid.md')));
});
