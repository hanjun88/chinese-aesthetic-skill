# 双轨 SSOT（Single Source of Truth）设计

> 三套命名并存是历史现实。双轨 SSOT 的目标：**不改老代码**，用一张查表把别名统一到 canonical。

## 1. 为什么需要双轨

融合前存在三套并行命名：

| 体系 | 维度命名 | severity 命名 |
|------|----------|---------------|
| legacy（skill.yaml / guidelines / lib） | spatial-order, void-solid, proportion, material, light-shadow, color, motion, time, taboo, interaction（10维） | P0 / P1；hard / soft |
| v2（modules/01..11） | philosophy, spatial-order, …, anti-cliche（11维） | hard / soft / hard_fail |
| DC | spatial, temporal, composition/lighting/color/materials 四分类 | P0_CRITICAL / P1_WARNING / P2_INFO；preferred/warning/hard/fatalBelow |

若重命名老标识符，会破坏 `lib/` 与已冻结的 modules。因此引入 **canonical 中间层**做查表归一。

## 2. 维度双轨（dimension-registry.ts）

### canonical id

12 个：11 个 v2 编号维 + `temporal`（legacy time 展开项）。

```
philosophy, spatial-order, void-solid, proportion, material, light,
color, motion, architecture, interaction, anti-cliche, temporal
```

### 别名 → canonical

`DIMENSION_REGISTRY` 一张表覆盖：
- v2 module id：`"06-light" → "light"`；
- legacy id：`"light-shadow" → "light"`、`"time" → "temporal"`、`"taboo" → "anti-cliche"`；
- DC 术语：`"spatial" → "spatial-order"`。

### 落点分类

`DIMENSION_TO_TARGET` 决定每个 canonical 维去哪：
- composition / lighting / color / materials → DC 四 category；
- runtime（motion, temporal）→ 运行时 uniforms；
- sidecar（philosophy）→ 语义裁决，不投影工程参数。

## 3. severity 双轨（severity-map.ts）

canonical 四级：`BLOCK | REPAIR | WARN | OK`。

```
CAS P0  ──► BLOCK   ──► DC P0_CRITICAL / fatalBelow / op:test
CAS P1  ──► REPAIR  ──► DC P1_WARNING  / hard        / op:replace
soft    ──► REPAIR
        WARN   ──► DC P2_INFO / warning
hard    ──► BLOCK
OK          ──► DC P2_INFO / preferred
```

`mapSeverity(from, to, value)` 是唯一翻译入口；`isBlocking()` 判断是否阻塞。

## 4. 设计约束

- **查表，不改写**：老字符串原样保留，运行时查表翻译；
- **未知即抛错**：`getDimensionId` 遇未登记别名抛错（严格模式，避免静默漏映射）；
- **镜像同步**：DC `grammar-rules.json` 是 SSOT，CAS `grammar-rules/index.ts` 是 TS 镜像，增删规则须两边同步。

## 5. 收益

- `lib/` 原 10 维引擎零改动即可接入融合层；
- 新增 v2 维度（philosophy/architecture）不污染 legacy；
- DC 升级 severity 词表时，只需改 `severity-map.ts` 一张表。
