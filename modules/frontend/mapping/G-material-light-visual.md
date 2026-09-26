<!-- FINAL v1.0：基于完整 199 集课程转写精填，已替换全部 POC/TODO 占位 -->

# G · 材料真实（05）+ 光影哲学（06）→ CSS 视觉映射

> 子代理 G 的专注范围：**材料 + 光影 → CSS 渐变 / 纹理 / 阴影 / 滤镜**。
> 美学来源：`05-material.md`（木见纹 / 石见糙 / 土见颗粒 / 金见哑 / 纸见透 / 雾见体积）、`06-light.md`（天光 / 漏光 / 侧光 / 漫反射 / 月光法）。
> 核心信条：**真实即时间**。纹理要有物理成因，阴影要有来源和方向，时间痕迹不均匀分布——拒绝"做旧滤镜"。
> 本文件所有代码均可直接粘贴运行；色值统一 `hsl()/hsla()`，便于按色相-饱和-明度调时间与温度。

---

## 0. 框架：CSS 技术需求清单与课程覆盖度

> 标注 `[课程]` = 199 集正式讲授；`[增强]` = 课程外、浏览器标准 CSS（渐进增强，需自行兜底）。

| 美学意图 | CSS 属性 / 函数 | 覆盖度 | 关键参数（课程实证） |
|---|---|---|---|
| 渐变本质 | `background-image` 填渐变（渐变=代码画的背景图） | `[课程]177` | 不写 url，直接写 gradient 函数 |
| 木/土条纹 | `repeating-linear-gradient()` | `[课程]177` | 必须先有"纯色区间"才会重复；色标间距定疏密 |
| 石/球/光 | `radial-gradient(ellipse/circle … at …)` | `[课程]177` | 圆心用 `at left top` 关键词或 `at 80px 80px`；半径 `100px 50px` 定椭圆 |
| 多层叠加 | `background:` 逗号列多层（课例最多 4 层 + 位置） | `[课程]174` | 后写层压在下，先写层压在上 |
| 纹理噪点 | `url(data:image/svg+xml)` + `feTurbulence` | `[增强]` | `baseFrequency` 控颗粒粗细，`opacity` 压低 |
| 石糙/包浆 | `box-shadow: inset …` | `[课程]173` | `inset` 关键字触发内阴影；偏移反向 |
| 纸横格/漏窗格 | `repeating-linear-gradient(transparent…)` + `background-clip: content-box` | `[课程]174/177` | 横格纸课例：透明区间 + 一条实线 + content-box 裁边 |
| 金/立体球/月亮 | `radial-gradient(at 偏移, 高光, 暗部)` | `[课程]177` | 圆心偏移=受光点，偏移后立刻有体积（立体球课例） |
| 天光/漫反射 | 多层 `box-shadow: h v blur [spread] color` | `[课程]173` | 4 值最常用；阴影带环境色，禁纯黑 |
| 侧光 | 大偏移 `box-shadow` / `filter: drop-shadow()` | `[课程]173`+`[增强]` | 方向=光源反方向 |
| 漏光光束 | `clip-path: polygon()` + 光束渐变衰减 | `[增强]` | 楔形裁剪 + `mix-blend-mode: screen` |
| 雾体积 | 纵向 `linear-gradient(hsla)` 透明度渐变 + `backdrop-filter: blur()` | `[增强]` | 透明度沿轴递进=体积 |
| 文字浮雕/阴刻 | 多层 `text-shadow`（高光+暗部成对） | `[课程]176` | h v blur；偏移可置 0 做柔光 |
| 匾额空心字 | `-webkit-text-stroke: width color` | `[课程]176` | 仅 WebKit 内核，做空心描边 |
| 卡片浮起 | `box-shadow` + `transition` | `[课程]173/181` | 小米商城悬停：上移 1px + 阴影浮现，`transition: .4s` |

> 课程语法校准（173 集）：`box-shadow: h-offset v-offset blur spread color inset;`
> 仅 2 值=生硬描边感；**第 3 值 blur 必须给**才柔和；spread（外延）课程提醒"别给大，丑"，本文件一律 ≤2px 或负值收拢。

---

## 1. 材料 CSS 配方（可直接运行）

### 1.1 木 · 见纹（竖向柱纹 / 横向梁纹）

