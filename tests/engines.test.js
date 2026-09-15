/**
 * lib 引擎集成测试
 * 验证所有8个核心引擎能正常导入和运行
 */
import {
  chineseness,
  clicheDetector,
  spatialEngine,
  colorEngine,
  lightEngine,
  interactionEngine,
  proportionEngine,
  materialEngine,
  fullAssessment,
  VERSION,
  ENGINES,
} from '../lib/index.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function test(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    fn();
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.error(`  ✗ ERROR: ${e.message}`);
  }
}

// ACT0 云海单门测试数据
const act0Design = {
  sceneType: 'gate-act0',
  voidRatio: 0.65,
  colors: ['#E8E4D9', '#2C3E50', '#B8860B', '#1B3A5C'],
  colorHierarchy: { main: 0.45, secondary: 0.20, accent: 0.03, bg: 0.32 },
  brightnessRatio: 4,
  lightAngle: 135,
  buildingToHumanRatio: 10,
  aspectRatio: 1.414,
  hasIncompleteFraming: true,
  hasProgression: true,
  hasScaleAnchor: true,
  hasGodRay: true,
  hasSoftShadow: true,
  darkPartHasColor: true,
  hasPatina: true,
  spatialLayers: 2,
  axisOffsetPercent: 5,
  materials: [
    { type: 'wood', variant: 'sandalwood', areaRatio: 0.15 },
    { type: 'stone', variant: 'bluestone', areaRatio: 0.10 },
    { type: 'volume', variant: 'cloud', areaRatio: 0.65 },
    { type: 'metal', variant: 'dull-gold', areaRatio: 0.03 },
  ],
  animations: [
    { type: 'cloud', duration: 5000, easing: 'ease-in-out' },
    { type: 'fog', duration: 8000, easing: 'ease-in-out' },
  ],
  hasBreathingMotion: true,
  interactions: [
    { trigger: 'mousemove', effect: 'cloud-disturb' },
    { trigger: 'click', effect: 'moss-grow' },
    { trigger: 'scroll', effect: 'dive-swirl' },
  ],
  hasProgressiveReveal: true,
  hasResponsiveBreath: true,
  sceneElementInteraction: true,
};

// 俗套测试数据
const clicheDesign = {
  patternCoverage: 0.25,
  hasBrushTitle: true,
  colors: ['#FF0000', '#FFD700'],
  hasPatternBorder: true,
  elements: [
    { type: 'person', faceDirection: 'front', areaRatio: 0.15, detailRatio: 0.5, costume: 'ornate' },
    { type: 'building', detailRatio: 0.4, isBlockSilhouette: false, isCropped: false },
  ],
  brightnessRatio: 1.5,
  hasDramaticLighting: true,
  materials: [{ roughness: 0.2, metalness: 0.05 }],
  hasBounceParticles: true,
};

console.log('═══════════════════════════════════════════');
console.log('  Chinese Aesthetic Skill — Engine Tests');
console.log(`  Version: ${VERSION} | Engines: ${ENGINES.length}`);
console.log('═══════════════════════════════════════════');

// 1. 中国性判定引擎
test('1. chineseness — 中国性判定引擎', () => {
  const result = chineseness.assessChineseness(act0Design);
  assert(typeof result.score === 'number', 'score 是数字');
  assert(result.score >= 0 && result.score <= 100, `score 在0-100范围内 (${result.score})`);
  assert(typeof result.level === 'string', 'level 是字符串');
  assert(Array.isArray(result.dimensions), 'dimensions 是数组');
  assert(result.dimensions.length === 10, `dimensions 有10个 (${result.dimensions.length})`);
  assert(typeof result.coreAnswer === 'string', 'coreAnswer 是字符串');
  assert(result.coreAnswer.length > 10, 'coreAnswer 有实质内容');
  assert(result.structuralEasternnessTest, '有结构东方性测试');
  assert(typeof result.structuralEasternnessTest.score === 'number', '结构测试有分数');
  console.log(`  ACT0 中国性评分: ${result.score}/100 (${result.level})`);
  console.log(`  核心回答: ${result.coreAnswer.substring(0, 80)}...`);
});

