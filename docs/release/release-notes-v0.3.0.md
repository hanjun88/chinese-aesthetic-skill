# v0.3.0 发布说明（P2）

> 东方美学决策引擎 v0.3.0 — 文档与发布材料完善版本。

## 亮点功能

- **完整文档库上线**：API 参考（frontend-runtime / aesthetic-evaluation / DC aesthetic-integration / compiler-core）、Quick Start、5 篇使用指南、5 篇架构文档。
- **端到端闭环可复现**：约束单 → Cangjie IR → DC G1→G3 → DOM 计划 → fidelity sidecar 回评，全链路文档化。
- **双轨 SSOT 稳定**：11 维命名 + severity 四级翻译经查表统一，老代码零改动。
- **生态扩展就绪**：Figma Variables / Three.js 材质 / React 组件模板三条投影路径。

## 破坏性变更

本版本**无代码破坏性变更**：
- 仅新增/修改文档文件（`.md`）；
- 不修改任何 `.ts` / `.js` 代码；
- CAS `lib/` 与 `modules/01..11`、DC `compiler-core/` 与 `schemas/` 均未触碰。

## 升级指南

从 v0.2.0 升级：
1. `git pull` 本分支；
2. 无依赖变化、无代码迁移；
3. 如需查阅新文档，见 `docs/` 目录或仓库根 README。

从更早版本升级，见 [upgrade-guide.md](./upgrade-guide.md)。

## 已知问题

- `philosophy` 维度恒为 INCONCLUSIVE（语义层静态不可判，属设计预期）。
- DC 侧浏览器物理证据（Gate4）与人工审美验收（Gate5）尚未执行。
- sidecar `reportHash` 仅用于自身去重，未接入 DC 治理持久化。
- Governance 治理持久化与回滚仍为 PARTIAL。
