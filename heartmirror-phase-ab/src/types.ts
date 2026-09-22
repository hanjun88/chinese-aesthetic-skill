// Phase B 类型定义：Scene IR、编译契约与图像特征签名

export type ImageFormat = 'jpg' | 'png' | 'webp' | 'gif';
export type SceneQuality = 'low' | 'medium' | 'high' | 'ultra';
export type OutputFormat = 'webp' | 'png' | 'jpeg' | 'avif';
export type SceneIRNodeType = 'Scene' | 'scene' | 'frame' | 'render_pass' | 'draw_call' | 'texture' | 'shader';
export type PrimitiveType = 'TRIANGLES' | 'TRIANGLE_STRIP' | 'LINES' | 'POINTS';
export type ShaderLanguage = 'GLSL' | 'HLSL' | 'WGSL';
export type ShaderStage = 'vertex' | 'fragment' | 'compute';

export interface ImageFeatures {
  colorHistogram: { r: number; g: number; b: number };
  aspectRatio: number;
  spatialOrientation: number;
  complexity: number;
  metadata: Record<string, unknown>;
}

export interface ColorDistribution {
  r: number;
  g: number;
  b: number;
  luminance: number;
  saturation: number;
  value: number;
}

export interface SpatialSignature {
  dominantDirection: number;
  dominantFrequency: number;
  anisotropy: number;
  circularity: number;
  centroid: { x: number; y: number };
  extent: { width: number; height: number };
}

export interface TextureSignature {
  lbpUniform: number;
  glcmContrast: number;
  glcmDissimilarity: number;
  glcmHomogeneity: number;
  haralickCorrelation: number;
  entropy: number;
}

export interface LightingSignature {
  illuminance: number;
  dominantWavelength: number;
  colorTemperature: number;
  chromaticAdaptation: { a: number; b: number; c: number };
}

export interface MotionSignature {
  opticFlowMagnitude: number;
  opticFlowDirection: number;
  motionBlur: number;
  temporalFrequency: number;
  acceleration: number;
}

export interface DepthSignature {
  disparity: number;
  focusDistance: number;
  depthRange: { near: number; far: number };
  depthGradient: number;
  defocusAmount: number;
}

export interface ShadowSignature {
  shadowRatio: number;
  shadowDirection: number;
  shadowSoftness: number;
  reflectionRatio: number;
  reflectionAngle: number;
}

export interface EnhancedImageFeatures extends ImageFeatures {
  colorDistribution?: ColorDistribution;
  spatialSignature?: SpatialSignature;
  textureSignature?: TextureSignature;
  lightingSignature?: LightingSignature;
  motionSignature?: MotionSignature;
  depthSignature?: DepthSignature;
  shadowSignature?: ShadowSignature;
  metadata: ImageFeatures['metadata'] & {
    processingPipeline?: string;
    algorithmVersion?: string;
    confidence?: number;
    qualityScore?: number;
  };
}

