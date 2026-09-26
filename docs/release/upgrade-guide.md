# 升级指南

> 从旧版本升级到 v0.3.0 的步骤与注意事项。

## 从 v0.2.0 升级

无需代码迁移：
1. `git checkout feat/frontend-playbook-v2 && git pull`；
2. 无新增依赖，`npm install` 可不跑；
3. 跑 `npm run lint && npm run test:runtime` 确认无回归。

## 从 v0.1.0 升级

v0.1.0（P0）只有融合运行时骨架。v0.2.0（P1）新增了 grammar-rules 与 ecosystem，请注意：

1. **导入路径不变**：仍从 `modules/frontend/runtime/index.ts` 统一导入。
2. **新增导出**：`planToFigma / planUniformsToThreeJS / planToReact / getRulesByDimension` 等为新增，不影响旧调用。
3. **类型扩展**：`AestheticEvaluationReport` 相关类型在 v0.2.0 定型；若你此前手写过报告结构，请对齐 `types/aesthetic-evaluation-report.ts`。
4. **规则同步**：若你维护了 DC `grammar-rules.json`，确认与 CAS `grammar-rules/index.ts` 镜像一致（33 条 CA-RULE-06..38）。

## 跨仓库升级（CAS ↔ DC）

| CAS 版本 | DC 要求分支 | 说明 |
|----------|-------------|------|
| 0.1.0 | feat/aesthetic-integration | 契约 A/B/C 形状 |
| 0.2.0 | feat/aesthetic-integration | grammar-rules 镜像对齐 |
| 0.3.0 | feat/aesthetic-integration | 仅文档，兼容 |

路径差异提醒：CAS 出参带 `/value` 后缀，DC adapter 已负责剥离；跨仓库传参时按 DC path（不带后缀）写 confidenceOverrides。

## 升级后自检

- [ ] `npm run test:runtime` 全绿；
- [ ] `sheetToCangjie` 同 sheet + 同 capturedAt 产出同 cangjieIR；
- [ ] `generateFidelityReport` 产出带 reportHash 的 sidecar。
