/**
 * Gate3: 规则算法与示例测试
 * 测试 validate.js 中的核心算法：色彩校验、比例校验、虚实校验、禁忌检测
 */
const { checkColor, checkPalette, checkProportion, checkVoidSolid, checkSpatialOrder, checkTaboo } = require('../scripts/validate');

let passed = 0, failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.log(`  ✗ ${message}`); }
}

console.log('=== Gate3: 规则算法与示例 ===\n');

// 1. 色彩校验
console.log('1. 色彩校验:');
const colorTests = [
  { hex: '#8B2500', expectPass: true, desc: '暗朱砂合规' },
  { hex: '#E8E4D9', expectPass: true, desc: '月白合规' },
  { hex: '#B8860B', expectPass: true, desc: '哑金合规' },
  { hex: '#FF0000', expectPass: false, desc: '正红P0违规' },
  { hex: '#FFD700', expectPass: false, desc: '亮金P0违规' },
  { hex: '#00FF00', expectPass: false, desc: '霓虹绿P0违规' }
];
colorTests.forEach(t => {
  const r = checkColor(t.hex);
  assert(r.pass === t.expectPass, `${t.hex} ${t.desc} (pass=${r.pass})`);
});

// 配色方案校验
console.log('\n2. 配色方案校验:');
const goodPalette = checkPalette(['#E8E4D9', '#2C3E50', '#B8860B']);
assert(goodPalette.pass, '宋韵清雅配色通过');
assert(goodPalette.score >= 80, `宋韵清雅配色得分${goodPalette.score}≥80`);

const badPalette = checkPalette(['#FF0000', '#FFD700', '#00FF00']);
assert(!badPalette.pass, '霓虹配色不通过');
assert(badPalette.score < 50, `霓虹配色得分${badPalette.score}<50`);

// 3. 比例校验
console.log('\n3. 比例校验:');
const foguangsi = checkProportion({ width: 34, height: 17, humanHeight: 1.7, buildingHeight: 17 });
assert(foguangsi.pass, '佛光寺1:2比例通过');
assert(foguangsi.score >= 80, `佛光寺比例得分${foguangsi.score}≥80`);

const badRatio = checkProportion({ width: 10, height: 10, humanHeight: 5, buildingHeight: 10 });
assert(!badRatio.pass, '1:1比例+人过大不通过');

// 4. 虚实校验
console.log('\n4. 虚实校验:');
assert(checkVoidSolid(0.65).pass, '留白65%通过');
assert(checkVoidSolid(0.35).pass, '留白35%通过(P1警告)');
assert(!checkVoidSolid(0.20).pass, '留白20%P0不通过');

// 5. 空间秩序校验
console.log('\n5. 空间秩序校验:');
assert(checkSpatialOrder(5).pass, '偏移5%通过');
assert(!checkSpatialOrder(15).pass, '偏移15%P0不通过');

// 6. 禁忌检测
console.log('\n6. 禁忌检测:');
const palaceDesign = checkTaboo({ context: 'palace', elements: ['five-claw-dragon'], saturation: 30 });
assert(palaceDesign.pass, '宫殿场景五爪龙合规');

const residentialDesign = checkTaboo({ context: 'residential', elements: ['five-claw-dragon'], saturation: 30 });
assert(!residentialDesign.pass, '民居场景五爪龙P0违规');

const aiGuofeng = checkTaboo({ context: 'generic', elements: [], saturation: 85, materials: [{ roughness: 0.1 }], lighting: { contrastRatio: 1.2 } });
assert(!aiGuofeng.pass, 'AI国风感检测触发');
assert(aiGuofeng.aiScore > 0.7, `AI国风感评分${aiGuofeng.aiScore}>0.7`);

console.log(`\n=== Gate3 结果: ${passed} 通过, ${failed} 失败 ===`);
process.exit(failed > 0 ? 1 : 0);
