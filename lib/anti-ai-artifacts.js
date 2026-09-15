/**
 * anti-ai-artifacts.js — AI生图伪影检测与消除引擎
 *
 * 核心能力：
 * - detectArtifacts: 三类伪影风险评分（环状颗粒感/塑料油润感/数码过拟合味）
 * - recommendParams: 根据场景生成最优生图参数（CFG/采样器/步数/VAE）
 * - generateNegativePrompt: 生成负向提示词（拦截三类伪影）
 * - recommendUpscaleStrategy: 二阶段放大策略（模型放大+低降噪重绘）
 * - recommendPostProcessing: 后期处理建议（胶片颗粒/De-banding）
 * - fullAudit: 一站式审计（输入生图参数→风险评分+完整修复方案）
 *
 * 蒸馏来源：
 * - AI生图工程调优方案（CFG Rescale/DPM++ 2M Karras/vae-ft-mse/二阶段放大/胶片颗粒）
 * - 7位博主反俗套实践（低饱和/块面剪影/逆光轮廓）
 *
 * @example
 * import { antiAIArtifacts } from './index.js';
 *
 * // 审计一组生图参数
 * const audit = antiAIArtifacts.fullAudit({
 *   cfg: 9,
 *   sampler: 'Euler a',
 *   steps: 60,
 *   vae: 'native',
 *   resolution: '2048x2048',
 *   positivePrompt: 'masterpiece, 8k resolution, ultra-realistic',
 * });
 * console.log(audit.riskScore, audit.riskLevel);
 * console.log(audit.recommendations);
 * console.log(audit.negativePrompt);
 */

// ========== 伪影类型定义 ==========

const ARTIFACT_TYPES = {
  concentricRings: {
    id: 'concentric-rings',
    name: '环状颗粒感',
    nameEn: 'Concentric Ring Artifacts',
    description: '平滑过渡区域出现同心圆环/油斑/过饱和色圈',
    cause: '高CFG迫使潜变量超出正态分布阈值，导致色彩通道截断(clipping)与局部驻波伪影',
    severity: 'high',
  },
  plasticOily: {
    id: 'plastic-oily',
    name: '塑料油润感',
    nameEn: 'Plastic / Oily Texture',
    description: '人物皮肤光滑如塑料、材质有油画般油润反光、缺乏真实微观纹理',
    cause: 'VAE解码器反卷积棋盘格伪影 + 模型训练集被锐化过度/JPEG压缩的高权重图激活',
    severity: 'high',
  },
  digitalOverfitting: {
    id: 'digital-overfitting',
    name: '数码过拟合味',
    nameEn: 'Digital Overfitting Taste',
    description: '过度锐化纹理震荡、色带(banding)、JPEG压缩伪影、边缘过冲(edge overshoot)',
    cause: '步数>50步过锐化 + 高CFG色彩截断 + 渐变区域8位色深不足',
    severity: 'medium',
  },
};

// ========== 推荐参数库 ==========

const RECOMMENDED_CONFIGS = {
  sdxl: {
    cfg: { min: 3.0, max: 5.5, optimal: 4.5 },
    steps: { min: 28, max: 35, optimal: 30 },
    samplers: ['DPM++ 2M Karras', 'Euler', 'UniPC'],
    vae: 'vae-ft-mse-840000-ema',
    baseResolution: '1024x1024',
    cfgRescale: 0.7,
  },
  sd15: {
    cfg: { min: 3.0, max: 5.5, optimal: 4.0 },
    steps: { min: 28, max: 35, optimal: 30 },
    samplers: ['DPM++ 2M Karras', 'Euler a', 'UniPC'],
    vae: 'vae-ft-mse-840000-ema-pruned',
    baseResolution: '512x768',
    cfgRescale: 0.7,
  },
  flux: {
    cfg: { min: 1.0, max: 2.5, optimal: 1.5 },
    steps: { min: 20, max: 30, optimal: 25 },
    samplers: ['Euler', 'DPM++ 2M', 'UniPC'],
    vae: 'flux-native',
    baseResolution: '1024x1024',
    cfgRescale: null,
  },
};

// ========== 画质玄学词黑名单 ==========

const QUALITY_VOODOO_WORDS = [
  'hyper-detailed',
  '8k resolution',
  'masterpiece',
  'ultra-realistic',
  'sharp focus',
  'best quality',
  'highly detailed',
  'extremely detailed',
  '4k',
  'hdr',
];

