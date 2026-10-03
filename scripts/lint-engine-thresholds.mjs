#!/usr/bin/env node
/**
 * lint-engine-thresholds.mjs — the engines hold no aesthetic number of their own.
 *
 * Every threshold, grade boundary, weight, clamp and repair target an engine in lib/ applies is a rule of the
 * registry (rules/): one definition, one rule_id, one provenance, read through rulePayload(). A threshold-shaped
 * literal in an engine is therefore a violation unless the line (or the closest preceding non-blank line)
 * carries an inline justification:
 *
 *     // ssot-ok(<CLASS>): <reason of at least 12 characters>
 *
 * <CLASS> says why the number is NOT an aesthetic decision:
 *   MEASUREMENT_MECHANISM  how a quantity is measured / converted (colour-space maths, kernel sizes, unit conversions)
 *   PHYSICAL_SAFETY        bounds that keep arithmetic or geometry valid (a ratio lives in [0, 1])
 *   NUMERIC_GUARD          epsilons, division guards, rounding / display precision
 *   PROTOCOL               array lengths, indices, list-emptiness and set-cardinality checks, sentinel values
 *   CATALOG                a reference table (palette, material preset, canonical proportion); must also name its
 *                          provenance:  source=<repo path>[#anchor]  (the file, and the anchor if given, must exist).
 *                          A whole table is justified once with a region:
 *                              // ssot-catalog-begin source=guidelines/color.md#配色 <reason of at least 12 characters>
 *                              ...table...
 *                              // ssot-catalog-end
 *
 * Message text that restates a threshold is a second copy of it: build the text from the rule's value.
 *
 *   node scripts/lint-engine-thresholds.mjs [--json] [--only lib/a.js,lib/b.js]
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CLASSES = new Set(['MEASUREMENT_MECHANISM', 'PHYSICAL_SAFETY', 'NUMERIC_GUARD', 'PROTOCOL', 'CATALOG']);
const MARK = /ssot-ok\((\w+)\):\s*(.{12,})/;
const REGION_BEGIN = /ssot-catalog-begin\s+source=(\S+)\s+(.{12,})/;
const REGION_END = /ssot-catalog-end/;

// Threshold-shaped patterns (pattern based, no AST: any line matching is a site).
const PATTERNS = [
  ['compare', /(?:<=|>=|===|!==|<|>)\s*-?\d+(?:\.\d+)?(?![\w.]*\()/],
  ['clamp', /(?:clamp|Math\.(?:min|max))\([^)]*\b\d+(?:\.\d+)?\b/],
  ['range-prop', /\b(?:min|max|floor|ceil|lower|upper|threshold|ratio|target|bias|limit|weight|score|penalty|bonus)\w*\s*[:=]\s*-?\d+(?:\.\d+)?/i],
  ['percent', /(?:≥|≤|>=|<=|<|>)\s*\d+(?:\.\d+)?\s*%/],
  ['pair', /\[\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\]/],
  ['arith', /[*/+\-]\s*-?0?\.\d+\b/],
  ['ternary', /\?\s*-?\d+(?:\.\d+)?\s*:/],
  ['field', /\b[A-Za-z_]\w*\s*:\s*-?\d+\.\d+\b/],
  ['score-step', /\b(?:score|total|risk\w*|penalty)\s*[+\-]=\s*\d+(?:\.\d+)?/i],
  ['const', /\bconst\s+[A-Z][A-Z0-9_]*\s*=\s*-?\d+(?:\.\d+)?\b/],
];
// Trivial comparisons that carry no magnitude.
const TRIVIAL = /(?:<=|>=|===|!==|<|>)\s*-?[01](?![\w.])/;

function* walk(abs) {
  for (const name of readdirSync(abs).sort()) {
    const p = join(abs, name);
    if (statSync(p).isDirectory()) { if (name !== 'rules' && name !== 'node_modules') yield* walk(p); }
    else if (extname(name) === '.js' && name !== 'index.js') yield p;
  }
}

