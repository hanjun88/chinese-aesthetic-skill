<!--
  ============================================================
  DRAFT — v0.1 SKELETON
  文件：framework-components.md
  状态：骨架已搭，需求清单已列，POC 已验证，等待完整课程内容精填
  日期：2026-09-26
  ============================================================

  本文件当前状态说明：
  - 已有：设计系统基底、7个能力维度的详细需求清单、模块骨架、
          1个POC组件（MoonGate，基于90集内容，标注待替换）、
          5个组件的Props接口定义、美学状态管理函数签名、能力卡引用框架
  - 待填充（Phase 2）：完整课程内容到位后（Vue 168集 + React 154集全量），
          逐组件精填实现、逐维度补全代码映射、组合示例精修
  ============================================================
-->

# 框架实现层模块 — 东方美学组件化（DRAFT v0.1）

> 本模块将 Vue / React 框架能力映射为可复用的东方空间元素组件。
> 当前为骨架版本，等完整课程内容（Vue 168集 + React 154集）到位后精填。

---

## 0. 设计系统基底（已完成，不依赖课程内容）

### 0.1 色彩系统（精确 HEX / HSL）

```css
:root {
  /* 木色系（构件本体） */
  --ae-wood-deep:    #3E2723;  /* HSL(18, 40%, 20%) 深褐木 — 匾额底、轴头 */
  --ae-wood-mid:     #5C4A3A;  /* HSL(28, 23%, 30%) 中褐木 — 门框、屏框 */
  --ae-wood-light:   #8D6E63;  /* HSL(18, 16%, 47%) 浅褐木 — 连接线 */

  /* 纸色系（内容面） */
  --ae-paper-warm:   #F5F0E1;  /* HSL(46, 48%, 92%) 宣纸暖白 — 扇面、卷心 */
  --ae-paper-cool:   #E8E4D9;  /* HSL(46, 22%, 88%) 粉墙 — 背景底 */

  /* 墨色系（文字/线条） */
  --ae-ink-deep:     #1A1A1A;  /* HSL(0, 0%, 10%) 浓墨 */
  --ae-ink-mid:      #3E2723;  /* HSL(18, 40%, 20%) 褐墨 */

  /* 点缀色 */
  --ae-seal-red:     #B22222;  /* HSL(0, 68%, 42%) 印章朱 */
  --ae-gold:         #B8860B;  /* HSL(43, 84%, 38%) 暗金 — 轴头旋钮 */
  --ae-jade:         #2E5A2E;  /* HSL(120, 32%, 27%) 松石绿 — 窗外景 */

  /* 动势令牌 */
  --ease-ceremonial: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-retreat:    cubic-bezier(0.4, 0, 1, 1);
}
```

### 0.2 动势令牌

| 令牌 | 值 | 用途 |
|---|---|---|
| `duration-fast` | 300ms | hover 微启 |
| `duration-normal` | 600ms | 路由切换 |
| `duration-slow` | 1000ms | 推门、展卷 |
| `duration-ritual` | 1400ms | 完整进入仪式 |

---

## 1. 框架能力 → 美学实现需求清单（核心骨架）

> 以下逐维度列出：**需要什么框架 API / 组件模式 / 状态方案**，以及当前90集已有什么、完整课程还需要补什么。
> 等完整课程到位后，每个维度下方填充可运行的映射代码。

### 1.1 组件化 → 可复用美学构件（门/窗/屏风/卷轴/匾额）

**需要的框架能力清单**：