// ========== 真实摄影参数推荐词 ==========

const REAL_PHOTOGRAPHY_WORDS = [
  'shot on 35mm lens',
  'f/2.8',
  'subtle depth of field',
  'natural lighting',
  'soft rim light',
  'soft skin texture',
  'natural imperfections',
  'raw photo',
  'film stock',
  'Kodak Portra 400',
];

// ========== 负向提示词库 ==========

const NEGATIVE_PROMPT_BASE = [
  'smooth plastic skin',
  'oil painting texture',
  'circular artifacts',
  'banding',
  'oversaturated',
  'chromatic aberration',
  'digital noise',
  'oversharpened',
  'concentric rings',
  'oily skin',
  'waxy skin',
  'plastic texture',
  'jpeg artifacts',
  'edge overshoot',
  'color banding',
];

// ========== 胶片颗粒参数 ==========

const FILM_GRAIN_PRESETS = {
  kodakPortra400: {
    name: 'Kodak Portra 400',
    intensity: 0.04,
    blendMode: 'overlay',
    grainSize: 1,
    colorShift: { r: 5, g: 3, b: -2 },
  },
  kodakTriX400: {
    name: 'Kodak Tri-X 400',
    intensity: 0.06,
    blendMode: 'soft-light',
    grainSize: 1.5,
    colorShift: { r: 0, g: 0, b: 0 },
  },
  fujifilmPro400H: {
    name: 'Fujifilm Pro 400H',
    intensity: 0.03,
    blendMode: 'overlay',
    grainSize: 0.8,
    colorShift: { r: -3, g: 2, b: 5 },
  },
};

// ========== 核心函数 ==========

/**
 * 检测环状颗粒感风险
 */
function detectConcentricRisks(params) {
  const risks = [];
  let score = 0;

  // CFG过高
  if (params.cfg > 7) { risks.push({ field: 'cfg', value: params.cfg, issue: `CFG=${params.cfg}过高，超过5.5安全阈值`, fix: '降至3.0-5.5' }); score += 30; }
  else if (params.cfg > 5.5) { risks.push({ field: 'cfg', value: params.cfg, issue: `CFG=${params.cfg}偏高`, fix: '降至4.5左右' }); score += 15; }

  // 无CFG Rescale
  if (params.cfgRescale === undefined || params.cfgRescale === null) {
    if (params.cfg > 4) { risks.push({ field: 'cfgRescale', value: '未设置', issue: '高CFG下未启用CFG Rescale', fix: '设置为0.7左右' }); score += 15; }
  }

  // 直接大尺寸生成
  if (params.resolution) {
    const [w, h] = String(params.resolution).split(/[x×]/).map(Number);
    if (w && h && (w > 1280 || h > 1280)) {
      risks.push({ field: 'resolution', value: params.resolution, issue: '直接大尺寸生成，潜空间注意力场不均匀', fix: '先用原生分辨率生成，再二阶段放大' }); score += 20;
    }
  }

  // Latent模式放大
  if (params.upscaleMode === 'latent') {
    risks.push({ field: 'upscaleMode', value: 'latent', issue: 'Latent模式放大将低频噪点放大为同心圆斑', fix: '改用模型放大(RealESRGAN/4x-UltraSharp)+低降噪重绘' }); score += 25;
  }

  return { score: Math.min(score, 100), risks, type: ARTIFACT_TYPES.concentricRings };
}

/**
 * 检测塑料油润感风险
 */
