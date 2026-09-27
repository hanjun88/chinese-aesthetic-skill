#!/usr/bin/env node
/**
 * CAS 打包 / 安装脚本
 * 用法:
 *   node scripts/pack-skill.cjs --out <dir>     仅打包到 <dir>
 *   node scripts/pack-skill.cjs --install        打包并安装到 /var/minis/skills/chinese-aesthetic-skill
 *   node scripts/pack-skill.cjs --install --dest /custom/path
 *
 * 打包契约（对齐 Minis skill 规范）：
 *   - SKILL.md 带 YAML frontmatter（name + description）为唯一入口，skill.yaml 为可选补充元数据
 *   - lib/ 为零依赖运行时（纯 ESM，package.json dependencies 仅用于可选 UI demo）
 *   - 排除：node_modules/ dist/ .git/ 参考图（distillation 中的 jpg/jpeg）
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 需要随包分发的目录
const INCLUDE_DIRS = ['lib', 'guidelines', 'playbooks', 'terms', 'modules', 'distillation', 'scripts', 'tests', 'docs'];
// 需要随包分发的单文件
const INCLUDE_FILES = ['skill.yaml', 'metadata.json', 'package.json', 'README.md', 'LICENSE', 'SKILL.md'];
// 排除规则（相对路径前缀 / 扩展名）
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.git', '.github', '.vite']);
const EXCLUDE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov']);
const EXCLUDE_FILES = new Set(['package-lock.json', 'bun.lock']);

function walk(src, rel = '', out = []) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const abs = path.join(src, entry.name);
    const r = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name) || EXCLUDE_DIRS.has(r)) continue;
      walk(abs, r, out);
    } else if (entry.isFile()) {
      if (EXCLUDE_FILES.has(entry.name)) continue;
      if (EXCLUDE_EXT.has(path.extname(entry.name).toLowerCase())) continue;
      out.push(r);
    }
  }
  return out;
}

function collect() {
  const files = [];
  for (const f of INCLUDE_FILES) {
    if (fs.existsSync(path.join(ROOT, f))) files.push(f);
    else console.warn(`  ! 缺失可选文件: ${f}`);
  }
  for (const d of INCLUDE_DIRS) {
    const abs = path.join(ROOT, d);
    if (!fs.existsSync(abs)) { console.warn(`  ! 缺失目录: ${d}`); continue; }
    walk(abs, d, files);
  }
  return files;
}

function copyInto(files, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const rel of files) {
    const src = path.join(ROOT, rel);
    const dst = path.join(dest, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

function verify(dest) {
  const errors = [];
  const must = ['SKILL.md', 'skill.yaml', 'metadata.json', 'package.json', 'lib/index.js'];
  for (const m of must) {
    if (!fs.existsSync(path.join(dest, m))) errors.push(`缺文件: ${m}`);
  }
  // SKILL.md frontmatter 必须含 name 与 description
  const skillMd = fs.readFileSync(path.join(dest, 'SKILL.md'), 'utf8');
  if (!/^---\n/.test(skillMd)) errors.push('SKILL.md 缺少 frontmatter 起始 ---');
  if (!/^name:\s*\S/m.test(skillMd)) errors.push('SKILL.md frontmatter 缺 name');
  if (!/^description:\s*\S/m.test(skillMd)) errors.push('SKILL.md frontmatter 缺 description');
  // skill.yaml 不得残留 HEARTMIRROR 仓库地址
  const y = fs.readFileSync(path.join(dest, 'skill.yaml'), 'utf8');
  if (/github\.com\/HEARTMIRROR/.test(y)) errors.push('skill.yaml 仍含 404 的 HEARTMIRROR 仓库地址');
  if (/^dependencies:/m.test(y)) errors.push('skill.yaml 仍含 dependencies（应为 runtime_dependencies / integration_points）');
  // 运行时零外部依赖校验
  const pkg = JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8'));
  const libDeps = Object.keys(pkg.dependencies || {});
  return { errors, libDeps };
}

function main() {
  const argv = process.argv.slice(2);
  const install = argv.includes('--install');
  let out = null, dest = '/var/minis/skills/chinese-aesthetic-skill';
  const i = argv.indexOf('--out');
  if (i >= 0 && argv[i + 1]) out = path.resolve(argv[i + 1]);
  const d = argv.indexOf('--dest');
  if (d >= 0 && argv[d + 1]) dest = path.resolve(argv[d + 1]);

  const files = collect();
  const bytes = files.reduce((s, f) => s + fs.statSync(path.join(ROOT, f)).size, 0);
  console.log(`[pack] 收集 ${files.length} 个文件，${(bytes / 1024).toFixed(1)} KB（已排除参考图与构建产物）`);

  if (out) {
    fs.rmSync(out, { recursive: true, force: true });
    copyInto(files, out);
    const v = verify(out);
    console.log(`[pack] 输出到 ${out}`);
    report(v);
    if (v.errors.length) process.exit(1);
    return;
  }

  if (install) {
    const staging = fs.mkdtempSync('/tmp/cas-pack-');
    copyInto(files, staging);
    const v = verify(staging);
    console.log('[pack] 暂存区自检：');
    report(v);
    if (v.errors.length) { console.error('[pack] 自检失败，中止安装'); process.exit(1); }
    // 原子替换：先移走旧版，再落新
    const backup = fs.existsSync(dest) ? `${dest}.bak-${Date.now()}` : null;
    if (backup) fs.renameSync(dest, backup);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(staging, dest);
    console.log(`[pack] 已安装到 ${dest}`);
    if (backup) console.log(`[pack] 旧版本已备份至 ${backup}`);
    return;
  }

  console.log('用法: node scripts/pack-skill.cjs --out <dir> | --install [--dest <path>]');
}

function report(v) {
  for (const e of v.errors) console.error(`  ✗ ${e}`);
  if (!v.errors.length) console.log(`  ✓ 自检通过（运行时 package deps: ${v.libDeps.join(', ') || '无'}）`);
}

main();
