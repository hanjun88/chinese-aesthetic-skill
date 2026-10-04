import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractBlock } from '../../scripts/docs-blocks.mjs';
import { BLOCK, GATES, SUITES, main, parseEngines, parseRulesLint, parseTap, renderEvidenceBlock } from '../../scripts/evidence.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const node = (...args) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', NODE_TEST_CONTEXT: undefined } });

function quiet(fn) {
  const { log, error } = console;
  const out = [];
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => out.push(a.join(' '));
  try { return { value: fn(), out }; } finally { console.log = log; console.error = error; }
}

const SUMMARY = {
  schema: 1,
  ok: true,
  suites: [
    { id: 'engines', title: 'Engine integration tests', command: 'node tests/engines.test.js', tests: 9, passed: 9, failed: 0, skipped: 0, ok: true },
    { id: 'rules', title: 'Rules registry tests', command: 'node --test tests/rules/*.test.js', tests: 5, passed: 4, failed: 0, skipped: 1, ok: true },
  ],
  gates: [{ id: 'registry-lint', title: 'Registry lint', command: 'node scripts/lint-rules.mjs', ok: true, rules: 7, sources: 3, contexts_valid: 11, contexts_excluded: 2 }],
};

/* ---------------------------------------------------------------- parsers on the REAL output formats */

test('parseEngines reads the line the engine suite really prints', () => {
  const r = node('tests/engines.test.js');
  assert.equal(r.status, 0);
  const parsed = parseEngines(r.stdout);
  assert.equal(parsed.failed, 0);
  assert.ok(parsed.passed > 0);
  assert.equal(parsed.tests, parsed.passed + parsed.failed);
  assert.match(r.stdout, new RegExp(`${parsed.passed} passed, ${parsed.failed} failed`));
});

test('parseTap reads the summary node:test really prints (tap reporter)', () => {
  const r = node('--test', '--test-reporter=tap', 'tests/rules/jcs.test.js');
  assert.equal(r.status, 0);
  const parsed = parseTap(r.stdout);
  assert.equal(parsed.failed, 0);
  assert.ok(parsed.tests > 0 && parsed.passed === parsed.tests);
  assert.equal(parsed.tests, (r.stdout.match(/^ok \d+ - /gm) ?? []).length, 'the summary agrees with the number of ok lines');
});

test('parseRulesLint reads the JSON the registry lint really prints', () => {
  const r = node('scripts/lint-rules.mjs', '--json');
  assert.equal(r.status, 0);
  const parsed = parseRulesLint(r.stdout);
  assert.equal(parsed.ok, true);
  assert.ok(parsed.rules > 0 && parsed.sources > 0 && parsed.contexts_valid > 0);
});

