# 模块：Time

对应规则：guidelines/time.md | 优先级：P1

> Implementation: `lib/light-engine.js`（`listTimePresets` 昼夜预设：黎明 / 上午 / 正午 / 黄昏 / 夜晚）· `lib/material-engine.js`（风化与包浆：`generateMaterial` 的 `weathering` 选项）· `lib/chineseness.js`（时间痕迹评分）· thresholds: 时间感判据尚未登记（以 `guidelines/time.md` 与引擎内判据为准）· rationale: `guidelines/time.md`

## 说明

本模块是实现索引：昼夜变化、风化与包浆已分别在光影引擎与材质引擎实现，不再在这里内嵌算法、参数表或代码示例。
完整规则定义（物质时间、光影时间、叙事时间、循环时间）请参考 `../guidelines/time.md`。
素材库对时间感只有间接参考（镜头时长），见 `evidence-index.md`。
