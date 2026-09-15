/**
 * video-motion-engine.js — 视频动势决策引擎
 *
 * 基于 case_01_user_upload.mp4 视频蒸馏的实证参数（ffmpeg/ffprobe/OpenCV 实测），
 * 评估、生成与推荐视频/动画的动势方案：
 *
 * - 相机运动合理性：pan_left 持续横摇作为空间揭示机制（dx≈-1.33 px/帧）
 * - 镜头节奏：平均镜头 3-5s 稳定 + 末尾加速（2.9s→1.1s），约 2.7 拍/镜头
 * - 音画同步：BPM 60-90（实证 70.5），呼吸式剪辑韵律
 * - 色彩动态：100% 暖金/琥珀调，亮度/饱和度突变标记情绪节拍（60%/80% 高潮点）
 * - 视差纵深：中心-边缘运动差 >1.5 创造空间纵深（实证 max=2.69）
 * - 情绪曲线：6 段式（awe→reverence→connection→journey→elevation→culmination）
 *
 * 所有阈值来自 VIDEO_ANALYSIS_DATA.md，禁止凭空编造。
 *
 * @example
 * import { assessVideoMotion, generateMotionPreset, EMOTION_CURVE_TEMPLATE } from './video-motion-engine.js';
 *
 * const report = assessVideoMotion({
 *   avgShotDurationSec: 3.87, bpm: 70.5, motionMagnitudeMean: 3.88,
 *   parallaxMax: 2.69, colorTempWarmRatio: 1.0, brightnessStd: 12.0,
 * });
 */

import { clamp } from './utils/math.js';

/* ==========================================================================
 * 常量导出
 * ========================================================================== */

/**
 * 动势阈值（实证：case_01 视频 motionMagnitude mean=3.88, max=8.64）
 * - flow: 流动感区间 2-5（持续可感知的二次运动）
 * - climax: 高潮动势 >6（抬手/飞升瞬间的视觉峰值）
 * - static: 静止 <1（冥思/对视/留白凝视）
 */
export const MOTION_THRESHOLDS = Object.freeze({
  flowMin: 2,
  flowMax: 5,
  climaxMin: 6,
  staticMax: 1,
  /** 中心-边缘视差差（实证 max=2.694），>1.5 视为有纵深 */
  parallaxDepthMin: 1.5,
  /** 平均镜头时长中式呼吸区间（实证 mean=3.87s） */
  shotDurationMin: 3,
  shotDurationMax: 5,
  /** 中式冥想/史诗配乐 BPM 区间（实证 70.5） */
  bpmMin: 60,
  bpmMax: 90,
  /** 暖金调占比下限（实证 99/99 帧 warm = 1.0） */
  warmRatioMin: 0.8,
});

/**
 * 中式视频推荐参数范围（全部来自实证数据）
 */
export const CHINESE_VIDEO_PARAMS = Object.freeze({
  durationSec: { min: 20, sweet: 24, max: 30, note: '实证 24.684s 六段式情绪弧光' },
  fps: { min: 24, sweet: 60, max: 60, note: '实证 60fps 保证横摇顺滑' },
  resolution: { sweet: '3840x2148', note: '4K 云海与衣袂细节' },
  cameraMotion: {
    primary: 'pan_left',
    dxRange: [-2.0, -1.0],
    dyRange: [-0.2, 0.2],
    dxMean: -1.33,
    easing: 'ease-in-out',
    note: '缓慢横摇(pan)逐步揭示空间，对应中式"游园"动线',
  },
  avgShotDurationSec: { min: 3, sweet: 3.87, max: 5, note: '前6镜头稳定~4s，末两镜头加速 2.9→1.1' },
  transitionType: 'hard-cut',
  bpm: { min: 60, sweet: 70.5, max: 90, note: '慢速氛围/史诗管弦/空灵女声' },
  beatsPerShot: { min: 2.4, sweet: 2.7, max: 3.0, note: '70.5 BPM × 3.87s ≈ 2.7 拍/镜头' },
  motionMagnitude: { min: 2, sweet: 3.88, max: 5, climax: 8.64 },
  parallaxMax: { min: 1.5, sweet: 2.69, note: '中心-边缘运动差，中等视差' },
  colorTempWarmRatio: { min: 0.8, sweet: 1.0, note: '暖金/琥珀为主，青绿朱红点缀' },
  brightness: { mean: 145.8, std: 12.0, range: [123.3, 180.4] },
  saturation: { mean: 72.7, range: [46.5, 104.8] },
  emotionPeakPct: [60, 80],
});