// 2. 反俗套检测引擎
test('2. clicheDetector — 反俗套检测引擎', () => {
  // 测试俗套设计
  const badResult = clicheDetector.detectCliches(clicheDesign);
  assert(typeof badResult.overallScore === 'number', 'overallScore 是数字');
  assert(badResult.overallScore > 0.3, `俗套设计得分>0.3 (${badResult.overallScore})`);
  assert(badResult.clicheTypes.length > 0, `检测到俗套类型 (${badResult.clicheTypes.join(',')})`);
  assert(Array.isArray(badResult.violations), 'violations 是数组');
  assert(badResult.violations.length > 0, '有违规项');

  // 测试好设计
  const goodResult = clicheDetector.detectCliches(act0Design);
  assert(goodResult.overallScore < badResult.overallScore, '好设计俗套分低于坏设计');
  console.log(`  俗套设计得分: ${badResult.overallScore.toFixed(2)} (类型: ${badResult.clicheTypes.join(',')})`);
  console.log(`  ACT0 设计得分: ${goodResult.overallScore.toFixed(2)}`);
});

// 3. 空间秩序生成器
test('3. spatialEngine — 空间秩序生成器', () => {
  const result = spatialEngine.generateSpatialOrder({ sceneType: 'gate-act0', width: 1920, height: 1080 });
  assert(result.axis, '有中轴配置');
  assert(result.baySystem, '有开间系统');
  assert(result.layers, '有空间层级');
  assert(result.scale, '有尺度比例');
  assert(result.voidSolid, '有虚实分配');
  assert(result.framing, '有不完整入画配置');
  assert(typeof result.layoutSummary === 'string', '有布局摘要');
  console.log(`  中轴模式: ${result.axis.mode} (x=${result.axis.x}, 偏移${result.axis.offsetPercent.toFixed(1)}%)`);
  console.log(`  开间: ${result.baySystem.bayCount}间 (明间${result.baySystem.mingBayWidth.toFixed(0)}px)`);
  console.log(`  留白: ${(result.voidSolid.voidRatio * 100).toFixed(0)}% (${result.voidSolid.voidLevel})`);
});

// 4. 色彩决策器
test('4. colorEngine — 色彩决策器', () => {
  const scheme = colorEngine.generateColorScheme({ preset: 'act0-cloud-gate' });
  assert(scheme.colors, '有颜色配置');
  assert(scheme.colors.main, '有主色');
  assert(scheme.colors.secondary, '有辅色');
  assert(scheme.colors.accent, '有点缀色');
  assert(scheme.ratio, '有君臣佐使比例');
  assert(scheme.validation, '有校验结果');
  assert(Array.isArray(scheme.palette), 'palette 是数组');
  assert(scheme.palette.length === 4, 'palette 有4个颜色');

  // 校验俗套配色
  const badValidation = colorEngine.validateColorScheme(['#FF0000', '#FFD700'], { accent: 0.3 });
  assert(badValidation.p0Count > 0, '正红亮金配色有P0违规');
  assert(!badValidation.pass, '俗套配色不通过');

  console.log(`  ACT0 配色: 主=${scheme.colors.main.hex} 辅=${scheme.colors.secondary.hex} 点=${scheme.colors.accent.hex}`);
  console.log(`  君臣佐使: ${scheme.ratio.description}`);
  console.log(`  配色校验: ${scheme.validation.pass ? 'PASS' : 'FAIL'} (score=${scheme.validation.score})`);
});

