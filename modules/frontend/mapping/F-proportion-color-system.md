# F — 比例克制 × 色彩体系 → CSS 单位 / 变量 / 色彩系统映射

> 状态：**FINAL**（基于 HTML/CSS 全 199 集完整转写精填，2026-09-26）
> 子代理 F 产出。上游美学模块：`04-proportion.md`（方五斜七 / 克制 / 材分模数）、`07-color.md`（五色 / 60-30-10 / S≤50% 铁律）。
> 本文件只做**映射**：把美学决策翻译成可直接运行的 CSS，不改原 11 个美学模块。

---

## 0. 课程证据基线（哪些是课程实讲，哪些是现代增强）

经全文检索 `html_css_full.txt`（12203 行）确认：

| 技术点 | 课程是否覆盖 | 出处集 | 在本文件中的定位 |
|---|---|---|---|
| 长度单位 px / em / rem / % | ✅ 实讲 | 113 | 1.4 节单位决策（课程实证） |
| CSS3 新单位 vw / vh | ✅ 实讲 | 172 | 1.4 节（课程实证） |
| 颜色 rgb(a) / hex(a) / hsl(a) | ✅ 实讲 | 089-092 | 第 2 节色值基础（课程实证） |
| font-size / line-height / letter-spacing / text-indent | ✅ 实讲 | 093-107 | 第 3 节排版（课程实证） |
| linear-gradient / radial-gradient | ✅ 实讲 | 177 | 2.6 节渐变（课程实证） |
| 媒体查询 / 断点 768·992·1200 | ✅ 实讲 | 197-198 | 第 4 节响应式（课程实证） |
| `calc()` / `clamp()` / `min()` / `max()` | ❌ 未讲（全文 0 匹配） | — | 1.1/1.3 节，**现代增强层**，浏览器原生支持 |
| `:root` / `var()` 自定义属性 | ❌ 未讲 | — | 第 2/5 节，**现代增强层** |
| `aspect-ratio` | ❌ 未讲 | — | 1.1 节，**现代增强层** |
| `color-mix()` / `oklch` / `@layer` / 容器查询 | ❌ 未讲 | — | 2.5 节，**现代增强层（可选）** |

> 说明：课程是零基础入门课，止步于原生单位与媒体查询；`calc/clamp/var()` 等是现代浏览器原生语法，不依赖课程，可直接落地。凡现代增强层均在代码注释标注「现代增强」，与课程实证代码可共存。

---

## 1. 方五斜七 → 比例 CSS 体系

### 1.1 √2 比例常数与 calc()（现代增强）

> 方五斜七：正方形边长 5，对角线 ≈ 7 → 7/5 = 1.4 ≈ √2 = 1.4142。

```css
:root {
  /* 现代增强：自定义属性承载比例常数 */
  --ratio-root2: 1.4142;            /* √2 主比例 */
  --ratio-half:  0.7071;            /* 1/√2，竖向收分 */
  --ratio-double-root2: 2.8284;     /* 2√2：佛光寺面阔:进深 */
}

/* 现代增强：aspect-ratio 直接写方五斜七竖向开间 */
.bay { aspect-ratio: 5 / 7; }

/* 现代增强：calc() 让一切尺寸由模数 × √2 推导，不拍脑袋 */
.card-w:  calc(var(--unit, 8px) * 20);                       /* 40m */
.card-h:  calc(var(--unit, 8px) * 20 * var(--ratio-root2)); /* ≈56.5m */
```

**课程兼容写法**（不依赖 calc，纯 CSS3 也能跑）：√2 矩形直接用 `aspect-ratio` 或写死 px；第 5 节完整示例同时给两套。

### 1.2 材分制模数（间距阶梯）

> 对应 04「所有构件 = n × 材」。取 `--unit: 8px`，只用 1/2/3/4/6/8 阶，**禁用 5m、7m 的随意感**。

