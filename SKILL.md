---
name: eastern-aesthetic-decision-engine
description: Use when designing any visual/spatial/interactive work that claims or aspires to Eastern (Chinese) aesthetic quality — before choosing colors, composing layouts, selecting materials, or animating motion. Triggers when a design risks becoming "Chinese elements pasted on" rather than structurally Chinese; when reviewing whether a concept answers "why is this Chinese?"; when constraining ACT-level design outputs. Also use when auditing existing work for 国潮贴图感 / 古装影视感 / 仿古景区感 / AI国风感. 增强后：当需求是「把这个中式设计做成页面/代码」时，在输出美学约束后继续路由到实现层，产出可运行 HTML/CSS/JS 或 Vue/React 组件。
---

# Eastern Aesthetic Decision Engine
## 东方空间美学决策引擎

> **核心断言**：一个设计之所以是中国的，不在于它有没有中国元素，而在于它的空间秩序、虚实关系、比例克制、材料逻辑、光影哲学、建筑精神、时间感、动势、色彩体系是否从结构层面生长出东方性。
>
> 本引擎回答的唯一问题是：**"这个设计为什么是中国的？"**
> 而非：**"这里有没有中国元素？"**

---

## 0. 何时启动

| 信号 | 启动 |
|---|---|
| 设计 brief 中出现"中式/东方/国风/禅意/宋韵/唐韵"等关键词 | ✅ 必须启动 |
| 即将进入 ACT 0 / ACT 1 / ACT N 的视觉或空间设计 | ✅ 必须启动，在 finesse-skill 之前 |
| 评审一个已有设计的"东方性" | ✅ 启动审计模式 |
| 选择配色、材质、动效、排版、空间布局 | ✅ 逐项过引擎 |
| 需求明确要"做成页面/可运行代码" | ✅ 走完整闭环：约束 → 实现层路由 → 代码 |
| 纯功能性 UI、无美学诉求的工具界面 | ❌ 不启动 |
| 明确要求西方/现代/极简风格且无东方诉求 | ❌ 不启动 |

**管线位置**：`finesse-brief → 本引擎(决策层) → 本引擎(实现层路由 §7) → finesse-skill → frame-smith → finesse-term`

---

## 1. 决策协议（Decision Protocol）

每次设计决策必须按以下四步执行，不可跳过：

### Step 1 — 结构归因（Structural Attribution）
在落笔/选色/排版之前，先回答：
> 这个设计的东方性，建立在哪个**结构维度**上？

从 11 个维度中选择至少 **3 个**作为设计的结构骨架（不是装饰层）：
1. Philosophy（哲学：界/庇护/进入/递进/朝向）
2. Spatial Order（空间秩序：中轴/开间/层级/尺度/进深）
3. Void/Solid（虚实：空/界/藏/露/透/借）
4. Proportion（比例：方五斜七/克制/少即是多）
5. Material（材料：木/石/土/金/纸/雾/光的真实感）
6. Light（光影：天光/漏光/侧光/漫反射）
7. Color（色彩：青/黛/月白/烟紫/古金/朱砂的比例关系）
8. Motion（动势：云/水/烟/风/光的东方运动）
9. Architecture（建筑精神：三段式/斗拱/举折/屋顶）
10. Interaction（交互：进入/递进/仪式/时间感）
11. Anti-Cliche（反俗套：禁忌检测）

**规则**：如果只能说出"用了红色/用了飞檐/用了毛笔字"，说明东方性只在装饰层，判定为 **FAIL**。

### Step 2 — 维度校验（Dimension Check）
对选定的每个结构维度，读取对应模块文件，提取该维度的**硬约束**和**软建议**，写入设计决策记录。

模块文件位于 `modules/` 目录：
- `modules/01-philosophy.md`
- `modules/02-spatial-order.md`
- `modules/03-void-solid.md`
- `modules/04-proportion.md`
- `modules/05-material.md`
- `modules/06-light.md`
- `modules/07-color.md`
- `modules/08-motion.md`
- `modules/09-architecture.md`
- `modules/10-interaction.md`
- `modules/11-anti-cliche.md`

