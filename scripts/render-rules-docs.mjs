#!/usr/bin/env node
/**
 * render-rules-docs.mjs — renders the key decisions of the rules registry into README.md.
 *
 * The registry (rules/, lib/rules/) is the single source of every aesthetic threshold; documents may
 * show a threshold only by rendering it from there. This generator owns the table between
 * `<!-- rules:begin -->` and `<!-- rules:end -->` in README.md: one row per rule (id, decision,
 * semantics, value or band, scope, confidence) of the documented families. Every row ends with the
 * marker `<!-- rule:ID -->` that scripts/lint-docs.mjs checks the row's numbers against.
 *
 *   node scripts/render-rules-docs.mjs            print the block
 *   node scripts/render-rules-docs.mjs --write    regenerate the block in README.md
 *   node scripts/render-rules-docs.mjs --check    exit 1 when README.md's block is stale (CI gate)
 *     [--readme <file>]                           operate on another file (tests)
 *
 * Exit codes: 0 ok · 1 stale block · 2 usage / markers missing.
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import data from '../rules/index.js';
import { REGISTRY, getRule } from '../lib/rules/registry.js';
import { BlockError, beginMarker, endMarker, syncBlock } from './docs-blocks.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const BLOCK = 'rules';
/** Families whose rules are the key aesthetic decisions a reader of the README needs. */
export const DOC_FAMILIES = ['CAS-VS', 'CAS-PB', 'CA-RULE', 'ANTI-AI'];

const COLUMNS = ['Rule', 'Decision', 'Semantics', 'Value / band', 'Scope', 'Confidence'];

/** 0.6 -> "0.60", 1 (ratio) -> "1.00", 3 (count) -> "3", 2700 -> "2700", 0.382 -> "0.382". */
function num(n, unit) {
  const s = String(Math.round(n * 1e6) / 1e6);
  const decimals = s.includes('.') ? s.split('.')[1].length : 0;
  if (unit === 'ratio' || !Number.isInteger(n)) return decimals >= 2 ? s : n.toFixed(2);
  return s;
}

/** A payload value that may be a derivation node ($band / $clamp / ...). */
function value(v, unit) {
  if (typeof v === 'number') return num(v, unit);
  if (Array.isArray(v)) return `[${v.map((x) => value(x, unit)).join(', ')}]`;
  if (v !== null && typeof v === 'object') {
    if ('$band' in v) return `band ${v.$band.edge}`;
    if ('$clamp' in v) return `clamp(${value(v.$clamp.value, unit)})`;
    const [op] = Object.keys(v);
    return op.replace(/^\$/, '');
  }
  return String(v);
}