```css
:root {
  --unit: 8px;
  --u-05: calc(var(--unit) * 0.5);  /* 4px  半材 */
  --u-1:  calc(var(--unit) * 1);    /* 8px  一材 */
  --u-2:  calc(var(--unit) * 2);    /* 16px 二材 */
  --u-3:  calc(var(--unit) * 3);    /* 24px 三材 */
  --u-4:  calc(var(--unit) * 4);    /* 32px 四材 */
  --u-6:  calc(var(--unit) * 6);    /* 48px 六材 */
  --u-8:  calc(var(--unit) * 8);    /* 64px 八材 */

  /* 留白 实:虚 = 5:7（虚 > 实，呼吸感） */
  --void:  calc(var(--unit) * 7);   /* 外围留白 7m */
  --solid: calc(var(--unit) * 5);   /* 内容区   5m */
}
```

### 1.3 克制 → clamp() 流式排版（现代增强）

```css
/* 根字号流式；rem 单位全部跟随（课程 113：rem 相对根字号，默认 16px） */
html { font-size: clamp(14px, 0.4rem + 0.6vw, 18px); }

:root {
  /* 字号阶梯 0.75m/1m/1.5m/2m/3m/4m，clamp(min, preferred, max) 双向卡死 */
  --fs-xs:  clamp(0.70rem, 0.66rem + 0.2vw, 0.75rem);  /* 眉批/注释 */
  --fs-sm:  clamp(0.88rem, 0.84rem + 0.2vw, 1.00rem);  /* 正文 */
  --fs-md:  clamp(1.10rem, 1.00rem + 0.5vw, 1.50rem);  /* 小标题 */
  --fs-lg:  clamp(1.50rem, 1.20rem + 1.5vw, 2.00rem);  /* 章节 */
  --fs-xl:  clamp(2.20rem, 1.60rem + 3.0vw, 3.00rem);  /* 主标题 */
  --fs-xxl: clamp(3.00rem, 2.00rem + 5.0vw, 4.00rem);  /* 唯一焦点 */

  /* 内容驱动尺寸：min() 封顶防过宽行；max() 兜底防过挤 */
  --measure: min(92vw, 42rem, calc(var(--unit) * 60)); /* 行宽 ~66 字符 */
  --gutter:  max(var(--u-4), 4vw);                     /* 页面两侧留白 */
}
```

### 1.4 单位选择决策（课程实证：113 / 172 集）

课程原话要点：**px 绝对单位**；**em = 相对当前元素自身 font-size 的倍数**（当前元素不设 font-size 则继承向上找）；**rem = 相对根元素 html 的 font-size**（根不设则默认 16px）；**vw = 视口宽度的 1%**，**vh = 视口高度的 1%**；**设长度必须带单位否则失效**。

| 单位 | 课程定义 | 东方用法 |
|---|---|---|
| `rem` | 相对根 html font-size（默认16px） | **首选**。根字号 clamp 后全站等比缩放 |
| `em` | 相对当前元素 font-size | 组件内 padding 跟自身字号缩放 |
| `px` | 绝对像素 | 仅 1px 发丝线 / 几何边框，不进尺寸阶梯 |
| `vw` | 视口宽度 1% | 大留白、流式字号的 preferred 段 |
| `vh` | 视口高度 1% | hero 高 `100vh`；课程实例 `calc(100vh - 70px)` 减顶栏 |
| `%` | 相对父元素 | 仅栅格列，**不用于颜色** |

---

## 2. 色彩 CSS 体系

### 2.1 HSL 基础（课程实证：092 集）

课程原话：**HSL = 色相 H + 饱和度 S + 亮度 L**。
- **色相 H**：角度 0–360°，0°红 / 60°黄 / 120°绿 / 180°青 / 240°蓝 / 300°品红，360° 与 0° 重合；`deg` 可省略。
- **饱和度 S**：0%–100%，**0% = 全灰（老照片）**，100% = 纯彩；「往颜色里掺灰」。
- **亮度 L**：0%–100%，**0% 纯黑 / 100% 纯白都太极端，常用 50%**。
- 支持透明度：`hsla(h, s%, l%, a)`，`0.5` 或 `.5` 均可。

> 课程吐槽「HSL 不直观，开发常用 rgb/hex」——**但本美学体系恰恰要用 HSL**：因为我们要把 S 显式钉在 ≤50%，这是 rgb/hex 做不到的可控性。

### 2.2 核心色谱（青/黛/月白/烟紫/古金/朱砂）

