# 美学评估 API（aesthetic-evaluation）

> 评估闭环的类型与机制参考。
>
> 源文件：`modules/frontend/runtime/types/aesthetic-evaluation-report.ts`、`rendered-feedback.ts`、`code-reviewer.ts`

---

## 设计铁律

1. **绝不**把 11 维塞进 DC 的 `FidelityEvaluationResult.metrics`（该 schema 为 FROZEN 1.0.0，`additionalProperties:false`，metricRef 被 semantic-gate 正则锁死）。
2. 本报告是**旁挂 sidecar 文档**，仅靠 `testCaseId + inputHash + validatedIRHash + renderHash` 链接 DC 主链。
3. sidecar 自算 `reportHash`，但**不进** FROZEN 的 5 元 hashChain。
4. 美学分（advisorScore）只作 metadata，**绝不**写进任何参数 confidence。

---

## AestheticConstraintSheet（约束单类型）

> 源：`types/aesthetic-sheet.ts`

```ts
interface AestheticConstraintSheet {
  sheetId: string;
  designBrief: string;
  mood: "song-elegant" | "chan-zen" | "tang-tang" | "night-feast" | "misty-blue";
  attributionStatement: string;          // ≤200 字归因陈述
  structuralDimensions: SheetStructuralDimension[];
  colorSystem: {
    palette: SheetColorEntry[];           // 君臣佐使四角色
    saturationMax: number;                // 铁律 0.5
    hardFailHex: string[];                // 正红/亮金/死黑/青
  };
  proportion: { baseModulePx; spacingScale; voidSolidRatio: string; focalPointsMax };
  spatial: { axis: "strict"|"offset"|"hidden"; bays; hierarchyLevelsMin };
  lighting: { primarySource; timeSetting; lightDarkRatio: string };
  motion: { prototypes: Array<"cloud"|"water"|"smoke"|"wind"|"light">;
            durationMs: [number, number]; entryMode; hardFail: string[] };
  antiCliche: { scanned; hardFailHits; forbidden: string[] };
  violations: SheetViolation[];           // { ruleId, severity: "P0"|"P1", message }
  score: number;                         // 0-100，仅 metadata
}
```

`SheetColorEntry`：`{ role: "dominant"|"secondary"|"accent"|"shadow"; name; hex; hsl; areaPct; usage }`。

---

## AestheticEvaluationReport（评估报告类型）

> sidecar schema id：`https://chinese-aesthetic.local/schemas/aesthetic-evaluation-report.schema.json`，独立版本 0.1.0。

```ts
interface AestheticEvaluationReport {
  $schema: string;
  reportId: string;                 // 通常 = `${testCaseId}@${renderHash}`
  links: ReportLinks;              // 因果链接（不进 FROZEN hashChain）
  advisorVersion: string;           // 如 chinese-aesthetic-skill@1.0.0
  advisorScore: number;             // 来自 sheet 的原始美学分
  overallFidelity: number;          // 总体 fidelity 0-100（按 sheet 权重加权）
  measures: RenderedMeasures;        // 渲染后实测采样
  dimensions: FidelityDimensionEntry[];  // 12 维 fidelity 对比
  violations: RuleViolation[];     // 反俗套违例
  suggestions: ImprovementSuggestion[];   // 回灌反俗套复检
  reportHash: string;               // sidecar 自算 hash
}
```

### ReportLinks（sidecar 因果链接）

```ts
interface ReportLinks {
  testCaseId: string;
  inputHash: string;
  validatedIRHash: string;
  executionPlanHash: string;
  renderHash?: string;              // 浏览器采样后补
}
```

### RenderedMeasures（实测采样）

```ts
interface RenderedMeasures {
  actualPaletteCoveragePct: Record<string, number>;  // role → 0..1
  actualNegativeSpaceRatio: number | null;            // null = 无信号 → INCONCLUSIVE
  forbiddenHexHits: string[];
  bannedEasingHits: string[];
  breathingLoops: number;
  maxSaturation: number;                              // 铁律 ≤0.5
}
```

