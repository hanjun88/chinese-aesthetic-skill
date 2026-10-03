#!/usr/bin/env node
/**
 * lint-docs.mjs — documentation may not carry a second copy of any threshold.
 *
 * Scope A / C (everywhere): README.md, SKILL.md, skill.yaml, modules/*.md (not modules/extracted),
 * playbooks/**, docs/*.md. Scope B (aesthetic documents): README.md, SKILL.md, skill.yaml, modules/*.md,
 * docs/design-philosophy.md, docs/references.md. guidelines/*.md are the human-readable ORIGIN of the rules
 * (the registry cites them verbatim, verified by scripts/lint-rules.mjs); playbooks and docs/GATES.md /
 * risk-mitigation.md / roadmap.md state process, asset-QA and engineering limits, not aesthetic decisions.
 *
 *   A. superseded literals (rules/superseded.json) must not appear anywhere in scope;
 *   B. in aesthetic documents a line that states a threshold must name the registry rule it renders with a
 *      marker `<!-- rule:CAS-VS-HF-001 -->` (or `# rule:...` in YAML) and every number on that line must be a
 *      number the rule actually carries; an unmarked threshold-shaped line is a duplicate (or deleted text);
 *   C. no hand-written test counts outside the generated evidence block of README.md.
 *
 *   node scripts/lint-docs.mjs [--json]
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRY, getRule } from '../lib/rules/registry.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function* walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    if (['node_modules', '.git', 'extracted', 'decisions', 'closure', 'dist'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

function scopeFiles() {
  const out = ['README.md', 'SKILL.md', 'skill.yaml'].filter((f) => existsSync(join(ROOT, f)));
  for (const d of ['modules', 'playbooks', 'docs']) {
    if (!existsSync(join(ROOT, d))) continue;
    for (const f of walk(join(ROOT, d))) {
      if (/\.(md|ya?ml)$/.test(f)) out.push(relative(ROOT, f));
    }
  }
  return out;
}

// threshold-shaped statements in prose / YAML (not code identifiers)
const THRESHOLD = [
  /(?:≥|≤|>=|<=|＞|＜|>|<)\s*\d+(?:\.\d+)?\s*%?/,
  /\d+(?:\.\d+)?\s*%\s*(?:以上|以下|起|止|硬阈值)/,
  /(?:阈值|门槛|下限|上限|至少|不低于|不超过|不少于)[^\n|]{0,12}\d+(?:\.\d+)?/,
  /\b(?:min|max|threshold|floor|ceiling)\w*\s*[:=]\s*-?\d+(?:\.\d+)?/i,
];
const AESTHETIC_DOCS = (rel) => ['README.md', 'SKILL.md', 'skill.yaml', 'docs/design-philosophy.md', 'docs/references.md'].includes(rel) || /^modules\/[^/]+\.md$/.test(rel);
const MARK = /(?:<!--\s*rule:([A-Z0-9-]+)\s*-->|#\s*rule:([A-Z0-9-]+))/;
const TEST_COUNT = /\b\d+\s*(?:项\s*)?(?:tests?\b|passed\b|通过|个测试|项测试|项引擎测试)/i;

function numbersOfRule(ruleId) {
  const set = new Set();
  const take = (n) => { set.add(n); set.add(Math.round(n * 100 * 1e6) / 1e6); set.add(Math.round(n * 1e6) / 1e6); };
  const walkVal = (v) => {
    if (typeof v === 'number') take(v);
    else if (Array.isArray(v)) v.forEach(walkVal);
    else if (v && typeof v === 'object') Object.values(v).forEach(walkVal);
  };
  walkVal(getRule(ruleId).payload);
  return set;
}
const numbersIn = (line) => [...line.replace(MARK, '').matchAll(/(?<![\w.])(\d+(?:\.\d+)?)\s*%?/g)].map((m) => Number(m[1]));

export function lintDocs() {
  const problems = [];
  const superseded = existsSync(join(ROOT, 'rules', 'superseded.json')) ? JSON.parse(readFileSync(join(ROOT, 'rules', 'superseded.json'), 'utf8')) : [];
  let thresholdLines = 0;
  for (const rel of scopeFiles()) {
    const lines = readFileSync(join(ROOT, rel), 'utf8').split('\n');
    let inEvidence = false;
    lines.forEach((line, i) => {
      const at = `${rel}:${i + 1}`;
      if (line.includes('<!-- evidence:begin -->')) inEvidence = true;
      if (line.includes('<!-- evidence:end -->')) { inEvidence = false; return; }
      for (const s of superseded) {
        if (line.includes(s.literal)) problems.push(`${at}: superseded literal "${s.literal}" (replaced by ${s.superseded_by}, ${s.adr})`);
      }
      if (!inEvidence && TEST_COUNT.test(line)) problems.push(`${at}: hand-written test count; counts come from the generated evidence block only`);
      if (!AESTHETIC_DOCS(rel) || !THRESHOLD.some((re) => re.test(line))) return;
      thresholdLines++;
      const m = MARK.exec(line);
      const id = m?.[1] ?? m?.[2];
      if (!id) { problems.push(`${at}: threshold stated without a rule marker: ${line.trim().slice(0, 100)}`); return; }
      let known;
      try { known = numbersOfRule(id); } catch { problems.push(`${at}: marker names unknown rule ${id}`); return; }
      for (const n of numbersIn(line)) if (!known.has(n)) problems.push(`${at}: ${n} is not a number of rule ${id}`);
    });
  }
  return { ok: problems.length === 0, problems, threshold_lines: thresholdLines, rules: REGISTRY.rules.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = lintDocs();
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`docs lint: ${r.threshold_lines} threshold-shaped lines in scope, ${r.problems.length} problem(s)`);
    for (const p of r.problems.slice(0, 300)) console.error(`  - ${p}`);
    if (r.problems.length > 300) console.error(`  ... ${r.problems.length - 300} more`);
    console.log(r.ok ? 'PASS' : 'FAIL');
  }
  process.exit(r.ok ? 0 : 1);
}