### Step 3 — 反俗套扫描（Anti-Cliche Scan）
对设计产出执行 `modules/11-anti-cliche.md` 中的检测清单。命中任意一条 **HARD FAIL** 项，必须回炉重做，不可妥协。

### Step 4 — 归因陈述（Attribution Statement）
设计完成后，必须输出一段不超过 200 字的归因陈述：

> 本设计的东方性建立在 [维度A] 的 [具体机制]、[维度B] 的 [具体机制]、[维度C] 的 [具体机制] 之上。它不是通过 [常见元素] 获得中国感，而是通过 [结构原因] 使得观者在 [感知层面] 体验到东方性。

如果写不出这段陈述，设计未通过引擎。

---

## 2. 东方性评分卡（Chineseness Scorecard）

每个设计决策完成后，用以下评分卡自评。每项 0-2 分：

| 维度 | 0分（无） | 1分（装饰层） | 2分（结构层） |
|---|---|---|---|
| 空间秩序 | 无中轴/层级意识 | 有对称但无进深 | 中轴+开间+递进+尺度变化 |
| 虚实关系 | 满铺无留白 | 有空白但无功能 | 空/藏/露/透/借有叙事功能 |
| 比例克制 | 元素堆砌 | 有留白但比例随意 | √2/方五斜七/模数化克制 |
| 材料真实 | 贴图/渐变模拟 | 有材质感但不统一 | 木石土金纸的物理真实+时间痕迹 |
| 光影哲学 | 均匀打光/灯效 | 有明暗对比 | 天光/漏光/侧光/漫反射的方向性 |
| 建筑精神 | 无建筑意识 | 有屋顶/柱子符号 | 三段式/庇护/进入/朝向的空间逻辑 |
| 时间感 | 全新/做旧滤镜 | 有纹理但无逻辑 | 风化/包浆/痕迹的自然演进 |
| 动势 | 无动画/弹跳特效 | 有缓动但西式 | 云/水/烟/风/光的东方运动逻辑 |
| 色彩体系 | 高饱和红金 | 有传统色但比例失衡 | 青黛月白烟紫古金朱砂的比例克制 |
| 交互仪式 | 直接展示 | 有过渡但无意义 | 进入/递进/藏露的仪式感序列 |

**判定**：
- **≥16 分**：结构东方性成立，可进入下一 ACT / 进入实现层路由（§7）
- **10-15 分**：装饰层东方性，需补强至少 2 个结构维度
- **<10 分**：FAIL，回炉。这不是中国设计，是贴了中国元素的设计。

---

## 3. 与 ACT 系统的接口

### 对 ACT 0 的约束（以"云海+单门"为验证样本）

ACT 0 是整个体验的第一幕，是观者进入东方空间的第一个仪式。引擎对 ACT 0 的硬约束：

1. **进入感**：观者不是"看到"门，而是"抵达"门。门之前必须有空间递进（云海→远岸→阶→门），不可直接展示门。
2. **虚实**：云海为虚（空/藏），门为实（界/露）。门不可居中满铺，应在虚中浮现，借云海之势。
3. **比例**：门与云海的比例遵循"大虚小实"——门占画面不超过 1/4，其余为天空/云雾/远山。门自身比例参考方五斜七（高:宽 ≈ √2:1 或 7:5）。
4. **光影**：不可用聚光灯/舞台光。光源必须是天光（漫射、有方向、有时间感），门的轮廓靠逆光或侧光勾勒，不靠描边。
5. **动势**：云的运动是缓慢、连续、有体积感的流动，不是粒子飘散。门不可有任何弹跳/缩放/旋转入场动画。
6. **色彩**：主色为黛青/月白/烟紫的低饱和层次，门可施古金或朱砂但面积 ≤5%。不可出现高饱和正红+明黄的"宫墙色"组合。
7. **反俗套**：禁止祥云纹样贴图、禁止毛笔字标题、禁止红色宫墙、禁止灯笼、禁止飞檐翘角特写。

### 对后续 ACT 的通用约束

每个 ACT 启动前，引擎输出一份 **Aesthetic Constraint Sheet**（结构见 §9 代码生成协议），包含：
- 本 ACT 的结构维度选择（≥3个）
- 各维度的硬约束（来自模块文件）
- 色彩比例（主色/辅色/点缀色的百分比，精确 HSL 见 §8 映射总表）
- 动势规范（缓动曲线、时长、运动逻辑）
- 反俗套检查项