/**
 * 6 段式情绪曲线模板（实证空间叙事线）
 * 高潮点落在 60%（elevation 抬手）与 80%（culmination 走向金门）位置。
 */
export const EMOTION_CURVE_TEMPLATE = Object.freeze([
  {
    name: 'awe',
    zhName: '敬畏揭示',
    startPct: 0,
    endPct: 17,
    brightnessPeak: false,
    motionLevel: 'high',
    note: '侧面观察：人物+凤凰壁画+悬浮宫殿，建立动态惊叹',
  },
  {
    name: 'reverence',
    zhName: '崇敬仰视',
    startPct: 17,
    endPct: 33,
    brightnessPeak: false,
    motionLevel: 'low',
    note: '仰视宫殿大门（凤凰徽记），相对静止以显崇高',
  },
  {
    name: 'connection',
    zhName: '对视连接',
    startPct: 33,
    endPct: 50,
    brightnessPeak: false,
    motionLevel: 'low',
    note: '两人对视，凤凰居中，关系建立',
  },
  {
    name: 'journey',
    zhName: '背后旅程',
    startPct: 50,
    endPct: 67,
    brightnessPeak: false,
    motionLevel: 'mid',
    note: '背后视角：人物面向巨大宫殿，孤独旅程开始',
  },
  {
    name: 'elevation',
    zhName: '抬手升华',
    startPct: 67,
    endPct: 83,
    brightnessPeak: true,
    motionLevel: 'high',
    note: '人物抬手，亮度Δ=30.7，精神升华第一高潮（60%位置）',
  },
  {
    name: 'culmination',
    zhName: '走向金门抵达',
    startPct: 83,
    endPct: 100,
    brightnessPeak: true,
    motionLevel: 'high',
    note: '走向金色大门，亮度Δ=17.3/饱和Δ=29.3，时间终章（80%位置）',
  },
]);

/* ==========================================================================
 * 6 个动势参数预设（基于实证 6 段空间叙事线）
 * ========================================================================== */

const MOTION_PRESETS = Object.freeze({
  /** 0-4s 侧面观察，高运动建立动态惊叹 */
  'majestic-reveal': {
    cameraMotion: 'pan_left',
    shotDurationSec: 4.2,
    motionMagnitude: 5.5,
    brightness: 145,
    saturation: 70,
    warmRatio: 0.95,
    emotion: 'awe',
    bpm: 70.5,
    dxRange: [-2.0, -1.5],
    dyRange: [-0.1, 0.1],
    easing: 'ease-in-out',
    note: '侧观人物+凤凰壁画+悬浮宫殿，云海初涌',
  },
  /** 4-8s 仰视宫殿，运动收敛显崇高 */
  'reverence': {
    cameraMotion: 'tilt_up',
    shotDurationSec: 3.4,
    motionMagnitude: 1.5,
    brightness: 140,
    saturation: 65,
    warmRatio: 0.95,
    emotion: 'reverence',
    bpm: 70.5,
    dxRange: [-0.3, 0.3],
    dyRange: [0.0, 0.3],
    easing: 'ease-out',
    note: '仰视宫殿大门凤凰徽记，低运动显崇高',
  },
  /** 8-12s 两人对视，几乎静止的凝视 */
  'connection': {
    cameraMotion: 'static',
    shotDurationSec: 4.6,
    motionMagnitude: 0.8,
    brightness: 148,
    saturation: 72,
    warmRatio: 0.95,
    emotion: 'connection',
    bpm: 70.5,
    dxRange: [0.0, 0.0],
    dyRange: [0.0, 0.0],
    easing: 'none',
    note: '对视镜头，仅衣袂/瞳孔微运动',
  },
  /** 12-17s 背后视角，跟拍人物走向宫殿 */
  'journey': {
    cameraMotion: 'dolly_back',
    shotDurationSec: 4.2,
    motionMagnitude: 3.5,
    brightness: 150,
    saturation: 75,
    warmRatio: 0.95,
    emotion: 'journey',
    bpm: 70.5,
    dxRange: [-0.8, -0.4],
    dyRange: [0.0, 0.1],
    easing: 'ease-in-out',
    note: '背后视角，亮度Δ=23.2 标记情绪转换',
  },
  /** 17-21s 抬手升华，亮度第一高潮 */
  'elevation': {
    cameraMotion: 'slow_zoom_in',
    shotDurationSec: 4.2,
    motionMagnitude: 4.5,
    brightness: 178,
    saturation: 95,
    warmRatio: 1.0,
    emotion: 'elevation',
    bpm: 78,
    dxRange: [-0.3, 0.3],
    dyRange: [0.1, 0.3],
    easing: 'ease-out',
    note: '抬手瞬间，亮度Δ=30.7，精神升华第一高潮',
  },
  /** 21-24s 走向金门，末段加速收束 */
  'culmination': {
    cameraMotion: 'dolly_forward',
    shotDurationSec: 2.9,
    motionMagnitude: 6.5,
    brightness: 180,
    saturation: 100,
    warmRatio: 1.0,
    emotion: 'culmination',
    bpm: 90,
    dxRange: [0.0, 0.4],
    dyRange: [0.0, 0.2],
    easing: 'ease-in',
    note: '走向金色大门，末镜头 1.1s 加速收束，时间终章',
  },
});

