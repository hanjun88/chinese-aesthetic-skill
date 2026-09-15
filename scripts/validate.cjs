#!/usr/bin/env node
/**
 * Chinese Aesthetic Skill - 规则校验 CLI
 * 用法: node scripts/validate.js --scene ACT0_gate [--input input.json] [--output report.json]
 */

const fs = require('fs');
const path = require('path');

// ========== 色彩校验 ==========
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max-min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) { case r: h=(g-b)/d+(g<b?6:0); break; case g: h=(b-r)/d+2; break; case b: h=(r-g)/d+4; break; }
    h /= 6;
  }
  return { h: h*360, s: s*100, l: l*100 };
}

function checkColor(hex) {
  const hsl = hexToHSL(hex);
  if (hsl.s > 80 && hsl.l > 60) return { pass:false, severity:'P0', message:`高饱和亮色${hex}接近霓虹色` };
  if (hsl.h < 10 && hsl.s > 70 && hsl.l > 40) return { pass:false, severity:'P0', message:`正红${hex}，建议暗朱砂#8B2500` };
  if (hsl.h > 45 && hsl.h < 60 && hsl.s > 70 && hsl.l > 70) return { pass:false, severity:'P0', message:`亮金${hex}，建议哑金#DAA520` };
  if (hsl.s > 60) {
    // 深色(l<35%)允许100%饱和度——暗朱砂/哑金等传统深色本身是纯色通道
    const satLimit = hsl.l < 40 ? 100 : hsl.l < 55 ? 85 : 60;
    if (hsl.s > satLimit) return { pass:false, severity:'P1', message:`饱和度${hsl.s.toFixed(0)}%超过${satLimit}%阈值(深色放宽)` };
  }
  return { pass:true, hsl };
}

function checkPalette(colors) {
  const violations = [];
  let score = 100;
  colors.forEach(c => {
    const r = checkColor(c);
    if (!r.pass) { violations.push({color:c, ...r}); score -= r.severity==='P0'?25:10; }
  });
  const mainColors = colors.filter(c => hexToHSL(c).s > 20);
  if (mainColors.length > 2) { violations.push({severity:'P1', message:`主色${mainColors.length}种超过2种`}); score -= 10; }
  return { pass: violations.filter(v=>v.severity==='P0').length===0, violations, score:Math.max(0,score) };
}

// ========== 比例校验 ==========
function checkProportion(dim) {
  const violations = [];
  let score = 100;
  if (dim.width && dim.height) {
    const wh = dim.width/dim.height;
    if (wh < 1.414*0.9 || wh > 2.0*1.1) { violations.push({rule:'widthHeight', severity:'P0', actual:wh}); score-=20; }
  }
  if (dim.humanHeight && dim.buildingHeight) {
    const hb = dim.humanHeight/dim.buildingHeight;
    if (hb > 0.2) { violations.push({rule:'humanBuilding', severity:'P0', actual:hb}); score-=20; }
  }
  return { pass: violations.filter(v=>v.severity==='P0').length===0, violations, score:Math.max(0,score) };
}

// ========== 虚实校验 ==========
function checkVoidSolid(voidRatio) {
  if (voidRatio < 0.30) return { pass:false, severity:'P0', message:`留白${(voidRatio*100).toFixed(0)}%低于30%` };
  if (voidRatio < 0.50) return { pass:true, severity:'P1', message:`留白${(voidRatio*100).toFixed(0)}%，推荐50-70%` };
  return { pass:true, message:`留白${(voidRatio*100).toFixed(0)}%，合规` };
}

// ========== 空间秩序校验 ==========
function checkSpatialOrder(offsetPercent) {
  if (Math.abs(offsetPercent) > 10) return { pass:false, severity:'P0', message:`中轴偏移${offsetPercent}%超过10%` };
  return { pass:true, message:`中轴偏移${offsetPercent}%，合规` };
}

// ========== 禁忌检测 ==========
const TABOO_MAP = {
  'five-claw-dragon': { severity:'P0', context:'palace', name:'五爪龙' },
  'imperial-yellow-tile': { severity:'P0', context:'palace', name:'琉璃黄瓦' },
  'buddha-statue': { severity:'P0', context:'temple', name:'佛像' },
  'church-spire': { severity:'P0', context:'western', name:'教堂尖顶' },
  'neon-sign': { severity:'P0', context:'western', name:'霓虹灯' }
};

