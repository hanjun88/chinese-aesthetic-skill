<!--
  ============================================================================
  状态：DRAFT（第一阶段 · 框架搭建）
  本文件当前不是最终交付物。
  ----------------------------------------------------------------------------
  当前可用语料：JS 课程 90 集转写（full/javascript_90ep.txt）
  等待语料：完整 721 集（HTML/CSS 199 + JS 200 + Vue 168 + React 154）
            完成后位于 books/frontend-playbook/full/，届时通知再精填。
  ----------------------------------------------------------------------------
  纪律：
   - 不用 90 集半成品冒充完整内容；宁可留 <!-- TODO --> 占位。
   - 90 集内容仅用于 §6 的 POC 概念验证，且明确标注 [POC-90ep]。
   - 第二阶段从完整 200 集 JS 课程精准提取，替换 POC 与占位。
  ============================================================================
-->

# JavaScript / 交互实现层模块（DRAFT · 框架版）

> 本模块是「中式美学设计决策引擎」的落地编码层。
> 本版本（第一阶段）只交付三件事：
> 1. **需求清单**：每个美学交互维度需要哪些 JS API / 事件 / 设计模式 / 算法（§3）；
> 2. **模块骨架**：章节结构 + TODO 占位（§4）；
> 3. **接口定义 + POC**：六个工具函数的签名/契约（§5），挑 1–2 个维度用现有 90 集做概念验证（§6，标注 `[POC-90ep]`）。
>
> 第二阶段（等 721 集到位）：按 §8 填充计划，从完整 200 集 JS 课程提取精华，替换全部 POC 与 TODO。

---

## 1. 模块概述

### 1.1 本模块解决什么问题

美学决策引擎输出的是**设计约束**（"动如行云"、"进入即推门"、"七藏三露"、"滚动即进深"）。
到了前端工程层有三个断层需要补齐：

1. **曲线断层**：CSS `cubic-bezier` 无法在 JS 驱动（粒子/物理/滚动插值）中复用；
2. **时长断层**：美学要求 2–8s 慢入慢出，前端惯性是 300–500ms 敏捷反馈；
3. **节奏断层**：东方要求阵发/呼吸/交错/可逆，常见实现是同步/一次性/不可撤销。

本模块的目标交付（最终态）：每个美学维度给出 **JS API → 可运行代码 → 参数换算规则**，并沉淀可 `import` 的工具库、五个完整交互模板、一个端到端闭环示例。

### 1.2 设计原则（最终态必须遵守）

| 原则 | 工程含义 |
|---|---|
| 慢 | 入场/揭示 ≥1.2s；氛围循环 5–15s；反馈 ≥0.3s 且不用弹跳曲线 |
| 缓 | ease-in-out / 自定义长曲线；禁 linear/spring/overshoot；delta 钳制 |
| 连 | Promise 链 / async-await 串联；循环首尾无缝 |
| 可逆 | 藏露可重新隐藏；返回有反向动画 |
| 浮现而非弹出 | 从遮挡（门/帘/雾/光/边缘）浮现，非 scale 0→1 overshoot |
| 可销毁 | addEventListener↔removeEventListener、Observer.disconnect、rAF↔cancel |

### 1.3 技术栈基线

现代浏览器 ES6+。关键候选 API 见 §3 需求清单（其中超出 90 集范围的，第二阶段补全）。

---

## 2. 美学交互维度总览

最终需覆盖 6 个维度（来自 `eastern-aesthetic-decision-engine`）：

| # | 维度 | 美学来源模块 | 一句话 |
|---|---|---|---|
| D1 | 动势（云水烟风） | `08-motion.md` | 缓、连、有重量、有方向、有呼吸 |
| D2 | 进入仪式 | `01-philosophy.md` / `10-interaction.md` | 远观→趋近→过门→转折→豁然，≥2 步 |
| D3 | 交互仪式 | `10-interaction.md` | 点击=推门，hover=门微启，慢入慢出 |
| D4 | 时间感 | `10-interaction.md` / `08-motion.md` | 慢交互 ≥2s，静止即呼吸 |
| D5 | 虚实切换 | `03-void-solid.md` / `10-interaction.md` | 七藏三露，可逆，有物理过程 |
| D6 | 空间递进 | `08-motion.md` / `10-interaction.md` | 滚动即进深，≥3 层视差，停靠 |

