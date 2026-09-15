/**
 * Gate1: 仓库结构与文档完整性测试
 * 检查 skill.yaml、README.md、guidelines/、modules/、assets/ 是否存在且格式正确
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.log(`  ✗ ${message}`); }
}

console.log('=== Gate1: 仓库结构与文档完整性 ===\n');

// 1. 根目录文件
console.log('1. 根目录文件:');
assert(fs.existsSync(path.join(ROOT, 'skill.yaml')), 'skill.yaml 存在');
assert(fs.existsSync(path.join(ROOT, 'README.md')), 'README.md 存在');
assert(fs.existsSync(path.join(ROOT, 'LICENSE')), 'LICENSE 存在（可选）');

// 2. skill.yaml 内容
console.log('\n2. skill.yaml 内容:');
try {
  const yaml = fs.readFileSync(path.join(ROOT, 'skill.yaml'), 'utf8');
  assert(yaml.includes('name:'), '包含 name 字段');
  assert(yaml.includes('version:'), '包含 version 字段');
  assert(yaml.includes('description:'), '包含 description 字段');
  assert(yaml.includes('rules:'), '包含 rules 定义');
  assert(yaml.includes('gates:'), '包含 gates 定义');
} catch (e) { assert(false, `skill.yaml 解析失败: ${e.message}`); }

// 3. README.md 内容
console.log('\n3. README.md 内容:');
try {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert(readme.includes('# Chinese Aesthetic Design Skill'), '包含标题');
  assert(readme.includes('安装'), '包含安装说明');
  assert(readme.includes('使用'), '包含使用说明');
  assert(readme.includes('ACT0'), '包含 ACT0 示例');
} catch (e) { assert(false, `README.md 读取失败: ${e.message}`); }

// 4. 目录结构
console.log('\n4. 目录结构:');
assert(fs.existsSync(path.join(ROOT, 'guidelines')), 'guidelines/ 目录存在');
assert(fs.existsSync(path.join(ROOT, 'modules')), 'modules/ 目录存在');
assert(fs.existsSync(path.join(ROOT, 'docs')), 'docs/ 目录存在');
assert(fs.existsSync(path.join(ROOT, 'assets')), 'assets/ 目录存在');
assert(fs.existsSync(path.join(ROOT, 'tests')), 'tests/ 目录存在');
assert(fs.existsSync(path.join(ROOT, 'scripts')), 'scripts/ 目录存在');

// 5. ACT0 资产
console.log('\n5. ACT0 资产:');
const act0Dir = path.join(ROOT, 'assets', 'ACT0');
assert(fs.existsSync(act0Dir), 'assets/ACT0/ 目录存在');
if (fs.existsSync(act0Dir)) {
  const files = fs.readdirSync(act0Dir);
  assert(files.includes('master-plate.md'), 'master-plate.md 存在');
  assert(files.includes('material-params.md'), 'material-params.md 存在');
  assert(files.includes('interaction-timeline.md'), 'interaction-timeline.md 存在');
  assert(files.includes('fsm.md'), 'fsm.md 存在');
}

console.log(`\n=== Gate1 结果: ${passed} 通过, ${failed} 失败 ===`);
process.exit(failed > 0 ? 1 : 0);
