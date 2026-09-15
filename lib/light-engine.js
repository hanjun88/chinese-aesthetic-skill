/**
 * light-engine.js — 光影决策器
 *
 * 输入时间/场景/天气，自动输出：
 * - 光源类型（天光/漏光/侧光/漫反射/逆光）
 * - 光源位置/角度/强度
 * - 阴影参数（软阴影/出檐阴影/体积光）
 * - 明暗比
 * - 暗部颜色（非纯黑）
 *
 * 核心原则：明暗比≥3:1、逆光/侧逆光做轮廓、体积光有遮挡物、暗部有色、不用点光源舞台光。
 */

import { clamp, lerp } from './utils/math.js';

/** 时间预设 */
const TIME_PRESETS = {
  dawn: {
    name: '黎明',
    timeRange: '05:00-07:00',
    sunAngle: 10,
    sunColor: '#FFB088',
    ambientColor: '#2C3E50',
    intensity: 0.4,
    brightnessRatio: 4,
    mood: '清冷/希望/静谧',
  },
  morning: {
    name: '上午',
    timeRange: '07:00-10:00',
    sunAngle: 45,
    sunColor: '#FFF5E6',
    ambientColor: '#87CEEB',
    intensity: 0.8,
    brightnessRatio: 3,
    mood: '明亮/清朗',
  },
  noon: {
    name: '正午',
    timeRange: '11:00-14:00',
    sunAngle: 90,
    sunColor: '#FFFFFF',
    ambientColor: '#B0E0E6',
    intensity: 1.0,
    brightnessRatio: 2,
    mood: '强烈/直白（不推荐，阴影太短）',
    warning: '正午顶光阴影太短，东方美学偏好晨昏侧光',
  },
  dusk: {
    name: '黄昏',
    timeRange: '16:00-18:00',
    sunAngle: 135,
    sunColor: '#FF8C42',
    ambientColor: '#4A3728',
    intensity: 0.6,
    brightnessRatio: 5,
    mood: '温暖/苍凉/诗意',
  },
  night: {
    name: '夜晚',
    timeRange: '19:00-05:00',
    sunAngle: 180,
    sunColor: '#C8D8E8',
    ambientColor: '#0A1628',
    intensity: 0.15,
    brightnessRatio: 6,
    mood: '幽深/神秘/月光',
    moonLight: true,
  },
};

/** 光源类型 */
const LIGHT_TYPES = {
  skylight: {
    name: '天光',
    description: '从天空漫射下来的柔和光线，无明确方向，整体均匀但有层次',
    useCase: '白天室外/开阔空间',
    shadowType: 'soft-ambient',
  },
  rimLight: {
    name: '逆光/侧逆光',
    description: '光源在主体后方或侧后方，勾勒轮廓线，主体在阴影中',
    useCase: '人物/建筑轮廓表现/东方意境',
    shadowType: 'silhouette',
    recommendedAngle: '120-150°',
  },
  sideLight: {
    name: '侧光',
    description: '光源从侧面照射，形成明确的明暗交界，增强立体感',
    useCase: '建筑/雕塑/材质表现',
    shadowType: 'hard-soft',
    recommendedAngle: '60-120°',
  },
  godRay: {
    name: '体积光/漏光',
    description: '光被云层/建筑/窗格遮挡后，空气中的灰尘水汽让光束可见',
    useCase: '云海/寺庙/森林/窗格',
    shadowType: 'light-shaft',
    requirement: '必须有遮挡物（云/建筑/窗），无遮挡的光就是普通照明',
  },
  diffuse: {
    name: '漫反射',
    description: '光线经过多次反射后形成的柔和间接光，无明确阴影边界',
    useCase: '室内/阴天/阴影区域',
    shadowType: 'no-shadow',
  },
  moonlight: {
    name: '月光',
    description: '夜晚唯一冷光源，色温低（蓝白），亮度低但对比强',
    useCase: '夜景/东方意境/暗调中一处光',
    shadowType: 'soft-blue',
    requirement: '夜景唯一光源，禁止加暖色人工光',
  },
};

