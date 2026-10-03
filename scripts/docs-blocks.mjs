/**
 * docs-blocks.mjs — shared plumbing of the documentation generators.
 *
 * A generated block lives between two HTML comment markers in a hand-written document:
 *
 *   <!-- rules:begin -->
 *   ...generated, never edited by hand...
 *   <!-- rules:end -->
 *
 * The generators (render-rules-docs.mjs, evidence.mjs) own everything between the markers;
 * the surrounding prose stays hand-written. Each generator has --write (regenerate) and --check
 * (fail when the committed block differs from what the generator would write now).
 */
import { readFileSync, writeFileSync } from 'node:fs';

export class BlockError extends Error {
  constructor(message) { super(message); this.name = 'BlockError'; }
}

export const beginMarker = (name) => `<!-- ${name}:begin -->`;
export const endMarker = (name) => `<!-- ${name}:end -->`;

/** Index range of the block `name` in `text`: { start, end } where text.slice(start, end) is begin..end markers. */
function locate(text, name) {
  const begin = beginMarker(name);
  const end = endMarker(name);
  const countOf = (needle) => text.split(needle).length - 1;
  if (countOf(begin) !== 1 || countOf(end) !== 1) {
    throw new BlockError(`expected exactly one ${begin} and one ${end} (found ${countOf(begin)} / ${countOf(end)})`);
  }
  const start = text.indexOf(begin);
  const stop = text.indexOf(end);
  if (stop < start) throw new BlockError(`${end} comes before ${begin}`);
  return { start, end: stop + end.length };
}

/** The current block (markers included). */
export function extractBlock(text, name) {
  const { start, end } = locate(text, name);
  return text.slice(start, end);
}

/** `text` with the block replaced by `block` (which must itself carry the begin and end markers). */
export function replaceBlock(text, name, block) {
  if (!block.startsWith(beginMarker(name)) || !block.endsWith(endMarker(name))) {
    throw new BlockError(`generated block must start with ${beginMarker(name)} and end with ${endMarker(name)}`);
  }
  const { start, end } = locate(text, name);
  return text.slice(0, start) + block + text.slice(end);
}

/** First differing line of two blocks, for a readable --check failure. */
export function firstDifference(a, b) {
  const x = a.split('\n');
  const y = b.split('\n');
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] !== y[i]) return { line: i + 1, committed: x[i] ?? '(missing)', generated: y[i] ?? '(missing)' };
  }
  return null;
}

/**
 * Shared --write / --check driver. `generate()` returns the fresh block. Returns the process exit code.
 *   write: replace the block in `file` (exit 0)
 *   check: exit 1 when the committed block differs
 */
export function syncBlock({ file, name, generate, mode, label, command }) {
  const text = readFileSync(file, 'utf8');
  const fresh = generate();
  if (mode === 'write') {
    const next = replaceBlock(text, name, fresh);
    if (next !== text) writeFileSync(file, next);
    console.log(`${label}: ${next !== text ? 'updated' : 'already current'} (${file})`);
    return 0;
  }
  const committed = extractBlock(text, name);
  const diff = firstDifference(committed, fresh);
  if (!diff) { console.log(`${label}: current`); return 0; }
  console.error(`${label}: STALE — the committed block differs from the generated one (first difference at block line ${diff.line}).`);
  console.error(`  committed: ${diff.committed}`);
  console.error(`  generated: ${diff.generated}`);
  console.error(`  run \`${command}\` and commit the result`);
  return 1;
}
