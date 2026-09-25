# 模块：虚实关系（void_solid）

对应规则：guidelines/void_solid.md | 优先级：P0

## 核心算法

### 留白比例计算

```javascript
/**
 * 计算画面留白比例并评估东方性
 * @param {Object} frame - { elements, width, height }
 * @returns {Object} { voidRatio, solidRatio, grade, recommendation }
 */
function calculateVoidRatio(frame) {
  const totalArea = frame.width * frame.height;
  let occupiedArea = 0;

  for (const el of frame.elements || []) {
    occupiedArea += (el.width || 0) * (el.height || 0);
  }

  const voidRatio = 1 - (occupiedArea / totalArea);
  const solidRatio = 1 - voidRatio;

  // 东方留白分级
  let grade, recommendation;
  if (voidRatio >= 0.5) {
    grade = 'A'; // 大量留白，传统国画意境
    recommendation = '留白充足，符合传统中式"计白当黑"';
  } else if (voidRatio >= 0.3) {
    grade = 'B'; // 中等留白，电影感场景
    recommendation = '留白适中，适合电影感/沉浸式场景';
  } else if (voidRatio >= 0.15) {
    grade = 'C'; // 偏少留白，满构图
    recommendation = '留白偏少，偏满构图；如需东方意境建议增加留白';
  } else {
    grade = 'D'; // 无留白，拥挤
    recommendation = '留白严重不足，画面拥挤';
  }

  return { voidRatio, solidRatio, grade, recommendation };
}
```

### 不完整入画检测

```javascript
/**
 * 检测元素是否"不完整入画"（东方美学：不全即全，留白即境）
 * @param {Object} element - { x, y, width, height, frameWidth, frameHeight }
 * @returns {Object} { isPartial, partialEdges, aestheticScore }
 */
function detectPartialFraming(element) {
  const edges = [];
  if (element.x < 0) edges.push('left');
  if (element.y < 0) edges.push('top');
  if (element.x + element.width > element.frameWidth) edges.push('right');
  if (element.y + element.height > element.frameHeight) edges.push('bottom');

  // 不完整入画的东方美学评分（1-2边裁切=有意为之，3-4边=拥挤）
  let aestheticScore;
  if (edges.length === 0) aestheticScore = 5; // 完整入画，稳定但可能呆板
  else if (edges.length === 1) aestheticScore = 9; // 单裁切，延伸感最强
  else if (edges.length === 2) aestheticScore = 8; // 双裁切，角落延伸
  else if (edges.length === 3) aestheticScore = 5; // 三裁切，接近满幅
  else aestheticScore = 3; // 四裁切，拥挤

  return {
    isPartial: edges.length > 0,
    partialEdges: edges,
    aestheticScore
  };
}
```

### 通透感评估

```javascript
/**
 * 评估场景通透感（虚实相生：实体之间必须有透气空间）
 * @param {Array} elements - 含position和size的元素列表
 * @returns {Object} { transparencyScore, gaps, violations }
 */
function evaluateTransparency(elements) {
  const violations = [];
  let totalGap = 0;
  const gaps = [];

  // 按x排序检测水平间距
  const sorted = [...elements].sort((a, b) => a.x - b.x);
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].x - (sorted[i-1].x + sorted[i-1].width);
    gaps.push(gap);
    totalGap += Math.max(0, gap);
    if (gap < 0 && Math.abs(gap) > sorted[i].width * 0.3) {
      violations.push(`元素${i-1}与${i}重叠超过30%，通透感不足`);
    }
  }

  const avgGap = gaps.length > 0 ? totalGap / gaps.length : 0;
  const transparencyScore = Math.min(10, avgGap / 20 + (violations.length === 0 ? 5 : 0));

  return { transparencyScore, gaps, violations };
}
```

## 实证参数表（已验证推荐值）

> 数据来源：`../distillation/` ai-linggan（15视频）+ xiaoai（11视频），关联索引见 `evidence-index.md`

### 留白实证数据

| 来源 | 留白均值 | 范围 | 风格定位 |
|---|---|---|---|
| ai-linggan（15视频） | 26% | 14%-38% | **电影感满构图**，靠景深而非留白营造空间 |
| xiaoai（11视频） | >60%（估算） | 白底+小面积主体 | **编辑级画廊留白**，极简展示 |
| 传统国画（参考） | 50%-70% | – | 计白当黑，留白即境 |