function checkTaboo(design) {
  const violations = [];
  const ctx = design.context || 'generic';
  (design.elements || []).forEach(el => {
    const t = TABOO_MAP[el];
    if (t && t.context !== ctx) violations.push({ element:el, name:t.name, severity:t.severity, message:`${t.name}在${ctx}场景禁用` });
  });
  // AI国风感
  let aiScore = 0;
  if (design.saturation > 60) aiScore += 0.3;
  if (design.materials && design.materials.some(m => m.roughness < 0.3)) aiScore += 0.25;
  if (design.lighting && design.lighting.contrastRatio < 2) aiScore += 0.2;
  if (aiScore > 0.7) violations.push({ category:'ai-guofeng', severity:'P0', message:`AI国风感${aiScore.toFixed(2)}>0.7` });
  return { pass: violations.filter(v=>v.severity==='P0').length===0, violations, aiScore };
}

// ========== 主校验函数 ==========
function validate(input) {
  const report = {
    timestamp: new Date().toISOString(),
    scene: input.scene || 'unknown',
    gates: {},
    overall: { pass: true, score: 0, p0Violations: 0, p1Violations: 0 }
  };

  // Gate1: 结构完整性
  report.gates.Gate1 = {
    name: '仓库结构与文档完整性',
    pass: fs.existsSync(path.join(__dirname, '..', 'skill.yaml')) &&
          fs.existsSync(path.join(__dirname, '..', 'README.md')) &&
          fs.existsSync(path.join(__dirname, '..', 'guidelines')),
    checks: ['skill.yaml存在', 'README.md存在', 'guidelines/目录存在']
  };

  // Gate2: 规则完整性
  const requiredRules = ['spatial-order','void-solid','proportion','material','light-shadow','color','motion','time','taboo','interaction'];
  const existingRules = fs.readdirSync(path.join(__dirname, '..', 'guidelines')).map(f => f.replace('.md',''));
  const missingRules = requiredRules.filter(r => !existingRules.includes(r));
  report.gates.Gate2 = {
    name: '模块文件与规则完整性',
    pass: missingRules.length === 0,
    total: requiredRules.length,
    found: existingRules.length,
    missing: missingRules
  };

  // Gate3: 规则算法（如果有输入数据）
  if (input.colors || input.dimensions || input.design) {
    const ruleResults = {};
    if (input.colors) ruleResults.color = checkPalette(input.colors);
    if (input.dimensions) ruleResults.proportion = checkProportion(input.dimensions);
    if (input.voidRatio !== undefined) ruleResults.voidSolid = checkVoidSolid(input.voidRatio);
    if (input.offsetPercent !== undefined) ruleResults.spatial = checkSpatialOrder(input.offsetPercent);
    if (input.design) ruleResults.taboo = checkTaboo(input.design);

    const allViolations = Object.values(ruleResults).flatMap(r => r.violations || []);
    const p0Count = allViolations.filter(v => v.severity === 'P0').length;
    const p1Count = allViolations.filter(v => v.severity === 'P1').length;
    const avgScore = Object.values(ruleResults).reduce((sum, r) => sum + (r.score || (r.pass?100:50)), 0) / Object.keys(ruleResults).length;

    report.gates.Gate3 = {
      name: '规则算法与示例',
      pass: p0Count === 0,
      ruleResults,
      summary: { p0: p0Count, p1: p1Count, avgScore: avgScore.toFixed(1) }
    };
    report.overall.score = Math.round(avgScore);
    report.overall.p0Violations = p0Count;
    report.overall.p1Violations = p1Count;
    report.overall.pass = p0Count === 0;
  } else {
    report.gates.Gate3 = { name: '规则算法与示例', pass: true, note: '无输入数据，跳过规则校验' };
    report.overall.score = report.gates.Gate1.pass && report.gates.Gate2.pass ? 100 : 50;
    report.overall.pass = report.gates.Gate1.pass && report.gates.Gate2.pass;
  }

  return report;
}

// ========== CLI ==========
function main() {
  const args = process.argv.slice(2);
  const sceneIdx = args.indexOf('--scene');
  const inputIdx = args.indexOf('--input');
  const outputIdx = args.indexOf('--output');

  const scene = sceneIdx >= 0 ? args[sceneIdx+1] : 'default';
  const inputFile = inputIdx >= 0 ? args[inputIdx+1] : null;
  const outputFile = outputIdx >= 0 ? args[outputIdx+1] : null;

  let input = { scene };
  if (inputFile && fs.existsSync(inputFile)) {
    input = { ...input, ...JSON.parse(fs.readFileSync(inputFile, 'utf8')) };
  }

  const report = validate(input);

  // 输出
  const output = JSON.stringify(report, null, 2);
  if (outputFile) {
    fs.writeFileSync(outputFile, output);
    console.log(`报告已写入: ${outputFile}`);
  }
  console.log(output);

  // 退出码
  process.exit(report.overall.pass ? 0 : 1);
}

if (require.main === module) main();

module.exports = { validate, checkColor, checkPalette, checkProportion, checkVoidSolid, checkSpatialOrder, checkTaboo };