| 能力点 | Vue 3 需要的 API | React 需要的 API | 90集现状 | 完整课程待补 |
|---|---|---|---|---|
| Props 声明 | `defineProps()` + TS 接口 | 函数参数解构 + JSDoc/TS | ✅ 已有（instance-binding/props-passing） | Vue3 `<script setup>` + `defineProps` 泛型写法 |
| 外部内容注入 | 插槽 `<slot>` / 具名插槽 `v-slot` | `children` / render props | ⚠️ Vue90集仅口播概念 | Vue 完整插槽（默认/具名/作用域插槽）；React children 组合模式 |
| 组件通信 | `defineEmits()` / `defineExpose()` | props 回调 / Context | ⚠️ 90集未深入 | Vue emit 自定义事件 + v-model 修饰符；React Context API + 跨层通信 |
| 可复用结构 | SFC（template+script+style） | 函数组件 + CSS module | ✅ 已有 | Vue `defineOptions` / `defineSlots`；React `forwardRef` / `useImperativeHandle` |
| 样式封装 | `<style scoped>` | CSS-in-JS / CSS module | ✅ 已有 | Vue CSS 变量穿透 `:deep()`；React CSS module / styled-components（如课程覆盖） |

**美学映射意图**：每个东方构件（门/窗/屏/卷/匾）是一个独立组件，Props 配置形态，Slots 注入内容。组件间可嵌套（MoonGate 内嵌 FoldingScreen）。

`<!-- TODO: Phase 2 填充——组件化映射代码示例（Vue SFC 结构 + React 函数组件结构，完整可运行） -->`

---

### 1.2 状态管理 → 美学六态（开/合/藏/露/进/退）

**需要的框架能力清单**：

| 能力点 | Vue 3 需要的 API | React 需要的 API | 90集现状 | 完整课程待补 |
|---|---|---|---|---|
| 响应式状态 | `ref()` / `reactive()` / `computed()` | `useState()` / `useMemo()` | ✅ 已有（instance-binding/state-setstate） | Vue3 Composition API 全套；React Hooks 全套 |
| 状态机 | `watch()` + transition 校验 | `useReducer()` + action 类型 | ⚠️ 仅有基础 watch | Vue watch immediate/deep/watchEffect；React useReducer 完整模式 |
| 派生视觉 | `computed()` 派生 transform | `useMemo()` 派生样式对象 | ✅ 已有（computed-watch） | Vue computed get/set；React useMemo + useCallback 优化 |
| 副作用编排 | `watch()` 回调中 setTimeout | `useEffect()` cleanup | ✅ 已有（computed-watch） | Vue watch 停止/清理；React useEffect 清理函数完整模式 |
| 跨组件状态 | `provide/inject` 或 Pinia | `useContext` 或 Redux | ❌ 90集未覆盖 | Vue provide/inject + Pinia（如168集覆盖）；React Context + useReducer 全局状态 |

**美学映射意图**：组件内部状态不是 `isOpen` 布尔，而是六态状态机。状态转换有合法路径，转换后自动编排动画落地。

`<!-- TODO: Phase 2 填充——useAestheticState 完整实现（Vue composable + React hook），含状态转换矩阵、动画编排、跨组件共享示例 -->`

---

### 1.3 路由 → 空间递进（入口→前厅→内室→后院）

**需要的框架能力清单**：

| 能力点 | Vue Router 需要的 API | React Router 需要的 API | 90集现状 | 完整课程待补 |
|---|---|---|---|---|
| 路由配置 | `createRouter` + `createWebHistory` | `BrowserRouter` + `Routes/Route` | ❌ 90集未覆盖 | Vue Router 完整配置；React Router v6 完整配置 |
| 嵌套路由 | `children` 路由 + `<router-view>` | 嵌套 `<Route>` + 父布局 | ❌ | Vue 嵌套路由 + 命名视图；React 嵌套路由 + Outlet |
| 路由过渡 | `<router-view v-slot>` + `<Transition>` | `useLocation` + `TransitionGroup`/`CSSTransition` | ❌ | Vue `<Transition>` 路由动画；React 路由级动画 |
| 滚动恢复 | `scrollBehavior()` | 手动 scroll 记忆 | ❌ | Vue scrollBehavior savedPosition；React scroll restoration |
| 导航 | `<router-link>` / `useRouter()` | `<Link>` / `useNavigate()` | ❌ | Vue 编程式导航；React useNavigate |
| 路由守卫 | `beforeEach` / 组件内守卫 | 无直接对应（用 useEffect） | ❌ | Vue 路由守卫体系 |

