/**
 * chinese-aesthetic-skill — 东方空间美学决策引擎
 *
 * 统一入口：导出所有核心引擎和工具函数。
 *
 * 核心引擎：
 * - chineseness    "为什么是中国的"判定引擎（10维评分+结构东方性测试）
 * - clicheDetector 反俗套检测引擎（国潮贴图/古装影视/仿古景区/AI国风）
 * - spatialEngine  空间秩序生成器（中轴/开间/层级/尺度/进深/虚实）
 * - colorEngine    色彩决策器（五方正色+君臣佐使70:20:10）
 * - lightEngine    光影决策器（天光/漏光/侧光/逆光/体积光）
 * - interactionEngine 交互语义映射器（鼠标→云/点击→生长/滚动→下潜）
 * - proportionEngine 比例校验与生成器（√2/三段式/出檐/巨构）
 * - materialEngine 材质决策器（木/石/土/金/纸/雾 PBR参数）
 * - antiAIArtifacts AI生图伪影检测与消除引擎（环状颗粒/塑料油润/数码过拟合）
 *
 * 工具函数：
 * - utils/color  色彩转换（hexToRgb/rgbToHsl/饱和度检测）
 * - utils/math   数学工具（比例计算/区间映射/钳制）
 *
 * @example
 * import { chineseness, clicheDetector, colorEngine } from 'chinese-aesthetic-skill';
 *
 * // 判定一个设计的中国性
 * const result = chineseness.assessChineseness({
 *   voidRatio: 0.65,
 *   colors: ['#E8E4D9', '#2C3E50', '#B8860B'],
 *   brightnessRatio: 4,
 *   buildingToHumanRatio: 10,
 * });
 * console.log(result.score, result.level, result.coreAnswer);
 *
 * // 检测俗套
 * const cliches = clicheDetector.detectCliches({
 *   patternCoverage: 0.25,
 *   colors: ['#FF0000', '#FFD700'],
 * });
 *
 * // 生成配色方案
 * const scheme = colorEngine.generateColorScheme({ preset: 'act0-cloud-gate' });
 */

// 核心引擎 — 先 import 供内部函数使用，再 export
import * as chineseness from './chineseness.js';
import * as clicheDetector from './cliche-detector.js';
import * as spatialEngine from './spatial-engine.js';
import * as colorEngine from './color-engine.js';
import * as lightEngine from './light-engine.js';
import * as interactionEngine from './interaction-engine.js';
import * as proportionEngine from './proportion-engine.js';
import * as materialEngine from './material-engine.js';
import * as antiAIArtifacts from './anti-ai-artifacts.js';
import * as videoMotionEngine from './video-motion-engine.js';

export {
  chineseness,
  clicheDetector,
  spatialEngine,
  colorEngine,
  lightEngine,
  interactionEngine,
  proportionEngine,
  materialEngine,
  antiAIArtifacts,
  videoMotionEngine,
};

// 工具函数
export * as colorUtils from './utils/color.js';
export * as mathUtils from './utils/math.js';
import { clamp } from './utils/math.js';

/**
 * 一站式评估：对一个设计运行所有引擎，返回综合报告
 * @param {Object} design - 完整设计参数
 * @returns {Object} 综合评估报告
 */
export function fullAssessment(design = {}) {
  const results = {};

  // 1. 中国性判定
  results.chineseness = chineseness.assessChineseness(design);

  // 2. 俗套检测
  results.cliches = clicheDetector.detectCliches(design);

  // 3. 色彩校验
  if (design.colors) {
    results.color = colorEngine.validateColorScheme(design.colors, design.colorHierarchy);
  }

  // 4. 比例校验
  results.proportion = proportionEngine.validateProportions(design);

  // 5. 材质校验
  if (design.materials) {
    results.material = materialEngine.validateMaterials(design.materials);
  }

  // 6. 视频动势评估（可选：design.videoParams 存在时启用）
  if (design.videoParams) {
    results.videoMotion = videoMotionEngine.assessVideoMotion(design.videoParams);
  }

  // 综合判定（统一量纲为0-100）
  const allPass = results.chineseness.pass && results.cliches.pass;
  const chinesenessScore = results.chineseness.score; // 0-100
  const clicheScore = (1 - results.cliches.overallScore) * 100; // 俗套越低越好，转0-100
  const colorScore = (results.color?.score ?? 10) * 10; // 0-10转0-100
  const proportionScore = (results.proportion?.score ?? 10) * 10;
  const materialScore = (results.material?.score ?? 10) * 10;

  const overallScore = Math.round(
    chinesenessScore * 0.35 +
    clicheScore * 0.25 +
    colorScore * 0.15 +
    proportionScore * 0.15 +
    materialScore * 0.10
  );

  return {
    overallScore: clamp(overallScore, 0, 100),
    overallPass: allPass,
    level: results.chineseness.level,
    coreAnswer: results.chineseness.coreAnswer,
    engines: results,
    summary: {
      chinesenessScore: results.chineseness.score,
      clicheScore: results.cliches.overallScore,
      p0Violations: results.cliches.p0Count + (results.proportion?.p0Count ?? 0) + (results.material?.p0Count ?? 0),
      weakDimensions: results.chineseness.dimensions.filter(d => d.score < 6).map(d => d.name),
    },
    recommendations: [
      ...results.chineseness.recommendations,
      ...results.cliches.recommendations.map(r => ({
        dimension: `反俗套-${r.clicheName}`,
        weakPoints: r.topIssues,
        action: r.topFixes.join('；'),
      })),
    ],
  };
}

/** 版本信息 */
export const VERSION = '1.0.0';
export const ENGINE_COUNT = 10;
export const DIMENSION_COUNT = 10;

/** 引擎清单 */
export const ENGINES = [
  { name: 'chineseness', description: '"为什么是中国的"判定引擎', core: true },
  { name: 'clicheDetector', description: '反俗套检测引擎（四类俗套）', core: true },
  { name: 'antiAIArtifacts', description: 'AI生图伪影检测与消除引擎（三类伪影）', core: true },
  { name: 'spatialEngine', description: '空间秩序生成器', core: false },
  { name: 'colorEngine', description: '色彩决策器（五方正色+君臣佐使）', core: false },
  { name: 'lightEngine', description: '光影决策器', core: false },
  { name: 'interactionEngine', description: '交互语义映射器', core: false },
  { name: 'proportionEngine', description: '比例校验与生成器', core: false },
  { name: 'materialEngine', description: '材质决策器（PBR参数）', core: false },
  { name: 'videoMotionEngine', description: '视频动势决策引擎（相机运动/剪辑节奏/情绪曲线）', core: false },
];