> 核心发现：ai-linggan的26%留白与传统国画的50%-70%形成鲜明对比。电影感场景靠**4.7层景深**和**体积光**营造空间感，而非大面积留白。两种风格各有适用场景，不可混为一谈。

### 虚实风格分类

| 风格 | 留白比例 | 景深层数 | 体积光 | 适用场景 | 实证来源 |
|---|---|---|---|---|---|
| 电影感纵深 | 15%-35% | 4-5层 | 必须 | 沉浸式场景/仙境/城市 | ai-linggan |
| 编辑级极简 | 50%-80% | 1-2层 | 可选 | 作品集/画廊/产品展示 | xiaoai |
| 传统国画意境 | 50%-70% | 2-3层 | 可选 | 山水/花鸟/人文 | （待补充） |
| 巨构崇高 | 10%-25% | 3-4层 | 必须 | 宫殿/巨构/纪念碑 | fengling/ivanchiu |

### 通透感参数

| 参数 | 推荐值 | 说明 |
|---|---|---|
| 元素最小间距 | ≥元素宽度的15% | 避免拥挤 |
| 最大重叠 | ≤30% | 超过则通透感不足 |
| 前景透明度 | 0.3-0.7 | 半透明前景增加层次 |
| 雾气密度 | 0.015-0.025 | 体积雾增强纵深 |

## Three.js 代码示例

```javascript
// 电影感纵深配置（基于ai-linggan实证：26%留白+4.7层景深）
function createCinematicDepth(scene) {
  const layers = [
    { name: 'far', z: -50, opacity: 0.3, fogFactor: 1.0 },
    { name: 'midFar', z: -30, opacity: 0.5, fogFactor: 0.7 },
    { name: 'mid', z: -10, opacity: 0.75, fogFactor: 0.4 },
    { name: 'midNear', z: 5, opacity: 0.9, fogFactor: 0.2 },
    { name: 'near', z: 20, opacity: 1.0, fogFactor: 0 }
  ];

  // 指数平方雾（增强纵深）
  scene.fog = new THREE.FogExp2(0x2c4a5e, 0.015);

  return layers;
}

// 编辑级极简配置（基于xiaoai实证：>60%留白+白底）
function createEditorialMinimal(scene) {
  scene.background = new THREE.Color(0xffffff);
  scene.fog = null; // 无雾，保持干净

  // 主体居中，小面积
  const layout = {
    subjectArea: 0.35, // 主体占画面35%
    voidArea: 0.65,    // 留白65%
    subjectPosition: [0, 0, 0], // 居中
    cameraDistance: 8
  };

  return layout;
}
```

## 校验函数（供 validate.js 调用）

```javascript
function checkVoidSolid(design) {
  const violations = [];
  const { elements, frame, style } = design;

  // 留白比例检测
  const voidResult = calculateVoidRatio(frame);
  if (style === 'traditional' && voidResult.voidRatio < 0.4) {
    violations.push({ severity: 'P1', message: `传统风格留白 ${(voidResult.voidRatio*100).toFixed(0)}% < 40%，建议≥50%（计白当黑）` });
  }
  if (style === 'cinematic' && voidResult.voidRatio > 0.5) {
    violations.push({ severity: 'P2', message: `电影感风格留白 ${(voidResult.voidRatio*100).toFixed(0)}% 过高，建议15%-35%（ai-linggan实证均值26%）` });
  }

  // 景深层数检测
  if (style === 'cinematic' && design.depthLayers && design.depthLayers < 3) {
    violations.push({ severity: 'P1', message: `电影感风格景深 ${design.depthLayers} 层不足，建议≥4层（ai-linggan实证均值4.7层）` });
  }

  // 通透感检测
  const transparency = evaluateTransparency(elements);
  violations.push(...transparency.violations.map(v => ({ severity: 'P2', message: v })));

  // 满构图警告（非电影感风格）
  if (style !== 'cinematic' && voidResult.voidRatio < 0.2) {
    violations.push({ severity: 'P1', message: `留白 ${(voidResult.voidRatio*100).toFixed(0)}% 严重不足，画面拥挤` });
  }

  return violations;
}
```
