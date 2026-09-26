<!--
  ================================================================
  子代理E 产出：空间秩序 + 虚实 → CSS布局实现
  状态: FINAL v1.0
  范围: 02-spatial-order.md + 03-void-solid.md → 前端布局技术
  课程来源: HTML/CSS 全199集完整转写
  ================================================================
-->

# 空间秩序 × 虚实关系 — CSS布局实现模块

> **状态**: FINAL v1.0
> **专注**: 中轴/开间/进深/层级 → Flexbox/定位布局；空/藏/界/透/借 → 可见性与边界控制
> **配套**: `tokens.css` 提供色彩/间距/动效变量，本模块专注布局结构

---

## 1. 需求总览

### 1.1 两个美学维度 → CSS布局技术的映射关系

| 美学维度 | 核心概念 | CSS布局技术 | 关键属性与值 |
|---|---|---|---|
| 空间秩序 | 中轴对称 | Flexbox 主轴居中 | `display: flex; justify-content: center; align-items: center` |
| 空间秩序 | 开间模数 | Flex 比例分配 | `flex: 1.2 / 1 / 0.9 / 0.8`（明间/次间/梢间/尽间） |
| 空间秩序 | 区域嵌套 | Flex 嵌套 + 版心 | 外层Flex纵向，内层Flex横向 |
| 空间秩序 | 层级堆叠 | 定位 + z-index | `position: relative` + `z-index: 10/5/1` |
| 空间秩序 | 进深递进 | 纵向排列 + 视差 | Flex column + 滚动高度差 |
| 空间秩序 | 尺度对比 | 字号/间距模数差 | h1:2rem → h2:1.25rem → p:1rem（2:1.25:1） |
| 虚实关系 | 藏（溢出裁切） | overflow | `overflow: hidden` |
| 虚实关系 | 藏（不占位隐藏） | display | `display: none` |
| 虚实关系 | 藏（占位隐藏） | visibility | `visibility: hidden` |
| 虚实关系 | 藏（透明） | opacity | `opacity: 0` |
| 虚实关系 | 硬界 | 边框 | `border: 1px solid` + 不透明背景 |
| 虚实关系 | 软界 | 半透明 + 模糊 | `rgba()` + `backdrop-filter: blur()` |
| 虚实关系 | 不完整裁切 | overflow | 容器 `overflow: hidden`，元素超出 |

---

## 2. 空间秩序 → Flexbox 布局映射

> 以下内容基于课程第184-196集「伸缩盒模型 Flexbox」完整教学内容。

### 2.1 中轴对称布局

**美学约束**: 正殿在中轴上，配殿两侧从属，方向感必须连续。

#### Flexbox 居中三板斧（课程第191集）

```css
/* 水平垂直居中：最常用的中轴实现 */
.hall-center {
  display: flex;
  justify-content: center;  /* 主轴居中 = 水平中轴 */
  align-items: center;      /* 侧轴居中 = 垂直中轴 */
  min-height: 100vh;
}
```

#### 殿堂三栏：东配殿 | 正殿 | 西配殿

```css
/* 来源: 课程第189集 justify-content + 第190集 align-items */
.hall-nav {
  display: flex;
  justify-content: space-between; /* 两端对齐 = 配殿靠两侧 */
  align-items: center;            /* 垂直居中 */
  width: 100%;
  max-width: 960px;
}

.hall-nav .main-hall {
  /* 正殿：居中，视觉最重 */
  font-size: 2rem;
  letter-spacing: 0.3em;
}
```

#### 三种中轴的Flex实现

| 中轴类型 | 美学情绪 | CSS写法 | 具体值 |
|---|---|---|---|
| 严格中轴 | 庄严/权力 | `justify-content: center` | 所有项目居中对齐 |
| 偏移中轴 | 文人意趣 | `justify-content: center` + `margin-right: 8%` | 正殿偏移8%，打破完全对称 |
| 两端展开 | 院落廊庑 | `justify-content: space-between` | 两侧贴边，中间均匀分布 |
| 均匀分布 | 列柏/柱列 | `justify-content: space-evenly` | 项目间距全相等 |

---

### 2.2 开间模数系统

**美学约束**: 明间最宽(1.2x) > 次间(1.0x) > 梢间(0.9x) > 尽间(0.8x)。

