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
