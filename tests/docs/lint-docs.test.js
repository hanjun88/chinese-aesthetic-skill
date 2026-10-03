import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintDocs } from '../../scripts/lint-docs.mjs';
import { renderRulesBlock } from '../../scripts/render-rules-docs.mjs';
import { renderEvidenceBlock } from '../../scripts/evidence.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('the committed documentation passes the docs lint (no second copy of a threshold, no hand-written test count)', () => {
  const r = lintDocs();
  assert.deepEqual(r.problems, []);
  assert.ok(r.ok);
  assert.ok(r.threshold_lines > 0, 'the lint really looked at threshold-shaped lines');
});

/* ------------------------------------------------------------------------------------------------
 * Behaviour of the lint on synthetic documents. scripts/lint-docs.mjs resolves its root from its own
 * location, so the fixture is a throw-away project: a copy of the script, lib/, rules/ and package.json
 * plus the documents below. One lint run covers every case; each test reads its own file's problems.
 * ---------------------------------------------------------------------------------------------- */

const dir = mkdtempSync(join(tmpdir(), 'lint-docs-'));
after(() => rmSync(dir, { recursive: true, force: true }));

const put = (rel, text) => {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), text);
};

mkdirSync(join(dir, 'scripts'));
cpSync(join(ROOT, 'scripts', 'lint-docs.mjs'), join(dir, 'scripts', 'lint-docs.mjs'));
cpSync(join(ROOT, 'package.json'), join(dir, 'package.json'));
cpSync(join(ROOT, 'lib'), join(dir, 'lib'), { recursive: true });
cpSync(join(ROOT, 'rules'), join(dir, 'rules'), { recursive: true });

const SUMMARY = { suites: [{ title: 'Engine integration tests', command: 'node tests/engines.test.js', passed: 112, failed: 0, skipped: 0 }], gates: [] };
put('README.md', [
  '# fixture',
  '',
  renderRulesBlock(),
  '',
  renderEvidenceBlock(SUMMARY),
  '',
  'Outside the generated blocks a count is a hand-written count: 9 tests',
].join('\n'));
put('SKILL.md', '验证：112 passed\n');
put('skill.yaml', 'min_void: 0.6 # rule:CAS-VS-HF-001\nmax_void: 0.9 # rule:CAS-VS-HF-001\n');
put('modules/a-unmarked.md', '留白 ≥ 0.6 即可\n');
put('modules/b-marked.md', '亮调山水留白 ≥ 0.60 <!-- rule:CAS-VS-HF-001 -->\n留白 60% 以上 <!-- rule:CAS-VS-HF-001 -->\n');
put('modules/c-foreign-number.md', '留白 ≥ 0.3 <!-- rule:CAS-VS-HF-001 -->\n');
put('modules/d-unknown-rule.md', '留白 ≥ 0.6 <!-- rule:CAS-XX-999 -->\n');
put('modules/e-superseded.md', '旧规则：留白≥30%\n');
put('modules/f-rule-id-digits.md', '过满线 ≥ 0.40（规则 `CAS-VS-SS-003`，引擎计分）<!-- rule:CAS-VS-SS-003 -->\n');
put('modules/g-rule-row.md', '| `CAS-VS-HF-001` | Hard floor: bright-tone landscape void >= 60% | HARD_FLOOR | [0.60, 1.00] | LANDSCAPE | 0.90 <!-- rule:CAS-VS-HF-001 --> |\n');
put('modules/h-unregistered-id.md', '留白 ≥ 0.6（GATE-77）<!-- rule:CAS-VS-HF-001 -->\n');
put('modules/i-observation.md', '实测：ai-linggan 15 个视频的留白均值 26%，范围 14%-38%\n');
put('modules/evidence-index.md', [
  '# 素材批次总览',
  '- 4/6 视频 ≤0.25，均值 0.50（范围 0.25–0.65，n=8），不超过 0.65',
  '- 旧规则：留白≥30%',
].join('\n') + '\n');
put('modules/j-evidence-section.md', [
  '# 模块：示例',
  '## 原则要点',
  '- 留白 ≥ 0.6 即可',
  '## 素材库实证（Distillation Evidence）',
  '- 4/6 视频 ≤0.25；均值 0.50',
  '### 实证观察表',
  '```bash',
  '# 代码块里的注释不是标题',
  '```',
  '- 不超过 0.65 的样本 5/8',
  '### 样本说明',
  '- 范围 ≤0.30 的占一半',
  '## 另一节',
  '- 留白 ≥ 0.6 即可',
].join('\n') + '\n');
put('docs/GATES.md', '帧率 ≥30fps，色彩校验 S>60% 触发 P0\n本次 12 passed\n');
put('playbooks/x/README.md', '旧规则：留白>=30%\n阈值 ≥ 5 个文件\n');
for (const skipped of ['modules/extracted/z.md', 'docs/closure/z.md', 'docs/decisions/z.md']) put(skipped, '留白≥30%\n9 tests\n');