export interface SceneCompilationSchema {
  allowedAspectRatios: { min: number; max: number };
  allowedOrientations: { min: number; max: number };
  allowedComplexity: { min: number; max: number };
  colorHistogramRange: {
    r: { min: number; max: number };
    g: { min: number; max: number };
    b: { min: number; max: number };
  };
  schemaVersion?: string;
  strictMode?: boolean;
  maxTextureSize?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SceneCompilationContract {
  scene: SceneIRNode;
  metadata: {
    generatedAt: string;
    source: 'aesthetic-engine';
    version: string;
    compatibilityVersion?: string;
  };
  schema: SceneCompilationSchema;
  validation: ValidationResult;
}

export interface Matrix4 {
  m11: number; m12: number; m13: number; m14: number;
  m21: number; m22: number; m23: number; m24: number;
  m31: number; m32: number; m33: number; m34: number;
  m41: number; m42: number; m43: number; m44: number;
}

export interface Matrix3 {
  m11: number; m12: number; m13: number;
  m21: number; m22: number; m23: number;
  m31: number; m32: number; m33: number;
}

export interface TransformIR {
  model: Matrix4;
  view: Matrix4;
  projection: Matrix4;
  normal: Matrix3;
}

export interface EffectIR {
  type: string;
  enable: boolean;
  [key: string]: unknown;
}

export interface UniformIR {
  type: string;
  value: unknown;
  binding?: number;
}

export interface ShaderValidationResult {
  isValid: boolean;
  errors: string[];
  checks: Record<string, boolean>;
}

export interface ShaderIR {
  id: string;
  language: ShaderLanguage;
  type: ShaderStage;
  source: string;
  defines?: Record<string, string>;
  attributes?: Record<string, { type: string; size: number }>;
  varyings?: Record<string, { type: string; interpolation: 'smooth' | 'flat' | 'noperspective' }>;
  uniforms?: Record<string, UniformIR>;
  textures?: string[];
  samplers?: string[];
  entryPoint?: string;
  glslVersion?: string;
  validation?: ShaderValidationResult;
}

export interface TextureIR {
  id: string;
  format: 'RGB' | 'RGBA' | 'DEPTH';
  width: number;
  height: number;
  data: Uint8Array | number[];
  minFilter?: string;
  magFilter?: string;
  wrapS?: string;
  wrapT?: string;
  mipmap?: boolean;
  usage?: string[];
}

export interface AttachmentIR {
  target: string;
  format?: 'RGBA' | 'DEPTH';
  loadOp: 'CLEAR' | 'LOAD' | 'DONT_CARE';
  storeOp: 'STORE' | 'DONT_CARE';
  clearValue?: { r: number; g: number; b: number; a: number };
  resolve?: {
    texture: TextureIR;
    mipLevel: number;
    arrayLayer: number;
  };
  textureId?: string;
  samples?: number;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  minDepth: number;
  maxDepth: number;
}

export interface RenderPipelineIR {
  primitive: PrimitiveType;
  cullMode: 'NONE' | 'FRONT' | 'BACK';
  depthTest: boolean;
  depthWrite: boolean;
  blend: {
    enable: boolean;
    srcRGB: string;
    dstRGB: string;
    srcAlpha: string;
    dstAlpha: string;
  };
}

export interface RenderPassIR {
  id: string;
  name: string;
  shaders: ShaderIR[];
  textures: TextureIR[];
  attachments: AttachmentIR[];
  viewport: Viewport;
  pipeline: RenderPipelineIR;
}

export interface ResourceBindingIR {
  id: string;
  resourceType: 'texture' | 'shader';
  resourceId: string;
  name: string;
  binding: number;
  stage: 'vertex' | 'fragment' | 'all';
}

export interface DrawCallIR {
  id: string;
  renderPassId: string;
  shader: ShaderIR;
  textures: TextureIR[];
  uniforms: Record<string, UniformIR>;
  instances: number;
  primitive: PrimitiveType;
  bindings: ResourceBindingIR[];
  effects: EffectIR[];
}

export interface SceneIRMetadata {
  generatedAt: string;
  source: 'aesthetic-engine';
  version: string;
  algorithm: string;
  featureFingerprint: string;
  quality: SceneQuality;
  format: OutputFormat;
  dimensions: { width: number; height: number };
  signatures: {
    colorDistribution: ColorDistribution;
    spatial: SpatialSignature;
    texture: TextureSignature;
    lighting: LightingSignature;
    motion: MotionSignature;
    depth: DepthSignature;
    shadow: ShadowSignature;
  };
}

export interface SceneIRData {
  scene: {
    width: number;
    height: number;
    frames: FrameIR[];
    renderPass: RenderPassIR;
    drawCalls: DrawCallIR[];
    resources: ResourceBindingIR[];
    effects: EffectIR[];
    enhancedMetadata?: SceneIRMetadata;
  };
}

export interface FrameIR {
  id: string;
  width: number;
  height: number;
  orientation: number;
  styleParams: {
    colorPrimary: ImageFeatures['colorHistogram'];
    aspectRatio: number;
    complexity: number;
    colorDistribution?: ColorDistribution;
    spatialSignature?: SpatialSignature;
    textureSignature?: TextureSignature;
    lightingSignature?: LightingSignature;
    motionSignature?: MotionSignature;
    depthSignature?: DepthSignature;
    shadowSignature?: ShadowSignature;
  };
  transform: TransformIR;
  effects: EffectIR[];
  renderPassId?: string;
  drawCallIds?: string[];
}

export interface SceneIRNode {
  id: string;
  type: SceneIRNodeType;
  version: string;
  width: number;
  height: number;
  frames: FrameIR[];
  textures: TextureIR[];
  shaders: ShaderIR[];
  renderPass: RenderPassIR;
  drawCalls: DrawCallIR[];
  resources: ResourceBindingIR[];
  data: SceneIRData;
  metadata: SceneIRMetadata | Record<string, unknown>;
}

export const SCENE_IR_VERSION = '2.0.0';
