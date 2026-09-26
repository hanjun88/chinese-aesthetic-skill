<!--
  ================================================================
  模块状态: DRAFT v0.1（框架版，等待完整课程内容填充）
  配套文件: tokens.css（已完成，可直接使用）
  等待资源: 721集完整课程转写（HTML/CSS 199集全）
  ================================================================

  本文件说明:
  - 当前为骨架版本，章节结构和需求清单已搭好
  - 每个章节标注了「需要填充什么内容」和「从课程哪里提取」
  - 已标注 [POC] 的内容是用现有90集转写做的概念验证
  - 标注 [TODO] 的内容等待完整721集到位后精填
  - 原则：宁可留占位符，不用半成品充数
-->

# HTML/CSS 实现层模块 — 中式美学设计决策引擎

> **状态**: DRAFT v0.1（框架搭建中，等待完整课程内容精填）
> **配套令牌**: `tokens.css`（已完成，`@import` 即可使用全部东方美学变量）
>
> 本模块将美学维度的抽象约束，转化为可直接运行的 HTML/CSS 代码方案。

---

## 1. 模块概述

<!-- TODO: 等待内容填充
  需要写清楚：
  - 本模块在美学决策链中的位置（输入：美学决策结果；输出：CSS代码方案）
  - 核心翻译原则对照表（美学语言 → CSS语言）
  - 使用流程（开发者如何使用本模块）
  来源：从7个美学模块文件中提取关键映射关系
-->

### 1.1 定位

本模块处于美学决策链的最末端——实现层：

```
美学哲学(01) → 空间秩序(02) → 虚实(03) → 比例(04) → 材料(05) → 光影(06) → 色彩(07) → 动势(08)
                                                                                          ↓
                                                                              【本模块：HTML/CSS 实现】
```

### 1.2 核心翻译原则

<!-- TODO: 精填时补全每一行的具体CSS属性和示例 -->

| 美学语言 | CSS 实现方向 | 翻译逻辑 | 当前状态 |
|---|---|---|---|
| 中轴为骨 | Grid / Flexbox 主轴对齐 | 中心线即主轴 | [TODO] 待Flex/Grid课程内容 |
| 开间模数 | grid-template-columns fr比例 | fr比值 = 开间宽度比 | [TODO] 待Grid课程内容 |
| 虚实相生 | opacity / clip-path / mask | 透与藏即可见性控制 | [TODO] 待clip-path/mask课程内容 |
| 方五斜七 | aspect-ratio / calc() | √2比例容器 | [TODO] 待aspect-ratio课程内容 |
| 低饱和正色 | HSL / CSS变量 | 降饱和即S值控制 | [POC] tokens.css已完成基础色板 |
| 木石纸金 | 多层渐变 / background-image | 材料真实即渐变叠加 | [TODO] 待渐变/背景课程内容 |
| 天光漏影 | box-shadow多层 / filter | 光影即阴影系统 | [TODO] 待阴影/滤镜课程内容 |
| 行云流水 | cubic-bezier / animation | 动势即缓动与时长 | [TODO] 待动画/变换课程内容 |

---

## 2. 美学维度 → CSS 技术需求清单

> 本章是本模块的核心骨架。每个维度列出：
> - 美学约束来源
> - 需要哪些CSS技术能力
> - 需要产出什么代码模式
> - 从课程哪个位置提取素材
>
> 等完整课程到位后，逐行填充具体代码。

### 2.1 空间秩序 — 需要的前端技术能力

**美学约束来源**: `modules/02-spatial-order.md`
**核心概念**: 中轴为骨、开间模数、空间层级、进深递进、尺度对比

#### 需要的CSS技术清单

| 美学需求 | 需要的CSS技术 | 课程对应章节 | 优先级 | 当前状态 |
|---|---|---|---|---|
| 严格中轴对齐 | `display: flex; justify-content: center; align-items: center` | Flexbox章节 | P0 | [TODO] |
| 偏移中轴 | Flex + `transform: translateX()` | 2D变换章节 | P1 | [TODO] |
| 七开间比例 | `display: grid; grid-template-columns: 0.8fr 0.9fr 1fr 1.2fr 1fr 0.9fr 0.8fr` | Grid布局章节 | P0 | [TODO] |
| 空间区域划分 | `grid-template-areas` 命名区域 | Grid布局章节 | P0 | [TODO] |
| 空间层级 | `z-index` / `position: relative/absolute` | 定位章节 | P0 | [TODO] |
| 进深递进（纵向滚动） | Flex纵向 + `scroll-snap-type: y mandatory` | 滚动捕捉章节 | P1 | [TODO] |
| 视差层次（远慢近快） | `transform: translateZ()` 或多层动画速度差 | 3D变换/动画章节 | P2 | [TODO] |
| 容器居中限制 | `max-width` + `margin: 0 auto` | 盒子模型章节 | P0 | [POC] 基础可用 |

