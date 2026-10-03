#!/usr/bin/env node
/**
 * evidence.mjs — the repository's test evidence, derived from real runs, never typed.
 *
 * Runs the suites below, parses their REAL output (the engine suite prints
 * "测试结果: N passed, M failed", node:test prints a TAP summary, the registry lint prints JSON),
 * writes evidence/summary.json (git-ignored) and renders the test-count table between
 * `<!-- evidence:begin -->` and `<!-- evidence:end -->` in README.md. No document may state a test
 * count by hand (scripts/lint-docs.mjs rule C); this block is the only place counts appear.
 *
 *   node scripts/evidence.mjs                run the suites, write evidence/summary.json and README's block
 *   node scripts/evidence.mjs --check        run the suites; exit 1 when README's block differs from the summary
 *     --from-summary                         do not run anything: use the existing evidence/summary.json
 *     --summary <file> / --readme <file>     other locations (tests)
 *
 * A failing suite is never documented: the summary is still written, README is not touched, exit 1.
 * Exit codes: 0 ok · 1 failing suite or stale block · 2 usage / missing markers or summary.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BlockError, beginMarker, endMarker, syncBlock } from './docs-blocks.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const BLOCK = 'evidence';
export const SUMMARY_FILE = join(ROOT, 'evidence', 'summary.json');

/* ------------------------------------------------------------------ parsers (pure, tested on real output) */

/** tests/engines.test.js: "  测试结果: 112 passed, 0 failed" */
export function parseEngines(stdout) {
  const m = /测试结果:\s*(\d+)\s*passed,\s*(\d+)\s*failed/.exec(stdout);
  if (!m) throw new Error('no "测试结果: N passed, M failed" line in the output');
  return { tests: Number(m[1]) + Number(m[2]), passed: Number(m[1]), failed: Number(m[2]), skipped: 0 };
}

/** node --test --test-reporter=tap: the "# tests N / # pass N / # fail N ..." summary at the end of the stream. */
export function parseTap(stdout) {
  const get = (key) => {
    const m = new RegExp(`^# ${key} (\\d+)\\s*$`, 'm').exec(stdout);
    if (!m) throw new Error(`no "# ${key} N" summary line in the TAP output`);
    return Number(m[1]);
  };
  return { tests: get('tests'), passed: get('pass'), failed: get('fail') + get('cancelled'), skipped: get('skipped') + get('todo') };
}

/** scripts/lint-rules.mjs --json */
export function parseRulesLint(stdout) {
  const r = JSON.parse(stdout);
  if (typeof r.ok !== 'boolean' || !r.stats) throw new Error('unexpected registry lint JSON');
  return { ok: r.ok, problems: r.problems.length, rules: r.stats.rules, sources: r.stats.sources, contexts_valid: r.stats.contexts_valid, contexts_excluded: r.stats.contexts_excluded };
}

/* ------------------------------------------------------------------ suites */

const testFiles = (dir) => readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.test.js')).sort().map((f) => `${dir}/${f}`);

/** `command` is what the README shows; `argv` is what is executed (globs expanded here so Node 20 works too). */
export const SUITES = [
  { id: 'engines', title: 'Engine integration tests', command: 'node tests/engines.test.js', argv: () => ['tests/engines.test.js'], parse: parseEngines },
  { id: 'rules', title: 'Rules registry tests', command: 'node --test tests/rules/*.test.js', argv: () => ['--test', '--test-reporter=tap', ...testFiles('tests/rules')], parse: parseTap },
  { id: 'docs', title: 'Docs generator tests', command: 'node --test tests/docs/*.test.js', argv: () => ['--test', '--test-reporter=tap', ...testFiles('tests/docs')], parse: parseTap },
];
export const GATES = [
  { id: 'registry-lint', title: 'Registry lint', command: 'node scripts/lint-rules.mjs', argv: () => ['scripts/lint-rules.mjs', '--json'], parse: parseRulesLint },
];

function run(argv) {
  const env = { ...process.env, NO_COLOR: '1' };
  delete env.NODE_TEST_CONTEXT; // a child `node --test` must not believe it runs inside a parent test
  const r = spawnSync(process.execPath, argv, { cwd: ROOT, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024, timeout: 600_000 });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '', error: r.error };
}