木纹方向=结构方向。柱用竖纹（`repeating-linear-gradient(90deg,…)` 产生沿纵向延伸的条纹），梁用横纹。包浆只加在**常触碰的两侧边缘**——时间痕迹有物理成因，不全张泛旧。

```css
/* 木柱 · 竖向木纹（暖老榆木） */
.wood-column {
  /* 顶层：SVG 导管孔隙噪点；中层：竖向导管条纹；底层：纵向明暗渐变 */
  background:
    url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='240'%20height='240'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.9'%20numOctaves='2'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='saturate'%20values='0'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23n)'%20opacity='0.18'/%3E%3C/svg%3E"),
    repeating-linear-gradient(90deg,
      hsl(28, 34%, 40%) 0px,
      hsl(28, 30%, 35%) 2px,
      hsl(30, 36%, 46%) 6px,
      hsl(28, 28%, 33%) 11px,
      hsl(28, 34%, 40%) 16px),
    linear-gradient(180deg,
      hsl(30, 36%, 46%) 0%,
      hsl(28, 32%, 39%) 55%,
      hsl(26, 30%, 33%) 100%);
  /* 常触两侧包浆=微弱亮边；底部暗沉=落地受潮 */
  box-shadow:
    inset 3px 0 6px hsla(30, 20%, 72%, 0.18),
    inset -3px 0 6px hsla(30, 20%, 72%, 0.18),
    inset 0 -8px 14px hsla(0, 0%, 0%, 0.25);
}

/* 木梁 · 横向木纹：90deg 与 180deg 互换即可 */
.wood-beam {
  background:
    repeating-linear-gradient(0deg,
      hsl(26, 32%, 38%) 0px,
      hsl(26, 28%, 33%) 2px,
      hsl(28, 34%, 44%) 6px,
      hsl(26, 26%, 31%) 11px,
      hsl(26, 32%, 38%) 16px),
    linear-gradient(90deg,
      hsl(28, 34%, 44%) 0%,
      hsl(26, 30%, 37%) 55%,
      hsl(24, 28%, 31%) 100%);
}
```

> 重复渐变成立条件（课程 177）：条纹色标之间必须形成"纯色区间"才会周期重复——本配方 0→2px 实色 + 2→6px 过渡正是为此。

---

### 1.2 石 · 见糙（青石台基）

石要糙、忌镜面。多块 `radial-gradient(ellipse … at …)` 模拟不规则石斑，再用 `box-shadow: inset`（课程 173）制造表面坑洼与踩踏光亮。

```css
/* 青石 · 糙面台基 */
.stone-blueschist {
  background:
    radial-gradient(ellipse 130px 90px at 18% 28%, hsla(210, 9%, 18%, 0.50) 0%, transparent 62%),
    radial-gradient(ellipse 220px 150px at 72% 62%, hsla(210, 11%, 20%, 0.40) 0%, transparent 55%),
    radial-gradient(ellipse 90px 60px  at 50% 88%, hsla(200, 7%, 38%, 0.35) 0%, transparent 60%),
    radial-gradient(ellipse 60px 40px  at 85% 15%, hsla(210, 8%, 45%, 0.25) 0%, transparent 60%),
    linear-gradient(180deg, hsl(210, 9%, 34%) 0%, hsl(210, 8%, 27%) 100%);
  /* inset=表面坑洼；底部微弱提亮=常走处被踩磨亮 */
  box-shadow:
    inset 0  2px  7px hsla(210, 12%, 8%, 0.55),
    inset 0 -3px 10px hsla(210, 10%, 55%, 0.16),
    inset 3px  0  5px hsla(0, 0%, 0%, 0.22),
    inset -3px 0  5px hsla(0, 0%, 0%, 0.22);
}
```

---

### 1.3 土 · 见颗粒（夯土分层）

夯土美在手工分层。横向 `repeating-linear-gradient(0deg,…)` 夯层，色差压到很小；颗粒噪点比木更粗（`baseFrequency:0.55`）。

```css
/* 夯土墙 · 分层颗粒 */
.rammed-earth {
  background:
    url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='240'%20height='240'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.55'%20numOctaves='3'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='saturate'%20values='0'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23n)'%20opacity='0.22'/%3E%3C/svg%3E"),
    repeating-linear-gradient(0deg,
      hsl(24, 22%, 58%) 0px,
      hsl(24, 22%, 58%) 46px,
      hsl(22, 20%, 53%) 46px,
      hsl(22, 20%, 53%) 58px),
    linear-gradient(90deg,
      hsl(24, 22%, 60%) 0%,
      hsl(22, 20%, 54%) 100%);
}
```