#### 需要产出的代码模式

<!-- TODO: 以下代码模式等待课程内容填充后精填
1. [ ] 七开间殿堂Grid完整代码（含HTML结构+CSS）
2. [ ] 中轴对称布局Flex实现
3. [ ] 院落式进深scroll-snap布局
4. [ ] 偏移中轴的文人意趣布局
5. [ ] 尺度对比：巨构vs宜人vs微型的尺寸对比示例
-->

---

### 2.2 虚实关系 — 需要的前端技术能力

**美学约束来源**: `modules/03-void-solid.md`
**核心概念**: 空的六种功能、界的四种形态、七藏三露、透与借、不完整裁切

#### 需要的CSS技术清单

| 美学需求 | 需要的CSS技术 | 课程对应章节 | 优先级 | 当前状态 |
|---|---|---|---|---|
| 呼吸留白 | `padding` / `margin` 大间距 | 盒子模型章节 | P0 | [POC] 间距变量已定义 |
| 部分遮挡（藏） | `overflow: hidden` + 元素偏移 | overflow章节 | P0 | [TODO] |
| 裁切揭示 | `clip-path: inset()` | clip-path章节 | P1 | [TODO] |
| 硬界 | `border` 实心 + 不透明背景 | 边框章节 | P0 | [POC] border变量已定义 |
| 软界（屏风/帘） | `backdrop-filter: blur()` + 半透明 | 滤镜章节 | P1 | [TODO] |
| 虚界（光影暗示） | 渐变边界 / 透明度渐变 | 渐变章节 | P1 | [TODO] |
| 漏窗镂空 | `mask` / `-webkit-mask` | 遮罩章节 | P2 | [TODO] |
| 借景框景 | `clip-path: inset()` 框选 + 背景图 | clip-path + 背景图章节 | P1 | [TODO] |
| 不完整裁切 | 容器 `overflow: hidden`，元素超出 | overflow章节 | P1 | [TODO] |
| 淡出/淡入 | `opacity` transition | 过渡章节 | P0 | [TODO] |
| 完全隐藏 vs 不占位 | `display: none` vs `visibility: hidden` | display章节 | P0 | [POC] 概念已明确 |

#### 需要产出的代码模式

<!-- TODO: 等待课程内容填充
1. [ ] 七藏三露：clip-path从1/3露到全露的过渡
2. [ ] 软界屏风：backdrop-filter blur + 半透明月白
3. [ ] 漏窗花格：mask镂空效果
4. [ ] 借景框：海棠形窗洞clip-path
5. [ ] 不完整构图：overflow裁切建筑一角
-->

---

### 2.3 比例克制 — 需要的前端技术能力

**美学约束来源**: `modules/04-proportion.md`
**核心概念**: 方五斜七(√2)、模数系统、克制原则、留白比例

#### 需要的CSS技术清单

| 美学需求 | 需要的CSS技术 | 课程对应章节 | 优先级 | 当前状态 |
|---|---|---|---|---|
| √2比例容器 | `aspect-ratio: 7 / 5` | aspect-ratio章节 | P0 | [TODO] |
| 模数间距系统 | CSS变量 `--m: 8px` + `calc(n * var(--m))` | CSS变量章节 | P0 | [POC] tokens.css已完成 |
| 流式字号 | `clamp(min, preferred, max)` | clamp()章节 | P1 | [TODO] |
| 视口相对单位 | `vw` / `vh` / `vmin` | 视口单位章节 | P1 | [TODO] |
| 比例计算 | `calc()` 组合 | calc()章节 | P0 | [POC] tokens.css已用 |
| 实虚比例 | Grid `grid-template-columns: 5fr 7fr` | Grid章节 | P1 | [TODO] |
| √2矩形推导 | `calc(var(--m) * 1.414)` | calc()章节 | P2 | [TODO] |
| 字号层级 | 基于模数的字号阶梯 | 字体排版章节 | P0 | [POC] tokens.css已定义 |