#### Flex 比例分配（课程第192-193集：flex-basis + flex-grow）

```css
/* 七开间：用 flex 比例实现明间/次间/梢间/尽间宽度差 */
.seven-bay {
  display: flex;
  gap: 8px; /* 柱间距 */
  height: 200px;
}

.seven-bay > div {
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(45, 30%, 96%);
  border: 1px solid hsl(40, 15%, 75%);
}

/* 从左到右：尽间 → 梢间 → 次间 → 明间 → 次间 → 梢间 → 尽间 */
.seven-bay > div:nth-child(1) { flex: 0.8; } /* 尽间 */
.seven-bay > div:nth-child(2) { flex: 0.9; } /* 梢间 */
.seven-bay > div:nth-child(3) { flex: 1;   } /* 次间 */
.seven-bay > div:nth-child(4) { flex: 1.2; } /* 明间（最宽） */
.seven-bay > div:nth-child(5) { flex: 1;   } /* 次间 */
.seven-bay > div:nth-child(6) { flex: 0.9; } /* 梢间 */
.seven-bay > div:nth-child(7) { flex: 0.8; } /* 尽间 */

.seven-bay > div:nth-child(4) {
  /* 明间：正殿，视觉权重最高 */
  background: hsl(42, 25%, 92%);
  border-color: hsla(43, 65%, 40%, 0.4);
}
```

#### flex 属性详解（课程第192-194集）

```css
/* flex 是 flex-grow flex-shrink flex-basis 的复合属性 */
.bay {
  /* flex-grow: 剩余空间如何分配 */
  /* flex-shrink: 空间不足时如何收缩 */
  /* flex-basis: 初始基准长度 */
  flex: 1; /* 等价于 flex: 1 1 0% */
}
```

---

### 2.3 定位与层级（课程第139-144集）

**美学约束**: 至少3个空间层级，通过高度/位置/装饰区分。

#### 四种定位对比

| 定位方式 | 是否脱离文档流 | 相对谁定位 | 美学应用 |
|---|---|---|---|
| `position: relative` | 否 | 自身原位置 | 配殿微调偏移，不影响整体布局 |
| `position: absolute` | 是 | 最近的定位祖先 | 正殿牌匾、印章装饰 |
| `position: fixed` | 是 | 浏览器视口 | 顶部导航栏、底部呼吸线 |
| `position: sticky` | 否 | 滚动时粘性 | 院落滚动时的门楣停留 |

#### z-index 层级（课程第143集）

```css
/* 三级空间层级：正殿 > 配殿 > 廊庑 */
.hall-foreground { position: relative; z-index: 10; } /* 正殿 */
.hall-middle     { position: relative; z-index: 5;  } /* 配殿 */
.hall-background { position: relative; z-index: 1;  } /* 廊庑 */
```

#### 水平垂直居中：定位+位移法（课程第179集 2D变换）

```css
/* 正殿在院落中完美居中 */
.center-absolute {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%); /* 推回自身宽高的一半 */
}
```

---

### 2.4 进深递进布局

**美学约束**: 核心空间前至少1层过渡空间。

```css
/* 院落式进深：Flex纵向排列，每屏一进 */
.courtyard {
  display: flex;
  flex-direction: column; /* 主轴改为垂直 = 纵向进深 */
  height: 100vh;
  overflow-y: auto;
}

.court {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.court.outer {
  /* 外院：明亮、开阔 */
  background: hsl(42, 25%, 88);
}

.court.gate {
  /* 二门：过渡，稍暗 */
  min-height: 50vh;
  background: hsl(210, 20%, 25%);
}

.court.inner {
  /* 内殿：最深、最暗 */
  background: hsl(0, 5%, 17%);
  color: hsl(45, 30%, 96%);
}
```

---

## 3. 虚实关系 → 可见性与边界控制

> 以下内容基于课程第126-127集「溢出处理 + 隐藏元素」完整教学。

### 3.1 四种「藏」的方式对比

| 藏法 | CSS属性 | 是否占位 | 美学适用场景 |
|---|---|---|---|
| 溢出裁切 | `overflow: hidden` | 是（但超出部分看不见） | 画面边缘裁切、不完整构图 |
| 完全隐藏 | `display: none` | 否（完全不占位） | 移动端隐藏配殿导航 |
| 占位隐藏 | `visibility: hidden` | 是（仍占位但不可见） | 预留位置待揭示 |
| 透明藏 | `opacity: 0` | 是 | 呼吸循环、淡入淡出 |

