# 模块：Proportion

对应规则：guidelines/proportion.md | 优先级：P0

> Implementation: `lib/proportion-engine.js`（`validateProportions` 比例校验、`generateRecommendedProportions` 推荐比例、`listClassicRatios` / `listThreePartRatios`）· `lib/utils/math.js`（√2、三段式比例常量）· thresholds: 比例容差尚未登记（以 `guidelines/proportion.md` 与引擎内判据为准）；留白的硬规则与场景默认值见 rules registry family `CAS-VS` · rationale: `guidelines/proportion.md`

## 说明

本模块是实现索引：比例的校验与生成已在 `lib/proportion-engine.js` 实现，不再在这里内嵌算法、参数表或代码示例。
完整规则定义（方五斜七、三段式、举折、出檐、巨构尺度比）请参考 `../guidelines/proportion.md`。
素材库对比例只有定性参考（景深/构图比例），见 `evidence-index.md`。
