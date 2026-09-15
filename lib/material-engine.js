/**
 * material-engine.js — 材质决策器
 *
 * 输入元素类型/时间/环境，自动输出PBR材质参数：
 * - 木（乌木/檀木/杉木/松木）
 * - 石（青石板/汉白玉/花岗岩/太湖石）
 * - 土（夯土/陶砖/灰瓦）
 * - 金（哑金/青铜/紫铜/铁锈）
 * - 纸（宣纸/绢/油纸）
 * - 雾/云/光（体积材质）
 *
 * 核心原则：天然材料≥70%、平均粗糙度≥0.5、有包浆风化痕迹、无塑料感（roughness<0.3且metalness<0.1）。
 */

import { clamp } from './utils/math.js';

/** 材质库 */
export const MATERIAL_LIBRARY = {
  wood: {
    name: '木',
    category: '天然',
    variants: {
      'ebony': {
        name: '乌木',
        color: '#2C1810',
        roughness: 0.65,
        metalness: 0.0,
        description: '深色名贵硬木，用于门/柱/家具',
        patina: { colorShift: '#1A0F08', roughnessIncrease: 0.1 },
      },
      'sandalwood': {
        name: '檀木',
        color: '#8B4513',
        roughness: 0.60,
        metalness: 0.0,
        description: '红棕色硬木，用于门/梁/柱',
        patina: { colorShift: '#6B3410', roughnessIncrease: 0.1 },
      },
      'fir': {
        name: '杉木',
        color: '#C4A35A',
        roughness: 0.70,
        metalness: 0.0,
        description: '浅色软木，用于屋面/天花板/隔墙',
        patina: { colorShift: '#A68B45', roughnessIncrease: 0.15 },
      },
      'pine': {
        name: '松木',
        color: '#D4A574',
        roughness: 0.65,
        metalness: 0.0,
        description: '常见建筑用木，纹理明显',
        patina: { colorShift: '#B8956A', roughnessIncrease: 0.1 },
      },
    },
  },
  stone: {
    name: '石',
    category: '天然',
    variants: {
      'bluestone': {
        name: '青石板',
        color: '#4B4B4B',
        roughness: 0.90,
        metalness: 0.0,
        description: '深灰色板岩，用于地面/台阶/基座',
        patina: { colorShift: '#3A3A3A', roughnessIncrease: 0.05, moss: true },
      },
      'marble': {
        name: '汉白玉',
        color: '#E8E4D9',
        roughness: 0.40,
        metalness: 0.0,
        description: '白色大理石，用于栏杆/台基/雕刻',
        patina: { colorShift: '#D8D4C9', roughnessIncrease: 0.1 },
      },
      'granite': {
        name: '花岗岩',
        color: '#6B6B6B',
        roughness: 0.85,
        metalness: 0.0,
        description: '坚硬粗面石材，用于基座/台阶',
        patina: { colorShift: '#5A5A5A', roughnessIncrease: 0.05 },
      },
      'taihu': {
        name: '太湖石',
        color: '#7A7A7A',
        roughness: 0.80,
        metalness: 0.0,
        description: '多孔玲珑石，用于园林假山',
        patina: { colorShift: '#6A6A6A', roughnessIncrease: 0.1 },
      },
    },
  },
  earth: {
    name: '土',
    category: '天然',
    variants: {
      'rammed-earth': {
        name: '夯土',
        color: '#A67C52',
        roughness: 0.95,
        metalness: 0.0,
        description: '分层夯实的土墙，用于民居墙体',
        patina: { colorShift: '#8B6B42', roughnessIncrease: 0.05 },
      },
      'brick': {
        name: '陶砖',
        color: '#8B4513',
        roughness: 0.85,
        metalness: 0.0,
        description: '青灰/红棕色砖块，用于墙体/地面',
        patina: { colorShift: '#6B3410', roughnessIncrease: 0.1 },
      },
      'gray-tile': {
        name: '灰瓦',
        color: '#5A5A5A',
        roughness: 0.80,
        metalness: 0.0,
        description: '青灰色陶瓦，用于屋面',
        patina: { colorShift: '#4A4A4A', roughnessIncrease: 0.1, moss: true },
      },
    },
  },
  metal: {
    name: '金',
    category: '天然/加工',
    variants: {
      'dull-gold': {
        name: '哑金',
        color: '#B8860B',
        roughness: 0.45,
        metalness: 0.8,
        description: '低光泽金箔/鎏金，用于点缀/线条/光',
        maxArea: 0.10,
        note: '金只做线/点/光，配深色底才发光',
        patina: { colorShift: '#9A7209', roughnessIncrease: 0.15 },
      },
      'bronze': {
        name: '青铜',
        color: '#6B5B4E',
        roughness: 0.50,
        metalness: 0.7,
        description: '铜锡合金，用于器物/装饰/香炉',
        patina: { colorShift: '#4A7C6F', roughnessIncrease: 0.1, patinaType: '铜绿' },
      },
      'copper': {
        name: '紫铜',
        color: '#B87333',
        roughness: 0.40,
        metalness: 0.85,
        description: '纯铜，用于屋顶/装饰',
        patina: { colorShift: '#4A7C6F', roughnessIncrease: 0.15, patinaType: '铜绿' },
      },
      'iron-rust': {
        name: '铁锈',
        color: '#7B3F00',
        roughness: 0.85,
        metalness: 0.3,
        description: '锈蚀铁器，用于旧建筑/工业遗迹',
        patina: { colorShift: '#5A2F00', roughnessIncrease: 0.1 },
      },
    },
  },
  paper: {
    name: '纸',
    category: '天然',
    variants: {
      'xuan-paper': {
        name: '宣纸',
        color: '#F0EBE3',
        roughness: 0.90,
        metalness: 0.0,
        transmission: 0.3,
        description: '半透明手工纸，用于窗/灯/屏风',
        patina: { colorShift: '#E0DBD3', roughnessIncrease: 0.05 },
      },
      'silk': {
        name: '绢',
        color: '#E8E4D9',
        roughness: 0.70,
        metalness: 0.0,
        transmission: 0.2,
        description: '丝织品，用于画/帘/服饰',
        patina: { colorShift: '#D8D4C9', roughnessIncrease: 0.1 },
      },
      'oil-paper': {
        name: '油纸',
        color: '#D4C5A9',
        roughness: 0.60,
        metalness: 0.0,
        transmission: 0.15,
        description: '涂油防水纸，用于伞/灯/窗',
        patina: { colorShift: '#C4B599', roughnessIncrease: 0.1 },
      },
    },
  },
  volume: {
    name: '雾/云/光',
    category: '体积',
    variants: {
      'cloud': {
        name: '云海',
        color: '#FFFFFF',
        opacity: 0.5,
        roughness: 1.0,
        metalness: 0.0,
        transmission: 0.8,
        description: '半透明体积云，用于氛围/背景',
        shader: 'volumetric-noise',
      },
      'fog': {
        name: '薄雾',
        color: '#E8E4D9',
        opacity: 0.3,
        roughness: 1.0,
        metalness: 0.0,
        transmission: 0.9,
        description: '低空薄雾，用于增加景深/朦胧感',
        shader: 'height-fog',
      },
      'gold-dust': {
        name: '金粉',
        color: '#B8860B',
        opacity: 0.7,
        size: 0.02,
        count: 200,
        description: '漂浮金色微粒，用于点缀/神圣感',
        note: '数量≤200，面积≤5%，不做主要视觉',
      },
      'light-shaft': {
        name: '光束',
        color: '#FFF5E6',
        opacity: 0.25,
        description: '体积光/漏光，必须有遮挡物',
        requirement: '必须从云缝/窗格/屋檐漏下，无遮挡的光就是普通照明',
      },
    },
  },
};

