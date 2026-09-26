# 东方美学决策引擎（Chinese Aesthetic Skill）

> 把"这个设计为什么是中国的"从一句主观判断，编译为可测量、可约束、可回灌的工程参数。

`chinese-aesthetic-skill`（内部代号 CAS，Chinese Aesthetic decision engine）是一个**确定性的东方空间美学决策引擎**。它不直接生成画面，而是把儒释道、宋韵、营造法式、君臣佐使等美学语汇，翻译成一组**可被编译器消费的约束单（AestheticConstraintSheet）**，再经融合运行时层投影为前端组件计划、Figma 变量、Three.js 材质，并在渲染后做 fidelity 回评，形成闭环。

- **包名**：`chinese-aesthetic-skill`
- **当前版本**：v0.3.0（P2）
- **License**：MIT
- **Node 要求**：>= 18.0.0

---

## 它解决什么问题

AIGC 生成的中式设计常犯三类病：高饱和正红/亮金的"国潮贴图感"、bounce/弹簧动效的塑料感、绝对居中对称的模板感。本引擎把这些"俗套"固化为**硬否决规则**，并把留白、中轴、天光、包浆等正向语汇固化为**参数区间**，让下游编译器（Design Compiler）在 G1/G2/G3 门禁里自动阻断或修补。

---

## 核心能力

### 1. 十一个原美学模块（哲学 → 反俗套）

`modules/01..11-*.md` 编号制 11 维，每一维都有可测指标与规则：

| # | 维度 | 中文名 | 落点 |
|---|------|--------|------|
| 01 | philosophy | 道论 | sidecar 语义裁决 |
| 02 | spatial-order | 空间秩序 | composition |
| 03 | void-solid | 虚实相生 | composition |
| 04 | proportion | 比例尺度 | composition |
| 05 | material | 材质质感 | materials |
| 06 | light | 光影明暗 | lighting |
| 07 | color | 色彩设色 | color |
| 08 | motion | 动势韵律 | runtime |
| 09 | architecture | 营造形制 | composition |
| 10 | interaction | 交互体验 | composition |
| 11 | anti-cliche | 反套路 | composition |

`lib/` 下保留原 10 维可执行引擎（color-engine / spatial-engine / proportion-engine / material-engine / light-engine / video-motion-engine / interaction-engine / cliche-detector / anti-ai-artifacts），**P0/P1 全程零改动**。

### 2. 前端实现层（frontend playbook v2.0）

`modules/frontend/` 把美学决策落到真实前端：
- `html-css.md` / `javascript-interaction.md` / `framework-components.md`：语义化 HTML、tokens.css、组件骨架；
- `mapping/E..J-*.md`：空间虚实、比例色彩、材质光影、动势 JS、架构哲学、反俗套 code review 的映射手册。

### 3. 融合运行时层（双轨 SSOT + 契约 A/B/C）

`modules/frontend/runtime/` 是纯函数运行时，通过三条契约与 Design Compiler（DC）对接：

| 契约 | 函数 | 方向 |
|------|------|------|
| A | `sheetToCangjie` | 美学约束单 → Cangjie IR |
| B | `planToDom` | DC 执行计划 → DOM 组件计划 |
| C | `generateFidelityReport` | 渲染产物 → 美学 fidelity sidecar |

维度命名、severity 命名全部经 `dimension-registry` / `severity-map` 双轨统一，**不改 lib/、不改 modules/01..11**。

### 4. 评估闭环（fidelity 评分 + 反俗套审查）

`code-reviewer.ts` 对生成的 HTML/CSS/JS 做静态反序列化：grep 违禁 hex、违禁缓动、饱和度 S≤0.5 铁律、留白比区间、呼吸循环计数。`rendered-feedback.ts` 把信号对比回原始约束单，产出 `AestheticEvaluationReport`（sidecar，独立版本，不污染 DC FROZEN 的 5 元 hashChain）。

### 5. 生态扩展

`modules/frontend/runtime/ecosystem/` 三个平级投影器：
- `plan-to-figma`：ValidatedIR + 执行计划 → Figma Variables / Paint Styles / Effect Styles；
- `plan-to-threejs`：materials uniforms → Three.js `MeshStandardMaterial`；
- `plan-to-react`：DomComponentPlan → 受控 React 组件模板。

---

## 架构概览

```
                 ┌──────────────────────────────────────────────┐
                 │            CAS 美学决策引擎 (本仓库)           │
                 │                                              │
  lib/*-engine   │  modules/01..11  ──►  AestheticConstraintSheet│
  (原10维,零改动) │   (11维编号制)        (美学约束单 / 唯一输入物) │
                 └──────────────────────┬───────────────────────┘
                                        │ 契约 A: sheetToCangjie
                                        ▼
                 ┌──────────────────────────────────────────────┐
                 │   Design Compiler (DC, 独立仓库)              │
                 │   G1 DataGate → G2 PatchEngine → G3 CapNeg   │
                 │   → RuntimeExecutionPlan + 5元 hashChain     │
                 └──────────────────────┬───────────────────────┘
                                        │ 契约 B: planToDom
                                        ▼
                 ┌──────────────────────────────────────────────┐
                 │   DomComponentPlan (6组件: 门/卷/屏/窗/匾/架) │
                 │   → tokens.css / Figma vars / Three.js / React│
                 └──────────────────────┬───────────────────────┘
                                        │ 渲染产物 (html/css/js)
                                        ▼
                 ┌──────────────────────────────────────────────┐
                 │ 契约 C: code-reviewer → rendered-feedback    │
                 │   → AestheticEvaluationReport (sidecar 回评) │
                 │   → 回灌 Step3 反俗套复检 (闭环)              │
                 └──────────────────────────────────────────────┘
```