---

## 4. 核心原则（不可协商）

1. **结构先于装饰**：东方性必须从空间结构、比例、光影中生长，元素只是结果不是原因。
2. **克制即高级**：少即是多，但少不是空洞。每一处留白必须有功能（藏、呼吸、递进、借景）。
3. **真实即时间**：材料必须有物理真实感和时间痕迹。拒绝做旧滤镜，接受自然风化。
4. **光即建筑**：光是空间的塑造者，不是装饰。光源有方向、有来源、有时间。
5. **动即气**：动画是气的流动，不是特效。缓动曲线参考自然运动（云、水、烟、叶），不参考 UI 弹性。
6. **进入即仪式**：每一次界面切换都是一次空间进入，必须有递进、有藏露、有呼吸。
7. **俗套即失败**：国潮贴图感、古装影视感、仿古景区感、AI国风感——命中任意一种，整个设计判定偏离。

---

## 5. 快速参考：11维度一句话

| # | 维度 | 一句话 |
|---|---|---|
| 01 | Philosophy | 设计是"界"的建立——从无界到有界，从外界到内界 |
| 02 | Spatial Order | 中轴为骨，开间为节，进深为气，尺度为尊 |
| 03 | Void/Solid | 空不是无，是藏；实不是满，是界 |
| 04 | Proportion | 方五斜七，一分长则太长，一分短则太短 |
| 05 | Material | 木要见纹，石要见糙，纸要见透，金要见哑 |
| 06 | Light | 光从天上来，从隙中来，从侧来；不从灯里来 |
| 07 | Color | 青为骨，黛为肉，月白为气，朱砂为魂，古金为神 |
| 08 | Motion | 动如行云，缓如流水，聚如炊烟，散如轻风 |
| 09 | Architecture | 大屋顶庇护，木框架承重，高台基界定——三段即天地人 |
| 10 | Interaction | 每一次点击都是一次推门，每一次滚动都是一次进深 |
| 11 | Anti-Cliche | 有祥云纹≠中式，有红墙≠中式，有毛笔字≠中式 |

---

## 6. 模块索引

详细规则、参数、案例、禁忌均在各模块文件中。使用时必须 Read 对应模块，不可仅凭本页一句话执行。

```
modules/
├── 01-philosophy.md       # 哲学根基：界/庇护/进入/递进/朝向
├── 02-spatial-order.md    # 空间秩序：中轴/开间/层级/尺度/进深
├── 03-void-solid.md       # 虚实关系：空/界/藏/露/透/借
├── 04-proportion.md       # 比例与克制：方五斜七/√2/模数
├── 05-material.md         # 材料逻辑：木/石/土/金/纸/雾/光
├── 06-light.md            # 光影哲学：天光/漏光/侧光/漫反射
├── 07-color.md             # 色彩体系：青黛月白烟紫古金朱砂
├── 08-motion.md            # 动势：云/水/烟/风/光的东方运动
├── 09-architecture.md    # 建筑精神：三段式/斗拱/举折/屋顶
├── 10-interaction.md      # 交互：进入/递进/仪式/时间感
├── 11-anti-cliche.md       # 反俗套：四类俗套检测与修复
└── frontend/               # 【v2.0新增】实现层：把美学约束翻译成代码
    ├── html-css.md                  # HTML/CSS 实现层总览（broad）
    ├── javascript-interaction.md    # JS/交互实现层总览（broad）
    ├── framework-components.md      # Vue/React 组件化实现层（broad）
    ├── tokens.css                   # 东方美学设计令牌（102个CSS变量）
    └── mapping/                     # 6个深度映射（FINAL，基于721集完整课程）
        ├── E-spatial-void-layout.md      # 空间秩序+虚实 → CSS布局
        ├── F-proportion-color-system.md  # 比例+色彩 → CSS体系
        ├── G-material-light-visual.md    # 材料+光影 → CSS视觉
        ├── H-motion-interaction-js.md    # 动势+交互 → JS动画
        ├── I-architecture-philosophy-component.md  # 建筑精神+哲学 → 组件架构
        └── J-anti-cliche-code-review.md  # 反俗套 → 代码审查（41条规则）
```