### FidelityDimensionEntry（维度级对比）

```ts
interface FidelityDimensionEntry {
  dimension: CanonicalDimensionId;
  weight: "primary"|"secondary"|"tertiary"|"unspecified";
  expectedScore: number;    // 由 weight 推导
  actualScore: number;      // 由生成代码反序列化实测
  fidelityScore: number;    // 0-100
  verdict: "PASS"|"FAIL"|"INCONCLUSIVE";
  rationale: string;
}
```

### RuleViolation（反俗套违例）

```ts
interface RuleViolation {
  ruleId: string;           // 如 CA-TABOO-COLOR-02-SATURATION
  category: "color"|"motion"|"composition";
  severity: "P0"|"P1";
  description: string;      // 中文
  location: string;         // CSS 属性 / 组件 prefix / 选择器
  evidence: string;         // 命中的 hex / 关键字 / 数值
}
```

### ImprovementSuggestion

```ts
{ dimension: CanonicalDimensionId; priority: "P0"|"P1"; suggestion: string }
```

---

## fidelity 评分机制

### 目标分推导（由 sheet weight 确定性映射）

| sheet weight | expectedScore | 加权系数（overallFidelity） |
|--------------|---------------|------------------------------|
| primary      | 90            | 3                            |
| secondary    | 80            | 2                            |
| tertiary     | 70            | 1                            |
| unspecified  | 60            | 1                            |

### 维度 fidelity 计算

- **已声明维度**：`fidelity = clamp(100 - |expected - actual|, 0, 100)`；若 verdict 为 `INCONCLUSIVE` 封顶 50，`FAIL` 封顶 45。
- **未声明维度**：无约束目标，按裁决给分——PASS=85 / FAIL=30 / INCONCLUSIVE=50。

### 实测分（scoreDimensions）裁决规则

| 维度 | 计分依据 |
|------|----------|
| color | 100 − 色彩族违例扣分（P0=30 / P1=12） |
| motion | 100 − 动势族违例扣分 |
| anti-cliche | 100 − 违例总数 × 18 |
| void-solid | 留白比 [0.42,0.55]→90；[0.35,0.65]→60；否则 30；无信号 INCONCLUSIVE |
| spatial-order / architecture | 装配组件数 / 6 比例 |
| proportion | 留白比已解析→78，否则 50 |
| material | 有 `--screen-opacity` 槽位→80 |
| light | maxSaturation≤0.5→75，否则 40 |
| interaction | 焦点数≤1→80，否则 40 |
| temporal | 呼吸循环≥1→75 |
| **philosophy** | **恒 INCONCLUSIVE**（语义层静态不可判，不做还原论数值等价） |

### 总体 fidelity

按 sheet weight 加权：`overallFidelity = Σ(fidelity × weightFactor) / Σ(weightFactor)`，四舍五入到整数。

### verdict 三态阈值

- `actualScore >= 70` → PASS
- `>= 50` → INCONCLUSIVE
- `< 50` → FAIL

---

## 闭环流程

```
渲染产物 (html/css/js + DomComponentPlan)
        │
        ▼
extractSignals(code)            ← code-reviewer 静态采样
        │
        ▼
reviewAntiCliche(signals, sheet) ← 9 条反俗套规则 → RuleViolation[]
        │
        ▼
scoreDimensions(signals, violations)  ← 12 维实测分
        │
        ▼
compareFidelity(sheet, scores)        ← expected vs actual
        │
        ▼
generateFidelityReport({ sheet, code, links })
        │
        ▼
AestheticEvaluationReport (sidecar) → 回灌 CAS Step3 反俗套复检
```

调用入口见 [`frontend-runtime.md`](./frontend-runtime.md#rendered-feedback--契约-c) 的 `generateFidelityReport`。
