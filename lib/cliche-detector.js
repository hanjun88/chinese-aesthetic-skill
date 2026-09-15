/**
 * cliche-detector.js — 反俗套自动检测引擎
 *
 * 检测四类俗套：
 * 1. 国潮贴图感 — 传统纹样满铺+毛笔字大标题+正红亮金撞色
 * 2. 古装影视感 — 人物正面特写+华丽服饰+戏剧化打光
 * 3. 仿古景区感 — 建筑细节堆砌+均匀亮度+导游牌式排版
 * 4. AI国风感 — 高饱和+塑料光滑材质+均匀打光+弹跳粒子特效
 *
 * 每类俗套有独立的多维度检测算法，输出俗套类型+评分+具体违规项+修复建议。
 */

import { hexToHsl, isHighSaturation, isPureRed, isBrightGold, avgSaturation, avgLightness } from './utils/color.js';
import { clamp } from './utils/math.js';

/**
 * 主入口：检测设计中的所有俗套
 * @param {Object} design - 设计参数
 * @returns {Object} 检测结果
 */
export function detectCliches(design = {}) {
  const results = {
    guochao: detectGuochaoTietu(design),
    guzhuang: detectGuzhuangYingshi(design),
    fanggu: detectFangguJingqu(design),
    aiGuofeng: detectAiGuofeng(design),
  };

  const allViolations = [];
  let totalScore = 0;
  for (const [type, result] of Object.entries(results)) {
    allViolations.push(...result.violations);
    totalScore += result.score * result.weight;
  }
  totalScore = Math.min(1, totalScore);

  const p0Count = allViolations.filter(v => v.severity === 'P0').length;
  const p1Count = allViolations.filter(v => v.severity === 'P1').length;

  return {
    overallScore: totalScore,
    pass: p0Count === 0,
    p0Count,
    p1Count,
    clicheTypes: Object.entries(results).filter(([, r]) => r.detected).map(([type]) => type),
    details: results,
    violations: allViolations,
    recommendations: generateRecommendations(results),
  };
}

/* ==================== 1. 国潮贴图感 ==================== */

function detectGuochaoTietu(design) {
  const violations = [];
  let score = 0;

  // 检测1：传统纹样满铺（>20%）
  const patternCoverage = design.patternCoverage ?? 0;
  if (patternCoverage > 0.20) {
    violations.push({
      rule: 'pattern-overuse',
      severity: 'P0',
      message: `传统纹样占比 ${(patternCoverage * 100).toFixed(0)}% > 20% — 祥云/回纹满铺=国潮背景图`,
      fix: '纹样占比降到5%以下，仅用于服饰细节或边角装饰，不做背景/边框',
    });
    score += 0.35;
  }

  // 检测2：毛笔字大标题
  if (design.hasBrushTitle) {
    violations.push({
      rule: 'brush-title',
      severity: 'P1',
      message: '毛笔字大标题 — 国潮标配，用多了就俗',
      fix: '标题用宋体/黑体/细黑体，毛笔字仅在≤5%面积的点缀位置使用',
    });
    score += 0.15;
  }

  // 检测3：正红+亮金撞色
  const colors = design.colors || [];
  const hasPureRed = colors.some(c => isPureRed(c));
  const hasBrightGold = colors.some(c => isBrightGold(c));
  if (hasPureRed && hasBrightGold) {
    violations.push({
      rule: 'red-gold-clash',
      severity: 'P0',
      message: '正红#FF0000 + 亮金#FFD700 撞色 — 春节对联/淘宝年货节感',
      fix: '用暗朱砂#8B2500替代正红，用哑金#B8860B替代亮金，金色面积≤10%',
    });
    score += 0.30;
  } else if (hasPureRed || hasBrightGold) {
    violations.push({
      rule: 'pure-color',
      severity: 'P1',
      message: hasPureRed ? '使用正红#FF0000' : '使用亮金#FFD700',
      fix: hasPureRed ? '用暗朱砂#8B2500替代' : '用哑金#B8860B替代',
    });
    score += 0.10;
  }

  // 检测4：回纹边框/祥云边框
  if (design.hasPatternBorder) {
    violations.push({
      rule: 'pattern-border',
      severity: 'P0',
      message: '回纹/祥云做边框 — 仿古包装盒/月饼盒感',
      fix: '去掉纹样边框，用留白或细线分隔，纹样只做局部装饰',
    });
    score += 0.20;
  }

  return {
    name: '国潮贴图感',
    detected: score >= 0.3,
    score: clamp(score, 0, 1),
    weight: 0.3,
    violations,
  };
}

