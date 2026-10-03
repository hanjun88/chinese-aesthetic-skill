import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { contextKey } from '../../lib/rules/derive.js';
import { emitSheet, enumerateContexts } from '../../scripts/lib/sheet-emitter.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** All files below `dir` as sorted posix paths relative to `dir`. */
function listFiles(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p, base));
    else out.push(relative(base, p).split('\\').join('/'));
  }
  return out.sort();
}

// `pack-skill.cjs --out <dir>` is the dry-run: it collects, copies and self-checks without installing anywhere
const out = mkdtempSync(join(tmpdir(), 'cas-pack-'));
after(() => rmSync(out, { recursive: true, force: true }));
const pack = spawnSync(process.execPath, ['scripts/pack-skill.cjs', '--out', out], { cwd: ROOT, encoding: 'utf8' });
const packed = listFiles(out);
const has = (rel) => packed.includes(rel);

test('the pack succeeds and its self-check (which runs emit-sheet from the pack) passes', () => {
  assert.equal(pack.status, 0, pack.stdout + pack.stderr);
  assert.match(pack.stdout, /自检通过/);
});

test('the registry and the contract pin are part of the skill: rules/ and contract/ ship complete', () => {
  for (const dir of ['rules', 'contract']) {
    const inRepo = listFiles(join(ROOT, dir)).map((f) => `${dir}/${f}`);
    assert.ok(inRepo.length > 0);
    for (const f of inRepo) assert.ok(has(f), `${f} is missing from the pack`);
  }
  assert.ok(has('contract/dc-contract.pin.json'));
  assert.ok(has('rules/index.js') && has('rules/vocabulary.json') && has('rules/superseded.json'));
});

test('everything the registry and the sheet emitter import ships too: lib/, scripts/ and scripts/lib/', () => {
  for (const f of ['lib/index.js', 'lib/rules/registry.js', 'lib/rules/derive.js', 'scripts/emit-sheet.mjs', 'scripts/lib/sheet-emitter.mjs', 'scripts/lib/jcs.mjs', 'scripts/lint-rules.mjs', 'scripts/lint-docs.mjs', 'SKILL.md', 'skill.yaml', 'package.json']) {
    assert.ok(has(f), `${f} is missing from the pack`);
  }
});

test('the UI demo sources, CI config, lock files and reference images stay out of the pack', () => {
  assert.deepEqual(packed.filter((f) => /^(src|\.github|node_modules|dist|\.git)\//.test(f)), []);
  assert.deepEqual(packed.filter((f) => /(^|\/)(bun\.lock|package-lock\.json)$/.test(f) || /\.(jpe?g|png|webp|gif|mp4|mov)$/i.test(f)), []);
});

test('the packed skill can run `node scripts/emit-sheet.mjs --list` and lists the repo\'s contexts', () => {
  const r = spawnSync(process.execPath, ['scripts/emit-sheet.mjs', '--list'], { cwd: out, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const { valid, excluded } = enumerateContexts();
  assert.deepEqual(JSON.parse(r.stdout), { valid: valid.map(contextKey), excluded: excluded.map(contextKey) });
});

test('the packed skill emits the same AestheticConstraintSheet as the repository (non-git copy: SKILL_COMMIT)', () => {
  const sha = 'a'.repeat(40);
  const ctx = { period: 'SONG', material: 'STONE', lighting: 'DIM', scene_type: 'OBJECT_STUDY' };
  // GIT_CEILING_DIRECTORIES: the pack must behave as a copy that is not inside any git checkout
  const env = { ...process.env, SKILL_COMMIT: sha, GIT_CEILING_DIRECTORIES: dirname(out) };
  const r = spawnSync(process.execPath, ['scripts/emit-sheet.mjs', '--period', ctx.period, '--material', ctx.material, '--lighting', ctx.lighting, '--scene-type', ctx.scene_type], { cwd: out, encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `${JSON.stringify(emitSheet(ctx, { state: { commit: sha, dirty: false } }), null, 2)}\n`);
});

test('without SKILL_COMMIT a non-git copy refuses to emit a sheet instead of inventing provenance', () => {
  const env = { ...process.env, GIT_CEILING_DIRECTORIES: dirname(out) };
  delete env.SKILL_COMMIT;
  const r = spawnSync(process.execPath, ['scripts/emit-sheet.mjs', '--period', 'SONG', '--material', 'STONE', '--lighting', 'DIM'], { cwd: out, encoding: 'utf8', env });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /SKILL_COMMIT/);
});

test('the engines of the pack load their thresholds from the packed registry and behave like the repository\'s', async () => {
  const mod = await import(pathToFileURL(join(out, 'lib', 'index.js')).href);
  const repo = await import(pathToFileURL(join(ROOT, 'lib', 'index.js')).href);
  assert.equal(mod.ENGINE_COUNT, 10);
  const design = { voidRatio: 0.65, colors: ['#E8E4D9', '#2C3E50', '#B8860B'], brightnessRatio: 4, buildingToHumanRatio: 10 };
  assert.deepEqual(mod.chineseness.assessChineseness(design), repo.chineseness.assessChineseness(design));
  assert.deepEqual(mod.spatialEngine.generateSpatialOrder({ sceneType: 'landscape' }), repo.spatialEngine.generateSpatialOrder({ sceneType: 'landscape' }));
});

test('the packed SKILL.md keeps its frontmatter and the pack has no skill.yaml api block', () => {
  assert.match(readFileSync(join(out, 'SKILL.md'), 'utf8'), /^---\nname: \S+/);
  assert.ok(!/^api:/m.test(readFileSync(join(out, 'skill.yaml'), 'utf8')));
});