function detectPlasticOilyRisks(params) {
  const risks = [];
  let score = 0;

  // 原生VAE
  if (params.vae === 'native' || !params.vae) {
    risks.push({ field: 'vae', value: params.vae || 'native', issue: '原生VAE反卷积导致棋盘格伪影', fix: '切换为vae-ft-mse-840000-ema' }); score += 25;
  }

  // 画质玄学词
  if (params.positivePrompt) {
    const voodooFound = QUALITY_VOODOO_WORDS.filter(w =>
      params.positivePrompt.toLowerCase().includes(w.toLowerCase())
    );
    if (voodooFound.length > 0) {
      risks.push({ field: 'positivePrompt', value: voodooFound, issue: `包含${voodooFound.length}个画质玄学词，激活训练集中被锐化过度的高权重图`, fix: '移除这些词，改用真实摄影参数' }); score += 20;
    }
  }

  // 无二阶段重绘
  if (params.denoisingStrength === undefined || params.denoisingStrength === null) {
    if (params.upscale || params.resolution?.includes('2048') || params.resolution?.includes('4k')) {
      risks.push({ field: 'denoisingStrength', value: '未设置', issue: '放大后无低降噪重绘，微观纹理缺失', fix: '设置0.25-0.38，步数15-20' }); score += 15;
    }
  }

  // Tiled VAE配置不当
  if (params.tiledVAE) {
    if (params.tileSize && params.tileSize < 1024) {
      risks.push({ field: 'tileSize', value: params.tileSize, issue: 'Tiled VAE tile size过小', fix: '设为1024或更高' }); score += 10;
    }
    if (params.overlap && params.overlap < 64) {
      risks.push({ field: 'overlap', value: params.overlap, issue: 'Tiled VAE overlap过小，拼缝处周期性循环噪斑', fix: '设为64-128像素' }); score += 10;
    }
  }

  return { score: Math.min(score, 100), risks, type: ARTIFACT_TYPES.plasticOily };
}

/**
 * 检测数码过拟合味风险
 */
function detectDigitalOverfittingRisks(params) {
  const risks = [];
  let score = 0;

  // 步数过多
  if (params.steps > 50) { risks.push({ field: 'steps', value: params.steps, issue: `步数=${params.steps}过多，导致过锐化纹理震荡`, fix: '降至28-35步' }); score += 25; }
  else if (params.steps > 35) { risks.push({ field: 'steps', value: params.steps, issue: `步数=${params.steps}偏多`, fix: '降至30步左右' }); score += 10; }

  // 步数过少
  if (params.steps && params.steps < 20) { risks.push({ field: 'steps', value: params.steps, issue: `步数=${params.steps}过少，去噪不充分产生伪影`, fix: '升至28步以上' }); score += 15; }

  // 采样器不当
  if (params.sampler && !RECOMMENDED_CONFIGS.sdxl.samplers.some(s => params.sampler.toLowerCase().includes(s.toLowerCase().split(' ')[0]))) {
    // 不强制，但给出建议
    if (!['dpm', 'euler', 'unipc', 'lms'].some(s => params.sampler.toLowerCase().includes(s))) {
      risks.push({ field: 'sampler', value: params.sampler, issue: `采样器${params.sampler}非推荐组合`, fix: '改用DPM++ 2M Karras/Euler/UniPC' }); score += 10;
    }
  }

  // 无后期处理
  if (!params.postProcessing || !params.filmGrain) {
    risks.push({ field: 'postProcessing', value: '未设置', issue: '无胶片颗粒Overlay，AI规则微型圆圈未被打散', fix: '叠加3-6%真实扫描胶片颗粒，混合模式Overlay/Soft Light' }); score += 15;
  }

  // 无De-banding
  if (!params.debanding) {
    risks.push({ field: 'debanding', value: '未设置', issue: '渐变区域可能出现色带', fix: '应用轻微高斯抖动(Dithering)或0.5px表面模糊' }); score += 10;
  }

  return { score: Math.min(score, 100), risks, type: ARTIFACT_TYPES.digitalOverfitting };
}

/**
 * 综合伪影检测
 */
function detectArtifacts(params) {
  const concentric = detectConcentricRisks(params);
  const plastic = detectPlasticOilyRisks(params);
  const digital = detectDigitalOverfittingRisks(params);

  const overallScore = Math.round(
    concentric.score * 0.4 + plastic.score * 0.4 + digital.score * 0.2
  );

  let level = 'low';
  if (overallScore >= 60) level = 'high';
  else if (overallScore >= 30) level = 'medium';

  const allRisks = [...concentric.risks, ...plastic.risks, ...digital.risks]
    .sort((a, b) => {
      const scoreMap = { cfg: 30, vae: 25, steps: 25, upscaleMode: 25 };
      return (scoreMap[b.field] || 10) - (scoreMap[a.field] || 10);
    });

  return {
    overallScore,
    level,
    categories: { concentric, plastic, digital },
    risks: allRisks,
    pass: overallScore < 30,
  };
}

/**
 * 生成最优生图参数推荐
 */
