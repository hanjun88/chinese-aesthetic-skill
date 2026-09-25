# 模块：空间秩序（spatial）

对应规则：guidelines/spatial-order.md | 优先级：P0

## 核心算法

### 中轴对称计算

```javascript
/**
 * 计算主元素与屏幕中心的偏移度
 * @param {Object} element - 主元素 {x, y, width, height}
 * @param {number} screenWidth - 屏幕宽度
 * @returns {Object} { offsetRatio, isCentered, isGoldenPoint }
 */
function calculateAxisOffset(element, screenWidth) {
  const centerX = element.x + element.width / 2;
  const screenCenter = screenWidth / 2;
  const offsetRatio = Math.abs(centerX - screenCenter) / screenWidth;

  // 黄金分割点检测（38.2% 和 61.8%）
  const goldenLeft = screenWidth * 0.382;
  const goldenRight = screenWidth * 0.618;
  const isGoldenPoint = Math.abs(centerX - goldenLeft) / screenWidth < 0.05 ||
                        Math.abs(centerX - goldenRight) / screenWidth < 0.05;

  return {
    offsetRatio,
    isCentered: offsetRatio <= 0.10,
    isGoldenPoint,
    pass: offsetRatio <= 0.10 || isGoldenPoint
  };
}
```

### 层级递进检测

```javascript
/**
 * 检测场景的深度层级
 * @param {Array} elements - 元素列表，每个含 depth 属性
 * @returns {Object} { layerCount, hasProgression, layers }
 */
function detectSpatialLayers(elements) {
  const depths = elements.map(e => e.depth || 0).sort((a, b) => a - b);
  const uniqueDepths = [...new Set(depths)];

  // 检测递进：相邻层深度差 ≥ 总深度的15%
  const maxDepth = Math.max(...depths);
  const hasProgression = uniqueDepths.every((d, i) =>
    i === 0 || (d - uniqueDepths[i-1]) >= maxDepth * 0.15
  );

  return {
    layerCount: uniqueDepths.length,
    hasProgression,
    layers: uniqueDepths,
    pass: uniqueDepths.length >= 2 && hasProgression
  };
}
```

## 参数表

| 参数 | 值 | 说明 |
|---|---|---|
| 中轴偏移容差 | ≤10% | 主元素中心与屏幕中心的偏移比 |
| 黄金分割点容差 | ≤5% | 主体位于38.2%或61.8%位置的容差 |
| 最小层级数 | ≥2 | 前庭/中殿/后堂至少2层 |
| 层级深度差 | ≥15% | 相邻层深度差占总深度比例 |
| 推荐层级数 | 3 | 前庭(留白)→中殿(主体)→后堂(纵深) |

## Three.js 布局实现

```javascript
// 中轴对称布局
function createSymmetricLayout(scene, mainElement, sideElements) {
  const group = new THREE.Group();

  // 主元素居中
  mainElement.position.set(0, 0, 0);
  group.add(mainElement);

  // 侧元素对称分布
  const spacing = 3;
  sideElements.forEach((el, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    el.position.set(side * spacing * (row + 1), 0, 0);
    group.add(el);
  });

  return group;
}

// 三层递进布局
function createProgressiveLayout(scene) {
  const layers = [
    { name: '前庭', z: -5, elements: ['steps', 'ground'] },
    { name: '中殿', z: 0, elements: ['mainDoor', 'columns'] },
    { name: '后堂', z: 5, elements: ['innerHall', 'depth'] }
  ];
  // 每层有明确的空间功能和深度
}
```

## 校验函数（供 validate.js 调用）

```javascript
function checkSpatialOrder(design) {
  const violations = [];
  const { elements, width } = design;
  if (!elements || elements.length === 0) {
    violations.push({ severity: 'P0', message: '无元素可检测空间秩序' });
    return violations;
  }
  const main = elements.find(e => e.isMain) || elements[0];
  const axis = calculateAxisOffset(main, width);
  if (!axis.pass) {
    violations.push({ severity: 'P0', message: `主元素偏移 ${(axis.offsetRatio*100).toFixed(1)}% > 10%，且不在黄金分割点` });
  }
  const layers = detectSpatialLayers(elements);
  if (layers.layerCount < 2) {
    violations.push({ severity: 'P1', message: '场景层级不足2层' });
  }
  return violations;
}
```

---

## 素材库实证（Distillation Evidence）

> 数据来源：`../distillation/` 4批素材，关联索引见 `evidence-index.md`

### 实证参数表（已验证推荐值）

| 参数 | 原推荐值 | 实证修正值 | 实证来源 | 样本量 |
|---|---|---|---|---|
| 中轴使用率 | – | 93%（14/15） | ai-linggan | 15视频 |
| 景深层数 | ≥2 | 均值4.7层（范围4-5） | ai-linggan | 15视频 |
| 留白比例 | – | 均值26%（范围14%-38%） | ai-linggan | 15视频 |
| 对称度 | – | 均值0.58（范围0.45-0.72） | ai-linggan | 15视频 |
| 焦点位置 | 中心 | [0.50, 0.49]，高度居中 | ai-linggan | 15视频 |

### 构图模式实证分布（ai-linggan 15视频）

| 模式 | 数量 | 占比 | 说明 |
|---|---|---|---|
| central_axis 中轴 | 6 | 40% | 主体沿垂直中轴线排布，仪式感 |
| aerial_overview 鸟瞰 | 4 | 27% | 高空俯视，展现宏观格局与几何秩序 |
| low_angle_grand 低角度仰拍 | 3 | 20% | 强调主体高耸巍峨与崇高感 |
| symmetrical 对称 | 1 | 7% | 左右近镜像，纪念碑式肃穆 |
| layered_depth 层次纵深 | 1 | 7% | 前中后景多层叠加，不依赖强中轴 |

### 机位高度分布（ai-linggan 15视频）

| 机位 | 数量 | 适用场景 |
|---|---|---|
| eye-level 平视 | 6 | 人物/建筑正面 |
| aerial 航拍 | 4 | 城市全景/宏观格局 |
| low 低角度 | 3 | 巨构/崇高感 |
| high 高角度 | 2 | 俯瞰/纵深 |

> 核心发现：Ai灵感主义偏"满构图"（留白仅26%），与传统中式"留白意境"不同。其空间感主要靠**4.7层景深**和**93%中轴线**营造，而非大面积留白。这是电影感场景与传统国画的关键区别。

### ivanchiu 云海天宫空间特征（11张图文）

- 100%长焦压缩（telephoto compression）
- 100%悬浮建筑（floating architecture）
- 100%不可能建筑（impossible architecture）
- 视角分布：低角度4/11、中景2/11、高角度2/11、长焦侧视1/11、虫眼1/11、纵深走廊1/11

### 可复用空间配置

**配置A：电影感中轴纵深（ai-linggan）**
```json
{
  "central_axis": true,
  "axis_offset_tolerance": 0.10,
  "depth_layers": 4.7,
  "negative_space_ratio": 0.26,
  "symmetry": 0.58,
  "focal_point": [0.50, 0.49],
  "dominant_camera": "drone_forward",
  "viewpoint_height": "eye-level"
}
```

**配置B：悬浮长焦压缩（ivanchiu）**
```json
{
  "telephoto_compression": true,
  "floating_architecture": true,
  "impossible_architecture": true,
  "layered_atmosphere": true,
  "recommended_lens": "85mm-200mm"
}
```
