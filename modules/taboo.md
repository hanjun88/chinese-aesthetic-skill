# 模块：禁忌（taboo）

对应规则：guidelines/taboo.md | 优先级：P0

## 核心算法

### 四类俗套检测

```javascript
/**
 * 检测四类俗套：国潮贴图感、古装影视感、仿古景区感、AI国风感
 * @param {Object} design - 设计描述
 * @returns {Object} { clicheType, score, violations, pass }
 */
function detectCliches(design) {
  const violations = [];
  let score = 0; // 0-1, 越高越俗套

  // 1. 国潮贴图感：传统纹样满铺
  const patterns = design.patterns || [];
  const patternCoverage = patterns.reduce((sum, p) => sum + (p.coverage || 0), 0);
  if (patternCoverage > 0.20) {
    violations.push({ type: 'guochao-tietu', severity: 'P0', message: `传统纹样占比 ${(patternCoverage*100).toFixed(0)}% > 20% — 国潮贴图感` });
    score += 0.3;
  }

  // 2. 古装影视感：人物正面特写+华丽服饰
  const people = (design.elements || []).filter(e => e.type === 'person');
  const frontFacePerson = people.find(p => p.faceDirection === 'front' && (p.areaRatio || 0) > 0.10);
  if (frontFacePerson) {
    violations.push({ type: 'guzhuang-yingshi', severity: 'P0', message: `人物正面特写占画面 ${(frontFacePerson.areaRatio*100).toFixed(0)}% > 10% — 古装影视感` });
    score += 0.25;
  }

  // 3. 仿古景区感：建筑细节堆砌+均匀亮度
  const buildings = (design.elements || []).filter(e => e.type === 'building');
  const detailedBuilding = buildings.find(b => (b.detailRatio || 0) > 0.30 && !b.isBlockSilhouette);
  if (detailedBuilding) {
    violations.push({ type: 'fanggu-jingqu', severity: 'P0', message: `建筑细节占比 ${(detailedBuilding.detailRatio*100).toFixed(0)}% > 30%，非块面剪影 — 仿古景区感` });
    score += 0.25;
  }

  // 4. AI国风感：高饱和+塑料感+均匀打光
  const highSatColors = (design.colors || []).filter(c => {
    const hsl = rgbToHsl(...Object.values(hexToRgb(c)));
    return hsl.s > 0.60;
  });
  const plasticMaterials = (design.materials || []).filter(m => m.roughness < 0.3 && m.metalness < 0.1);
  const flatLighting = design.brightnessRatio !== undefined && design.brightnessRatio < 2;

  let aiScore = 0;
  if (highSatColors.length > 0) aiScore += 0.3;
  if (plasticMaterials.length > 0) aiScore += 0.3;
  if (flatLighting) aiScore += 0.4;
  if (aiScore > 0.5) {
    violations.push({ type: 'ai-guofeng', severity: 'P0', message: `AI国风感评分 ${aiScore.toFixed(2)} > 0.5 — 高饱和+塑料感+均匀打光` });
    score += aiScore * 0.3;
  }

  return {
    score: Math.min(1, score),
    violations,
    pass: violations.filter(v => v.severity === 'P0').length === 0,
    clicheTypes: violations.map(v => v.type)
  };
}
```

### 文化禁忌检测

```javascript
const CULTURAL_TABOOS = {
  royal: {
    elements: ['five-claw-dragon', 'phoenix', 'imperial-yellow-tile', 'nine-dragon-wall'],
    allowedContexts: ['palace', 'imperial', 'temple-royal'],
    message: '皇家符号仅可用于宫殿/皇家场景'
  },
  religious: {
    elements: ['buddha-statue', 'lotus-throne', 'swastika', 'vajra'],
    allowedContexts: ['temple', 'religious', 'buddhist'],
    message: '宗教符号仅可用于宗教场景'
  },
  western: {
    elements: ['church-spire', 'gothic-window', 'neon-sign', 'cross'],
    allowedContexts: [],
    message: '西方符号禁止出现在中式美学场景'
  }
};

function checkCulturalTaboos(design) {
  const violations = [];
  const context = design.context || 'general';
  const allElements = [...(design.elements || []), ...(design.patterns || [])];

  for (const [category, taboo] of Object.entries(CULTURAL_TABOOS)) {
    for (const el of allElements) {
      if (taboo.elements.includes(el.type || el.name)) {
        if (!taboo.allowedContexts.includes(context)) {
          violations.push({
            category,
            element: el.type || el.name,
            severity: 'P0',
            message: `${taboo.message}（当前场景：${context}）`
          });
        }
      }
    }
  }
  return violations;
}
```