// 5. 光影决策器
test('5. lightEngine — 光影决策器', () => {
  const result = lightEngine.generateLighting({ time: 'dusk', sceneType: 'landscape', hasClouds: true });
  assert(result.keyLight, '有主光源');
  assert(result.ambientLight, '有环境光');
  assert(result.shadows, '有阴影方案');
  assert(result.godRay, '有体积光（因为有云）');
  assert(result.darkPart, '有暗部颜色');
  assert(result.brightnessRatio, '有明暗比');
  assert(result.threeJsConfig, '有Three.js配置');
  assert(result.validation, '有校验结果');
  console.log(`  时间: ${result.timeName} (${result.mood})`);
  console.log(`  主光源: ${result.keyLight.typeName} (角度${result.keyLight.angle}°, 强度${result.keyLight.intensity})`);
  console.log(`  明暗比: ${result.brightnessRatio}:1`);
  console.log(`  体积光: ${result.godRay ? '已启用' : '未启用'}`);
});

// 6. 交互语义映射器
test('6. interactionEngine — 交互语义映射器', () => {
  const moveResult = interactionEngine.mapInteraction('mousemove', { triggerZone: 'cloud-mask' });
  assert(moveResult.easternIntent, '有东方意象');
  assert(moveResult.selectedEffect, '有选中效果');
  assert(moveResult.animationParams, '有动画参数');
  assert(moveResult.implementation, '有实现代码');

  const clickResult = interactionEngine.mapInteraction('click', { triggerZone: 'ground-mask', currentState: 'idle' });
  assert(clickResult.fsmTransition, '有FSM状态转换');
  assert(clickResult.fsmTransition.from === 'idle', '从idle状态转换');

  const scrollResult = interactionEngine.mapInteraction('scroll', {});
  assert(scrollResult.easternIntent.includes('下潜') || scrollResult.easternIntent.includes('云雾'), '滚动有下潜/云雾意象');

  const fsm = interactionEngine.getFSM();
  assert(fsm.initialState === 'idle', 'FSM初始状态是idle');
  assert(Object.keys(fsm.states).length >= 5, `FSM有≥5个状态 (${Object.keys(fsm.states).length})`);

  console.log(`  鼠标移动 → ${moveResult.easternIntent}`);
  console.log(`  点击 → ${clickResult.easternIntent} (FSM: ${clickResult.fsmTransition?.from}→${clickResult.fsmTransition?.to})`);
  console.log(`  滚动 → ${scrollResult.easternIntent}`);
  console.log(`  FSM状态: ${Object.keys(fsm.states).join(' → ')}`);
});

// 7. 比例校验与生成器
test('7. proportionEngine — 比例校验与生成器', () => {
  // 好比例
  const goodResult = proportionEngine.validateProportions({
    width: 34, depth: 17, height: 13.6,
    eave: 2, columnHeight: 5,
    buildingHeight: 17, humanHeight: 1.7,
    humanArea: 0.03, totalArea: 1,
    voidRatio: 0.65,
    threePart: { base: 1, body: 2, roof: 1.5 },
  });
  assert(goodResult.results['width-depth'], '有面阔进深校验');
  assert(goodResult.results['building-human'], '有巨构尺度校验');
  assert(goodResult.results['void-ratio'], '有留白校验');
  assert(goodResult.results['void-ratio'].valid, '留白65%通过');

  // 坏比例
  const badResult = proportionEngine.validateProportions({
    width: 10, depth: 10, height: 15,
    buildingHeight: 3, humanHeight: 1.7,
    voidRatio: 0.20,
  });
  assert(!badResult.pass || badResult.score < 8, '坏比例不通过或低分');
  assert(badResult.violations.length > 0, '坏比例有违规');

  // 推荐比例
  const recommended = proportionEngine.generateRecommendedProportions('act0-cloud-gate');
  assert(recommended.widthDepth === 1.414, 'ACT0推荐√2比例');
  assert(recommended.voidRatio === 0.65, 'ACT0推荐65%留白');

  console.log(`  好比例得分: ${goodResult.score}/10 (P0=${goodResult.p0Count}, P1=${goodResult.p1Count})`);
  console.log(`  坏比例得分: ${badResult.score}/10 (违规${badResult.violations.length}项)`);
  console.log(`  ACT0推荐: 面阔:进深=${recommended.widthDepth}, 留白=${recommended.voidRatio * 100}%, 巨构=${recommended.buildingHuman}:1`);
});

