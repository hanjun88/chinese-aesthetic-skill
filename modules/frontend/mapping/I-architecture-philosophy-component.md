<!--
  ============================================================
  FINAL v1.0 — 子代理I 产出
  维度：建筑精神（09-architecture）+ 哲学（01-philosophy）
  → 组件架构与空间组织
  ============================================================
  基于完整课程内容：Vue 168集 + React 154集
  ============================================================
-->

# 建筑精神 × 哲学 → 组件架构映射（FINAL v1.0）

> **核心命题**：东方建筑不是"房子的样式"，是用空间结构表达宇宙观。
> 前端组件架构也一样——组件不是"UI 片段"，是**空间关系的声明式描述**。

---

## 1. 哲学概念 → 组件模式映射

### 1.1 界（Boundary）→ 组件边界与空间作用域

**哲学定义**：东方空间的第一动作是划界——一堵墙、一道门、一架屏风都是界。界不是阻挡，是转换：跨过界，状态改变。

**Vue 实现（provide/inject 跨层通信）**：

```vue
<!-- Boundary.vue — 界组件（祖先） -->
<script setup>
import { provide, ref } from 'vue'
const inSpace = ref(false)
provide('spaceState', {
  inSpace,
  enter: () => inSpace.value = true,
  exit: () => inSpace.value = false
})
</script>
<template>
  <div class="boundary"><slot /></div>
</template>
```

```vue
<!-- InnerRoom.vue — 后代组件 inject -->
<script setup>
import { inject } from 'vue'
const space = inject('spaceState')
</script>
<template>
  <button @click="space.enter">{{ space.inSpace.value ? '已在界内' : '推门' }}</button>
</template>
```

**React 实现（Context.Provider）**：

```jsx
// Boundary.jsx
import { createContext, useContext, useState } from 'react'
const SpaceContext = createContext()

export function Boundary({ children }) {
  const [inSpace, setInSpace] = useState(false)
  return (
    <SpaceContext.Provider value={{ inSpace, enter: () => setInSpace(true), exit: () => setInSpace(false) }}>
      <div className="boundary">{children}</div>
    </SpaceContext.Provider>
  )
}
// 后代消费
function InnerRoom() {
  const { inSpace, enter } = useContext(SpaceContext)
  return <button onClick={enter}>{inSpace ? '已在界内' : '推门'}</button>
}
```

---

### 1.2 庇护（Shelter）→ 包裹式布局组件

`<Hall>` 组件通过 `orientation` prop 决定开口方向，其余方向用 Slots 注入墙体内容。

```typescript
interface HallProps {
  orientation?: 'north' | 'south' | 'east' | 'west'  // 主朝向
}
// Slots: #roof（屋顶庇护）, #left/#right/#back（围护面）, default（朝向开口）
```

---

### 1.3 进入（Entry）→ 路由 + 生命周期仪式

Vue Transition 完整模式（课程第90-95集）：

```vue
<Transition name="ritual" appear>
  <div v-if="visible" class="ritual-box">内容</div>
</Transition>
<style>
.ritual-enter-from { opacity: 0; transform: translateY(20px); }
.ritual-enter-active { transition: all 1s cubic-bezier(0.22,1,0.36,1); }
.ritual-leave-to { opacity: 0; transform: translateY(-10px); }
.ritual-leave-active { transition: all 0.6s ease-in; }
</style>
```

React useEffect 完整模式（Hooks 章节）：

```jsx
function RitualBox({ visible }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (!visible) return
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [visible])
  if (!visible) return null
  return <div className={mounted ? 'ritual-box in' : 'ritual-box'} />
}
```

---

### 1.4 递进（Progression）→ 嵌套路由层级

路由树深度 = 建筑进深层次。核心空间被≥2层过渡包裹。

### 1.5 朝向（Orientation）→ 布局方向 prop

`orientation` prop 驱动 computed/useMemo 派生开口位置 CSS。

---

## 2. 建筑结构 → 组件嵌套

### 2.1 三段式 → Building 组件嵌套