**美学映射意图**：东方空间是层层深入的——入口（照壁）→ 前厅（过渡）→ 内室（核心）→ 后院（余韵）。路由配置映射这个进深序列，路由切换动画模拟穿过门廊的空间过渡。

`<!-- TODO: Phase 2 填充——Vue Router 完整配置 + React Router v6 完整配置 + 路由过渡动画 CSS + 滚动恢复实现 -->`

---

### 1.4 生命周期 → 进入/离开仪式

**需要的框架能力清单**：

| 能力点 | Vue 3 需要的 API | React 需要的 API | 90集现状 | 完整课程待补 |
|---|---|---|---|---|
| 挂载后进入 | `onMounted()` | `useEffect(() => {...}, [])` | ❌ 90集未讲生命周期 | Vue3 onMounted/onBeforeMount；React useEffect mount 模式 |
| 卸载清理 | `onUnmounted()` | `useEffect` return cleanup | ❌ | Vue onUnmounted/onBeforeUnmount；React useEffect 清理函数 |
| 进入/离开动画 | `<Transition>` 组件 | 条件渲染 + useEffect 状态 | ❌ | Vue `<Transition>` enter/leave classes；React CSSTransition / 条件动画 |
| 保持存活 | `<keep-alive>` | 无直接对应 | ❌ | Vue keep-alive 缓存组件状态（空间记忆） |

**美学映射意图**：组件 mount 时播放进入动画（从 hidden→revealed，模拟推门），unmount 时播放离开动画（反向退入）。不允许瞬间出现/消失。

`<!-- TODO: Phase 2 填充——Vue onMounted+Transition 完整示例 + React useEffect cleanup 完整示例 -->`

---

### 1.5 计算属性/侦听器 → 美学响应

**需要的框架能力清单**：

| 能力点 | Vue 3 需要的 API | React 需要的 API | 90集现状 | 完整课程待补 |
|---|---|---|---|---|
| 派生值缓存 | `computed()` | `useMemo()` | ✅ 已有（computed-watch） | Vue computed 完整 get/set；React useMemo 依赖数组 |
| 副作用监听 | `watch()` / `watchEffect()` | `useEffect()` | ✅ 已有基础 | Vue watch immediate/deep/watchEffect；React useEffect 依赖优化 |
| 回调稳定 | `watch` 回调即稳定 | `useCallback()` | ❌ React90集未讲 Hooks | Vue watch 自动稳定；React useCallback 防子组件重渲染 |

**美学映射意图**：状态变化 → computed/useMemo 派生视觉 transform → CSS transition 自动补间。watch/useEffect 监听动画结束后落地状态。

`<!-- TODO: Phase 2 填充——computed→visualTransform 完整映射代码 + watch→动画编排完整代码 -->`

---

### 1.6 列表渲染 → 重复元素排列（竹简/栏杆/瓦片）

**需要的框架能力清单**：

| 能力点 | Vue 需要的写法 | React 需要的写法 | 90集现状 | 完整课程待补 |
|---|---|---|---|---|
| 基础列表 | `v-for="(item,i) in list" :key="item.id"` | `list.map(item => <li key={item.id}>)` | ✅ 已有（vfor-key-diff） | Vue `<TransitionGroup>` 列表过渡；React key 优化 |
| key 策略 | 静态排列用 index，动态排序用业务 id | 同左 | ✅ 已有（vfor-key-diff） | React key 与 reconciler 机制深入 |
| 列表动画 | `<TransitionGroup>` | `TransitionGroup` from react-transition-group | ❌ | Vue 列表增删动画；React 列表动画库 |

