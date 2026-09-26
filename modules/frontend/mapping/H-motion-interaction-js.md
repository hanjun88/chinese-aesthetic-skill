<!--
  ============================================================================
  子代理 H · 动势(08-motion) + 交互(10-interaction) → JS 动画与交互实现映射
  状态：FINAL（基于完整 200 集 JS 课程 javascript_full.txt 精填）
  ----------------------------------------------------------------------------
  语料：黑马 Pink JS 全套 200 集（javascript_full.txt, 13509 行）
  本文件直接落地的课程知识点：
    - 手写防抖 debounce / 节流 throttle（闭包 + setTimeout + return 匿名函数）
    - 事件流：冒泡/捕获、stopPropagation、事件委托、preventDefault、事件解绑
    - DOM：querySelector / classList / createElement / appendChild / remove
    - BOM：setTimeout / setInterval / clearTimeout / 事件循环 EventLoop
    - ES6：箭头函数、解构、剩余/展开、闭包、this、call/apply/bind、GC
  说明：requestAnimationFrame / IntersectionObserver 属浏览器原生 Web API，
        本课程未逐节讲解；本模块按 W3C 标准补全为可生产运行的实现，并标注出处。
  不修改原有 11 个美学模块。
  ============================================================================
-->

# H · 动势 + 交互 → JS 动画与交互实现映射（FINAL）

> 把子代理 H 负责的两条美学线——`08-motion.md`（云水烟风光）与 `10-interaction.md`（进入/交互/时间/藏露/进深）
> ——翻译为可直接运行的现代 JS。
>
> 信条：东方动势是**气的流动**——缓、连、有重量、有方向、有呼吸。
> 全部代码遵守 **慢/缓/连**：禁弹跳(bounce/back)、禁闪烁、禁 linear、禁所有元素同步。

---

## 1. 范围

| 代号 | 维度 | 美学来源 | 核心诉求 |
|---|---|---|---|
| M1 | 动势-云 | 08-motion | 极缓连续体积感，4–8s 循环无明显起止 |
| M2 | 动势-水 | 08-motion | 有重量，正弦波纹 / 先沉后浮 |
| M3 | 动势-烟 | 08-motion | 上升 + 漂移 + 扩散，opacity 渐散 |
| M4 | 动势-风 | 08-motion | 阵发不规则，不同对象不同步 |
| M5 | 动势-光 | 08-motion | 极缓缓暗，5–15s，只改 opacity |
| I1 | 进入仪式 | 10-interaction / 01-philosophy | 远观→趋近→过门→转折→豁然 ≥2 步 |
| I2 | 交互仪式 | 10-interaction | hover=门微启，click=推门，慢入慢出 |
| I3 | 时间感 | 10-interaction / 08-motion | 慢交互 ≥2s，静止即呼吸 |
| I4 | 虚实切换 | 10-interaction / 03-void-solid | 七藏三露，可逆，有物理过程 |
| I5 | 空间递进 | 10-interaction / 08-motion | 滚动即进深，≥3 层视差，scroll-snap |

---

## 2. 需求映射（API → 课程出处）

> 标注 `[课程]` = 200 集直接覆盖；`[Web API]` = 课程未逐节讲、按浏览器原生标准补全。

| 美学需求 | 落地 API | 出处 |
|---|---|---|
| 高频事件限流（mousemove/scroll 视差） | 手写 `throttle(fn, wait)` | `[课程]` 进阶 Day4：定时器 + 闭包 + return 匿名函数 |
| 搜索/输入慢交互防抖 | 手写 `debounce(fn, wait)` | `[课程]`：setTimeout + 每次先 clearTimeout |
| 批量花窗/竹简点击 | 事件委托（父元素监听 + 冒泡） | `[课程]` 事件高级：事件流/委托 |
| 解绑防泄漏 | `removeEventListener` | `[课程]` 事件解绑 |
| 藏/露切换 | `classList.add/remove/toggle` | `[课程]` DOM：classList 终极方案（不改 className） |
| 序列节拍 | `setTimeout` 小睡 / Promise | `[课程]` BOM 延迟函数；Promise `[Web API]` |
| 逐帧动画 | `requestAnimationFrame` | `[Web API]`（课程用 setInterval 做轮播，逐帧性能更佳） |
| 滚动进入视口 | `IntersectionObserver` | `[Web API]`（课程用 scroll + 节流做电梯导航，IO 更省） |
| 从遮挡露出 | `clip-path` / transform | `[HTML/CSS]` |
| 视差/停靠 | scrollY + scroll-snap | `[课程]` scroll 事件；scroll-snap `[HTML/CSS]` |