/**
 * 情绪 → 相机运动推荐表（按场景微调）
 */
const CAMERA_RECOMMENDATIONS = Object.freeze({
  awe: {
    palace: { type: 'pan_left', dxRange: [-2.0, -1.0], dyRange: [0.0, 0.1], motionMagnitude: 5, easing: 'ease-in-out' },
    'cloud-sea': { type: 'pan_left', dxRange: [-1.8, -1.0], dyRange: [-0.1, 0.1], motionMagnitude: 4.5, easing: 'ease-in-out' },
    figure: { type: 'pan_left', dxRange: [-1.5, -1.0], dyRange: [0.0, 0.1], motionMagnitude: 4, easing: 'ease-in-out' },
    gate: { type: 'pan_left', dxRange: [-1.5, -0.8], dyRange: [0.0, 0.1], motionMagnitude: 4, easing: 'ease-in-out' },
  },
  reverence: {
    palace: { type: 'tilt_up', dxRange: [-0.2, 0.2], dyRange: [0.1, 0.4], motionMagnitude: 1.5, easing: 'ease-out' },
    'cloud-sea': { type: 'tilt_up', dxRange: [0.0, 0.0], dyRange: [0.2, 0.4], motionMagnitude: 1.2, easing: 'ease-out' },
    figure: { type: 'tilt_up', dxRange: [-0.1, 0.1], dyRange: [0.1, 0.3], motionMagnitude: 1.0, easing: 'ease-out' },
    gate: { type: 'tilt_up', dxRange: [-0.1, 0.1], dyRange: [0.2, 0.4], motionMagnitude: 1.3, easing: 'ease-out' },
  },
  connection: {
    palace: { type: 'static', dxRange: [0.0, 0.0], dyRange: [0.0, 0.0], motionMagnitude: 0.5, easing: 'none' },
    'cloud-sea': { type: 'static', dxRange: [0.0, 0.0], dyRange: [0.0, 0.0], motionMagnitude: 0.4, easing: 'none' },
    figure: { type: 'static', dxRange: [0.0, 0.0], dyRange: [0.0, 0.0], motionMagnitude: 0.6, easing: 'none' },
    gate: { type: 'slow_zoom_in', dxRange: [0.0, 0.1], dyRange: [0.0, 0.0], motionMagnitude: 1.0, easing: 'ease-out' },
  },
  journey: {
    palace: { type: 'dolly_back', dxRange: [-0.8, -0.4], dyRange: [0.0, 0.1], motionMagnitude: 3.5, easing: 'ease-in-out' },
    'cloud-sea': { type: 'dolly_back', dxRange: [-0.6, -0.3], dyRange: [0.0, 0.1], motionMagnitude: 3.0, easing: 'ease-in-out' },
    figure: { type: 'dolly_back', dxRange: [-0.7, -0.3], dyRange: [0.0, 0.1], motionMagnitude: 3.2, easing: 'ease-in-out' },
    gate: { type: 'dolly_back', dxRange: [-0.6, -0.2], dyRange: [0.0, 0.1], motionMagnitude: 3.0, easing: 'ease-in-out' },
  },
  elevation: {
    palace: { type: 'slow_zoom_in', dxRange: [-0.3, 0.3], dyRange: [0.1, 0.3], motionMagnitude: 4.5, easing: 'ease-out' },
    'cloud-sea': { type: 'tilt_up', dxRange: [-0.2, 0.2], dyRange: [0.2, 0.4], motionMagnitude: 4.0, easing: 'ease-out' },
    figure: { type: 'slow_zoom_in', dxRange: [-0.2, 0.2], dyRange: [0.1, 0.3], motionMagnitude: 4.5, easing: 'ease-out' },
    gate: { type: 'slow_zoom_in', dxRange: [-0.2, 0.2], dyRange: [0.1, 0.3], motionMagnitude: 5.0, easing: 'ease-out' },
  },
  culmination: {
    palace: { type: 'dolly_forward', dxRange: [0.0, 0.4], dyRange: [0.0, 0.2], motionMagnitude: 6.5, easing: 'ease-in' },
    'cloud-sea': { type: 'dolly_forward', dxRange: [0.1, 0.4], dyRange: [0.0, 0.2], motionMagnitude: 6.0, easing: 'ease-in' },
    figure: { type: 'dolly_forward', dxRange: [0.0, 0.3], dyRange: [0.0, 0.2], motionMagnitude: 6.0, easing: 'ease-in' },
    gate: { type: 'dolly_forward', dxRange: [0.2, 0.5], dyRange: [0.0, 0.2], motionMagnitude: 7.0, easing: 'ease-in' },
  },
});