---

### 1.4 纸 · 见透（宣纸 + 横格）

纸是"光的过滤器"，不是白墙。暖色纤维底 + 极低透明噪点；横格用课程横格纸技法（透明区间 + 一条实线 + `background-clip: content-box` 留出左右缝）。

```css
/* 宣纸 · 半透明纤维 + 暗格 */
.xuan-paper {
  background:
    /* 横格：透明区间 + 一条淡线（课程横格纸技法） */
    repeating-linear-gradient(180deg,
      transparent 0px, transparent 30px,
      hsla(30, 15%, 60%, 0.18) 30px, hsla(30, 15%, 60%, 0.18) 31px),
    /* 纤维噪点 */
    url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='240'%20height='240'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.75'%20numOctaves='2'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='saturate'%20values='0'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23n)'%20opacity='0.16'/%3E%3C/svg%3E"),
    radial-gradient(ellipse 200px 140px at 28% 18%, hsla(46, 40%, 96%, 0.9) 0%, transparent 70%),
    linear-gradient(135deg, hsl(46, 38%, 91%) 0%, hsl(44, 30%, 86%) 100%);
  /* 横格只裁到内容区，左右留缝（课程 background-clip: content-box） */
  background-clip: content-box;
  /* 透：背后有光时边缘泛光 */
  box-shadow: inset 0 0 60px hsla(46, 45%, 95%, 0.5);
}
```

---

### 1.5 金 · 见哑（哑光古金）

**硬约束**：`#B8860B → #8B6914` 暗金谱系，禁 `#FFD700`；金面积 ≤5%，只做勾边/小印。哑光=低对比色标 + 内阴影去镜面。

