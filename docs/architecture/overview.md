# 整体架构概览

> 本文描述 CAS（东方美学决策引擎）与 DC（Design Compiler）的关系与分层。

## 1. 两个仓库的分工

| | CAS（本仓库） | DC（design-compiler） |
|---|---|---|
| 职责 | 把美学语汇编译为约束单 | 把约束/意图编译为可渲染执行计划 |
| 核心产物 | AestheticConstraintSheet | RuntimeExecutionPlan + 5元 hashChain |
| 边界 | lib/ 与 modules/01..11 冻结 | compiler-core/ 与 schemas/ FROZEN |
| 扩展方式 | 走 modules/frontend/runtime 纯增量 | 走 config/*.json 与 aesthetic-integration |

## 2. 分层图

```
┌─────────────────────────────────────────────────────────────┐
│  知识层  modules/01..11 (11维) + lib/*-engine (原10维,冻结)  │
├─────────────────────────────────────────────────────────────┤
│  约束层  AestheticConstraintSheet (唯一输入物)               │
├─────────────────────────────────────────────────────────────┤
│  融合运行时层 (CAS modules/frontend/runtime)               │
│    ┌──────────────┐  ┌──────────────┐  ┌───────────────┐    │
│    │ dimension-   │  │ severity-    │  │ grammar-rules │    │
│    │ registry SSOT│  │ map          │  │ (33条镜像)    │    │
│    └──────────────┘  └──────────────┘  └───────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  契约层  A: sheetToCangjie                                  │
│          B: planToDom                                       │
│          C: generateFidelityReport (sidecar)               │
├─────────────────────────────────────────────────────────────┤
│  DC 编译层  G1 DataGate → G2 PatchEngine → G3 CapNeg → Plan │
│            (config: g1-policy / grammar-rules / tier-map) │
├─────────────────────────────────────────────────────────────┤
│  生态层  tokens.css / Figma vars / Three.js / React         │
├─────────────────────────────────────────────────────────────┤
│  回评层  code-reviewer → AestheticEvaluationReport (闭环)   │
└─────────────────────────────────────────────────────────────┘
```

## 3. 设计原则

1. **冻结老代码**：CAS 的 `lib/`、`modules/01..11`，DC 的 `compiler-core/`、`schemas/` 均不改；新能力纯增量叠加。
2. **双轨 SSOT**：三套维度命名、三套 severity 命名，靠查表统一，不重命名老标识符。
3. **纯函数运行时**：CAS runtime 不调 `new Date()`、不碰 DOM，同输入同输出，可单测、可哈希。
4. **sidecar 隔离**：美学评估报告旁挂，不污染 DC FROZEN 的 5 元 hashChain。
5. **确定性哈希**：时间戳调用方传入，补丁按 ruleId ASCII 升序，保证 1000× 复现。

## 4. 跨仓库边界

- CAS 出 Cangjie IR 形状（带 `/value` 后缀）；DC adapter 独立移植并剥离后缀；
- DC 的 `grammar-rules.json` 是 G2 规则 SSOT；CAS runtime 的 `grammar-rules/` 是 TS 镜像；
- 两边靠 `AestheticConstraintSheet` JSON 结构解耦，不互相 import。

详见：
- [dual-track-ssot.md](./dual-track-ssot.md) — 双轨 SSOT
- [contracts.md](./contracts.md) — 契约 A/B/C
- [evaluation-loop.md](./evaluation-loop.md) — 评估闭环
- [dimension-registry.md](./dimension-registry.md) — 维度注册表
