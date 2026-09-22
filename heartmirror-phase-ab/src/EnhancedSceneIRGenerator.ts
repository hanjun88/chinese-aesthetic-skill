// EnhancedSceneIRGenerator - 从图像特征生成可执行的 Scene IR
import type {
  AttachmentIR,
  ColorDistribution,
  DepthSignature,
  DrawCallIR,
  EffectIR,
  EnhancedImageFeatures,
  LightingSignature,
  MotionSignature,
  RenderPassIR,
  RenderPipelineIR,
  ResourceBindingIR,
  SceneIRMetadata,
  SceneIRNode,
  SceneQuality,
  ShaderIR,
  ShaderStage,
  ShaderValidationResult,
  ShadowSignature,
  SpatialSignature,
  TextureIR,
  TextureSignature,
  TransformIR,
  ValidationResult,
  Viewport,
} from './types';

export interface SceneIRGenerationOptions {
  width?: number;
  height?: number;
  quality?: SceneQuality;
  format?: 'webp' | 'png' | 'jpeg' | 'avif';
  generateMipmaps?: boolean;
  enableEffects?: boolean;
  originalMetadata?: Record<string, unknown>;
}

const QUALITY_TEXTURE_SIZE: Record<SceneQuality, number> = {
  low: 32,
  medium: 64,
  high: 128,
  ultra: 256,
};

const DEFAULT_OPTIONS: Required<Pick<SceneIRGenerationOptions, 'width' | 'height' | 'quality' | 'format' | 'generateMipmaps' | 'enableEffects'>> = {
  width: 1920,
  height: 1080,
  quality: 'medium',
  format: 'webp',
  generateMipmaps: true,
  enableEffects: true,
};

export class EnhancedSceneIRGenerator {
  static async generateSceneIR(
    features: EnhancedImageFeatures,
    options: SceneIRGenerationOptions = {}
  ): Promise<SceneIRNode> {
    const normalized = this.normalizeFeatures(features);
    const resolvedOptions = this.resolveOptions(options);
    this.validateInput(normalized, resolvedOptions);

    const texture = this.generateColorTexture(normalized, resolvedOptions);
    const vertexShader = this.generateVertexShader(normalized);
    const fragmentShader = this.generateFragmentShader(normalized);
    const renderPass = this.buildRenderPass(vertexShader, fragmentShader, texture, resolvedOptions);
    const scene = this.buildScene(normalized, renderPass, resolvedOptions);

    const validation = this.validateSceneIR(scene);
    if (!validation.isValid) {
      throw new Error(`Scene IR 验证失败: ${validation.errors.join('; ')}`);
    }

    return scene;
  }

  /** 生成与输入特征绑定的确定性颜色纹理。 */
  static generateColorTexture(
    features: EnhancedImageFeatures,
    options: SceneIRGenerationOptions = {}
  ): TextureIR {
    const normalized = this.normalizeFeatures(features);
    const resolvedOptions = this.resolveOptions(options);
    const size = QUALITY_TEXTURE_SIZE[resolvedOptions.quality];
    const data = this.generateColorTextureData(normalized, size, size);

    return {
      id: this.makeId('texture', normalized),
      format: 'RGBA',
      width: size,
      height: size,
      data,
      minFilter: resolvedOptions.generateMipmaps ? 'LINEAR_MIPMAP_LINEAR' : 'LINEAR',
      magFilter: 'LINEAR',
      wrapS: 'CLAMP_TO_EDGE',
      wrapT: 'CLAMP_TO_EDGE',
      mipmap: resolvedOptions.generateMipmaps,
      usage: ['SAMPLED_TEXTURE', 'COLOR_ATTACHMENT'],
    };
  }