---

## 3. 需求清单（核心交付 · 按维度拆解到 API/事件/设计模式粒度）

> 这是第二阶段精准提取的索引。每个维度列出：**需要的 JS API / DOM 事件 / 设计模式 / 算法 / 性能与无障碍要求**。
> 标注 `[90ep已有]` = 现有转写已覆盖可直接用；`[待200ep补全]` = 完整课程应有但 90 集未覆盖，第二阶段提取。

### D1 动势（云水烟风）

**需要的 JS API / 机制**
- `requestAnimationFrame` 逐帧循环 `[待200ep补全：完整 rAF 节奏、与 setInterval 对比、避后台节流]`
- `performance.now()` 高精度时间戳 `[90ep部分：Date.now 已知，performance.now 待补]`
- deltaTime 时间步长积分与钳制（`Math.min(dt, 0.1)`）`[待200ep补全]`
- 缓动函数数学实现：余弦 ease-in-out、三次方 in-out、三次方 out、叠加正弦噪声 `[90ep：Math.sin/cos/pow 已知]`
- 弹簧-阻尼物理（角度/位移二阶积分）`[待200ep补全：物理模拟专题]`
- 粒子/体积模拟（云=连续体积，烟=上升+湍流）`[待200ep补全：Canvas 专题]`
- `transform: translate3d / rotate / scale` GPU 合成 `[90ep：style.transform 已知]`

**设计模式**
- 循环封装器（start/pause/destroy 唯一属主）
- 自然原型 → 参数表映射（云/水/烟/风/光 五套 duration+easing+loop）

**算法要点**
- 风：每对象随机相位 phase + 随机强度，叠加低频阵风包络（不同步）
- 烟：上升 y + 横向 sin 漂移 + opacity 渐散
- 云：超长周期余弦循环，首尾无缝

**性能/无障碍**
- 只动 transform/opacity；will-change 仅给在动元素；≤3 组同时动；`prefers-reduced-motion` 直接终态。

---

### D2 进入仪式

**需要的 JS API / 机制**
- `IntersectionObserver`（threshold / rootMargin / unobserve）`[待200ep补全：完整 IO 专题]`
- `transitionend` 事件监听 + 移除（单步动画完成时机）`[90ep：事件监听已知，transitionend 待补]`
- `getComputedStyle` / reflow 锁定起始态（`void el.offsetHeight`）`[待200ep补全]`
- `Promise` + `async/await` 序列编排 `[待200ep补全：完整 Promise/async 专题]`
- `setTimeout` 作为仪式节拍（sleep 小睡）`[90ep已有：定时器]`

**设计模式**
- 序列编排器：远观→趋近→过门→转折→豁然，每步 await 完成再启下一步
- "浮现"原语：opacity + 微位移（非 scale overshoot）

**算法要点**
- 过门 = 短暂暗场（veil is-closed），不做"跳过动画"按钮
- 前慢后快再慢：趋近加速、过门减速、豁然展开

**性能/无障碍**
- 进入视口才触发（不预跑）；键盘 focus 等价 hover；不提供跳过按钮。

---

### D3 交互仪式

**需要的 JS API / 机制**
- 事件模型：`addEventListener` / 事件对象 `e.target` / `e.closest()` `[90ep：addEventListener 已知；closest 待补]`
- 事件冒泡/捕获/事件委托（批量花窗/竹简，容器一个监听器）`[待200ep补全：事件进阶专题]`
- 防抖 `debounce` / 节流 `throttle` `[待200ep补全：完整防抖节流专题]`
- 高频事件：`mousemove` / `scroll` / `resize` `[90ep：onclick/onscroll 已知]`
- 事件解绑 `removeEventListener`（闭环）`[待200ep补全]`
- CSS `:hover` / `:focus-visible` 慢入慢出（transition-duration 入短出长）`[HTML/CSS 199ep 补全]`

**设计模式**
- 事件委托 + 物理隐喻（门/帘/窗/签）
- bind/unbind 成对返回（组件卸载闭环）

