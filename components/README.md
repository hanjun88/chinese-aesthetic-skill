# 东方美学组件库 · Eastern Aesthetic Component Library

> 第三组子代理 K 交付物。原生 HTML + CSS + JS 实现，零框架依赖，复制即用。
> 状态：**DRAFT v0.1** —— 骨架与美学逻辑已立，动画细节与交互丰富度待完整课程内容（Vue 168 / React 154）到位后精填。

---

## 0. 依赖与约定

- **设计令牌**：所有颜色、间距、字体、缓动、阴影均来自 `../modules/frontend/tokens.css`。
  每个组件 `<head>` 里都有 `@import url('../modules/frontend/tokens.css');`，**不要在组件内重新定义颜色**。
- **类名前缀隔离**：每个组件使用独立前缀，互不冲突：
  | 组件 | 前缀 |
  |---|---|
  | 月洞门 MoonGate | `.mg-` |
  | 卷轴 ScrollPanel | `.sp-` |
  | 屏风 FoldingScreen | `.fs-` |
  | 花窗 LatticeWindow | `.lw-` |
  | 匾额 Plaque | `.pl-` |
  | 博古架 CurioShelf | `.cs-` |
- **动效铁律**：一律使用东方缓动 `--ease-cloud / --ease-water / --ease-smoke / --ease-breath`，时长 ≥ 800ms；**禁止弹跳、弹性、旋转入场、粒子爆炸**。
- **内存安全**：所有 JS 都在 IIFE 内，挂在元素上的监听都导出了 `window.__xxxCleanup()`，SPA 卸载时调用即可移除监听 / disconnect Observer / 取消 rAF。

---

## 1. 组件清单

| # | 组件 | 文件 | 一句话美学 | 核心技术 |
|---|---|---|---|---|
| 1 | 月洞门 MoonGate | `moon-gate.html` | 圆形为界，穿过即进入 | `border-radius:50%` + `rotateY` 门扇 + classList 状态 |
| 2 | 卷轴 ScrollPanel | `scroll-panel.html` | 展开为露，卷收为藏 | `scaleX/scaleY` + `transform-origin` + 端轴位移 |
| 3 | 屏风 FoldingScreen | `folding-screen.html` | 隔而不断，透中有界 | `perspective` + `rotateY` 锯齿折叠 + hover 半透明 |
| 4 | 花窗 LatticeWindow | `lattice-window.html` | 框景·漏景·借景 | `repeating-linear-gradient` 棂条 + mousemove 三层视差 |
| 5 | 匾额 Plaque | `plaque.html` | 点睛之笔，居中为尊 | `@keyframes` 落下 + `IntersectionObserver` + 延迟钤印 |
| 6 | 博古架 CurioShelf | `curio-shelf.html` | 错落有致，虚实相间 | CSS Grid `grid-template-areas` 不规则格 + hover 微动 |

---

## 2. 每个组件的美学约束与用法

### 2.1 月洞门 MoonGate（`moon-gate.html`）
- **为什么是东方的**：圆门是「界」（03-void-solid），开门不是显示内容而是一次「推门进入」（10-interaction）；闭合为满月（实）、开后方见山居（藏→露，七藏三露）。
- **交互**：点击圆门（或回车/空格）两扇半圆门扇以 `rotateY` 向外翻开，门后深青山居与月亮 `--ease-cloud` 淡入。
- **状态**：`closed` ↔ `open`，可逆。
- **嵌入内容**：把要藏在门后的内容写在 `.mg-scene` 内。

### 2.2 卷轴 ScrollPanel（`scroll-panel.html`）
- **为什么是东方的**：手卷「展一段看一段」，展开是露、卷收是藏；轴头先动、纸面随之铺开，有重量（--ease-water）。
- **交互**：按钮「展卷/收卷」，横向 `scaleX`、竖向 `scaleY` 从轴侧展开，两端木轴 + 古金轴头旋钮。
- **配置**：容器 `data-orientation="horizontal|vertical"`。

