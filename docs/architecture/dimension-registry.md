# 维度注册表设计（dimension-registry）

> `modules/frontend/runtime/dimension-registry.ts` 是融合层维度命名的**唯一权威注册表**。

## 1. 两类表

### 1.1 双轨 SSOT 表（v1）

- `DIMENSION_REGISTRY`：别名 → canonical（legacy 10 / v2 11 / DC 术语）；
- `DIMENSION_TO_TARGET`：canonical → 落点 category；
- `ALL_CANONICAL_DIMENSIONS`：12 维固定顺序；
- `CANONICAL_TO_LEGACY`：反向查 legacy id。

### 1.2 编号制目录（v2 任务2 新增）

在不改 SSOT 的前提下追加：
- `NumberedDimensionId`：11 个 v2 编号维（不含 temporal）；
- `DimensionCatalogEntry`：编号/kebab/中文名/落点/描述/关联规则/权重/评分区间/评估方法；
- `DIMENSION_CATALOG`：11 维完整元数据，与 `grammar-rules` 的 `RULE_DIMENSION` 对称；
- 三个 O(1) 反查 Map：编号 / kebab / 中文名。

## 2. 11 维目录（节选）

| # | kebab | 中文名 | 落点 | 权重 |
|---|-------|--------|------|------|
| 1 | philosophy | 道论 | sidecar | 0.10 |
| 2 | spatial-order | 空间秩序 | composition | 0.12 |
| 3 | void-solid | 虚实相生 | composition | 0.12 |
| 4 | proportion | 比例尺度 | composition | 0.09 |
| 5 | material | 材质质感 | materials | 0.10 |
| 6 | light | 光影明暗 | lighting | 0.10 |
| 7 | color | 色彩设色 | color | 0.08 |
| 8 | motion | 动势韵律 | runtime | 0.07 |
| 9 | architecture | 营造形制 | composition | 0.07 |
| 10 | interaction | 交互体验 | composition | 0.07 |
| 11 | anti-cliche | 反套路 | composition | 0.08 |

权重和 = 1.0；与 ScoringEngine 四分类权重正交。

## 3. 查询 API

- `getDimensionId(alias)` — 严格解析，未知抛错；
- `tryGetDimensionId(alias)` — 安全版；
- `getLegacyId(canonical)` — 反查 legacy（v2 新增维返回 null）；
- `getDimensionByNumber(1..11)` / `getDimensionByKebab(kebab)` / `getDimensionByChinese("道论")`；
- `getDimensionCatalog()` — 全量目录。

## 4. 设计约束

- **唯一权威**：新增维度必须先在此登记，否则 `getDimensionId` 抛错；
- **不污染老代码**：v2 目录是纯增量查表，不改 `lib/` 与 modules 文档；
- **与规则对称**：每条目录条目 `relatedRules` 与 `grammar-rules.RULE_DIMENSION` 一一对应。

## 5. 与 grammar-rules 的关系

`RULE_DIMENSION`（grammar-rules/index.ts）是 ruleId → 维度的反向索引；`DIMENSION_CATALOG[].relatedRules` 是维度 → ruleId 的正向索引。两边必须同步维护。