/**
 * 主入口：生成光影方案
 * @param {Object} params - 场景参数
 * @returns {Object} 光影方案
 */
export function generateLighting(params = {}) {
  const time = params.time || 'dusk';
  const preset = TIME_PRESETS[time] || TIME_PRESETS['dusk'];
  const sceneType = params.sceneType || 'landscape';

  // 1. 主光源
  const keyLight = generateKeyLight(preset, sceneType);

  // 2. 环境光
  const ambientLight = generateAmbientLight(preset);

  // 3. 阴影方案
  const shadows = generateShadows(preset, sceneType, params.hasEave !== false);

  // 4. 体积光（如果场景适合）
  const godRay = (params.hasClouds || params.hasWindow || sceneType === 'temple')
    ? generateGodRay(preset, sceneType)
    : null;

  // 5. 暗部颜色
  const darkPart = generateDarkPart(preset);

  // 6. 明暗比
  const brightnessRatio = params.brightnessRatio || preset.brightnessRatio;

  return {
    time,
    timeName: preset.name,
    mood: preset.mood,
    warning: preset.warning || null,
    keyLight,
    ambientLight,
    shadows,
    godRay,
    darkPart,
    brightnessRatio,
    threeJsConfig: generateThreeJSConfig(keyLight, ambientLight, shadows, godRay),
    validation: validateLighting({ brightnessRatio, keyLight, darkPart }),
  };
}

/* ==================== 各子生成器 ==================== */

/** 主光源 */
function generateKeyLight(preset, sceneType) {
  // 东方美学偏好逆光/侧逆光
  const preferredTypes = ['rimLight', 'sideLight', 'skylight'];
  let type;
  if (preset.name === '夜晚') type = 'moonlight';
  else if (sceneType === 'temple' || sceneType === 'landscape') type = 'rimLight';
  else if (sceneType === 'residence') type = 'sideLight';
  else type = 'skylight';

  const lightInfo = LIGHT_TYPES[type];

  return {
    type,
    typeName: lightInfo.name,
    description: lightInfo.description,
    color: preset.sunColor,
    intensity: preset.intensity,
    angle: preset.sunAngle,
    position: calculateLightPosition(preset.sunAngle),
    shadow: lightInfo.shadowType,
    recommended: type === 'rimLight' || type === 'moonlight',
  };
}

/** 环境光 */
function generateAmbientLight(preset) {
  return {
    color: preset.ambientColor,
    intensity: preset.intensity * 0.3,
    type: 'diffuse',
    description: '漫反射环境光，提供基础照明，不产生阴影',
  };
}

/** 阴影方案 */
function generateShadows(preset, sceneType, hasEave) {
  const shadows = [];

  // 出檐阴影（如果有出檐）
  if (hasEave) {
    shadows.push({
      type: 'eave-shadow',
      name: '出檐阴影',
      description: '深远出檐在墙面上投下的大面积阴影，占墙面高度20-30%',
      coverage: 0.25,
      softness: 0.7,
      color: preset.ambientColor,
      importance: 'high',
    });
  }

  // 主体投影
  shadows.push({
    type: 'cast-shadow',
    name: '主体投影',
    description: '建筑/人物在地面上的投影，方向与主光源一致',
    softness: preset.sunAngle < 45 ? 0.3 : 0.6,
    length: preset.sunAngle < 45 ? 'long' : 'short',
  });

  // 软阴影（非硬边）
  shadows.push({
    type: 'soft-shadow',
    name: '软阴影',
    description: '所有阴影边缘柔和过渡，无硬边锯齿',
    radius: 8,
    requirement: '禁止硬边阴影（shadow radius=0）',
  });

  return {
    list: shadows,
    overallSoftness: 0.6,
    hasHardShadow: false,
    description: hasEave
      ? '出檐阴影+主体投影+软阴影，层次丰富'
      : '主体投影+软阴影，建议增加出檐或遮挡物增强阴影层次',
  };
}