### 2.3 屏风 FoldingScreen（`folding-screen.html`）
- **为什么是东方的**：屏风是「软界」——隔而不断；悬停屏面 `opacity` 降到 0.35 让后方景透出（透中有界）；折开成锯齿即「移步换景」。
- **交互**：按钮折屏/铺平，4 扇以左缘为合页交替 `rotateY(±38°)`。

### 2.4 花窗 LatticeWindow（`lattice-window.html`）
- **为什么是东方的**：窗是画框（框景），棂条把景打碎（漏景），窗外远山随鼠标视差（远借）。
- **交互**：鼠标在窗内移动，远/中/近三层山按 `data-depth` 不同速度位移；按钮切换步步锦 / 冰裂纹 / 灯笼框三种棂格。

### 2.5 匾额 Plaque（`plaque.html`）
- **为什么是东方的**：匾是空间题眼，居中悬挂、是进入仪式的终点；匾自梁间缓缓落下、稳住不回弹，随后朱砂印钤下。
- **交互**：`IntersectionObserver` 进入视口 40% 才播落下动画；「重悬」可重播。

### 2.6 博古架 CurioShelf（`curio-shelf.html`）
- **为什么是东方的**：格非整齐矩阵，大小高低错落（错落有致）；有格满、有格空（虚实呼吸）。
- **交互**：悬停一格则格点亮（古金描边）、藏品格 `translateY(-4px)` 微浮起。

---

## 3. 如何运行 / 验证

每个文件都是**完整单文件 HTML**，目录结构保持不变时，直接用浏览器打开即可：

```bash
cd .../staging/components
# 任选其一，浏览器打开：
open moon-gate.html        # macOS
xdg-open moon-gate.html    # Linux
# 或在文件管理器双击
```

> 注意：组件用相对路径 `../modules/frontend/tokens.css` 引入令牌。
> 请保持 `components/` 与 `modules/frontend/` 的相对目录结构；若单独拷贝组件到别处，请把 `tokens.css` 放到对应相对位置，或把令牌 `:root{...}` 内联进该文件的 `<style>`。

**逐个验证清单：**
- `moon-gate.html`：点击圆门 → 门扇翻开、山居淡入；再点合上。
- `scroll-panel.html`：点「展卷」→ 横竖两卷同时铺开；「收卷」卷回。
- `folding-screen.html`：点按钮 → 四扇折成锯齿；悬停某扇 → 屏面变透明见后景。
- `lattice-window.html`：鼠标在窗上移动 → 远山分层视差；点按钮换三种棂格。
- `plaque.html`：向下滚动 → 行至匾处匾自上方落下、印章随后盖下；「重悬」重播。
- `curio-shelf.html`：悬停各格 → 描金高亮、藏品微浮起。

---

## 4. 组合方向（后续）

按「进入序列」（10-interaction）可把这些组件串成一条空间动线：
**月洞门（过门）→ 卷轴（展开叙事）→ 屏风（转折）→ 花窗（借景）→ 匾额（豁然/终点）→ 博古架（余韵陈列）**。
门开→屏展→卷展的状态级联留待 Phase 2 与框架层（Vue/React）状态机 `useAestheticState` 接通。

---

## 5. DRAFT 待办（Phase 2）

- [ ] 月洞门：门扇真实轨迹（弧形门扇滑动）、门后多层景深
- [ ] 卷轴：轴杆真实旋转（rotate）、纸边卷边效果
- [ ] 屏风：合页阴影、扇数/角度参数化
- [ ] 花窗：SVG 真实棂条纹样、格心雕花
- [ ] 匾额：悬梁绳、木纹质感
- [ ] 博古架：真实器物 SVG、层板投影
- [ ] 与 `useAestheticState`（开/合/藏/露/进/退）接通，做嵌套级联