**美学映射意图**：东方建筑有大量重复构件——栏杆望柱、瓦当、竹简。静态排列可用 index 做 key；可交互排序的列表（如展开的竹简）必须用业务 id。

`<!-- TODO: Phase 2 填充——栏杆望柱列表渲染 + 竹简列表（含排序动画）完整示例 -->`

---

### 1.7 事件处理 → 交互仪式

**需要的框架能力清单**：

| 能力点 | Vue 需要的 API | React 需要的 API | 90集现状 | 完整课程待补 |
|---|---|---|---|---|
| 基础事件 | `@click` / `@mouseenter` | `onClick` / `onMouseEnter` | ✅ 已有（event-modifiers） | 完整事件体系 |
| 修饰符 | `.stop` / `.prevent` / `.once` / `.self` | 手动 `e.stopPropagation()` / `e.preventDefault()` | ✅ 已有（event-modifiers） | Vue 按键修饰符 `.enter`；React 合成事件池 |
| 自定义事件 | `defineEmits()` 子→父 | props 回调函数 | ⚠️ Vue90集未深入 emit | Vue emit 完整 + v-model；React props 回调通信 |
| 事件传参 | `@click="fn(arg, $event)"` | `onClick={(e) => fn(arg, e)}` | ✅ 已有（event-modifiers） | — |

**美学映射意图**：hover→门微启（小位移），click→推门进入（完整位移+状态转换），返回→退出门（反向动画）。嵌套交互用 `.stop` 防止冒泡。

`<!-- TODO: Phase 2 填充——推门事件 + 悬停揭示 + 嵌套阻止冒泡 完整示例 -->`

---

## 2. 东方美学组件库

### 2.0 组件清单与接口定义（已完成接口，实现待 Phase 2）

#### 2.0.1 MoonGate（月洞门）— 【POC 已完成，标注待精填】

**Props 接口**：
```typescript
interface MoonGateProps {
  state?: 'closed' | 'open'        // 默认 'closed'
  diameter?: number                 // 默认 300 (px)
  frameColor?: string               // 默认 '#5C4A3A' 中褐木
  leafColor?: string                // 默认 '#F5F0E1' 宣纸白
  interiorColor?: string            // 默认 '#2C3E2D' 门内深绿
  clickable?: boolean               // 默认 true
  duration?: number                 // 默认 1000 (ms)
  easing?: string                   // 默认 'cubic-bezier(0.22, 1, 0.36, 1)'
}
interface MoonGateEmits {
  'state-change': (state: 'closed' | 'open') => void
}
// Slots: default — 门后内容
```

**POC 实现（基于90集内容，Phase 2 将用完整课程优化）**：

<details>
<summary>展开 POC: MoonGate.vue (Vue 3 SFC)</summary>

```vue
<!-- MoonGate.vue — POC 版本，基于90集能力卡 -->
<template>
  <div
    class="moongate"
    :class="{ 'moongate--open': state === 'open' }"
    :style="{ width: diameter + 'px', height: diameter + 'px' }"
    @click="handleClick"
  >
    <div class="moongate__frame" :style="{ borderColor: frameColor }">
      <div class="moongate__leaf moongate__leaf--left" :style="{ background: leafColor, transitionDuration: duration + 'ms' }" />
      <div class="moongate__leaf moongate__leaf--right" :style="{ background: leafColor, transitionDuration: duration + 'ms' }" />
    </div>
    <div class="moongate__content" :style="{ background: interiorColor }">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  state:       { type: String,  default: 'closed' },
  diameter:    { type: Number,  default: 300 },
  frameColor:  { type: String,  default: '#5C4A3A' },
  leafColor:   { type: String,  default: '#F5F0E1' },
  interiorColor: { type: String, default: '#2C3E2D' },
  clickable:   { type: Boolean, default: true },
  duration:    { type: Number,  default: 1000 },
})
const emit = defineEmits(['state-change'])
function handleClick() {
  if (!props.clickable) return
  emit('state-change', props.state === 'closed' ? 'open' : 'closed')
}
</script>

<style scoped>
.moongate { position: relative; border-radius: 50%; cursor: pointer; overflow: hidden; animation: mg-enter 1.2s ease-out; }
.moongate__frame { position: absolute; inset: 0; border-radius: 50%; border: 8px solid; z-index: 3; box-shadow: 0 0 30px rgba(0,0,0,0.15); }
.moongate__leaf { position: absolute; top: 0; width: 50%; height: 100%; transition: transform 1s cubic-bezier(0.22,1,0.36,1); z-index: 2; }
.moongate__leaf--left  { left: 0;  border-radius: 50% 0 0 50%; transform-origin: right center; }
.moongate__leaf--right { right: 0; border-radius: 0 50% 50% 0; transform-origin: left center; }
.moongate--open .moongate__leaf--left  { transform: perspective(600px) rotateY(-100deg); }
.moongate--open .moongate__leaf--right { transform: perspective(600px) rotateY(100deg); }
.moongate__content { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; color: #F5F0E8; padding: 20%; text-align: center; }
@keyframes mg-enter { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>
```
</details>