#### 需要产出的代码模式

<!-- TODO: 等待课程内容填充
1. [ ] 方五斜七容器：aspect-ratio: 7/5 的完整示例
2. [ ] 双√2并排：佛光寺东大殿平面比例
3. [ ] clamp()流式排版：标题从24px到64px的自然过渡
4. [ ] 实虚5:7布局：大留白小焦点
-->

---

### 2.4 色彩体系 — 需要的前端技术能力

**美学约束来源**: `modules/07-color.md`
**核心概念**: 五色正色降饱和、主辅点缀60-30-10、阴影有色不纯黑、古金哑光

#### 需要的CSS技术清单

| 美学需求 | 需要的CSS技术 | 课程对应章节 | 优先级 | 当前状态 |
|---|---|---|---|---|
| 传统色定义 | CSS变量 + HSL值 | CSS变量/颜色章节 | P0 | [POC] tokens.css已完成 |
| 色彩过渡混合 | `color-mix(in srgb, A 70%, B 30%)` | color-mix章节 | P1 | [TODO] |
| 透明度控制 | `hsla()` / `rgba()` | 颜色透明度章节 | P0 | [POC] 部分使用 |
| 渐变色彩过渡 | `linear-gradient` / `radial-gradient` | 渐变章节 | P0 | [TODO] |
| 色彩比例控制 | 用面积/透明度控制色占比 | 布局+颜色综合 | P1 | [TODO] |
| 阴影色（非黑） | box-shadow用色值而非黑色 | 阴影章节 | P0 | [POC] shadow变量已定义 |

#### 已完成部分（tokens.css）

`tokens.css` 已包含完整的五色体系变量：
- 青（5档）、朱砂（4档）、古金（4档）、月白（4档）、黛/玄（5档）
- 烟紫、石青、石绿辅助色
- 语义色映射（--color-bg / --color-text / --color-accent 等）
- 每个颜色都有 HSL 值和注释

#### 需要补充的内容

<!-- TODO: 等待课程内容填充
1. [ ] color-mix() 自动过渡色的实际用例（卡片表面、次要文字）
2. [ ] 渐变配色方案：宋韵清雅/朱墙深宫/烟雨青绿的CSS实现
3. [ ] 色彩比例可视化：60-30-10布局演示
4. [ ] 阴影有色：暖阴影vs冷阴影对比示例
-->

---

### 2.5 材料真实 — 需要的前端技术能力

**美学约束来源**: `modules/05-material.md`
**核心概念**: 木见纹、石见糙、纸见透、金见哑、时间感

#### 需要的CSS技术清单

| 美学需求 | 需要的CSS技术 | 课程对应章节 | 优先级 | 当前状态 |
|---|---|---|---|---|
| 木纹（纵向） | `repeating-linear-gradient` 深浅条纹 | 渐变章节 | P1 | [TODO] |
| 木纹（横向梁） | `repeating-linear-gradient(0deg, ...)` | 渐变章节 | P2 | [TODO] |
| 石材颗粒 | 多层 `radial-gradient` 噪点叠加 | 渐变+背景图章节 | P1 | [TODO] |
| 宣纸透光 | 半透明 + 纤维纹理 + backdrop-filter | 透明度+滤镜章节 | P1 | [TODO] |
| 哑光金 | 暗金渐变 + 无高光反射 | 渐变章节 | P1 | [TODO] |
| 材料过渡节点 | border 细线 / 中间色条 | 边框章节 | P2 | [TODO] |
| 时间感（包浆/风化） | 局部渐变加深 + 不规则噪点 | 渐变章节 | P2 | [TODO] |
| 背景纹理叠加 | `background-image` 多层 + `background-blend-mode` | 背景图+混合模式章节 | P2 | [TODO] |

#### 需要产出的代码模式

<!-- TODO: 等待课程内容填充
1. [ ] 木纹柱子：纵向repeat-linear-gradient完整代码
2. [ ] 青石台面：多层radial-gradient噪点
3. [ ] 宣纸面板：半透明+纤维感
4. [ ] 哑光古金：暗金渐变，无box-shine
5. [ ] 材料过渡：木到石的铜条过渡节点
-->

---

### 2.6 光影哲学 — 需要的前端技术能力