/* ==========================================================================
 * 内部工具
 * ========================================================================== */

/** 单维度评分（0-10）：在 [goodMin, goodMax] 内满分，越界线性衰减 */
function scoreInRange(value, goodMin, goodMax, hardMin = 0, hardMax = 20) {
  const v = typeof value === 'number' && Number.isFinite(value) ? value : hardMin;
  if (v >= goodMin && v <= goodMax) return 10;
  if (v < goodMin) {
    const dist = Math.min(goodMin - v, goodMin - hardMin);
    const span = Math.max(goodMin - hardMin, 1e-6);
    return clamp(10 - (dist / span) * 10, 0, 10);
  }
  const dist = Math.min(v - goodMax, hardMax - goodMax);
  const span = Math.max(hardMax - goodMax, 1e-6);
  return clamp(10 - (dist / span) * 10, 0, 10);
}

/** 布尔阈值评分：达到期望返回 10，否则按差距衰减 */
function scoreThreshold(actual, expectMin, hardMin = 0) {
  const v = typeof actual === 'number' && Number.isFinite(actual) ? actual : hardMin;
  if (v >= expectMin) return 10;
  const span = Math.max(expectMin - hardMin, 1e-6);
  return clamp(10 - ((expectMin - v) / span) * 10, 0, 10);
}

/**
 * 把 0-10 分维度映射为等级
 */
function levelFromScore(score) {
  if (score >= 85) return 'masterpiece';
  if (score >= 70) return 'excellent';
  if (score >= 55) return 'pass';
  if (score >= 40) return 'weak';
  return 'fail';
}

/* ==========================================================================
 * 1. assessVideoMotion — 评估视频动势质量
 * ========================================================================== */

/**
 * 评估一个视频/动画的动势质量。
 * 中式美学阈值：avgShotDuration 3-5s / bpm 60-90 / warmRatio>0.8 / motionMagnitude 2-5。
 *
 * @param {Object} videoParams
 * @param {number} [videoParams.durationSec=24]
 * @param {number} [videoParams.fps=30]
 * @param {string} [videoParams.resolution='1920x1080']
 * @param {string} [videoParams.cameraMotion='pan_left']
 * @param {number} [videoParams.avgShotDurationSec=3.87]
 * @param {string} [videoParams.transitionType='hard-cut']
 * @param {number} [videoParams.bpm=70.5]
 * @param {number} [videoParams.motionMagnitudeMean=3.88]
 * @param {number} [videoParams.parallaxMax=2.69]
 * @param {number} [videoParams.colorTempWarmRatio=1.0]
 * @param {number} [videoParams.brightnessStd=12.0]
 * @returns {{score:number, level:string, pass:boolean, dimensions:Array, recommendations:string[]}}
 */