```css
/* 哑光古金 · 印章/勾边（禁用满铺） */
.gold-matte {
  background: linear-gradient(135deg,
    hsl(43, 46%, 56%) 0%,   /* ≈ #B98A2E */
    hsl(40, 42%, 45%) 35%,  /* ≈ #9A7220 */
    hsl(38, 40%, 34%) 65%,  /* ≈ #6B5218 暗金 */
    hsl(42, 44%, 50%) 100%);
  box-shadow: inset 0 1px 1px hsla(0, 0%, 100%, 0.25), inset 0 -1px 2px hsla(0, 0%, 0%, 0.3);
}

/* 匾额金字：实心字 + 暗金渐变（课程 background-clip:text 五彩字同款思路） */
.gold-ink {
  background: linear-gradient(100deg, hsl(40, 40%, 40%) 0%, hsl(43, 46%, 58%) 45%,
                                      hsl(38, 40%, 36%) 55%, hsl(40, 42%, 46%) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

---

### 1.6 雾 · 见体积（大气雾霭）

雾是**下浓上淡、有密度变化**的大气，不是全局白模糊。纵向 `hsla` 透明度递进 + `backdrop-filter: blur()`（`[增强]`）。

```css
/* 体积雾 · 下浓上淡 */
.fog-volume {
  background: linear-gradient(180deg,
    hsla(200, 12%, 82%, 0.00) 0%,
    hsla(200, 14%, 84%, 0.35) 38%,
    hsla(200, 12%, 86%, 0.65) 72%,
    hsla(200, 10%, 88%, 0.82) 100%);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
```

---

## 2. 光影 CSS 预设（box-shadow / filter 具体值）

> 语法（课程 173）：`box-shadow: x偏移 y偏移 模糊 外延 颜色 [inset]`。
> 东方光影=**阴影是构图元素，且阴影必须带漫反射颜色（非纯黑 #000）**。

### 2.1 天光（Skylight · 上方漫射，按时间分色温）

投影向下、柔边、带时间色温。

```css
/* 天光 · 晨（偏暖金） */
.light-skylight-dawn {
  box-shadow:
    0 22px 34px -14px hsla(32, 35%, 22%, 0.38),
    0  8px 14px  -8px hsla(36, 40%, 28%, 0.28);
}
/* 天光 · 午（偏白中性） */
.light-skylight-noon {
  box-shadow:
    0 16px 26px -14px hsla(220, 8%, 20%, 0.28),
    0  5px 10px  -6px hsla(220, 8%, 25%, 0.20);
}
/* 天光 · 昏（偏金橙） */
.light-skylight-dusk {
  box-shadow:
    0 26px 40px -14px hsla(24, 55%, 24%, 0.42),
    0 10px 18px  -8px hsla(28, 60%, 30%, 0.30);
}
/* 天光 · 阴（偏蓝灰，漫射最强、投影最柔） */
.light-skylight-overcast {
  box-shadow:
    0 24px 38px -16px hsla(215, 18%, 30%, 0.30),
    0  8px 16px  -8px hsla(215, 16%, 35%, 0.22);
}
```

### 2.2 侧光（Side/Raking · 低角度长投影）

投影方向=光源反方向，偏移大、方向单一；不规则轮廓用 `drop-shadow`（`[增强]`）。

```css
/* 侧光 · 晨光从左上 → 长投影投向右下 */
.light-side-left {
  box-shadow:
    30px 14px 20px -10px hsla(30, 35%, 22%, 0.42),
    10px  5px  8px  -4px hsla(30, 30%, 28%, 0.30);
}
/* 侧光 · 黄昏从右 → 长投影投向左侧 */
.light-side-right {
  box-shadow:
    -34px 16px 22px -10px hsla(22, 50%, 24%, 0.44),
    -12px  6px  9px  -4px hsla(22, 45%, 30%, 0.30);
}
/* 侧光描边（跟随不规则轮廓：木柱/山石） */
.raking-outline {
  filter: drop-shadow(18px 8px 6px hsla(30, 30%, 15%, 0.35));
}
```

### 2.3 漏光（Leaked · 有形状的光束）

光从窗缝透入，**必须有形状和来源**。`clip-path` 切楔形 + 纵向透明衰减 + `screen` 混合。

```css
/* 漏光 · 右上窗缝斜射一束光 */
.leak-beam {
  clip-path: polygon(78% 0%, 100% 0%, 62% 100%, 38% 100%);
  background: linear-gradient(180deg,
    hsla(46, 70%, 92%, 0.55) 0%,
    hsla(46, 65%, 88%, 0.28) 45%,
    hsla(46, 60%, 85%, 0.00) 90%);
  mix-blend-mode: screen;
}
/* 漏光 · 柱列条纹投影 */
.leak-stripes {
  background: repeating-linear-gradient(90deg,
    hsla(46, 60%, 90%, 0.00) 0px,
    hsla(46, 60%, 90%, 0.18) 26px,
    hsla(46, 60%, 90%, 0.00) 52px);
  mix-blend-mode: screen;
}
```

### 2.4 漫反射与月光法（Bounced / Moonlight）

阴影不是黑的——白墙映蓝、土地映暖；夜景走月光法（冷蓝 `#4A5568→#2D3748`）。月亮本体用课程"立体球"技法：`radial-gradient` 圆心偏移制造受光体积。

```css
/* 漫反射 · 白墙映蓝天 → 阴影偏冷蓝（禁 #000） */
.shadow-bounce-cool {
  box-shadow: 0 24px 44px -16px hsla(215, 35%, 32%, 0.45);
}
/* 漫反射 · 土地反射暖光 → 阴影偏暖褐 */
.shadow-bounce-warm {
  box-shadow: 0 24px 44px -16px hsla(28, 30%, 28%, 0.42);
}
/* 月亮本体 · 课程立体球：圆心偏移 at 35% 30%，亮部偏左上，暗部右下 */
.moon {
  width: 90px; height: 90px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%,
    hsl(48, 30%, 92%) 0%, hsl(45, 22%, 78%) 45%,
    hsl(220, 15%, 55%) 80%, hsl(222, 25%, 40%) 100%);
  box-shadow: 0 0 40px hsla(220, 40%, 80%, 0.55); /* 月晕，最亮点 */
}
/* 夜空底 + 深蓝阴影（月光法，非黑） */
.scene-moonlit {
  background: linear-gradient(180deg, #4A5568 0%, #2D3748 100%);
}
```

### 2.5 文字光影（浮雕 / 阴刻 / 空心匾额）

```css
/* 阳刻·浮雕：左上受光亮，右下暗 */
.text-relief {
  color: hsl(30, 18%, 70%);
  text-shadow:
     1px  1px 0 hsla(0, 0%, 100%, 0.55),
    -1px -1px 0 hsla(0, 0%, 0%,   0.30);
}
/* 阴刻·凹陷字（石刻/木匾）：高光与阴影反向 */
.text-incised {
  color: hsl(28, 14%, 38%);
  text-shadow:
    -1px -1px 0 hsla(0, 0%, 100%, 0.45),
     1px  1px 2px hsla(0, 0%, 0%,   0.45);
}
/* 空心匾额字（课程 -webkit-text-stroke，仅 WebKit） */
.text-outline {
  color: transparent;
  -webkit-text-stroke: 1px hsl(43, 40%, 55%);
}
```

---

## 3. FINAL 可运行示例

### 示例一：宣纸天光卡片（昏阴影 + 阴刻题字 + 悬停浮起）

融合 `1.4 宣纸横格` + `2.1 天光·昏` + `2.5 阴刻字` + `1.5 古金印`，并加入课程 173/181 的"小米式"悬停浮起（上移 1px + 阴影浮现 + transition）：

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>宣纸天光卡片</title>
<style>
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: hsl(24, 18%, 20%);   /* 暗调底，明暗比 ≈ 3:7 */
  }
  .card {
    width: 320px; padding: 40px 32px;
    border-radius: 8px;             /* 课程常用小圆角 8-20px */
    background:
      repeating-linear-gradient(180deg,
        transparent 0px, transparent 30px,
        hsla(30,15%,60%,0.18) 30px, hsla(30,15%,60%,0.18) 31px),
      url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='240'%20height='240'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.75'%20numOctaves='2'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='saturate'%20values='0'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23n)'%20opacity='0.16'/%3E%3C/svg%3E"),
      radial-gradient(ellipse 200px 140px at 28% 18%, hsla(46,40%,96%,0.9) 0%, transparent 70%),
      linear-gradient(135deg, hsl(46,38%,91%) 0%, hsl(44,30%,86%) 100%);
    background-clip: content-box;
    box-shadow:
      0 26px 40px -14px hsla(24, 55%, 24%, 0.55),
      0 10px 18px  -8px hsla(28, 60%, 30%, 0.35),
      inset 0 0 60px hsla(46, 45%, 95%, 0.5);
    transition: box-shadow .4s ease, transform .4s ease;   /* 课程 transition */
  }
  .card:hover { transform: translateY(-1px); box-shadow: 0 34px 50px -16px hsla(24,55%,24%,.6); }
  .card h1 {
    margin: 0 0 8px; font-family: "Songti SC", serif; font-weight: 600;
    color: hsl(28, 14%, 38%);
    text-shadow: -1px -1px 0 hsla(0,0%,100%,0.45), 1px 1px 2px hsla(0,0%,0%,0.45);
  }
  .card p { margin: 0; font-family: "Songti SC", serif; color: hsl(28, 12%, 30%); }
  .seal {
    display: inline-block; margin-top: 16px; width: 22px; height: 22px;
    background: linear-gradient(135deg, hsl(43,46%,56%) 0%, hsl(40,42%,45%) 35%,
      hsl(38,40%,34%) 65%, hsl(42,44%,50%) 100%);
    box-shadow: inset 0 1px 1px hsla(0,0%,100%,0.25), inset 0 -1px 2px hsla(0,0%,0%,0.3);
  }