**美学约束来源**: `modules/06-light.md`
**核心概念**: 天光漫射、漏光投影、侧光长影、漫反射有色、月光法

#### 需要的CSS技术清单

| 美学需求 | 需要的CSS技术 | 课程对应章节 | 优先级 | 当前状态 |
|---|---|---|---|---|
| 天光漫射 | 多层 `box-shadow` 向下柔和扩散 | 阴影章节 | P0 | [POC] shadow变量已定义 |
| 侧光长投影 | 大横向偏移 + 大模糊半径 | 阴影章节 | P1 | [TODO] |
| 漏光投影 | box-shadow + mask形状 | 阴影+遮罩章节 | P2 | [TODO] |
| 漫反射阴影 | 阴影用环境色（蓝/暖）而非黑 | 阴影+颜色章节 | P0 | [POC] shadow变量已用色值 |
| 文字光影 | `text-shadow` 上下双影 | 文字阴影章节 | P1 | [TODO] |
| 天光时间变化 | transition阴影颜色 | 过渡章节 | P2 | [TODO] |
| 发光效果 | `filter: drop-shadow()` | 滤镜章节 | P1 | [TODO] |
| 月光夜景 | 冷蓝box-shadow光晕 | 阴影+颜色章节 | P1 | [TODO] |

#### 需要产出的代码模式

<!-- TODO: 等待课程内容填充
1. [ ] 天光盒：多层shadow模拟上方漫射光
2. [ ] 侧光长影：raking light强调材质
3. [ ] 月光场景：冷蓝夜景+月亮光晕
4. [ ] 刻字效果：text-shadow内凹
5. [ ] 漏窗投影：窗格花纹在地面的影子
-->

---

### 2.7 动势 — 需要的前端技术能力

**美学约束来源**: `modules/08-motion.md`
**核心概念**: 五原型(云水烟风光)、东方缓动曲线、推门入场、呼吸循环、滚动进深

#### 需要的CSS技术清单

| 美学需求 | 需要的CSS技术 | 课程对应章节 | 优先级 | 当前状态 |
|---|---|---|---|---|
| 过渡动画基础 | `transition: property duration easing` | 过渡章节 | P0 | [TODO] |
| 关键帧动画 | `@keyframes` + `animation` | 动画章节 | P0 | [TODO] |
| 自定义缓动 | `cubic-bezier(x1,y1,x2,y2)` | 过渡/动画章节 | P0 | [POC] 缓动变量已定义 |
| 位移动画 | `transform: translateX/Y/Z()` | 2D/3D变换章节 | P0 | [TODO] |
| 缩放动画 | `transform: scale()` | 2D变换章节 | P1 | [TODO] |
| 旋转动画 | `transform: rotate()` | 2D变换章节 | P1 | [TODO] |
| 透明度动画 | `opacity` 动画 | 动画章节 | P0 | [TODO] |
| 循环动画 | `animation: ... infinite` | 动画章节 | P1 | [TODO] |
| 延迟错峰 | `animation-delay` 逐个设置 | 动画章节 | P1 | [TODO] |
| 滚动驱动动画 | `animation-timeline: scroll()` | 滚动驱动章节 | P2 | [TODO] |
| 视差滚动 | 多层不同速度动画 | 滚动+变换章节 | P2 | [TODO] |

#### 东方五原型关键帧清单

<!-- TODO: 等待动画课程内容填充后，精写以下5组keyframes
1. [ ] 云：cloud-drift — 极缓左右漂移+微缩放，6-12s循环
2. [ ] 水：water-wave — 正弦波动，3.5s循环
3. [ ] 烟：smoke-rise — 上升+漂移+变淡，4.5s循环
4. [ ] 风：wind-sway — 不规则摇曳，元素错峰延迟
5. [ ] 光：light-shift — 极缓明暗变化，8-12s循环
-->

#### 缓动曲线（已定义在 tokens.css）

```css
--ease-cloud:   cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-water:   cubic-bezier(0.33, 1, 0.68, 1);
--ease-smoke:   cubic-bezier(0.17, 0.67, 0.12, 0.99);
--ease-wind:    cubic-bezier(0.4, 0, 0.2, 1);
--ease-breath:  cubic-bezier(0.45, 0.05, 0.55, 0.95);
```

---

## 3. CSS 变量体系：东方美学设计令牌

**状态**: ✅ 已完成（见同目录 `tokens.css`）

