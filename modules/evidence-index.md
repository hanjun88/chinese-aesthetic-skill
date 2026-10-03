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
| `yanjian` | 岩見(抖音 @岩見) | AIGC神话梦境视频 | 8视频/48帧分析(仓库留存16关键帧) | 山海经灵兽/桃花源/敦煌飞天/青绿墨底/镜面水面 | `distillation/yanjian-mythic-dreamscape/` |

## 模块 ↔ 素材关联矩阵

| 模块 | fengling | ivanchiu | ai-linggan | xiaoai | yanjian | 实证强度 |
|---|---|---|---|---|---|---|
| `color.md` 色彩体系 | ○ | ◎ | ◎ | ◎ | ◎ | 强（3批量化数据） |
| `spatial.md` 空间秩序 | ○ | ◎ | ◎ | ○ | ◎ | 强（2批量化数据） |
| `void_solid.md` 虚实关系 | ○ | ○ | ◎ | ◎ | ◎ | 中（留白数据） |
| `proportion.md` 比例 | ○ | ○ | ◎ | ○ | ○ | 中（景深/构图比例） |
| `material.md` 材料质感 | ○ | ◎ | ◎ | ○ | ◎ | 中（材质分布） |
| `light_shadow.md` 光影 | ○ | ◎ | ◎ | ○ | ◎ | 强（体积光100%数据） |
| `motion.md` 运动动势 | ○ | ○ | ◎ | ◎ | ○ | 强（2批量化数据） |
| `interaction.md` 交互语义 | – | – | – | ◎ | – | 中（1批前端交互数据） |
| `time.md` 时间感 | ○ | ○ | ◎ | ○ | ○ | 弱（镜头时长间接） |
| `taboo.md` 禁忌 | – | – | ◎ | ◎ | ○ | 中（反模式检测） |

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

### 跨批次对照：yanjian ↔ ai-linggan

> 本节区分**量化事实**（直接取自 aggregated.json / color-system.json / spatial-system.json）与**解释性结论**（基于事实的推断，可被后续批次推翻）。

**量化事实**

| 维度 | yanjian | ai-linggan | 关系 |
|---|---|---|---|
| 五方正色·青 | 0.387（AGGREGATE，n=6） | 0.28（0.22–0.35，n=15） | 同向，yanjian 更高 |
| 五方正色·赤 | AGGREGATE 均值0.25（n=6）；median 0.225；剔除 video_006 后 0.19 | 0.0987（0.04–0.20，n=15） | 需按题材分流，不可直接比较 |
| 留白比例 | 均值0.50（0.25–0.65，n=8） | 均值0.26（0.14–0.38，n=15） | 约2倍差，区间仅在0.25–0.38重叠 |
| 景深层数 | 均值3.875（3–4） | 均值4.7（4–5） | yanjian 略少 |
| 体积光/辉光基底 | Bloom 100%（强度0.4）、God Rays 62% | 体积光100%、丁达尔67% | 两批独立同向 |

**解释性结论**

- **"青为主调"是目前唯一获两批独立量化支持的色彩结论**：0.387 与 0.28 均为各自五方正色首位。
- **yanjian 的赤不构成"普遍大面积用赤"（INTERPRETATION）**：0.25 是 6 样本算术均值，被单一离群样本抬高——FACT：`video_006.json`（桃花源，主色粉金 `#f7a8c4`）chi=0.55，为次高值的约1.8倍；六样本 median 仅 0.225，剔除 video_006 后均值降至 0.19，4/6 视频 ≤0.25。因此报告正文"赤/黄仅作面积小的象征性点彩"对神话青绿题材成立，与 AGGREGATE 0.25 不构成事实冲突。
- **"赤色压制"仅对 ai-linggan 成立，不可跨批次推广（INTERPRETATION）**：取值时须按批次与题材分流，桃花源类暖调题材不适用压制结论。
- **留白不存在统一推荐值**：0.5 与 0.26 分属"一角留白"与"满构图"两种题材策略，取均值会同时偏离两者；建议按题材选择而非聚合。
- **"体积光+丁达尔为高频基底"获两批交叉验证**，是本索引中跨批次一致性最强的光影结论。

**DATA_QUALITY_NOTE（上游数据，仅记录不修）**

- yanjian 的 `wufang_zhengse_distribution` 语义为**五方正色面积占比**（六个数值样本各自五色之和均为 1.00）。
- `video_003.json` / `video_005.json` 的该字段存的是 hex 色值字符串而非数值分布，故被 `aggregated.json` 的色彩均值排除——五方正色的有效样本数因此为 **n=6**，而 `overview.total_videos` 仍记为 8。
- n=6 只限定于五方正色数据；留白、景深等字段的样本数仍为 n=8。
- 本条仅记录上游数据质量问题，不修改 `aggregated.json`、video JSON 或蒸馏 pipeline。

## 使用方式

1. **参数溯源**：模块中每个推荐参数后标注 `[证据:批次ID]`，可在本索引找到对应distillation路径
2. **新批次接入**：新增distillation批次后，更新本索引的关联矩阵和核心结论
3. **参数更新流程**：新批次数据 → 更新distillation/ → 更新本索引 → 更新对应modules的实证章节