**配套目录**（Skill 根目录下）：
- `components/` — 6个完整可运行HTML组件（月洞门/卷轴/屏风/花窗/匾额/博古架）
- `templates/` — 5个代码生成模板
- `docs/` — 架构设计文档 + 代码生成协议（2个JSON Schema + 3个端到端示例）
- `tools/` — anti-cliche-lint.js（可运行俗套检测工具）+ POC测试用例

---

## 7. 实现层路由（Implementation Layer Routing）

> 当 §1 决策协议走完、评分卡 ≥16 分后，若需求是"做成页面/代码"，进入本节路由。本层把 `AestheticConstraintSheet` 确定性地翻译成 `CodeGenerationPlan`，**不重新发明美学规则**。

### 7.1 路由入口判定

| 约束单信号 | 路由到 | 说明 |
|---|---|---|
| 含 color_system / proportion / lighting / motion 硬约束 | `modules/frontend/html-css.md` | 派生 `:root` CSS 变量 + 布局/光影/动势 |
| 含 interaction（进入仪式/滚动进深/推门/慢交互） | `modules/frontend/javascript-interaction.md` | 视差/IntersectionObserver/状态机 |
| `tech_stack.framework = react` | `modules/frontend/framework-components.md` → React 8 张卡 | 组件化改写 |
| `tech_stack.framework = vue` | `modules/frontend/framework-components.md` → Vue 5 张卡 | 组件化改写 |
| `tech_stack.framework = none` | 纯静态 `index.html + style.css + main.js` | 默认 |

### 7.2 路由纪律

1. **只引用，不重抄**：实现层模块以「路径 + 意图」引用 4 本 playbook 的能力卡（全量清单见 §8 末），不在本 Skill 内复制卡片正文。
2. **色值唯一来源**：所有颜色必须取自 §8 映射总表的精确 HSL，禁止即兴取色。
3. **模数唯一来源**：间距一律 `--m:8px` 的整数倍。
4. **回环复检**：代码生成后必须回灌 `modules/11-anti-cliche.md` 的色彩层/动效层清单，命中即回炉。

---

## 8. 美学→代码映射总表

> 11 维度 × 前端技术（HTML/CSS / JS / Vue / React）。每格给出**具体代码落点**，非概念。色值为精确 HSL。

| # | 维度 | HTML/CSS 落点（可粘贴） | JS 交互落点 | Vue 落点 | React 落点 |
|---|---|---|---|---|---|
| 01 | Philosophy | 语义分区：`<header class="outer-court">` / `<main class="inner-hall">`；界=屏风/门分隔 | 进入步骤状态机：`step` 0远观→1趋近→2过门→3豁然 | `data:{step:0}` + `v-if` 切步骤 | `this.state.step` + 条件渲染 |
| 02 | Spatial Order | `grid-template-columns:1fr 1.2fr 1fr; column-gap:calc(3*var(--m)); margin-inline:auto;`（中轴+三开间） | `scrollY` 映射进深百分比 | `computed.depth = scrollY/innerHeight` | refs 读 scrollY |
| 03 | Void/Solid | 留白 `padding:calc(8*var(--m))`；藏 `.gate{opacity:0}`；透 `backdrop-filter:blur(2px)` | `IntersectionObserver` 触发 `.is-revealed` | `:class="{hidden:!visible}"` + vfor | data-driven 条件渲染列表 |
| 04 | Proportion | `:root{--m:8px}`；画幅 `aspect-ratio:5/7`；间距用 m/2m/3m/4m/6m/8m | — | — | — |
| 05 | Material | 哑光金 `border:1px solid #B8860B`；纸质半透 `rgba(232,228,217,.5)`；木纹 `repeating-linear-gradient` | — | `:style="{background:paper}"` | inline style 纹理 |
| 06 | Light | 天光 `linear-gradient(180deg,hsl(44,27%,92%),hsl(211,13%,60%)45%,hsl(222,30%,15%))`；漏光 `repeating-linear-gradient`；阴影用 `--c-shadow:#1A2332` 非纯黑 | 晨/昏/夜主题切换函数 | `watch.theme` 切渐变 | `setState({theme})` |
| 07 | Color | `:root{--c-primary:#E8E4D9;--c-secondary:#2C3E50;--c-accent:#B8860B}`；主65/辅25/点6；S≤50% | 主题色切换 | `computed.palette` 派生 | `props.palette` 传入 |
| 08 | Motion | `@keyframes drift-cloud{}` + `--ease-cloud:cubic-bezier(.25,.1,.25,1)`；4–8s；禁 bounce/spin/linear | `requestAnimationFrame` 三层视差 0.2/0.5/1.0 | `@scroll.passive` 节流 | refs 操作 `transform` |
| 09 | Architecture | 三段式 `grid-template-rows:45fr 35fr 20fr`；屋顶 `border-radius:50% 50% 0 0/100% 100% 0 0`（举折） | — | — | `<Gate><Roof/><Body/><Base/></Gate>` |
| 10 | Interaction | `scroll-snap-type:y mandatory`；过渡 `transition:.6s` | 点击推门：`el.classList.add('is-open')` | `@click.stop` 推门 | `onClick` + 箭头函数绑 this |
| 11 | Anti-Cliche | 禁 `#FF0000/#FFD700/#000000`、祥云满铺、毛笔字标题 | `debug-errors` 排障；grep 禁词 | — | — |