`tokens.css` 可直接 `@import` 使用，包含：

| 类别 | 内容 | 状态 |
|---|---|---|
| 色彩令牌 | 五色正色（青/朱砂/古金/月白/黛）各4-5档 + 辅助色 + 语义色 | ✅ 完成 |
| 间距令牌 | 8px模数系统，9级间距阶梯 | ✅ 完成 |
| 字体令牌 | 字号7级 + 行高3档 + 字重3档 + 字体栈 | ✅ 完成 |
| 动效令牌 | 5条东方缓动曲线 + 7档时长 + 3个幅度参数 | ✅ 完成 |
| 阴影令牌 | 天光/侧光/漏光/月光/内阴影 5套预设 | ✅ 完成 |
| 边框圆角 | 4级圆角 + 4种边框样式 | ✅ 完成 |
| 比例常数 | 方五斜七/√2/双方圆/虚实比 | ✅ 完成 |

<!-- TODO: 精填时补充
- [ ] color-mix() 派生色变量
- [ ] 深色主题（玄青夜景）变量组
- [ ] 各配色方案的语义色切换方案
-->

---

## 4. 核心布局模式

> 以下布局模板等待完整课程内容填充后产出完整可运行HTML。
> 当前为需求框架。

### 4.1 中轴对称布局（殿堂式）

**需求**: 
- HTML语义结构：header > nav(东配殿 | h1正殿 | 西配殿) + main(正殿内容)
- CSS：Grid三列布局 `1fr auto 1fr`，主轴居中
- 视觉：古金顶线 + 天光阴影 + 宋体系字距

<!-- TODO: 完整HTML代码等待Flex/Grid课程内容后填充 -->

### 4.2 进深递进布局（院落式）

**需求**:
- HTML：纵向排列3个section（外院 → 门 → 内殿）
- CSS：`scroll-snap-type: y mandatory` + 每屏100vh
- 视觉：从亮到暗的空间递进，门是古金边框

<!-- TODO: 完整HTML代码等待scroll-snap课程内容后填充 -->

### 4.3 借景布局（框景/漏窗）

**需求**:
- HTML：figure > 窗洞div(clip-path海棠形) + img/渐变景 + figcaption
- CSS：`clip-path` 或 `border-radius` 做海棠窗洞
- 视觉：木框 + 古金内线 + 长投影

<!-- TODO: 完整HTML代码等待clip-path课程内容后填充 -->

### 4.4 留白布局（大虚小实）

**需求**:
- HTML：Grid两列 `5fr 7fr`（实:虚）
- CSS：虚侧径向渐变天光 + 竖排文字；实侧朱砂焦点
- 视觉：大面积月白 + 唯一墨点/朱印

<!-- TODO: 完整HTML代码等待Grid课程内容后填充 -->

---

## 5. POC 概念验证示例

> 以下示例基于现有90集转写内容制作，用于验证框架可行性。
> 标注 [POC]，后续会用完整课程内容替换精填。

### POC-1: 语义化HTML结构 — 殿堂式页面骨架

**来源能力**: `html-semantic-tagging` 能力卡（90集已覆盖）

```html
<!-- [POC] 语义标签映射：正殿=h1，配殿=h2，正文=p，强调=em，装饰=div -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>宋韵 · 半山听雨</title>
  <!-- TODO: 完整CSS等待tokens.css + 布局模板填充 -->
</head>
<body>
  <!-- 殿堂级标题：全页唯一h1 = 正殿 -->
  <header>
    <h1>半山听雨</h1>
    <p>— 一个人的中式美学空间 —</p>
  </header>

  <nav>
    <!-- 配殿导航：次级标题 -->
    <h2>东配殿</h2>
    <h2>西配殿</h2>
  </nav>

  <main>
    <section>
      <h2>主殿 · 听雨</h2>
      <p>
        山居听雨，<em>不是雨在响</em>，是心在静。
        <strong>一切声响，都落在空里。</strong>
      </p>
      <!-- span = 小包装袋，纯装饰包裹 -->
      <p><span>—— 录自《秋声赋》</span></p>
    </section>
  </main>
</body>
</html>
```

**映射验证**:
- h1 = 正殿（页面唯一主内容）✅ 符合语义化标签规则
- h2 = 配殿（次级标题层级）✅
- em = 着重阅读（"不是雨在响"）✅
- strong = 十分重要（"一切声响，都落在空里"）✅
- span = 装饰包裹（出处标注，无语义需求）✅