function recommendParams(options = {}) {
  const model = options.model || 'sdxl';
  const config = RECOMMENDED_CONFIGS[model] || RECOMMENDED_CONFIGS.sdxl;

  return {
    model,
    cfg: config.cfg.optimal,
    cfgRange: `${config.cfg.min}-${config.cfg.max}`,
    steps: config.steps.optimal,
    stepsRange: `${config.steps.min}-${config.steps.max}`,
    sampler: config.samplers[0],
    samplerAlternatives: config.samplers.slice(1),
    vae: config.vae,
    baseResolution: config.baseResolution,
    cfgRescale: config.cfgRescale,
    dynamicThresholding: options.cfg > 5 ? '启用Mimic CFG动态阈值' : null,
    notes: [
      'CFG控制在安全范围内，避免潜变量超出正态分布阈值',
      'Karras调度器在去噪末期分配更密集步数，平滑微观收敛',
      '原生分辨率生成，潜空间注意力场分布最均匀',
    ],
  };
}

/**
 * 生成负向提示词
 */
function generateNegativePrompt(options = {}) {
  const base = [...NEGATIVE_PROMPT_BASE];

  if (options.includeAnatomy) {
    base.push('bad anatomy', 'bad hands', 'missing fingers', 'extra limbs');
  }
  if (options.includeQuality) {
    base.push('low quality', 'worst quality', 'blurry', 'out of focus');
  }
  if (options.includeAsianCliche) {
    base.push('china town style', 'red lanterns everywhere', 'dragon pattern overload', 'calligraphy title');
  }

  return {
    prompt: base.join(', '),
    count: base.length,
    categories: {
      artifacts: NEGATIVE_PROMPT_BASE.length,
      anatomy: options.includeAnatomy ? 4 : 0,
      quality: options.includeQuality ? 4 : 0,
      asianCliche: options.includeAsianCliche ? 4 : 0,
    },
  };
}

/**
 * 生成正向提示词建议（移除玄学词，加入真实摄影参数）
 */
function recommendPositivePrompt(originalPrompt = '') {
  const voodooFound = QUALITY_VOODOO_WORDS.filter(w =>
    originalPrompt.toLowerCase().includes(w.toLowerCase())
  );

  const cleaned = voodooFound.reduce((prompt, word) => {
    const regex = new RegExp(word, 'gi');
    return prompt.replace(regex, '').replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
  }, originalPrompt);

  const recommendedAdditions = REAL_PHOTOGRAPHY_WORDS.slice(0, 5);

  return {
    original: originalPrompt,
    voodooWordsFound: voodooFound,
    cleanedPrompt: cleaned,
    recommendedAdditions,
    finalSuggestion: cleaned ? `${cleaned}, ${recommendedAdditions.join(', ')}` : recommendedAdditions.join(', '),
    notes: voodooFound.length > 0
      ? `移除了${voodooFound.length}个画质玄学词，这些词会激活训练集中被锐化过度的高权重图`
      : '未发现画质玄学词',
  };
}

/**
 * 二阶段放大策略推荐
 */
function recommendUpscaleStrategy(options = {}) {
  const targetScale = options.scale || 2;
  const baseResolution = options.baseResolution || '1024x1024';

  return {
    phase1: {
      name: 'Base Generation',
      resolution: baseResolution,
      note: '在模型原生训练分辨率下生成，潜空间注意力场分布最均匀',
    },
    phase2: {
      name: 'Model Upscale',
      method: '物理超分辨率模型放大',
      recommendedModels: ['NMKD Superscale', '4x-UltraSharp', 'RealESRGAN_x4plus'],
      scale: targetScale,
      note: '不用Latent模式放大（直接插值Latent会将低频噪点放大为同心圆斑）',
      forbidden: 'latent upscale / nearest neighbor / bicubic',
    },
    phase3: {
      name: 'Low Denoise Redraw',
      method: '放大后的像素图重新编码回潜空间，低降噪重绘',
      denoisingStrength: { min: 0.25, max: 0.38, optimal: 0.3 },
      steps: { min: 15, max: 20, optimal: 18 },
      note: '借助扩散模型重新生成真实微观毛孔/纤维/环境杂色，洗去数码环状噪波',
    },
    workflow: 'Base Generation → Model Upscale → Low Denoise Redraw',
    criticalRule: '不要一步生成2K/4K，直接大尺寸生成必然导致重复注意力斑纹',
  };
}

/**
 * 后期处理建议
 */
