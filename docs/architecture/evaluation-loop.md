# 评估闭环设计（Evaluation Loop）

> 渲染产物 → 静态反序列化 → 12 维实测 → 与约束对比 → sidecar 报告 → 回灌反俗套复检。

## 1. 闭环图

```
                AestheticConstraintSheet (约束目标)
                        │
                        │  compareFidelity
                        ▼
DomComponentPlan ──渲染──► html/css/js
   (契约B)                  │
                            ▼
                    extractSignals (code-reviewer)
                            │
                            ▼
                    reviewAntiCliche (9条规则)
                            │
                            ▼
                    scoreDimensions (12维实测分)
                            │
                            ▼
                    compareFidelity (expected vs actual)
                            │
                            ▼
                    AestheticEvaluationReport (sidecar)
                            │
                            ├─► 回灌 CAS Step3 反俗套复检
                            └─► suggestions → 下一轮约束修正
```

## 2. 为什么是"静态反序列化"而非浏览器采样

`code-reviewer` 对 css/js/html 文本与结构化 DomComponentPlan 做正则/grep，等价于浏览器 computed style / animation / 覆盖面积采样，但：
- 纯函数、无 DOM、可单测；
- 可在 CI 里对生成产物直接跑；
- 留白比等结构化信号从 `plan.rootCssVars['--space-leak-mult']` 精确读取。

浏览器采样（renderHash）作为可选补充，填入 `ReportLinks.renderHash`。

## 3. 三态裁决

每个维度判 `PASS / FAIL / INCONCLUSIVE`，**保留 INCONCLUSIVE 不做还原论**：
- 无信号（如 philosophy 语义层、未提供 plan）→ INCONCLUSIVE；
- 实测分 ≥70 PASS，≥50 INCONCLUSIVE，<50 FAIL。

## 4. fidelity 计算

- 目标分由 sheet weight 推导（primary=90/secondary=80/tertiary=70/unspecified=60）；
- 维度 fidelity = `clamp(100 - |expected - actual|, 0, 100)`；INCONCLUSIVE 封顶 50，FAIL 封顶 45；
- 总体 fidelity 按 weight 加权（primary×3 / secondary×2 / tertiary×1）。

## 5. sidecar 隔离铁律

- 不往 DC `FidelityEvaluationResult.metrics` 塞维度（FROZEN schema 锁死）；
- reportHash 自算（canonical JSON + SHA-256，剔除 reportHash 自身），仅用于 sidecar 去重；
- **绝不**并入 DC 5 元 hashChain。

## 6. 改进建议回灌

`buildSuggestions` 把违例去重后映射到维度（color→color, motion→motion, composition→void-solid），产出 `ImprovementSuggestion[]`，回灌 CAS Step3，驱动下一轮约束单修正——形成"约束→生成→回评→修正"的闭环。