### 8.1 精确色彩速查（HSL/RGB/比例）

| 色名 | HEX | HSL | 角色/面积 |
|---|---|---|---|
| 月白 | `#E8E4D9` | `hsl(44,25%,88%)` | 主色 60–70% |
| 缟素 | `#F0EDE5` | `hsl(44,27%,92%)` | 主色浅阶 |
| 黛青 | `#2C3E50` | `hsl(210,28%,24%)` | 辅色 20–30% |
| 玄青 | `#1A1A2E` | `hsl(240,28%,14%)` | 阴影/暗部 5–10% |
| 青(青绿) | `#4A6B5C` | `hsl(153,18%,35%)` | 山水 ≤15% |
| 烟紫 | `#6E5D7C` | `hsl(273,14%,43%)` | 暮色 ≤10% |
| 古金 | `#B8860B` | `hsl(43,89%,38%)` | 点睛 ≤8%（哑光，禁 #FFD700） |
| 朱砂(暗) | `#8B2500` | `hsl(16,100%,27%)` | 极小面积 ≤5% |
| 朱砂(沉) | `#A52A2A` | `hsl(0,59%,41%)` | 大面积朱砂替代 ≤10% |
| UI朱砂 | — | `hsl(16,45%,35%)` | 按钮主色（安全降饱和） |

### 8.2 动势可复用参数（CSS 变量）

```css
:root{
  --ease-cloud:  cubic-bezier(.25,.1,.25,1);   /* 云 4–8s */
  --ease-water:  cubic-bezier(.33,1,.68,1);    /* 水 2–5s */
  --ease-smoke:  cubic-bezier(.17,.67,.12,.99);/* 烟 3–6s */
  --ease-breath: cubic-bezier(.45,.05,.55,.95);/* 呼吸 5–15s */
}
```

### 8.3 全量前端能力卡引用清单（27 张，无一遗漏）

实现层模块按下列路径引用（`<playbook>` 前缀为各 dist 根目录）：

- **html-css.md**：html-doc-skeleton、html-semantic-tagging、html-nesting-rules、img-alt-seo、image-format-selection、asset-path-resolution、webp-progressive-enhancement（7 张）
- **javascript-interaction.md**：type-conversion、data-types-typeof、data-driven-render、branch-switch、debug-errors、equality-logic、let-const-naming（7 张）
- **framework-components.md（React）**：react-jsx-rules、react-event-this-binding、react-state-setstate、react-props-passing、react-refs-dom-access、react-props-validation、react-setup-three-libs、react-component-definition（8 张）
- **framework-components.md（Vue）**：instance-binding、event-modifiers、computed-watch、vfor-key-diff、style-conditional（5 张）

---

## 9. 代码生成协议（Code Generation Protocol）