export function assessVideoMotion(videoParams = {}) {
  const p = {
    durationSec: typeof videoParams.durationSec === 'number' ? videoParams.durationSec : 24,
    fps: typeof videoParams.fps === 'number' ? videoParams.fps : 30,
    resolution: typeof videoParams.resolution === 'string' ? videoParams.resolution : '1920x1080',
    cameraMotion: typeof videoParams.cameraMotion === 'string' ? videoParams.cameraMotion : 'pan_left',
    avgShotDurationSec: typeof videoParams.avgShotDurationSec === 'number' ? videoParams.avgShotDurationSec : 3.87,
    transitionType: typeof videoParams.transitionType === 'string' ? videoParams.transitionType : 'hard-cut',
    bpm: typeof videoParams.bpm === 'number' ? videoParams.bpm : 70.5,
    motionMagnitudeMean: typeof videoParams.motionMagnitudeMean === 'number' ? videoParams.motionMagnitudeMean : 3.88,
    parallaxMax: typeof videoParams.parallaxMax === 'number' ? videoParams.parallaxMax : 2.69,
    colorTempWarmRatio: typeof videoParams.colorTempWarmRatio === 'number' ? videoParams.colorTempWarmRatio : 1.0,
    brightnessStd: typeof videoParams.brightnessStd === 'number' ? videoParams.brightnessStd : 12.0,
  };

  // 钳制
  p.avgShotDurationSec = clamp(p.avgShotDurationSec, 0.5, 20);
  p.bpm = clamp(p.bpm, 20, 240);
  p.motionMagnitudeMean = clamp(p.motionMagnitudeMean, 0, 20);
  p.parallaxMax = clamp(p.parallaxMax, 0, 10);
  p.colorTempWarmRatio = clamp(p.colorTempWarmRatio, 0, 1);
  p.brightnessStd = clamp(p.brightnessStd, 0, 100);

  const dimensions = [];
  const recommendations = [];

  // (1) 相机运动合理性：pan_left / tilt / dolly 等持续单向运动为中式"游园"
  const validCameras = ['pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'dolly_in', 'dolly_out', 'dolly_forward', 'dolly_back', 'slow_zoom_in', 'slow_zoom_out', 'static'];
  const cameraScore = validCameras.includes(p.cameraMotion) ? 9 : 6;
  dimensions.push({
    name: 'cameraMotion',
    zhName: '相机运动合理性',
    score: cameraScore,
    pass: cameraScore >= 6,
    detail: `检测到 ${p.cameraMotion}，中式推荐持续单向慢摇（pan_left 实证 dx=-1.33 px/帧）`,
  });
  if (cameraScore < 9) recommendations.push(`相机运动"${p.cameraMotion}"不在中式推荐列表，建议改用 pan_left/tilt_up/dolly_forward 等持续单向慢运动`);

  // (2) 镜头节奏：avgShotDuration 3-5s 满分
  const rhythmScore = scoreInRange(p.avgShotDurationSec, MOTION_THRESHOLDS.shotDurationMin, MOTION_THRESHOLDS.shotDurationMax, 0.5, 12);
  dimensions.push({
    name: 'shotRhythm',
    zhName: '镜头节奏',
    score: Math.round(rhythmScore),
    pass: rhythmScore >= 6,
    detail: `平均镜头 ${p.avgShotDurationSec.toFixed(2)}s，中式呼吸区间 3-5s（实证 3.87s）`,
  });
  if (p.avgShotDurationSec < 3) recommendations.push(`镜头过短(${p.avgShotDurationSec.toFixed(2)}s)，中式呼吸镜头建议 3-5s 稳定节奏，末尾再加速收束`);
  if (p.avgShotDurationSec > 5) recommendations.push(`镜头过长(${p.avgShotDurationSec.toFixed(2)}s)，超过 5s 易沉闷，建议在 60%/80% 情绪点设置亮度峰值镜头`);

  // (3) 音画同步：BPM 60-90
  const syncScore = scoreInRange(p.bpm, MOTION_THRESHOLDS.bpmMin, MOTION_THRESHOLDS.bpmMax, 30, 180);
  dimensions.push({
    name: 'audioSync',
    zhName: '音画同步',
    score: Math.round(syncScore),
    pass: syncScore >= 6,
    detail: `BPM=${p.bpm}，中式冥想/史诗区间 60-90（实证 70.5），约 2.7 拍/镜头`,
  });
  if (p.bpm < 60) recommendations.push(`BPM=${p.bpm} 过慢，低于 60 易拖沓；中式神话氛围推荐 60-90（实证 70.5）`);
  if (p.bpm > 90) recommendations.push(`BPM=${p.bpm} 过快，跳出冥想/史诗感；中式慢氛围推荐 60-90`);

  // (4) 色彩动态：暖金占比 >0.8
  const colorScore = scoreThreshold(p.colorTempWarmRatio, MOTION_THRESHOLDS.warmRatioMin, 0);
  dimensions.push({
    name: 'colorDynamics',
    zhName: '色彩动态',
    score: Math.round(colorScore),
    pass: colorScore >= 6,
    detail: `暖色温占比 ${(p.colorTempWarmRatio * 100).toFixed(0)}%，中式推荐 >80%（实证 100% 暖金/琥珀）`,
  });
  if (p.colorTempWarmRatio < 0.8) recommendations.push(`暖金调占比仅 ${(p.colorTempWarmRatio * 100).toFixed(0)}%，建议主色向暖金/琥珀偏移，青绿朱红仅作点缀`);

  // (5) 视差纵深：parallaxMax >1.5
  const parallaxScore = scoreThreshold(p.parallaxMax, MOTION_THRESHOLDS.parallaxDepthMin, 0);
  dimensions.push({
    name: 'parallaxDepth',
    zhName: '视差纵深',
    score: Math.round(parallaxScore),
    pass: parallaxScore >= 6,
    detail: `中心-边缘运动差 max=${p.parallaxMax.toFixed(2)}，>1.5 视为有纵深（实证 2.69）`,
  });
  if (p.parallaxMax < 1.5) recommendations.push(`视差纵深不足(${p.parallaxMax.toFixed(2)})，建议让前景(人物/衣袂)与背景(宫殿/云海)运动不同步，差>1.5`);

  // (6) 情绪曲线：motionMagnitude 2-5 为流动感，高潮>6，静止<1；brightnessStd 10-20 为情绪节拍
  const flowScore = scoreInRange(p.motionMagnitudeMean, MOTION_THRESHOLDS.flowMin, MOTION_THRESHOLDS.flowMax, 0, 12);
  const brightScore = scoreInRange(p.brightnessStd, 8, 20, 0, 40);
  const emotionScore = (flowScore + brightScore) / 2;
  dimensions.push({
    name: 'emotionCurve',
    zhName: '情绪曲线',
    score: Math.round(emotionScore),
    pass: emotionScore >= 6,
    detail: `运动均值=${p.motionMagnitudeMean.toFixed(2)}(流动 2-5/高潮>6)，亮度 std=${p.brightnessStd.toFixed(1)}(情绪节拍 10-20)`,
  });
  if (p.motionMagnitudeMean < 2) recommendations.push(`运动幅度过静(${p.motionMagnitudeMean.toFixed(2)})，云海/衣袂需持续二次运动，均值 2-5 为流动感区间`);
  if (p.motionMagnitudeMean > 6) recommendations.push(`运动幅度过猛(${p.motionMagnitudeMean.toFixed(2)})，中式慢运动建议均值 2-5，仅高潮段允许 >6`);

  // 综合：六维等权
  const score = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length * 10);
  const level = levelFromScore(score);
  const pass = score >= 55 && dimensions.every(d => d.pass);

  return {
    score,
    level,
    pass,
    dimensions,
    recommendations,
    meta: {
      durationSec: p.durationSec,
      fps: p.fps,
      resolution: p.resolution,
      transitionType: p.transitionType,
      thresholds: MOTION_THRESHOLDS,
    },
  };
}

