# Changelog

本文件记录东方美学决策引擎（chinese-aesthetic-skill）的版本变更。
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号语义化。

## [Unreleased]

## [0.3.0] — P2（发布材料与文档完善）

### Added
- 新增完整文档库：`docs/api/`（frontend-runtime、aesthetic-evaluation）、`docs/quick-start.md`、`docs/guides/`（5 篇）、`docs/architecture/`（5 篇）、`docs/release/`（3 篇）。
- 新增 `CHANGELOG.md`、本 README 全面重写。

### Changed
- README 重写：补充核心能力、架构图、快速开始、目录结构、DC 集成说明。

### Fixed
- 无代码改动（本版本仅文档）。

## [0.2.0] — P1（前端实现层 + 生态扩展）

### Added
- `modules/frontend/runtime/grammar-rules/`：33 条扩展规则（CA-RULE-06..38）TS 镜像，含 `RULE_DIMENSION` 反查与 `getRulesByDimension/Category/Id`、`buildExtendedRulePack`。
- `modules/frontend/runtime/ecosystem/`：三个生态投影器
  - `plan-to-figma`：ValidatedIR → Figma Variables / Paint / Effect Styles；
  - `plan-to-threejs`：materials uniforms → `MeshStandardMaterial` 参数；
  - `plan-to-react`：DomComponentPlan → 受控组件模板。
- `types/aesthetic-evaluation-report.ts`：sidecar 报告类型（DimensionScore / FidelityDimensionEntry / RuleViolation / RenderedMeasures / ReportLinks）。
- `DIMENSION_CATALOG`：11 维编号制完整元数据目录与三向查询（编号/kebab/中文名）。
- 单测：dimension-catalog、plan-to-figma/threejs/react。

### Changed
- `rendered-feedback.ts` 接入 code-reviewer，形成完整回评链路。

## [0.1.0] — P0（融合运行时闭环）

### Added
- `modules/frontend/runtime/` 融合运行时层（纯函数，零改 lib/）：
  - `dimension-registry.ts`：双轨 SSOT，别名/落点/legacy 三向查表；
  - `severity-map.ts`：BLOCK/REPAIR/WARN/OK 四级与 CAS/DC 双向翻译；
  - `sheet-to-cangjie.ts`：契约 A，13 条参数映射 + 7 条 requiredPaths + violations→constraints；
  - `plan-to-dom.ts`：契约 B，6 组件装配 + `resolveTokens`；
  - `rendered-feedback.ts`：契约 C，`deserializeGeneratedCode / compareFidelity / generateFidelityReport / computeReportHash`；
  - `code-reviewer.ts`：反俗套 lint（9 条规则 + hex/HSL 工具）。
- 类型：`aesthetic-sheet.ts`、`cangjie.ts`、`dom-component-plan.ts`、`dc-types.ts`。
- `examples/fusion-demo/`：端到端 demo（sheet.json → cangjie-ir → dom-plan）。
- 单测：dimension-registry / severity-map / sheet-to-cangjie / plan-to-dom / rendered-feedback。

### Design 铁律
- lib/ 原 10 维引擎零改动；
- aestheticScore 不写进参数 confidence；
- sidecar reportHash 不并入 DC FROZEN 5 元 hashChain；
- 时间戳调用方传入，禁 new Date()。