> 输入：`AestheticConstraintSheet`（§3）→ 输出：可运行代码（index.html + style.css + main.js 或 .vue/.jsx）。

### 9.1 生成步骤（7 步，不可跳步）

1. **读约束单**：确认 `structural_dimensions ≥3`、`color_system` 有精确 HSL、`anti_cliche.scanned=true`。缺字段 → 回 §1 补。
2. **派生 CSS 变量**：把 `color_system` + `proportion` + `motion.easing` 落成 `:root{}` 块（照抄 §8.1/§8.2，不改值）。
3. **定技术栈**：按 `tech_stack.framework` 选 none/react/vue，决定产物形态。
4. **路由能力卡**：按 §7.1 加载对应实现层模块与能力卡（§8.3）。
5. **组装组件**：把 `components[]` 逐个映射到 `modules/frontend/components/` 的东方组件（§10）。
6. **质量门复检**：跑 §9.2 清单 + 回灌 `modules/11`。
7. **输出归因**：代码后附 §1 Step4 归因陈述。

### 9.2 质量门检查清单（逐条打勾）

- [ ] 全图最大饱和度 ≤ 50%？
- [ ] 无 `#FF0000` / `#FFD700` / `#000000` / `#00FFFF`？
- [ ] 无 bounce / back / spin / linear / 粒子爆炸 easing？
- [ ] 所有间距是 `--m:8px` 的整数倍？
- [ ] 留白 ≥ 35%、视觉焦点 ≤ 1？
- [ ] 至少 1 个极缓（5–15s）呼吸循环？
- [ ] 阴影带环境色（黛影 `#1A2332`），非纯黑？
- [ ] 入场是"被遮挡→浮现"（emerge）而非弹出？
- [ ] 归因陈述 ≤200 字且说出 ≥3 个结构维度？
- [ ] 本计划引用的能力卡路径全部有效？

**任一条不过 → 回炉，不得交付。**

---

## 10. 东方美学组件库索引

> 每个组件是**完整单文件 HTML**（含 `<!DOCTYPE>` + `<style>` + `<script>`），浏览器直接打开即运行。位于 Skill 根目录 `components/`，依赖同级 `modules/frontend/tokens.css`。

| 组件 | 文件 | 美学维度 | 核心技术 |
|---|---|---|---|
| 月洞门 MoonGate | `moon-gate.html` | 01/09/03/08 | `border-radius:50%` 圆界；左右门扇 `perspective()+rotateY(±115°)` 外翻；classList 切 `is-open`，点击/回车可逆 |
| 卷轴 ScrollPanel | `scroll-panel.html` | 03/10 | `scaleX/scaleY` + `transform-origin` 从轴侧展开；`data-orientation` 切换横竖；`--ease-water` 展卷 |
| 屏风 FoldingScreen | `folding-screen.html` | 03/10 | `perspective:1200px` + 每扇 `rotateY` 折成锯齿；悬停 `opacity:.35` 透见后景（透中有界） |
| 花窗 LatticeWindow | `lattice-window.html` | 06/03 | `repeating-linear-gradient` 三种棂格（步步锦/冰裂/灯笼框）；mousemove rAF 节流视差 |
| 匾额 Plaque | `plaque.html` | 09/07/11 | `@keyframes` 自上落下（`--ease-water` 有重量不回弹）；`IntersectionObserver` 触发；朱砂印延迟钤下 |
| 博古架 CurioShelf | `curio-shelf.html` | 02/03 | CSS Grid `grid-template-areas` 8格不规则布局；空格留白；悬停描古金边 + 藏品微浮 |

**组件化改写**：选 React/Vue 时，把上述单文件的 `<style>` 转 inline/CSS module，`<script>` 转 `useState`/`data`，DOM 结构转 JSX/`<template>`，完整双版本组件见 `modules/frontend/mapping/I-architecture-philosophy-component.md`。

---

*v2.0-FINAL — 基于 721 集完整前端课程（HTML/CSS 199集 + JavaScript 200集 + Vue 168集 + React 154集）精填。本引擎是设计系统的约束层，不是风格指南。它不告诉你画什么，它告诉你什么使得一个设计从结构上成为东方的——并保证这份东方性能落地为可运行、可复检、不塌房的前端代码。*
