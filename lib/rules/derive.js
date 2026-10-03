/**
 * derive.js — the skill's decision logic for turning registry rules into the decisions of one
 * design context. Pure and browser-safe (no fs, no crypto): engines may import it.
 *
 * A context is { period, material, lighting, scene_type }. A rule applies when every selector in
 * its `applies_to` contains the context value (absent selector = unconstrained).
 *
 * Payload values may be derivation nodes (objects with a single `$op` key):
 *   { "$by_period":     { TANG: x, SONG: y, MING: z, "*": d } }   (same for $by_material / $by_lighting / $by_scene_type)
 *   { "$band":  { "parameter": "scene...", "edge": "min" | "max" } }   edge of the effective band
 *   { "$clamp": { "value": <node|number>, "parameter": "scene..." } }  value clamped into the effective band
 *   { "$ref":   "RULE-ID/payload/params/key" }   a literal (or node) defined once in another rule's payload
 *   { "$min": [<node|number>, ...] } / { "$max": [...] }
 * The effective band of a parameter is the intersection of every applicable hard band
 * (PERIOD_BAND, PHYSICAL_RANGE, HARD_FLOOR). An empty intersection is a registry conflict and
 * emission fails: there is no silent winner (docs/closure/ADR-0001-negative-space.md rule 5).
 */

export const CONTEXT_KEYS = ['period', 'material', 'lighting', 'scene_type'];
export const HARD_SEMANTICS = new Set(['PERIOD_BAND', 'PHYSICAL_RANGE', 'HARD_FLOOR']);

export class RegistryConflictError extends Error {
  constructor(message) { super(message); this.name = 'RegistryConflictError'; }
}

export function contextKey(ctx) {
  return `${ctx.period}.${ctx.material}.${ctx.lighting}.${ctx.scene_type}`;
}

export function matches(appliesTo, ctx) {
  if (!appliesTo) return true;
  return CONTEXT_KEYS.every((k) => !appliesTo[k] || appliesTo[k].includes(ctx[k]));
}

const isNode = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 1 && Object.keys(v)[0].startsWith('$');
const SELECTORS = { $by_period: 'period', $by_material: 'material', $by_lighting: 'lighting', $by_scene_type: 'scene_type' };

/** Rules of a registry that apply to ctx for the given audience ('sheet' | 'engine'), sorted by rule_id. */
export function applicableRules(registry, ctx, audience = 'sheet') {
  return registry.rules
    .filter((r) => (r.audience ?? ['sheet', 'engine']).includes(audience) && matches(r.applies_to, ctx))
    .sort((a, b) => (a.rule_id < b.rule_id ? -1 : a.rule_id > b.rule_id ? 1 : 0));
}

const fmt = (n) => (typeof n === 'number' ? String(Math.round(n * 1e6) / 1e6) : JSON.stringify(n));

/**
 * Resolve one value. `env` = { ctx, bands, rulesById, stack }; `trace` collects
 * { inputs: Set<decision_id>, formula: string[] } for provenance.
 * `bands` maps parameter -> { lo, hi, ids[] } (effective bands of the context).
 */