> 原则：**文化锚点 HEX 来自 07 模块，落地 CSS 一律 HSL 且 S 压到 ≤50%**（7 博主铁律）。
> 锚点 HEX 若 S 超标（如朱砂 #8B2500 S=100%），只作文化参考，**禁止直接写进 CSS**，必须用右侧执行值。

| 角色 | 名称 | 锚点 HEX（模块出处） | 执行值（CSS 实际使用，S≤50%） |
|---|---|---|---|
| 骨 | 青（青绿） | `#4A6B5C` | `hsl(153, 18%, 35%)` |
| 骨 | 青（青蓝） | `#5B7C8A` | `hsl(198, 21%, 45%)` |
| 肉 | 黛 | `#2C2C2C` | `hsl(210, 10%, 17%)` |
| 肉 | 玄青 | `#1A1A2E` | `hsl(240, 28%, 14%)` |
| 肉 | 黛青 | `#2C3E50` | `hsl(210, 29%, 24%)` |
| 气 | 月白 | `#E8E4D9` | `hsl(44, 25%, 88%)` |
| 气 | 缟素 | `#F0EDE5` | `hsl(44, 27%, 92%)` |
| 气 | 宣纸白 | — | `hsl(42, 39%, 94%)` |
| 魂 | 朱砂（暗） | `#8B2500`（S100% **禁用**） | `hsl(16, 45%, 34%)` → `#7E4430` |
| 魂 | 赭朱砂 | `#A52A2A`（S59% 超标） | `hsl(0, 42%, 42%)` → `#983E3E` |
| 神 | 古金（暗） | `#B8860B`（S89% **禁用**） | `hsl(43, 42%, 44%)` → `#9F8541` |
| 神 | 哑金（圆月） | `#DAA520`（S74% 超标） | `hsl(43, 40%, 52%)` → `#B69A54` |
| 过渡 | 烟紫 | —（本项目定义） | `hsl(266, 13%, 49%)` → `#7B6D8D` |

### 2.3 完整传统色板（30+，每个带 HSL / HEX / 用途）

```css
:root {
  /* ===== 墨 / 黛 系（文字、边框、深色底）===== */
  --c-ink:       hsl(0, 0%, 12%);    /* #1F1F1F 墨色：正文文字 */
  --c-dai:       hsl(210, 10%, 17%); /* #2C2C2C 黛：结构线、重色块 */
  --c-dai-qing:  hsl(210, 29%, 24%); /* #2C3E50 黛青：远山、次级标题 */
  --c-dai-blue:  hsl(204, 19%, 26%); /* #36454F 黛蓝：深蓝灰阴影 */
  --c-xuan:      hsl(240, 28%, 14%); /* #1A1A2E 玄青：夜宴背景 */

  /* ===== 白 / 月 系（主背景、留白）===== */
  --c-moon:      hsl(44, 25%, 88%);  /* #E8E4D9 月白：主背景 60% */
  --c-gaosu:     hsl(44, 27%, 92%);  /* #F0EDE5 缟素：卡片底 */
  --c-xuanzhi:   hsl(42, 39%, 94%);  /* #F5F1E8 宣纸白：最亮留白 */

  /* ===== 青 / 绿 系（骨、自然）===== */
  --c-qing:      hsl(153, 18%, 35%); /* #4A6B5C 青绿：主辅色、按钮 */
  --c-qing-blue: hsl(198, 21%, 45%); /* #5B7C8A 青蓝：链接、次要结构 */
  --c-qing-gray: hsl(211, 13%, 48%); /* #6B7B8C 青灰：雾、远山 */
  --c-brick:     hsl(200, 15%, 73%); /* #B0BEC5 灰蓝：水面、分隔 */
  --c-zhuye:     hsl(92, 20%, 48%);  /* #789262 竹青：点缀绿 */
  --c-liuli:     hsl(146, 33%, 36%); /* #3E7C59 琉璃绿：玉质感 */
  --c-shilv:     hsl(95, 49%, 36%);  /* #558B2F 石绿（S49% 达标） */
  --c-cuiqing:   hsl(174, 45%, 30%); /* #2A6F68 青翠执行色 */

  /* ===== 朱 / 红 系（魂、点睛，≤10%）===== */
  --c-zhusha:    hsl(16, 45%, 34%);  /* #7E4430 朱砂：唯一点睛 */
  --c-zhusha2:   hsl(0, 42%, 42%);   /* #983E3E 赭朱砂：hover 态 */
  --c-haitang:   hsl(349, 44%, 42%); /* #9B3D4F 海棠红：柔化朱砂 */

  /* ===== 金 / 黄 系（神、细节线条，≤5%）===== */
  --c-gujin:     hsl(43, 42%, 44%);  /* #9F8541 古金：描边、icon */
  --c-yajin:     hsl(43, 40%, 52%);  /* #B69A54 哑金：细线、分隔 */
  --c-zhe:       hsl(41, 47%, 56%);  /* #C4A35A 赭黄：人物、温度 */
  --c-tenghuang: hsl(37, 48%, 58%);  /* #C7A060 藤黄执行色 */

  /* ===== 紫 / 中性 系 ===== */
  --c-yanzi:     hsl(266, 13%, 49%); /* #7B6D8D 烟紫：雾感过渡 */
  --c-shenzi:    hsl(267, 42%, 30%); /* #492C6D 深紫执行色 */
  --c-ouhe:      hsl(324, 15%, 65%); /* #B398A8 藕荷：柔粉灰 */
  --c-oufen:     hsl(14, 31%, 78%);  /* #D9BFB7 藕粉：暖中性 */

  /* ===== 灰 / 棕 系 ===== */
  --c-chabrown:  hsl(25, 34%, 33%);  /* #6F4E37 茶褐：木器、边框 */
  --c-tuose:     hsl(30, 26%, 54%);  /* #A8896B 驼色：织物 */
  --c-wadang:    hsl(195, 7%, 47%);  /* #707C80 瓦当灰：中性分割 */
  --c-qiuxiang:  hsl(78, 19%, 52%);  /* #8D9B6C 秋香色：灰黄绿 */
}
```

