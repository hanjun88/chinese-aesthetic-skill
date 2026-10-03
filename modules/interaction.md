# 模块：交互语义（interaction）

对应规则：guidelines/interaction.md | 优先级：P0

> Implementation: `lib/interaction-engine.js`（`mapInteraction` 动作→意象映射与实现片段、`getFSM` ACT0 状态机、`listActions`）· thresholds: 交互判据（响应延迟、动效时长、帧率等）尚未登记（以 `guidelines/interaction.md` 与引擎内判据为准）· rationale: `guidelines/interaction.md`
>
> 本模块不内嵌算法与代码：交互映射与状态机在引擎里，规则原文在 guidelines。以下只保留原则要点与素材库实证（观察值，不是阈值）。

## 原则要点

- **交互触发链是"静观 → 触发 → 反馈 → 恢复"**。通用状态机如下；ACT0 云海单门的完整状态机见 `assets/ACT0/fsm.md` 与 `getFSM()`。

| 状态 | 进入时的表现 | 事件 → 下一状态 |
|---|---|---|
| IDLE（静观） | autoplay 循环 | pointerenter → HOVER；scroll → TRANSITION |
| HOVER（悬停） | hover tilt | pointerleave → IDLE；click → ACTIVE |
| ACTIVE（激活） | 放大反馈 | complete → TRANSITION |
| TRANSITION（过渡） | 交叉淡入 | complete → IDLE |

- **惯性**（基于 xiaoai 实证）：速度按阻尼衰减，目标位置随速度累加，当前位置向目标位置做平滑插值；速度衰减到近零即停止，并在稳定时间之后才算静止。参数观察见下表。
- **hover tilt**：指针进入时抬起（translateZ），移动时按指针在元素内的位置映射 rotateX / rotateY，离开时复位；进入快、退出慢，用平滑插值而不是瞬时跳变。
- **prefers-reduced-motion 降级（强制要求）**：缩短动画时长、改用线性缓动、关闭视差；偏好解除时还原默认设置。
- **无障碍基线（所有新交互都必须补足）**：缺少 prefers-reduced-motion 降级判 P0；缺少键盘导航、缺少 ARIA 标签（交互元素需要 role 和 aria-label）各判 P1；鼠标交互多于键盘可触达的交互时建议补充键盘等价操作（P2）。不能重蹈 xiaoai 的覆辙（见下方可访问性现状）。
- **交互基底与 hover 节奏**：建议配置 autoplay 循环作为交互基底（xiaoai 全部有）；hover 进入快、退出慢，退出比进入更慢（P2 提示）。

## 素材库实证（Distillation Evidence）

> 数据来源：`../distillation/xiaoai-frontend-motion/`（11视频，77段动效），关联索引见 `evidence-index.md`。
> 以下是**观察值**（来源与样本量见各行），不是阈值；观察不等于推荐，交互判据见 guidelines 与引擎。

### 触发方式分布（xiaoai 11视频）

| 触发方式 | 覆盖率 | 说明 |
|---|---|---|
| autoplay 自动播放 | 11/11 | **全部有自动播放循环作为基底** |
| drag 拖拽 | 6/11 | 拖拽旋转/平移，带惯性 |
| scroll 滚动 | 5/11 | 滚动驱动时间线/视差 |
| hover 悬停 | 5/11 | 悬停tilt/放大/变色 |
| click 点击 | 4/11 | 点击切换/展开 |
| mouse_move 鼠标跟随 | 3/11 | 鼠标位置视差 |

### 反馈形式分布（xiaoai 11视频）

| 反馈形式 | 覆盖视频数 | 典型参数 |
|---|---|---|
| 视觉scale 缩放 | 9 | 入场0.05→1.0, hover 1.0→1.2, lightbox 1.0→4.0 |
| 位移displacement | 7 | translateZ +30px, 视差偏移 |
| 颜色变化color | 5 | 颜色morph, sine.inOut, 1100ms |
| 3D tilt 倾斜 | 4 | rotateY 0→20deg, rotateX 0→12deg |
| 进度指示progress | 3 | 进度条, linear easing |
| 光标变化cursor | 3 | pointer/grab |
| 音频反馈audio | 0 | **全部无声** |

### hover 交互观察（xiaoai）

| 参数 | 观察值 | 说明 |
|---|---|---|
| 进入时长 enter | ~430ms | 快速响应 |
| 退出时长 exit | ~700ms | exit慢1.5倍，优雅恢复 |
| enter/exit比 | 1:1.5 | 进入快、退出慢 |
| rotateY tilt | 0→20deg | 卡片翻转 |
| rotateX tilt | 0→12deg | 卡片俯仰 |
| translateZ | +30px | 浮起感 |
| scale | 1.0→1.2 | 放大反馈（比本 Skill 交互引擎允许的 hover 放大更大，见 `lib/interaction-engine.js` 的 `forbidden`） |

### 惯性观察（xiaoai）

| 参数 | 观察值 | 适用场景 |
|---|---|---|
| drag damping | 0.95/frame | 球体旋转（视频02） |
| wheel inertia | 0.94 | 滚轮画廊（视频03） |
| strip lerp | 0.1 | 图片条平滑（视频07） |
| idle恢复 | 速度衰减至 0.001 量级即停止 | 通用 |
| settle时间 | 500ms | 停止后稳定 |

### 可访问性现状（xiaoai 实证 — 需补足）

| 可访问性项 | 覆盖率 | 说明 |
|---|---|---|
| prefers-reduced-motion降级 | 1/11 | **严重缺失**，仅视频05有 |
| 键盘导航 | 1/11 | 8/11纯鼠标无键盘 |
| ARIA标签 | 1/11 | 仅视频05有 |
| 焦点管理 | 1/11 | 仅视频05有 |
| 触摸适配 | 未知 | 移动端未验证 |

> **强制要求**：所有新交互必须补足可访问性基线（reduced-motion降级 + 键盘导航 + ARIA标签），不能重蹈xiaoai 10/11缺失的覆辙。