双轨 SSOT：维度与 severity 各有 legacy / v2 / DC 三套命名，全部经 `dimension-registry.ts`、`severity-map.ts` 查表归一，物理上不改老代码。

---

## 快速开始

### 安装

```bash
# 仓库即 skill 本体；Node >= 18
npm install           # 安装前端工具链（vite/react/tailwind）
npm run lint          # tsc --noEmit 类型检查
npm run test          # 原 10 维引擎测试
npm run test:runtime  # 融合运行时层测试
```

### 最小示例：约束单 → Cangjie IR

```ts
import {
  sheetToCangjie,
  type AestheticConstraintSheet,
} from "./modules/frontend/runtime/index.ts";

const sheet: AestheticConstraintSheet = {
  sheetId: "act-shuyuan-entrance",
  designBrief: "书院入口：月洞门为界，黛青门框，古金点题，七三留白",
  mood: "song-elegant",
  attributionStatement: "月白为底、黛青为骨、古金点题，天光斜漏",
  structuralDimensions: [
    { id: "void-solid", weight: "primary", hard: "留白:建筑≈7:5" },
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

const { cangjieIR, advisorRulePack, aestheticScore } = sheetToCangjie(sheet, {
  advisorVersion: "chinese-aesthetic-skill@1.0.0",
  capturedAt: "2026-09-27T00:00:00Z", // 时间戳由调用方传入，保证哈希恒等
});

console.log(cangjieIR.parameters.length); // 展开为 17+ 条扁平参数
console.log(aestheticScore);              // 88（仅 metadata，不进 confidence）
```

完整可运行示例见 `examples/fusion-demo/` 与 [`docs/quick-start.md`](docs/quick-start.md)。

---

## 目录结构

```
eastern-aesthetic-decision-engine/
├── modules/                    # 美学知识层
│   ├── 01-philosophy.md … 11-anti-cliche.md   # v2 编号制 11 维
│   ├── extracted/              # 作品蒸馏证据（json）
│   └── frontend/               # 前端 playbook v2.0
│       ├── runtime/            # ★ 融合运行时（纯函数契约 A/B/C）
│       │   ├── dimension-registry.ts   # 双轨 SSOT 维度表
│       │   ├── severity-map.ts         # 四级 severity 翻译
│       │   ├── sheet-to-cangjie.ts     # 契约 A
│       │   ├── plan-to-dom.ts          # 契约 B
│       │   ├── rendered-feedback.ts    # 契约 C
│       │   ├── code-reviewer.ts        # 反俗套 lint
│       │   ├── grammar-rules/          # 33 条 CA-RULE-06..38 TS 镜像
│       │   └── ecosystem/              # Figma / Three.js / React 投影
│       └── mapping/            # E..J 映射手册
├── lib/                        # 原 10 维可执行引擎（零改动）
├── guidelines/                 # 旧 10 维规则文本
├── distillation/               # 作品蒸馏报告
├── playbooks/                  # 跨仓库交接 playbook
├── examples/fusion-demo/       # 融合端到端 demo（sheet → cangjie → dom）
├── tests/                      # 引擎测试 + runtime 单测
├── docs/                       # ★ 本文档库（api / guides / architecture / release）
└── CHANGELOG.md
```

---

## 与 Design Compiler 的集成

本仓库输出的 `AestheticConstraintSheet` 是唯一输入物，DC 侧有独立移植的 `aesthetic-integration` 模块（`AestheticSheetAdapter` + `AestheticPipelineRunner`）把它喂进真实的 G1→G2→G3 流水线。

集成要点：
- 路径差异：CAS 出参带 `/value` 后缀（`/color/dominant/value`），DC pointer-map 不带后缀，由 DC adapter 剥离；
- 美学分 `aestheticScore` 只进 provenance/metadata，**绝不写进参数 confidence**；
- 时间戳由调用方传入（`capturedAt`），禁 `new Date()`，保证 1000× 哈希恒等；
- sidecar 报告自算 `reportHash`，但**不并入** DC FROZEN 的 5 元 hashChain。

详见 [`docs/guides/dc-pipeline-integration.md`](docs/guides/dc-pipeline-integration.md) 与 [`docs/architecture/contracts.md`](docs/architecture/contracts.md)。

---

## 贡献指南（简要）

1. 本仓库对 `lib/` 与 `modules/01..11-*` 采取**冻结策略**：不改老引擎，新增能力一律走 `modules/frontend/runtime/` 纯增量。
2. 新增维度或规则，必须先在 `dimension-registry.ts` / `grammar-rules/index.ts` 登记，保持 SSOT 唯一。
3. 所有运行时函数必须是**纯函数**：禁 `new Date()`、禁 DOM 副作用、同输入同输出。
4. 提交前跑：`npm run lint && npm run test:runtime`。
5. 文档全中文，代码示例必须可运行。

---

## License

[MIT](./LICENSE) © HEARTMIRROR Team
