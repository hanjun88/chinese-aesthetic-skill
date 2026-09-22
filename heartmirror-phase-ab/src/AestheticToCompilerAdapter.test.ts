// Phase B 桥接适配器的单元测试
import { AestheticToCompilerAdapter } from '../src/AestheticToCompilerAdapter';
import { ImageFeatures } from '../src/types';

const mockAestheticOutput: ImageFeatures = {
  colorHistogram: { r: 0.5, g: 0.3, b: 0.2 },
  aspectRatio: 1.77,
  spatialOrientation: 45,
  complexity: 0.8,
  metadata: { width: 1920, height: 1080 },
};

describe('AestheticToCompilerAdapter', () => {
  describe('convert', () => {
    it('should convert valid aesthetic output to SceneCompilationContract', async () => {
      const contract = await AestheticToCompilerAdapter.convert(mockAestheticOutput);
      expect(contract).toHaveProperty('scene');
      expect(contract).toHaveProperty('metadata');
      expect(contract.metadata.source).toBe('aesthetic-engine');
      expect(contract.metadata.version).toBe('1.0.0');
      expect(contract.scene.version).toBe('1.0.0');
      expect(contract.scene.type).toBe('Scene');
      expect(contract).toHaveProperty('schema');
      expect(contract).toHaveProperty('validation');
    });

    it('should throw error for invalid aesthetic output', async () => {
      const invalidOutput = { ...mockAestheticOutput, colorHistogram: null } as any;
      await expect(AestheticToCompilerAdapter.convert(invalidOutput)).rejects.toThrow(
        '无效的美学引擎输出格式',
      );
    });
  });
});