<details>
<summary>展开 POC: MoonGate.jsx (React 函数组件)</summary>

```jsx
// MoonGate.jsx — POC 版本
import React, { useMemo } from 'react'

export default function MoonGate({
  state = 'closed', diameter = 300,
  frameColor = '#5C4A3A', leafColor = '#F5F0E1', interiorColor = '#2C3E2D',
  clickable = true, duration = 1000, onStateChange, children,
}) {
  const isOpen = state === 'open'
  const leafStyle = useMemo(() => ({
    background: leafColor, transitionDuration: `${duration}ms`,
  }), [leafColor, duration])
  return (
    <div className={`moongate${isOpen ? ' moongate--open' : ''}`}
      style={{ width: diameter, height: diameter }}
      onClick={() => clickable && onStateChange?.(isOpen ? 'closed' : 'open')}>
      <div className="moongate__frame" style={{ borderColor: frameColor }}>
        <div className="moongate__leaf moongate__leaf--left" style={leafStyle} />
        <div className="moongate__leaf moongate__leaf--right" style={leafStyle} />
      </div>
      <div className="moongate__content" style={{ background: interiorColor }}>{children}</div>
    </div>
  )
}
```
</details>

`<!-- TODO: Phase 2 精填——用完整 Vue Router/Transition/生命周期内容优化 MoonGate：加入 onMounted 进入仪式动画、<Transition> 离开动画、provide/inject 与父级空间状态联动 -->`

---

#### 2.0.2 ScrollPanel（卷轴）

**Props 接口**：
```typescript
interface ScrollPanelProps {
  expanded?: boolean            // 默认 false
  orientation?: 'horizontal' | 'vertical'  // 默认 'horizontal'
  label?: string                // 默认 ''
  duration?: number             // 默认 1200 (ms)
  easing?: string               // 默认 'cubic-bezier(0.22,1,0.36,1)'
  rodColor?: string             // 默认 '#3E2723' 深褐木轴
  knobColor?: string            // 默认 '#B8860B' 暗金轴头
  paperColor?: string           // 默认 '#F5F0E1' 宣纸色
}
// Slots: default — 卷轴内容
```

`<!-- TODO: Phase 2 填充——ScrollPanel 完整 Vue SFC + React 组件实现 -->`

---

#### 2.0.3 FoldingScreen（屏风）

**Props 接口**：
```typescript
interface FoldingScreenProps {
  panels?: number               // 默认 4
  angle?: number                // 默认 30 (度)
  patterns?: string[]           // 每扇屏面 CSS 背景
  interactive?: boolean         // 默认 false
  panelWidth?: number           // 默认 100 (px)
  panelHeight?: number          // 默认 200 (px)
  duration?: number             // 默认 800 (ms)
  easing?: string               // 默认 'cubic-bezier(0.22,1,0.36,1)'
  frameColor?: string           // 默认 '#5C4A3A'
}
interface FoldingScreenEmits {
  'panel-click': (index: number) => void
}
```