/**
 * 主入口：根据元素类型生成材质方案
 * @param {string} elementType - 元素类型
 * @param {Object} options - 选项（时间/环境/风化程度）
 * @returns {Object} 材质方案
 */
export function generateMaterial(elementType, options = {}) {
  const category = MATERIAL_LIBRARY[elementType];
  if (!category) {
    return { error: `未知材质类型: ${elementType}`, supportedTypes: Object.keys(MATERIAL_LIBRARY) };
  }

  // 选择变体
  const variantKey = options.variant || Object.keys(category.variants)[0];
  const variant = category.variants[variantKey];
  if (!variant) {
    return { error: `未知变体: ${variantKey}`, supportedVariants: Object.keys(category.variants) };
  }

  // 应用风化/包浆
  const weathering = options.weathering ?? 0.3; // 0-1
  const finalColor = weathering > 0.5 && variant.patina?.colorShift
    ? blendColors(variant.color, variant.patina.colorShift, weathering * 0.5)
    : variant.color;
  const finalRoughness = clamp(variant.roughness + (variant.patina?.roughnessIncrease || 0) * weathering, 0, 1);

  const material = {
    type: elementType,
    typeName: category.name,
    category: category.category,
    variant: variantKey,
    variantName: variant.name,
    description: variant.description,
    pbr: {
      color: finalColor,
      roughness: finalRoughness,
      metalness: variant.metalness ?? 0.0,
      transmission: variant.transmission ?? 0,
      opacity: variant.opacity ?? 1,
    },
    weathering,
    hasPatina: weathering > 0.3,
    patinaType: variant.patina?.patinaType || (variant.patina?.moss ? '苔藓' : null),
    maxArea: variant.maxArea,
    note: variant.note || variant.requirement || null,
    threeJsCode: generateThreeJSCode(elementType, variantKey, finalColor, finalRoughness, variant),
  };

  return material;
}