**算法要点**
- hover = 门微启（rotateY -6deg），非变色；click = 推门/揭帘，有空间位移
- 慢入慢出：进入 600ms、离开 1200ms（回退更慢 = 余韵）

**性能/无障碍**
- mousemove throttle 16–32ms；scroll `{passive:true}`；可点元素用 `<button>` 而非 div。

---

### D4 时间感

**需要的 JS API / 机制**
- `setTimeout`（单次等待：等雾散/等门开）`[90ep已有]`
- `setInterval`（离散节拍：每秒跳格/节气轮播）`[90ep已有]`
- `Promise` 链 / `async-await` 多步时序 `[待200ep补全]`
- rAF 连续插值（呼吸/光晕，按时间连续）`[待200ep补全]`
- `matchMedia('(prefers-reduced-motion)')` `[待200ep补全]`
- `Date` / `performance.now` 时间源 `[90ep：Date 已知]`

**设计模式**
- 慢交互：操作后分段加类（灯丝红→暖黄→漫开），≥2s 过程可见
- 呼吸循环：极慢正弦（5–15s），几乎不可察觉但让画面活

**算法要点**
- 呼吸 = `0.5-0.5*cos(2π·t)`，首尾无缝
- 等待不是 loading，是体验本身（过程中有连续视觉变化）

**性能/无障碍**
- 能用 rAF 连续插值就不用 setInterval 跳变；reduced-motion 下跳终态。

---

### D5 虚实切换

**需要的 JS API / 机制**
- `classList.add/remove/toggle`（不改 className 防覆盖）`[90ep已有：classList 终极方案]`
- 轻量状态机（开/合/藏/露/进/退）`[待200ep补全：面向对象/设计模式专题]`
- `innerHTML` 模板字符串批量渲染 + 局部 classList 增量 `[90ep已有：数据驱动视图]`
- `clip-path` / `max-width` / `transform` 做"从遮挡露出" `[HTML/CSS 199ep 补全]`
- `MutationObserver`（内容披露后联动）`[待200ep补全]`

**设计模式**
- 可逆藏露：toggle 而非一次性触发
- 渐进披露：分批 + 批内交错（七藏三露，先露 30%）

**算法要点**
- 揭示必须有物理过程（帘滑动 1.4s、内容 opacity 延迟 200ms）
- 至少一处"透"（漏窗/隔扇），非全开窗

**性能/无障碍**
- 覆写 innerHTML 会丢事件焦点 → 交互元素改 classList；可逆藏露键盘可达。

---

### D6 空间递进

**需要的 JS API / 机制**
- 滚动监听 + 节流 + `scrollY` 进度映射 `[90ep：onscroll 已知]`
- 视差：scroll 进度 → 各层 translateY，远景系数小/近景大 `[待200ep补全：滚动视差专题]`
- CSS `scroll-snap-type` / `scroll-snap-align`（停靠）`[HTML/CSS 199ep 补全]`
- `IntersectionObserver`（进入视口触发进深）`[待200ep补全]`
- `ResizeObserver`（容器尺寸变化重算视差）`[待200ep补全]`
- `window.scrollTo` 平滑（`behavior:'smooth'`）`[待200ep补全]`

**设计模式**
- 三层视差（远 0.1–0.2 / 中 0.3–0.45 / 近 0.6–0.9）
- scroll-snap proximity：靠近才吸附，不打断节奏

**算法要点**
- 层间系数差 ≥0.2 才有进深；滚动节奏 = 展开→收束→展开的呼吸
- 滚动 = 外院→门廊→中庭→内院→后殿 的空间映射

**性能/无障碍**
- scroll passive；视差只动 transform；reduced-motion 下关闭视差。

---

## 4. 模块骨架（章节结构 + TODO 占位）

> 第二阶段按此骨架逐节填充。`<!-- TODO -->` 处标注需要从完整课程提取什么。

### 4.1 模块概述
<!-- TODO: 用完整课程的 ES6/模块化/异步内容重写 1.3 技术栈基线 -->

