#!/usr/bin/env node
/**
 * emit-sheet.mjs — emit the AestheticConstraintSheet of one design context.
 *
 *   node scripts/emit-sheet.mjs --period SONG --material STONE --lighting DIM --scene-type OBJECT_STUDY [--out sheet.json]
 *   node scripts/emit-sheet.mjs --all --out-dir dir     (every valid context of the vocabulary)
 *   node scripts/emit-sheet.mjs --list                  (valid and excluded contexts)
 *
 * Exit codes: 0 ok · 1 emission refused (excluded context, registry conflict, missing role) · 2 usage.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ContextError, emitSheet, enumerateContexts } from './lib/sheet-emitter.mjs';
import { contextKey, RegistryConflictError } from '../lib/rules/derive.js';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const flag = (n) => args.includes(`--${n}`);

try {
  if (flag('list')) {
    const { valid, excluded } = enumerateContexts();
    console.log(JSON.stringify({ valid: valid.map(contextKey), excluded: excluded.map(contextKey) }, null, 2));
    process.exit(0);
  }
  if (flag('all')) {
    const dir = opt('out-dir');
    if (!dir) { console.error('--all requires --out-dir'); process.exit(2); }
    mkdirSync(dir, { recursive: true });
    const { valid } = enumerateContexts();
    for (const ctx of valid) writeFileSync(join(dir, `${contextKey(ctx)}.json`), JSON.stringify(emitSheet(ctx), null, 2) + '\n');
    console.log(`emitted ${valid.length} sheets to ${dir}`);
    process.exit(0);
  }
  const ctx = { period: opt('period'), material: opt('material'), lighting: opt('lighting'), scene_type: opt('scene-type') ?? 'OBJECT_STUDY' };
  if (!ctx.period || !ctx.material || !ctx.lighting) { console.error('usage: emit-sheet.mjs --period P --material M --lighting L [--scene-type S] [--out file]'); process.exit(2); }
  const text = JSON.stringify(emitSheet(ctx), null, 2) + '\n';
  const out = opt('out');
  if (out) writeFileSync(out, text); else process.stdout.write(text);
} catch (e) {
  if (e instanceof ContextError || e instanceof RegistryConflictError) { console.error(`emit-sheet: refused: ${e.message}`); process.exit(1); }
  throw e;
}