  /** 纹理数据完全由特征和坐标决定，便于缓存、重放和测试。 */
  static generateColorTextureData(
    features: EnhancedImageFeatures,
    width = QUALITY_TEXTURE_SIZE.medium,
    height = QUALITY_TEXTURE_SIZE.medium
  ): Uint8Array {
    const normalized = this.normalizeFeatures(features);
    this.validateTextureDimensions(width, height);

    const color = normalized.colorDistribution ?? this.calculateColorDistribution(normalized);
    const spatial = normalized.spatialSignature ?? this.calculateSpatialSignature(normalized);
    const texture = normalized.textureSignature ?? this.calculateTextureSignature(normalized);
    const data = new Uint8Array(width * height * 4);
    const frequency = 1 + spatial.dominantFrequency * 3;
    const angle = spatial.dominantDirection * Math.PI / 180;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const seed = this.featureSeed(normalized);

    for (let y = 0; y < height; y += 1) {
      const ny = height <= 1 ? 0 : y / (height - 1);
      for (let x = 0; x < width; x += 1) {
        const nx = width <= 1 ? 0 : x / (width - 1);
        const rotatedX = nx * cosAngle - ny * sinAngle;
        const rotatedY = nx * sinAngle + ny * cosAngle;
        const wave = 0.5 + 0.5 * Math.sin((rotatedX * frequency + rotatedY * frequency * 0.65) * Math.PI * 2);
        const grain = this.deterministicNoise(x, y, seed) * (0.18 + texture.entropy * 0.24);
        const radial = Math.sqrt((nx - spatial.centroid.x) ** 2 + (ny - spatial.centroid.y) ** 2);
        const falloff = Math.max(0, 1 - radial * 0.85);
        const lighting = 0.82 + falloff * 0.18 + (normalized.lightingSignature?.illuminance ?? 0) * 0.08;

        const r = this.clamp01(color.r * (0.72 + wave * 0.28) + grain * 0.12 + lighting - 1) * 255;
        const g = this.clamp01(color.g * (0.72 + wave * 0.28) + grain * 0.1 + lighting - 1) * 255;
        const b = this.clamp01(color.b * (0.72 + wave * 0.28) + grain * 0.08 + lighting - 1) * 255;
        const offset = (y * width + x) * 4;
        data[offset] = Math.round(r);
        data[offset + 1] = Math.round(g);
        data[offset + 2] = Math.round(b);
        data[offset + 3] = 255;
      }
    }

    return data;
  }

