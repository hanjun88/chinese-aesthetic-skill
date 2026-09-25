# 模块：材料与质感（material）

对应规则：guidelines/material.md | 优先级：P1

## 核心算法

### 材质东方性评分

```javascript
/**
 * 评估PBR材质参数的东方性得分
 * @param {Object} material - { metalness, roughness, clearcoat, sheen, transmission }
 * @returns {Object} { score, grade, recommendations }
 */
function evaluateMaterialOrientalness(material) {
  let score = 0;
  const recommendations = [];

  // 低金属度（东方材质偏好石/木/玉/布，非工业金属）
  if (material.metalness <= 0.3) score += 25;
  else { score -= 10; recommendations.push('金属度过高，东方场景偏好石/玉/木/布等低金属度材质'); }

  // 中高粗糙度（避免塑料感/镜面感）
  if (material.roughness >= 0.4 && material.roughness <= 0.85) score += 25;
  else if (material.roughness < 0.2) { score -= 15; recommendations.push('粗糙度过低有塑料感，建议≥0.4'); }

  // 清漆层（漆器/陶瓷质感）
  if (material.clearcoat && material.clearcoat > 0.1 && material.clearcoat <= 0.6) score += 20;

  // 光泽层（丝绸/布料质感）
  if (material.sheen && material.sheen > 0.1) score += 15;

  // 透射（玉石/半透明材质）
  if (material.transmission && material.transmission > 0.1 && material.transmission <= 0.5) score += 15;

  const grade = score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D';
  return { score, grade, recommendations };
}
```

### 塑料感检测

```javascript
/**
 * 检测材质是否有AI常见的塑料感
 * @param {Object} material
 * @returns {Object} { isPlastic, reasons }
 */
function detectPlasticFeel(material) {
  const reasons = [];
  if (material.roughness < 0.2 && material.metalness < 0.1) reasons.push('极低粗糙度+极低金属度=典型塑料感');
  if (material.clearcoat > 0.8) reasons.push('清漆层过厚=廉价塑料光泽');
  if (material.envMapIntensity > 2.0) reasons.push('环境光反射过强=镜面塑料');
  if (!material.normalMap && !material.bumpMap && material.roughness < 0.3) reasons.push('无法线/凹凸贴图+低粗糙度=光滑塑料');
  return { isPlastic: reasons.length > 0, reasons };
}
```

## 实证参数表（已验证推荐值）

> 数据来源：`../distillation/` ai-linggan（15视频）+ ivanchiu（11张），关联索引见 `evidence-index.md`

### 材质分布（ai-linggan 15视频）

| 材质 | 出现率 | 典型应用 | PBR参数推荐 |
|---|---|---|---|
| water 水体 | 100% | 云海/河流/瀑布 | transmission 0.8, roughness 0.05, metalness 0, ior 1.33 |
| stone 石材 | 87% | 建筑/山体/地面 | roughness 0.7-0.85, metalness 0, normalMap required |
| cloud 云雾 | 73% | 大气/体积光介质 | 体积材质，density 0.015-0.025 |
| glass 玻璃 | 67% | 幕墙/水晶/透镜 | transmission 0.5-0.9, roughness 0.05-0.1, ior 1.5 |
| metal 金属 | 40% | 装饰/结构/未来城市 | metalness 0.7-0.9, roughness 0.2-0.4, 避免全镜面 |

### ivanchiu 云海天宫材质特征（11张）

| 材质 | 出现率 | 说明 |
|---|---|---|
| 白玉 white jade | 100% | 建筑主体，半透明温润质感 |
| 悬浮建筑 floating architecture | 100% | 反重力结构 |
| 金顶 liquid gold roof | 100% | 屋顶，流动金属质感 |
| 不可能建筑 impossible architecture | 100% | 非欧几何结构 |
| 金缮 kintsugi | 9% | 1/11有金色裂纹修复 |
| 半透明玉拱桥 translucent jade glow | 9% | 1/11有发光玉质 |

### 东方材质PBR参数推荐

| 材质 | metalness | roughness | clearcoat | sheen | transmission | 特殊 |
|---|---|---|---|---|---|---|
| 玉石 jade | 0 | 0.3-0.5 | 0.3 | – | 0.3-0.5 | 次表面散射SSS |
| 漆器 lacquer | 0 | 0.2-0.3 | 0.5-0.8 | – | 0 | 深底色+金纹 |
| 丝绸 silk | 0 | 0.6-0.8 | – | 0.5-0.8 | 0 | 各向异性 |
| 青铜 bronze | 0.8-0.9 | 0.4-0.6 | – | – | 0 | 做旧纹理 |
| 宣纸 paper | 0 | 0.8-0.95 | – | 0.2 | 0.1 | 纤维纹理 |
| 木材 wood | 0 | 0.6-0.8 | 0.1 | – | 0 | 年轮纹理 |

## Three.js 代码示例

```javascript
// 玉石材质（基于ivanchiu实证）
function createJadeMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe8e4d9,
    metalness: 0,
    roughness: 0.4,
    transmission: 0.4,
    ior: 1.5,
    thickness: 2.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    sheen: 0.2,
    sheenColor: 0xd4dde8,
    envMapIntensity: 1.0
  });
}

// 青铜器材质（做旧）
function createBronzeMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    metalness: 0.85,
    roughness: 0.5,
    envMapIntensity: 0.8
  });
}

// 水体材质（基于ai-linggan实证，100%出现）
function createWaterMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x2c4a5e,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.8,
    ior: 1.33,
    thickness: 1.0,
    transparent: true,
    opacity: 0.7,
    envMapIntensity: 1.5
  });
}
```

## 校验函数（供 validate.js 调用）

```javascript
function checkMaterial(design) {
  const violations = [];
  const materials = design.materials || [];

  for (const [name, mat] of Object.entries(materials)) {
    // 塑料感检测
    const plastic = detectPlasticFeel(mat);
    if (plastic.isPlastic) {
      violations.push({ severity: 'P1', message: `材质 "${name}" 有塑料感：${plastic.reasons.join('; ')}` });
    }

    // 东方性评分
    const oriental = evaluateMaterialOrientalness(mat);
    if (oriental.grade === 'D') {
      violations.push({ severity: 'P2', message: `材质 "${name}" 东方性评分 ${oriental.score}（${oriental.grade}），建议：${oriental.recommendations.join('; ')}` });
    }

    // 金属度过高（非未来城市场景）
    if (design.sceneType !== 'urban' && mat.metalness > 0.7) {
      violations.push({ severity: 'P2', message: `非城市场景金属度 ${mat.metalness} 过高，建议≤0.3` });
    }
  }

  return violations;
}
```
