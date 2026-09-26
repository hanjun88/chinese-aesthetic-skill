# 兼容性说明

## 1. CAS ↔ DC 版本兼容矩阵

| CAS 版本 | DC 分支 / 版本 | 契约形状 | grammar-rules | 状态 |
|----------|----------------|----------|---------------|------|
| 0.1.0 (P0) | feat/aesthetic-integration | A/B/C 初版 | CA-RULE-01..05 | 兼容 |
| 0.2.0 (P1) | feat/aesthetic-integration | A/B/C 定型 + sidecar | CA-RULE-06..38（33条镜像） | 兼容 |
| 0.3.0 (P2) | feat/aesthetic-integration | 同上（仅文档） | 同上（DC JSON 共 42 条） | 兼容 |

> CAS `grammar-rules/` 是 DC `config/grammar-rules.json` 的 TS 镜像；DC JSON 为 SSOT（42 条），CAS 镜像覆盖其中 CA-RULE-06..38（33 条扩展规则）。

## 2. Node.js 版本要求

| 仓库 | Node 要求 |
|------|-----------|
| CAS（chinese-aesthetic-skill） | >= 18.0.0 |
| DC（design-compiler） | >= 20.0.0 |

> DC 使用 `node:crypto` 与较新 TypeScript 5.3，建议统一用 Node 20 LTS。

## 3. 浏览器兼容性

融合层纯函数（runtime）本身在 Node 与浏览器均可运行；落到 DOM/生态层时：

| 目标 | 最低浏览器 |
|------|-----------|
| tokens.css / DOMCanvas（TIER_C） | 现代浏览器（CSS 变量、ES2020） |
| WebGL1Renderer（TIER_B） | WebGL1 支持 |
| WebGL2Renderer（TIER_A） | WebGL2 + floatTextures + 可选 anisotropy/highPrecisionFragment |

G3 能力协商会按 `hostCaps` 自动降级：缺 webgl2 → TIER_B，再缺 → TIER_C（CSS3D/DOMCanvas）。

## 4. 向后兼容承诺

1. **冻结区永不破坏**：CAS `lib/` 原 10 维引擎与 `modules/01..11`、DC `compiler-core/` 与 `schemas/`（evaluation FROZEN 1.0.0）保持向后兼容。
2. **纯增量演进**：新能力一律走 `modules/frontend/runtime/` 或 `aesthetic-integration/`，不改既有导出签名。
3. **哈希恒等**：同 sheet + 同 capturedAt + 同 config，IR/hashChain 可复现；如需改规则，走 version bump。
4. **sidecar 隔离**：美学报告 schema 独立版本（0.1.0），不污染 DC FROZEN 5 元 hashChain。
5. **语义化版本**：MAJOR 破坏性 / MINOR 新增能力 / PATCH 修复。v0.x 阶段 MINOR 可能含小调整，升级前看 CHANGELOG。

## 5. 已知不兼容点（跨仓库）

- CAS 参数 path 带 `/value` 后缀，DC pointer-map 不带——由 DC `AestheticSheetAdapter` 负责剥离，**不要**直接把 CAS IR 喂给裸 `PipelineRunner`，请走 `AestheticPipelineRunner`。