```typescript
interface BuildingProps {
  roofType?: 'hip' | 'gable' | 'hipped-gable' | 'flush' | 'hard'
  eaveLift?: number          // 飞檐上翘角（度）
  bays?: number              // 面阔开间数
  depth?: number             // 进深刻数
  platformHeight?: number    // 台基高度
  stepCount?: number         // 台阶数（≥3）
  orientation?: 'north'|'south'|'east'|'west'
}
```

嵌套结构：`<Building>` → `<Roof>`（天，40-50%高）+ `<Body>`（人，30-40%）+ `<Platform>`（地，15-25%）

### 2.2 榫卯 → 组件通信

榫卯 = Props下行 + Events上行，禁止直接修改对方内部状态。

---

## 3. 美学状态管理（完整实现）

### 3.1 接口定义

```typescript
type AestheticState = 'closed' | 'open' | 'hidden' | 'revealed' | 'enter' | 'retreat'

const STATE_TRANSITIONS = {
  closed:   ['open', 'enter'],
  open:     ['closed', 'enter'],
  hidden:   ['revealed', 'enter'],
  revealed: ['hidden', 'retreat'],
  enter:    ['revealed', 'open', 'closed'],
  retreat:  ['hidden', 'closed'],
}
```

### 3.2 Vue Composable 完整实现

```typescript
// composables/useAestheticState.ts
import { ref, computed, watch, onUnmounted } from 'vue'

export function useAestheticState(initial = 'hidden', duration = 800) {
  const state = ref(initial)
  const previousState = ref(null)
  let timer = null

  function transitionTo(next) {
    if (!STATE_TRANSITIONS[state.value]?.includes(next)) return
    previousState.value = state.value
    state.value = next
  }

  const open = () => transitionTo('open')
  const close = () => transitionTo('closed')
  const reveal = () => transitionTo('revealed')
  const conceal = () => transitionTo('hidden')
  const enter = () => transitionTo('enter')
  const retreat = () => transitionTo('retreat')

  const isTransitioning = computed(() => state.value === 'enter' || state.value === 'retreat')

  const visualTransform = computed(() => ({
    closed:   'translateX(-100%)',
    open:     'translateX(0)',
    hidden:   'opacity(0) blur(8px)',
    revealed: 'opacity(1) blur(0)',
    enter:    'translateX(-30%)',
    retreat:  'translateX(30%)',
  }[state.value]))

  watch(state, (val) => {
    if (val === 'enter') timer = setTimeout(() => transitionTo('revealed'), duration)
    if (val === 'retreat') timer = setTimeout(() => transitionTo('hidden'), duration)
  })

  onUnmounted(() => { if (timer) clearTimeout(timer) })

  return { state, previousState, isTransitioning, visualTransform, open, close, reveal, conceal, enter, retreat, transitionTo }
}
```

### 3.3 React Hook 完整实现

```jsx
// hooks/useAestheticState.js
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'

const STATE_TRANSITIONS = {
  closed: ['open','enter'], open: ['closed','enter'],
  hidden: ['revealed','enter'], revealed: ['hidden','retreat'],
  enter: ['revealed','open','closed'], retreat: ['hidden','closed'],
}

export function useAestheticState(initial = 'hidden', duration = 800) {
  const [state, setState] = useState(initial)
  const [previousState, setPreviousState] = useState(null)
  const timer = useRef(null)

  const transitionTo = useCallback((next) => {
    setState(prev => {
      if (!STATE_TRANSITIONS[prev]?.includes(next)) return prev
      setPreviousState(prev)
      return next
    })
  }, [])

  const open = useCallback(() => transitionTo('open'), [transitionTo])
  const close = useCallback(() => transitionTo('closed'), [transitionTo])
  const reveal = useCallback(() => transitionTo('revealed'), [transitionTo])
  const conceal = useCallback(() => transitionTo('hidden'), [transitionTo])
  const enter = useCallback(() => transitionTo('enter'), [transitionTo])
  const retreat = useCallback(() => transitionTo('retreat'), [transitionTo])

  const isTransitioning = useMemo(() => state === 'enter' || state === 'retreat', [state])

  const visualTransform = useMemo(() => ({
    closed: 'translateX(-100%)', open: 'translateX(0)',
    hidden: 'opacity(0) blur(8px)', revealed: 'opacity(1) blur(0)',
    enter: 'translateX(-30%)', retreat: 'translateX(30%)',
  }[state]), [state])

  useEffect(() => {
    if (state === 'enter') timer.current = setTimeout(() => transitionTo('revealed'), duration)
    if (state === 'retreat') timer.current = setTimeout(() => transitionTo('hidden'), duration)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [state, duration, transitionTo])

  return { state, previousState, isTransitioning, visualTransform, open, close, reveal, conceal, enter, retreat, transitionTo }
}
```

