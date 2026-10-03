/**
 * registry.js — the skill's single rule registry (pure, browser-safe).
 *
 * Every aesthetic rule, threshold, decision and its provenance lives in rules/ (vocabulary,
 * sources, one file per rule family). This module validates the aggregate once at load time and
 * exposes read access for the engines (so engines never carry their own copy of a threshold) and
 * for the sheet emitter. Structural problems throw: a broken registry never half-loads.
 */
import data from '../../rules/index.js';

export const CONTRACT_KINDS = [
  'PARAMETER_BAND', 'GRAMMAR_RULE', 'OPERATION_POLICY', 'ANTI_PATTERN_THRESHOLD',
  'EVALUATION_ASSERTION', 'PRIORITY_ORDER', 'SCORING_WEIGHTS',
];
const RULE_ID = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)+$/;
const SOURCE_ID = /^SRC-[A-Z0-9][A-Z0-9-]*$/;
const AUDIENCES = ['sheet', 'engine'];

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); }
  return o;
};

/** Validate and flatten the aggregate. Returns { registry_version, vocabulary, sources, rules[] }. */
export function buildRegistry(rawIn) {
  const problems = [];
  const bad = (m) => problems.push(m);
  // merge the per-owner source shards; the same source id in two shards is an error
  const merged = {};
  for (const [shard, entries] of Object.entries(rawIn.source_files ?? {})) {
    for (const [id, s] of Object.entries(entries)) {
      if (id in merged) bad(`source ${id} is defined in more than one shard (second: ${shard})`);
      merged[id] = s;
    }
  }
  const raw = { ...rawIn, sources: merged };
  const vocab = raw.vocabulary;
  const roles = new Set(vocab.roles);
  const vocabOf = { period: new Set(Object.keys(vocab.periods)), material: new Set(Object.keys(vocab.materials)), lighting: new Set(Object.keys(vocab.lighting)), scene_type: new Set(Object.keys(vocab.scene_types)) };

  const ctxRule = raw.context_rule;
  if (!ctxRule || !RULE_ID.test(ctxRule.rule_id ?? '')) bad('context_rule.rule_id missing or malformed');
  for (const s of ctxRule?.sources ?? []) if (!raw.sources[s]) bad(`context_rule: unknown source ${s}`);
  if (!ctxRule?.sources?.length) bad('context_rule: provenance missing (sources[] empty)');

  for (const [id, s] of Object.entries(raw.sources)) {
    if (!SOURCE_ID.test(id)) bad(`source id ${id} is malformed`);
    if (!s.kind || !s.ref) bad(`source ${id} needs kind and ref`);
  }

  const rules = [];
  const seen = new Set();
  for (const [family, file] of Object.entries(raw.families)) {
    if (file.family !== family) bad(`family file ${family} declares family ${file.family}`);
    for (const r of file.rules) {
      const at = r.rule_id ?? '(no rule_id)';
      if (!RULE_ID.test(r.rule_id ?? '')) bad(`${at}: rule_id malformed`);
      if (seen.has(r.rule_id)) bad(`${at}: duplicate rule_id`);
      seen.add(r.rule_id);
      if (!r.rule_id?.startsWith(`${family}-`)) bad(`${at}: rule_id must start with its family ${family}-`);
      if (!CONTRACT_KINDS.includes(r.kind)) bad(`${at}: unknown kind ${r.kind}`);
      if (!roles.has(r.role)) bad(`${at}: unknown role ${r.role}`);
      if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 1) bad(`${at}: confidence must be within [0,1]`);
      if (!r.title) bad(`${at}: title required`);
      if (!Array.isArray(r.sources) || r.sources.length === 0) bad(`${at}: provenance missing (sources[] empty)`);
      for (const s of r.sources ?? []) if (!raw.sources[s]) bad(`${at}: unknown source ${s}`);
      if (r.payload === null || typeof r.payload !== 'object') bad(`${at}: payload must be an object`);
      for (const a of r.audience ?? []) if (!AUDIENCES.includes(a)) bad(`${at}: unknown audience ${a}`);
      for (const [k, list] of Object.entries(r.applies_to ?? {})) {
        if (!vocabOf[k]) bad(`${at}: applies_to.${k} is not a context axis`);
        else for (const v of list) if (!vocabOf[k].has(v)) bad(`${at}: applies_to.${k} value ${v} is not in the vocabulary`);
      }
      rules.push(r);
    }
  }
  if (problems.length) throw new Error(`rules registry invalid:\n  - ${problems.join('\n  - ')}`);
  return deepFreeze({ registry_version: raw.registry_version, context_rule: ctxRule, vocabulary: vocab, sources: raw.sources, rules });
}

export const REGISTRY = buildRegistry(data);

const BY_ID = new Map(REGISTRY.rules.map((r) => [r.rule_id, r]));

export function getRule(ruleId) {
  const r = BY_ID.get(ruleId);
  if (!r) throw new Error(`unknown rule ${ruleId}`);
  return r;
}

/**
 * Raw payload of a rule for engine use. Engines read thresholds here instead of declaring them.
 * Derivation nodes are not resolved: engines that need a context-dependent value use derive.js.
 */
export function rulePayload(ruleId) {
  return getRule(ruleId).payload;
}

/** Numeric edge of a PARAMETER_BAND rule payload ('min' | 'max' | 'target'). */
export function bandEdge(ruleId, edge) {
  const v = getRule(ruleId).payload[edge];
  if (typeof v !== 'number') throw new Error(`${ruleId}.payload.${edge} is not a literal number`);
  return v;
}