export function resolveValue(value, env, trace, where = 'payload') {
  const { ctx, bands } = env;
  if (Array.isArray(value)) return value.map((v, i) => resolveValue(v, env, trace, `${where}[${i}]`));
  if (value === null || typeof value !== 'object') return value;
  if (isNode(value)) {
    const [op] = Object.keys(value);
    const arg = value[op];
    if (op in SELECTORS) {
      const key = ctx[SELECTORS[op]];
      const hit = key in arg ? arg[key] : arg['*'];
      if (hit === undefined) throw new RegistryConflictError(`${where}: ${op} has no entry for ${SELECTORS[op]}=${key} and no "*" default`);
      return resolveValue(hit, env, trace, `${where}.${op}[${key}]`);
    }
    if (op === '$band') {
      const b = bands.get(arg.parameter);
      if (!b) throw new RegistryConflictError(`${where}: $band ${arg.parameter} has no applicable hard band in this context`);
      if (arg.edge !== 'min' && arg.edge !== 'max') throw new RegistryConflictError(`${where}: $band edge must be min|max`);
      b.ids.forEach((id) => trace.inputs.add(id));
      const v = arg.edge === 'min' ? b.lo : b.hi;
      trace.formula.push(`band_${arg.edge}(${arg.parameter})=${fmt(v)}`);
      return v;
    }
    if (op === '$clamp') {
      const b = bands.get(arg.parameter);
      if (!b) throw new RegistryConflictError(`${where}: $clamp ${arg.parameter} has no applicable hard band in this context`);
      const raw = resolveValue(arg.value, env, trace, `${where}.$clamp.value`);
      if (typeof raw !== 'number') throw new RegistryConflictError(`${where}: $clamp value must resolve to a number`);
      b.ids.forEach((id) => trace.inputs.add(id));
      const v = Math.min(b.hi, Math.max(b.lo, raw));
      trace.formula.push(`clamp(${fmt(raw)}, band(${arg.parameter})[${fmt(b.lo)},${fmt(b.hi)}])=${fmt(v)}`);
      return v;
    }
    if (op === '$min' || op === '$max') {
      if (!Array.isArray(arg) || arg.length === 0) throw new RegistryConflictError(`${where}: ${op} needs a non-empty array`);
      const vals = arg.map((a, i) => resolveValue(a, env, trace, `${where}.${op}[${i}]`));
      if (vals.some((v) => typeof v !== 'number')) throw new RegistryConflictError(`${where}: ${op} operands must resolve to numbers`);
      const v = op === '$min' ? Math.min(...vals) : Math.max(...vals);
      trace.formula.push(`${op.slice(1)}(${vals.map(fmt).join(', ')})=${fmt(v)}`);
      return v;
    }
    if (op === '$ref') {
      const [ruleId, ...path] = String(arg).split('/');
      const target = env.rulesById.get(ruleId);
      if (!target) throw new RegistryConflictError(`${where}: $ref to unknown rule ${ruleId}`);
      if (env.stack.includes(arg)) throw new RegistryConflictError(`${where}: $ref cycle through ${arg}`);
      let node = target;
      for (const seg of path) {
        if (node === null || typeof node !== 'object' || !(seg in node)) throw new RegistryConflictError(`${where}: $ref ${arg} does not resolve`);
        node = node[seg];
      }
      const out = resolveValue(node, { ...env, stack: [...env.stack, arg] }, trace, `${where}.$ref(${arg})`);
      trace.formula.push(`ref(${arg})=${fmt(out)}`);
      return out;
    }
    throw new RegistryConflictError(`${where}: unknown derivation ${op}`);
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = resolveValue(v, env, trace, `${where}.${k}`);
  return out;
}

/** Effective band of each parameter: intersection of applicable hard bands. Throws on an empty intersection. */
export function effectiveBands(bandConstraints) {
  const byParam = new Map();
  for (const c of bandConstraints) {
    if (!HARD_SEMANTICS.has(c.payload.semantics)) continue;
    const list = byParam.get(c.payload.parameter) ?? [];
    list.push(c);
    byParam.set(c.payload.parameter, list);
  }
  const out = new Map();
  for (const [parameter, list] of byParam) {
    const lo = Math.max(...list.map((c) => c.payload.min));
    const hi = Math.min(...list.map((c) => c.payload.max));
    if (lo > hi) {
      throw new RegistryConflictError(
        `bands for ${parameter} have an empty intersection: ${list.map((c) => `${c.rule_id}[${c.payload.min},${c.payload.max}]`).join(' ∩ ')}`,
      );
    }
    out.set(parameter, { lo, hi, ids: list.map((c) => c.decision_id).sort() });
  }
  return out;
}

/**
 * Resolve every sheet-audience rule applicable to ctx into constraint drafts:
 * { rule, decision_id, payload (all derivations resolved), derivation? }.
 */
export function resolveContext(registry, ctx) {
  const rules = applicableRules(registry, ctx, 'sheet');
  const key = contextKey(ctx);
  const idOf = (r) => `D:${r.rule_id}:${key}`;
  const rulesById = new Map(registry.rules.map((r) => [r.rule_id, r]));
  const envFor = (bands) => ({ ctx, bands, rulesById, stack: [] });
  // 1. hard bands (PERIOD_BAND / PHYSICAL_RANGE / HARD_FLOOR): only context selectors allowed inside
  const isHard = (r) => r.kind === 'PARAMETER_BAND' && HARD_SEMANTICS.has(r.payload.semantics);
  const hardDrafts = rules.filter(isHard).map((r) => {
    const trace = { inputs: new Set(), formula: [] };
    const payload = resolveValue(r.payload, envFor(new Map()), trace, `${r.rule_id}.payload`);
    return { rule: r, decision_id: idOf(r), payload, derivation: undefined };
  });
  const bands = effectiveBands(hardDrafts.map((d) => ({ rule_id: d.rule.rule_id, decision_id: d.decision_id, payload: d.payload })));
  // 2. everything else (soft bands, policies, grammar ...) may reference the effective bands
  const drafts = [];
  for (const r of rules) {
    if (isHard(r)) {
      drafts.push(hardDrafts.find((d) => d.rule === r));
      continue;
    }
    const trace = { inputs: new Set(), formula: [] };
    const payload = resolveValue(r.payload, envFor(bands), trace, `${r.rule_id}.payload`);
    const formulas = [...new Set(trace.formula)];
    const derivation = formulas.length
      ? { formula: formulas.join('; ').slice(0, 300), inputs: [...trace.inputs].sort() }
      : undefined;
    drafts.push({ rule: r, decision_id: idOf(r), payload, derivation });
  }
  return { drafts, bands };
}

/**
 * One rule's payload with every derivation resolved for ctx, whatever its audience (engine-only rules included);
 * undefined when the rule does not apply to ctx. Used by the threshold-conflict ledger to check, per context,
 * that resolved decisions agree with each other and with the effective bands.
 */
export function resolveRuleIn(registry, ctx, ruleId) {
  const rule = registry.rules.find((r) => r.rule_id === ruleId);
  if (!rule) throw new RegistryConflictError(`unknown rule ${ruleId}`);
  if (!matches(rule.applies_to, ctx)) return undefined;
  const { bands } = resolveContext(registry, ctx);
  const rulesById = new Map(registry.rules.map((r) => [r.rule_id, r]));
  const trace = { inputs: new Set(), formula: [] };
  return { payload: resolveValue(rule.payload, { ctx, bands, rulesById, stack: [] }, trace, `${ruleId}.payload`), bands };
}
