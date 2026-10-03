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

test('the orphan cross-repo pin of the handoff playbook is gone, and nothing refers to it', () => {
  assert.ok(!existsSync(join(ROOT, 'playbooks', 'asset-to-runtime-handoff', `${RETIRED_PIN}.json`)));
  const hits = [...textFiles(ROOT)].filter((f) => f !== 'tests/docs/retired.test.js' && (read(f).includes(RETIRED_PIN) || read(f).includes(RETIRED_POLICY)));
  assert.deepEqual(hits, []);
});

test('the handoff playbook no longer binds the compiler\'s internal scene contract', () => {
  const dirName = join(ROOT, 'playbooks', 'asset-to-runtime-handoff');
  const text = readdirSync(dirName).map((f) => readFileSync(join(dirName, f), 'utf8')).join('\n');
  assert.ok(!text.includes('scene-contract/types.ts'), 'no schema location of the compiler\'s internal types');
  assert.ok(!/SceneAssetManifest/.test(text));
  assert.ok(text.includes('AestheticConstraintSheet'), 'the contract between the repositories is named');
  assert.ok(text.includes('contract/dc-contract.pin.json'), 'and pinned where the skill pins it');
  assert.ok(text.includes('SceneCompilationIR'), 'the compiler-internal contract is named as internal');
  assert.match(text, /不是与本仓库的契约|不绑定/);
});

test('skill.yaml has no descriptive api block; a contract pointer replaces it and points at things that exist', () => {
  const y = read('skill.yaml');
  assert.ok(!/^api:/m.test(y), 'the api block is retired');
  assert.ok(!/input_schema|output_schema/.test(y));
  const block = /^contract:\n((?:[ \t]+.*\n?)+)/m.exec(y)?.[1];
  assert.ok(block, 'skill.yaml declares a contract: block');
  const field = (k) => new RegExp(`^\\s+${k}:\\s*(.+?)\\s*$`, 'm').exec(block)?.[1];
  assert.equal(field('name'), 'AestheticConstraintSheet');
  assert.equal(field('owner'), 'design-compiler');
  for (const k of ['pin', 'registry']) assert.ok(existsSync(join(ROOT, field(k))), `${k}: ${field(k)} exists`);
  assert.ok(field('emit').startsWith('node ') && existsSync(join(ROOT, field('emit').replace(/^node\s+/, ''))), 'emit command points at an existing script');
});

test('the pin that skill.yaml names is the one the emitter uses', () => {
  const pin = JSON.parse(read('contract/dc-contract.pin.json'));
  assert.equal(pin.contract, 'AestheticConstraintSheet');
  assert.match(pin.contract_hash, /^[a-f0-9]{64}$/);
});

test('README and SKILL.md document the machine contract and how to generate it', () => {
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