**课程原文要点**：
- `display: none` → 不占位，浏览器完全不渲染
- `visibility: hidden` → 占位，只是看不见
- `overflow: hidden` → 内容超出容器的部分被裁切

#### 七藏三露：位移+溢出实现

```css
/* 来源: 03-void-solid.md 七藏三露 */
.veiled-panel {
  position: relative;
  height: 200px;
  overflow: hidden; /* 超出部分被裁切 */
  border: 1px solid hsl(40, 15%, 75%);
}

.veiled-panel .content {
  /* 默认藏：向下偏移，只露出顶部1/3 */
  transform: translateY(-66%);
  transition: transform 1.5s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.veiled-panel:hover .content {
  transform: translateY(0); /* 推门：完全揭示 */
}
```

---

### 3.2 界的四种形态

**美学约束**: 一个设计至少2种界的形态。

| 界形态 | CSS实现 | 视觉效果 |
|---|---|---|
| 硬界 | `border: 1px solid` + 不透明背景 | 明确、割裂 |
| 软界 | `background: rgba(...,0.35)` + 半透明 | 朦胧、过渡 |
| 虚界 | 渐变边界 `linear-gradient` | 无形、暗示 |
| 无界 | `border: none` + 背景融入 | 开放、融合 |

#### 软界：半透明屏风

```css
.soft-screen {
  /* 月白半透明 = 似隔非隔 */
  background: hsla(42, 25%, 88%, 0.35);
  border: 1px solid hsla(43, 65%, 40%, 0.15);
}
```

#### 硬界：朱墙

```css
.hard-wall {
  background: hsl(16, 82%, 27%); /* 暗朱砂 */
  border: none;
  /* 不透明 = 硬界 */
}
```

---

### 3.3 借景与框景

```css
/* 框景：用 overflow + 固定宽高比框住一片景 */
.borrow-frame {
  width: 300px;
  height: 380px;
  overflow: hidden; /* 超出窗洞的景色被裁掉 */
  border: 10px solid hsl(25, 30%, 35%); /* 木框 */
  border-radius: 4px 4px 80px 4px; /* 海棠形窗洞 */
}

.borrow-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

---

## 4. 完整可运行布局模板

### 模板一：七开间殿堂（Flexbox 中轴对称）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>七开间殿堂 — 中轴对称布局</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: "Songti SC", "Noto Serif SC", serif;
  background: hsl(42, 25%, 88);
  color: hsl(210, 20%, 25%);
}

.hall {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

/* 导航：东配殿 | 正殿 | 西配殿 */
.hall-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 960px;
  padding: 2rem 3rem;
}

.hall-nav .main {
  font-size: 1.8rem;
  letter-spacing: 0.3em;
}

.hall-nav .wing {
  font-size: 0.9rem;
  color: hsl(0, 3%, 45%);
}

/* 七开间 */
.seven-bay {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  max-width: 1200px;
  padding: 2rem;
  flex: 1;
}

.seven-bay > div {
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(45, 30%, 96%);
  border: 1px solid hsl(40, 15%, 75%);
  font-size: 0.8rem;
  color: hsl(0, 3%, 45%);
}

.seven-bay > div:nth-child(1) { flex: 0.8; }
.seven-bay > div:nth-child(2) { flex: 0.9; }
.seven-bay > div:nth-child(3) { flex: 1;   }
.seven-bay > div:nth-child(4) {
  flex: 1.2;
  background: hsl(42, 25%, 92%);
  border-color: hsla(43, 65%, 40%, 0.4);
  color: hsl(210, 20%, 25%);
  font-size: 1rem;
  letter-spacing: 0.2em;
}
.seven-bay > div:nth-child(5) { flex: 1;   }
.seven-bay > div:nth-child(6) { flex: 0.9; }
.seven-bay > div:nth-child(7) { flex: 0.8; }
</style>
</head>
<body>
  <header class="hall">
    <nav class="hall-nav">
      <span class="wing">东配殿</span>
      <span class="main">正 殿</span>
      <span class="wing">西配殿</span>
    </nav>
    <div class="seven-bay">
      <div>尽间</div>
      <div>梢间</div>
      <div>次间</div>
      <div>正殿</div>
      <div>次间</div>
      <div>梢间</div>
      <div>尽间</div>
    </div>
  </header>
</body>
</html>
```