function recommendPostProcessing(options = {}) {
  const filmPreset = FILM_GRAIN_PRESETS[options.filmStock] || FILM_GRAIN_PRESETS.kodakPortra400;

  return {
    filmGrain: {
      preset: filmPreset.name,
      intensity: { min: 0.03, max: 0.06, recommended: filmPreset.intensity },
      blendMode: filmPreset.blendMode,
      grainSize: filmPreset.grainSize,
      colorShift: filmPreset.colorShift,
      note: '真实的不规则噪点能立刻打散AI的规则微型圆圈；3-6%强度，混合模式Overlay或Soft Light',
    },
    debanding: {
      method: '轻微高斯抖动(Dithering)或0.5px表面模糊(Surface Blur)',
      note: 'AI在渐变区域容易出现色带与环状伪影；应用抖动后再压回输出曲线，让光影渐变恢复物理连续性',
    },
    colorSpace: {
      recommendation: '输出时使用16位色深中间处理，最终压回8位',
      note: '8位色深在渐变区域容易出现色带，16位中间处理可减少banding',
    },
    workflow: 'Film Grain Overlay → De-banding → Color Space Correction → Final Output',
  };
}

/**
 * 一站式审计：输入生图参数→风险评分+完整修复方案
 */
function fullAudit(params = {}) {
  const detection = detectArtifacts(params);
  const recommended = recommendParams({ model: params.model });
  const negativePrompt = generateNegativePrompt({
    includeAnatomy: params.includeAnatomy,
    includeQuality: params.includeQuality,
    includeAsianCliche: params.includeAsianCliche,
  });
  const positivePrompt = recommendPositivePrompt(params.positivePrompt);
  const upscaleStrategy = recommendUpscaleStrategy({ scale: params.targetScale });
  const postProcessing = recommendPostProcessing({ filmStock: params.filmStock });

  const actionItems = detection.risks.slice(0, 5).map((risk, i) => ({
    priority: i + 1,
    field: risk.field,
    issue: risk.issue,
    fix: risk.fix,
  }));

  return {
    riskScore: detection.overallScore,
    riskLevel: detection.level,
    pass: detection.pass,
    categoryScores: {
      concentricRings: detection.categories.concentric.score,
      plasticOily: detection.categories.plastic.score,
      digitalOverfitting: detection.categories.digital.score,
    },
    risks: detection.risks,
    actionItems,
    recommendedParams: recommended,
    negativePrompt: negativePrompt.prompt,
    positivePromptSuggestion: positivePrompt,
    upscaleStrategy,
    postProcessing,
    summary: detection.pass
      ? `生图参数风险较低（${detection.overallScore}/100），三类伪影均在可控范围内`
      : `生图参数存在${detection.level}风险（${detection.overallScore}/100），建议优先修复${actionItems.length}项问题`,
  };
}

// ========== 提示词工程方法论（11卡实证） ==========

// 6段式提示词结构关键词库
const SIX_SEGMENT_KEYWORDS = {
  subject: {
    name: '主体',
    nameEn: 'Subject',
    keywords: [
      'a ', '一只', '一位', '一个', '巨大的', '巨型', '宋代', '唐代', '女子', '男子',
      '龙', '凤', '虎', '龟', '朱雀', '白虎', '青龙', '玄武', '神兽', '仙人',
      '人物', '主体', '主体是', '身着', '身穿', '头戴', '手持',
    ],
  },
  scene: {
    name: '场景',
    nameEn: 'Scene',
    keywords: [
      '坐在', '站在', '走在', '飞在', '躺在', '在', '云海', '宫殿', '庭院',
      '廊下', '山间', '水面', '雪中', '雨中', '雾中', '天空', '屋顶', '门前',
      '场景', '环境', '背景', '周围', '漂浮', '悬浮', '矗立',
    ],
  },
  composition: {
    name: '构图',
    nameEn: 'Composition',
    keywords: [
      '视角', '构图', '近景', '远景', '全景', '特写', '半身', '全身',
      '仰视', '俯视', '平视', '鸟瞰', '超广角', '广角', '长焦', '微距',
      '三分之四', '越肩', '主观', '中心构图', '三分法', '对称', '引导线',
      '前中后景', '前景', '中景', '背景', 'tracking', 'close-up', 'wide shot',
      'low-angle', 'high-angle', 'eye-level', 'three-quarter', 'overhead',
    ],
  },
  lighting: {
    name: '光线',
    nameEn: 'Lighting',
    keywords: [
      '光', '逆光', '侧光', '顺光', '顶光', '轮廓光', '体积光', '体积云',
      '丁达尔', '晨光', '黄昏', '月光', '日光', '金色', '冷蓝', '暖金',
      '色温', '对比', '反差', '漫射', '反射光', '伦勃朗', '明暗对照',
      'backlight', 'side light', 'rim light', 'volumetric', 'golden hour',
      'natural light', 'soft light', 'warm color', 'cool color',
    ],
  },
  texture: {
    name: '质感',
    nameEn: 'Texture',
    keywords: [
      '质感', '胶片', '电影', '摄影', '写实', '写实感', '真实', '高清',
      '颗粒', '柔焦', '浅景深', '景深', '抓拍', '纪实', '剧照',
      'skin texture', 'pores', 'film grain', 'depth of field', 'candid',
      'documentary', 'cinematic', 'photography', 'film still', 'unretouched',
      '皮肤纹理', '毛孔', '胶片颗粒', '镜头柔光', '摄影质感',
    ],
  },
  params: {
    name: '参数',
    nameEn: 'Parameters',
    keywords: [
      '--ar', '--stylize', '--v ', '--v8', '--v 8', '--raw', '--s ', '--hd',
      '--chaos', '--tile', 'aspect ratio',
    ],
  },
};