---

### POC-2: 图片资源选型 — 借景配图

**来源能力**: `image-format-selection` + `asset-path-resolution` 能力卡（90集已覆盖）

```html
<!-- [POC] 借景布局中的图片选型决策 -->
<!--
  借景需要一张远山配图：
  1. 是否透明？否 → JPG或PNG
  2. 是否动图？否 → 静态图
  3. 是否小图内联？否 → 外部文件
  4. 颜色丰富、无透明 → JPG（省体积）
  
  路径：图片在 images/ 子目录下
-->
<figure>
  <img src="images/distant-mountain.jpg" alt="远山如黛，青灰层叠">
  <figcaption>远借 · 远山</figcaption>
</figure>
```

**映射验证**:
- 大尺寸山景图 → JPG（有损压缩，体积小）✅
- 路径 `images/xxx.jpg` → 下级目录相对路径 ✅
- alt描述有意义 → 符合图片SEO最佳实践 ✅

<!-- TODO: 后续补充
- 透明背景的印章图 → PNG
- 小图标 → Base64内联
- 纹理优先CSS渐变，减少图片依赖
-->

---

## 6. 响应式与适配

<!-- TODO: 等待完整课程内容填充
需要覆盖：
1. [ ] clamp() 流式排版 — 字号随视口缩放
2. [ ] 媒体查询断点 — 移动端从殿堂变卷轴
3. [ ] aspect-ratio 比例保持 — 竖屏/横屏自适应
4. [ ] 减少动效偏好 — prefers-reduced-motion
5. [ ] 移动端模数微缩策略
-->

---

## 7. 能力卡引用框架

> 以下5张能力卡的引用位置和调用场景已搭好框架。

### 7.1 html-css-zhangtianyu-router（能力路由入口）

- **引用位置**: 本模块入口处
- **调用时机**: 当美学输出涉及多个HTML子能力时，先路由分发
- **规则**: 先读本卡，再按意图加载1张具体能力卡

### 7.2 image-format-selection（图片格式选型）

- **引用位置**: 第4章布局模板中需要配图时
- **调用场景**: 借景山景图、印章图、纹理图的格式选择
- **决策树**: 透明→PNG / 大图→JPG / 小图标→Base64 / 动图→GIF
- **东方补充**: 木纹/石纹优先CSS渐变，减少图片依赖

### 7.3 html-semantic-tagging（语义化标签）

- **引用位置**: 所有布局模板的HTML结构
- **映射规则**: h1=正殿(全页唯一) / h2=配殿 / p=廊庑正文 / em=着重 / strong=重要 / div=装饰袋
- **原则**: 语义即空间等级——不用div当正殿

### 7.4 asset-path-resolution（资源路径）

- **引用位置**: 布局模板中引用图片资源时
- **规则**: 同级直接写文件名 / 下级用 / / 上级用 ../ / 禁用本地绝对路径

### 7.5 html-nesting-rules（嵌套规则）

- **引用位置**: 写完HTML后自查
- **检查清单**: h1不套h2 / p内不放块级 / a内不套a / 行内不塞块级

---

## 附录：内容填充清单

> 等721集完整课程转写到位后，按以下清单逐项填充。

### 优先级 P0（必须精填）
- [ ] 2.1 空间秩序：Grid/Flexbox完整代码模式
- [ ] 2.4 色彩：color-mix() 实际用例
- [ ] 2.7 动势：transition + @keyframes 基础实现
- [ ] 4.1 中轴对称布局完整HTML
- [ ] 4.4 留白布局完整HTML

### 优先级 P1（重要）
- [ ] 2.2 虚实：clip-path揭示 + backdrop-filter软界
- [ ] 2.3 比例：clamp()流式排版
- [ ] 2.5 材料：木纹/宣纸渐变
- [ ] 2.6 光影：多层box-shadow天光
- [ ] 4.2 进深递进布局
- [ ] 4.3 借景框景布局

### 优先级 P2（增强）
- [ ] 2.2 虚实：mask漏窗
- [ ] 2.5 材料：噪点石纹 + 混合模式
- [ ] 2.6 光影：drop-shadow滤镜
- [ ] 2.7 动势：滚动驱动 + 视差
- [ ] 第6章响应式完整方案
