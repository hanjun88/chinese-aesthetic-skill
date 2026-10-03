# 模块：色彩体系（color）

对应规则：guidelines/color.md | 优先级：P0

> Implementation: `lib/color-engine.js`（五方正色色板、君臣佐使配色生成、`validateColorScheme` 校验）· `lib/utils/color.js`（色彩转换与饱和度判据）· thresholds: 饱和度、点缀色面积、五方正色距离等判据尚未登记（以 `guidelines/color.md` 与引擎内判据为准；rules registry family `CAS-AP` 为反俗套判据预留，目前为空）· rationale: `guidelines/color.md`
>
> 本模块不内嵌算法、代码与配色比例表：实现在引擎里，阈值在 guidelines（待登记），已验证配色方案在 guidelines 与引擎预设。以下只保留原则要点与素材库实证（观察值，不是阈值）。

## 原则要点

- **用传统色，不用现代 HSL 直觉**：五方正色（青、赤、黄、白、黑）为基色，衍生色需过 `validateColorScheme`。深色低明度可放行高饱和（暗朱砂等传统深色本身是纯色通道），明亮色收紧。
- **五方正色距离**：以主色与最近正色的色差判定偏离；偏离过大按 P1 处理（判据见 guidelines 与引擎）。
- **禁忌色与替代**：

| 禁忌色 | 名称 | 替代 |
|---|---|---|
| #FF0000 | 正红 | #8B2500（暗朱砂） |
| #FFD700 | 亮金 | #B8860B ~ #DAA520（哑金） |
| #00FF00 | 霓虹绿 | 禁止 |
| #FF00FF | 紫外光 | 禁止 |
| #00FFFF | 霓虹青 | 禁止 |

  高饱和且高明度的颜色按"疑似霓虹色"处理：降低饱和度（判据见引擎）。
- **主色宜少、主次分明**（君臣佐使：主、辅、点缀各司其职），其余为中性/材质色；点缀色面积要小。
- **已验证配色方案**（宋韵清雅 · ACT0 云海+单门，宫墙朱门 · 宫殿/红墙，青绿山水 · 山水/自然，国色单色 · 人物肖像，红金绿 · 华丽/国画，紫金东方 · 品牌/商业）的色值与比例见 `guidelines/color.md`「已验证配色方案」与 `colorEngine.listPresets()`，不在本模块重复。

## 素材库实证（Distillation Evidence）

> 数据来源：`../distillation/` 4批素材，关联索引见 `evidence-index.md`。
> 以下是**观察值**（来源与样本量见各行），不是阈值；色彩判据见 `guidelines/color.md` 与引擎。

### 实证观察表

| 参数 | 观察值 | 实证来源 | 样本量 |
|---|---|---|---|
| 主色数量 | 两种主色加一处点缀 | ai-linggan, xiaoai | 26视频 |
| 点缀色面积比 | 记录的最大值 0.15（`max_accent_area_ratio`，`extracted/xiaoai-20260925/color.constraints.json`） | xiaoai | 11视频 |
| 饱和度 | 均值0.406，范围0.32–0.46（`extracted/ai-linggan-20260925/color-evidence.json`） | ai-linggan | 15视频 |
| 对比度范围 | 8.2–12.5（均值9.89） | ai-linggan | 15视频 |
| 色温倾向 | 冷调主导（冷9/暖6） | ai-linggan | 15视频 |

### 五方正色实证分布（ai-linggan 15视频）

| 正色 | 占比 | 说明 |
|---|---|---|
| 青 | 28.0% | 主导色，`#2c4a5e`青灰蓝 |
| 黑 | 24.8% | 深蓝黑近黑，`#1b2a44` |
| 白 | 19.9% | 月白云雾，`#e9eef7` |
| 黄 | 17.4% | 赭金偏黄，`#d89048` |
| 赤 | 9.9% | **极度压制**，仅小面积点缀 |

> 核心发现：Ai灵感主义风格刻意压制赤色（仅9.9%），用青黑白营造冷调仙境感，赭金作为唯一暖色点缀。这与传统"朱红为尊"的国风俗套形成鲜明对比，是反AI国风感的关键识别特征。

### 白底编辑级美学（xiaoai 11视频）

- 11/11共享 `#FFFFFF` paper-white基底
- 8/11纯`#FFFFFF`，2/11浅灰`#F2F2F2`/`#E9E9EC`
- 主文字`#1A1A1A`（7/11），次要`#888888`
- 10/11为6500K中性日光白
- 唯一暗色例外：视频04黑洞（`#000000`+金色辉光bloom 1.8）
- 0个页面级渐变（渐变仅用于粒子尾迹和接触阴影）

### 可复用配色画像（从素材蒸馏）

**方案A：青灰仙境（ai-linggan主导）**
```json
{
  "primary": "#2c4a5e",
  "secondary": "#e9eef7",
  "accent": "#d89048",
  "background": "#1b2a44",
  "text": "#e9eef7",
  "saturation": 0.406,
  "contrast": 9.89
}
```

**方案B：编辑画廊（xiaoai主导）**
```json
{
  "primary": "#1A1A1A",
  "secondary": "#888888",
  "accent": "small-area, low-saturation pastel",
  "background": "#FFFFFF",
  "text": "#1A1A1A",
  "color_temp_k": 6500,
  "page_gradient": false
}
```