---

## 3. 工具函数库（完整可运行 ESM）

> 存为 `eastern-motion.js` 后：
> `import { easternEasing, createRafLoop, debounce, throttle, ... } from './eastern-motion.js'`

### 3.1 `easternEasing` —— 云水烟风缓动（具体数学实现）

```js
/**
 * easternEasing —— 东方缓动曲线（云水烟风）
 * 纯函数：t∈[0,1] → 进度∈[0,1]。无副作用、无弹性、首尾平滑可无缝循环。
 */
export const easternEasing = {
  /**
   * 行云 cloud：极缓余弦，无明显起止。
   * 数学 f(t)=0.5-0.5·cos(π·t)；f(0)=0, f(.5)=.5, f(1)=1，端点导数为 0。
   * @param {number} t 0..1
   * @returns {number} 0..1
   */
  cloud(t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); },

  /**
   * 流水 water：三次方 ease-in-out，有重量（先沉后浮）。
   * 数学 t<.5 ? 4t³ : 1-(-2t+2)³/2。
   * @param {number} t 0..1
   * @returns {number} 0..1
   */
  water(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },

  /**
   * 炊烟 smoke：三次方 ease-out，上升快、扩散减速收尾。
   * 数学 f(t)=1-(1-t)³。
   * @param {number} t 0..1
   * @returns {number} 0..1
   */
  smoke(t) { return 1 - Math.pow(1 - t, 3); },

  /**
   * 轻风 wind：缓出 + 双频正弦阵风，钳制 [0,1]。
   * base=1-(1-t)²；gust=.06·sin(3πt)·sin(.7πt)。
   * @param {number} t 0..1
   * @returns {number} 0..1
   */
  wind(t) {
    const base = 1 - Math.pow(1 - t, 2);
    const gust = 0.06 * Math.sin(t * Math.PI * 3) * Math.sin(t * Math.PI * 0.7);
    const v = base + gust;
    return v < 0 ? 0 : (v > 1 ? 1 : v);
  },

  /**
   * 呼吸 breath：极慢完整正弦，首尾无缝。
   * 数学 f(t)=0.5-0.5·cos(2π·t)。
   * @param {number} t 0..1
   * @returns {number} 0..1
   */
  breath(t) { return 0.5 - 0.5 * Math.cos(2 * Math.PI * t); }
};
```

### 3.2 `debounce` / `throttle` —— 课程手写版（闭包 + 定时器）

```js
/**
 * debounce 防抖（课程手写版）：单位时间内频繁触发，只执行最后一次。
 * 核心：每次触发先 clearTimeout 上一次，再开新 setTimeout。
 * 适合：搜索输入、手机号/邮箱验证、resize。
 * @param {Function} fn 要防抖的函数
 * @param {number} wait  等待毫秒
 * @returns {Function} 包装后的函数
 */
export function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);          // 有定时器先取消上一次
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * throttle 节流（课程手写版）：单位时间内只执行一次，执行中不被打断。
 * 课程要点：setTimeout 内部用 timer=null 标记结束（不能在运行中的定时器里 clearTimeout）。
 * 适合：mousemove / scroll / resize / 视频 timeupdate 高频事件。
 * @param {Function} fn
 * @param {number} wait 毫秒
 * @returns {Function}
 */
export function throttle(fn, wait) {
  let timer = null;
  return function (...args) {
    if (!timer) {                            // 没有定时器才开（执行中不打断）
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;                        // 课程坑：用 null 覆盖，不用 clearTimeout
      }, wait);
    }
  };
}
```

### 3.3 `createRafLoop` —— rAF 循环封装（可销毁）

```js
/**
 * createRafLoop —— requestAnimationFrame 循环封装 [Web API]
 * delta 钳制 ≤0.1s（切后台不跳帧）；唯一属主，destroy 必 cancel。
 * @param {function(dt:number, t:number):void} update dt=距上帧秒(钳制≤0.1), t=自启秒
 * @returns {{start:Function, pause:Function, destroy:Function, running:boolean}}
 */
export function createRafLoop(update) {
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
    pause() { running = false; if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } },
    destroy() { this.pause(); }
  };
}
```

