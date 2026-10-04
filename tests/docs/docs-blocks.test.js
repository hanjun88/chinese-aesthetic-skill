import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BlockError, beginMarker, endMarker, extractBlock, firstDifference, replaceBlock, syncBlock } from '../../scripts/docs-blocks.mjs';

const doc = (inner) => `# Title\n\nhand-written before\n\n${beginMarker('demo')}\n${inner}\n${endMarker('demo')}\n\nhand-written after\n`;
const block = (inner) => `${beginMarker('demo')}\n${inner}\n${endMarker('demo')}`;

function quiet(fn) {
  const { log, error } = console;
  const out = [];
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => out.push(a.join(' '));
  try { return { value: fn(), out }; } finally { console.log = log; console.error = error; }
}

test('extractBlock returns exactly the text between (and including) the markers', () => {
  assert.equal(extractBlock(doc('old'), 'demo'), block('old'));
});

test('replaceBlock swaps only the block and leaves the hand-written text byte-identical', () => {
  const next = replaceBlock(doc('old'), 'demo', block('new\nrows'));
  assert.equal(next, doc('new\nrows'));
  assert.ok(next.startsWith('# Title\n\nhand-written before\n'));
  assert.ok(next.endsWith('hand-written after\n'));
});

test('missing, duplicated or reversed markers are errors, never a silent no-op', () => {
  assert.throws(() => extractBlock('# no markers', 'demo'), BlockError);
  assert.throws(() => replaceBlock(`${doc('a')}\n${doc('b')}`, 'demo', block('x')), /exactly one/);
  assert.throws(() => extractBlock(`${endMarker('demo')}\n${beginMarker('demo')}`, 'demo'), /before/);
});

test('a generated block must carry its own begin and end markers', () => {
  assert.throws(() => replaceBlock(doc('old'), 'demo', 'no markers here'), /must start with/);
});

test('firstDifference names the first differing line, null when equal', () => {
  assert.equal(firstDifference('a\nb\nc', 'a\nb\nc'), null);
  assert.deepEqual(firstDifference('a\nb\nc', 'a\nX\nc'), { line: 2, committed: 'b', generated: 'X' });
  assert.deepEqual(firstDifference('a', 'a\nb'), { line: 2, committed: '(missing)', generated: 'b' });
});

test('syncBlock: check fails on a stale block, write fixes it, check then passes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'docs-blocks-'));
  try {
    const file = join(dir, 'README.md');
    writeFileSync(file, doc('stale'));
    const args = { file, name: 'demo', generate: () => block('fresh'), label: 'demo', command: 'npm run docs:render' };
    const stale = quiet(() => syncBlock({ ...args, mode: 'check' }));
    assert.equal(stale.value, 1);
    assert.ok(stale.out.some((l) => l.includes('STALE')));
    assert.equal(readFileSync(file, 'utf8'), doc('stale'), 'check must not modify the file');
    assert.equal(quiet(() => syncBlock({ ...args, mode: 'write' })).value, 0);
    assert.equal(readFileSync(file, 'utf8'), doc('fresh'));
    assert.equal(quiet(() => syncBlock({ ...args, mode: 'check' })).value, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