// 反塑料感具体质感词（11卡实证）
const ANTI_PLASTIC_KEYWORDS = [
  'unretouched', 'beautiful but unretouched',
  'realistic skin texture', '真实皮肤纹理',
  'subtle pores', '细微毛孔',
  'natural skin translucency', '自然通透感',
  'natural facial asymmetry', '自然面部差异',
  'subtle film grain', '轻微胶片颗粒',
  'shallow depth of field', '浅景深',
  'natural lens bloom', '自然镜头柔光',
  'candid photography', '抓拍感', 'candid',
  'documentary photography', '纪实摄影', 'documentary',
  'cinematic film still', '电影剧照',
  'analog film aesthetic', '胶片美学',
  'natural imperfections',
  'raw photo', 'film stock',
  '35mm', '50mm', '85mm', '100mm macro',
];

// 仅画质玄学词（不能替代具体质感描述）
const PLASTIC_VOODOO_WORDS = [
  ...QUALITY_VOODOO_WORDS,
  '4k', '8k', 'hd', 'uhd',
  'best quality', 'amazing', 'beautiful', 'gorgeous',
  'ultra detailed', 'high resolution', 'highly detailed',
];

/**
 * 校验prompt的6段式结构完整性
 * @param {string} prompt - 待校验的提示词
 * @returns {Object} 6段检测结果+完成度评分+缺失建议
 */
function validatePromptStructure(prompt = '') {
  const lower = prompt.toLowerCase();
  const segments = {};
  const missing = [];
  const present = [];

  for (const [segKey, segDef] of Object.entries(SIX_SEGMENT_KEYWORDS)) {
    const found = segDef.keywords.filter(kw => lower.includes(kw.toLowerCase()));
    segments[segKey] = {
      name: segDef.name,
      nameEn: segDef.nameEn,
      detected: found.length > 0,
      matchedKeywords: found.slice(0, 3),
    };
    if (found.length > 0) {
      present.push(segDef.name);
    } else {
      missing.push(segDef.name);
    }
  }

  // 参数位置检查：参数应在prompt末尾
  const hasParams = segments.params.detected;
  let paramsPosition = 'missing';
  if (hasParams) {
    const paramMatch = prompt.match(/--\w+/g);
    if (paramMatch) {
      const lastParamIdx = prompt.lastIndexOf(paramMatch[paramMatch.length - 1]);
      const trailingText = prompt.slice(lastParamIdx + paramMatch[paramMatch.length - 1].length).trim();
      // 参数后应只有其他参数或空白
      const hasExtraAfterParams = trailingText.length > 0 && !/^[\s,--\w\d.]+$/.test(trailingText);
      paramsPosition = hasExtraAfterParams ? 'misplaced' : 'end';
    }
  }

  const completeness = Math.round((present.length / 6) * 100);
  const pass = completeness >= 66 && paramsPosition !== 'misplaced';

  return {
    completeness,
    segments,
    presentSegments: present,
    missingSegments: missing,
    paramsPosition,
    pass,
    recommendations: missing.length > 0
      ? `缺少${missing.join('、')}段，建议按6段式补全（主体+场景+构图+光线+质感+参数）`
      : '6段结构完整',
    paramsNote: paramsPosition === 'misplaced'
      ? '参数位置不对，--ar/--s/--v等参数应统一放在prompt最后'
      : paramsPosition === 'end'
        ? '参数位置正确'
        : '未检测到Midjourney参数，建议末尾加 --ar 16:9 --v 8.2',
  };
}

