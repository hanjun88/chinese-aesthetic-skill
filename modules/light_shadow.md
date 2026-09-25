# 模块：光影布局（light_shadow）

对应规则：guidelines/light_shadow.md | 优先级：P1

## 核心算法

### 体积光配置生成

```javascript
/**
 * 根据场景类型生成东方风格体积光配置
 * @param {string} sceneType - 'celestial' | 'palace' | 'mountain' | 'urban'
 * @returns {Object} Three.js 光源+后处理配置
 */
function generateVolumetricLightConfig(sceneType) {
  const configs = {
    celestial: {
      lightType: 'directional',
      elevationDeg: 30,
      azimuthDeg: 180,
      color: 0xfff4e0,
      intensity: 2.0,
      fog: { type: 'exp2', density: 0.015, color: 0xe9eef7 },
      godRays: { enabled: true, density: 0.4, decay: 0.95, weight: 0.3 },
      bloom: { enabled: true, strength: 0.8, radius: 0.4, threshold: 0.85 }
    },
    palace: {
      lightType: 'directional',
      elevationDeg: 20,
      color: 0xffe8b0,
      intensity: 1.8,
      fog: { type: 'exp2', density: 0.02, color: 0xf5e6d3 },
      godRays: { enabled: true, density: 0.5, decay: 0.93, weight: 0.4 },
      bloom: { enabled: true, strength: 1.0, radius: 0.5, threshold: 0.8 }
    },
    mountain: {
      lightType: 'directional',
      elevationDeg: 15,
      color: 0xe9eef7,
      intensity: 1.5,
      fog: { type: 'exp2', density: 0.025, color: 0xd4dde8 },
      godRays: { enabled: true, density: 0.35, decay: 0.96, weight: 0.25 },
      bloom: { enabled: true, strength: 0.6, radius: 0.3, threshold: 0.9 }
    },
    urban: {
      lightType: 'directional',
      elevationDeg: 45,
      color: 0xffffff,
      intensity: 1.2,
      fog: { type: 'exp2', density: 0.01, color: 0x1b2a44 },
      godRays: { enabled: false },
      bloom: { enabled: true, strength: 0.5, radius: 0.3, threshold: 0.85 }
    }
  };
  return configs[sceneType] || configs.celestial;
}
```

### 丁达尔效应检测

```javascript
/**
 * 检测场景是否具备丁达尔效应特征
 * @param {Object} scene - { light, fog, particles, camera }
 * @returns {Object} { hasTyndall, score, factors }
 */
function detectTyndallEffect(scene) {
  const factors = [];
  let score = 0;

  // 低角度光源（<45度）
  if (scene.light.elevationDeg < 45) { score += 30; factors.push('low_angle_light'); }

  // 有雾/散射介质
  if (scene.fog && scene.fog.density > 0.01) { score += 25; factors.push('scattering_medium'); }

  // 有粒子系统
  if (scene.particles && scene.particles.count > 1000) { score += 20; factors.push('particle_scattering'); }

  // 光源在相机视野内或边缘
  if (scene.light.inViewFrustum) { score += 25; factors.push('light_in_frame'); }

  return {
    hasTyndall: score >= 50,
    score,
    factors
  };
}
```

## 实证参数表（已验证推荐值）

> 数据来源：`../distillation/` ai-linggan（15视频）+ ivanchiu（11张），关联索引见 `evidence-index.md`

### 体积光参数（ai-linggan 15视频）

| 参数 | 推荐值 | 实证依据 |
|---|---|---|
| 体积光启用率 | 100% | 15/15全员启用 |
| 丁达尔效应 | 67% | 10/15有丁达尔 |
| 光源仰角 | 15°-45° | 低角度为主，营造长阴影和光束 |
| 光源色温 | 5500K-6500K | 冷白日光 |
| 阴影类型 | PCFSoft | 全部柔光阴影 |
| 雾类型 | exp2 | 指数平方雾，模拟大气散射 |
| 雾密度 | 0.015-0.025 | 场景相关 |
| 大气透视 | 0.6 | 远景偏蓝偏灰 |

### Bloom参数（ai-linggan + xiaoai黑洞视频）

| 参数 | 推荐值 | 适用场景 |
|---|---|---|
| bloom_strength | 0.6-1.0 | 通用仙境场景 |
| bloom_radius | 0.3-0.5 | – |
| bloom_threshold | 0.8-0.9 | 仅高亮区域泛光 |
| 黑洞bloom | 1.8 | xiaoai视频04，金色辉光 |

### ivanchiu 云海天宫光影特征（11张）

| 特征 | 出现率 | 说明 |
|---|---|---|
| 体积光/光束 | 36% | 4/11有明显god rays |
| 长焦压缩 | 100% | 全部使用长焦镜头压缩空间 |
| 侧光/侧逆光 | 55% | 6/11使用侧光营造立体感 |
| 半透明玉质发光 | 18% | 2/11有translucent jade glow |
| 镜面地板无限反射 | 9% | 1/11有mirror floor infinity |
| 彩虹光折射 | 9% | 1/11有iridescent light refraction |

## Three.js 代码示例

```javascript
// 东方仙境体积光配置（基于ai-linggan实证）
function createCelestialLighting(scene) {
  // 主光源：低角度冷白日光
  const sun = new THREE.DirectionalLight(0xe9eef7, 2.0);
  sun.position.set(0, Math.tan(30 * Math.PI / 180) * 50, -50);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.type = THREE.PCFSoftShadowMap;
  scene.add(sun);

  // 指数平方雾（大气散射）
  scene.fog = new THREE.FogExp2(0xe9eef7, 0.015);

  // 环境光（低强度，保持暗部细节）
  const ambient = new THREE.AmbientLight(0x2c4a5e, 0.3);
  scene.add(ambient);

  return { sun, ambient };
}

// 后处理：Bloom + 体积光
function createPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Bloom（基于ai-linggan实证）
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8,  // strength
    0.4,  // radius
    0.85  // threshold
  );
  composer.addPass(bloomPass);

  return composer;
}
```

## 校验函数（供 validate.js 调用）

```javascript
function checkLightShadow(design) {
  const violations = [];
  const { lights, fog, postprocessing } = design;

  // 体积光检测（东方仙境场景必须有）
  if (design.sceneType === 'celestial' || design.sceneType === 'palace') {
    const hasFog = fog && (fog.type === 'exp2' || fog.type === 'linear') && fog.density > 0.01;
    const hasLowAngleLight = lights.some(l => l.elevationDeg && l.elevationDeg < 45);
    if (!hasFog || !hasLowAngleLight) {
      violations.push({ severity: 'P1', message: '仙境/宫殿场景建议配置体积光（低角度光源+雾介质）' });
    }
  }

  // 硬阴影检测（东方风格偏好柔光）
  const hardShadows = lights.filter(l => l.shadowType === 'basic' || l.shadowType === 'PCF');
  if (hardShadows.length > 0) {
    violations.push({ severity: 'P2', message: `检测到${hardShadows.length}个硬阴影光源，建议使用PCFSoftShadowMap` });
  }

  // Bloom参数范围
  if (postprocessing && postprocessing.bloom) {
    const b = postprocessing.bloom;
    if (b.strength > 2.0) violations.push({ severity: 'P2', message: `Bloom强度 ${b.strength} 过高，建议≤2.0` });
    if (b.threshold < 0.5) violations.push({ severity: 'P2', message: `Bloom阈值 ${b.threshold} 过低，会导致全画面泛白` });
  }

  return violations;
}
```
