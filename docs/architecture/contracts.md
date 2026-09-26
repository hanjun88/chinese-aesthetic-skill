# 契约 A / B / C 设计

> 融合层通过三条契约与 DC 对接。每条契约都是单向数据变换，边界清晰、可独立测试。

## 契约总览

| 契约 | 文件 | 输入 | 输出 |
|------|------|------|------|
| A | sheet-to-cangjie.ts | AestheticConstraintSheet | CangjieRawDesignIR + advisorRulePack |
| B | plan-to-dom.ts | RuntimeExecutionPlan + validatedParams | DomComponentPlan |
| C | rendered-feedback.ts | 渲染产物 + sheet | AestheticEvaluationReport (sidecar) |

---

## 契约 A：约束单 → Cangjie IR

**文件**：`modules/frontend/runtime/sheet-to-cangjie.ts`

### 映射表

13 条参数 path 确定性映射（`PARAMETER_PATH_MAPPINGS`），把 sheet 的枚举/比例展开为扁平物理参数：

- 色彩：palette[dominant/secondary/accent] → `/color/*/value`
- 构图：voidSolidRatio → negativeSpaceRatio；axis → symmetry；hierarchyLevelsMin → depthLayerCount
- 光影：primarySource → keyLight azimuth/elevation；timeSetting → colorTemp
- 材质：mood → /materials/0/{baseType,roughness,metalness,wear}
- 相机：默认 fov=35 / medium / 0° / height=1.6

### 7 条 G1 requiredPaths

`/composition/focalPoint`、`/composition/negativeSpaceRatio`、`/camera/fov`、`/lighting/keyLight/azimuth`、`/lighting/keyLight/elevation`、`/color/dominant`、`/materials/0/baseType`。缺失或置信度 < 0.85 → 抛 `BLOCKED_DATA`。

### violations → 约束

- P0 → `range.fatalBelow=0` + `CangjieConstraint{type:threshold, condition:{not-in: hardFailHex}}`
- P1 → `range.hard:[0.3,0.7]`

### 铁律

- aestheticScore 只进 provenance/返回值 metadata，**绝不写进参数 confidence**；
- 时间戳由 opts.capturedAt 传入，禁 `new Date()`。

---

## 契约 B：执行计划 → DOM 计划

**文件**：`modules/frontend/runtime/plan-to-dom.ts`

### 输入校验

不发明默认值。缺以下任一参数即抛 `MapperError`：
`/color/dominant|secondary|accent/value`、`/composition/negativeSpaceRatio/value`、`/lighting/keyLight/colorTemp/value`、`/materials/0/roughness/value`。

### 输出

- `rootCssVars`：`resolveTokens()` 投影的 :root 语义槽；
- `components[6]`：门/卷/屏/窗/匾/架，各带 cssVars/state/motion/drivenBy；
- `renderer`：由 plan.negotiation.selectedTier 投影（TIER_A→WebGL2Renderer …）；
- `downgrades`：透传 DC 降级记录。

### 纪律

hex/ratio 直接写进 CSS 变量，**不在运行时二次降饱和**。

---

## 契约 C：渲染产物 → fidelity sidecar

**文件**：`modules/frontend/runtime/rendered-feedback.ts`

### 定位

sidecar 文档，**独立版本 0.1.0**。不修改 DC FROZEN 的 `FidelityEvaluationResult.metrics`（additionalProperties:false，metricRef 被 semantic-gate 锁死）。

### 链接方式

靠 `ReportLinks`（testCaseId + inputHash + validatedIRHash + renderHash）挂在 DC 主链旁，自算 `reportHash`，但**不并入** FROZEN 的 5 元 hashChain。

### 流程

```
extractSignals → reviewAntiCliche → scoreDimensions → compareFidelity
→ 组装报告 → computeReportHash
```

详见 [evaluation-loop.md](./evaluation-loop.md)。

---

## 三契约的关系

```
sheet ──A──► cangjieIR ──[DC G1/G2/G3]──► executionPlan
                                              │
                           ┌──────────────────┘
                           ▼
                        plan ──B──► DomComponentPlan ──渲染──► html/css/js
                                                                  │
                                       sheet + 渲染产物 ──C──► sidecar report
```