/** 体积光/漏光 */
function generateGodRay(preset, sceneType) {
  return {
    enabled: true,
    type: 'god-ray',
    name: '体积光/漏光',
    description: sceneType === 'temple'
      ? '光从窗格/屋檐缝隙漏下，形成可见光束'
      : '光从云缝中漏下，形成可见光束',
    source: sceneType === 'temple' ? 'window/eave gap' : 'cloud gap',
    count: 2,
    opacity: 0.25,
    color: preset.sunColor,
    direction: 'from-above',
    requirement: '必须有遮挡物（云/建筑/窗），光束有明确起点和终点',
    forbidden: '无遮挡的点光源照射地面=舞台光/探照灯感',
  };
}

/** 暗部颜色 */
function generateDarkPart(preset) {
  const darkColors = {
    dawn: '#1B2A4A',
    morning: '#2C3E50',
    noon: '#3D4F5F',
    dusk: '#2A1F14',
    night: '#0A1628',
  };
  return {
    color: darkColors[preset.name === '黎明' ? 'dawn' : preset.name === '上午' ? 'morning' : preset.name === '正午' ? 'noon' : preset.name === '黄昏' ? 'dusk' : 'night'] || '#1A1A2E',
    description: '暗部有色（深蓝/深灰/深棕），非纯黑#000000',
    minLightness: 0.08,
    forbidden: '纯黑#000000（死黑/不透气）',
  };
}

/** 计算光源位置 */
function calculateLightPosition(angle) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * 100,
    y: Math.sin(rad) * 100,
    z: 50,
  };
}

/** 生成Three.js配置 */
function generateThreeJSConfig(keyLight, ambientLight, shadows, godRay) {
  return {
    lights: [
      {
        type: keyLight.type === 'moonlight' ? 'DirectionalLight' : 'DirectionalLight',
        color: keyLight.color,
        intensity: keyLight.intensity,
        position: [keyLight.position.x, keyLight.position.y, keyLight.position.z],
        castShadow: true,
        shadow: { mapSize: 2048, radius: 8, bias: -0.0005 },
      },
      {
        type: 'AmbientLight',
        color: ambientLight.color,
        intensity: ambientLight.intensity,
      },
    ],
    shadowMap: { enabled: true, type: 'PCFSoftShadowMap' },
    fog: godRay ? { color: ambientLight.color, near: 50, far: 200 } : null,
    godRayShader: godRay ? {
      uniforms: { uColor: godRay.color, uOpacity: godRay.opacity, uTime: 0 },
      vertexShader: '...',
      fragmentShader: '...',
    } : null,
  };
}

/* ==================== 校验 ==================== */

function validateLighting(params) {
  const violations = [];
  let score = 10;

  // 明暗比 ≥3:1
  if (params.brightnessRatio < 2) {
    violations.push({ rule: 'brightness-ratio', severity: 'P0', message: `明暗比${params.brightnessRatio}:1<2:1（均匀打光）`, fix: '拉到3:1以上' });
    score -= 4;
  } else if (params.brightnessRatio < 3) {
    violations.push({ rule: 'brightness-ratio', severity: 'P1', message: `明暗比${params.brightnessRatio}:1<3:1`, fix: '拉到3:1以上' });
    score -= 2;
  }

  // 逆光/侧逆光
  if (params.keyLight && params.keyLight.angle < 60 && params.keyLight.type !== 'moonlight') {
    violations.push({ rule: 'light-angle', severity: 'P1', message: `光源角度${params.keyLight.angle}°<60°（顺光/平）`, fix: '改用逆光/侧逆光（90-150°）' });
    score -= 2;
  }

  // 暗部有色
  if (params.darkPart && params.darkPart.color === '#000000') {
    violations.push({ rule: 'dark-part', severity: 'P1', message: '暗部纯黑#000000（死黑）', fix: '用墨黑#1A1A2E或黛蓝#1B2A4A' });
    score -= 1;
  }

  return {
    score: clamp(score, 0, 10),
    pass: violations.filter(v => v.severity === 'P0').length === 0,
    violations,
  };
}

/** 获取所有时间预设 */
export function listTimePresets() {
  return Object.entries(TIME_PRESETS).map(([key, p]) => ({
    key,
    name: p.name,
    timeRange: p.timeRange,
    mood: p.mood,
    recommended: p.name !== '正午',
  }));
}