/* ==========================================================================
 * 2. generateMotionPreset — 动势参数预设
 * ========================================================================== */

/**
 * 生成命名动势预设（基于实证 6 段空间叙事线）。
 * @param {string} presetName - majestic-reveal/reverence/connection/journey/elevation/culmination
 * @returns {Object|null}
 */
export function generateMotionPreset(presetName) {
  const name = typeof presetName === 'string' ? presetName : 'majestic-reveal';
  const preset = MOTION_PRESETS[name];
  if (!preset) {
    return {
      error: `未知预设: ${name}`,
      supported: Object.keys(MOTION_PRESETS),
    };
  }
  return {
    name,
    ...preset,
  };
}

/** 列出所有预设 */
export function listMotionPresets() {
  return Object.entries(MOTION_PRESETS).map(([key, p]) => ({
    name: key,
    emotion: p.emotion,
    cameraMotion: p.cameraMotion,
    shotDurationSec: p.shotDurationSec,
    note: p.note,
  }));
}

/* ==========================================================================
 * 3. recommendCameraMotion — 情绪+场景 → 相机运动
 * ========================================================================== */

/**
 * 根据情绪和场景推荐相机运动。
 * @param {string} emotion - awe/reverence/connection/journey/elevation/culmination
 * @param {string} [sceneType='palace'] - palace/cloud-sea/figure/gate
 * @returns {{type:string, dxRange:number[], dyRange:number[], motionMagnitude:number, easing:string, emotion:string, sceneType:string}}
 */
