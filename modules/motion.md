# 模块：运动动势（motion）

对应规则：guidelines/motion.md | 优先级：P1

## 核心算法

### 东方运动原型检测

```javascript
/**
 * 检测动画是否符合东方运动原型（缓起缓收、气韵连贯）
 * @param {Object} animation - { duration, easing, delay, stagger }
 * @returns {Object} { prototype, score, violations }
 */
function detectEasternMotionPrototype(animation) {
  const EASTERN_EASINGS = ['power2', 'power3', 'sine.inOut', 'expo.out'];
  const violations = [];
  let score = 0;

  // 缓动函数检测
  const easingLower = (animation.easing || '').toLowerCase();
  const isEasternEasing = EASTERN_EASINGS.some(e => easingLower.includes(e));
  if (isEasternEasing) score += 30;
  else violations.push({ severity: 'P1', message: `缓动函数 ${animation.easing} 非东方原型，推荐 power2/power3/sine.inOut` });

  // 时长检测（东方运动偏好中长时长，避免急促）
  const duration = animation.duration || 0;
  if (duration >= 400 && duration <= 3000) score += 25;
  else if (duration < 400) violations.push({ severity: 'P2', message: `时长 ${duration}ms 过短，东方运动偏好≥400ms` });

  // stagger检测（错落有致）
  if (animation.stagger && animation.stagger >= 20 && animation.stagger <= 200) score += 25;

  // 线性运动扣分（机械感）
  if (easingLower.includes('linear') && !animation.isLoop) {
    score -= 15;
    violations.push({ severity: 'P2', message: '非循环动画使用linear缓动，有机械感' });
  }

  return {
    prototype: isEasternEasing ? 'eastern_organic' : 'western_mechanical',
    score: Math.max(0, score),
    violations
  };
}
```

### 镜头运动分类

```javascript
const CAMERA_MOTIONS = {
  drone_forward: { name: '前推航拍', easternScore: 85, typical: '云海推进/城市穿越' },
  push_in: { name: '推进', easternScore: 80, typical: '主体逼近/细节揭示' },
  static: { name: '静止', easternScore: 70, typical: '静观/留白' },
  tracking: { name: '跟随', easternScore: 65, typical: '人物跟随' },
  tilt_up: { name: '上摇', easternScore: 75, typical: '崇高感/建筑揭示' },
  pan_right: { name: '横移', easternScore: 60, typical: '横向展开' }
};
```

## 实证参数表（已验证推荐值）

> 数据来源：`../distillation/` ai-linggan（15视频）+ xiaoai（11视频），关联索引见 `evidence-index.md`

### 镜头运动参数（ai-linggan 15视频）

| 参数 | 推荐值 | 实证依据 |
|---|---|---|
| 主导镜头 | drone_forward | 15/15覆盖，10/15为主导，平均占比36% |
| 次要镜头 | push_in | 14/15覆盖，4/15为主导，平均占比30% |
| 平均镜头时长 | 3.41秒 | 慢节奏长镜头，范围2-5秒 |
| 转场偏好 | 硬切cut | 74.6%，其次叠化dissolve 18.6% |

### 前端动效参数（xiaoai 11视频，77段motion）

| 参数 | 推荐值 | 实证依据 | 样本量 |
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

### hover交互参数（xiaoai 实证）

| 参数 | 值 | 说明 |
|---|---|---|
| hover进入时长 | ~430ms | enter |
| hover退出时长 | ~700ms | exit慢1.5倍 |
| rotateY tilt | 0→20deg | 卡片翻转 |
| rotateX tilt | 0→12deg | 卡片俯仰 |
| translateZ | +30px | 浮起感 |
| scale hover | 1.0→1.2 | 放大反馈 |

### 惯性参数（xiaoai 实证）

| 参数 | 值 | 适用 |
|---|---|---|
| drag damping | 0.95/frame | 球体旋转 |
| wheel inertia | 0.94 | 滚轮画廊 |
| strip lerp | 0.1 | 图片条 |
| idle恢复阈值 | velocity<0.001 | – |
| settle时间 | 500ms | 停止后稳定 |

## Three.js 代码示例

```javascript
// 东方风格缓动配置（基于xiaoai实证）
const EASTERN_MOTION_CONFIG = {
  duration: 900,
  easing: 'power2.out',
  stagger: 60,
  hover: { enter: 430, exit: 700, rotateY: 20, rotateX: 12, translateZ: 30 },
  inertia: { damping: 0.95, lerp: 0.1, settleMs: 500 }
};

// GSAP时间线示例
function createEasternTimeline(elements) {
  return gsap.timeline()
    .from(elements, {
      duration: 0.9,
      y: 40,
      opacity: 0,
      ease: 'power3.out',
      stagger: 0.06
    });
}

// 惯性拖拽（基于xiaoai实证）
class InertiaDrag {
  constructor(target) {
    this.target = target;
    this.velocity = 0;
    this.damping = 0.95;
    this.isDragging = false;
  }
  update(delta) {
    if (!this.isDragging) {
      this.velocity *= this.damping;
      this.target.rotation.y += this.velocity * delta;
      if (Math.abs(this.velocity) < 0.001) this.velocity = 0;
    }
  }
}
```

## 校验函数（供 validate.js 调用）

```javascript
function checkMotion(design) {
  const violations = [];
  const animations = design.animations || [];

  for (const anim of animations) {
    const proto = detectEasternMotionPrototype(anim);
    violations.push(...proto.violations);

    // 时长校验
    if (anim.duration && anim.duration < 200 && !anim.isMicro) {
      violations.push({ severity: 'P2', message: `动画时长 ${anim.duration}ms 过短，建议≥400ms` });
    }
  }

  // 线性动画比例
  const linearCount = animations.filter(a => (a.easing || '').toLowerCase().includes('linear') && !a.isLoop).length;
  if (animations.length > 0 && linearCount / animations.length > 0.3) {
    violations.push({ severity: 'P1', message: `线性动画占比 ${(linearCount/animations.length*100).toFixed(0)}% > 30%，有机械感` });
  }

  return violations;
}
```