### 4.2 美学交互维度 → JS 技术映射表（6 维度）
<!-- TODO: 每维度补全为「API + 可运行代码 + 参数换算表」三段式。
     D1 动势、D2 进入仪式 已有 POC（见 §6），其余 D3–D6 待第二阶段从完整课程提取。
     需提取的知识点：防抖节流实现、事件委托冒泡、IntersectionObserver 完整配置、
     scroll-snap、clip-path、弹簧物理、Canvas 粒子。 -->

### 4.3 东方美学动画工具库（六个工具函数）
<!-- TODO: 函数体第二阶段用完整课程的 Promise/async/rAF/物理专题补全到工业级。
     当前 §5 为接口定义（签名+JSDoc），§6 为 POC 实现。 -->
- easternEasing（云水烟风四缓动）
- createRafLoop（rAF 循环封装）
- staggerAnimation（交错编排）
- scrollReveal（滚动进入）
- breathLoop（呼吸循环）
- stateMachine（六态状态机）

### 4.4 核心交互模式代码模板（五个完整 HTML）
<!-- TODO: 推门/卷轴/漏窗/水墨/灯笼 五个完整 DOCTYPE 模板，第二阶段补全为可直接运行。
     需补：clip-path 卷轴、漏窗多层视差、水墨 Canvas 扩散、灯笼弹簧物理、精确 RGBA。 -->

### 4.5 闭环验证：禅意作品集
<!-- TODO: 第二阶段给出从美学约束→JS 代码的完整端到端示例（当前 POC 见 §6.3） -->

### 4.6 性能与无障碍
<!-- TODO: 补 will-change/transform/reflow 详解、prefers-reduced-motion、键盘可达、内存泄漏对照表。
     需从完整课程 DOM 事件/性能专题提取。 -->

### 4.7 能力卡引用
<!-- TODO: 见 §7 框架，第二阶段随内容填充细化调用场景 -->

---

## 5. 工具函数接口定义（六个 · 签名/契约已定，实现待第二阶段）

> 函数签名与 JSDoc 是契约，最终实现必须遵守。当前函数体为 POC 占位（标注 `[POC-90ep]`）。

### 5.1 `easternEasing`
```js
/**
 * 东方缓动曲线（云水烟风）。纯函数 t∈[0,1] → [0,1]，无副作用。
 * @param {number} t 归一化时间 0..1
 * @returns {number} 归一化进度 0..1
 */
export const easternEasing = {
  /** 行云：极缓余弦，无明显起止。数学 0.5-0.5*cos(πt) */
  cloud(t) { /* [POC-90ep] 见 §6.1 */ },
  /** 流水：三次方 in-out，有重量。t<0.5?4t³:1-(-2t+2)³/2 */
  water(t) { /* [POC-90ep] */ },
  /** 炊烟：三次方 out，上升后扩散。1-(1-t)³ */
  smoke(t) { /* [POC-90ep] */ },
  /** 轻风：缓出叠加双频正弦阵风，钳制[0,1] */
  wind(t) { /* TODO: 完整噪声/湍流实现待 200ep */ },
  /** 呼吸：极慢正弦。0.5-0.5*cos(2πt) */
  breath(t) { /* [POC-90ep] */ }
};
```

### 5.2 `createRafLoop`
```js
/**
 * rAF 循环封装，支持 start/pause/destroy，delta 钳制 ≤0.1s。
 * @param {function(dt:number, t:number):void} update dt=距上帧秒数, t=自启秒数
 * @returns {{start:Function, pause:Function, destroy:Function, running:boolean}}
 */
export function createRafLoop(update) { /* [POC-90ep] 见 §6.1；完整节奏/避后台待补 */ }
```

### 5.3 `staggerAnimation`
```js
/**
 * 交错进入编排（竹简展开）。元素错峰浮现，统一东方缓动。
 * @param {HTMLElement[]} elements
 * @param {Object} [opts] {duration=2400, interval=280, easing=easternEasing.water, distance=26}
 * @returns {Promise<HTMLElement[]>} 全部进入后 resolve
 */
export function staggerAnimation(elements, opts) { /* TODO: transitionend 完整实现待 200ep */ }
```