---

## 4. 路由与空间递进（完整配置）

### 4.1 Vue Router 完整配置

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/CourtyardLayout.vue'),
    children: [
      { path: '', name: 'entrance', component: () => import('@/views/Entrance.vue'),
        meta: { depth: 0, transition: 'fade' } },
      { path: 'anteroom', name: 'anteroom', component: () => import('@/views/Anteroom.vue'),
        meta: { depth: 1, transition: 'slide-left' } },
      { path: 'inner', name: 'inner', component: () => import('@/views/InnerChamber.vue'),
        meta: { depth: 2, transition: 'slide-left' } },
      { path: 'garden', name: 'garden', component: () => import('@/views/BackGarden.vue'),
        meta: { depth: 3, transition: 'fade' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})
export default router
```

### 4.2 React Router v6 完整配置

```jsx
// App.jsx
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import CourtyardLayout from './layouts/CourtyardLayout'
import Entrance from './views/Entrance'
import Anteroom from './views/Anteroom'
import InnerChamber from './views/InnerChamber'
import BackGarden from './views/BackGarden'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <TransitionGroup>
      <CSSTransition key={location.pathname} classNames="space" timeout={600}>
        <Routes location={location}>
          <Route element={<CourtyardLayout />}>
            <Route path="/" element={<Entrance />} />
            <Route path="/anteroom" element={<Anteroom />} />
            <Route path="/inner" element={<InnerChamber />} />
            <Route path="/garden" element={<BackGarden />} />
          </Route>
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  )
}
export default function App() { return <HashRouter><AnimatedRoutes /></HashRouter> }
```

### 4.3 路由过渡动画

```css
.space-enter { transform: translateX(100%); opacity: 0; }
.space-enter-active { transform: translateX(0); opacity: 1; transition: all 0.6s cubic-bezier(0.22,1,0.36,1); }
.space-exit { transform: translateX(-30%); opacity: 0; }
.space-exit-active { transition: all 0.4s cubic-bezier(0.4,0,1,1); }
```

---

## 5. 组件一：MoonGate（月洞门）

> 圆形门框，如满月。穿过月洞门即进入另一个空间——「界」的最纯粹表达。

### Props 接口

```typescript
interface MoonGateProps {
  state?: 'closed' | 'open'         // 默认 'closed'
  diameter?: number                  // 默认 300 (px)
  frameColor?: string                // 默认 '#5C4A3A'
  leafColor?: string                 // 默认 '#F5F0E1'
  interiorColor?: string             // 默认 '#2C3E2D'
  clickable?: boolean                // 默认 true
  duration?: number                  // 默认 1000 (ms)
}
```

### Vue 3 完整实现

```vue
<!-- MoonGate.vue -->
<template>
  <div class="moongate" :class="{ 'moongate--open': state === 'open' }"
    :style="{ width: diameter + 'px', height: diameter + 'px' }" @click="handleClick">
    <div class="moongate__frame" :style="{ borderColor: frameColor }">
      <div class="moongate__leaf moongate__leaf--left"
        :style="{ background: leafColor, transitionDuration: duration + 'ms' }" />
      <div class="moongate__leaf moongate__leaf--right"
        :style="{ background: leafColor, transitionDuration: duration + 'ms' }" />
    </div>
    <div class="moongate__content" :style="{ background: interiorColor }"><slot /></div>
  </div>
