/**
 * interaction-engine.js — 交互语义映射器
 *
 * 输入用户动作类型，自动映射到东方意象响应：
 * - 鼠标移动 → 云海扰动/微风拂过
 * - 点击 → 裂隙发光/苔藓生长/水波荡漾
 * - 滚动 → 下潜旋流/穿越门扉/云雾流动
 * - 拖拽 → 门体旋转/画卷展开/视角环绕
 * - 悬停 → 微光浮现/花瓣飘落/文字渐显
 *
 * 核心原则：动作→意象映射（物我同生）、递进式展开、呼吸感延迟、用场景元素交互非按钮。
 */

import { clamp } from './utils/math.js';

/** 交互语义映射表 */
const INTERACTION_MAP = {
  mousemove: {
    name: '鼠标移动',
    easternIntent: '微风拂过/云海扰动',
    effects: [
      {
        name: '云海扰动',
        description: '鼠标位置附近的云雾粒子产生轻微扰动，像风吹过',
        params: { radius: 150, strength: 0.3, duration: 800, easing: 'ease-out' },
        triggerZone: 'cloud-mask',
      },
      {
        name: '微光跟随',
        description: '鼠标位置出现微弱的光晕，像萤火虫或月光',
        params: { size: 60, opacity: 0.3, color: '#FFD700', blur: 20 },
        triggerZone: 'anywhere',
      },
    ],
    forbidden: ['cursor变花哨图标', '拖尾粒子特效'],
  },
  click: {
    name: '点击',
    easternIntent: '裂隙发光/苔藓生长/物我同生',
    effects: [
      {
        name: '裂隙发光',
        description: '点击位置地面出现细微裂隙，金光从裂隙中透出',
        params: { crackLength: 80, glowColor: '#B8860B', duration: 1200, easing: 'ease-out' },
        triggerZone: 'ground-mask',
      },
      {
        name: '苔藓生长',
        description: '裂隙边缘逐渐长出苔藓和小花，从点击位置向外扩散',
        params: { spreadRadius: 100, growDuration: 2000, color: '#5B7B5E', easing: 'ease-in-out' },
        triggerZone: 'ground-mask',
      },
      {
        name: '水波荡漾',
        description: '点击水面产生同心圆波纹，向外扩散消失',
        params: { rippleCount: 3, maxRadius: 200, duration: 1500, easing: 'ease-out' },
        triggerZone: 'water-mask',
      },
      {
        name: '门扉轻启',
        description: '点击门，门缓缓打开一条缝，光从门缝中透出',
        params: { openAngle: 15, duration: 1500, glowIntensity: 0.5, easing: 'ease-in-out' },
        triggerZone: 'door-mask',
      },
    ],
    forbidden: ['按钮缩放弹跳', '点击爆炸粒子', 'alert弹窗'],
  },
  scroll: {
    name: '滚动',
    easternIntent: '下潜旋流/穿越门扉/云雾流动',
    effects: [
      {
        name: '下潜旋流',
        description: '滚动时镜头沿中心线逐渐下潜，云雾和金粉缓慢螺旋向内流动',
        params: { diveDepth: 500, swirlSpeed: 0.5, particleCount: 200, easing: 'ease-in-out' },
        triggerZone: 'anywhere',
      },
      {
        name: '云雾流动',
        description: '滚动驱动云海缓慢流动，速度与滚动速度成正比',
        params: { flowSpeed: 0.3, direction: 'horizontal', parallax: 0.5 },
        triggerZone: 'cloud-mask',
      },
      {
        name: '场景递进',
        description: '滚动到特定位置触发场景切换（前庭→中殿→后堂）',
        params: { transitionDuration: 1000, fadeOpacity: 0.3, easing: 'ease-in-out' },
        triggerZone: 'anywhere',
      },
      {
        name: '昼夜交替',
        description: '长滚动模拟时间流逝，光线从晨到昏逐渐变化',
        params: { duration: 3000, colorShift: true, shadowLength: true },
        triggerZone: 'anywhere',
      },
    ],
    forbidden: ['视差滚动过头导致眩晕', '滚动触发弹窗'],
  },
  drag: {
    name: '拖拽',
    easternIntent: '门体旋转/画卷展开/视角环绕',
    effects: [
      {
        name: '门体旋转',
        description: '拖拽门体围绕垂直轴真实旋转（Three.js真3D），有物理惯性',
        params: { rotationAxis: 'y', maxAngle: 90, inertia: 0.9, damping: 0.95 },
        triggerZone: 'door-mask',
      },
      {
        name: '画卷展开',
        description: '拖拽展开一幅长卷，内容从左到右逐渐显现',
        params: { scrollDirection: 'horizontal', revealSpeed: 0.8, easing: 'ease-out' },
        triggerZone: 'scroll-mask',
      },
      {
        name: '视角环绕',
        description: '拖拽屏幕环绕建筑旋转视角，有俯仰角限制',
        params: { minPolarAngle: 0.2, maxPolarAngle: 1.4, damping: 0.05 },
        triggerZone: 'anywhere',
      },
    ],
    forbidden: ['拖拽元素乱飞', '无惯性的生硬跟随'],
  },
  hover: {
    name: '悬停',
    easternIntent: '微光浮现/花瓣飘落/文字渐显',
    effects: [
      {
        name: '微光浮现',
        description: '悬停元素边缘浮现微弱光晕，像月光照在边缘',
        params: { glowSize: 20, opacity: 0.4, color: '#E8E4D9', duration: 300 },
        triggerZone: 'interactive-element',
      },
      {
        name: '花瓣飘落',
        description: '悬停特定区域触发少量花瓣从上方飘落',
        params: { petalCount: 5, fallDuration: 3000, swayAmount: 20, color: '#FFB6C1' },
        triggerZone: 'flower-mask',
      },
      {
        name: '文字渐显',
        description: '悬停时文字从模糊到清晰逐渐显现，像从雾中浮现',
        params: { blurFrom: 10, blurTo: 0, opacityFrom: 0, opacityTo: 1, duration: 500 },
        triggerZone: 'text-mask',
      },
    ],
    forbidden: ['hover变颜色太跳', 'hover放大超过1.1倍'],
  },
};

