/**
 * Gate2: 模块文件与规则完整性测试
 * 检查 guidelines/ 下是否包含全部10条核心规则，每条规则是否有目的/指标/P0条件
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GUIDELINES = path.join(ROOT, 'guidelines');
let passed = 0, failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.log(`  ✗ ${message}`); }
}

console.log('=== Gate2: 模块文件与规则完整性 ===\n');

const REQUIRED_RULES = [
  { file: 'spatial-order.md', title: '空间秩序', keywords: ['中轴', '对称', 'P0'] },
  { file: 'void-solid.md', title: '虚实关系', keywords: ['留白', '虚实', 'P0'] },
  { file: 'proportion.md', title: '比例', keywords: ['比例', '√2', 'P0'] },
  { file: 'material.md', title: '材料与质感', keywords: ['木', '石', 'roughness'] },
  { file: 'light-shadow.md', title: '光影布局', keywords: ['光', '阴影', '软阴影'] },
  { file: 'color.md', title: '色彩体系', keywords: ['五方', '色彩', 'P0'] },
  { file: 'motion.md', title: '运动动势', keywords: ['云', '动势', '缓动'] },
  { file: 'time.md', title: '时间感', keywords: ['时间', '风化', '昼夜'] },
  { file: 'taboo.md', title: '禁忌', keywords: ['禁忌', '俗套', 'P0'] },
  { file: 'interaction.md', title: '交互语义', keywords: ['交互', '鼠标', 'P0'] }
];

// 1. 文件存在性
console.log('1. 规则文件存在性:');
REQUIRED_RULES.forEach(rule => {
  const filePath = path.join(GUIDELINES, rule.file);
  assert(fs.existsSync(filePath), `${rule.file} (${rule.title}) 存在`);
});

// 2. 内容完整性
console.log('\n2. 规则内容完整性:');
REQUIRED_RULES.forEach(rule => {
  const filePath = path.join(GUIDELINES, rule.file);
  if (!fs.existsSync(filePath)) { assert(false, `${rule.file} 无法检查内容`); return; }
  const content = fs.readFileSync(filePath, 'utf8');
  rule.keywords.forEach(kw => {
    assert(content.includes(kw), `${rule.file} 包含关键词 "${kw}"`);
  });
  // 检查结构
  assert(content.includes('目的') || content.includes('## 目的'), `${rule.file} 有"目的"章节`);
  assert(content.includes('P0') || content.includes('P1'), `${rule.file} 有P0/P1判定`);
});

// 3. 文件非空
console.log('\n3. 文件内容非空:');
REQUIRED_RULES.forEach(rule => {
  const filePath = path.join(GUIDELINES, rule.file);
  if (fs.existsSync(filePath)) {
    const size = fs.statSync(filePath).size;
    assert(size > 500, `${rule.file} 内容充足 (${size} bytes)`);
  }
});

// 4. modules/ 实现模块
console.log('\n4. modules/ 实现模块:');
const MODULES = path.join(ROOT, 'modules');
if (fs.existsSync(MODULES)) {
  const moduleFiles = fs.readdirSync(MODULES).filter(f => f.endsWith('.md'));
  assert(moduleFiles.length >= 3, `modules/ 有≥3个实现模块 (实际${moduleFiles.length}个)`);
}

console.log(`\n=== Gate2 结果: ${passed} 通过, ${failed} 失败 ===`);
process.exit(failed > 0 ? 1 : 0);
