# 素材库实证索引（Evidence Index）

> 本文件是 `distillation/` 素材库与 `modules/` 核心决策模块之间的关联层。
> 所有模块参数的推荐值均有对应的蒸馏实证支撑，可追溯到具体视频/图片素材。

## 素材批次总览

| 批次ID | 来源 | 类型 | 规模 | 核心方向 | distillation路径 |
|---|---|---|---|---|---|
| `fengling` | 风铃Muse | 教程视频 | 1视频 | 中式巨构/云海天宫/AI生成流程 | `distillation/fengling-megastructure/` |
| `ivanchiu` | IVAN CHIU | Midjourney图文 | 11张 | 悬浮玉岛/不可能建筑/长焦压缩 | `distillation/ivanchiu-cloud-palace/` |
| `ai-linggan` | Ai灵感主义 | 抖音视频 | 15视频/30关键帧 | 电影感场景/东方仙境/未来城市 | `distillation/ai-linggan-cinematic-scenes/` |
| `xiaoai` | 小艾不迟到(AIGC) | 抖音视频 | 11视频/22关键帧 | 前端动效/交互设计/Vibe Coding | `distillation/xiaoai-frontend-motion/` |

## 模块 ↔ 素材关联矩阵

| 模块 | fengling | ivanchiu | ai-linggan | xiaoai | 实证强度 |
|---|---|---|---|---|---|
| `color.md` 色彩体系 | ○ | ◎ | ◎ | ◎ | 强（3批量化数据） |
| `spatial.md` 空间秩序 | ○ | ◎ | ◎ | ○ | 强（2批量化数据） |
| `void_solid.md` 虚实关系 | ○ | ○ | ◎ | ◎ | 中（留白数据） |
| `proportion.md` 比例 | ○ | ○ | ◎ | ○ | 中（景深/构图比例） |
| `material.md` 材料质感 | ○ | ◎ | ◎ | ○ | 中（材质分布） |
| `light_shadow.md` 光影 | ○ | ◎ | ◎ | ○ | 强（体积光100%数据） |
| `motion.md` 运动动势 | ○ | ○ | ◎ | ◎ | 强（2批量化数据） |
| `interaction.md` 交互语义 | – | – | – | ◎ | 中（1批前端交互数据） |
| `time.md` 时间感 | ○ | ○ | ◎ | ○ | 弱（镜头时长间接） |
| `taboo.md` 禁忌 | – | – | ◎ | ◎ | 中（反模式检测） |

> ◎ = 有量化实证数据；○ = 有定性参考；– = 无直接关联

## 核心实证结论（跨批次交叉验证）

### 色彩
- **冷调主导**：ai-linggan 冷调9/15，主色`#2c4a5e`青灰蓝；xiaoai 10/11为6500K中性白
- **赤色压制**：ai-linggan 五方正色中赤仅9.9%，青28%＞黑24.8%＞白19.9%＞黄17.4%＞赤9.9%
- **白底美学**：xiaoai 11/11共享`#FFFFFF`paper-white基底，点缀色面积<15%
- **赭金点缀**：ai-linggan 唯一暖色`#d89048`赭金占15%，用于建筑/光源

### 空间
- **中轴线统治**：ai-linggan 93%（14/15）使用中轴线构图
- **景深4-5层**：ai-linggan 均值4.7层（范围4-5）
- **留白26%**：ai-linggan 均值0.26（范围0.14-0.38），偏"满构图"
- **对称度0.58**：ai-linggan 均值，非严格对称但有秩序感

### 光影
- **体积光100%**：ai-linggan 15/15全员启用体积光
- **丁达尔67%**：ai-linggan 10/15有丁达尔效应
- **低角度光源**：ai-linggan 光源仰角15°-45°，营造长阴影和光束
- **柔光阴影**：ai-linggan 全部PCFSoft软阴影

### 运动
- **drone_forward主导**：ai-linggan 15/15覆盖，10/15为主导镜头，平均占比36%
- **镜头3.41s**：ai-linggan 平均镜头时长，慢节奏长镜头
- **duration 900ms**：xiaoai 全局duration中位数（76段样本）
- **easing power2**：xiaoai 首选（23次）＞linear（13）＞power3（11）
- **stagger 60ms**：xiaoai 中位数（范围20-200ms）

### 交互
- **autoplay全覆盖**：xiaoai 11/11有自动播放循环作为基底
- **drag 6/11**：拖拽旋转/平移，带惯性（damping 0.95）
- **scroll 5/11**：滚动驱动时间线/视差
- **hover 5/11**：悬停tilt（rotateY 20deg/rotateX 12deg）
- **可访问性缺失**：xiaoai 仅1/11有reduced-motion降级，8/11纯鼠标无键盘

## 使用方式

1. **参数溯源**：模块中每个推荐参数后标注 `[证据:批次ID]`，可在本索引找到对应distillation路径
2. **新批次接入**：新增distillation批次后，更新本索引的关联矩阵和核心结论
3. **参数更新流程**：新批次数据 → 更新distillation/ → 更新本索引 → 更新对应modules的实证章节