/** 状态机定义（ACT0云海单门） */
const FSM_STATES = {
  idle: {
    name: '静止',
    description: '云海静止，门悬浮半空，等待用户交互',
    animations: ['cloud-idle', 'door-float'],
    transitions: {
      mousemove: 'cloud-disturb',
      click: 'growth-trigger',
      scroll: 'dive-swirl',
      drag: 'door-rotate',
    },
  },
  'cloud-disturb': {
    name: '扰动云海',
    description: '鼠标移动导致云海粒子轻微扰动',
    animations: ['cloud-disturb', 'cursor-glow'],
    transitions: {
      mouseleave: 'idle',
      click: 'growth-trigger',
      scroll: 'dive-swirl',
    },
    autoReturn: { delay: 1500, target: 'idle' },
  },
  'growth-trigger': {
    name: '生长触发',
    description: '点击触发光裂隙和苔藓生长',
    animations: ['crack-glow', 'moss-grow'],
    transitions: {
      complete: 'idle',
    },
    duration: 2500,
  },
  'door-rotate': {
    name: '门旋转',
    description: '拖拽门体围绕垂直轴旋转',
    animations: ['door-rotate-3d'],
    transitions: {
      dragend: 'idle',
    },
  },
  'dive-swirl': {
    name: '下潜旋流',
    description: '滚动导致镜头下潜，云雾金粉螺旋流动',
    animations: ['camera-dive', 'cloud-swirl', 'gold-particle-flow'],
    transitions: {
      scrollend: 'idle',
      deep: 'gate-open',
    },
    deepThreshold: 0.8,
  },
  'gate-open': {
    name: '心门打开',
    description: '下潜到极限触发门缓缓打开',
    animations: ['gate-open', 'light-burst'],
    transitions: {
      click: 'enter-new-world',
      complete: 'dive-swirl',
    },
    duration: 2000,
  },
  'enter-new-world': {
    name: '进入新境界',
    description: '点击打开的门，镜头穿透门扉进入下一世界',
    animations: ['camera-penetrate', 'scene-transition'],
    transitions: {
      complete: 'idle',
    },
    duration: 3000,
  },
};

/**
 * 主入口：根据用户动作生成东方意象交互方案
 * @param {string} action - 用户动作类型
 * @param {Object} context - 上下文（场景/当前状态/目标元素）
 * @returns {Object} 交互方案
 */
export function mapInteraction(action, context = {}) {
  const mapping = INTERACTION_MAP[action];
  if (!mapping) {
    return { error: `未知动作类型: ${action}`, supportedActions: Object.keys(INTERACTION_MAP) };
  }

  // 根据上下文选择合适的效果
  const suitableEffects = mapping.effects.filter(e => {
    if (!context.triggerZone) return true;
    return e.triggerZone === context.triggerZone || e.triggerZone === 'anywhere';
  });

  const selectedEffect = suitableEffects[0] || mapping.effects[0];

  return {
    action,
    actionName: mapping.name,
    easternIntent: mapping.easternIntent,
    selectedEffect,
    allEffects: mapping.effects,
    forbidden: mapping.forbidden,
    fsmTransition: getFsmTransition(context.currentState || 'idle', action),
    animationParams: selectedEffect.params,
    implementation: generateImplementation(action, selectedEffect, context),
  };
}