### 2.4 色彩比例 → 语义分层变量（65 / 25 / 10）

> 业务代码只引用语义层，不直接碰色板。改主题 = 只改语义层。

```css
:root {
  /* 方案一：宋韵清雅（默认）—— 主65 辅25 点缀10 */
  --color-primary:    var(--c-moon);      /* 65% 月白：大面积背景 */
  --color-secondary:  var(--c-dai-qing);  /* 25% 黛青：结构、文字 */
  --color-accent:     var(--c-gujin);     /* 8% 古金：细节、描边 */
  --color-accent-2:   var(--c-zhusha);    /* 2% 朱砂：唯一焦点（≤10%） */

  --ratio-primary:   0.65;
  --ratio-secondary: 0.25;
  --ratio-accent:    0.10;
}

/* 一键换肤（现代增强：属性选择器 + 变量覆盖） */
[data-theme="palace"] {                   /* 方案二 朱墙深宫 */
  --color-primary:    var(--c-dai);      /* 50% 黛 */
  --color-secondary: var(--c-zhusha);    /* 35% 朱砂 */
  --color-accent:    var(--c-gujin);     /* 10% 古金门钉 */
}
[data-theme="night"] {                    /* 方案四 夜宴玄金 */
  --color-primary:    var(--c-xuan);     /* 60% 玄青 */
  --color-secondary: var(--c-gujin);     /* 25% 古金 */
  --color-accent:    var(--c-zhusha);    /* 8% 朱砂 */
}
```

### 2.5 color-mix() / oklch（现代增强层，课程未覆盖）

```css
:root {
  /* 同色相明度阶梯（对应 04 同色相 m/2m/3m）——现代增强 */
  --c-qing-300: color-mix(in srgb, var(--c-qing) 30%, var(--c-moon));
  --c-qing-500: var(--c-qing);
  --c-qing-700: color-mix(in srgb, var(--c-qing) 70%, var(--c-dai));

  /* 降饱和兜底：任何新色先掺 25% 瓦当灰，防俗艳 ——现代增强 */
  --c-desat: color-mix(in srgb, var(--new-color) 75%, var(--c-wadang) 25%);

  /* 阴影带环境色（07 SOFT FAIL：禁纯黑阴影）——现代增强 */
  --shadow-soft: 0 var(--u-1) var(--u-4) color-mix(in srgb, var(--c-dai-blue) 18%, transparent);
  --shadow-deep: 0 var(--u-2) var(--u-6) color-mix(in srgb, var(--c-xuan) 28%, transparent);
}
```