</style>
</head>
<body>
  <div class="card">
    <h1>闲庭</h1>
    <p>天光落纸，纸透而不白。</p>
    <span class="seal"></span>
  </div>
</body>
</html>
```

### 示例二：侧光木柱 + 漏光束（材料被光强调纹理）

融合 `1.1 木柱` + `2.2 侧光` + `2.3 漏光束`：

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>侧光木柱与漏光</title>
<style>
  .scene {
    position: relative; width: 420px; height: 300px; overflow: hidden;
    background: linear-gradient(180deg, hsl(220, 12%, 30%) 0%, hsl(22, 18%, 24%) 100%);
  }
  .pillar {
    position: absolute; left: 60px; bottom: 0; width: 46px; height: 100%;
    background:
      repeating-linear-gradient(90deg,
        hsl(28,34%,40%) 0px, hsl(28,30%,35%) 2px,
        hsl(30,36%,46%) 6px, hsl(28,28%,33%) 11px, hsl(28,34%,40%) 16px),
      linear-gradient(180deg, hsl(30,36%,46%) 0%, hsl(28,30%,33%) 100%);
    box-shadow: 30px 14px 20px -10px hsla(30,35%,22%,0.42);  /* 侧光长投影 */
  }
  .beam {
    position: absolute; inset: 0;
    clip-path: polygon(78% 0%, 100% 0%, 62% 100%, 38% 100%);
    background: linear-gradient(180deg,
      hsla(46,70%,92%,0.55) 0%, hsla(46,65%,88%,0.28) 45%, hsla(46,60%,85%,0) 90%);
    mix-blend-mode: screen;
  }
</style>
</head>
<body>
  <div class="scene">
    <div class="pillar"></div>
    <div class="beam"></div>
  </div>
</body>
</html>
```

