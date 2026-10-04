# 模块：禁忌（taboo）

对应规则：guidelines/taboo.md | 优先级：P0

> Implementation: `lib/cliche-detector.js`（四类俗套）· `lib/anti-ai-artifacts.js`（AI生图伪影检测与消除）· `lib/chineseness.js`（"为什么是中国的"结构东方性测试）· thresholds: 俗套与 AI 国风判据尚未登记（以 `guidelines/taboo.md` 与引擎内判据为准；rules registry family `CAS-AP`（反俗套判据）为其预留，目前为空；结构信号里的留白判据见 `CAS-VS-SS-001`）· rationale: `guidelines/taboo.md`
>
> 本模块不内嵌检测算法与校验代码：检测在引擎里，判据在 guidelines（待登记）。以下只保留原则要点与禁忌清单。

## 原则要点

### 四类俗套（HARD FAIL）

| 类别 | 特征 | 严重度 |
|---|---|---|
| 国潮贴图感 | 传统纹样满铺（祥云/回纹做背景或边框） | P0 |
| 古装影视感 | 人物正面特写加华丽服饰 | P0 |
| 仿古景区感 | 建筑细节堆砌、亮度均匀，不是块面剪影 | P0 |
| AI国风感 | 高饱和、塑料感材质、均匀打光三项综合评分 | P0 |

各类的判据与修复建议见 `guidelines/taboo.md` 与 `lib/cliche-detector.js`。

### "为什么是中国的"测试

终极测试：去掉所有显性中国元素（红色、飞檐、毛笔字、龙纹）后，设计仍然是东方的吗？依据**结构信号**判定，而不是元素清单：

- 空间秩序：中轴、层级、递进；元素精简
- 虚实：留白（结构信号 `CAS-VS-SS-001`）、不完整入画、通透
- 光影：明暗对比、逆光/侧逆光
- 比例：巨构尺度、三段式
- 动势：缓慢、连续、自然

引擎按结构信号累计得分，达标则"结构东方性成立"，否则需要加强空间秩序、虚实、光影、比例，而不是再贴中国元素。实现见 `lib/chineseness.js` 的结构东方性测试。

### 文化禁忌（均为 P0）

| 类别 | 元素 | 允许语境 | 说明 |
|---|---|---|---|
| 皇家 | five-claw-dragon 五爪龙、phoenix 凤凰、imperial-yellow-tile 琉璃黄瓦、nine-dragon-wall 九龙壁 | palace / imperial / temple-royal | 皇家符号仅可用于宫殿/皇家场景 |
| 宗教 | buddha-statue 佛像、lotus-throne 莲花台、swastika 卍字、vajra 金刚杵 | temple / religious / buddhist | 宗教符号仅可用于宗教场景 |
| 西方 | church-spire 教堂尖顶、gothic-window 哥特窗、neon-sign 霓虹灯、cross 十字架 | 无 | 西方符号禁止出现在中式美学场景 |

## 禁忌元素黑名单

| 类别 | 元素 | 严重度 | 说明 |
|---|---|---|---|
| 皇家 | 五爪龙 | P0 | 仅宫殿可用 |
| 皇家 | 琉璃黄瓦 | P0 | 仅宫殿可用 |
| 皇家 | 龙凤呈祥 | P1 | 婚礼/皇家可用 |
| 宗教 | 佛像 | P0 | 仅寺庙可用 |
| 宗教 | 卍字 | P0 | 仅宗教可用 |
| 西方 | 教堂尖顶 | P0 | 禁止 |
| 西方 | 哥特窗 | P0 | 禁止 |
| 西方 | 霓虹灯 | P0 | 禁止 |
| 俗套 | 祥云纹满铺 | P0 | 纹样只作小面积点缀（面积见 `guidelines/taboo.md`） |
| 俗套 | 回纹边框 | P0 | 禁止做边框 |
| 俗套 | 毛笔字大标题 | P1 | 可用但不可滥用 |
| 色彩 | 正红#FF0000 | P0 | 用暗朱砂 |
| 色彩 | 亮金#FFD700 | P0 | 用哑金 |
| 色彩 | 霓虹色 | P0 | 禁止 |
| 材质 | 塑料感 | P1 | 低粗糙度且低金属度（判据见 `guidelines/taboo.md` 与 `lib/material-engine.js`） |
| 动效 | bounce弹跳 | P1 | 东方动势禁用 |
| 动效 | linear匀速 | P1 | 应用ease-in-out |
