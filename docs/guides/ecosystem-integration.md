# 生态扩展：Figma / Three.js / React

> `modules/frontend/runtime/ecosystem/` 把同一份美学决策投影到三个外部消费端。三者平级，都消费 ValidatedIR 参数或 DomComponentPlan。

## 1. Figma（plan-to-figma）

把 CSS 语义槽投影为 Figma 设计变量。

```ts
import { planToFigma, hexToFigmaRgb } from ".../runtime/ecosystem";

const figma = planToFigma({
  validatedParams,          // G2 后已验证参数
  plan: dcRuntimePlan,      // G3 执行计划
});
// figma.variableCollections  → Variables（颜色/数值）
// figma.paintStyles         → Paint Styles
// figma.effectStyles        → Effect Styles
```

- `hexToFigmaRgb("#EDEAE4")` → `{ r,g,b,a }`（0..1 线性归一，**不二次降饱和**）；
- 缺参数抛 `EcosystemError`，不发明默认值。

用途：把美学 token 同步进 Figma 变量库，让设计稿与代码同源。

## 2. Three.js（plan-to-threejs）

把 `materials[].uniforms` 投影为 `MeshStandardMaterial` 构造参数。

```ts
import { planUniformsToThreeJS, hexToThreeColor, planMaterialsToThreeJS } from ".../runtime/ecosystem";

const params = planUniformsToThreeJS(material.uniforms);
// { color: 0xEDEAE4, roughness, metalness, transparent, opacity, side }

// 批量
const mats = planMaterialsToThreeJS(plan.runtimePlan.sceneBindings.materials);

// 手动色
const colorInt = hexToThreeColor("#2C3E50"); // 0x2C3E50
```

映射表：
- `color / baseColor / diffuse` → `color`（hex→0xRRGGBB）
- `roughness / uRoughness` → `roughness`
- `metalness / metallic / uMetalness` → `metalness`
- `opacity < 1` → 自动 `transparent=true`

未知 uniform key 忽略，合法 key 才写进结果。

## 3. React（plan-to-react）

把 `DomComponentPlan` 生成为受控组件模板源码。

```ts
import { planToReact } from ".../runtime/ecosystem";

const tpl = planToReact(domPlan);
// tpl.interfaceName  = "AestheticSceneProps"
// tpl.propsInterface = "interface AestheticSceneProps { planId: string; ... }"
// tpl.componentCode  = 函数组件 TS 源码字符串
```

- rootCssVars → `string` 型 props；
- 各组件 state → 驼峰命名受控 props（如 `fsFolded`、`plLanded`）；
- 产出可直接落盘为 `.tsx` 起点模板。

## 4. 选型建议

| 目标 | 用哪个 |
|------|--------|
| 设计稿与代码 token 同源 | plan-to-figma |
| WebGL/Three.js 3D 场景材质 | plan-to-threejs |
| React 受控前端组件 | plan-to-react |
| 纯 DOM/tokens.css | 直接消费 `DomComponentPlan.rootCssVars` + `components` |

## 5. 共同纪律

- 三者都是**纯 mapper**：不发明默认值、缺参数抛错；
- hex→RGB/颜色整数只做归一，**不在此二次降饱和**；
- 输入必须是 G2 之后的 ValidatedIR / G3 之后的 RuntimeExecutionPlan，不要喂原始 Cangjie IR。
