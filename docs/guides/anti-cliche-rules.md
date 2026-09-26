# 反俗套规则的使用与自定义

> 反俗套（anti-cliche）是本引擎的核心价值：把"国潮贴图感 / 塑料感 / 模板感"固化为可自动拦截的规则。

## 1. 三层防线

| 层 | 位置 | 拦截什么 |
|----|------|----------|
| sheet 侧 | `colorSystem.hardFailHex` + `antiCliche.forbidden` | 约束单阶段就排除高饱和原色 |
| G2 侧 | DC `config/grammar-rules.json`（42 条） | 参数级 replace 修补（如 roughness<0.2 → 0.35 去塑料感） |
| 契约 C | `code-reviewer.reviewAntiCliche` | 对**生成产物**做静态 lint，违例进 sidecar |

## 2. 契约 C 的 9 条内置规则

源：`code-reviewer.ts`。三族：

### 色彩族
| ruleId | severity | 触发条件 |
|--------|----------|----------|
| CA-TABOO-COLOR-01-FORBIDDEN-HEX | P0 | 生成代码出现 sheet.hardFailHex 里的色 |
| CA-TABOO-COLOR-02-SATURATION | P0 | 实测最高饱和度 S > 0.5 |
| CA-TABOO-COLOR-03-DOMINANT-RATIO | P1 | 主色占比 > 70% |
| CA-TABOO-COLOR-04-TEMPERATURE-BIAS | P1 | 实测主色相 vs sheet 期望色相环形距离 > 40° |

### 动势族
| ruleId | severity | 触发条件 |
|--------|----------|----------|
| CA-TABOO-MOTION-01-BANNED-EASING | P0 | grep 到 bounce/back/spin/linear/particle |
| CA-TABOO-MOTION-02-DURATION-RANGE | P1 | 动画时长越出 sheet.motion.durationMs |
| CA-TABOO-MOTION-03-NO-BREATHING | P1 | 0 个 infinite 呼吸循环 |

### 构图族
| ruleId | severity | 触发条件 |
|--------|----------|----------|
| CA-TABOO-COMP-01-VOID-SOLID | P1 | 留白比偏离 [0.42, 0.55] |
| CA-TABOO-COMP-02-FOCAL-OVERLOAD | P1 | plaque 焦点数 > sheet.proportion.focalPointsMax |

## 3. 违例如何回灌

`reviewAntiCliche` 产出 `RuleViolation[]`，经 `generateFidelityReport` 转成 `ImprovementSuggestion[]`，回灌 CAS Step3 反俗套复检：
- 每条 P0 违例扣 color/motion 维度 30 分，P1 扣 12 分；
- `anti-cliche` 维度 = `100 − 违例总数 × 18`。

## 4. 自定义反俗套规则

### 4.1 调内置阈值

内置阈值硬编码在 `code-reviewer.ts`（如 S>0.5、留白 [0.42,0.55]）。要改：
- **改约束侧**：调整 sheet 的 `colorSystem.saturationMax`、`proportion.voidSolidRatio`、`motion.durationMs`、`proportion.focalPointsMax`——多数规则直接读这些字段，无需改代码。
- **真要加规则**：在 `reviewAntiCliche` 里追加一个 `out.push(violation(...))`，并同步测试。

### 4.2 加 G2 参数级规则（DC 侧）

编辑 `config/grammar-rules.json`（SSOT）：

```jsonc
{
  "ruleId": "CA-RULE-36-QUSULIAO",
  "principle": "去塑料感",
  "category": "materials",
  "targetPath": "/materials/0/roughness",
  "condition": { "operator": "<", "value": 0.2 },
  "mutation": { "op": "replace", "value": 0.35 },
  "severity": "P1_WARNING",
  "reason": "镜面低糙是 AI 塑料感通病，拉回物理合理的微表面"
}
```

规则按 `ruleId` ASCII 升序幂等执行；改完需同步 CAS 侧 `modules/frontend/runtime/grammar-rules/index.ts` 的 TS 镜像与 `RULE_DIMENSION` 表。

### 4.3 新增维度

新维度必须先在 `dimension-registry.ts` 登记别名，再在 `DIMENSION_CATALOG` 补元数据，否则 SSOT 查表会抛错。

## 5. 反俗套速查（不要做什么）

- 不要用正红 `#FF0000`、亮金 `#FFD700`、死黑 `#000000`、青 `#00FFFF`；
- 不要用 bounce/back/spin/linear/particle 缓动；
- 不要绝对居中对称（>0.93 对称会被 CA-RULE-07-XUANLAN 压回 0.8）；
- 不要镜面低糙（roughness<0.2 判塑料感）；
- 不要过曝溢光（intensity>0.95 判合成图通病）。