/* ==================== 2. 古装影视感 ==================== */

function detectGuzhuangYingshi(design) {
  const violations = [];
  let score = 0;

  const people = (design.elements || []).filter(e => e.type === 'person');

  // 检测1：人物正面特写（>10%画面）
  const frontFaceCloseup = people.find(p =>
    p.faceDirection === 'front' && (p.areaRatio || 0) > 0.10
  );
  if (frontFaceCloseup) {
    violations.push({
      rule: 'front-face-closeup',
      severity: 'P0',
      message: `人物正面特写占画面 ${(frontFaceCloseup.areaRatio * 100).toFixed(0)}% > 10% — 电视剧海报感`,
      fix: '人物用背影/侧面/剪影，占画面≤5%，放在建筑前做尺度锚点',
    });
    score += 0.35;
  }

  // 检测2：人物占比过大（>15%）
  const largePerson = people.find(p => (p.areaRatio || 0) > 0.15);
  if (largePerson && !frontFaceCloseup) {
    violations.push({
      rule: 'person-too-large',
      severity: 'P1',
      message: `人物占画面 ${(largePerson.areaRatio * 100).toFixed(0)}% > 15% — 人像插画感`,
      fix: '人物缩小到≤5%，用背影/侧面，做尺度参照物不是主体',
    });
    score += 0.20;
  }

  // 检测3：戏剧化打光（正面柔光+伦勃朗光）
  if (design.hasDramaticLighting) {
    violations.push({
      rule: 'dramatic-lighting',
      severity: 'P1',
      message: '戏剧化打光（正面柔光/伦勃朗光）— 影视海报/写真感',
      fix: '用逆光/侧逆光做轮廓光，人物在阴影里，靠轮廓线而不是面部表情',
    });
    score += 0.15;
  }

  // 检测4：华丽服饰细节
  const ornateCostume = people.find(p => p.detailRatio > 0.4 && p.costume === 'ornate');
  if (ornateCostume) {
    violations.push({
      rule: 'ornate-costume',
      severity: 'P1',
      message: '人物服饰细节过多（>40%）— 古装剧定妆照感',
      fix: '人物用块面剪影，不刻画服饰细节，远看是一个人形轮廓',
    });
    score += 0.15;
  }

  return {
    name: '古装影视感',
    detected: score >= 0.3,
    score: clamp(score, 0, 1),
    weight: 0.2,
    violations,
  };
}

/* ==================== 3. 仿古景区感 ==================== */

function detectFangguJingqu(design) {
  const violations = [];
  let score = 0;

  const buildings = (design.elements || []).filter(e => e.type === 'building');

  // 检测1：建筑细节堆砌（>30%且非块面剪影）
  const detailedBuilding = buildings.find(b =>
    (b.detailRatio || 0) > 0.30 && !b.isBlockSilhouette
  );
  if (detailedBuilding) {
    violations.push({
      rule: 'building-detail-overload',
      severity: 'P0',
      message: `建筑细节占比 ${(detailedBuilding.detailRatio * 100).toFixed(0)}% > 30%，非块面剪影 — 景区效果图/仿古街感`,
      fix: '建筑用块面剪影表现，细节≤10%，靠轮廓和比例而不是斗拱雕花',
    });
    score += 0.35;
  }

  // 检测2：均匀亮度（明暗比<2:1）
  const brightnessRatio = design.brightnessRatio ?? 1.5;
  if (brightnessRatio < 2) {
    violations.push({
      rule: 'flat-lighting',
      severity: 'P1',
      message: `明暗比 ${brightnessRatio.toFixed(1)}:1 < 2:1 — 均匀打光=景区宣传照/正午顶光`,
      fix: '明暗比拉到3:1以上，用逆光/侧光，出檐下形成深阴影',
    });
    score += 0.20;
  }

  // 检测3：完整建筑入画（无边缘裁切）
  const allBuildingsComplete = buildings.length > 0 && buildings.every(b => !b.isCropped);
  if (allBuildingsComplete && buildings.length > 0) {
    violations.push({
      rule: 'complete-building',
      severity: 'P1',
      message: '所有建筑完整入画 — 旅游纪念照/景区导览图感',
      fix: '至少一个建筑被画面边缘裁切10-30%，暗示它比画面更大',
    });
    score += 0.15;
  }

  // 检测4：导游牌式排版（标题+副标题+说明文字居中堆叠）
  if (design.hasGuidebookLayout) {
    violations.push({
      rule: 'guidebook-layout',
      severity: 'P1',
      message: '导游牌式排版（标题+副标题+说明居中堆叠）— 景区介绍牌感',
      fix: '文字左对齐或放在角落，字号对比≥3:1，减少文字层级',
    });
    score += 0.15;
  }

  return {
    name: '仿古景区感',
    detected: score >= 0.3,
    score: clamp(score, 0, 1),
    weight: 0.2,
    violations,
  };
}