/** "/lighting/keyLight/softness/value" -> "lighting.keyLight.softness" */
const dotted = (path) => path.replace(/^\//, '').replace(/\/value$/, '').replace(/\//g, '.');

function semanticsOf(rule) {
  const p = rule.payload;
  if (rule.kind === 'PARAMETER_BAND') return `${rule.kind} · ${p.semantics}`;
  if (rule.kind === 'GRAMMAR_RULE') return `${rule.kind} · ${p.severity}`;
  return rule.kind;
}

function valueOf(rule) {
  const p = rule.payload;
  if (rule.kind === 'PARAMETER_BAND') {
    if (p.semantics === 'DESIGN_DEFAULT') {
      const authored = p.target !== null && typeof p.target === 'object' && '$clamp' in p.target ? p.target.$clamp.value : p.target;
      return `target ${value(authored, p.unit)}, clamped into the effective band`;
    }
    return `[${value(p.min, p.unit)}, ${value(p.max, p.unit)}]${p.unit === 'count' ? ' layers' : ''}`;
  }
  if (rule.kind === 'GRAMMAR_RULE') {
    const c = p.condition;
    const test = c.operator === 'not_between' ? `outside ${value(c.value)}` : `${c.operator} ${value(c.value)}`;
    const patches = p.patches ?? [{ path: p.target_path, value: p.mutation.value }];
    // a patch of the tested parameter itself only needs its new value; further patches name their parameter
    const then = patches.map((x) => (x.path === p.target_path ? value(x.value) : `\`${dotted(x.path)}\` := ${value(x.value)}`)).join('; ');
    return `\`${dotted(p.target_path)}\` ${test} → ${then}`;
  }
  return p.subject ?? '—';
}

function scopeOf(rule) {
  const axes = Object.entries(rule.applies_to ?? {}).map(([k, list]) => `${k}: ${list.join(' / ')}`);
  const parts = [axes.length ? axes.join(' · ') : 'any context'];
  if (rule.audience && !rule.audience.includes('sheet')) parts.push('engine only');
  return parts.join(' · ');
}

/**
 * A table cell: the backslash is escaped first, then the pipe. Escaping only the pipe leaves a backslash that
 * precedes it unescaped ("a\|b" -> "a\\|b"), which GFM reads as an escaped backslash followed by a bare pipe:
 * the cell ends early and the table breaks (CodeQL js/incomplete-sanitization).
 */
const cell = (s) => String(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

/** One table row of a rule; the marker rides in the last cell so the table stays valid Markdown. */
export function renderRow(rule) {
  const cells = [
    `\`${rule.rule_id}\``,
    cell(rule.title),
    cell(semanticsOf(rule)),
    cell(valueOf(rule)),
    cell(scopeOf(rule)),
    `${num(rule.confidence, 'ratio')} <!-- rule:${rule.rule_id} -->`,
  ];
  return `| ${cells.join(' | ')} |`;
}

/** "Void / solid (留白): the canonical ..." -> "Void / solid (留白)"; first clause or sentence of a family description. */
export function familyLabel(description) {
  const m = /^(.*?)(?::\s|\.\s|\.$|$)/s.exec(description.trim());
  return m[1].trim();
}

export function renderRulesBlock({ families = DOC_FAMILIES, source = data } = {}) {
  const out = [
    beginMarker(BLOCK),
    `<!-- generated by \`node scripts/render-rules-docs.mjs --write\` from rules/ (registry ${REGISTRY.registry_version}); edit the registry, never this block -->`,
  ];
  for (const family of families) {
    const file = source.families[family];
    if (!file) throw new Error(`render-rules-docs: unknown rule family ${family}`);
    out.push('', `#### ${family} — ${familyLabel(file.description)}`, '');
    out.push(`| ${COLUMNS.join(' | ')} |`, `|${COLUMNS.map(() => '---').join('|')}|`);
    for (const r of file.rules) out.push(renderRow(getRule(r.rule_id)));
  }
  out.push('', 'Provenance (`sources`), audience and the derivation of every rule: `rules/`. Constraint sheets: `node scripts/emit-sheet.mjs`.', endMarker(BLOCK));
  return out.join('\n');
}

export function main(argv = process.argv.slice(2)) {
  const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
  const write = argv.includes('--write');
  const check = argv.includes('--check');
  const known = new Set(['--write', '--check', '--readme']);
  const unknown = argv.filter((a) => a.startsWith('--') && !known.has(a));
  if (unknown.length || (write && check) || argv.includes('--readme') && !opt('readme')) {
    console.error('usage: render-rules-docs.mjs [--write | --check] [--readme <file>]');
    return 2;
  }
  if (!write && !check) { console.log(renderRulesBlock()); return 0; }
  try {
    return syncBlock({
      file: opt('readme') ? resolve(opt('readme')) : join(ROOT, 'README.md'),
      name: BLOCK,
      generate: renderRulesBlock,
      mode: write ? 'write' : 'check',
      label: 'rules docs',
      command: 'npm run docs:render',
    });
  } catch (e) {
    if (e instanceof BlockError) { console.error(`rules docs: ${e.message}`); return 2; }
    throw e;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