### 3.4 `staggerAnimation` —— 交错进入（竹简展开）

```js
/**
 * staggerAnimation —— 元素错峰浮现（竹简展开），统一东方缓动。
 * @param {HTMLElement[]} elements
 * @param {Object} [opts]
 * @param {number} [opts.duration=2400]  单元素 ms（≥1200）
 * @param {number} [opts.interval=280]    相邻启动间隔 ms
 * @param {number} [opts.distance=26]     浮现位移 px
 * @returns {Promise<HTMLElement[]>} 全部进入后 resolve
 */
export function staggerAnimation(elements, opts = {}) {
  const { duration = 2400, interval = 280, distance = 26 } = opts;
  const tasks = elements.map((el, i) => new Promise((resolve) => {
    setTimeout(() => {
      el.style.transition =
        `transform ${duration}ms cubic-bezier(0.25,0.1,0.25,1), opacity ${duration}ms ease`;
      el.style.transform = `translate3d(0, ${distance}px, 0)`;
      el.style.opacity = '0';
      void el.offsetHeight;                       // reflow 锁定起始态
      el.style.transform = 'translate3d(0,0,0)';
      el.style.opacity = '1';
      el.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName !== 'opacity') return;
        el.removeEventListener('transitionend', onEnd);   // 解绑
        resolve(el);
      });
    }, i * interval);
  }));
  return Promise.all(tasks);
}
```

### 3.5 `scrollReveal` —— 滚动进入触发器

```js
/**
 * scrollReveal —— 基于 IntersectionObserver 的"从遮挡浮现" [Web API]
 * @param {string|HTMLElement[]} target
 * @param {Object} [opts]
 * @param {number}  [opts.threshold=0.25]
 * @param {string}  [opts.rootMargin='0px 0px -10% 0px']
 * @param {boolean} [opts.once=true]  true=揭示后藏回
 * @param {string}  [opts.revealClass='is-revealed']
 * @returns {IntersectionObserver} 持有后 .disconnect() 销毁
 */
export function scrollReveal(target, opts = {}) {
  const { threshold = 0.25, rootMargin = '0px 0px -10% 0px',
          once = true, revealClass = 'is-revealed' } = opts;
  const els = typeof target === 'string'
    ? Array.from(document.querySelectorAll(target)) : target;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(revealClass);
        if (once) observer.unobserve(entry.target);
      } else if (!once) {
        entry.target.classList.remove(revealClass);
      }
    });
  }, { threshold, rootMargin });
  els.forEach((el) => observer.observe(el));
  return observer;
}
```

### 3.6 `breathLoop` —— 呼吸节奏循环

```js
/**
 * breathLoop —— 极缓呼吸微动（光晕/雾气，5–15s 首尾无缝）。
 * @param {HTMLElement} el
 * @param {Object} [opts]
 * @param {number} [opts.period=9000]
 * @param {number} [opts.min=0.96]
 * @param {number} [opts.max=1.04]
 * @param {'scale'|'opacity'} [opts.mode='scale']
 * @returns {{start:Function, pause:Function, destroy:Function}}
 */
export function breathLoop(el, opts = {}) {
  const { period = 9000, min = 0.96, max = 1.04, mode = 'scale' } = opts;
  const loop = createRafLoop((dt, t) => {
    const k = easternEasing.breath(((t * 1000) % period) / period);
    const v = min + (max - min) * k;
    if (mode === 'opacity') el.style.opacity = v.toFixed(3);
    else el.style.transform = `scale(${v.toFixed(3)})`;
  });
  loop.start();
  return { start: () => loop.start(), pause: () => loop.pause(), destroy: () => loop.destroy() };
}
```

### 3.7 `stateMachine` —— 六态状态机

