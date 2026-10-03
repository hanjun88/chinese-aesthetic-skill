#!/usr/bin/env node
/**
 * lint-conflicts.mjs — the threshold-conflict ledger is verified, not asserted.
 *
 * docs/closure/THRESHOLD-CONFLICTS.json lists every place where aesthetic thresholds, repair targets or bounds
 * disagreed (or one concept was defined twice) and how the registry resolves it. Each entry carries assertions that
 * are evaluated here against the RESOLVED decisions of every valid design context:
 *
 *   band_edge    { rule, path, parameter, edge }   the resolved value IS the edge of the context's effective band
 *   within_band  { rule, path, parameter }         the resolved value lies inside the effective band
 *   equals       { a: {rule, path}, b: {rule, path} }   two decisions that name one concept carry one value
 *   absent_rule  { rule }                          a superseded duplicate no longer exists in the registry
 *
 * `path` navigates the rule's resolved payload (e.g. params.negative_space_min, mutation.value, condition.value).
 * An assertion that never applies in any context is vacuous and fails; so does a violation in any single context.
 * The Markdown view (docs/closure/THRESHOLD-CONFLICTS.md) is generated from the JSON and must be current.
 *
 *   node scripts/lint-conflicts.mjs [--json] [--write-md]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from '../lib/rules/registry.js';
import { resolveRuleIn, contextKey } from '../lib/rules/derive.js';
import { enumerateContexts } from './lib/sheet-emitter.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER = join(ROOT, 'docs', 'closure', 'THRESHOLD-CONFLICTS.json');
const MD = join(ROOT, 'docs', 'closure', 'THRESHOLD-CONFLICTS.md');
const TYPES = new Set(['band_edge', 'within_band', 'equals', 'absent_rule']);
const EPS = 1e-9;

const dig = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const ruleIds = new Set(REGISTRY.rules.map((r) => r.rule_id));

export function check() {
  const ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
  const problems = [];
  const bad = (m) => problems.push(m);
  const { valid } = enumerateContexts();
  const seen = new Set();
  const report = [];

  for (const e of ledger.entries) {
    if (seen.has(e.id)) bad(`${e.id}: duplicate entry id`);
    seen.add(e.id);
    for (const f of ['concept', 'positions', 'resolution', 'assertions']) if (!e[f] || (Array.isArray(e[f]) && !e[f].length)) bad(`${e.id}: ${f} missing`);
    for (const [i, a] of (e.assertions ?? []).entries()) {
      const at = `${e.id}#${i + 1} ${a.type}`;
      if (!TYPES.has(a.type)) { bad(`${at}: unknown assertion type`); continue; }
      if (a.type === 'absent_rule') {
        if (ruleIds.has(a.rule)) bad(`${at}: rule ${a.rule} still exists in the registry (a superseded duplicate must be deleted)`);
        report.push({ entry: e.id, assertion: at, rule: a.rule, contexts: 0 });
        continue;
      }
      const refs = a.type === 'equals' ? [a.a, a.b] : [a];
      for (const r of refs) if (!ruleIds.has(r.rule)) bad(`${at}: unknown rule ${r.rule}`);
      if (refs.some((r) => !ruleIds.has(r.rule))) continue;
      let applicable = 0;
      let violations = 0;
      for (const ctx of valid) {
        const resolved = refs.map((r) => resolveRuleIn(REGISTRY, ctx, r.rule));
        if (resolved.some((x) => x === undefined)) continue; // the rule does not apply to this context
        const values = refs.map((r, k) => dig(resolved[k].payload, r.path));
        if (values.some((v) => typeof v !== 'number')) { bad(`${at}: ${refs.map((r, k) => `${r.rule}.${r.path}=${JSON.stringify(values[k])}`).join(' vs ')} is not a number in ${contextKey(ctx)}`); violations++; break; }
        applicable++;
        if (a.type === 'equals') {
          if (Math.abs(values[0] - values[1]) > EPS) { violations++; if (violations <= 3) bad(`${at}: ${a.a.rule}.${a.a.path}=${values[0]} != ${a.b.rule}.${a.b.path}=${values[1]} in ${contextKey(ctx)}`); }
          continue;
        }
        const band = resolved[0].bands.get(a.parameter);
        if (!band) { violations++; if (violations <= 3) bad(`${at}: no effective band for ${a.parameter} in ${contextKey(ctx)}`); continue; }
        const v = values[0];
        const ok = a.type === 'band_edge' ? Math.abs(v - (a.edge === 'min' ? band.lo : band.hi)) <= EPS : v >= band.lo - EPS && v <= band.hi + EPS;
        if (!ok) { violations++; if (violations <= 3) bad(`${at}: ${a.rule}.${a.path}=${v} is ${a.type === 'band_edge' ? `not the ${a.edge} edge` : 'outside'} of ${a.parameter} [${band.lo}, ${band.hi}] in ${contextKey(ctx)}`); }
      }
      if (applicable === 0) bad(`${at}: vacuous — never applicable in any of the ${valid.length} valid contexts`);
      report.push({ entry: e.id, assertion: at, rule: refs.map((r) => r.rule).join(' / '), contexts: applicable, violations });
    }
  }
  return { ledger, problems, report, contexts: valid.length };
}

export function renderMd({ ledger, report, contexts }) {
  const lines = [
    '# Threshold-conflict ledger',
    '',
    'Generated by `scripts/lint-conflicts.mjs --write-md` from `THRESHOLD-CONFLICTS.json`; do not edit by hand.',
    '',
    ledger.description,
    '',
    `Every assertion below is evaluated against the resolved decisions of each of the ${contexts} valid design contexts in which its rules apply.`,
    '',
  ];
  for (const e of ledger.entries) {
    lines.push(`## ${e.id} — ${e.concept}`, '', '**Positions that disagreed**', '', ...e.positions.map((p) => `- ${p}`), '', `**Resolution.** ${e.resolution}`, '');
    if (e.adr) lines.push(`**Decision record:** \`${e.adr}\``, '');
    lines.push('| assertion | rules | contexts checked |', '|---|---|---:|');
    for (const r of report.filter((x) => x.entry === e.id)) lines.push(`| ${r.assertion} | ${r.rule} | ${r.contexts} |`);
    lines.push('');
  }
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = check();
  const md = renderMd(r);
  if (process.argv.includes('--write-md')) writeFileSync(MD, md);
  else {
    let current = '';
    try { current = readFileSync(MD, 'utf8'); } catch { /* missing */ }
    if (current !== md) r.problems.push('docs/closure/THRESHOLD-CONFLICTS.md is stale: run node scripts/lint-conflicts.mjs --write-md');
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify({ ok: r.problems.length === 0, problems: r.problems, report: r.report }, null, 2));
  else {
    console.log(`threshold conflicts: ${r.ledger.entries.length} entries, ${r.report.length} assertions over ${r.contexts} contexts`);
    for (const p of r.problems) console.error(`  - ${p}`);
    console.log(r.problems.length ? 'FAIL' : 'PASS');
  }
  process.exit(r.problems.length ? 1 : 0);
}