  static generateVertexShader(features: EnhancedImageFeatures): ShaderIR {
    const normalized = this.normalizeFeatures(features);
    const source = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec4 a_color;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_rotation;
uniform float u_time;

out vec4 v_color;
out vec2 v_texCoord;
out float v_angle;

void main() {
  vec4 localPosition = vec4(a_position, 0.0, 1.0);
  float c = cos(u_rotation);
  float s = sin(u_rotation);
  mat2 rotationMatrix = mat2(c, -s, s, c);
  localPosition.xy = rotationMatrix * localPosition.xy;
  vec4 worldPosition = u_model * localPosition;
  vec4 viewPosition = u_view * worldPosition;
  gl_Position = u_projection * viewPosition;

  v_angle = atan(viewPosition.y, viewPosition.x);
  v_texCoord = (localPosition.xy + vec2(1.0, 1.0)) * 0.5;
  v_color = a_color;
}`;

    return {
      id: this.makeId('vertex_shader', normalized),
      language: 'GLSL',
      type: 'vertex',
      source,
      entryPoint: 'main',
      glslVersion: '300 es',
      defines: this.makeDefines(normalized),
      attributes: {
        a_position: { type: 'vec2', size: 2 },
        a_color: { type: 'vec4', size: 4 },
      },
      varyings: {
        v_color: { type: 'vec4', interpolation: 'smooth' },
        v_texCoord: { type: 'vec2', interpolation: 'smooth' },
        v_angle: { type: 'float', interpolation: 'flat' },
      },
      uniforms: {
        u_model: { type: 'mat4', value: null },
        u_view: { type: 'mat4', value: null },
        u_projection: { type: 'mat4', value: null },
        u_rotation: { type: 'float', value: normalized.spatialOrientation * Math.PI / 180 },
        u_time: { type: 'float', value: 0 },
      },
      textures: [],
      samplers: [],
      validation: this.validateShaderSource(source, 'vertex'),
    };
  }

  static generateFragmentShader(features: EnhancedImageFeatures): ShaderIR {
    const normalized = this.normalizeFeatures(features);
    const source = `#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_texCoord;
in float v_angle;

uniform sampler2D u_texture;
uniform float u_time;
uniform float u_complexity;
uniform vec3 u_colorPrimary;
uniform float u_spatialFrequency;

out vec4 fragColor;

void main() {
  vec4 texColor = texture(u_texture, v_texCoord);
  float angleFactor = sin(v_angle * 10.0) * 0.5 + 0.5;
  float complexityFactor = mix(0.5, 1.5, clamp(u_complexity, 0.0, 1.0));
  float spatialFactor = 0.85 + 0.15 * sin(v_texCoord.x * u_spatialFrequency * 6.28318530718);
  vec3 finalColor = mix(u_colorPrimary, texColor.rgb, 0.72) * spatialFactor;
  float timeFactor = sin(u_time * 0.001) * 0.06;
  finalColor *= 1.0 + timeFactor * angleFactor * complexityFactor;
  float edgeFactor = smoothstep(0.4, 0.6, abs(fract(v_angle / 6.28318530718) - 0.5));
  finalColor = mix(finalColor, vec3(1.0), edgeFactor * 0.12);
  fragColor = vec4(finalColor, texColor.a);
}`;

    return {
      id: this.makeId('fragment_shader', normalized),
      language: 'GLSL',
      type: 'fragment',
      source,
      entryPoint: 'main',
      glslVersion: '300 es',
      defines: this.makeDefines(normalized),
      uniforms: {
        u_texture: { type: 'sampler2D', value: 'u_texture', binding: 0 },
        u_time: { type: 'float', value: 0 },
        u_complexity: { type: 'float', value: normalized.complexity },
        u_colorPrimary: { type: 'vec3', value: [normalized.colorHistogram.r, normalized.colorHistogram.g, normalized.colorHistogram.b] },
        u_spatialFrequency: { type: 'float', value: normalized.spatialSignature?.dominantFrequency ?? 0.5 },
      },
      textures: ['u_texture'],
      samplers: ['u_texture'],
      validation: this.validateShaderSource(source, 'fragment'),
    };
  }

  static buildRenderPass(
    vertexShader: ShaderIR,
    fragmentShader: ShaderIR,
    texture: TextureIR,
    options: SceneIRGenerationOptions = {}
  ): RenderPassIR {
    const resolvedOptions = this.resolveOptions(options);
    const viewport: Viewport = {
      x: 0,
      y: 0,
      width: resolvedOptions.width,
      height: resolvedOptions.height,
      minDepth: 0,
      maxDepth: 1,
    };
    const pipeline: RenderPipelineIR = {
      primitive: 'TRIANGLES',
      cullMode: 'NONE',
      depthTest: true,
      depthWrite: true,
      blend: {
        enable: true,
        srcRGB: 'SRC_ALPHA',
        dstRGB: 'ONE_MINUS_SRC_ALPHA',
        srcAlpha: 'ONE',
        dstAlpha: 'ONE_MINUS_SRC_ALPHA',
      },
    };
    const attachments: AttachmentIR[] = [
      {
        target: 'COLOR_ATTACHMENT0',
        format: 'RGBA',
        loadOp: 'CLEAR',
        storeOp: 'STORE',
        clearValue: { r: 0.04, g: 0.04, b: 0.05, a: 1 },
        textureId: texture.id,
        samples: 1,
        resolve: { texture, mipLevel: 0, arrayLayer: 0 },
      },
      {
        target: 'DEPTH_ATTACHMENT',
        format: 'DEPTH',
        loadOp: 'CLEAR',
        storeOp: 'DONT_CARE',
        clearValue: { r: 1, g: 1, b: 1, a: 1 },
        samples: 1,
      },
    ];

    return {
      id: this.makeId('render_pass', { ...this.normalizeFeatures({ colorHistogram: { r: 0.5, g: 0.5, b: 0.5 }, aspectRatio: 1, spatialOrientation: 0, complexity: 0.5, metadata: {} }), ...resolvedOptions }),
      name: 'Enhanced Scene Render Pass',
      shaders: [vertexShader, fragmentShader],
      textures: [texture],
      attachments,
      viewport,
      pipeline,
    };
  }

  static buildScene(
    features: EnhancedImageFeatures,
    renderPass: RenderPassIR,
    options: SceneIRGenerationOptions = {}
  ): SceneIRNode {
    const normalized = this.normalizeFeatures(features);
    const resolvedOptions = this.resolveOptions(options);
    const originalMetadata = options.originalMetadata;
    const texture = renderPass.textures[0];
    if (!texture) {
      throw new Error('Render pass 必须包含颜色纹理');
    }
    const vertexShader = renderPass.shaders.find(shader => shader.type === 'vertex');
    const fragmentShader = renderPass.shaders.find(shader => shader.type === 'fragment');
    if (!vertexShader || !fragmentShader) {
      throw new Error('Render pass 必须包含 vertex 与 fragment shader');
    }

    const effects = resolvedOptions.enableEffects ? this.createEffects(normalized) : [];
    const drawCalls = this.createDrawCalls(normalized, renderPass, vertexShader, fragmentShader, texture, effects);
    const resources = this.createResourceBindings(texture, vertexShader, fragmentShader);
    const transform = this.createTransform(normalized, resolvedOptions.width, resolvedOptions.height);
    const signatures = this.createSignatures(normalized);
    const frame = {
      id: 'frame-1',
      width: resolvedOptions.width,
      height: resolvedOptions.height,
      orientation: normalized.spatialOrientation,
      styleParams: {
        colorPrimary: normalized.colorHistogram,
        aspectRatio: normalized.aspectRatio,
        complexity: normalized.complexity,
        colorDistribution: signatures.colorDistribution,
        spatialSignature: signatures.spatial,
        textureSignature: signatures.texture,
        lightingSignature: signatures.lighting,
        motionSignature: signatures.motion,
        depthSignature: signatures.depth,
        shadowSignature: signatures.shadow,
      },
      transform,
      effects,
      renderPassId: renderPass.id,
      drawCallIds: drawCalls.map(drawCall => drawCall.id),
    };
    const enhancedMetadata: SceneIRMetadata = {
      generatedAt: new Date().toISOString(),
      source: 'aesthetic-engine',
      version: '2.0.0',
      algorithm: 'enhanced-scene-ir-generator-v2.0',
      featureFingerprint: this.featureFingerprint(normalized),
      quality: resolvedOptions.quality,
      format: resolvedOptions.format,
      dimensions: { width: resolvedOptions.width, height: resolvedOptions.height },
      signatures,
    };
    // 使用原始元数据作为场景 metadata，保持与旧版本兼容
    const sceneMetadata = originalMetadata ?? enhancedMetadata;
    const scene: SceneIRNode = {
      id: this.makeId('scene', normalized),
      type: 'Scene',
      version: '1.0.0',
      width: resolvedOptions.width,
      height: resolvedOptions.height,
      frames: [frame],
      textures: [texture],
      shaders: [vertexShader, fragmentShader],
      renderPass,
      drawCalls,
      resources,
      data: {
        scene: {
          width: resolvedOptions.width,
          height: resolvedOptions.height,
          frames: [frame],
          renderPass,
          drawCalls,
          resources,
          effects,
          // 额外的增强版元数据，不影响旧版本兼容性
          enhancedMetadata,
        },
      },
      metadata: sceneMetadata,
    };

    return scene;
  }

  static validateSceneIR(scene: SceneIRNode): ValidationResult {
    const errors: string[] = [];
    if (!scene.id || !scene.version || scene.type !== 'Scene') {
      errors.push('Scene IR 缺少有效的场景身份或版本');
    }
    if (!Number.isInteger(scene.width) || scene.width <= 0 || !Number.isInteger(scene.height) || scene.height <= 0) {
      errors.push('Scene IR 尺寸无效');
    }
    if (!Array.isArray(scene.frames) || scene.frames.length === 0) {
      errors.push('Scene IR 必须包含至少一个 frame');
    }
    if (!scene.renderPass || scene.renderPass.shaders.length < 2 || scene.renderPass.textures.length < 1) {
      errors.push('Scene IR 渲染管线不完整');
    }
    if (!Array.isArray(scene.drawCalls) || scene.drawCalls.length === 0) {
      errors.push('Scene IR 必须包含 Draw Call 序列');
    }
    for (const shader of scene.shaders) {
      if (!shader.validation?.isValid) {
        errors.push(`Shader ${shader.id} 未通过静态验证`);
      }
    }
    for (const drawCall of scene.drawCalls) {
      if (drawCall.instances <= 0 || drawCall.bindings.length === 0) {
        errors.push(`Draw Call ${drawCall.id} 资源绑定无效`);
      }
    }
    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  static validateShaderSource(source: string, stage: ShaderStage): ShaderValidationResult {
    const checks: Record<string, boolean> = {
      hasVersion: source.includes('#version 300 es'),
      hasPrecision: source.includes('precision highp float'),
      hasEntryPoint: source.includes('void main()'),
      hasNoLegacyTextureCall: !source.includes('texture2D('),
      hasNoLegacyFragmentOutput: !source.includes('gl_FragColor'),
      balancedBraces: this.hasBalancedBraces(source),
    };
    const errors: string[] = [];
    if (stage === 'vertex') {
      checks.hasPositionOutput = source.includes('gl_Position');
      checks.hasVertexInput = source.includes(' in vec2 a_position');
      if (!checks.hasPositionOutput) errors.push('vertex shader 缺少 gl_Position');
      if (!checks.hasVertexInput) errors.push('vertex shader 缺少 a_position 输入');
    } else if (stage === 'fragment') {
      checks.hasFragmentOutput = source.includes('out vec4 fragColor');
      checks.hasTextureLookup = source.includes('texture(u_texture');
      if (!checks.hasFragmentOutput) errors.push('fragment shader 缺少 fragColor 输出');
      if (!checks.hasTextureLookup) errors.push('fragment shader 缺少纹理采样');
    }
    for (const [check, passed] of Object.entries(checks)) {
      if (!passed && !check.startsWith('hasPositionOutput') && !check.startsWith('hasVertexInput') && !check.startsWith('hasFragmentOutput') && !check.startsWith('hasTextureLookup')) {
        errors.push(`GLSL 静态检查失败: ${check}`);
      }
    }
    return { isValid: errors.length === 0, errors, checks };
  }

  static normalizeFeatures(features: EnhancedImageFeatures): EnhancedImageFeatures {
    if (!features || typeof features !== 'object') {
      throw new Error('Enhanced image features cannot be null');
    }
    const colorDistribution = features.colorDistribution ?? this.calculateColorDistribution(features);
    const spatialSignature = features.spatialSignature ?? this.calculateSpatialSignature(features);
    const textureSignature = features.textureSignature ?? this.calculateTextureSignature(features);
    const lightingSignature = features.lightingSignature ?? this.calculateLightingSignature(features);
    const motionSignature = features.motionSignature ?? this.calculateMotionSignature(features);
    const depthSignature = features.depthSignature ?? this.calculateDepthSignature(features);
    const shadowSignature = features.shadowSignature ?? this.calculateShadowSignature(features);

    return {
      ...features,
      colorDistribution,
      spatialSignature,
      textureSignature,
      lightingSignature,
      motionSignature,
      depthSignature,
      shadowSignature,
      metadata: {
        ...features.metadata,
        processingPipeline: features.metadata.processingPipeline ?? 'enhanced-scene-ir-v2.0',
        algorithmVersion: features.metadata.algorithmVersion ?? '2.0.0',
      },
    };
  }

  static calculateColorDistribution(features: EnhancedImageFeatures): ColorDistribution {
    const { r, g, b } = features.colorHistogram;
    const value = Math.max(r, g, b);
    const saturation = value === 0 ? 0 : (value - Math.min(r, g, b)) / value;
    return {
      r,
      g,
      b,
      luminance: 0.2126 * r + 0.7152 * g + 0.0722 * b,
      saturation,
      value,
    };
  }

  static calculateSpatialSignature(features: EnhancedImageFeatures): SpatialSignature {
    const angle = this.clamp(features.spatialOrientation, 0, 360);
    const radians = angle * Math.PI / 180;
    return {
      dominantDirection: angle,
      dominantFrequency: 0.25 + features.complexity * 0.75,
      anisotropy: Math.abs(Math.cos(radians)),
      circularity: 1 - Math.abs(Math.sin(radians)) * 0.5,
      centroid: { x: 0.5, y: 0.5 },
      extent: { width: features.aspectRatio, height: 1 },
    };
  }

  static calculateTextureSignature(features: EnhancedImageFeatures): TextureSignature {
    const complexity = this.clamp(features.complexity, 0, 1);
    return {
      lbpUniform: 0.35 + complexity * 0.55,
      glcmContrast: complexity * 0.3,
      glcmDissimilarity: complexity * 0.4,
      glcmHomogeneity: (1 - complexity) * 0.6,
      haralickCorrelation: complexity * 0.2,
      entropy: 0.15 + complexity * 0.75,
    };
  }

  static calculateLightingSignature(features: EnhancedImageFeatures): LightingSignature {
    const distribution = this.calculateColorDistribution(features);
    return {
      illuminance: distribution.luminance,
      dominantWavelength: 550 + (features.colorHistogram.r - features.colorHistogram.g) * 50,
      colorTemperature: 5500 + (features.colorHistogram.b - features.colorHistogram.r) * 200,
      chromaticAdaptation: { a: 1, b: 0, c: 0 },
    };
  }

  static calculateMotionSignature(features: EnhancedImageFeatures): MotionSignature {
    return {
      opticFlowMagnitude: features.complexity * 0.8,
      opticFlowDirection: features.spatialOrientation,
      motionBlur: features.complexity * 0.3,
      temporalFrequency: 30 + features.complexity * 20,
      acceleration: features.complexity * 0.5,
    };
  }

  static calculateDepthSignature(features: EnhancedImageFeatures): DepthSignature {
    return {
      disparity: (1 - features.complexity) * 100,
      focusDistance: 500 + features.complexity * 200,
      depthRange: { near: 100, far: 1000 + features.complexity * 500 },
      depthGradient: features.complexity * 0.4,
      defocusAmount: (1 - features.complexity) * 0.8,
    };
  }

  static calculateShadowSignature(features: EnhancedImageFeatures): ShadowSignature {
    return {
      shadowRatio: (1 - features.complexity) * 0.4,
      shadowDirection: (features.spatialOrientation + 90) % 360,
      shadowSoftness: (1 - features.complexity) * 0.3,
      reflectionRatio: features.complexity * 0.2,
      reflectionAngle: (features.spatialOrientation + 45) % 360,
    };
  }

  private static resolveOptions(options: SceneIRGenerationOptions): Required<SceneIRGenerationOptions> {
    const width = options.width ?? DEFAULT_OPTIONS.width;
    const height = options.height ?? DEFAULT_OPTIONS.height;
    const quality = options.quality ?? DEFAULT_OPTIONS.quality;
    const format = options.format ?? DEFAULT_OPTIONS.format;
    const generateMipmaps = options.generateMipmaps ?? DEFAULT_OPTIONS.generateMipmaps;
    const enableEffects = options.enableEffects ?? DEFAULT_OPTIONS.enableEffects;
    return { width, height, quality, format, generateMipmaps, enableEffects, originalMetadata: options.originalMetadata ?? {} };
  }

  private static validateInput(features: EnhancedImageFeatures, options: Required<SceneIRGenerationOptions>): void {
    if (!this.isFiniteNumber(features.colorHistogram?.r) || !this.isFiniteNumber(features.colorHistogram?.g) || !this.isFiniteNumber(features.colorHistogram?.b)) {
      throw new Error('Invalid color histogram data');
    }
    if (features.colorHistogram.r < 0 || features.colorHistogram.r > 1 ||
      features.colorHistogram.g < 0 || features.colorHistogram.g > 1 ||
      features.colorHistogram.b < 0 || features.colorHistogram.b > 1) {
      throw new Error('Invalid color histogram data');
    }
    if (!this.isFiniteNumber(features.aspectRatio) || features.aspectRatio <= 0 || features.aspectRatio > 10) {
      throw new Error('Invalid aspect ratio');
    }
    if (!this.isFiniteNumber(features.spatialOrientation) || features.spatialOrientation < 0 || features.spatialOrientation >= 360) {
      throw new Error('Invalid spatial orientation');
    }
    if (!this.isFiniteNumber(features.complexity) || features.complexity < 0 || features.complexity > 1) {
      throw new Error('Invalid complexity value');
    }
    this.validateTextureDimensions(QUALITY_TEXTURE_SIZE[options.quality], QUALITY_TEXTURE_SIZE[options.quality]);
    if (!this.isFiniteNumber(options.width) || !Number.isInteger(options.width) || options.width <= 0 || options.width > 16384 ||
      !this.isFiniteNumber(options.height) || !Number.isInteger(options.height) || options.height <= 0 || options.height > 16384) {
      throw new Error('Invalid Scene IR dimensions');
    }
  }

  private static validateTextureDimensions(width: number, height: number): void {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || width > 4096 || height > 4096) {
      throw new Error('Invalid texture dimensions');
    }
  }

  private static createSignatures(features: EnhancedImageFeatures): SceneIRMetadata['signatures'] {
    return {
      colorDistribution: features.colorDistribution ?? this.calculateColorDistribution(features),
      spatial: features.spatialSignature ?? this.calculateSpatialSignature(features),
      texture: features.textureSignature ?? this.calculateTextureSignature(features),
      lighting: features.lightingSignature ?? this.calculateLightingSignature(features),
      motion: features.motionSignature ?? this.calculateMotionSignature(features),
      depth: features.depthSignature ?? this.calculateDepthSignature(features),
      shadow: features.shadowSignature ?? this.calculateShadowSignature(features),
    };
  }

  private static createTransform(features: EnhancedImageFeatures, width: number, height: number): TransformIR {
    const scale = 0.5 + features.complexity * 2;
    const rotation = features.spatialOrientation * Math.PI / 180;
    const model: TransformIR['model'] = {
      m11: scale * Math.cos(rotation), m12: -scale * Math.sin(rotation), m13: 0, m14: 0,
      m21: scale * Math.sin(rotation), m22: scale * Math.cos(rotation), m23: 0, m24: 0,
      m31: 0, m32: 0, m33: scale, m34: 0,
      m41: 0, m42: 0, m43: -features.aspectRatio * scale * 0.25, m44: 1,
    };
    const view: TransformIR['view'] = {
      m11: 1, m12: 0, m13: 0, m14: 0,
      m21: 0, m22: 1, m23: 0, m24: 0,
      m31: 0, m32: 0, m33: 1, m34: 0,
      m41: 0, m42: 0, m43: -10, m44: 1,
    };
    const aspectRatio = width / height;
    const fov = 45 * Math.PI / 180;
    const near = 0.1;
    const far = 100;
    const f = 1 / Math.tan(fov / 2);
    const projection: TransformIR['projection'] = {
      m11: f / aspectRatio, m12: 0, m13: 0, m14: 0,
      m21: 0, m22: f, m23: 0, m24: 0,
      m31: 0, m32: 0, m33: (far + near) / (near - far), m34: -1,
      m41: 0, m42: 0, m43: (2 * far * near) / (near - far), m44: 0,
    };
    return { model, view, projection, normal: { m11: 1, m12: 0, m13: 0, m21: 0, m22: 1, m23: 0, m31: 0, m32: 0, m33: 1 } };
  }

  private static createEffects(features: EnhancedImageFeatures): EffectIR[] {
    const effects: EffectIR[] = [
      { type: 'depth_test', enable: true, func: 'LESS', writeEnable: true, testEnable: true },
      { type: 'blend', enable: true, srcRGB: 'SRC_ALPHA', dstRGB: 'ONE_MINUS_SRC_ALPHA', srcAlpha: 'ONE', dstAlpha: 'ONE_MINUS_SRC_ALPHA' },
      { type: 'cull', enable: false, face: 'BACK' },
    ];
    if (features.complexity > 0.7) {
      effects.push({
        type: 'specular_highlight',
        enable: true,
        intensity: (features.complexity - 0.7) * 3,
        color: { r: 1, g: 1, b: 1 },
        shininess: 50,
        kernelSize: 20,
      });
    }
    const shadow = features.shadowSignature ?? this.calculateShadowSignature(features);
    if (shadow.shadowRatio > 0.15) {
      effects.push({
        type: 'shadow_modulation',
        enable: true,
        ratio: shadow.shadowRatio,
        direction: shadow.shadowDirection,
        softness: shadow.shadowSoftness,
      });
    }
    return effects;
  }

  private static createDrawCalls(
    features: EnhancedImageFeatures,
    renderPass: RenderPassIR,
    vertexShader: ShaderIR,
    fragmentShader: ShaderIR,
    texture: TextureIR,
    effects: EffectIR[]
  ): DrawCallIR[] {
    const baseUniforms: DrawCallIR['uniforms'] = {
      u_model: { type: 'mat4', value: null },
      u_view: { type: 'mat4', value: null },
      u_projection: { type: 'mat4', value: null },
      u_time: { type: 'float', value: 0 },
      u_complexity: { type: 'float', value: features.complexity },
      u_colorPrimary: { type: 'vec3', value: [features.colorHistogram.r, features.colorHistogram.g, features.colorHistogram.b] },
    };
    const baseBindings = this.createResourceBindings(texture, vertexShader, fragmentShader);
    const drawCalls: DrawCallIR[] = [{
      id: this.makeId('draw_call_base', features),
      renderPassId: renderPass.id,
      shader: fragmentShader,
      textures: [texture],
      uniforms: baseUniforms,
      instances: 1,
      primitive: 'TRIANGLES',
      bindings: baseBindings,
      effects,
    }];
    if (features.complexity > 0.45) {
      drawCalls.push({
        id: this.makeId('draw_call_detail', features),
        renderPassId: renderPass.id,
        shader: fragmentShader,
        textures: [texture],
        uniforms: {
          ...baseUniforms,
          u_detailWeight: { type: 'float', value: (features.complexity - 0.45) / 0.55 },
        },
        instances: features.complexity > 0.8 ? 2 : 1,
        primitive: 'TRIANGLE_STRIP',
        bindings: baseBindings,
        effects,
      });
    }
    return drawCalls;
  }

  private static createResourceBindings(texture: TextureIR, vertexShader: ShaderIR, fragmentShader: ShaderIR): ResourceBindingIR[] {
    return [
      { id: `${texture.id}_binding`, resourceType: 'texture', resourceId: texture.id, name: 'u_texture', binding: 0, stage: 'fragment' },
      { id: `${vertexShader.id}_binding`, resourceType: 'shader', resourceId: vertexShader.id, name: 'vertex_program', binding: 0, stage: 'vertex' },
      { id: `${fragmentShader.id}_binding`, resourceType: 'shader', resourceId: fragmentShader.id, name: 'fragment_program', binding: 1, stage: 'fragment' },
    ];
  }

  private static makeDefines(features: EnhancedImageFeatures): Record<string, string> {
    return {
      COLOR_R: features.colorHistogram.r.toFixed(6),
      COLOR_G: features.colorHistogram.g.toFixed(6),
      COLOR_B: features.colorHistogram.b.toFixed(6),
      ORIENTATION: features.spatialOrientation.toFixed(6),
      COMPLEXITY: features.complexity.toFixed(6),
      SPATIAL_FREQUENCY: (features.spatialSignature?.dominantFrequency ?? 0.5).toFixed(6),
    };
  }

  private static makeId(prefix: string, features: EnhancedImageFeatures): string {
    return `${prefix}_${this.featureFingerprint(features).slice(0, 12)}`;
  }

  private static featureFingerprint(features: EnhancedImageFeatures): string {
    const payload = JSON.stringify({
      color: features.colorHistogram,
      aspectRatio: features.aspectRatio,
      orientation: features.spatialOrientation,
      complexity: features.complexity,
    });
    let hash = 2166136261;
    for (let index = 0; index < payload.length; index += 1) {
      hash ^= payload.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  private static featureSeed(features: EnhancedImageFeatures): number {
    return Number.parseInt(this.featureFingerprint(features).slice(0, 8), 16) || 1;
  }

  private static deterministicNoise(x: number, y: number, seed: number): number {
    let value = seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
  }

  private static hasBalancedBraces(source: string): boolean {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (const character of source) {
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
      } else if (character === '{') {
        depth += 1;
      } else if (character === '}') {
        depth -= 1;
        if (depth < 0) return false;
      }
    }
    return depth === 0 && !inString;
  }

  private static clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private static isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
}

export default EnhancedSceneIRGenerator;