</template>

<script setup>
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
.moongate { position: relative; border-radius: 50%; cursor: pointer; overflow: hidden; animation: mg-enter 1.2s ease-out forwards; }
.moongate__frame { position: absolute; inset: 0; border-radius: 50%; border: 8px solid; z-index: 3; pointer-events: none; box-shadow: 0 0 30px rgba(0,0,0,0.15); }
.moongate__leaf { position: absolute; top: 0; width: 50%; height: 100%; transition: transform 1s cubic-bezier(0.22,1,0.36,1); z-index: 2; }
.moongate__leaf--left { left: 0; border-radius: 50% 0 0 50%; transform-origin: right center; }
.moongate__leaf--right { right: 0; border-radius: 0 50% 50% 0; transform-origin: left center; }
.moongate--open .moongate__leaf--left { transform: perspective(600px) rotateY(-100deg); }
.moongate--open .moongate__leaf--right { transform: perspective(600px) rotateY(100deg); }
.moongate__content { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; color: #F5F0E8; padding: 20%; text-align: center; }
@keyframes mg-enter { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>
```

### React 完整实现

```jsx
// MoonGate.jsx
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

```css
/* MoonGate.css */
.moongate { position: relative; border-radius: 50%; cursor: pointer; overflow: hidden; animation: mg-enter 1.2s ease-out forwards; }
.moongate__frame { position: absolute; inset: 0; border-radius: 50%; border: 8px solid; z-index: 3; pointer-events: none; box-shadow: 0 0 30px rgba(0,0,0,0.15); }
.moongate__leaf { position: absolute; top: 0; width: 50%; height: 100%; transition: transform 1s cubic-bezier(0.22,1,0.36,1); z-index: 2; }
.moongate__leaf--left { left: 0; border-radius: 50% 0 0 50%; transform-origin: right center; }
.moongate__leaf--right { right: 0; border-radius: 0 50% 50% 0; transform-origin: left center; }
.moongate--open .moongate__leaf--left { transform: perspective(600px) rotateY(-100deg); }
.moongate--open .moongate__leaf--right { transform: perspective(600px) rotateY(100deg); }
.moongate__content { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; color: #F5F0E8; padding: 20%; text-align: center; }
@keyframes mg-enter { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
```

---

## 6. 组件二：ScrollPanel（卷轴）

> 画卷展开是东方最经典的「揭示」仪式。支持横向（手卷）和纵向（立轴）。

### Props 接口

```typescript
interface ScrollPanelProps {
  expanded?: boolean            // 默认 false
  orientation?: 'horizontal' | 'vertical'  // 默认 'horizontal'
  label?: string                // 默认 ''
  duration?: number             // 默认 1200 (ms)
  knobColor?: string            // 默认 '#B8860B'
  paperColor?: string           // 默认 '#F5F0E1'
}
```

### Vue 3 完整实现

```vue
<!-- ScrollPanel.vue -->
<template>
  <div class="scroll" :style="{ flexDirection: orientation === 'vertical' ? 'column' : 'row' }">
    <div class="scroll__rod"><div class="scroll__knob" :style="{ background: knobColor }" /></div>
    <div class="scroll__body" :style="bodyStyle">
      <div class="scroll__content" :style="{ background: paperColor }"><slot /></div>
    </div>
    <div class="scroll__rod"><div class="scroll__knob" :style="{ background: knobColor }" /></div>
    <div v-if="label" class="scroll__label">{{ label }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  expanded:    { type: Boolean, default: false },
  orientation: { type: String,  default: 'horizontal' },
  label:       { type: String,  default: '' },
  duration:    { type: Number,  default: 1200 },
  knobColor:   { type: String,  default: '#B8860B' },
  paperColor:  { type: String,  default: '#F5F0E1' },
})
const bodyStyle = computed(() => ({
  flexBasis: props.expanded ? '100%' : '0%',
  opacity: props.expanded ? 1 : 0,
  transitionDuration: props.duration + 'ms',
}))
</script>

<style scoped>
.scroll { display: flex; align-items: stretch; position: relative; max-width: 100%; }
.scroll__rod { flex-shrink: 0; background: linear-gradient(90deg,#3E2723,#5D4037,#3E2723); border-radius: 4px; position: relative; z-index: 2; }
.scroll__knob { position: absolute; width: 24px; height: 24px; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%,-50%); }
.scroll__body { flex: 1; overflow: hidden; border-left: 2px solid #8D6E63; border-right: 2px solid #8D6E63; transition: flex-basis 1.2s cubic-bezier(0.22,1,0.36,1), opacity 0.8s; }
.scroll__content { padding: 24px 32px; min-width: 200px; color: #3E2723; line-height: 1.8; }
.scroll__label { position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%); font-size: 12px; color: #8D6E63; letter-spacing: 4px; white-space: nowrap; }
</style>
```

### React 完整实现

```jsx
// ScrollPanel.jsx
import React, { useMemo } from 'react'

export default function ScrollPanel({
  expanded = false, orientation = 'horizontal', label = '',
  duration = 1200, knobColor = '#B8860B', paperColor = '#F5F0E1', children,
}) {
  const bodyStyle = useMemo(() => ({
    flexBasis: expanded ? '100%' : '0%',
    opacity: expanded ? 1 : 0,
    transitionDuration: `${duration}ms`,
  }), [expanded, duration])
  return (
    <div className="scroll" style={{ flexDirection: orientation === 'vertical' ? 'column' : 'row' }}>
      <div className="scroll__rod"><div className="scroll__knob" style={{ background: knobColor }} /></div>
      <div className="scroll__body" style={bodyStyle}>
        <div className="scroll__content" style={{ background: paperColor }}>{children}</div>
      </div>
      <div className="scroll__rod"><div className="scroll__knob" style={{ background: knobColor }} /></div>
      {label && <div className="scroll__label">{label}</div>}
    </div>
  )
}
```

```css
/* ScrollPanel.css */
.scroll { display: flex; align-items: stretch; position: relative; max-width: 100%; }
.scroll__rod { flex-shrink: 0; background: linear-gradient(90deg,#3E2723,#5D4037,#3E2723); border-radius: 4px; position: relative; z-index: 2; }
.scroll__knob { position: absolute; width: 24px; height: 24px; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%,-50%); }
.scroll__body { flex: 1; overflow: hidden; border-left: 2px solid #8D6E63; border-right: 2px solid #8D6E63; transition: flex-basis 1.2s cubic-bezier(0.22,1,0.36,1), opacity 0.8s; }
.scroll__content { padding: 24px 32px; min-width: 200px; color: #3E2723; line-height: 1.8; }
.scroll__label { position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%); font-size: 12px; color: #8D6E63; letter-spacing: 4px; white-space: nowrap; }
```

---

## 7. 设计系统速查

### 色彩令牌

| 令牌 | HEX | HSL | 用途 |
|---|---|---|---|
| wood-deep | #3E2723 | HSL(18,40%,20%) | 匾额底、轴头 |
| wood-mid | #5C4A3A | HSL(28,23%,30%) | 门框、屏框 |
| paper-warm | #F5F0E1 | HSL(46,48%,92%) | 扇面、卷心 |
| seal-red | #B22222 | HSL(0,68%,42%) | 印章朱 |
| gold | #B8860B | HSL(43,84%,38%) | 轴头旋钮 |

### 动势令牌

| 令牌 | 值 | 用途 |
|---|---|---|
| duration-fast | 300ms | hover 微启 |
| duration-normal | 600ms | 路由切换 |
| duration-slow | 1000ms | 推门、展卷 |
| ease-ceremonial | cubic-bezier(0.22,1,0.36,1) | 进入/展开 |
| ease-retreat | cubic-bezier(0.4,0,1,1) | 退出/收起 |

---

> **收束**：三段式是天-人-地的组件嵌套；「界」是组件边界的声明式描述。`import MoonGate from './MoonGate.vue'` 之后，你不是在放一个圆形边框——你是在建立一个界，穿过它，用户进入另一个空间。
