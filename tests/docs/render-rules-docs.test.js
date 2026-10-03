import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import data from '../../rules/index.js';
import { REGISTRY, bandEdge, getRule } from '../../lib/rules/registry.js';
import { extractBlock } from '../../scripts/docs-blocks.mjs';
import { BLOCK, DOC_FAMILIES, familyLabel, main, renderRow, renderRulesBlock } from '../../scripts/render-rules-docs.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rowsOf = (text) => text.split('\n').filter((l) => /^\| `/.test(l));

function quiet(fn) {
  const { log, error } = console;
  const out = [];
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => out.push(a.join(' '));
  try { return { value: fn(), out }; } finally { console.log = log; console.error = error; }
}

test('every rule of the documented families is rendered exactly once, in registry order', () => {
  const expected = DOC_FAMILIES.flatMap((f) => data.families[f].rules.map((r) => r.rule_id));
  const rendered = rowsOf(renderRulesBlock()).map((l) => /^\| `([^`]+)`/.exec(l)[1]);
  assert.deepEqual(rendered, expected);
  assert.ok(expected.length > 0);
  for (const id of expected) assert.ok(REGISTRY.rules.some((r) => r.rule_id === id));
});

test('every row ends with the marker of the rule it renders (what scripts/lint-docs.mjs checks the numbers against)', () => {
  for (const row of rowsOf(renderRulesBlock())) {
    const id = /^\| `([^`]+)`/.exec(row)[1];
    assert.match(row, new RegExp(`<!-- rule:${id} --> \\|$`), `${id}: marker missing or not in the last cell`);
    assert.equal(row.match(/<!-- rule:/g).length, 1, `${id}: exactly one marker per row`);
  }
});

test('values come from the registry payload, not from typed numbers', () => {
  const rows = Object.fromEntries(rowsOf(renderRulesBlock()).map((l) => [/^\| `([^`]+)`/.exec(l)[1], l]));
  const f2 = (n) => n.toFixed(2);
  // hard floor, period bands and structural signals render [min, max] of their payload
  for (const id of ['CAS-VS-HF-001', 'CAS-VS-PB-TANG', 'CAS-VS-PB-SONG', 'CAS-VS-PB-MING', 'CAS-VS-SS-001', 'CAS-VS-SS-002', 'CAS-VS-SS-003']) {
    assert.ok(rows[id].includes(`[${f2(bandEdge(id, 'min'))}, ${f2(bandEdge(id, 'max'))}]`), `${id} band`);
  }
  // scene defaults render the authored target of their $clamp node
  for (const id of ['CAS-VS-DT-PALACE', 'CAS-VS-DT-TEMPLE', 'CAS-VS-DT-RESIDENCE', 'CAS-VS-DT-LANDSCAPE', 'CAS-VS-DT-GATE-ACT0']) {
    assert.ok(rows[id].includes(`target ${f2(getRule(id).payload.target.$clamp.value)},`), `${id} default`);
  }
  // grammar rules render condition and mutation values
  assert.ok(rows['CA-RULE-02-YUNRUN'].includes(`< ${f2(getRule('CA-RULE-02-YUNRUN').payload.condition.value)} → ${f2(getRule('CA-RULE-02-YUNRUN').payload.mutation.value)}`));
  assert.ok(rows['CA-RULE-01-XUSHI'].includes('< band min → clamp(0.45)'), 'the void repair trigger is the lower edge of the effective band');
  assert.ok(rows['ANTI-AI-04'].includes('[2700, 6500] → 5200'));
  // confidence and scope
  assert.ok(rows['CAS-VS-HF-001'].includes(f2(getRule('CAS-VS-HF-001').confidence)));
  assert.ok(rows['CAS-VS-HF-001'].includes('scene_type: LANDSCAPE · lighting: DAYLIGHT'));
  assert.ok(rows['CAS-VS-SS-001'].includes('engine only'), 'engine-audience rules are marked');
  assert.ok(rows['CAS-VS-PR-001'].includes('any context'));
});

test('the block never contains a superseded literal', () => {
  const block = renderRulesBlock();
  for (const s of JSON.parse(readFileSync(join(ROOT, 'rules', 'superseded.json'), 'utf8'))) assert.ok(!block.includes(s.literal), s.literal);
});

test('rendering is deterministic and independent of the hand-written README', () => {
  assert.equal(renderRulesBlock(), renderRulesBlock());
  assert.ok(renderRulesBlock().startsWith(`<!-- ${BLOCK}:begin -->`));
  assert.ok(renderRulesBlock().endsWith(`<!-- ${BLOCK}:end -->`));
});

test('familyLabel takes the first clause or sentence of a family description', () => {
  assert.equal(familyLabel('Void / solid (留白): the canonical definition. See ADR.'), 'Void / solid (留白)');
  assert.equal(familyLabel('First sentence here. Second sentence.'), 'First sentence here');
  assert.equal(familyLabel('No terminator'), 'No terminator');
});

test('a family that is not in the registry is a generator error', () => {
  assert.throws(() => renderRulesBlock({ families: ['NOPE'] }), /unknown rule family NOPE/);
});

test('a cell never breaks the table: pipes in a title are escaped', () => {
  const row = renderRow({ ...getRule('CAS-VS-PR-001'), title: 'a | b' });
  assert.ok(row.includes('a \\| b'));
  assert.equal(row.replace(/\\\|/g, '').split('|').length, 8, 'six cells between the outer pipes');
});

test('the committed README block is current (run `npm run docs:render` after changing the registry)', () => {
  const committed = extractBlock(readFileSync(join(ROOT, 'README.md'), 'utf8'), BLOCK);
  assert.equal(committed, renderRulesBlock());
});

test('CLI: --check is 0 on a current block and 1 on a stale one; --write repairs it; broken input exits 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'render-rules-'));
  try {
    const readme = join(dir, 'README.md');
    const shell = (inner) => `intro\n\n<!-- ${BLOCK}:begin -->\n${inner}\n<!-- ${BLOCK}:end -->\n\noutro\n`;
    writeFileSync(readme, shell('stale'));
    assert.equal(quiet(() => main(['--check', '--readme', readme])).value, 1);
    assert.equal(readFileSync(readme, 'utf8'), shell('stale'), '--check never writes');
    assert.equal(quiet(() => main(['--write', '--readme', readme])).value, 0);
    const written = readFileSync(readme, 'utf8');
    assert.ok(written.startsWith('intro\n\n') && written.endsWith('\n\noutro\n'), 'hand-written text survives');
    assert.equal(extractBlock(written, BLOCK), renderRulesBlock());
    assert.equal(quiet(() => main(['--check', '--readme', readme])).value, 0);

    writeFileSync(readme, 'no markers at all');
    assert.equal(quiet(() => main(['--write', '--readme', readme])).value, 2);
    assert.equal(quiet(() => main(['--bogus'])).value, 2);
    assert.equal(quiet(() => main(['--write', '--check'])).value, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
