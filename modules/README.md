# 模块实现索引

本目录包含10个可执行实现模块，每个模块对应 guidelines/ 中的一条规则，提供具体的算法、参数和代码实现。

| 模块 | 对应规则 | 优先级 | 核心功能 | 素材实证 |
|---|---|---|---|---|
| spatial.md | 空间秩序 | P0 | 中轴计算、层级检测、布局推荐 | ✅ ai-linggan 15视频 |
| void_solid.md | 虚实关系 | P0 | 留白比例计算、不完整入画检测、通透感评估 | ✅ ai-linggan + xiaoai |
| proportion.md | 比例 | P0 | 经典比例校验、三段式计算、巨构尺度比 | – |
| material.md | 材料与质感 | P1 | 材质参数推荐、塑料感检测、PBR参数校验 | ✅ ai-linggan + ivanchiu |
| light_shadow.md | 光影布局 | P1 | 光源方案推荐、软阴影参数、体积光配置 | ✅ ai-linggan + ivanchiu |
| color.md | 色彩体系 | P0 | 五方正色校验、配色方案推荐、禁忌色检测 | ✅ ai-linggan + xiaoai |
| motion.md | 运动动势 | P1 | 东方运动原型、缓动曲线、粒子系统配置 | ✅ ai-linggan + xiaoai |
| time.md | 时间感 | P1 | 风化参数、昼夜变化、滚动时间递进 | – |
| taboo.md | 禁忌 | P0 | 禁忌元素检测、四类俗套扫描、AI国风感评分 | – |
| interaction.md | 交互语义 | P0 | 交互触发链、FSM状态机、移动端适配 | ✅ xiaoai 11视频 |

## 素材库实证层

**`evidence-index.md`** — 素材库与模块的关联索引，包含：
- 4批蒸馏素材总览（fengling / ivanchiu / ai-linggan / xiaoai）
- 模块↔素材关联矩阵
- 跨批次交叉验证的核心实证结论
- 参数溯源机制（每个推荐参数可追溯到具体视频/图片素材）

每个有实证的模块末尾均有「素材库实证（Distillation Evidence）」章节，标注推荐值的实证来源和样本量。

## 使用方式

每个模块文件包含：
1. **核心算法**：可直接实现的计算逻辑
2. **参数表**：推荐阈值和配置值（有实证的标注来源）
3. **代码示例**：Three.js / JavaScript 实现
4. **校验函数**：可被 validate.js 调用的检测逻辑
5. **素材库实证**：蒸馏数据支撑的参数推荐（部分模块）

## 与 guidelines 的关系

- `guidelines/` = 规则定义（为什么、测什么、P0/P1）
- `modules/` = 规则实现（怎么算、用什么参数、代码怎么写）
- `../distillation/` = 素材库实证（参数从哪里来、样本量多少）

设计流程：先读 guidelines 理解规则 → 查 distillation 看实证 → 再用 modules 实现 → 最后用 scripts/validate.js 校验。
