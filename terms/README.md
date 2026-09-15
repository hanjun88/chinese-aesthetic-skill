# 中式美学术语库

本目录包含可直接导入 finesse-term 的中式美学与东方空间美学术语库。

## 文件

- `chinese-aesthetic.json` — 20条核心术语，符合 finesse-term 词条契约（10字段）

## 术语列表

| ID | 中文 | 英文 | 层 | 一句话 |
|---|---|---|---|---|
| boundary-threshold | 界 | Boundary/Threshold | layout | 门墙窗廊划分已知与未知 |
| void-solid | 虚实 | Void and Solid | layout | 空的地方也是画面的一部分 |
| negative-space | 留白 | Negative Space | layout | 故意留一大块什么都没有的地方 |
| central-axis | 中轴对称 | Central Axis Symmetry | layout | 主要元素沿中心线左右对称 |
| three-part-composition | 三段式 | Three-Part Composition | layout | 屋顶/屋身/台基三段分明 |
| roof-curve | 举折 | Ju Zhe / Concave Roof Curve | visual | 屋顶是凹曲面不是直线坡 |
| eave-overhang | 出檐 | Eave Overhang | visual | 屋檐远远伸出柱子外面 |
| dougong | 斗拱 | Dougong / Bracket Set | visual | 柱屋顶之间层层叠的木构件 |
| five-direction-colors | 五方正色 | Five Direction Colors | visual | 青赤白黑黄对应五方五行 |
| color-hierarchy | 君臣佐使 | Color Hierarchy | visual | 主色辅色点缀色70:20:10 |
| incomplete-framing | 不完整入画 | Incomplete Framing | visual | 元素被画面边缘切掉一部分 |
| monumental-scale | 巨构尺度 | Monumental Scale | layout | 建筑特别大人特别小 |
| sqrt2-proportion | 方五斜七 | Square-Five Diagonal-Seven | layout | 正方形对角线√2比例 |
| god-ray | 体积光 | God Ray / Volumetric Light | visual | 光从云缝窗格漏下来可见 |
| single-light-in-dark | 暗调中一处光 | Single Light in Darkness | visual | 画面偏暗但只有一处亮 |
| moonlight | 月光法 | Moonlight Method | visual | 夜景唯一冷光源是月亮 |
| patina | 包浆 | Patina / Weathering | visual | 材质表面因时间产生的变化 |
| mirror-water | 镜面水面 | Mirror Water Reflection | visual | 平静水面倒映建筑天空 |
| cliche-guochao | 国潮贴图感 | Guochao Sticker Cliche | visual | 贴满祥云纹毛笔字的廉价感 |
| cliche-ai-guofeng | AI国风感 | AI Guofeng Cliche | visual | 高饱和塑料感均匀打光的AI生成感 |

## 安装到 finesse-term

```bash
# 方式一：直接复制到 finesse-term 数据目录
cp terms/chinese-aesthetic.json /path/to/finesse-term/skills/finesse-term/data/

# 方式二：符号链接
ln -s /path/to/chinese-aesthetic-skill/terms/chinese-aesthetic.json \
      /path/to/finesse-term/skills/finesse-term/data/chinese-aesthetic.json

# 验证
cd /path/to/finesse-term/skills/finesse-term
node scripts/term.mjs check
# 预期：total 包含 chinese-aesthetic.json，problems 为空

# 测试检索
node scripts/term.mjs find --q "画面太满了"
# 预期：返回「虚实」(void-solid)
```

## 与 finesse-term 原有术语的关系

本术语库与 finesse-term 原有5册（base/web/h5/motion/mp）并列加载，不冲突：
- 原有术语覆盖：布局/交互/状态/组件/动效/视觉/无障碍/性能/表单/平台 的通用前端术语
- 本术语库覆盖：中式美学/东方空间/传统建筑/色彩体系/俗套检测 的领域术语

pairs 字段已双向挂接（如 `void-solid` ↔ `negative-space` ↔ `cliche-guochao`），检索时会一起返回。

## 词条契约

每条术语严格遵循 finesse-term 词条契约（10字段）：
- `id` 稳定标识，小写连字符，全库唯一
- `title` 中文正名
- `en` 英文正名
- `aliases` 别名（俗称+英文）
- `layer` 归属层（layout/interaction/state/component/motion/visual/a11y/perf/form/platform）
- `plain` 大白话定义（一句话，不用其它术语）
- `say` 可直接发给Agent的表达（祈使句+数值）
- `trap` 最常见翻车方式（知道这个词的人也照样会犯的错）
- `pairs` 不一起做就会出事的搭档术语id
- `trigger` 用户大白话描述（4-6条，不能是术语本身）