### 示例三：月光法夜景（立体月 + 冷蓝阴影，"要站在光里"）

融合 `2.4 立体月亮` + 暗调底（平均亮度 ≤30%，仅月亮一处高光）：

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>月光法夜景</title>
<style>
  .night {
    position: relative; width: 420px; height: 300px; overflow: hidden;
    background: linear-gradient(180deg, #4A5568 0%, #2D3748 100%);
  }
  .moon {
    position: absolute; top: 40px; right: 70px;
    width: 90px; height: 90px; border-radius: 50%;
    background: radial-gradient(circle at 35% 30%,
      hsl(48,30%,92%) 0%, hsl(45,22%,78%) 45%,
      hsl(220,15%,55%) 80%, hsl(222,25%,40%) 100%);
    box-shadow: 0 0 40px hsla(220, 40%, 80%, 0.55);   /* 月晕：画面最亮点 */
  }
  /* 地面剪影：深蓝投影，非黑 */
  .ground {
    position: absolute; left: 0; right: 0; bottom: 0; height: 60px;
    background: hsl(222, 30%, 16%);
    box-shadow: 0 -8px 30px hsla(220, 45%, 18%, 0.65);
  }
</style>
</head>
<body>
  <div class="night">
    <div class="moon"></div>
    <div class="ground"></div>
  </div>
</body>
</html>
```

---

## 4. 课程依据对照（199 集）

| 技术点 | 集数 | 课程实证 |
|---|---|---|
| 渐变=background-image 代码图 | 177 | 线性/径向/重复三种，方向关键词与 `deg`，色标位置 px |
| 立体球/体积感 | 177 | `radial-gradient(at 80px 80px, white, #333)` 圆心偏移出体积 |
| 横格纸/条纹 | 177 | `repeating-linear-gradient(transparent…, 灰 30px)` + 重复 |
| background-clip: content-box / text | 174 | 横格左右留缝；`-webkit-background-clip:text` 五彩文字 |
| 多层背景 | 174 | 逗号列多层 + 位置 |
| box-shadow 六值/inset | 173 | h v blur spread color inset；4 值最常用；spread 勿大 |
| 悬停浮起 | 173/181 | 小米商城：上移 1px + 阴影 + `transition:.4s` |
| border-radius | 175 | px/% 圆角，50% 正圆，常用 8-20px |
| text-shadow / -webkit-text-stroke | 176 | 文字阴影 h v blur；空心描边 width+color（WebKit） |
| rgb/rgba / hsl/hsla | 090/092 | 半透明与色温控制 |
| backdrop-filter / filter:drop-shadow / mix-blend-mode / clip-path | 课程外 | 浏览器标准 CSS 渐进增强，生产中需做降级兜底 |

---

## 5. 反模式速查（本维度红线）

- ❌ 纯色木 / 无纹"木色"渐变 → 违反"木要见纹"
- ❌ 全程光滑无 inset 的抛光石 → 违反"石要见糙"
- ❌ `#FFD700` 亮金满铺 → 金必须哑、面积 ≤5%
- ❌ 全局 `filter: blur()` 当雾 → 雾要有体积密度渐变
- ❌ 纯黑 `#000` 阴影 → 阴影必须带漫反射环境色
- ❌ 均匀"做旧滤镜" → 时间痕迹须有物理成因（触处亮、雨处色差）
- ❌ 找不到来源的光斑/追光 → 所有光必须有方向和来源
- ❌ spread（外延）给大 → 课程提醒"外延给大了贼丑"，本文件一律 ≤2px 或负值收拢