/** Run one suite or gate; parse errors are failures, never silently zero. */
function execute(def) {
  const base = { id: def.id, title: def.title, command: def.command };
  const r = run(def.argv());
  if (r.error) return { ...base, ok: false, error: String(r.error.message ?? r.error) };
  try {
    const parsed = def.parse(r.stdout);
    return { ...base, ...parsed, ok: r.status === 0 && (parsed.ok ?? parsed.failed === 0) };
  } catch (e) {
    return { ...base, ok: false, error: e.message, exit: r.status, tail: (r.stderr || r.stdout).split('\n').slice(-12).join('\n') };
  }
}

export function collect() {
  const suites = SUITES.map(execute);
  const gates = GATES.map(execute);
  return {
    schema: 1,
    generator: 'scripts/evidence.mjs',
    generated_at: new Date().toISOString(),
    node: process.version,
    ok: [...suites, ...gates].every((s) => s.ok),
    suites,
    gates,
  };
}

/* ------------------------------------------------------------------ rendering (deterministic: no dates, no durations) */

export function renderEvidenceBlock(summary) {
  const out = [
    beginMarker(BLOCK),
    '<!-- generated by `node scripts/evidence.mjs` from the real output of the commands below; never edit by hand -->',
    '',
    '| Suite | Command | Passed | Failed |',
    '|---|---|---:|---:|',
  ];
  for (const s of summary.suites) out.push(`| ${s.title} | \`${s.command}\` | ${s.passed}${s.skipped ? ` (+${s.skipped} skipped)` : ''} | ${s.failed} |`);
  out.push('', '| Gate | Command | Result |', '|---|---|---|');
  for (const g of summary.gates) {
    const detail = g.id === 'registry-lint' ? ` — ${g.rules} rules, ${g.sources} sources, ${g.contexts_valid} valid + ${g.contexts_excluded} excluded contexts` : '';
    out.push(`| ${g.title} | \`${g.command}\` | ${g.ok ? 'PASS' : 'FAIL'}${detail} |`);
  }
  out.push(endMarker(BLOCK));
  return out.join('\n');
}

/* ------------------------------------------------------------------ CLI */

export function main(argv = process.argv.slice(2)) {
  const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
  const check = argv.includes('--check');
  const fromSummary = argv.includes('--from-summary');
  const known = new Set(['--check', '--write', '--from-summary', '--summary', '--readme']);
  const bad = argv.some((a) => a.startsWith('--') && !known.has(a)) || (argv.includes('--summary') && !opt('summary')) || (argv.includes('--readme') && !opt('readme')) || (check && argv.includes('--write'));
  if (bad) { console.error('usage: evidence.mjs [--check] [--from-summary] [--summary <file>] [--readme <file>]'); return 2; }

  const summaryFile = opt('summary') ? resolve(opt('summary')) : SUMMARY_FILE;
  let summary;
  if (fromSummary) {
    if (!existsSync(summaryFile)) { console.error(`evidence: ${summaryFile} does not exist; run \`npm run evidence\` first`); return 2; }
    summary = JSON.parse(readFileSync(summaryFile, 'utf8'));
  } else {
    summary = collect();
    mkdirSync(dirname(summaryFile), { recursive: true });
    writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`);
  }
  if (!summary.ok) {
    console.error('evidence: a suite failed; README is not updated (a failing run is never documented)');
    for (const s of [...summary.suites, ...summary.gates].filter((x) => !x.ok)) console.error(`  - ${s.title} (${s.command}): ${s.error ?? `${s.failed ?? ''} failed`}${s.tail ? `\n${s.tail}` : ''}`);
    return 1;
  }
  try {
    return syncBlock({
      file: opt('readme') ? resolve(opt('readme')) : join(ROOT, 'README.md'),
      name: BLOCK,
      generate: () => renderEvidenceBlock(summary),
      mode: check ? 'check' : 'write',
      label: 'evidence',
      command: 'npm run evidence',
    });
  } catch (e) {
    if (e instanceof BlockError) { console.error(`evidence: ${e.message}`); return 2; }
    throw e;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