const run = spawnSync(process.execPath, ['scripts/lint-docs.mjs', '--json'], { cwd: dir, encoding: 'utf8' });
const result = JSON.parse(run.stdout);
const problemsIn = (file) => result.problems.filter((p) => p.startsWith(`${file}:`));

test('fixture: the lint fails the run when anything is wrong (exit 1) and reports JSON', () => {
  assert.equal(run.status, 1);
  assert.equal(result.ok, false);
});

test('a threshold in an aesthetic document without a rule marker is a duplicate', () => {
  assert.match(problemsIn('modules/a-unmarked.md').join('\n'), /threshold stated without a rule marker/);
});

test('a marker whose rule carries every number on the line passes (percent and fraction forms)', () => {
  assert.deepEqual(problemsIn('modules/b-marked.md'), []);
});

test('a number the cited rule does not carry is flagged', () => {
  assert.match(problemsIn('modules/c-foreign-number.md').join('\n'), /0\.3 is not a number of rule CAS-VS-HF-001/);
});

test('a marker naming an unknown rule is flagged', () => {
  assert.match(problemsIn('modules/d-unknown-rule.md').join('\n'), /unknown rule CAS-XX-999/);
});

test('YAML markers (# rule:ID) work; every threshold line needs its own', () => {
  assert.deepEqual(problemsIn('skill.yaml'), []);
});

test('superseded literals are flagged everywhere in scope, but not in extracted evidence, ADRs or closure ledgers', () => {
  assert.match(problemsIn('modules/e-superseded.md').join('\n'), /superseded literal "留白≥30%"/);
  assert.match(problemsIn('playbooks/x/README.md').join('\n'), /superseded literal "留白>=30%"/);
  for (const skipped of ['modules/extracted/z.md', 'docs/closure/z.md', 'docs/decisions/z.md']) assert.deepEqual(problemsIn(skipped), [], skipped);
});

test('false positive fixed: the digits of a registered rule id are an identifier, not a number', () => {
  assert.deepEqual(problemsIn('modules/f-rule-id-digits.md'), []);
  // ... but only registered ids are exempt: any other dashed token still counts its digits
  assert.match(problemsIn('modules/h-unregistered-id.md').join('\n'), /77 is not a number of rule CAS-VS-HF-001/);
});

test('false positive fixed: a rule row may render the rule\'s own title numbers and confidence', () => {
  assert.deepEqual(problemsIn('modules/g-rule-row.md'), []);
});

test('the generated rules table passes the lint row by row', () => {
  assert.equal(problemsIn('README.md').filter((p) => !/hand-written test count/.test(p)).length, 0, problemsIn('README.md').join('\n'));
});

test('observations (measured means and ranges) are not thresholds', () => {
  assert.deepEqual(problemsIn('modules/i-observation.md'), []);
});

test('EVIDENCE IS NOT ENFORCEMENT: the evidence index may state observed values in threshold-shaped form; a retired literal is still flagged there', () => {
  const problems = problemsIn('modules/evidence-index.md');
  assert.equal(problems.length, 1, problems.join('\n'));
  assert.match(problems[0], /^modules\/evidence-index\.md:3: superseded literal "留白≥30%"/);
  assert.ok(!problems.some((p) => /threshold stated/.test(p)), 'observed values are not duplicated thresholds');
});

test('a module section headed as evidence is exempt, including its sub-sections and fenced comments; the normative sections around it are not', () => {
  const problems = problemsIn('modules/j-evidence-section.md');
  assert.deepEqual(problems.map((p) => Number(/:(\d+):/.exec(p)[1])), [3, 14], problems.join('\n'));
  for (const p of problems) assert.match(p, /threshold stated without a rule marker/);
});

test('test counts: allowed only inside the generated evidence block, flagged everywhere else', () => {
  const readme = problemsIn('README.md').filter((p) => /hand-written test count/.test(p));
  assert.equal(readme.length, 1, 'the evidence block is exempt, the sentence after it is not');
  assert.match(readme[0], /^README\.md:\d+:/);
  assert.match(problemsIn('SKILL.md').join('\n'), /hand-written test count/);
  assert.match(problemsIn('docs/GATES.md').join('\n'), /hand-written test count/);
});

test('process and engineering documents may state limits (they are not aesthetic documents)', () => {
  assert.ok(!problemsIn('docs/GATES.md').some((p) => /threshold stated/.test(p)));
  assert.ok(!problemsIn('playbooks/x/README.md').some((p) => /threshold stated/.test(p)));
});