### "为什么是中国的"测试

```javascript
/**
 * 终极测试：去掉所有显性中国元素后，设计仍然是东方的吗？
 * @param {Object} design - 设计描述
 * @returns {Object} { score, structuralEasternness, pass, details }
 */
function whyIsItChinese(design) {
  // 移除显性中国元素（红色、飞檐、毛笔字、龙纹）后，检测结构东方性
  const details = [];
  let score = 0;

  // 1. 空间秩序：中轴/层级/递进
  if (design.voidRatio >= 0.5) { score += 20; details.push('留白≥50%'); }
  if ((design.elements || []).length <= 3) { score += 15; details.push('元素≤3个'); }

  // 2. 虚实：不完整入画/通透
  const hasIncomplete = (design.elements || []).some(e =>
    (e.x || 0) < 0 || ((e.x || 0) + (e.width || 0)) > (design.width || 1920)
  );
  if (hasIncomplete) { score += 15; details.push('不完整入画'); }

  // 3. 光影：逆光/侧光/体积光
  if (design.brightnessRatio >= 3) { score += 15; details.push('明暗比≥3:1'); }
  const hasRimLight = (design.lights || []).some(l => l.type === 'directional' && l.angle > 90);
  if (hasRimLight) { score += 10; details.push('逆光/侧逆光'); }

  // 4. 比例：巨构/三段式
  const hasGiantScale = (design.elements || []).some(e => {
    if (e.type === 'person' && e.height) {
      const building = (design.elements || []).find(b => b.type === 'building' && b.height);
      return building && building.height / e.height >= 5;
    }
    return false;
  });
  if (hasGiantScale) { score += 15; details.push('巨构尺度比≥5:1'); }

  // 5. 动势：缓慢/连续/自然
  const hasSlowMotion = (design.animations || []).some(a => a.duration >= 4000 && a.easing !== 'linear');
  if (hasSlowMotion) { score += 10; details.push('缓慢连续动效'); }

  return {
    score: Math.min(100, score),
    pass: score >= 60,
    structuralEasternness: score >= 60 ? '成立' : '不成立',
    details,
    recommendation: score >= 60
      ? '去掉红色/飞檐/毛笔字后，结构东方性仍然成立'
      : '去掉显性中国元素后失去东方性，需要加强空间秩序/虚实/光影/比例'
  };
}
```

## 禁忌元素黑名单

| 类别 | 元素 | 严重度 | 说明 |
|---|---|---|---|
| 皇家 | 五爪龙 | P0 | 仅宫殿可用 |
| 皇家 | 琉璃黄瓦 | P0 | 仅宫殿可用 |
| 皇家 | 龙凤呈祥 | P1 | 婚礼/皇家可用 |
| 宗教 | 佛像 | P0 | 仅寺庙可用 |
| 宗教 | 卍字 | P0 | 仅宗教可用 |
| 西方 | 教堂尖顶 | P0 | 禁止 |
| 西方 | 哥特窗 | P0 | 禁止 |
| 西方 | 霓虹灯 | P0 | 禁止 |
| 俗套 | 祥云纹满铺 | P0 | 纹样≤5% |
| 俗套 | 回纹边框 | P0 | 禁止做边框 |
| 俗套 | 毛笔字大标题 | P1 | 可用但不可滥用 |
| 色彩 | 正红#FF0000 | P0 | 用暗朱砂 |
| 色彩 | 亮金#FFD700 | P0 | 用哑金 |
| 色彩 | 霓虹色 | P0 | 禁止 |
| 材质 | 塑料感 | P1 | roughness<0.3且metalness<0.1 |
| 动效 | bounce弹跳 | P1 | 东方动势禁用 |
| 动效 | linear匀速 | P1 | 应用ease-in-out |

## 校验函数

```javascript
function checkTaboo(design) {
  const violations = [];
  const cliches = detectCliches(design);
  violations.push(...cliches.violations);
  const cultural = checkCulturalTaboos(design);
  violations.push(...cultural);
  return violations;
}
```
