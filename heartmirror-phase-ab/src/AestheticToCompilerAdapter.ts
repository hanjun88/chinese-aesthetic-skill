// Aesthetic to Compiler Runtime Bridge - Phase B 增强版
import type { SceneIRGenerationOptions } from './EnhancedSceneIRGenerator';
import type {
  DepthSignature,
  EnhancedImageFeatures,
  ImageFeatures,
  LightingSignature,
  MotionSignature,
  SceneCompilationContract,
  SceneCompilationSchema,
  ShadowSignature,
  SpatialSignature,
  TextureSignature,
  ValidationResult,
} from './types';
import { EnhancedSceneIRGenerator } from './EnhancedSceneIRGenerator';

export interface AestheticToCompilerOptions extends SceneIRGenerationOptions {
  schema?: SceneCompilationSchema;
}

export class AestheticToCompilerAdapter {
  static async convert(
    aestheticOutput: ImageFeatures,
    options: AestheticToCompilerOptions = {}
  ): Promise<SceneCompilationContract> {
    if (!this.isValidAestheticOutput(aestheticOutput)) {
      throw new Error('无效的美学引擎输出格式');
    }

    const { schema: suppliedSchema, ...generationOptions } = options;
    // 保留原始图像特征的元数据，用于场景 IR 的兼容性字段
    const generationOptionsWithMeta: SceneIRGenerationOptions = {
      ...generationOptions,
      originalMetadata: aestheticOutput.metadata,
    };
    const schema: SceneCompilationSchema = suppliedSchema || this.createDefaultSchema();
    const schemaValidation = this.validateSchema(schema);
    if (schemaValidation.length > 0) {
      throw new Error(`场景编译 Schema 配置无效: ${schemaValidation.join('; ')}`);
    }

    const enhancedFeatures = this.enhanceImageFeatures(aestheticOutput);
    const validation: ValidationResult = this.validateWithSchema(enhancedFeatures, schema);
    if (!validation.isValid) {
      throw new Error(`场景编译 Schema 验证失败: ${validation.errors.join('; ')}`);
    }

    const sceneIR = await EnhancedSceneIRGenerator.generateSceneIR(enhancedFeatures, generationOptionsWithMeta);

    return {
      scene: sceneIR,
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'aesthetic-engine',
        version: '1.0.0',
      },
      schema,
      validation,
    };
  }

  static validateWithSchema(
    features: ImageFeatures,
    schema: SceneCompilationSchema
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.isFiniteNumber(features.colorHistogram?.r) ||
      !this.isFiniteNumber(features.colorHistogram?.g) ||
      !this.isFiniteNumber(features.colorHistogram?.b)) {
      errors.push('颜色直方图包含无效数值');
    } else {
      const range = schema.colorHistogramRange;
      if (range) {
        if (features.colorHistogram.r < range.r.min || features.colorHistogram.r > range.r.max) {
          errors.push(`红色直方图值超出范围 (${range.r.min}-${range.r.max})`);
        }
        if (features.colorHistogram.g < range.g.min || features.colorHistogram.g > range.g.max) {
          errors.push(`绿色直方图值超出范围 (${range.g.min}-${range.g.max})`);
        }
        if (features.colorHistogram.b < range.b.min || features.colorHistogram.b > range.b.max) {
          errors.push(`蓝色直方图值超出范围 (${range.b.min}-${range.b.max})`);
        }
      }
    }

    if (!this.isFiniteNumber(features.aspectRatio) ||
      features.aspectRatio < schema.allowedAspectRatios.min ||
      features.aspectRatio > schema.allowedAspectRatios.max) {
      errors.push(`宽高比 ${Number(features.aspectRatio).toFixed(2)} 不在允许范围内`);
    }

    if (!this.isFiniteNumber(features.spatialOrientation) ||
      features.spatialOrientation < schema.allowedOrientations.min ||
      features.spatialOrientation > schema.allowedOrientations.max) {
      errors.push('空间方向值超出范围 (0-360)');
    }

    if (!this.isFiniteNumber(features.complexity) ||
      features.complexity < schema.allowedComplexity.min ||
      features.complexity > schema.allowedComplexity.max) {
      errors.push('复杂度值超出范围 (0-1)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateSchema(schema: SceneCompilationSchema): string[] {
    const errors: string[] = [];
    if (!schema || typeof schema !== 'object') {
      return ['Schema 必须为对象'];
    }
    if (!this.isRangeValid(schema.allowedAspectRatios?.min, schema.allowedAspectRatios?.max)) {
      errors.push('allowedAspectRatios 范围无效');
    }
    if (!this.isRangeValid(schema.allowedOrientations?.min, schema.allowedOrientations?.max)) {
      errors.push('allowedOrientations 范围无效');
    }
    if (!this.isRangeValid(schema.allowedComplexity?.min, schema.allowedComplexity?.max)) {
      errors.push('allowedComplexity 范围无效');
    }
    const colorRange = schema.colorHistogramRange;
    if (!colorRange ||
      !this.isRangeValid(colorRange.r?.min, colorRange.r?.max) ||
      !this.isRangeValid(colorRange.g?.min, colorRange.g?.max) ||
      !this.isRangeValid(colorRange.b?.min, colorRange.b?.max)) {
      errors.push('colorHistogramRange 范围无效');
    }
    if (schema.maxTextureSize !== undefined &&
      (!Number.isInteger(schema.maxTextureSize) || schema.maxTextureSize < 1 || schema.maxTextureSize > 4096)) {
      errors.push('maxTextureSize 必须在 1 到 4096 之间');
    }
    return errors;
  }

  /** 保留旧调用方的输入形状，同时生成完整的高级特征签名。 */
  static enhanceImageFeatures(source: ImageFeatures): EnhancedImageFeatures {
    const enhanced = EnhancedSceneIRGenerator.normalizeFeatures(source);
    return {
      ...enhanced,
      metadata: {
        ...enhanced.metadata,
        processingPipeline: enhanced.metadata.processingPipeline ?? 'enhanced-scene-ir-v2.0',
        algorithmVersion: enhanced.metadata.algorithmVersion ?? '2.0.0',
        confidence: enhanced.metadata.confidence ?? 0.95,
        qualityScore: enhanced.metadata.qualityScore ?? 0.88,
      },
    };
  }

  static calculateSpatialSignature(features: ImageFeatures): SpatialSignature {
    return EnhancedSceneIRGenerator.calculateSpatialSignature(features);
  }

  static calculateTextureSignature(features: ImageFeatures): TextureSignature {
    return EnhancedSceneIRGenerator.calculateTextureSignature(features);
  }

  static calculateLightingSignature(features: ImageFeatures): LightingSignature {
    return EnhancedSceneIRGenerator.calculateLightingSignature(features);
  }

  static calculateMotionSignature(features: ImageFeatures): MotionSignature {
    return EnhancedSceneIRGenerator.calculateMotionSignature(features);
  }

  static calculateDepthSignature(features: ImageFeatures): DepthSignature {
    return EnhancedSceneIRGenerator.calculateDepthSignature(features);
  }

  static calculateShadowSignature(features: ImageFeatures): ShadowSignature {
    return EnhancedSceneIRGenerator.calculateShadowSignature(features);
  }

  private static createDefaultSchema(): SceneCompilationSchema {
    return {
      allowedAspectRatios: { min: 1.5, max: 2.5 },
      allowedOrientations: { min: 0, max: 360 },
      allowedComplexity: { min: 0, max: 1 },
      colorHistogramRange: {
        r: { min: 0, max: 1 },
        g: { min: 0, max: 1 },
        b: { min: 0, max: 1 },
      },
      schemaVersion: '2.0.0',
      strictMode: true,
      maxTextureSize: 4096,
    };
  }

  private static isValidAestheticOutput(output: unknown): output is ImageFeatures {
    if (!output || typeof output !== 'object') {
      return false;
    }
    const candidate = output as Partial<ImageFeatures>;
    return Boolean(candidate.colorHistogram) &&
      this.isFiniteNumber(candidate.colorHistogram?.r) &&
      this.isFiniteNumber(candidate.colorHistogram?.g) &&
      this.isFiniteNumber(candidate.colorHistogram?.b) &&
      this.isFiniteNumber(candidate.aspectRatio) &&
      this.isFiniteNumber(candidate.spatialOrientation) &&
      this.isFiniteNumber(candidate.complexity) &&
      candidate.metadata !== null &&
      typeof candidate.metadata === 'object';
  }

  private static isRangeValid(min: unknown, max: unknown): boolean {
    return this.isFiniteNumber(min) && this.isFiniteNumber(max) && min <= max;
  }

  private static isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
}

export { EnhancedSceneIRGenerator } from './EnhancedSceneIRGenerator';

export default AestheticToCompilerAdapter;