const slug = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
function sourceExists(ref) {
  const [path, anchor] = ref.split('#');
  const file = join(ROOT, path);
  if (!existsSync(file)) return `source ${path} does not exist`;
  if (anchor) {
    const text = readFileSync(file, 'utf8');
    const heads = text.split('\n').filter((l) => /^#{1,6}\s/.test(l)).map((l) => l.replace(/^#{1,6}\s+/, '').trim());
    if (!heads.some((h) => h === anchor || slug(h) === anchor || h.includes(anchor)) && !text.includes(anchor)) return `anchor "${anchor}" not found in ${path}`;
  }
  return null;
}

export function lint(root = ROOT, only = null) {
  const violations = [];
  const justified = {};
  let sites = 0;
  for (const file of walk(join(root, 'lib'))) {
    const rel = relative(root, file);
    if (only && !only.includes(rel)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    let inBlock = false;
    let region = null; // { source } while inside a ssot-catalog region
    lines.forEach((text, i) => {
      const t = text.trim();
      const rb = REGION_BEGIN.exec(text);
      if (rb) {
        const why = sourceExists(rb[1]);
        if (why) violations.push({ file: rel, line: i + 1, text: t.slice(0, 160), why: `catalog region: ${why}` });
        region = { source: rb[1] };
        return;
      }
      if (REGION_END.test(text)) { if (!region) violations.push({ file: rel, line: i + 1, text: t.slice(0, 160), why: 'ssot-catalog-end without a begin' }); region = null; return; }
      if (inBlock) { if (t.includes('*/')) inBlock = false; return; }
      if (t.startsWith('/*')) { if (!t.includes('*/')) inBlock = true; return; }
      if (t.startsWith('//') || t.startsWith('*')) return;
      // code part only: strip trailing line comment and string/template contents that hold prose
      const code = text.replace(/\/\/.*$/, '');
      const hit = PATTERNS.find(([, re]) => re.test(code) && !(TRIVIAL.test(code) && !PATTERNS.filter(([k]) => k !== 'compare').some(([, r]) => r.test(code))));
      if (!hit) return;
      sites += 1;
      if (region) { justified.CATALOG = (justified.CATALOG ?? 0) + 1; return; }
      const cands = [text];
      for (let k = i - 1; k >= 0; k--) { if (lines[k].trim() !== '') { cands.push(lines[k]); break; } }
      const m = cands.map((c) => MARK.exec(c)).find(Boolean);
      if (m && CLASSES.has(m[1])) {
        if (m[1] === 'CATALOG') {
          const src = /source=(\S+)/.exec(m[2])?.[1];
          const why = src ? sourceExists(src) : 'a CATALOG marker must name its provenance: source=<path>[#anchor]';
          if (why) { violations.push({ file: rel, line: i + 1, text: t.slice(0, 160), why }); return; }
        }
        justified[m[1]] = (justified[m[1]] ?? 0) + 1;
        return;
      }
      violations.push({ file: rel, line: i + 1, kind: hit[0], text: t.slice(0, 160), why: m ? `unknown ssot-ok class ${m[1]}` : 'threshold-shaped literal in an engine: read it from the registry (rulePayload) or justify it with ssot-ok(<CLASS>)' });
    });
  }
  return { sites, justified, violations };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const onlyArg = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
  const r = lint(ROOT, onlyArg);
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`engine threshold lint: ${r.sites} threshold-shaped sites in lib/, ${Object.values(r.justified).reduce((a, b) => a + b, 0)} justified ${JSON.stringify(r.justified)}, ${r.violations.length} violation(s)`);
    for (const v of r.violations.slice(0, 400)) console.log(`  ${v.file}:${v.line}  [${v.kind ?? '-'}] ${v.why}\n      ${v.text}`);
    if (r.violations.length > 400) console.log(`  ... ${r.violations.length - 400} more`);
    console.log(r.violations.length ? 'FAIL' : 'PASS');
  }
  process.exitCode = r.violations.length ? 1 : 0; // not process.exit(): piped stdout (--json) must flush
}