/**
 * 获取FSM状态转换
 */
function getFsmTransition(currentState, action) {
  const state = FSM_STATES[currentState];
  if (!state) return null;
  const nextState = state.transitions[action];
  if (!nextState) return null;
  return {
    from: currentState,
    fromName: state.name,
    to: nextState,
    toName: FSM_STATES[nextState]?.name || nextState,
    trigger: action,
  };
}

/**
 * 生成实现代码片段
 */
function generateImplementation(action, effect, context) {
  const templates = {
    mousemove: `// 鼠标移动 → 云海扰动
scene.addEventListener('mousemove', (e) => {
  const point = getMousePosition(e);
  cloudParticles.disturb(point, { radius: ${effect.params.radius}, strength: ${effect.params.strength} });
  cursorGlow.follow(point, { size: ${effect.params.size}, opacity: ${effect.params.opacity} });
});`,
    click: `// 点击 → ${effect.name}
scene.addEventListener('click', (e) => {
  const point = getMousePosition(e);
  ${effect.name === '裂隙发光' ? `ground.crack(point, { length: ${effect.params.crackLength}, glow: '${effect.params.glowColor}' });` : ''}
  ${effect.name === '苔藓生长' ? `moss.grow(point, { radius: ${effect.params.spreadRadius}, duration: ${effect.params.growDuration} });` : ''}
  ${effect.name === '门扉轻启' ? `door.open(${effect.params.openAngle}, { duration: ${effect.params.duration} });` : ''}
});`,
    scroll: `// 滚动 → ${effect.name}
scene.addEventListener('scroll', (progress) => {
  ${effect.name === '下潜旋流' ? `camera.dive(progress * ${effect.params.diveDepth});
  cloud.swirl({ speed: ${effect.params.swirlSpeed} });
  goldParticles.flow({ count: ${effect.params.particleCount} });` : ''}
  ${effect.name === '云雾流动' ? `cloud.flow({ speed: ${effect.params.flowSpeed}, parallax: ${effect.params.parallax} });` : ''}
});`,
    drag: `// 拖拽 → ${effect.name}
scene.addEventListener('dragstart', (e) => { dragState.active = true; });
scene.addEventListener('drag', (e) => {
  ${effect.name === '门体旋转' ? `door.rotation.y += e.deltaX * 0.01;
  door.rotation.y = clamp(door.rotation.y, -${effect.params.maxAngle}, ${effect.params.maxAngle});` : ''}
  ${effect.name === '视角环绕' ? `camera.orbit(e.deltaX, e.deltaY, { minPolar: ${effect.params.minPolarAngle}, maxPolar: ${effect.params.maxPolarAngle} });` : ''}
});
scene.addEventListener('dragend', () => { dragState.active = false; applyInertia(); });`,
    hover: `// 悬停 → ${effect.name}
element.addEventListener('mouseenter', () => {
  ${effect.name === '微光浮现' ? `element.glow({ size: ${effect.params.glowSize}, opacity: ${effect.params.opacity}, color: '${effect.params.color}' });` : ''}
  ${effect.name === '文字渐显' ? `text.reveal({ blurFrom: ${effect.params.blurFrom}, duration: ${effect.params.duration} });` : ''}
});
element.addEventListener('mouseleave', () => { element.reset(); });`,
  };

  return templates[action] || `// ${action} → ${effect.name}\n// 请参考 effect.params 实现`;
}

/** 获取完整FSM */
export function getFSM() {
  return {
    states: FSM_STATES,
    initialState: 'idle',
    transitions: Object.entries(FSM_STATES).map(([state, config]) => ({
      from: state,
      fromName: config.name,
      transitions: Object.entries(config.transitions).map(([trigger, to]) => ({
        trigger,
        to,
        toName: FSM_STATES[to]?.name || to,
      })),
    })),
  };
}

/** 获取所有支持的动作 */
export function listActions() {
  return Object.entries(INTERACTION_MAP).map(([key, m]) => ({
    action: key,
    name: m.name,
    easternIntent: m.easternIntent,
    effectCount: m.effects.length,
  }));
}
