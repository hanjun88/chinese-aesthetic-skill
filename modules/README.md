# 模块实现索引

本目录包含10个模块，每个模块对应 guidelines/ 中的一条规则，说明**该规则由哪个引擎实现、阈值登记在哪里、素材库给出了什么实证**。
模块不再内嵌算法、代码与阈值表：可执行实现在 `lib/`，已登记的阈值在规则登记簿 `rules/`，规则原文在 `guidelines/`。

| 模块 | 对应规则 | 优先级 | 核心功能 | 实现 | 素材实证 |
|---|---|---|---|---|---|
| spatial.md | 空间秩序 | P0 | 中轴、层级递进、布局原则 | `lib/spatial-engine.js` | ✅ ai-linggan 15视频 |
| void_solid.md | 虚实关系 | P0 | 留白三语义、不完整入画、通透感 | `lib/spatial-engine.js` · `lib/chineseness.js`；阈值见登记簿 `CAS-VS` | ✅ ai-linggan + xiaoai |
| proportion.md | 比例 | P0 | 经典比例校验、三段式、巨构尺度比 | `lib/proportion-engine.js` | – |
| material.md | 材料与质感 | P1 | 材质原则、塑料感判别 | `lib/material-engine.js` | ✅ ai-linggan + ivanchiu |
| light_shadow.md | 光影布局 | P1 | 光源方案原则、柔光阴影、体积光 | `lib/light-engine.js` | ✅ ai-linggan + ivanchiu |
| color.md | 色彩体系 | P0 | 五方正色、禁忌色、配色方案 | `lib/color-engine.js` | ✅ ai-linggan + xiaoai |
| motion.md | 运动动势 | P1 | 东方运动原型、缓动、镜头运动 | `lib/video-motion-engine.js` · `lib/interaction-engine.js` | ✅ ai-linggan + xiaoai |
| time.md | 时间感 | P1 | 风化、昼夜变化、时间叙事 | `lib/light-engine.js` · `lib/material-engine.js` | – |
| taboo.md | 禁忌 | P0 | 禁忌元素、四类俗套、"为什么是中国的"测试 | `lib/cliche-detector.js` · `lib/anti-ai-artifacts.js` · `lib/chineseness.js` | – |
| interaction.md | 交互语义 | P0 | 交互触发链、状态机、无障碍基线 | `lib/interaction-engine.js` | ✅ xiaoai 11视频 |

## 素材库实证层

**`evidence-index.md`** — 素材库与模块的关联索引，包含：
- 4批蒸馏素材总览（fengling / ivanchiu / ai-linggan / xiaoai）
- 模块↔素材关联矩阵
- 跨批次交叉验证的核心实证结论
- 参数溯源机制（每个观察值可追溯到具体视频/图片素材）

每个有实证的模块末尾均有「素材库实证（Distillation Evidence）」章节，标注观察值的来源和样本量。**观察值不是阈值**：阈值只在规则登记簿 `rules/`（尚未登记的暂以 `guidelines/` 与引擎为准）。

## 使用方式

每个模块文件包含：
1. **实现与阈值指针**：一行 `Implementation: … · thresholds: … · rationale: …`，指向引擎、登记簿的规则族（或"尚未登记"）、guidelines 原文
2. **原则要点**：该规则的非数值知识——判别题、取舍、反例、东方性倾向
3. **素材库实证**：蒸馏数据的观察值（部分模块）

## 与 guidelines 的关系

- `guidelines/` = 规则定义（为什么、测什么、P0/P1）；也是登记簿引文的出处
- `rules/` = 已登记的阈值、出处与置信度（单一来源，README 的「规则登记簿」表由它渲染）
- `lib/` = 规则实现（怎么算、怎么生成）
- `modules/` = 实现索引与实证摘要
- `../distillation/` = 素材库实证（观察值从哪里来、样本量多少）

设计流程：先读 guidelines 理解规则 → 查 distillation 看实证 → 用 lib/ 引擎生成与判定 → 最后用 `npm test` 与 `scripts/validate.cjs` 校验。需要改阈值时只改 `rules/`，再 `npm run docs:render`。
