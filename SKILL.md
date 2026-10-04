---
name: chinese-aesthetic-skill
description: 东方空间美学决策引擎（10 个可执行引擎）。判定"这个设计为什么是中国的"、检测国潮/古装/仿古/AI 国风俗套、生成五方正色与君臣佐使配色、空间秩序与虚实比、光影、比例、材质 PBR、交互语义映射、相机动势。触发词：中式美学、东方风格、国风设计、留白、虚实、五正色、君臣佐使、反俗套、cliche、chineseness、中式配色、园林、建筑比例、动势、PBR 材质。不适用：纯功能 UI 无美学诉求、明确要求西方/现代/极简风格。
---

# 中式美学决策引擎

不是规则手册，是**可执行引擎**。10 个引擎从结构层面回答"这个设计为什么是中国的"，而非贴中国元素。

## 何时用

- 设计中式/东方风格界面、3D 场景、动效、交互原型
- 评审已有设计是否具备中式结构特征
- 为生图/3D 管线生成材质参数、深度图规范、相机动势

**不适用**：纯功能性 UI 无美学诉求；明确要求西方/现代/极简风格；文案与内容创作。

## 核心用法

```js
import { fullAssessment, ENGINE_COUNT } from './lib/index.js';
// ENGINE_COUNT === 10

// 一站式：跑全部 10 个引擎
const report = fullAssessment({
  colors: ['#E8E4D9', '#2C3E50', '#B8860B'],
  voidRatio: 0.65, brightnessRatio: 4, buildingToHumanRatio: 10,
});
// → { overallScore, level, engines, recommendations }
```

单引擎调用（见 `lib/index.js` 导出面）：

| 引擎 | 关键入口 | 用途 |
|---|---|---|
| chineseness | `assessChineseness(design)` | 10 维评分 + 结构东方性测试 + 核心回答 |
| clicheDetector | `detectCliches(design)` | 四类俗套：国潮/古装/仿古/AI 国风 |
| colorEngine | `generateColorScheme(p)` | 五正色 + 君臣佐使 70:20:10 + HEX |
| spatialEngine | 空间秩序生成 | 中轴/开间/层级/尺度/进深/虚实 |
| lightEngine | 光影决策 | 时间/场景 → 光源/角度/强度/阴影/体积光 |
| proportionEngine | 比例校验生成 | √2 / 三段式 / 出檐 / 巨构比例 |
| materialEngine | 材质决策 | 元素类型 → PBR(color/roughness/metalness) + 包浆 |
| interactionEngine | 交互语义映射 | 用户动作 → 东方意象 + 动画参数 + FSM |
| antiAIArtifacts | AI 生图伪影检测 | 风险评分 + 三类伪影 + 修复策略 |
| videoMotionEngine | 视频动势决策 | 相机运动 + 剪辑节奏 + 情绪曲线 |

## 判定纪律（重要）

- **颜色不能用现代 HSL 直觉**。五正色（青赤黄白黑）为基色，衍生色需过 `validateColorScheme`；深色低明度可放行高饱和，明亮色收紧。禁霓虹高饱和、正红、亮金。
- **留白不是一个数字，而是三种语义，各有规则 ID**（登记簿 `rules/`，决策与证据见 `docs/decisions/ADR-0001-negative-space.md`）：
  - 硬规则（P0）：亮调山水留白 ≥ 0.60，规则 `CAS-VS-HF-001`。<!-- rule:CAS-VS-HF-001 -->
  - 朝代区间：唐 / 宋 / 明各有留白先验区间（`CAS-VS-PB-TANG` / `-SONG` / `-MING`），取证据的并集而非平均值。
  - 结构信号：虚实比 ≥ 0.50 只是引擎计分信号（`CAS-VS-SS-001`），不是硬结构指标，更不是合规线。<!-- rule:CAS-VS-SS-001 -->
- **主色要少、主次分明**（君臣佐使），其余为中性/材质色；比例与容差见 `guidelines/color.md`，素材库观察见 `modules/color.md`。
- 规则冲突时以 `guidelines/*.md` 原文为准，引擎输出为可测判据而非最终裁决；已登记的阈值以登记簿 `rules/` 为准，文档里不再抄数字。

## 资产导航

| 路径 | 内容 |
|---|---|
| `guidelines/` | 10 条规则正文（空间/虚实/比例/材料/光影/色彩/动势/时间/禁忌/交互） |
| `rules/` | 规则登记簿：阈值、出处、置信度的单一来源（`lib/rules/` 读取；README 的「规则登记簿」表由它渲染） |
| `scripts/emit-sheet.mjs` | 生成某个设计上下文的 AestheticConstraintSheet 约束交接产物（`--list` 列出有效与被排除的上下文）；跨仓绑定 DEFERRED / UNBOUND，不钉扎任何编译器版本 |
| `playbooks/` | 5 套执行手册（约束提取、资产交付、文物验收、心镜视觉一致性等） |
| `terms/chinese-aesthetic.json` | 术语库（界/虚实/举折/出檐…） |
| `modules/` | 分模块实现索引：原则 + 引擎指针 + 素材库实证 |
| `lib/` | 10 引擎实现，零外部依赖，ESM |
| `scripts/validate.cjs` | Gate 1–3 结构与算法校验 CLI |
| `scripts/pack-skill.cjs` | 打包/安装脚本（登记簿与约束生成器随包分发） |

## 验证

```bash
npm test                       # 引擎 + 规则 + 文档测试、登记簿 lint、文档 lint
node tests/engines.test.js     # 仅引擎集成测试，期望全部通过
node scripts/validate.cjs --gate 1
```

测试计数不在本文件手写：它们由 `npm run evidence` 从真实输出生成，见 README.md 的「测试与证据」。

## 管线位置

本 Skill 是设计管线中段：`finesse-brief`（需求规格）→ **本 Skill（美学约束）** → `finesse-skill`（界面执行）→ `frame-smith`（动效）→ `finesse-term`（术语）。
这些是**集成点而非构建依赖**，详见 `skill.yaml` 的 `integration_points` 与 `docs/references.md` §4。

## 仓库

https://github.com/hanjun88/chinese-aesthetic-skill