/**
 * 检测prompt是否有塑料感（仅用画质玄学词无具体质感描述）
 * @param {string} prompt - 待检测的提示词
 * @returns {Object} 塑料感风险评分+玄学词检测+反塑料词检测+修复建议
 */
function detectPlasticPrompt(prompt = '') {
  const lower = prompt.toLowerCase();

  // 检测画质玄学词
  const voodooFound = PLASTIC_VOODOO_WORDS.filter(w =>
    lower.includes(w.toLowerCase())
  );

  // 检测具体反塑料质感词
  const antiPlasticFound = ANTI_PLASTIC_KEYWORDS.filter(w =>
    lower.includes(w.toLowerCase())
  );

  // 评分逻辑
  let riskScore = 0;
  const issues = [];

  // 有玄学词但无具体质感词 = 高塑料风险
  if (voodooFound.length > 0 && antiPlasticFound.length === 0) {
    riskScore += 60;
    issues.push({
      type: 'voodoo-only',
      message: `包含${voodooFound.length}个画质玄学词（${voodooFound.slice(0, 5).join(', ')}），但无具体皮肤/镜头/光线质感描述`,
      fix: '移除玄学词，改用realistic skin texture + shallow depth of field + natural lens bloom + subtle film grain',
    });
  } else if (voodooFound.length > 0) {
    riskScore += 20;
    issues.push({
      type: 'mixed',
      message: `包含${voodooFound.length}个画质玄学词，虽有${antiPlasticFound.length}个质感词，玄学词仍可能干扰`,
      fix: '建议移除玄学词只保留具体质感词',
    });
  }

  // 人像类prompt（含人/face/portrait/skin等）但无皮肤质感词 = 中风险
  const isPortrait = /(person|woman|man|girl|boy|portrait|face|skin|人|女|男|女子|男子|人像|面部)/i.test(prompt);
  const hasSkinTexture = /(skin texture|pores|unretouched|皮肤|毛孔|磨皮)/i.test(prompt);
  if (isPortrait && !hasSkinTexture && antiPlasticFound.length === 0) {
    riskScore += 25;
    issues.push({
      type: 'portrait-no-texture',
      message: '人像类prompt但无皮肤/质感描述词，容易生成塑料光滑脸',
      fix: '加入 realistic skin texture, subtle pores, natural facial asymmetry, unretouched editorial portrait',
    });
  }

  // 有反塑料词 = 降分
  if (antiPlasticFound.length > 0) {
    riskScore -= Math.min(antiPlasticFound.length * 8, 40);
  }

  // 有 unretouched = 强力降分
  if (/unretouched|beautiful but unretouched/.test(lower)) {
    riskScore -= 15;
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  let level = 'low';
  if (riskScore >= 50) level = 'high';
  else if (riskScore >= 25) level = 'medium';

  return {
    riskScore,
    riskLevel: level,
    pass: riskScore < 25,
    voodooWordsFound: voodooFound,
    antiPlasticWordsFound: antiPlasticFound,
    isPortraitPrompt: isPortrait,
    issues,
    recommendation: level === 'high'
      ? '塑料感风险高：移除画质玄学词，加入具体皮肤纹理+镜头参数+光线方向+胶片颗粒，人像加beautiful but unretouched'
      : level === 'medium'
        ? '塑料感风险中等：建议移除玄学词，补充1-2个具体质感描述词'
        : '塑料感风险低：prompt已包含具体质感描述',
  };
}

// ========== 导出 ==========

export {
  ARTIFACT_TYPES,
  RECOMMENDED_CONFIGS,
  QUALITY_VOODOO_WORDS,
  REAL_PHOTOGRAPHY_WORDS,
  NEGATIVE_PROMPT_BASE,
  FILM_GRAIN_PRESETS,
  SIX_SEGMENT_KEYWORDS,
  ANTI_PLASTIC_KEYWORDS,
  detectConcentricRisks,
  detectPlasticOilyRisks,
  detectDigitalOverfittingRisks,
  detectArtifacts,
  recommendParams,
  generateNegativePrompt,
  recommendPositivePrompt,
  recommendUpscaleStrategy,
  recommendPostProcessing,
  fullAudit,
  validatePromptStructure,
  detectPlasticPrompt,
};