```js
/**
 * stateMachine —— 美学状态机：open/closed/hidden/shown/enter/exit。
 * @param {string} initial 初始状态
 * @param {Object} transitions key="from->to"，value=副作用函数
 * @returns {{state:string, transition:Function, can:Function, onChange:Function}}
 */
export function stateMachine(initial, transitions) {
  let state = initial;
  const listeners = [];
  return {
    get state() { return state; },
    can(to) { return Object.prototype.hasOwnProperty.call(transitions, `${state}->${to}`); },
    transition(to, payload) {
      const key = `${state}->${to}`;
      if (!Object.prototype.hasOwnProperty.call(transitions, key)) {
        throw new Error(`[stateMachine] 非法转换: ${key}`);
      }
      const from = state; state = to;
      const result = transitions[key](payload);
      listeners.forEach((fn) => fn(to, from, payload));
      return result;
    },
    onChange(fn) { listeners.push(fn); }
  };
}
```

---

## 4. 核心交互模板（完整可运行 HTML，4 个）

> 另存为 .html 双击即跑。均慢/缓/连、可逆、从遮挡浮现。

### 4.1 推门进入（可逆 toggle + Esc 退门）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>推门进入</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; font-family:serif;
    background: radial-gradient(circle at 50% 40%, #2b2620 0%, #14110d 100%); }
  .door-stage { position:relative; width:300px; height:420px; overflow:hidden; border-radius:6px; }
  .door { position:absolute; inset:0; background:linear-gradient(90deg,#6b5d4f,#57493b);
    transform-origin:left center;
    transition: transform 2200ms cubic-bezier(0.25,0.1,0.25,1);
    box-shadow: inset -14px 0 24px rgba(0,0,0,0.45); }
  .door-stage.is-open .door { transform: perspective(1200px) rotateY(-105deg); }
  .door-content { position:absolute; inset:0; display:grid; place-items:center; color:#e8dcc0;
    background: radial-gradient(circle at 60% 35%, rgba(232,196,122,0.25), rgba(20,17,13,0.9) 70%);
    opacity:0; transform:translateY(18px);
    transition: opacity 1800ms ease 500ms, transform 1800ms cubic-bezier(0.25,0.1,0.25,1) 500ms; }
  .door-stage.is-open .door-content { opacity:1; transform:translateY(0); }
  .door-handle { position:absolute; right:16px; top:50%; width:10px; height:44px; border:0; cursor:pointer;
    background:linear-gradient(180deg,#e8c98a,#b5894a); border-radius:4px; }
  .hint { color:rgba(232,220,192,0.5); text-align:center; letter-spacing:4px; }
</style>
</head>
<body>
  <div>
    <div class="door-stage js-stage">
      <div class="door"><button class="door-handle js-handle" aria-label="推门"></button></div>
      <div class="door-content"><h2>豁然</h2></div>
    </div>
    <p class="hint">推门 · 再推合上</p>
  </div>
<script>
  const stage = document.querySelector('.js-stage');
  const handle = document.querySelector('.js-handle');
  const onToggle = () => stage.classList.toggle('is-open');
  handle.addEventListener('click', onToggle);
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stage.classList.contains('is-open')) {
      stage.classList.remove('is-open'); handle.focus();
    }
  });
</script>
</body>
</html>
```

### 4.2 卷轴展开（clip-path 从遮挡露出，可逆）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>卷轴展开</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#1a1712; font-family:serif; }
  .scroll-wrap { position:relative; width:440px; height:130px; overflow:hidden; cursor:pointer; }
  .scroll-inner { width:100%; height:100%; background:linear-gradient(180deg,#f3ead6,#e6d8b8);
    clip-path: inset(0 100% 0 0);
    transition: clip-path 2600ms cubic-bezier(0.25,0.1,0.25,1);
    display:grid; place-items:center; color:#3a2f22; }
  .scroll-wrap.unrolled .scroll-inner { clip-path: inset(0 0 0 0); }
  .roller { position:absolute; top:0; bottom:0; width:14px;
    background:linear-gradient(180deg,#8a6a44,#5e452a); }
  .roller.left { left:0; } .roller.right { right:0; }
  .hint { color:rgba(232,220,192,0.5); text-align:center; }
</style>
</head>
<body>
  <div>
    <div class="scroll-wrap js-roll">
      <div class="roller left"></div><div class="roller right"></div>
      <div class="scroll-inner"><p>远山如黛，近水含烟。此卷徐徐展开……</p></div>
    </div>
    <p class="hint">点击卷轴 · 展开 / 收起</p>
  </div>
<script>
  document.querySelector('.js-roll').addEventListener('click', function () {
    this.classList.toggle('unrolled');
  });
</script>
</body>
</html>
```

### 4.3 灯笼摇曳（弹簧物理 + 精确光晕 RGBA + 销毁闭环）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>灯笼摇曳</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center;
    background: radial-gradient(circle at 50% 30%, #1c1611 0%, #0c0a08 100%); }
  .pole { width:2px; height:60px; background:#3a2f22; margin:0 auto; }
  .lantern { width:64px; height:84px; margin:0 auto; transform-origin:top center; will-change:transform;
    background: radial-gradient(circle at 50% 38%,
      rgba(255,205,120,0.98) 0%, rgba(228,140,55,0.95) 45%, rgba(150,72,28,0.95) 100%);
    border-radius:42% 42% 46% 46%;
    box-shadow: 0 0 60px 18px rgba(255,180,90,0.35); }
</style>
</head>
<body>
  <div><div class="pole"></div><div class="lantern js-lamp"></div></div>
<script>
  const lamp = document.querySelector('.js-lamp');
  let angle = 0, vel = 0;
  const stiffness = 0.0012, damping = 0.985;
  let rafId = null, running = true, last = 0;
  function frame(now) {
    if (!running) return;
    if (last === 0) last = now;
    const dt = Math.min((now - last) / 1000, 0.016); last = now;
    const gust = (Math.random() - 0.5) * 0.0009 * dt * 60;
    const acc = -stiffness * angle + gust;
    vel = (vel + acc) * damping;
    angle += vel;
    lamp.style.transform = 'rotate(' + angle.toFixed(3) + 'rad)';
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
  function cleanup() {
    running = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener('pagehide', cleanup);
  }
  window.addEventListener('pagehide', cleanup);
</script>
</body>
</html>
```

### 4.4 水墨晕染（smoke 缓动 + 精确 RGBA + 限流 + 用完即删）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>水墨晕染</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#0f0d0a; }
  .ink-stage { position:relative; width:640px; height:400px; background:#f5f1e6; overflow:hidden;
    cursor:crosshair; border-radius:4px; color:#8a7d63; display:grid; place-items:center; font-family:serif; }
  .ink-blob { position:absolute; width:140px; height:140px; border-radius:50%;
    background: radial-gradient(circle,
      rgba(25,28,32,0.55) 0%, rgba(25,28,32,0.22) 45%, rgba(25,28,32,0.08) 65%, transparent 72%);
    transform: translate(-50%,-50%) scale(0.1); opacity:0; pointer-events:none; will-change:transform,opacity; }
</style>
</head>
<body>
  <div class="ink-stage js-ink">运笔于此，墨自晕开……</div>
<script>
  const smoke = (t) => 1 - Math.pow(1 - t, 3);
  const stage = document.querySelector('.js-ink');
  let lastInk = 0;
  stage.addEventListener('mousemove', function (e) {
    const now = Date.now(); if (now - lastInk < 120) return; lastInk = now;
    const r = stage.getBoundingClientRect();
    const blob = document.createElement('div');
    blob.className = 'ink-blob';
    blob.style.left = (e.clientX - r.left) + 'px';
    blob.style.top  = (e.clientY - r.top) + 'px';
    stage.appendChild(blob);
    const start = performance.now(), dur = 2200;
    (function frame(ts) {
      const t = Math.min((ts - start) / dur, 1);
      const k = smoke(t);
      blob.style.transform = 'translate(-50%,-50%) scale(' + (0.1 + k * 2.6).toFixed(2) + ')';
      blob.style.opacity = (0.6 * (1 - k)).toFixed(3);
      if (t < 1) requestAnimationFrame(frame); else blob.remove();
    })(start);
  });
</script>
</body>
</html>
```

---

## 5. 事件委托与高频事件（课程落地）

> 一排花窗/竹简，容器上只监听一次，靠冒泡命中 `closest()`。返回 unbind 闭环。

```js
/**
 * bindDoorRow —— 事件委托绑定（批量可点元素）。
 * @param {HTMLElement} container 容器
 * @param {Function} onPick(door, index) 命中回调
 * @returns {Function} unbind  调用即解绑（闭环防泄漏）
 */
function bindDoorRow(container, onPick) {
  const onClick = (e) => {
    const door = e.target.closest('.js-door');     // 冒泡命中
    if (door) onPick(door, door.dataset.index);
  };
  const onOver  = (e) => { const d = e.target.closest('.js-door'); if (d) d.classList.add('is-ajar'); };
  const onOut   = (e) => { const d = e.target.closest('.js-door'); if (d) d.classList.remove('is-ajar'); };
  container.addEventListener('click', onClick);
  container.addEventListener('mouseover', onOver);
  container.addEventListener('mouseout', onOut);
  return function unbind() {
    container.removeEventListener('click', onClick);
    container.removeEventListener('mouseover', onOver);
    container.removeEventListener('mouseout', onOut);
  };
}
```

```js
// 视差滚动：scroll 高频事件必须节流（课程：scroll/mousemove 属高频）
function parallax(layers) {
  const onScroll = throttle(() => {
    const y = window.scrollY;
    layers.forEach(({ el, speed }) => {
      el.style.transform = `translate3d(0, ${(-y * speed).toFixed(1)}px, 0)`;
    });
  }, 16);
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);   // 闭环
}
// 三层：远 0.15 / 中 0.35 / 近 0.7
```

---

## 6. 内存泄漏与销毁闭环

| 资源 | 创建 | 销毁（必须配对） |
|---|---|---|
| rAF | `requestAnimationFrame` | `cancelAnimationFrame` |
| scroll/mousemove | `addEventListener` | 具名函数 + `removeEventListener` |
| IntersectionObserver | `new IntersectionObserver` | `observer.disconnect()` |
| transitionend | `addEventListener` | 回调内 `removeEventListener`（§3.4） |
| 临时 DOM（墨滴） | `appendChild` | 动画结束 `blob.remove()` |
| 定时器（防抖/节流内） | `setTimeout` | `clearTimeout` / `timer=null` |

```js
// 标准建-销范式
function mount() {
  const loops = [];
  const b = breathLoop(glowEl); loops.push(b);
  const rm = parallax([{ el: far, speed: 0.15 }, { el: near, speed: 0.7 }]);
  const io = scrollReveal('.reveal');
  return function dispose() {            // 组件卸载调用
    loops.forEach((l) => l.destroy());
    rm();
    io.disconnect();
  };
}
```

---

## 7. 性能与无障碍

- **只动 transform/opacity**（GPU 合成层），`will-change` 仅给在动元素；
- scroll/mousemove 必须 `throttle`，scroll 监听 `{ passive: true }`；
- `prefers-reduced-motion: reduce` 下 transition 缩到 0.01ms、直接终态，不开呼吸循环；
- 可点元素用 `<button>`（原生 Enter/Space），`:focus-visible` 与 `:hover` 同权；
- 推门后焦点移到主内容，`Esc` 退门并归还焦点。

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

---

## 8. 与课程能力的对照

| 课程知识点（200集） | 本模块落点 |
|---|---|
| 手写防抖 debounce（闭包+setTimeout+return） | §3.2 |
| 手写节流 throttle（timer=null 坑） | §3.2 / §5 视差 |
| 事件流/委托/冒泡/解绑 | §5 bindDoorRow |
| classList（不改 className） | §3.5 / 各模板 |
| setTimeout/setInterval 事件循环 | §3.4 stagger / 时间感 |
| createElement/appendChild/remove | §4.4 墨滴 |
| 箭头函数/解构/剩余参数 | 全模块 |
| this / call/apply/bind | debounce/throttle 内 `fn.apply(this,args)` |
| rAF / IntersectionObserver | §3.3 / §3.5（Web API 补全） |

---

## 附：速查

| 东方感觉 | 直接用 |
|---|---|
| 云在动 | `breathLoop(el, {period:9000, mode:'opacity'})` |
| 滚到才浮现 | `scrollReveal('.reveal')` |
| 竹简依次展开 | `staggerAnimation([...els], {interval:220})` |
| 点门开/关 | `stateMachine('closed', {'closed->open':…,'open->closed':…})` |
| mousemove 高频限流 | `throttle(fn, 16)` |
| 输入防抖 | `debounce(fn, 500)` |
| 三层纵深 | `parallax([{speed:.15},{speed:.35},{speed:.7}])` |