/* ==================== 4. AI国风感 ==================== */

function detectAiGuofeng(design) {
  const violations = [];
  let score = 0;
  const colors = design.colors || [];
  const materials = design.materials || [];

  // 检测1：高饱和（平均饱和度>60%）
  const avgSat = avgSaturation(colors);
  if (avgSat > 0.60) {
    violations.push({
      rule: 'high-saturation',
      severity: 'P0',
      message: `平均饱和度 ${(avgSat * 100).toFixed(0)}% > 60% — AI生成图标配高饱和`,
      fix: '平均饱和度降到50%以下，深色可保留高饱和但亮色必须低饱和',
    });
    score += 0.30;
  }

  // 检测2：塑料感材质（roughness<0.3且metalness<0.1）
  const plasticMaterials = materials.filter(m => (m.roughness ?? 0.5) < 0.3 && (m.metalness ?? 0) < 0.1);
  if (plasticMaterials.length > 0) {
    violations.push({
      rule: 'plastic-material',
      severity: 'P0',
      message: `${plasticMaterials.length}个塑料感材质（roughness<0.3且metalness<0.1）— AI生成图光滑塑料感`,
      fix: '所有材质roughness≥0.5，木0.6/石0.9/金属0.3-0.4，去掉光滑塑料感',
    });
    score += 0.25;
  }

  // 检测3：均匀打光（明暗比<2:1）
  const brightnessRatio = design.brightnessRatio ?? 1.5;
  if (brightnessRatio < 2) {
    violations.push({
      rule: 'flat-ai-lighting',
      severity: 'P1',
      message: `明暗比 ${brightnessRatio.toFixed(1)}:1 < 2:1 — AI生成图均匀打光无层次`,
      fix: '明暗比拉到3:1以上，用单一光源（逆光/侧光），不要多光源均匀补光',
    });
    score += 0.20;
  }

  // 检测4：弹跳粒子特效
  if (design.hasBounceParticles) {
    violations.push({
      rule: 'bounce-particles',
      severity: 'P1',
      message: '弹跳粒子特效（bounce/elastic缓动）— AI动效模板标配',
      fix: '粒子用缓慢漂浮（duration≥3s，ease-in-out），不用bounce/elastic，粒子数量≤100',
    });
    score += 0.15;
  }

  // 检测5：元素堆砌（>5个主要元素）
  const mainElements = (design.elements || []).filter(e => e.isMain);
  if (mainElements.length > 5) {
    violations.push({
      rule: 'element-overload',
      severity: 'P1',
      message: `${mainElements.length}个主要元素 > 5 — AI生成图什么都往里塞`,
      fix: '主要元素≤3个，其余做背景/氛围，少即是多',
    });
    score += 0.10;
  }

  // 综合判定：三项命中=AI国风感
  const hitCount = [avgSat > 0.60, plasticMaterials.length > 0, brightnessRatio < 2, design.hasBounceParticles, mainElements.length > 5].filter(Boolean).length;
  if (hitCount >= 3) {
    score = Math.max(score, 0.7);
  }

  return {
    name: 'AI国风感',
    detected: score >= 0.5 || hitCount >= 3,
    score: clamp(score, 0, 1),
    weight: 0.3,
    violations,
    hitCount,
  };
}

/* ==================== 修复建议 ==================== */

function generateRecommendations(results) {
  const recs = [];
  for (const [type, result] of Object.entries(results)) {
    if (result.detected) {
      const topViolations = result.violations.slice(0, 2);
      recs.push({
        clicheType: type,
        clicheName: result.name,
        score: result.score,
        topIssues: topViolations.map(v => v.message),
        topFixes: topViolations.map(v => v.fix),
      });
    }
  }
  return recs;
}
