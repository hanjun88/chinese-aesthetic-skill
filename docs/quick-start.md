# CAS 快速开始（5 分钟上手）

> 目标：从空白到产出一张美学约束单，并把它编译成前端可消费的 Cangjie IR + DOM 组件计划。

## 0. 环境要求

- Node.js >= 18
- 克隆本仓库并安装依赖：

```bash
cd eastern-aesthetic-decision-engine
npm install
npm run lint          # 类型检查
npm run test:runtime # 融合运行时测试应全绿
```

## 1. 引入运行时

```ts
import {
  sheetToCangjie,
  planToDom,
  generateFidelityReport,
  type AestheticConstraintSheet,
} from "./modules/frontend/runtime/index.ts";
```

## 2. 创建美学约束单（AestheticConstraintSheet）

约束单是唯一输入物。最小可用字段：

```ts
const sheet: AestheticConstraintSheet = {
  sheetId: "demo-shuyuan",
  designBrief: "书院入口：月洞门为界，黛青门框，古金点题",
  mood: "song-elegant",
  attributionStatement: "月白为底、黛青为骨、古金点题，七三留白，天光斜漏",
  structuralDimensions: [
    { id: "void-solid", weight: "primary", hard: "留白:建筑≈7:5" },
    { id: "spatial-order", weight: "primary", hard: "中轴对称" },
    { id: "color", weight: "secondary", hard: "饱和度≤50%" },
  ],
  colorSystem: {
    palette: [
      { role: "dominant", name: "月白", hex: "#EDEAE4", hsl: "hsl(42,25%,92%)", areaPct: 0.65, usage: "底色" },
      { role: "secondary", name: "黛青", hex: "#2C3E50", hsl: "hsl(210,25%,25%)", areaPct: 0.25, usage: "门框/文字" },
      { role: "accent", name: "古金", hex: "#B8893A", hsl: "hsl(36,50%,48%)", areaPct: 0.05, usage: "点题" },
    ],
    saturationMax: 0.5,
    hardFailHex: ["#FF0000", "#FFD700", "#000000", "#00FFFF"],
  },
  proportion: { baseModulePx: 8, spacingScale: [1, 2, 4, 6, 8], voidSolidRatio: "7:5", focalPointsMax: 1 },
  spatial: { axis: "strict", bays: 3, hierarchyLevelsMin: 3 },
  lighting: { primarySource: "skylight", timeSetting: "dusk", lightDarkRatio: "3:7" },
  motion: { prototypes: ["cloud", "water"], durationMs: [800, 3500], entryMode: "emerge", hardFail: ["bounce", "particle"] },
  antiCliche: { scanned: true, hardFailHits: [], forbidden: ["正红", "亮金", "死黑"] },
  violations: [],
  score: 88,
};
```

> 完整字段说明见 [guides/aesthetic-sheet-creation.md](./guides/aesthetic-sheet-creation.md)。

## 3. 编译为 Cangjie IR（契约 A）

```ts
const { cangjieIR, advisorRulePack, unmappedDimensions, aestheticScore } =
  sheetToCangjie(sheet, {
    advisorVersion: "chinese-aesthetic-skill@1.0.0",
    capturedAt: "2026-09-27T00:00:00Z", // 必传，保证哈希恒等
  });

console.log(cangjieIR.parameters.length); // 17 条扁平参数
console.log(aestheticScore);               // 88（仅 metadata）
console.log(unmappedDimensions);           // motion/temporal/philosophy 无 Core IR 落点
```

这步产出的 `cangjieIR` 可以直接喂给 Design Compiler（见 [guides/dc-pipeline-integration.md](./guides/dc-pipeline-integration.md)）。

## 4. 生成前端 DOM 计划（契约 B）

实际使用时，`plan` 与 `validatedParams` 来自 DC G3 输出。这里用一个最小桩演示形状：

```ts
// 注意：生产中 plan 来自 DC RuntimeExecutionPlan；此处仅演示类型形状
import type { RuntimeExecutionPlan } from "./modules/frontend/runtime/index.ts";

const domPlan = planToDom({
  plan: dcRuntimeExecutionPlan,
  validatedParams: cangjieIR.parameters, // 示意；生产为 G2 补丁后参数
  testCaseId: "demo-shuyuan",
});

console.log(domPlan.renderer);          // WebGL2Renderer / WebGL1Renderer / DOMCanvas
console.log(domPlan.components.length); // 6（门/卷/屏/窗/匾/架）
console.log(domPlan.rootCssVars);       // :root 语义槽（--color-bg 等）
```

## 5. 渲染后回评（契约 C）

把生成的 CSS/HTML 喂回，得到 fidelity sidecar 报告：

```ts
const report = generateFidelityReport({
  sheet,
  code: { css: generatedCssText, plan: domPlan },
  links: {
    testCaseId: "demo-shuyuan",
    inputHash: "…", validatedIRHash: "…", executionPlanHash: "…",
  },
});

console.log(report.overallFidelity);    // 0-100 总体保真度
console.log(report.violations);         // 反俗套违例
console.log(report.suggestions);        // 回灌反俗套复检的改进建议
```

---

## 常见问题（FAQ）

**Q1：`sheetToCangjie` 抛 `BLOCKED_DATA`？**
说明 7 条 requiredPaths 缺参数或置信度 < 0.85。检查 palette 是否齐全（dominant/secondary/accent）、`voidSolidRatio` 是否为 `"a:b"` 格式。错误对象带 `missing` / `lowConfidence` 字段。

**Q2：`planToDom` 抛 `MapperError`？**
说明 `validatedParams` 缺必需路径（如 `/color/dominant/value`）。本函数不发明默认值——请确认传入的是 G2 补丁后的完整参数集。

**Q3：`generateFidelityReport` 抛 `FeedbackError`？**
`code` 全空（没有 css/html/js 文本也没有 plan）。至少要给一段可分析产物。

**Q4：philosophy 维度为什么总是 INCONCLUSIVE？**
道论/意境层属于语义裁决，静态反序列化无法判定，按设计保留 INCONCLUSIVE，不做还原论数值等价。

**Q5：可以用 `new Date()` 当 capturedAt 吗？**
不要。时间戳由调用方传入是为了哈希 1000× 恒等；运行时层本身不调 `new Date()`。

**Q6：怎么扩展到 Figma / Three.js / React？**
见 [guides/ecosystem-integration.md](./guides/ecosystem-integration.md)。