---

### 模板二：三进院落（进深递进 + 明暗对比）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>三进院落 — 进深递进布局</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Songti SC", serif; }

.courtyard {
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.court {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.court.outer {
  background: hsl(42, 25%, 88);
  color: hsl(210, 20%, 25%);
}

.gate {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(210, 20%, 25%);
}

.gate-frame {
  width: 80px;
  height: 120px;
  border: 1px solid hsla(43, 65%, 40%, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(40, 50%, 55%);
  font-family: "Kaiti SC", serif;
  font-size: 1.5rem;
}

.court.inner {
  background: hsl(0, 5%, 17%);
  color: hsl(45, 30%, 96%);
}

h2 { font-weight: normal; letter-spacing: 0.3em; margin-bottom: 1rem; }
p { line-height: 1.8; opacity: 0.8; }
</style>
</head>
<body>
  <main class="courtyard">
    <section class="court outer">
      <div>
        <h2>外 院</h2>
        <p>第一进 · 开阔明亮<br>过渡空间，视线初入</p>
      </div>
    </section>
    <section class="gate">
      <div class="gate-frame">門</div>
    </section>
    <section class="court inner">
      <div>
        <h2>内 殿</h2>
        <p>第二进 · 深邃安静<br>核心空间，藏于院后</p>
      </div>
    </section>
  </main>
</body>
</html>
```

---

### 模板三：七藏三露（overflow + 位移 藏露切换）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>七藏三露 — 藏露切换布局</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: "Songti SC", serif;
  background: hsl(42, 25%, 88);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.demo {
  width: 320px;
}

.demo h3 {
  font-weight: normal;
  letter-spacing: 0.2em;
  color: hsl(0, 3%, 45%);
  margin-bottom: 1rem;
  text-align: center;
}

.veiled {
  position: relative;
  height: 200px;
  overflow: hidden; /* 硬裁切 = 七藏 */
  border: 1px solid hsl(40, 15%, 75%);
  background: hsl(45, 30%, 96%);
}

.veiled .content {
  padding: 1.5rem;
  /* 默认藏：向下偏移，只露顶部1/3 */
  transform: translateY(-66%);
  transition: transform 1.5s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.veiled:hover .content {
  transform: translateY(0); /* 推门：完全揭示 */
}

.veiled .content p {
  font-size: 0.875rem;
  line-height: 1.8;
  color: hsl(210, 20%, 25%);
}

.hint {
  text-align: center;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: hsl(0, 3%, 55%);
}
</style>
</head>
<body>
  <div class="demo">
    <h3>七 藏 三 露</h3>
    <div class="veiled">
      <div class="content">
        <p>
          山居听雨，不是雨在响，是心在静。<br><br>
          一切声响，都落在空里。<br><br>
          —— 这是被藏住的内容，<br>
          悬停时缓缓推开。
        </p>
      </div>
    </div>
    <p class="hint">— 悬停查看揭示 —</p>
  </div>
</body>
</html>
```

---

## 5. 响应式适配（课程第197-198集）

```css
/* 媒体查询断点 */
@media (max-width: 768px) {
  /* 移动端：殿堂变卷轴 */
  .hall-nav {
    flex-direction: column;
    gap: 1rem;
  }

  .hall-nav .wing {
    display: none; /* 移动端隐藏配殿导航 */
  }

  .seven-bay {
    flex-direction: column;
  }

  .seven-bay > div {
    min-height: 60px;
  }
}
```

---

## 6. 技术覆盖说明

### 课程已完整覆盖的布局技术
- Flexbox 全部属性（容器+项目，第184-196集）
- 四种定位方式 + z-index（第139-144集）
- overflow 溢出处理（第126集）
- display:none vs visibility:hidden（第127集）
- 2D transform 位移居中（第179集）
- 媒体查询响应式（第197-198集）

### 课程未覆盖、需补充的现代CSS
- CSS Grid 布局（grid-template-columns/areas）
- clip-path 路径裁切
- mask-image 遮罩镂空
- backdrop-filter 背景模糊
- aspect-ratio 比例容器
- clamp() 流式排版
- scroll-snap 滚动捕捉