/**
 * 校验材质是否符合中式美学规则
 */
export function validateMaterials(materials = []) {
  const violations = [];
  let score = 10;

  // 1. 天然材料占比 ≥70%
  const naturalCount = materials.filter(m => {
    const cat = MATERIAL_LIBRARY[m.type]?.category;
    return cat === '天然' || cat === '天然/加工';
  }).length;
  const naturalRatio = materials.length > 0 ? naturalCount / materials.length : 0;
  if (naturalRatio < 0.70) {
    violations.push({ rule: 'natural-ratio', severity: 'P1', message: `天然材料占比${(naturalRatio * 100).toFixed(0)}%<70%`, fix: '增加木/石/土/纸等天然材料' });
    score -= 2;
  }

  // 2. 平均粗糙度 ≥0.5
  const avgRoughness = materials.length > 0
    ? materials.reduce((s, m) => s + (m.pbr?.roughness ?? m.roughness ?? 0.5), 0) / materials.length
    : 0.5;
  if (avgRoughness < 0.50) {
    violations.push({ rule: 'avg-roughness', severity: 'P0', message: `平均粗糙度${avgRoughness.toFixed(2)}<0.5（塑料感）`, fix: '提高粗糙度到0.5以上，木0.6/石0.9' });
    score -= 4;
  }

  // 3. 无塑料感材质（roughness<0.3且metalness<0.1）
  const plasticMaterials = materials.filter(m => {
    const r = m.pbr?.roughness ?? m.roughness ?? 0.5;
    const metal = m.pbr?.metalness ?? m.metalness ?? 0;
    return r < 0.3 && metal < 0.1;
  });
  if (plasticMaterials.length > 0) {
    violations.push({ rule: 'plastic-material', severity: 'P0', message: `${plasticMaterials.length}个塑料感材质（roughness<0.3且metalness<0.1）`, fix: '提高粗糙度或金属度' });
    score -= 3;
  }

  // 4. 金色面积 ≤10%
  const goldMaterials = materials.filter(m => m.type === 'metal' && (m.variant === 'dull-gold' || m.variant === 'gold'));
  const goldArea = goldMaterials.reduce((s, m) => s + (m.areaRatio || 0), 0);
  if (goldArea > 0.10) {
    violations.push({ rule: 'gold-area', severity: 'P0', message: `金色占比${(goldArea * 100).toFixed(0)}%>10%`, fix: '金只做线/点/光，面积≤10%' });
    score -= 3;
  }

  // 5. 有包浆/风化痕迹
  const hasPatina = materials.some(m => m.weathering > 0.3 || m.hasPatina);
  if (!hasPatina && materials.length > 0) {
    violations.push({ rule: 'patina', severity: 'P1', message: '所有材质全新无风化（缺时间感）', fix: '至少一个材质添加风化/包浆痕迹' });
    score -= 1;
  }

  return {
    score: clamp(score, 0, 10),
    pass: violations.filter(v => v.severity === 'P0').length === 0,
    avgRoughness,
    naturalRatio,
    violations,
    p0Count: violations.filter(v => v.severity === 'P0').length,
    p1Count: violations.filter(v => v.severity === 'P1').length,
  };
}

/* ==================== 辅助函数 ==================== */

function blendColors(hex1, hex2, t) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function generateThreeJSCode(type, variant, color, roughness, variantData) {
  const metalness = variantData.metalness ?? 0;
  const transmission = variantData.transmission ?? 0;
  const opacity = variantData.opacity ?? 1;

  if (type === 'volume') {
    return `// ${variantData.name}（体积材质）
const material = new THREE.ShaderMaterial({
  uniforms: { uColor: { value: new THREE.Color('${color}') }, uTime: { value: 0 }, uOpacity: { value: ${opacity} } },
  vertexShader: \`...\`,
  fragmentShader: \`...\`,
  transparent: true,
  depthWrite: false,
});`;
  }

  return `// ${variantData.name}
const material = new THREE.MeshStandardMaterial({
  color: '${color}',
  roughness: ${roughness.toFixed(2)},
  metalness: ${metalness},
  ${transmission > 0 ? `transmission: ${transmission}, transparent: true,` : ''}
  ${opacity < 1 ? `transparent: true, opacity: ${opacity},` : ''}
});`;
}

/** 获取所有材质类型 */
export function listMaterialTypes() {
  return Object.entries(MATERIAL_LIBRARY).map(([key, m]) => ({
    type: key,
    name: m.name,
    category: m.category,
    variants: Object.keys(m.variants),
  }));
}
