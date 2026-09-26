# frontend-runtime API 参考

> 模块入口：`modules/frontend/runtime/index.ts`
>
> 融合运行时层的全部纯函数导出。所有函数均为**纯函数**：同输入同输出，无 `new Date()`、无 DOM 副作用。

---

## 目录

- [dimension-registry — 双轨维度 SSOT](#dimension-registry--双轨维度-ssot)
- [severity-map — 四级 severity 翻译](#severity-map--四级-severity-翻译)
- [sheet-to-cangjie — 契约 A](#sheet-to-cangjie--契约-a)
- [plan-to-dom — 契约 B](#plan-to-dom--契约-b)
- [rendered-feedback — 契约 C](#rendered-feedback--契约-c)
- [code-reviewer — 反俗套 lint](#code-reviewer--反俗套-lint)
- [grammar-rules — 规则索引](#grammar-rules--规则索引)
- [ecosystem — 生态投影](#ecosystem--生态投影)

---

## dimension-registry — 双轨维度 SSOT

文件：`modules/frontend/runtime/dimension-registry.ts`

### 类型

```ts
type CanonicalDimensionId =
  | "philosophy" | "spatial-order" | "void-solid" | "proportion"
  | "material" | "light" | "color" | "motion" | "architecture"
  | "interaction" | "anti-cliche" | "temporal";
```

### 常量

| 导出 | 说明 |
|------|------|
| `DIMENSION_REGISTRY` | 别名 → canonical 三向映射（覆盖 legacy 10 维 / v2 11 维 / DC 术语） |
| `DIMENSION_TO_TARGET` | canonical → 落点 category（composition/lighting/color/materials/runtime/sidecar） |
| `ALL_CANONICAL_DIMENSIONS` | 全部 12 个 canonical 维度（固定顺序） |
| `DIMENSION_CATALOG` | v2 编号制 11 维完整元数据（编号/中文名/权重/评分区间/评估方法） |

### 函数

#### `getDimensionId(alias: string): CanonicalDimensionId`

把任意别名解析为 canonical id。未知别名**抛错**（严格 SSOT）。

```ts
import { getDimensionId } from ".../runtime";
getDimensionId("light-shadow"); // => "light"   (legacy)
getDimensionId("06-light");     // => "light"   (v2)
getDimensionId("spatial");      // => "spatial-order" (DC 术语)
```

#### `tryGetDimensionId(alias): CanonicalDimensionId | undefined`

安全版：未知别名返回 `undefined` 而不抛错。

#### `getLegacyId(canonical): string | null`

canonical → legacy skill.yaml id 反查。v2 新增维度（philosophy/architecture）返回 `null`。

#### `getDimensionByNumber(id: number): DimensionCatalogEntry`

按 v2 编号 1..11 取目录条目，越界抛错。

#### `getDimensionByKebab(kebab): DimensionCatalogEntry`

按 kebab 名称取目录条目。

#### `getDimensionByChinese(name): DimensionCatalogEntry | undefined`

按中文名（如 "道论"、"虚实相生"）取条目。

#### `getDimensionCatalog(): readonly DimensionCatalogEntry[]`

列出全部 11 个编号维度。

---

## severity-map — 四级 severity 翻译

文件：`modules/frontend/runtime/severity-map.ts`

### canonical 四级

```ts
type CanonicalSeverity = "BLOCK" | "REPAIR" | "WARN" | "OK";
```

### `mapSeverity(from, to, value): string`

跨体系翻译 severity。

- `from`：`"cas" | "hardsoft" | "canonical" | "dcRule" | "dcRange"`
- `to`：`"canonical" | "dcRule" | "dcRange"`

```ts
import { mapSeverity } from ".../runtime";
mapSeverity("cas", "canonical", "P0");        // => "BLOCK"
mapSeverity("canonical", "dcRule", "BLOCK");   // => "P0_CRITICAL"
mapSeverity("dcRange", "canonical", "hard");   // => "REPAIR"
```

### `isBlocking(severity: string): boolean`

判断是否阻塞级（P0 / BLOCK / P0_CRITICAL / fatalBelow）。入参接受任意体系字符串。

### `isCanonicalSeverity(v): v is CanonicalSeverity`

类型守卫。

---

## sheet-to-cangjie — 契约 A

文件：`modules/frontend/runtime/sheet-to-cangjie.ts`

### 常量

| 导出 | 说明 |
|------|------|
| `REQUIRED_PATHS` | 7 条 G1 必过路径（focalPoint / negativeSpaceRatio / fov / keyLight azimuth+elevation / dominant / materials.0.baseType） |
| `REQUIRED_CONFIDENCE_FLOOR` | 0.85（requiredPaths 最低置信度） |
| `G1_CONFIDENCE_FLOOR` | 0.6（全局置信度地板） |
| `PARAMETER_PATH_MAPPINGS` | 13 条 sheet→DC path 确定性映射表 |

### `sheetToCangjie(sheet, opts): SheetToCangjieResult`

把美学约束单编译为 DC 原生 `CangjieRawDesignIR`。

**参数**：
- `sheet: AestheticConstraintSheet` — 美学约束单
- `opts: SheetToCangjieOptions` — `{ advisorVersion, capturedAt, irId? }`（`capturedAt` 必传）

**返回**：`SheetToCangjieResult`
```ts
{
  cangjieIR: CangjieRawDesignIR;   // 喂 DC normalizeIntent()
  advisorRulePack: AdvisorGrammarRule[]; // 喂 G2 PatchEngine
  unmappedDimensions: CanonicalDimensionId[]; // motion/temporal/philosophy 无 Core IR 落点
  aestheticScore: number;          // 0-100，仅 metadata
}
```

**异常**：7 条 requiredPaths 缺失或置信度不足时抛 `Error`（带 `code = "BLOCKED_DATA"`、`missing`、`lowConfidence` 字段）。

```ts
import { sheetToCangjie } from ".../runtime";
const result = sheetToCangjie(sheet, {
  advisorVersion: "chinese-aesthetic-skill@1.0.0",
  capturedAt: "2026-09-27T00:00:00Z",
});
```

---

## plan-to-dom — 契约 B

文件：`modules/frontend/runtime/plan-to-dom.ts`

### 错误类

```ts
class MapperError extends Error {}
```

### `planToDom(input: PlanToDomInput): DomComponentPlan`

把 G3 执行计划 + G2 后已验证参数投影为 DOM 装配计划。

**参数**：`PlanToDomInput = { plan: RuntimeExecutionPlan; validatedParams: CangjieEstimatedParameter[]; testCaseId: string }`

**返回**：`DomComponentPlan`（6 组件：moon-gate / scroll-panel / folding-screen / lattice-window / plaque / curio-shelf + rootCssVars + renderer 通道）。

**异常**：必需参数缺失抛 `MapperError`。

```ts
import { planToDom } from ".../runtime";
const dom = planToDom({ plan, validatedParams, testCaseId: "case-01" });
// dom.renderer: "WebGL2Renderer" | "WebGL1Renderer" | "DOMCanvas"
```

### `resolveTokens(params): Record<string, string>`

把已验证参数投影为 `:root` CSS 语义槽（`--color-bg` / `--color-text` / `--color-accent` / `--space-leak-mult` / `--shadow-token` / `--material-opacity`）。纯函数，不二次降饱和。

---

## rendered-feedback — 契约 C

文件：`modules/frontend/runtime/rendered-feedback.ts`

### 错误类

```ts
class FeedbackError extends Error {}
```

### `deserializeGeneratedCode(code, sheet): DimensionScore[]`

反序列化生成代码（html/css/js 文本与/或 `DomComponentPlan`）为 12 维实测评分。

**参数**：
- `code: RenderedCode` — `{ html?, css?, js?, plan? }`
- `sheet: AestheticConstraintSheet` — 原始约束（提供违禁清单/区间）

**异常**：code 全空抛 `FeedbackError`。

### `compareFidelity(sheet, scores): FidelityDimensionEntry[]`

对比原始约束目标分（由 sheet weight 确定性推导：primary=90 / secondary=80 / tertiary=70 / unspecified=60）与实测分，产出维度级 fidelity。

### `generateFidelityReport(input): AestheticEvaluationReport`

端到端产出 sidecar 报告：`extractSignals → reviewAntiCliche → scoreDimensions → compareFidelity → 组装 → 自算 reportHash`。

**参数**：`GenerateReportInput = { sheet, code, links: ReportLinks, advisorVersion? }`

```ts
import { generateFidelityReport } from ".../runtime";
const report = generateFidelityReport({
  sheet, code: { css: generatedCss, plan: domPlan },
  links: { testCaseId: "case-01", inputHash, validatedIRHash, executionPlanHash },
});
report.overallFidelity; // 0-100，按 sheet 权重加权
```

### `computeReportHash(report): string`

对报告骨架（剔除 reportHash 自身）做 canonical JSON + SHA-256，保证 sidecar 去重恒等。**不并入** DC 5 元 hashChain。

---

## code-reviewer — 反俗套 lint

文件：`modules/frontend/runtime/code-reviewer.ts`

### 颜色工具

| 函数 | 说明 |
|------|------|
| `normalizeHex(hex): string \| null` | 归一化为小写 `#rrggbb`；非法返回 null |
| `hexToHsl(hex): Hsl \| null` | hex → HSL（s/l 0..1） |
| `hueDistance(a, b): number` | 环形色相距离（0..180） |

### `extractSignals(code: RenderedCode): ExtractedSignals`

从渲染产物静态提取信号：colorCounts、paletteCoverage、forbiddenHexHits、maxSaturation、animationDurationsMs、bannedEasingHits、breathingLoops、negativeSpaceRatio、focalPoints、componentCount、hasMaterialOpacity。

### `reviewAntiCliche(signals, sheet): RuleViolation[]`

按三族规则审查，产出违例清单：

- **色彩**：COLOR-01 违禁 hex（P0）、COLOR-02 饱和度 S>0.5（P0）、COLOR-03 主色占比>70%（P1）、COLOR-04 色温偏差>40°（P1）
- **动势**：MOTION-01 违禁缓动 bounce/back/spin/linear/particle（P0）、MOTION-02 时长越界（P1）、MOTION-03 无呼吸循环（P1）
- **构图**：COMP-01 留白比越界 [0.42,0.55]（P1）、COMP-02 焦点数超限（P1）

---

## grammar-rules — 规则索引

文件：`modules/frontend/runtime/grammar-rules/index.ts`

### 常量

| 导出 | 说明 |
|------|------|
| `EXTENDED_RULES` | 33 条扩展规则（CA-RULE-06..38），与 DC `config/grammar-rules.json` 一一对应 |
| `RULE_DIMENSION` | ruleId → 所属 canonical 维度反查表 |

### 函数

| 函数 | 说明 |
|------|------|
| `getRulesByDimension(dim): GrammarRule[]` | 按 canonical 维度筛规则 |
| `getRulesByCategory(cat): GrammarRule[]` | 按 composition/lighting/color/materials 筛 |
| `getRuleById(ruleId): GrammarRule \| undefined` | 精确取规则 |
| `getRuleDimension(ruleId): CanonicalDimensionId \| undefined` | ruleId → 维度 |
| `buildExtendedRulePack(): GrammarRulePack` | 组装成与 DC 同形的规则包（packName=chinese-aesthetic, version=1.1.0） |

---

## ecosystem — 生态投影

入口：`modules/frontend/runtime/ecosystem/index.ts`

### Figma — `plan-to-figma`

- `planToFigma(input): FigmaVariableDefinitions` — ValidatedIR 参数 + 执行计划 → Figma Variables / Paint Styles / Effect Styles / Component Properties
- `hexToFigmaRgb(hex): FigmaRGB` — hex → 0..1 线性归一 RGB
- 错误类 `EcosystemError`

### Three.js — `plan-to-threejs`

- `planUniformsToThreeJS(uniforms): ThreeMeshStandardParams` — 单个材质 uniforms → `MeshStandardMaterial` 构造参数（color/roughness/metalness/transparent/opacity/side）
- `planMaterialsToThreeJS(materials): ThreeMeshStandardParams[]` — 批量
- `hexToThreeColor(hex): number` — `#RRGGBB` → `0xRRGGBB` 整数

### React — `plan-to-react`

- `planToReact(plan: DomComponentPlan): ReactComponentTemplate` — 由装配计划生成受控根组件的 props 接口 + 函数组件模板源码（字符串）
  - 返回 `{ interfaceName, propsInterface, componentCode }`

---

## 相关类型导出

`index.ts` 同时 re-export：
- `AestheticConstraintSheet` / `SheetColorEntry` / `SheetViolation` / `SheetStructuralDimension`
- `SheetToCangjieResult` / `SheetToCangjieOptions`
- `DomComponentPlan` / `DomComponentInstance` / `ComponentKind` / `ComponentPrefix` / `RendererChannel` / `ResolvedMotion`
- `CangjieRawDesignIR` / `CangjieEstimatedParameter` / `CangjieConstraint` / `AdvisorGrammarRule` / `RuntimeExecutionPlan`
- `AestheticEvaluationReport` 等评估类型（见 [aesthetic-evaluation.md](./aesthetic-evaluation.md)）
