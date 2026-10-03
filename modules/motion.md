# 模块：运动动势（motion）

对应规则：guidelines/motion.md | 优先级：P1

> Implementation: `lib/video-motion-engine.js`（相机运动、剪辑节奏、情绪曲线；`MOTION_THRESHOLDS` / `CHINESE_VIDEO_PARAMS`）· `lib/interaction-engine.js`（交互动效的缓动与时长参数）· thresholds: 运动判据（时长、缓动、stagger、线性动画占比等）尚未登记（以 `guidelines/motion.md` 与引擎内判据为准）· rationale: `guidelines/motion.md`
>
> 本模块不内嵌算法、代码与参数配置：运动判据与预设在引擎里，规则原文在 guidelines。以下只保留原则要点与素材库实证（观察值，不是阈值）。

## 原则要点

- **东方运动原型是缓起缓收、气韵连贯**：缓动用 power2 / power3 / sine.inOut / expo.out 一类；时长偏中长，避免急促；stagger 错落有致。
- **避免机械感**：非循环动画不用 linear 缓动（循环动画的恒速驱动例外），也不用弹跳；线性动画在全部动画里占比过高要警告。
- **镜头运动的东方性倾向**（由高到低）：前推航拍（drone_forward）> 推进（push_in）> 上摇（tilt_up）> 静止（static）> 跟随（tracking）> 横移（pan_right）。

| 镜头 | 名称 | 典型用法 |
|---|---|---|
| drone_forward | 前推航拍 | 云海推进/城市穿越 |
| push_in | 推进 | 主体逼近/细节揭示 |
| tilt_up | 上摇 | 崇高感/建筑揭示 |
| static | 静止 | 静观/留白 |
| tracking | 跟随 | 人物跟随 |
| pan_right | 横移 | 横向展开 |

## 素材库实证（Distillation Evidence）

> 数据来源：`../distillation/` ai-linggan（15视频）+ xiaoai（11视频），关联索引见 `evidence-index.md`。
> 以下是**观察值**（来源与样本量见各行），不是阈值；观察不等于推荐，运动判据见 guidelines 与引擎。

### 镜头运动观察（ai-linggan 15视频）

| 参数 | 观察值 | 实证依据 |
|---|---|---|
| 主导镜头 | drone_forward | 15/15覆盖，10/15为主导，平均占比36% |
| 次要镜头 | push_in | 14/15覆盖，4/15为主导，平均占比30% |
| 平均镜头时长 | 3.41秒 | 慢节奏长镜头，范围2-5秒 |
| 转场偏好 | 硬切cut | 74.6%，其次叠化dissolve 18.6% |

### 前端动效观察（xiaoai 11视频，77段motion）

| 参数 | 观察值 | 实证依据 | 样本量 |
|---|---|---|---|
| 全局duration中位数 | 900ms | 76段样本 | 76 |
| autoplay段duration | 1200ms | 中位数 | 46 |
| click段duration | 600ms | 中位数 | 9 |
| hover段duration | 400ms | 中位数 | 7 |
| scroll段duration | 950ms | 中位数 | 8 |
| stagger中位数 | 60ms | 范围20-200ms | 27 |
| 首选easing | power2 | 23次＞linear 13＞power3 11＞expo 10 | 77 |
| 入场easing | power3.out / expo.out | 绽放/展开类 | – |
| 颜色morph easing | sine.inOut | 3段高度一致 | 3 |
| 循环easing | linear | 恒速驱动 | 13 |

> hover 进入/退出节奏、倾斜与浮起、惯性（damping / lerp / settle）的 xiaoai 观察值见 `interaction.md`，这里不重复。
