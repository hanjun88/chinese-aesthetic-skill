# J — 反俗套代码审查与修复方案

> **子代理 J 产出**: 反俗套（11-anti-cliche）→ 代码审查与修复
>
> 本文件是东方美学前端体系的**代码层免疫系统**：
> 把 11-anti-cliche.md 中的四类俗套，转化为可执行的 CSS/JS 正则检测规则、自动化审查脚本、和"修复前→修复后"代码对比。
>
> **核心原则**: 修复不是"换一批元素"，是"从结构重建"。去掉贴纸后还能感受到东方性，才是真的中式设计。

---

## 目录

1. [检测规则库（41条规则）](#1-检测规则库)
2. [修复方案库（Before → After）](#2-修复方案库)
3. [自动化审查工具 anti-cliche-lint.js](#3-自动化审查工具)
4. [POC 验证报告](#4-poc-验证)
5. [代码审查人工 Checklist](#5-代码审查人工-checklist)
6. [与其他模块的映射关系](#6-模块映射)

---

## 1. 检测规则库

> 每条规则：规则ID · 俗套类型 · 检测模式（正则/属性组合）· 严重程度 · 修复建议
>
> 严重程度：**HARD_FAIL** = 命中即必须修复；**WARNING** = 建议修正

### 1.1 国潮贴图感（National-Trend Sticker）— 7条

| 规则ID | 检测目标 | 正则/属性模式 | 严重度 | 修复建议 |
|---|---|---|---|---|
| R-STICKER-001 | 祥云纹样背景贴图满铺 | `/background(-image)?\s*:[^;]*?(cloud\|xiangyun\|auspicious\|祥云)[^;]*;/gi` | HARD_FAIL | 删除背景贴图，改用结构留白 + 月白色底 |
| R-STICKER-002 | 回纹/万字纹边框装饰 | `/border[^;]*:[^;]*?(huiwen\|meander\|fret\|key-pattern\|回纹\|万字)[^;]*;/gi` | HARD_FAIL | 改用 `1px solid var(--color-border)` 极简边框 |
| R-STICKER-003 | 毛笔/书法字体标题 | `/font-family\s*:[^;]*?(calligraphy\|brush.script\|maobi\|shufa\|cursive\|毛笔\|书法\|STXingkai\|Xingkai\|LiSu\|隶书)[^;]*;/gi` | WARNING | 标题改用 `var(--font-serif)` 宋体系 |
| R-STICKER-004 | 红色印章/落款装饰 | `/(seal\|stamp\|chop\|印章\|落款)[^{]*\{[^}]*?(background\|color)\s*:[^;]*?(#f00\|#ff0000\|red\|#c8102e)[^;]*;/gis` | WARNING | 用 `var(--zhusha-500)` 且面积 ≤ 8%，配合文字内容 |
| R-STICKER-005 | 金色描边/亮金边框 | `/border[^;]*:[^;]*?(#FFD700\|#ffd700\|\bgold\b\|\bgolden\b\|金色)[^;]*;/gi` | WARNING | 改用哑金边框 `1px solid hsl(43, 65%, 40%, 0.35)` |
| R-STICKER-006 | 红色渐变叠加 | `/linear-gradient\s*\([^)]*(red\|#f00\|#ff0000\|#c8102e\|#e60012)[^)]*\)/gi` | HARD_FAIL | 删除红色渐变，用纯色块或极缓冷色渐变 |
| R-STICKER-007 | 灯笼/中国结/折扇装饰 | `/(lantern\|chinese-knot\|folded-fan\|灯笼\|中国结\|折扇)[^{]*\{/gi` | WARNING | 删除装饰道具，用光影和留白暗示氛围 |

### 1.2 古装影视感（Costume-Drama Look）— 6条

| 规则ID | 检测目标 | 正则/属性模式 | 严重度 | 修复建议 |
|---|---|---|---|---|
| R-DRAMA-001 | 高饱和正红 #FF0000 | `/(#FF0000\|#ff0000\|#F00\b\|#f00\b)/gi` | HARD_FAIL | 改用暗朱砂 `var(--zhusha-500)` = `#8B2500` |
| R-DRAMA-002 | 明黄/亮金 #FFD700 | `/(#FFD700\|#ffd700\|#FFDF00\|#ffdf00)/gi` | HARD_FAIL | 改用哑金 `var(--gujin-500)` = `#B8860B` |
| R-DRAMA-003 | 正红+明黄组合 | 上下文检查：文件中同时出现 #FF0000 和 #FFD700 | HARD_FAIL | 红→暗朱砂，黄→哑金，金色面积 ≤ 5% |
| R-DRAMA-004 | 宫殿剪影/宫殿背景图 | `/(palace\|forbidden-city\|imperial-palace\|宫殿\|故宫\|紫禁城)[^{]*\{[^}]*background[^}]*\}/gis` | WARNING | 删除宫殿背景，用远山轮廓或纯色+留白 |
| R-DRAMA-005 | 高饱和翠绿 #00FF00/#00C853 | `/(#00FF00\|#00ff00\|#00C853\|#00c853\|#4CAF50\b)/gi` | HARD_FAIL | 改用石绿 `hsl(120, 30%, 30%)` = `#2E7D32` |
| R-DRAMA-006 | 舞台聚光/追光效果 | `/radial-gradient\s*\(\s*(circle\|ellipse)[^)]*(white\|#fff\|#ffffff\|yellow)[^)]*\)/gi` | WARNING | 改用天光漫射 `--shadow-skylight` |

### 1.3 仿古景区感（Antique-Tourist-Spot）— 4条

| 规则ID | 检测目标 | 正则/属性模式 | 严重度 | 修复建议 |
|---|---|---|---|---|
| R-ANTIQUE-001 | sepia 做旧滤镜满铺 | `/filter\s*:[^;]*?sepia\s*\(/gi` | HARD_FAIL | 删除 sepia，用局部色差和材质纹理代替 |
| R-ANTIQUE-002 | 木纹贴图满铺背景 | `/background[^;]*:[^;]*?(wood\|woodgrain\|wood-texture\|木纹)[^;]*;/gi` | WARNING | 删除木纹贴图，用低饱和暖色+极淡渐变 |
| R-ANTIQUE-003 | 门票/票根装饰元素 | `/(ticket\|票根\|门票\|stamp-border\|perforated)[^{]*\{/gi` | WARNING | 删除票根样式，用排版和留白表达层级 |
| R-ANTIQUE-004 | 单块 3+ 色堆砌（庙会感） | 上下文检查：单个 CSS 规则块内出现 ≥3 种 hex 色值 | HARD_FAIL | 收敛为 1主色+1辅色+1点缀色 = 60:30:10 |

### 1.4 AI 国风感（AI-Guofeng）— 6条

| 规则ID | 检测目标 | 正则/属性模式 | 严重度 | 修复建议 |
|---|---|---|---|---|
| R-AI-001 | 过度光晕（blur ≥ 100px） | `box-shadow` 解析，blur 值 ≥ 100px | WARNING | 收敛阴影 blur ≤ 24px，参考 `--shadow-skylight` |
| R-AI-002 | 粒子特效/花瓣飘散 | `/(particle\|particles\|粒子\|petal\|petals\|花瓣飘散\|sakura\|cherry-blossom)/gi` | HARD_FAIL | 删除粒子系统，用极缓背景渐变变化（天光呼吸） |
| R-AI-003 | 水墨笔刷素材/墨迹背景 | `/(ink-wash\|brush-stroke\|ink-brush\|水墨\|墨迹\|墨滴)[^{]*\{/gi` | WARNING | 删除笔刷贴图，用大面积月白+少量黛色表达留白 |
| R-AI-004 | 纯黑 #000000 / 纯白 #FFFFFF | `/(#[0]{6}\b\|#[fF]{6}\b)/g` | WARNING | 黑→黛 `hsl(0,5%,12%)`；白→月白 `hsl(42,25%,92%)` |
| R-AI-005 | 彩虹多色渐变（≥4色标） | `linear-gradient` 色标数 ≥ 4 | HARD_FAIL | 渐变收敛为 2 色，同色系，饱和度 ≤ 50% |
| R-AI-006 | 文字发光 text-shadow 光晕 | `/text-shadow\s*:[^;]*?0\s+0\s+\d{2,}px/gi` | WARNING | 删除文字发光光晕；用颜色对比表达层级 |

### 1.5 动效俗套（Motion Cliche）— 7条

| 规则ID | 检测目标 | 正则/属性模式 | 严重度 | 修复建议 |
|---|---|---|---|---|
| R-MOTION-001 | 弹跳/弹性缓动 | `/(bounce\|elastic\|spring\|back\s*:)/gi` | HARD_FAIL | 改用 `var(--ease-cloud)` 或 `var(--ease-water)` |
| R-MOTION-002 | 动画时长 < 800ms | `duration/animation: XXXms`，XXX < 800 | WARNING | 最低 800ms（`--dur-instant`），推荐 1500ms+ |
| R-MOTION-003 | 线性缓动 linear | `/easing\s*:\s*linear\|animation[^;]*?\slinear\s/g` | WARNING | 改用 `var(--ease-water)` 或 `var(--ease-cloud)` |
| R-MOTION-004 | 旋转入场 | `/(rotate\s*\(\|spin\|旋转入场)/gi` | HARD_FAIL | 删除旋转，改为 opacity + translateY 微位移 |
| R-MOTION-005 | 闪烁/频闪 blink | `/(blink\|flicker\|闪烁\|频闪)/gi` | HARD_FAIL | 删除闪烁；改用极缓透明度呼吸（8s+ 循环） |
| R-MOTION-006 | 脉冲 pulse 动画 | `/(pulse\|脉冲\|心跳)/gi` | WARNING | 改用 `var(--dur-breath)` 8s 呼吸循环 |
| R-MOTION-007 | 内容元素无限循环 | `/animation[^;]*?infinite[^;]*;/gi` | WARNING | 内容元素动画只播一次；仅背景氛围可循环 |

### 1.6 布局俗套（Layout Cliche）— 4条

| 规则ID | 检测目标 | 正则/属性模式 | 严重度 | 修复建议 |
|---|---|---|---|---|
| R-LAYOUT-001 | text-align: center 滥用 | `/text-align\s*:\s*center/gi` | WARNING | 标题/正文左对齐，仅仪式性元素（印章/落款）居中 |
| R-LAYOUT-002 | flex 全居中无层级 | `/justify-content\s*:\s*center[^}]*?align-items\s*:\s*center/gi` | WARNING | 用 margin/padding 模数系统定位，留出留白 |
| R-LAYOUT-003 | 完美圆形 border-radius: 50% 滥用 | `/border-radius\s*:\s*50%/gi` | WARNING | 东方美学用方矩为主，圆角 ≤ 8px；圆形仅用于印章 |
| R-LAYOUT-004 | position: absolute 滥用（≥3处） | 全局统计 absolute 出现次数 ≥ 3 | WARNING | 用 Flex/Grid 文档流布局，absolute 仅用于浮层 |

### 1.7 材质俗套（Material Cliche）— 1条

| 规则ID | 检测目标 | 正则/属性模式 | 严重度 | 修复建议 |
|---|---|---|---|---|
| R-MATERIAL-001 | 重毛玻璃 backdrop-filter blur ≥ 20px | `backdrop-filter: blur(Npx)`，N ≥ 20 | WARNING | 改用半透明纯色（hsl alpha 0.1-0.2）表达纸透感 |

### 1.8 JS 层俗套（JavaScript Cliche）— 5条

| 规则ID | 检测目标 | 正则/属性模式 | 严重度 | 修复建议 |
|---|---|---|---|---|
| R-JS-001 | alert() 弹窗 | `/\balert\s*\(/gi` | HARD_FAIL | 用自定义 toast 组件，融入东方美学 |
| R-JS-002 | confirm()/prompt() 原生对话框 | `/\b(confirm\|prompt)\s*\(/gi` | HARD_FAIL | 用自定义 modal 组件，配合推门入场动势 |
| R-JS-003 | setInterval 做视觉动画 | `setInterval(function, N)`，N < 100ms | WARNING | 视觉动画用 requestAnimationFrame 或 CSS animation |
| R-JS-004 | document.write() | `/document\.write\s*\(/gi` | HARD_FAIL | 用 DOM API（createElement/appendChild） |
| R-JS-005 | innerHTML 字符串拼接 | `/\.innerHTML\s*=\s*[^;]*(\+\|`)/gi` | HARD_FAIL | 用 textContent 或 DOM API 安全创建元素 |

### 1.9 色彩饱和度全局检测 — 1条

| 规则ID | 检测目标 | 检测方式 | 严重度 | 修复建议 |
|---|---|---|---|---|
| R-COLOR-SAT-001 | 颜色饱和度 > 60% | 解析 HSL/hex 颜色值，计算 S 分量 | S>75%: HARD_FAIL；S=60-75%: WARNING | 降低饱和度至 ≤ 50%，参考 tokens.css 标准色 |

---

**规则总数：41 条**（CSS 34 条 + JS 5 条 + 上下文/函数检测 2 条）

---

## 2. 修复方案库

> 每个检测项给出"修复前 → 修复后"完整代码对比。
> **修复哲学：结构先于装饰** —— 先去掉俗套元素，再从结构（留白/比例/光影/材料）重建东方性。

### 2.1 国潮贴图感修复

#### 修复 1：祥云背景贴图 → 结构留白

```css
/* ❌ 修复前：祥云贴图满铺 */
.hero-banner {
  background-image: url('xiangyun-cloud-pattern.png');
  background-repeat: repeat;
  background: linear-gradient(135deg, #FF0000, #FFD700);
  border: 3px solid #FFD700;
  font-family: "Maobi Brush", cursive;
  padding: 20px;
}

/* ✅ 修复后：月白底 + 大留白 + 宋体标题 */
.hero-banner {
  background: var(--color-bg);        /* 月白 #E8E4D9 */
  border: none;                        /* 删除金色描边 */
  font-family: var(--font-serif);      /* 宋体系 */
  padding: var(--space-5xl) var(--space-4xl); /* 96px 殿堂级留白 */
  text-align: center;
}
```

**为什么这样修**：去掉祥云贴图后，东方性不靠"贴上去的纹样"，而靠：月白色底（气色）+ 96px 大留白（七藏三露）+ 宋体松字距（宋体系感）。

---

#### 修复 2：毛笔字标题 → 宋体 + 字距

```css
/* ❌ 修复前：毛笔字体 */
.hero-title {
  font-family: "Calligraphy", "Brush Script MT", cursive;
  color: #FF0000;
  text-shadow: 0 0 20px #FFD700;
  font-size: 72px;
}

/* ✅ 修复后：宋体 + 轻字重 + 松字距 */
.hero-title {
  font-family: var(--font-serif);
  color: var(--dai-blue-700);         /* 黛青 #2C3E50 */
  font-size: var(--font-3xl);          /* 64px */
  font-weight: var(--weight-light);     /* 300，不用 bold */
  letter-spacing: 0.2em;               /* 字距偏松 = 宋体系感 */
  text-shadow: none;                    /* 删除金色光晕 */
}
```

### 2.2 古装影视感修复

#### 修复 3：正红+明黄 → 暗朱砂+哑金

```css
/* ❌ 修复前：宫墙配色 */
.palace {
  background-color: #FF0000;
  border: 2px solid #FFD700;
  color: #00C853;
}

/* ✅ 修复后：低饱和五色体系 */
.palace {
  background-color: var(--zhusha-700); /* 深朱砂 hsl(16,70%,22%) */
  border: none;
  color: var(--yuebai-100);            /* 月白浅文字 */
  padding: var(--space-3xl);
}
```

---

#### 修复 4：舞台聚光 → 天光漫射

```css
/* ❌ 修复前：舞台追光 */
.spotlight {
  background: radial-gradient(circle at center, #FFD700, #FF0000);
  box-shadow: 0 0 150px #FFD700;
}

/* ✅ 修复后：天光漫射 */
.spotlight {
  background: linear-gradient(180deg,
    hsl(45, 30%, 96%, 0.1) 0%,
    hsl(45, 25%, 88%, 0.05) 100%);
  box-shadow: var(--shadow-skylight);
}
```

### 2.3 仿古景区感修复

#### 修复 5：sepia 做旧滤镜 → 纯净月白底

```css
/* ❌ 修复前：全局 sepia 做旧 */
.tourist-page {
  filter: sepia(0.8);
  background: url('woodgrain-texture.jpg');
  background-repeat: repeat;
}

/* ✅ 修复后：纯净月白底 */
.tourist-page {
  filter: none;
  background: var(--color-bg);
}
```

### 2.4 AI 国风感修复

#### 修复 6：彩虹渐变 → 同色系两色

```css
/* ❌ 修复前：彩虹多色渐变 */
.ai-glow {
  background: linear-gradient(45deg, #FF0000, #FFD700, #00FF00, #00FFFF, #FF00FF);
  box-shadow: 0 0 200px #FFD700;
}

/* ✅ 修复后：同色系两色渐变 */
.ai-glow {
  background: linear-gradient(180deg,
    var(--xuan-800) 0%,
    var(--dai-blue-700) 100%);
  box-shadow: var(--shadow-skylight);
}
```

---

#### 修复 7：粒子飘散 → 天光呼吸

```css
/* ❌ 修复前：JS 粒子花瓣飘散 */
// const particles = [];
// for (let i = 0; i < 200; i++) { particles.push(createPetal()); }
// setInterval(animateParticles, 16);

/* ✅ 修复后：极缓天光呼吸 CSS 动画 */
.breathing-light {
  animation: skylight-breathe var(--dur-light) var(--ease-cloud) infinite;
}
@keyframes skylight-breathe {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}
```

### 2.5 动效俗套修复

#### 修复 8：弹跳旋转入场 → 推门浮现

```css
/* ❌ 修复前：弹跳 + 旋转 + 快速 */
.cliche-animation {
  animation: bounce-in 500ms ease-out, spin 800ms linear infinite;
  transition: all 200ms linear;
}

/* ✅ 修复后：推门入场 + 东方缓动 + 长时长 */
.cliche-animation {
  animation: reveal-in var(--dur-reveal) var(--ease-cloud);
  transition: opacity var(--dur-instant) var(--ease-water);
}
@keyframes reveal-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 2.6 布局俗套修复

#### 修复 9：全居中滥用 → 中轴秩序

```css
/* ❌ 修复前：所有元素全居中 */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

/* ✅ 修复后：左对齐 + 模数留白 */
.container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;      /* 顶部对齐，非居中 */
  align-items: stretch;             /* 撑满，非居中 */
  text-align: left;                  /* 左对齐阅读流 */
  padding: var(--space-3xl) var(--space-4xl);
}
```

### 2.7 JS 俗套修复

#### 修复 10：alert 弹窗 → 东方 Toast

```javascript
/* ❌ 修复前：原生 alert */
alert('操作成功');

/* ✅ 修复后：自定义 toast 组件 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 48px; left: 50%;
    transform: translateX(-50%);
    background: var(--dai-700); color: var(--yuebai-100);
    padding: 12px 24px; border-radius: 4px;
    font-family: var(--font-serif); font-size: 14px;
    opacity: 0; transition: opacity 800ms ease;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}
```

---

## 3. 自动化审查工具

### 3.1 工具信息

| 项目 | 值 |
|---|---|
| 文件路径 | `tools/anti-cliche-lint.js` |
| 运行环境 | Node.js 14+（无外部依赖） |
| 输入 | .css 或 .js 文件路径 |
| 输出 | JSON 报告 或 人类可读终端报告 |
| 退出码 | 0=通过，1=有HARD FAIL，2=文件错误 |

### 3.2 使用方法

```bash
# 基本用法（人类可读报告）
node anti-cliche-lint.js ./your-page.css

# 检查 JS 文件
node anti-cliche-lint.js ./your-script.js

# JSON 格式输出（可接入 CI/CD）
node anti-cliche-lint.js ./your-page.css --json > lint-report.json

# 查看帮助
node anti-cliche-lint.js --help
```

### 3.3 输出样例（摘要）

```
╔══════════════════════════════════════════════════════╗
║     中式美学反俗套 CSS 审查报告 (Anti-Cliche Lint)   ║
╚══════════════════════════════════════════════════════╝

── 摘要 ──
  总命中: 62
  HARD FAIL: 44 ❌
  WARNING: 18 ⚠️
  检测规则: 41 条

── 按类别 ──
  古装影视感: 21 / 仿古景区感: 7 / 国潮贴图感: 8
  AI国风感: 10 / 动效俗套: 5 / 色彩俗套: 9

结论: ❌ 不通过 — 存在 44 处 HARD FAIL，必须修复
```

### 3.4 CI/CD 集成

```json
// package.json
{
  "scripts": {
    "lint:cliche": "node tools/anti-cliche-lint.js src/**/*.css"
  }
}
```

---

## 4. POC 验证

### 4.1 测试对象

| 文件 | 说明 |
|---|---|
| `poc-ugly.css` | 典型俗套页面（反面教材） |
| `poc-fixed.css` | 修复后合规页面 |

### 4.2 审查结果对比

| 指标 | 修复前 | 修复后 | 改善 |
|---|---|---|---|
| 总命中 | 62 | 13 | -79% |
| HARD FAIL | 44 | 6 | -86% |
| WARNING | 18 | 7 | -61% |
| 检测规则 | 41 条 | 41 条 | — |

> 修复后剩余命中主要为选择器命名误报（如 `.palace-scene` 含 "palace" 关键词但样式已合规）。

---

## 5. 代码审查人工 Checklist

> 代码评审时逐项检查。**命中任意 2 条同类俗套 = 该模块需要回炉。**

### 5.1 元素层
- [ ] 祥云/回纹/万字纹 — 能说出"为什么用"吗？
- [ ] 毛笔/书法字体 — 内容本身需要书法吗？
- [ ] 红色的功能是什么？（不是"因为中式"吧？）
- [ ] 灯笼/中国结/折扇 — 有结构功能还是纯装饰？
- [ ] 中式装饰元素 ≤ 3 种？有主次？

### 5.2 色彩层
- [ ] 所有颜色饱和度 S ≤ 50%？
- [ ] 有没有 `#FF0000`？→ 改 `#8B2500`
- [ ] 有没有 `#FFD700`？→ 改 `#B8860B`
- [ ] 金色面积 ≤ 5%？
- [ ] 主色 ≤ 2 种，点缀 ≤ 1 种？
- [ ] 阴影有颜色，不是纯黑？
- [ ] 渐变 ≤ 2 色？

### 5.3 结构层
- [ ] **"为什么是中国的"测试**：去掉所有中式元素后还有东方性吗？
- [ ] 有中轴/层级/进深？
- [ ] 有留白？还是满铺？
- [ ] 有明确光源方向？
- [ ] 有时间感？

### 5.4 布局层
- [ ] text-align: center 滥用？
- [ ] flex 全居中无层级？
- [ ] border-radius: 50% 滥用？
- [ ] position: absolute 超过 3 处？

### 5.5 动效层
- [ ] bounce/elastic/spring 缓动？
- [ ] 动画 < 800ms？
- [ ] linear 线性缓动？
- [ ] 旋转入场？
- [ ] 闪烁/脉冲？
- [ ] 内容元素无限循环？

### 5.6 JS 层
- [ ] alert()/confirm()/prompt() 原生弹窗？
- [ ] document.write()？
- [ ] innerHTML 字符串拼接？
- [ ] setInterval 做视觉动画？

### 5.7 归因陈述测试
> 能说出 ≥ 3 个结构维度（中轴/留白/比例/光影/色彩等级/动势）？
> 说不出 → FAIL，回炉。

---

## 6. 模块映射

| 俗套类型 | 对应美学模块 | 修复方向 |
|---|---|---|
| 国潮贴图感 | 03 Void/Solid + 01 Philosophy | 元素是结果不是原因 |
| 古装影视感 | 06 Light + 07 Color | 降饱和度，自然光 |
| 仿古景区感 | 09 Architecture + 05 Material | 比例等级，材料真实 |
| AI国风感 | 05 Material + 06 Light | 材质纹理，光影方向 |
| 动效俗套 | 08 Motion | 云/水/烟/风/光 |
| 布局俗套 | 02 Spatial Order + 03 Void/Solid | 中轴秩序，留白 |
| JS俗套 | 整体设计哲学 | 沉浸感，非突兀弹窗 |
