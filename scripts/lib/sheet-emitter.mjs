/**
 * sheet-emitter.mjs — turns the rules registry into an AestheticConstraintSheet for one design
 * context: the explicit hand-off artefact through which this skill (aesthetic knowledge, advisory and
 * generative authority) publishes its constraints, each with rule_id, decision_id, confidence and
 * provenance. The skill emits constraints; it does not implement or enforce compiler logic.
 *
 * Cross-repo binding: DEFERRED / UNBOUND (HANDOFF_BINDING). This repository pins no compiler commit,
 * schema version or contract hash and claims none of them as authoritative, so a sheet carries none.
 * An independent binding task decides and verifies the consumer-side schema; until then a consumer
 * must not infer one from a sheet.
 *
 * Determinism: no timestamps, no randomness; identical registry + context + commit => identical bytes.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalize } from './jcs.mjs';
import { REGISTRY } from '../../lib/rules/registry.js';
import { CONTEXT_KEYS, RegistryConflictError, contextKey, matches, resolveContext } from '../../lib/rules/derive.js';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
export const hashOf = (v) => sha256(canonicalize(v));

const CAPABILITY_OF_KIND = {
  PARAMETER_BAND: 'cap.constraint.parameter-band@1',
  GRAMMAR_RULE: 'cap.constraint.grammar-rule@1',
  OPERATION_POLICY: 'cap.constraint.operation-policy@1',
  ANTI_PATTERN_THRESHOLD: 'cap.constraint.anti-pattern-threshold@1',
  EVALUATION_ASSERTION: 'cap.constraint.evaluation-assertion@1',
  PRIORITY_ORDER: 'cap.constraint.priority-order@1',
  SCORING_WEIGHTS: 'cap.constraint.scoring-weights@1',
};

/** A provenance block without its own `content_hash`: the content hash covers everything but itself. */
const withoutContentHash = (prov) => Object.fromEntries(Object.entries(prov).filter(([k]) => k !== 'content_hash'));

export class ContextError extends Error {
  constructor(message) { super(message); this.name = 'ContextError'; }
}

export function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }

/**
 * The binding state of every emitted sheet. UNBOUND is a decision, not an omission: nothing in this
 * repository may be read as pinning, or vouching for, a consumer schema until the binding task replaces it.
 */
export const HANDOFF_BINDING = Object.freeze({
  status: 'UNBOUND',
  note: 'cross-repo binding is deferred: no compiler commit, schema version or contract hash is pinned or claimed',
});

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** { commit, dirty } of the skill checkout. A non-git copy must declare SKILL_COMMIT; it is then reported dirty-unknown = false only when SKILL_COMMIT is a full sha. */
export function sourceState(root = ROOT, env = process.env) {
  try {
    const commit = git(root, 'rev-parse', 'HEAD');
    const dirty = git(root, 'status', '--porcelain', '--untracked-files=normal').length > 0;
    return { commit, dirty };
  } catch {
    if (/^[a-f0-9]{40}$/.test(env.SKILL_COMMIT ?? '')) return { commit: env.SKILL_COMMIT, dirty: false };
    throw new Error('cannot determine the skill commit: not a git checkout and SKILL_COMMIT is not a 40-hex sha');
  }
}

/** Registry hash: canonical form of the aggregate with rules ordered by rule_id (file / import order is irrelevant). */
export function registryHash(registry = REGISTRY) {
  const rules = [...registry.rules].sort((a, b) => (a.rule_id < b.rule_id ? -1 : 1));
  return hashOf({ registry_version: registry.registry_version, context_rule: registry.context_rule, vocabulary: registry.vocabulary, sources: registry.sources, rules });
}

const sourceEntry = (id, registry) => {
  const s = registry.sources[id];
  return { source_id: id, kind: s.kind, ref: s.ref, ...(s.quote ? { quote: s.quote } : {}) };
};

/** Digest of the provenance ledger: (rule_id, confidence, sources) of EVERY registry rule, plus the context rule. */
export function ledgerHash(registry = REGISTRY) {
  const entry = (r) => ({ rule_id: r.rule_id, confidence: r.confidence, sources: r.sources.map((id) => sourceEntry(id, registry)).sort((a, b) => (a.source_id < b.source_id ? -1 : 1)) });
  const rows = [...registry.rules.map(entry), entry(registry.context_rule)].sort((a, b) => (a.rule_id < b.rule_id ? -1 : 1));
  return hashOf(rows);
}

