# 模块：交互语义（interaction）

对应规则：guidelines/interaction.md | 优先级：P0

## 核心算法

### 交互触发链FSM

```javascript
/**
 * 东方风格交互状态机（静观→触发→反馈→恢复）
 * 状态：IDLE(静观) → HOVER(悬停) → ACTIVE(激活) → TRANSITION(过渡) → IDLE
 */
const InteractionFSM = {
  states: {
    IDLE: { enter: 'autoplayLoop', on: { pointerenter: 'HOVER', scroll: 'TRANSITION' } },
    HOVER: { enter: 'hoverTilt', on: { pointerleave: 'IDLE', click: 'ACTIVE' } },
    ACTIVE: { enter: 'scaleUp', on: { complete: 'TRANSITION' } },
    TRANSITION: { enter: 'crossfade', on: { complete: 'IDLE' } }
  },

  transition(current, event) {
    const state = this.states[current];
    if (state && state.on[event]) {
      const next = state.on[event];
      return { from: current, to: next, action: this.states[next].enter };
    }
    return null;
  }
};
```

### 惯性系统

```javascript
/**
 * 带惯性的交互系统（基于xiaoai实证）
 * 参数：drag damping 0.95, wheel inertia 0.94, settle 500ms
 */
class InertiaSystem {
  constructor(options = {}) {
    this.damping = options.damping || 0.95;
    this.lerpFactor = options.lerpFactor || 0.1;
    this.settleThreshold = options.settleThreshold || 0.001;
    this.settleMs = options.settleMs || 500;
    this.velocity = 0;
    this.target = 0;
    this.current = 0;
    this.lastMoveTime = 0;
  }

  update(delta) {
    // 惯性衰减
    this.velocity *= this.damping;
    this.target += this.velocity * delta;

    // 平滑插值
    this.current += (this.target - this.current) * this.lerpFactor;

    // 停止检测
    if (Math.abs(this.velocity) < this.settleThreshold) {
      this.velocity = 0;
    }

    return this.current;
  }

  addImpulse(force) {
    this.velocity += force;
    this.lastMoveTime = performance.now();
  }

  isSettled() {
    return Math.abs(this.velocity) < this.settleThreshold &&
           performance.now() - this.lastMoveTime > this.settleMs;
  }
}
```

## 实证参数表（已验证推荐值）

> 数据来源：`../distillation/xiaoai-frontend-motion/`（11视频，77段动效），关联索引见 `evidence-index.md`

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

### hover交互参数（xiaoai 实证）

| 参数 | 值 | 说明 |
|---|---|---|
| 进入时长 enter | ~430ms | 快速响应 |
| 退出时长 exit | ~700ms | exit慢1.5倍，优雅恢复 |
| enter/exit比 | 1:1.5 | 进入快、退出慢 |
| rotateY tilt | 0→20deg | 卡片翻转 |
| rotateX tilt | 0→12deg | 卡片俯仰 |
| translateZ | +30px | 浮起感 |
| scale | 1.0→1.2 | 放大反馈 |

### 惯性参数（xiaoai 实证）

| 参数 | 值 | 适用场景 |
|---|---|---|
| drag damping | 0.95/frame | 球体旋转（视频02） |
| wheel inertia | 0.94 | 滚轮画廊（视频03） |
| strip lerp | 0.1 | 图片条平滑（视频07） |
| idle恢复阈值 | velocity<0.001 | 通用 |
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

## Three.js / JavaScript 代码示例

```javascript
// 东方风格hover tilt（基于xiaoai实证）
class HoverTilt {
  constructor(element, options = {}) {
    this.el = element;
    this.rotateYMax = options.rotateYMax || 20;
    this.rotateXMax = options.rotateXMax || 12;
    this.translateZ = options.translateZ || 30;
    this.enterDuration = options.enterDuration || 430;
    this.exitDuration = options.exitDuration || 700;
    this.current = { rx: 0, ry: 0, tz: 0 };
    this.target = { rx: 0, ry: 0, tz: 0 };
    this._bind();
  }

  _bind() {
    this.el.addEventListener('pointerenter', () => {
      this.target.tz = this.translateZ;
    });
    this.el.addEventListener('pointermove', (e) => {
      const rect = this.el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      this.target.ry = x * this.rotateYMax;
      this.target.rx = -y * this.rotateXMax;
    });
    this.el.addEventListener('pointerleave', () => {
      this.target = { rx: 0, ry: 0, tz: 0 };
    });
  }

  update(delta) {
    const lerp = this.target.tz > 0 ? 0.15 : 0.08;
    this.current.rx += (this.target.rx - this.current.rx) * lerp;
    this.current.ry += (this.target.ry - this.current.ry) * lerp;
    this.current.tz += (this.target.tz - this.current.tz) * lerp;
    this.el.style.transform =
      `perspective(1000px) rotateX(${this.current.rx}deg) rotateY(${this.current.ry}deg) translateZ(${this.current.tz}px)`;
  }
}

// 可访问性：reduced-motion降级（强制要求）
function setupReducedMotion(animationSystem) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const apply = (e) => {
    if (e.matches) {
      animationSystem.setDuration(150);
      animationSystem.setEasing('linear');
      animationSystem.disableParallax();
    } else {
      animationSystem.restoreDefaults();
    }
  };
  mq.addEventListener('change', apply);
  apply(mq);
}
```

## 校验函数（供 validate.js 调用）

```javascript
function checkInteraction(design) {
  const violations = [];
  const { interactions, accessibility } = design;

  // autoplay基底检测
  const hasAutoplay = interactions.some(i => i.trigger === 'autoplay');
  if (!hasAutoplay && interactions.length > 0) {
    violations.push({ severity: 'P2', message: '建议配置autoplay循环作为交互基底（xiaoai 11/11实证）' });
  }

  // hover enter/exit比例
  const hoverInteractions = interactions.filter(i => i.trigger === 'hover');
  for (const h of hoverInteractions) {
    if (h.enterDuration && h.exitDuration && h.exitDuration < h.enterDuration) {
      violations.push({ severity: 'P2', message: `hover退出时长(${h.exitDuration}ms) < 进入时长(${h.enterDuration}ms)，建议退出慢1.5倍` });
    }
  }

  // 可访问性强制检测
  if (!accessibility || !accessibility.reducedMotion) {
    violations.push({ severity: 'P0', message: '缺少prefers-reduced-motion降级（强制要求，xiaoai 10/11缺失是反面教材）' });
  }
  if (!accessibility || !accessibility.keyboard) {
    violations.push({ severity: 'P1', message: '缺少键盘导航支持（建议所有交互可键盘触发）' });
  }
  if (!accessibility || !accessibility.aria) {
    violations.push({ severity: 'P1', message: '缺少ARIA标签（交互元素需role和aria-label）' });
  }

  // 纯鼠标交互警告
  const mouseOnly = interactions.filter(i => ['hover', 'drag', 'mouse_move'].includes(i.trigger));
  const keyboardAccessible = interactions.filter(i => ['click', 'scroll', 'autoplay'].includes(i.trigger));
  if (mouseOnly.length > keyboardAccessible.length) {
    violations.push({ severity: 'P2', message: '鼠标交互多于键盘可触达交互，建议补充键盘等价操作' });
  }

  return violations;
}
```