// 8. 材质决策器
test('8. materialEngine — 材质决策器', () => {
  const wood = materialEngine.generateMaterial('wood', { variant: 'sandalwood', weathering: 0.4 });
  assert(wood.pbr.color, '木材质有颜色');
  assert(wood.pbr.roughness >= 0.5, `木材质粗糙度≥0.5 (${wood.pbr.roughness})`);
  assert(wood.hasPatina, '风化0.4有包浆');
  assert(wood.threeJsCode, '有Three.js代码');

  const stone = materialEngine.generateMaterial('stone', { variant: 'bluestone', weathering: 0.5 });
  assert(stone.pbr.roughness >= 0.8, `青石板粗糙度≥0.8 (${stone.pbr.roughness})`);
  assert(stone.patinaType === '苔藓', '青石板风化有苔藓');

  const gold = materialEngine.generateMaterial('metal', { variant: 'dull-gold' });
  assert(gold.maxArea === 0.10, '哑金最大面积10%');
  assert(gold.note, '哑金有使用说明');

  // 材质校验
  const materials = [
    { type: 'wood', pbr: { roughness: 0.6, metalness: 0 }, areaRatio: 0.15 },
    { type: 'stone', pbr: { roughness: 0.9, metalness: 0 }, areaRatio: 0.10 },
    { type: 'volume', pbr: { roughness: 1.0, metalness: 0 }, areaRatio: 0.65 },
    { type: 'metal', variant: 'dull-gold', pbr: { roughness: 0.45, metalness: 0.8 }, areaRatio: 0.03, weathering: 0.3 },
  ];
  const validation = materialEngine.validateMaterials(materials);
  assert(validation.avgRoughness >= 0.5, `平均粗糙度≥0.5 (${validation.avgRoughness.toFixed(2)})`);
  assert(validation.naturalRatio >= 0.7, `天然材料≥70% (${(validation.naturalRatio * 100).toFixed(0)}%)`);

  console.log(`  檀木: ${wood.pbr.color} roughness=${wood.pbr.roughness.toFixed(2)} ${wood.hasPatina ? '(有包浆)' : ''}`);
  console.log(`  青石板: ${stone.pbr.color} roughness=${stone.pbr.roughness.toFixed(2)} (${stone.patinaType})`);
  console.log(`  哑金: ${gold.pbr.color} 最大面积${gold.maxArea * 100}%`);
  console.log(`  材质校验: ${validation.pass ? 'PASS' : 'FAIL'} (avgR=${validation.avgRoughness.toFixed(2)}, natural=${(validation.naturalRatio * 100).toFixed(0)}%)`);
});

// 9. 一站式评估
test('9. fullAssessment — 一站式综合评估', () => {
  const result = fullAssessment(act0Design);
  assert(typeof result.overallScore === 'number', 'overallScore 是数字');
  assert(result.overallScore >= 0 && result.overallScore <= 100, 'overallScore 在0-100');
  assert(result.engines, '有各引擎结果');
  assert(result.engines.chineseness, '有中国性结果');
  assert(result.engines.cliches, '有俗套结果');
  assert(result.summary, '有摘要');
  assert(Array.isArray(result.recommendations), '有改进建议');
  console.log(`  ACT0 综合评分: ${result.overallScore}/100 (${result.level})`);
  console.log(`  中国性: ${result.summary.chinesenessScore}/100 | 俗套: ${result.summary.clicheScore.toFixed(2)}`);
  console.log(`  P0违规: ${result.summary.p0Violations} | 薄弱维度: ${result.summary.weakDimensions.join(',') || '无'}`);
  console.log(`  核心回答: ${result.coreAnswer.substring(0, 100)}...`);
});

// 总结
console.log('\n═══════════════════════════════════════════');
console.log(`  测试结果: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════');

if (failures.length > 0) {
  console.log('\n失败详情:');
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  process.exit(1);
} else {
  console.log('\n  ✓ 所有引擎测试通过！');
  process.exit(0);
}