`<!-- TODO: Phase 2 填充——FoldingScreen 完整实现，v-for/map 列表渲染 + key 策略 + @click.stop 阻止冒泡 -->`

---

#### 2.0.4 LatticeWindow（花窗）

**Props 接口**：
```typescript
interface LatticeWindowProps {
  pattern?: 'ice-crack' | 'step-brocade' | 'lantern'  // 默认 'ice-crack'
  width?: number                // 默认 240
  height?: number               // 默认 320
  view?: string                 // CSS 背景，窗外景色
  parallax?: number             // 0-1，默认 0.5
  frameColor?: string           // 默认 '#5C4A3A'
  lineColor?: string            // 窗格线色，默认 '#5C4A3A'
}
```

`<!-- TODO: Phase 2 填充——LatticeWindow 完整实现，鼠标视差（mousemove + transform）+ 三种窗格纹样 SVG -->`

---

#### 2.0.5 Plaque（匾额）

**Props 接口**：
```typescript
interface PlaqueProps {
  text: string                  // 必填，匾额文字
  seal?: string                 // 默认 ''，印章落款
  bgColor?: string              // 默认 '#3E2723'
  textColor?: string            // 默认 '#F5E6C8'
  sealColor?: string            // 默认 '#B22222'
  visible?: boolean             // 默认 true
  duration?: number             // 默认 1000 (ms)
  easing?: string               // 默认 'cubic-bezier(0.22,1,0.36,1)'
  fontSize?: number             // 默认 32 (px)
}
```

`<!-- TODO: Phase 2 填充——Plaque 完整实现，挂载进入动画（translateY 落下）+ 印章延迟落下 + <Transition>/useEffect 离开动画 -->`

---

## 3. 美学状态管理模式

### 3.1 AestheticState 接口（已完成）

```typescript
type AestheticState = 'closed' | 'open' | 'hidden' | 'revealed' | 'enter' | 'retreat'

const STATE_TRANSITIONS: Record<AestheticState, AestheticState[]> = {
  closed:   ['open', 'enter'],
  open:     ['closed', 'enter'],
  hidden:   ['revealed', 'enter'],
  revealed: ['hidden', 'retreat'],
  enter:    ['revealed', 'open', 'closed'],
  retreat:  ['hidden', 'closed'],
}
```

### 3.2 Vue Composable 函数签名

```typescript
// composables/useAestheticState.ts
export function useAestheticState(initial?: AestheticState, duration?: number): {
  state: Ref<AestheticState>
  previousState: Ref<AestheticState | null>
  isTransitioning: ComputedRef<boolean>
  visualTransform: ComputedRef<string>
  open: () => void
  close: () => void
  reveal: () => void
  conceal: () => void
  enter: () => void
  retreat: () => void
  transitionTo: (next: AestheticState) => void
}
```

`<!-- TODO: Phase 2 填充——useAestheticState 完整实现（ref + computed + watch 编排动画落地） -->`

### 3.3 React Hook 函数签名

```jsx
// hooks/useAestheticState.js
export function useAestheticState(initial, duration): {
  state, previousState, isTransitioning, visualTransform,
  open, close, reveal, conceal, enter, retreat, transitionTo
}
```

`<!-- TODO: Phase 2 填充——useAestheticState 完整实现（useState + useMemo + useEffect 清理函数） -->`

---

## 4. 路由与空间递进

### 4.1 路由配置模板

`<!-- TODO: Phase 2 填充——Vue Router createRouter 完整配置（嵌套路由 + meta.depth + scrollBehavior） + React Router v6 完整配置（Routes + useLocation + TransitionGroup） -->`

### 4.2 路由过渡动画