> **课程兼容降级**：不支持 color-mix 的环境，阴影直接写带透明度的 `hsla(210,29%,24%,.18)`，主辅色直接用 2.3 节的 HSL 变量，体系不崩。

### 2.6 渐变（课程实证：177 集）

课程要点：`linear-gradient` 第一个颜色 = 渐变起点；方向用 `to right`/`to bottom` 关键词或角度 `deg`；`radial-gradient` 两半径相等为正圆。东方用法：**只用同色系弥散渐变，禁止彩虹渐变（07 HARD FAIL）**。

```css
/* 夜宴玄金：深色弥散渐变（课程线性渐变写法 + 本体系色值） */
.bg-night {
  background: linear-gradient(to bottom,
    hsl(240, 28%, 14%) 0%,
    hsl(267, 42%, 30%) 100%);   /* 玄青→深紫，同暗调，不撞色 */
}
/* 月水圆光：径向渐变做「圆月」点缀（课程 radial-gradient） */
.moon {
  width: 10rem; height: 10rem;  /* 等宽高=正圆 */
  background: radial-gradient(circle at 50% 45%,
    hsl(44, 25%, 92%) 0%, hsl(43, 40%, 52%) 100%);
}
```

---

## 3. 排版精控（课程实证：093-107 集）

```css
:root {
  --leading-body: 1.8;    /* 行高：课程推荐 1.5~2 倍，正文用无单位数值 */
  --leading-tight: 1.5;   /* 标题紧凑行高 */
  --tracking-wide: 0.3em; /* 字距：课程 letter-spacing 可正可负（负会挤压） */
  --indent-2: 2em;        /* 首行缩进 2 字：课程 text-indent=2×font-size，用 em 自适应 */
}
body  { font-size: var(--fs-sm); line-height: var(--leading-body); }
h1,h2 { line-height: var(--leading-tight); letter-spacing: var(--tracking-wide); }
p     { text-indent: var(--indent-2); }
```

课程铁律落地：
- **行高永远不要等于 font-size**（中文会出头打架重叠）；
- **行高用无单位数值**（如 1.8），继承时按子元素字号重算；写死 px 会让大号子字被旧行高裁切；
- 行高两大用途：多行行距 / 单行垂直居中（单行容器 `line-height == height`）。

---

## 4. 响应式断点（课程实证：197-198 集）

课程主流阈值（非绝对，可按设计稿调）：**超小 <768 / 中 768–992 / 大 992–1200 / 超大 ≥1200**。

```css
/* 移动端优先：默认（超小屏）先写，再逐级 min-width 叠加 */
.card { width: 92vw; }                                   /* 手机 */
@media screen and (min-width: 768px)  { .card { width: 70vw; } }  /* 平板 */
@media screen and (min-width: 992px)  { .card { width: 50vw; } }  /* 桌面 */
@media screen and (min-width: 1200px) { .card { width: 36vw; } }  /* 大屏 */
```

> 课程还讲了 `<link rel="stylesheet" media="(min-width:1200px)">` 外部拆分法；顺序上先引基础 `index.css` 再引分屏 CSS。东方页面默认反宽屏，超大屏下应**收窄行宽**而非铺满（呼应 04 反 16:9）。

---

## 5. 完整可运行示例：宋韵登录页 v2（FINAL 升级）

