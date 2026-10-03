import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODULES = join(ROOT, 'modules');
const IMPLEMENTATION_MODULES = readdirSync(MODULES).filter((f) => f.endsWith('.md') && !['README.md', 'evidence-index.md'].includes(f)).sort();

const pointerOf = (text) => text.split('\n').find((l) => l.startsWith('> Implementation:'));

test('there is one module per core rule', () => {
  assert.equal(IMPLEMENTATION_MODULES.length, 10);
});

test('every module opens with the one-line pointer: Implementation · thresholds · rationale', () => {
  for (const f of IMPLEMENTATION_MODULES) {
    const p = pointerOf(readFileSync(join(MODULES, f), 'utf8'));
    assert.ok(p, `${f}: no "> Implementation:" pointer`);
    assert.match(p, / thresholds: /, `${f}: pointer has no thresholds`);
    assert.match(p, / rationale: `guidelines\/[a-z-]+\.md`/, `${f}: pointer has no rationale`);
  }
});

test('every path a module points at exists (engines, registry, guidelines, docs, evidence)', () => {
  for (const f of IMPLEMENTATION_MODULES) {
    const text = readFileSync(join(MODULES, f), 'utf8');
    const rule = /对应规则：(guidelines\/[a-z-]+\.md)/.exec(text)?.[1];
    assert.ok(rule && existsSync(join(ROOT, rule)), `${f}: 对应规则 path ${rule}`);
    const paths = [...text.matchAll(/`((?:lib|guidelines|rules|docs|scripts|assets|extracted)\/[^`\s*<>]+)`/g)].map((m) => m[1]);
    for (const p of paths) {
      const target = p.startsWith('extracted/') ? join(MODULES, p) : join(ROOT, p);
      assert.ok(existsSync(target), `${f}: \`${p}\` does not exist`);
    }
  }
});

test('modules hold no reference-implementation code: scoring, validators and threshold snippets live in lib/ and rules/', () => {
  for (const f of IMPLEMENTATION_MODULES) {
    const text = readFileSync(join(MODULES, f), 'utf8');
    const fences = [...text.matchAll(/^```(\w*)/gm)].map((m) => m[1]);
    assert.ok(!fences.some((l) => ['javascript', 'js', 'ts', 'typescript', 'jsx', 'tsx'].includes(l)), `${f}: has a code snippet`);
    assert.ok(!/\bfunction\s+\w+\s*\(|=>\s*\{|\bconst\s+\w+\s*=/.test(text), `${f}: has implementation code`);
  }
});

test('evidence sections say they hold observations, not thresholds', () => {
  for (const f of IMPLEMENTATION_MODULES) {
    const text = readFileSync(join(MODULES, f), 'utf8');
    if (!text.includes('素材库实证（Distillation Evidence）')) continue;
    assert.match(text, /观察值/, `${f}: evidence section does not call its numbers observations`);
    assert.match(text, /不是阈值/, `${f}: evidence section does not say they are not thresholds`);
  }
});

test('the module index lists every module with its implementation pointer', () => {
  const index = readFileSync(join(MODULES, 'README.md'), 'utf8');
  for (const f of IMPLEMENTATION_MODULES) assert.ok(index.includes(`| ${f} |`), `${f} missing from modules/README.md`);
  for (const engine of index.matchAll(/`(lib\/[^`]+\.js)`/g)) assert.ok(existsSync(join(ROOT, engine[1])), `${engine[1]} listed in modules/README.md does not exist`);
});