`<!-- TODO: Phase 2 填充——前进/后退方向感知动画（slide-left vs slide-right）+ CSS transition 配置 -->`

### 4.3 滚动位置恢复与空间记忆

`<!-- TODO: Phase 2 填充——Vue scrollBehavior savedPosition + React useLocation 滚动记忆 -->`

---

## 5. 完整组合示例（「山水中轴」首页）

`<!-- TODO: Phase 2 填充——用 MoonGate + FoldingScreen + LatticeWindow + ScrollPanel + Plaque 组合出完整页面，展示榫卯式嵌套、状态联动（门开→屏展→卷展的级联） -->`

---

## 6. 能力卡引用框架

### 6.1 React 能力卡（6 张）

| # | 能力卡 | 路径 | 调用场景（待 Phase 2 精填） |
|---|---|---|---|
| 1 | react-zhangtianyu-router | `react-zhangtianyu/dist/react-zhangtianyu-router/` | 整体组件架构原则：state/props/事件/ref 划分 |
| 2 | react-jsx-rules | `react-zhangtianyu/dist/react-jsx-rules/` | 所有 React 组件 JSX 书写规范 |
| 3 | react-event-this-binding | `react-zhangtianyu/dist/react-event-this-binding/` | 事件绑定：函数引用不加括号、合成事件 |
| 4 | react-state-setstate | `react-zhangtianyu/dist/react-state-setstate/` | 状态管理红线：必须走 setter |
| 5 | react-props-passing | `react-zhangtianyu/dist/react-props-passing/` | Props 只读、外部传参 |
| 6 | react-refs-dom-access | `react-zhangtianyu/dist/react-refs-dom-access/` | 真实 DOM 获取（视差/动画触发场景） |

### 6.2 Vue 能力卡（5 张）

| # | 能力卡 | 路径 | 调用场景（待 Phase 2 精填） |
|---|---|---|---|
| 7 | vue-zhangtianyu-router | `vue-zhangtianyu/dist/vue-zhangtianyu-router/` | 整体响应式闭环原则 |
| 8 | instance-binding | `vue-zhangtianyu/dist/instance-binding/` | v-bind 单向绑定、ref/reactive |
| 9 | event-modifiers | `vue-zhangtianyu/dist/event-modifiers/` | @click.stop/.prevent/.once 事件修饰符 |
| 10 | computed-watch | `vue-zhangtianyu/dist/computed-watch/` | computed 派生值 + watch 副作用 |
| 11 | vfor-key-diff | `vue-zhangtianyu/dist/vfor-key-diff/` | v-for key 策略（静态用 index，动态用 id） |

`<!-- TODO: Phase 2——完整课程到位后，补充新增能力卡引用（Vue Router/Pinia/React Router/Hooks 全套等） -->`

---

## 附录：Phase 2 填充清单（检查单）

- [ ] 1.1 组件化映射代码（Vue SFC 完整结构 + React 函数组件完整结构）
- [ ] 1.2 useAestheticState 完整实现（Vue composable + React hook）
- [ ] 1.3 Vue Router + React Router 完整路由配置 + 过渡动画
- [ ] 1.4 生命周期进入/离开仪式完整实现
- [ ] 1.5 computed/watch → 美学响应完整映射
- [ ] 1.6 列表渲染（栏杆/竹简）完整示例
- [ ] 1.7 事件处理（推门/悬停揭示）完整示例
- [ ] 2.0.2 ScrollPanel 完整双版本实现
- [ ] 2.0.3 FoldingScreen 完整双版本实现
- [ ] 2.0.4 LatticeWindow 完整双版本实现
- [ ] 2.0.5 Plaque 完整双版本实现
- [ ] 3. useAestheticState 完整实现
- [ ] 4. 路由空间递进完整配置
- [ ] 5. 「山水中轴」组合示例完整页面
- [ ] 6. 能力卡引用补充（完整课程新增能力）
