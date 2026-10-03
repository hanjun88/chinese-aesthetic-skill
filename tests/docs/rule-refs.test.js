import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import data from '../../rules/index.js';
import { REGISTRY } from '../../lib/rules/registry.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const IDS = new Set([...REGISTRY.rules.map((r) => r.rule_id), REGISTRY.context_rule.rule_id]);
const FAMILIES = new Set(Object.keys(data.families));

// documents that cite registry rules (playbooks use CA-PB-00x for playbook ids, so they are not scanned)
const DOCS = ['README.md', 'SKILL.md', 'skill.yaml', 'docs/design-philosophy.md', 'docs/references.md', 'docs/api-integration.md']
  .concat(readdirSync(join(ROOT, 'modules')).filter((f) => f.endsWith('.md')).map((f) => `modules/${f}`));

// CAS-VS-HF-001, CA-RULE-02-YUNRUN, ANTI-AI-04, CAS-VS (family), CAS-PB-*-ROUGHNESS (pattern)
const TOKEN = /(?<![A-Za-z0-9*-])((?:CAS|CA|ANTI)-[A-Z0-9*]+(?:-[A-Z0-9*]+)*)(?![A-Za-z0-9*-])/g;

function resolves(token) {
  if (IDS.has(token) || FAMILIES.has(token)) return true;
  if (!token.includes('*')) return false;
  const pattern = new RegExp(`^${token.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[A-Z0-9-]*')}$`);
  return [...IDS].some((id) => pattern.test(id));
}

test('every rule id, family or id pattern cited in the documents exists in the registry', () => {
  const cited = new Map();
  for (const f of DOCS) {
    for (const m of readFileSync(join(ROOT, f), 'utf8').matchAll(TOKEN)) {
      if (!cited.has(m[1])) cited.set(m[1], []);
      cited.get(m[1]).push(f);
    }
  }
  assert.ok(cited.size > 10, 'the documents really cite rules');
  const unknown = [...cited].filter(([t]) => !resolves(t)).map(([t, files]) => `${t} (${[...new Set(files)].join(', ')})`);
  assert.deepEqual(unknown, []);
});

test('the rules the README discipline names are the ones ADR-0001 decided', () => {
  const skill = readFileSync(join(ROOT, 'SKILL.md'), 'utf8');
  for (const id of ['CAS-VS-HF-001', 'CAS-VS-SS-001']) assert.ok(skill.includes(id), `SKILL.md cites ${id}`);
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  for (const id of ['CAS-VS-HF-001', 'CAS-VS-SS-001']) assert.ok(readme.includes(id), `README.md cites ${id}`);
});
