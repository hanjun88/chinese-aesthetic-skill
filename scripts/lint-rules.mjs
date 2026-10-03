#!/usr/bin/env node
/**
 * lint-rules.mjs — the registry gate (run by `npm test`, `npm run lint:rules` and CI).
 *
 * Fails on:
 *   - files in rules/families or rules/sources that rules/index.js does not import (or imports twice)
 *   - provenance that cannot be checked: a local source whose file, anchor or verbatim quote is not
 *     found; an unverifiable (external: / git:) source on a rule with confidence above the cap
 *   - a rule that is never emitted in any valid context (dead rule)
 *   - a valid context that cannot be emitted (empty band intersection, missing role, bad derivation)
 *   - a declared excluded context that does not really conflict (stale exclusion)
 *
 *   node scripts/lint-rules.mjs [--json]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from '../lib/rules/registry.js';
import { RegistryConflictError, resolveContext, contextKey } from '../lib/rules/derive.js';
import { enumerateContexts, emitSheet, sourceState, loadPin, ContextError } from './lib/sheet-emitter.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** Rules whose only evidence is unverifiable expert judgment may not claim more than this. */
export const UNVERIFIED_CONFIDENCE_CAP = 0.7;

const slug = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');

function headingsOf(text) {
  return text.split('\n').filter((l) => /^#{1,6}\s/.test(l)).map((l) => l.replace(/^#{1,6}\s+/, '').trim());
}

export function lint() {
  const problems = [];
  const bad = (m) => problems.push(m);
  const stats = { rules: REGISTRY.rules.length, sources: Object.keys(REGISTRY.sources).length, contexts_valid: 0, contexts_excluded: 0, unverified_sources: [] };

  // --- index.js completeness ---------------------------------------------------------------
  const indexText = readFileSync(join(ROOT, 'rules', 'index.js'), 'utf8');
  for (const dir of ['families', 'sources']) {
    for (const f of readdirSync(join(ROOT, 'rules', dir)).filter((x) => x.endsWith('.json'))) {
      const n = indexText.split(`./${dir}/${f}`).length - 1;
      if (n !== 1) bad(`rules/index.js must import rules/${dir}/${f} exactly once (found ${n})`);
    }
  }

  // --- provenance --------------------------------------------------------------------------
  const verifiedLocal = new Set();
  for (const [id, s] of Object.entries(REGISTRY.sources)) {
    if (s.ref.startsWith('external:') || s.ref.startsWith('git:')) { stats.unverified_sources.push(id); continue; }
    const [path, anchor] = s.ref.split('#');
    const file = join(ROOT, path);
    if (!existsSync(file)) { bad(`source ${id}: file ${path} does not exist`); continue; }
    const text = readFileSync(file, 'utf8');
    if (anchor) {
      const hs = headingsOf(text);
      if (!hs.some((h) => h === anchor || slug(h) === anchor || h.includes(anchor)) && !text.includes(anchor)) bad(`source ${id}: anchor "${anchor}" not found in ${path}`);
    }
    if (s.quote && !text.includes(s.quote)) bad(`source ${id}: quote not found verbatim in ${path}: "${s.quote}"`);
    if (!s.quote && ['guideline', 'engine'].includes(s.kind)) bad(`source ${id}: ${s.kind} sources need a verbatim quote`);
    verifiedLocal.add(id);
  }
  for (const r of REGISTRY.rules) {
    const hasVerified = r.sources.some((id) => verifiedLocal.has(id));
    if (!hasVerified && r.confidence > UNVERIFIED_CONFIDENCE_CAP && r.confidence < 1) {
      bad(`${r.rule_id}: confidence ${r.confidence} exceeds ${UNVERIFIED_CONFIDENCE_CAP} but none of its sources is verifiable in this repository`);
    }
    for (const id of r.sources) {
      const s = REGISTRY.sources[id];
      if (s.quote && s.quote.length > 200) bad(`source ${id}: quote longer than the contract's 200 characters`);
    }
  }

  // --- payload hygiene: no empty keys, only known derivation operators ------------------------------
  const OPS = new Set(['$by_period', '$by_material', '$by_lighting', '$by_scene_type', '$band', '$clamp', '$ref', '$min', '$max']);
  const walk = (v, rule, path) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, rule, `${path}[${i}]`));
    else if (v !== null && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        if (k === '') bad(`${rule}: empty key at ${path}`);
        if (k.startsWith('$') && !OPS.has(k)) bad(`${rule}: unknown derivation operator ${k} at ${path}`);
        walk(x, rule, `${path}.${k}`);
      }
    }
  };
  for (const r of REGISTRY.rules) walk(r.payload, r.rule_id, 'payload');

  // --- every context --------------------------------------------------------------------------
  const { valid, excluded } = enumerateContexts();
  stats.contexts_valid = valid.length;
  stats.contexts_excluded = excluded.length;
  const state = { commit: '0'.repeat(40), dirty: false };
  const pin = loadPin(ROOT);
  const emitted = new Set();
  for (const ctx of valid) {
    try {
      const sheet = emitSheet(ctx, { state, pin });
      for (const c of sheet.constraints) emitted.add(c.rule_id);
    } catch (e) {
      bad(`valid context ${contextKey(ctx)} cannot be emitted: ${e.message}`);
    }
  }
  for (const ctx of excluded) {
    try { emitSheet(ctx, { state, pin }); bad(`excluded context ${contextKey(ctx)} was emitted`); } catch (e) { if (!(e instanceof ContextError)) bad(`excluded context ${contextKey(ctx)}: ${e.message}`); }
    try { resolveContext(REGISTRY, ctx); bad(`excluded context ${contextKey(ctx)} does not conflict any more: remove the stale exclusion`); } catch (e) { if (!(e instanceof RegistryConflictError)) bad(`excluded context ${contextKey(ctx)}: ${e.message}`); }
  }
  for (const r of REGISTRY.rules) {
    if ((r.audience ?? ['sheet', 'engine']).includes('sheet') && !emitted.has(r.rule_id)) bad(`${r.rule_id}: never emitted in any valid context (dead rule)`);
  }
  return { ok: problems.length === 0, problems, stats };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = lint();
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    const s = r.stats;
    console.log(`rules lint: ${s.rules} rules, ${s.sources} sources (${s.unverified_sources.length} unverifiable external/git refs), ${s.contexts_valid} valid + ${s.contexts_excluded} excluded contexts`);
    for (const p of r.problems) console.error(`  - ${p}`);
    console.log(r.ok ? 'PASS' : 'FAIL');
  }
  process.exit(r.ok ? 0 : 1);
}