export function validateContext(ctx, registry = REGISTRY) {
  const v = registry.vocabulary;
  const axes = { period: v.periods, material: v.materials, lighting: v.lighting, scene_type: v.scene_types };
  for (const k of CONTEXT_KEYS) {
    if (!ctx[k] || !(ctx[k] in axes[k])) throw new ContextError(`unknown ${k} "${ctx[k]}"; known: ${Object.keys(axes[k]).join(', ')}`);
  }
  for (const ex of v.excluded_contexts) {
    if (CONTEXT_KEYS.every((k) => !ex[k] || ex[k].includes(ctx[k]))) throw new ContextError(`context ${contextKey(ctx)} is excluded: ${ex.reason}`);
  }
}

/** Every valid context of the vocabulary (excluded combinations are listed separately). */
export function enumerateContexts(registry = REGISTRY) {
  const v = registry.vocabulary;
  const valid = [];
  const excluded = [];
  for (const period of Object.keys(v.periods)) for (const material of Object.keys(v.materials)) for (const lighting of Object.keys(v.lighting)) for (const scene_type of Object.keys(v.scene_types)) {
    const ctx = { period, material, lighting, scene_type };
    (v.excluded_contexts.some((ex) => CONTEXT_KEYS.every((k) => !ex[k] || ex[k].includes(ctx[k]))) ? excluded : valid).push(ctx);
  }
  return { valid, excluded };
}

export function emitSheet(ctx, { root = ROOT, registry = REGISTRY, state = sourceState(root) } = {}) {
  validateContext(ctx, registry);
  const pkg = readJson(join(root, 'package.json'));
  const repository = /github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?$/.exec(pkg.repository?.url ?? '')?.[1];
  if (!repository) throw new Error('package.json repository.url must point at the GitHub repository');

  const { drafts } = resolveContext(registry, ctx);
  const constraints = drafts.map((d) => {
    const c = {
      decision_id: d.decision_id,
      rule_id: d.rule.rule_id,
      kind: d.rule.kind,
      role: d.rule.role,
      confidence: d.rule.confidence,
      applies_to: d.rule.applies_to ?? {},
      provenance: {
        sources: d.rule.sources.map((id) => sourceEntry(id, registry)),
        ...(d.derivation ? { derivation: d.derivation } : {}),
        content_hash: '',
      },
      payload: d.payload,
    };
    c.provenance.content_hash = hashOf({ ...c, provenance: withoutContentHash(c.provenance) });
    return c;
  });

  const roles = new Set(constraints.map((c) => c.role));
  const missing = registry.vocabulary.required_roles.filter((r) => !roles.has(r));
  if (missing.length) throw new RegistryConflictError(`context ${contextKey(ctx)} has no decision for required role(s): ${missing.join(', ')}`);

  const caps = new Set(['cap.hash.rfc8785-sha256@1']);
  for (const c of constraints) caps.add(CAPABILITY_OF_KIND[c.kind]);
  if (constraints.some((c) => c.kind === 'GRAMMAR_RULE' || c.payload.ir_pointer)) caps.add('cap.pointer.core-ir@1');

  const key = contextKey(ctx);
  const sheet = {
    skill_version: pkg.version,
    binding: { ...HANDOFF_BINDING },
    source_ref: {
      repository,
      commit: state.commit,
      dirty: state.dirty,
      registry_path: 'rules/',
      registry_hash: registryHash(registry),
      generator: `scripts/emit-sheet.mjs@${pkg.version}`,
    },
    compatibility: { requires_capabilities: [...caps].sort() },
    rule_id: registry.context_rule.rule_id,
    decision_id: `D:${registry.context_rule.rule_id}:${key}`,
    confidence: Math.min(...constraints.map((c) => c.confidence)),
    design_context: { ...ctx, required_roles: [...registry.vocabulary.required_roles] },
    constraints,
    provenance: { ledger_hash: ledgerHash(registry), content_hash: '', constraint_count: constraints.length },
  };
  sheet.provenance.content_hash = hashOf({ ...sheet, provenance: withoutContentHash(sheet.provenance) });
  return sheet;
}

export { matches };