export function recommendCameraMotion(emotion, sceneType = 'palace') {
  const emo = typeof emotion === 'string' ? emotion : 'awe';
  const scene = typeof sceneType === 'string' ? sceneType : 'palace';

  const emoTable = CAMERA_RECOMMENDATIONS[emo];
  if (!emoTable) {
    return {
      error: `未知情绪: ${emo}`,
      supportedEmotions: Object.keys(CAMERA_RECOMMENDATIONS),
    };
  }
  const rec = emoTable[scene] || emoTable.palace;

  return {
    emotion: emo,
    sceneType: scene,
    type: rec.type,
    dxRange: [...rec.dxRange],
    dyRange: [...rec.dyRange],
    motionMagnitude: rec.motionMagnitude,
    easing: rec.easing,
    rationale: `中式"游园"动线：${emo} 情绪在 ${scene} 场景下采用${rec.type}，${rec.motionMagnitude} 级动势`,
  };
}

/* ==========================================================================
 * 4. calculateEditRhythm — 剪辑节奏计算
 * ========================================================================== */

/**
 * 计算剪辑节奏：稳定 ~4s + 末尾加速。
 * 公式：baseShot = 60/bpm * 2.7（约 2.7 拍/镜头），最后两段 ×0.7 和 ×0.4。
 *
 * @param {number} bpm - 节拍（中式 60-90，实证 70.5）
 * @param {number} [segmentCount=7] - 情绪曲线段数（实证 7 个镜头）
 * @returns {{baseSec:number, beatsPerShot:number, shots:number[], totalSec:number, accelTail:{penultimate:number, last:number}}}
 */
export function calculateEditRhythm(bpm, segmentCount = 7) {
  const safeBpm = clamp(typeof bpm === 'number' && bpm > 0 ? bpm : 70.5, 40, 200);
  const safeCount = Math.max(2, Math.min(24, Math.round(segmentCount)));

  const beatSec = 60 / safeBpm;
  const beatsPerShot = 2.7; // 实证：70.5 BPM × 3.87s ≈ 2.7 拍/镜头
  const baseSec = beatSec * beatsPerShot;

  const shots = [];
  for (let i = 0; i < safeCount; i++) {
    shots.push(baseSec);
  }
  // 末尾两段加速（实证 2.9s→1.1s ≈ 0.75×→0.28×，工程上取 ×0.7 / ×0.4）
  if (shots.length >= 2) {
    shots[shots.length - 2] = Math.round(shots[shots.length - 2] * 0.7 * 100) / 100;
    shots[shots.length - 1] = Math.round(shots[shots.length - 1] * 0.4 * 100) / 100;
  }

  const totalSec = Math.round(shots.reduce((a, b) => a + b, 0) * 100) / 100;

  return {
    bpm: safeBpm,
    beatsPerShot,
    baseSec: Math.round(baseSec * 100) / 100,
    shots,
    totalSec,
    accelTail: {
      penultimate: shots[shots.length - 2],
      last: shots[shots.length - 1],
      ratio: '0.7x / 0.4x',
    },
    note: '前 N-2 段稳定呼吸镜头，末尾两段加速收束（实证 2.9s→1.1s）',
  };
}

/* ==========================================================================
 * 5. EMOTION_CURVE_TEMPLATE 已在上方导出
 * 6. MOTION_THRESHOLDS / CHINESE_VIDEO_PARAMS 已在上方导出
 * ========================================================================== */

export default {
  MOTION_THRESHOLDS,
  CHINESE_VIDEO_PARAMS,
  EMOTION_CURVE_TEMPLATE,
  assessVideoMotion,
  generateMotionPreset,
  listMotionPresets,
  recommendCameraMotion,
  calculateEditRhythm,
};