> 整合：方五斜七画幅 + 8px 材分模数 + rem 流式字号 + clamp 标题 + HSL 65/25/10 + 课程断点 + 无单位行高 + 月白径向圆光。浏览器直开即跑。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>宋韵 · 登录</title>
<style>
:root{
  /* 材分模数 */
  --unit:8px;
  --u-1:calc(var(--unit)*1); --u-2:calc(var(--unit)*2);
  --u-3:calc(var(--unit)*3); --u-4:calc(var(--unit)*4);
  --u-6:calc(var(--unit)*6); --u-8:calc(var(--unit)*8);
  /* 宋韵 65/25/10 */
  --c-moon:hsl(44,25%,88%);    --c-dai-qing:hsl(210,29%,24%);
  --c-gujin:hsl(43,42%,44%);   --c-zhusha:hsl(16,45%,34%);
  --c-xuanzhi:hsl(42,39%,94%); --c-wadang:hsl(195,7%,47%);
  --shadow:hsla(210,29%,24%,.18);
}
*{box-sizing:border-box;margin:0;padding:0}
html{font-size:clamp(14px,.4rem + .6vw,18px)}   /* 现代增强：流式根字号 */
body{
  min-height:100vh;                              /* 课程 172：vh */
  display:grid;place-items:center;
  background:
    radial-gradient(circle at 78% 18%, hsl(43,40%,52%) 0, transparent 22%), /* 哑金圆月 */
    var(--c-moon);                               /* 主色 65% */
  color:var(--c-dai-qing);                       /* 辅色 25% */
  font-family:"Songti SC","Noto Serif SC",serif;
  line-height:1.8;                               /* 课程：无单位行高 */
  padding:var(--u-6);
}
.card{
  width:92vw; max-width:26rem;
  aspect-ratio:5/7;                               /* 现代增强：方五斜七 */
  background:var(--c-xuanzhi);
  border:1px solid hsla(43,42%,44%,.5);          /* 古金描线 ≤5% */
  box-shadow:0 var(--u-2) var(--u-6) var(--shadow);
  padding:var(--u-8) var(--u-6);
  display:flex;flex-direction:column;gap:var(--u-4);
}
h1{
  font-size:clamp(1.6rem,1.2rem + 2vw,2.4rem);  /* 现代增强：流式标题 */
  font-weight:500;letter-spacing:.3em;           /* 课程 099：字距 */
  line-height:1.5;text-align:center;
}
.rule{height:1px;background:var(--c-gujin);opacity:.6}
.field{display:flex;flex-direction:column;gap:var(--u-1)}
label{font-size:.8rem;letter-spacing:.2em;color:var(--c-wadang)}
input{
  border:none;border-bottom:1px solid var(--c-dai-qing);
  background:transparent;padding:var(--u-1) 0;
  font:inherit;color:var(--c-dai-qing);
}
input:focus{outline:none;border-bottom-color:var(--c-gujin)}
.btn{
  margin-top:var(--u-2);padding:var(--u-2);
  background:var(--c-dai-qing);color:var(--c-moon);
  border:none;font:inherit;letter-spacing:.4em;cursor:pointer;
}
.btn:hover{background:var(--c-zhusha)}           /* 朱砂点睛 ≤2% */
.foot{margin-top:auto;text-align:center;font-size:.75rem;color:var(--c-wadang)}
/* 课程 198 断点：≥768 卡片再宽一点 */
@media screen and (min-width:768px){.card{max-width:28rem}}
</style>
</head>
<body>
  <form class="card">
    <h1>宋 韵</h1>
    <div class="rule"></div>
    <div class="field"><label>账 号</label><input type="text"></div>
    <div class="field"><label>密 码</label><input type="password"></div>
    <button class="btn">入 境</button>
    <p class="foot">— 月白为气 · 黛青为骨 —</p>
  </form>
</body>
</html>
```

FINAL 自检：主月白 65% ✓ / 辅黛青 25% ✓ / 古金描线+圆月 ≤5% ✓ / 朱砂仅 hover ≤2% ✓ / 全部 S≤50% ✓ / 画幅 5:7 方五斜七 ✓ / 间距皆 8px 模数倍 ✓ / 阴影 `hsla` 带环境色非纯黑 ✓ / 行高无单位 ✓ / 含 768 课程断点 ✓。

---

## 6. 一句话摘要

- **比例**：一切尺寸 = `calc(var(--unit,8px) × 整数倍)`，核心比例走 √2（`aspect-ratio:5/7`），标题 `clamp(min, preferred, max)` 双向卡死；
- **单位**（课程实证）：rem 首选（根字号流式）、em 组件内相对、px 仅发丝线、vw/vh 控大画幅与 hero；
- **色彩**：30+ 传统色全部 HSL 写死且 S≤50%，业务只引用 `--color-primary/secondary/accent`（65/25/10），朱砂/古金 ≤10%/≤5% 点睛，阴影用 `hsla`/`color-mix()` 掺环境色；
- **排版与响应式**：行高无单位 1.5–2、首行缩进 `2em`、字距标题加宽；断点 768/992/1200 移动端优先。