### 5.4 `scrollReveal`
```js
/**
 * 滚动进入触发器（从遮挡浮现），基于 IntersectionObserver。
 * @param {string|HTMLElement[]} target
 * @param {Object} [opts] {threshold=0.2, rootMargin='0px 0px -8% 0px', once=true, revealClass='is-revealed'}
 * @returns {IntersectionObserver} 持有后 .disconnect() 销毁
 */
export function scrollReveal(target, opts) { /* TODO: IO 完整配置/回调待 200ep */ }
```

### 5.5 `breathLoop`
```js
/**
 * 呼吸节奏循环（光晕/雾气），极缓 5–15s 首尾无缝。
 * @param {HTMLElement} el
 * @param {Object} [opts] {period=9000, min=0.96, max=1.04, mode='scale'|'opacity'}
 * @returns {{start:Function, pause:Function, destroy:Function}}
 */
export function breathLoop(el, opts) { /* TODO: 基于 createRafLoop，待补 */ }
```

### 5.6 `stateMachine`
```js
/**
 * 美学状态机：open(开)/closed(合)/hidden(藏)/shown(露)/enter(进)/exit(退)。
 * @param {string} initial 初始状态
 * @param {Object} transitions key="from->to"，value=副作用函数
 * @returns {{state:string, transition:Function, can:Function, onChange:Function}}
 */
export function stateMachine(initial, transitions) { /* TODO: OOP/设计模式专题补全 */ }
```

---

## 6. POC 验证区（仅用 90 集内容，标注 `[POC-90ep]`，后续替换）

> 挑两个维度做概念验证：**D1 动势**（easternEasing + createRafLoop）与 **D2 进入仪式**（observeEnter + entryRitual）。
> 这些实现证明"美学约束→JS"映射可行，但**不是最终工业级实现**，第二阶段用完整课程替换。

### 6.1 [POC-90ep] D1 动势：缓动函数 + rAF 循环

```js
// [POC-90ep] 基于现有 Math.sin/cos/pow 知识，后续补噪声/物理/避后台
const easternEasing = {
  cloud(t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); },
  water(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  smoke(t) { return 1 - Math.pow(1 - t, 3); },
  breath(t) { return 0.5 - 0.5 * Math.cos(2 * Math.PI * t); }
  // wind: TODO 双频正弦阵风，待 200ep
};

// [POC-90ep] rAF 循环基础版（delta 钳制 + destroy 已具备；完整避后台节奏待补）
function createRafLoop(update) {
  let rafId = null, running = false, last = 0, elapsed = 0;
  function frame(now) {
    if (!running) return;
    if (last === 0) last = now;
    let dt = Math.min((now - last) / 1000, 0.1);
    last = now; elapsed += dt;
    update(dt, elapsed);
    rafId = requestAnimationFrame(frame);
  }
  return {
    get running() { return running; },
    start() { if (running) return; running = true; rafId = requestAnimationFrame(frame); },
    pause() { running = false; if (rafId !== null) cancelAnimationFrame(rafId); rafId = null; },
    destroy() { this.pause(); }
  };
}
```

### 6.2 [POC-90ep] D2 进入仪式：浮现原语 + 序列编排

```js
// [POC-90ep] sleep 基于 90 集已学 setTimeout
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// [POC-90ep] 浮现：opacity+微移，transitionend 收尾（IO/完整 reflow 锁定待 200ep）
function emerge(el, { duration = 1600, distance = 24 } = {}) {
  return new Promise((resolve) => {
    el.style.transition = `transform ${duration}ms cubic-bezier(0.25,0.1,0.25,1), opacity ${duration}ms ease`;
    el.style.transform = `translate3d(0, ${distance}px, 0)`;
    el.style.opacity = '0';
    void el.offsetHeight;
    el.style.transform = 'translate3d(0,0,0)';
    el.style.opacity = '1';
    el.addEventListener('transitionend', function onEnd(e) {
      if (e.propertyName !== 'opacity') return;
      el.removeEventListener('transitionend', onEnd);
      resolve();
    });
  });
}

// [POC-90ep] 进入仪式四步（远观→趋近→过门→豁然）
async function entryRitual(scene) {
  await emerge(scene.querySelector('.js-silhouette'), { duration: 1200, distance: 12 });
  await sleep(600);
  await emerge(scene.querySelector('.js-structure'),  { duration: 1800, distance: 20 });
  await sleep(400);
  const veil = scene.querySelector('.js-veil');
  veil.classList.add('is-closed');
  await sleep(900);
  veil.classList.remove('is-closed');
  await emerge(scene.querySelector('.js-main'),       { duration: 2200, distance: 28 });
}
```