test('parsers refuse output that does not carry the numbers instead of reporting zero', () => {
  assert.throws(() => parseEngines('all good'), /测试结果/);
  assert.throws(() => parseTap('ok 1 - a\n1..1\n'), /# tests/);
  assert.throws(() => parseRulesLint('{"nope":1}'), /unexpected/);
});

test('parseTap counts cancelled as failed and todo as skipped', () => {
  const tap = '# tests 10\n# suites 0\n# pass 6\n# fail 1\n# cancelled 1\n# skipped 1\n# todo 1\n# duration_ms 5\n';
  assert.deepEqual(parseTap(tap), { tests: 10, passed: 6, failed: 2, skipped: 2 });
});

/* ---------------------------------------------------------------- rendering */

test('the evidence block is deterministic and carries only what the summary says', () => {
  const block = renderEvidenceBlock(SUMMARY);
  assert.equal(block, renderEvidenceBlock({ ...SUMMARY, generated_at: 'x', node: 'y' }), 'dates and versions never reach the README');
  assert.ok(block.startsWith(`<!-- ${BLOCK}:begin -->`) && block.endsWith(`<!-- ${BLOCK}:end -->`));
  assert.ok(block.includes('| Engine integration tests | `node tests/engines.test.js` | 9 | 0 |'));
  assert.ok(block.includes('| Rules registry tests | `node --test tests/rules/*.test.js` | 4 (+1 skipped) | 0 |'));
  assert.ok(block.includes('| Registry lint | `node scripts/lint-rules.mjs` | PASS — 7 rules, 3 sources, 11 valid + 2 excluded contexts |'));
});

test('the suite list is the one the README documents: engines, rules, docs, registry lint', () => {
  assert.deepEqual(SUITES.map((s) => s.command), ['node tests/engines.test.js', 'node --test tests/rules/*.test.js', 'node --test tests/docs/*.test.js']);
  assert.deepEqual(GATES.map((g) => g.command), ['node scripts/lint-rules.mjs']);
});

/* ---------------------------------------------------------------- CLI (--from-summary: nothing is executed) */

test('--check passes when README matches the summary, fails when it differs, never writes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evidence-'));
  try {
    const readme = join(dir, 'README.md');
    const summary = join(dir, 'summary.json');
    writeFileSync(summary, JSON.stringify(SUMMARY));
    const shell = (inner) => `intro\n\n<!-- ${BLOCK}:begin -->\n${inner}\n<!-- ${BLOCK}:end -->\n\noutro\n`;
    const args = ['--from-summary', '--summary', summary, '--readme', readme];

    writeFileSync(readme, shell('| Engine integration tests | `node tests/engines.test.js` | 1 | 0 |'));
    const stale = quiet(() => main(['--check', ...args]));
    assert.equal(stale.value, 1);
    assert.ok(stale.out.some((l) => l.includes('STALE')));
    assert.ok(readFileSync(readme, 'utf8').includes('| 1 | 0 |'), '--check never writes');

    assert.equal(quiet(() => main(args)).value, 0, 'write mode regenerates the block');
    assert.equal(extractBlock(readFileSync(readme, 'utf8'), BLOCK), renderEvidenceBlock(SUMMARY));
    assert.equal(quiet(() => main(['--check', ...args])).value, 0);
    assert.ok(readFileSync(readme, 'utf8').startsWith('intro\n\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a failing suite is never documented: exit 1, README untouched', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evidence-'));
  try {
    const readme = join(dir, 'README.md');
    const summary = join(dir, 'summary.json');
    const original = `x\n<!-- ${BLOCK}:begin -->\nOLD\n<!-- ${BLOCK}:end -->\n`;
    writeFileSync(readme, original);
    const failing = { ...SUMMARY, ok: false, suites: [{ ...SUMMARY.suites[0], failed: 2, passed: 7, ok: false }, SUMMARY.suites[1]] };
    writeFileSync(summary, JSON.stringify(failing));
    const r = quiet(() => main(['--from-summary', '--summary', summary, '--readme', readme]));
    assert.equal(r.value, 1);
    assert.ok(r.out.some((l) => l.includes('never documented')));
    assert.equal(readFileSync(readme, 'utf8'), original);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('missing summary, missing markers and bad flags exit 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evidence-'));
  try {
    const readme = join(dir, 'README.md');
    const summary = join(dir, 'summary.json');
    writeFileSync(readme, 'no markers');
    assert.equal(quiet(() => main(['--from-summary', '--summary', join(dir, 'absent.json'), '--readme', readme])).value, 2);
    writeFileSync(summary, JSON.stringify(SUMMARY));
    assert.equal(quiet(() => main(['--from-summary', '--summary', summary, '--readme', readme])).value, 2);
    assert.equal(quiet(() => main(['--bogus'])).value, 2);
    assert.equal(quiet(() => main(['--check', '--write'])).value, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the committed README carries an evidence block of the documented shape', () => {
  const block = extractBlock(readFileSync(join(ROOT, 'README.md'), 'utf8'), BLOCK);
  for (const s of SUITES) assert.ok(block.includes(`| ${s.title} | \`${s.command}\` |`), `row for ${s.command}`);
  for (const g of GATES) assert.ok(block.includes(`| ${g.title} | \`${g.command}\` |`), `row for ${g.command}`);
  assert.ok(!/FAIL/.test(block), 'a failing run is never committed');
});
