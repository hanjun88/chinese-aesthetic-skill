# 从美学约束生成前端代码（frontend-codegen）

> 链路：约束单 → Cangjie IR →（DC G1→G2→G3）→ DomComponentPlan → tokens.css / 组件 / React 模板。

## 1. 全链路图

```
AestheticConstraintSheet
   │ sheetToCangjie（契约A）
   ▼
CangjieRawDesignIR (+ advisorRulePack)
   │ [DC] normalizeIntent → G1 → G2 → G3
   ▼
RuntimeExecutionPlan + validatedParams
   │ planToDom（契约B）
   ▼
DomComponentPlan
   ├─► rootCssVars   → tokens.css :root 覆盖
   ├─► components[6] → 门/卷/屏/窗/匾/架 装配
   └─► ecosystem      → Figma / Three.js / React
```

## 2. 契约 B 产出的 6 个组件

`planToDom` 固定装配 6 个东方美学组件（顺序即入场序）：

| kind | prefix | 入场序 | 驱动维度 |
|------|--------|--------|----------|
| moon-gate 月洞门 | mg | 1 | void-solid, interaction |
| scroll-panel 卷轴 | sp | 2 | motion, temporal |
| folding-screen 屏风 | fs | 3 | material, void-solid |
| lattice-window 花窗 | lw | 4 | light, spatial-order |
| plaque 匾额 | pl | 5 | interaction, color |
| curio-shelf 博古架 | cs | 6 | void-solid, material |

每个组件带 `cssVars`（作用域 CSS 变量）、`state`（初始类）、`motion`（五原型动效）、`drivenBy`（维度溯源）。

## 3. tokens.css 语义槽（resolveTokens）

`resolveTokens(params)` 把已验证参数投影为全局 `:root` 变量：

| CSS 变量 | 来源 |
|----------|------|
| `--color-bg` | /color/dominant |
| `--color-text` | /color/secondary |
| `--color-accent` | /color/accent |
| `--space-leak-mult` | /composition/negativeSpaceRatio |
| `--space-proportion` | nsr≥0.45→4xl / ≥0.38→3xl / 否则 2xl |
| `--shadow-token` | colorTemp≥6800→moon / ≤3800→leak / 否则 skylight |
| `--material-opacity` | /materials/0/roughness 钳到 [0.35,1] |

**纪律**：此处只做映射，不二次降饱和（S≤0.5 在 sheet 侧已钉死）。

## 4. 渲染通道

`plan.negotiation.selectedTier` 决定 DOM 计划的 `renderer`：

| DC tier | planToDom renderer |
|---------|--------------------|
| TIER_A | WebGL2Renderer |
| TIER_B | WebGL1Renderer |
| TIER_C / 其他 | DOMCanvas |

## 5. 动效解析

`cameraRig.params.motion.proto`（cloud/water/smoke/wind/light）映射到 easing token：

```
cloud  → --ease-cloud
water  → --ease-water
smoke  → --ease-smoke
wind   → --ease-wind
light  → --ease-breath
```

时长取 `motion.durationMs[1]`，缺省 1500ms。违禁缓动（bounce/back/spin/linear/particle）由契约 C 拦截。

## 6. 落到 React

```ts
import { planToReact } from ".../runtime/ecosystem";
const tpl = planToReact(domPlan);
// tpl.propsInterface  —— props 接口 TS 源码字符串
// tpl.componentCode   —— 函数组件模板源码字符串（可直接落盘）
```

rootCssVars → 字符串 props；各组件 state → 驼峰命名受控 props。

## 7. 常见坑

- **不要在运行时再降饱和**：hex 进 plan 已是执行值；
- **不要给 planToDom 传缺参**：缺 `/color/dominant/value` 等会抛 `MapperError`，它不发明默认值；
- **rootCssVars 是覆盖不是全量**：tokens.css 为基线，只覆盖被美学决策改动的槽位。