### 6.3 [POC-90ep] 闭环片段：禅意作品集（仅骨架，完整示例待第二阶段）
<!-- TODO: 第二阶段产出完整 DOCTYPE 端到端示例。当前仅证明映射可行：
     - IntersectionObserver 触发 .reveal 浮现
     - 两层视差 scrollY 映射
     - breathLoop 云气呼吸
     - pagehide 里 disconnect + removeEventListener 销毁
     此段不展开完整代码，避免半成品充数。 -->

---

## 7. 能力卡引用框架（6 卡 · 调用场景先定）

> 第二阶段随内容填充细化。当前先定每张卡在哪个维度被调用。

| 能力卡 | 路径 | 计划调用场景（维度） |
|---|---|---|
| javascript-pink-router（=== / let-const / 逻辑与或） | `…/javascript-pink/dist/javascript-pink-router/SKILL.md` | D5 状态机严格相等；全模块 let/const 纪律 |
| type-conversion（字符串转数字） | `…/type-conversion/SKILL.md` | D3/D6 坐标从 getBoundingClientRect/CSS 读为字符串，算术前转 Number |
| data-types-typeof（typeof / null / NaN） | `…/data-types-typeof/SKILL.md` | 工具函数入参兜底 `el==null`、动画值 NaN 排查 |
| data-driven-render（先死结构后活数据 / innerHTML） | `…/data-driven-render/SKILL.md` | D5 批量作品/竹简渲染；覆写 innerHTML 丢事件 → 交互元素改 classList |
| branch-switch（三元/if 区间/switch 防穿透） | `…/branch-switch/SKILL.md` | D1 easternEasing.water 三元取值；wind 钳制；状态分发 switch 必 break |
| debug-errors（读首条报错/断点看值） | `…/debug-errors/SKILL.md` | 动画不动时 Console 首条；断点悬停 t/k/angle；状态机抛错核对拼写 |

---

## 8. 第二阶段填充计划（等 721 集到位后执行）

1. **定位语料**：`books/frontend-playbook/full/javascript_*.txt`（完整 200 集）。
2. **按需求清单精准提取**（§3 每个 `[待200ep补全]` 标注）：
   - rAF / 定时器 / 异步（Promise/async-await）专题 → 填 D1/D2/D4、§5.2/5.3/5.5；
   - DOM 事件进阶（冒泡/捕获/委托/解绑）专题 → 填 D3、§5.4；
   - IntersectionObserver / MutationObserver / ResizeObserver → 填 D2/D5/D6、§5.4；
   - 防抖节流专题 → 填 D3/D6；
   - Canvas / Web Animations API / 物理模拟 → 填 D1 粒子/水墨/灯笼；
   - 面向对象 / 设计模式 → 填 §5.6 stateMachine。
3. **HTML/CSS 199 集**补 `scroll-snap` / `clip-path` / `will-change` / `prefers-reduced-motion` → 填 D5/D6、§4.4、§4.6。
4. **替换 POC**：把 §6 全部 `[POC-90ep]` 实现升级为工业级，删除 TODO 标记。
5. **五模板补全**为完整 `<!DOCTYPE html>` 可运行文档（§4.4）。
6. **闭环示例**产出完整禅意作品集（§4.5 / §6.3）。
7. **去 DRAFT**：删除本头部 DRAFT 说明，状态转为 FINAL。

---

## 附：阶段门禁

- [x] 第一阶段：需求清单（§3）、骨架（§4）、接口定义（§5）、POC（§6）、能力卡框架（§7）、填充计划（§8）
- [ ] 第二阶段：等通知 → 按 §8 提取完整课程 → 替换 POC/TODO → 去 DRAFT
