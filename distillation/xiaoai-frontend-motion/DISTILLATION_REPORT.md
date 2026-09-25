# 小艾不迟到(AIGC) 前端动效系列 — 视频蒸馏报告

**博主**: 小艾不迟到（AIGC）（抖音 @811209729）
**粉丝/获赞**: 449 / 4908
**博主定位**: 大厂离职产品经理，文科生勇闯AI自媒体，Vibe Coding / 前端动效日更
**素材**: 11个抖音视频（前端动效/交互设计类），234帧关键帧，77段动效片段
**主题**: 前端动效 / 交互设计 / 3D画廊 / 粒子系统 / 作品集
**蒸馏日期**: 2026-09-25
**规范**: DISTILLATION_SPEC_v2.0 + frontend_motion/interaction/tech_stack 扩展维度

---

## 一、素材清单

| # | 标题 | 时长(s) | 分辨率 | 核心动效 | 技术栈(top2, 置信度) | 背景色 | 交互 | 置信度 |
|---|---|---|---|---|---|---|---|---|
| 01 | 绽放与变化的动效网页 | 18.4 | 1920x1080 | pink_peduncle_bud_to_bloom | HTML/CSS(0.9); Three.js(0.72) | #FFFFFF | scroll/autoplay | 0.72 |
| 02 | 3D图片球体动效教程 | 49.1 | 1024x576 | auto_rotate_y | Vite(0.95); Fibonacci Sphere(0.85) | #FFFFFF | drag | 0.78 |
| 03 | 环绕动效画廊教程 | 48.7 | 1280x720 | intro_card_converge_and_scale_in | CSS3D(0.95); Vanilla JS(0.9) | #FFFFFF | mouse_wheel | 0.78 |
| 04 | 公式、引力与黑洞 | 21.4 | 1024x576 | accretion_disk_keplerian_rotation | Three.js(0.9); GLSL GPU Compute(0.85) | #000000 | autoplay | 0.82 |
| 05 | 3D拍立得相机 | 15.2 | 1280x720 | idle_camera_orbit_rotate | Three.js(0.95); GSAP(0.9) | #FFFFFF | click/drag/tab | 0.82 |
| 07 | 丝滑的图片展览 | 18.1 | 1024x576 | intro_cards_scatter | CSS3D(0.92); GSAP(0.7) | #FFFFFF | click+drag | 0.82 |
| 08 | WebGL沉浸式动态画廊 | 18.7 | 1024x576 | intro-single-card-to-strip | Three.js(0.95); GLSL shader(0.9) | #FFFFFF | hover+autoplay | 0.72 |
| 09 | 胶片打开交互作品 | 21.2 | 1280x720 | film_strip_horizontal_intro | Three.js(0.88); GSAP+ScrollTrigger(0.82) | #FFFFFF | scroll | 0.78 |
| 10 | 图片动效 | 18.4 | 1024x576 | tunnel_morph_in | Three.js(0.85); Textured Planes(0.8) | #F2F2F2 | scroll | 0.78 |
| 11 | 作品集网站 | 23.9 | 1280x720 | panel_parallax_scroll | GSAP(0.85); ScrollTrigger(0.8) | #E9E9EC | scroll | 0.75 |
| 12 | GSAP 3D旋转卡片 | 15.3 | 1280x720 | fan-assembly-autoplay-rotateY | GSAP(0.95); CSS3D(0.92) | #FFFFFF | hover | 0.78 |

---

## 二、技术栈推断

### 三大技术路线
| 路线 | 覆盖 | 平均置信度 | 特征 |
|---|---|---|---|
| Three.js/WebGL系 | 10/11 | 0.705 | 实时3D几何体、PBR材质、相机轨道、粒子系统 |
| GSAP/CSS3D系 | GSAP 9/11; CSS3D 5/11 | 0.758/0.778 | 时间线编排、stagger、scroll-scrub、卡片3D翻转 |
| 纯DOM/Scroll系 | Vanilla JS 3/11 | 0.883 | rAF/CSS transform做UI层动效，性能轻 |

### 次要栈
Vite 7/11, React 8/11, ScrollTrigger 5/11, GLSL shader 4/11, postprocessing 3/11, Lenis 2/11

---

## 三、动效参数黄金法则（77段motion提炼）

### 时长参数
| 参数 | 推荐值 | 样本数 |
|---|---|---|
| 全局duration中位数 | 900ms | 76段 |
| autoplay段duration中位数 | 1200ms | 46段 |
| click段duration中位数 | 600ms | 9段 |
| hover段duration中位数 | 400ms | 7段 |
| scroll段duration中位数 | 950ms | 8段 |
| stagger中位数 | 60ms（范围20-200ms） | 27段 |

### 缓动函数分布
| easing | 出现次数 | 适用场景 |
|---|---|---|
| power2 | 23 | 通用入场/出场 |
| linear | 13 | 循环/进度条/恒速驱动 |
| power3 | 11 | 绽放/展开类入场 |
| expo | 10 | 大幅度位移 |
| sine.inOut | 3 | 颜色morph |

### 变换参数
- scale入场：0.05/0.1 → 1.0；hover：1.0→1.2；lightbox：1.0→4.0
- rotateY hover tilt：0→20deg；rotateX：0→12deg；translateZ：+30px
- hover进入/退出时长比：enter ~430ms / exit ~700ms（exit慢1.5x）

### 惯性参数
- drag damping：0.95/frame
- wheel inertia：0.94
- strip lerp：0.1
- velocity<0.001触发idle恢复，settle 500ms

---

## 四、色彩体系

### 基底哲学
- **11/11 共享 `#FFFFFF` paper-white 基底**——编辑级、画廊式、留白充足的白底美学
- 8/11 纯 `#FFFFFF` 背景，2/11 浅灰 `#F2F2F2`/`#E9E9EC`
- 点缀色面积 <15%，集中在主体本身（花瓣、书脊、图片、材质高光）
- 文字色：主文字 `#1A1A1A`（7/11），次要 `#888888`
- 色温：10/11 为 6500K 中性日光白

### 唯一暗色例外
视频04《公式、引力与黑洞》是唯一黑底 `#000000`，配合 `#FFE8B0/#D4A855/#FFD9A0` 金色辉光（bloom_strength 1.8）。这是主题驱动的例外，不应作为默认。

### 渐变
0个页面级渐变；渐变仅用于粒子尾迹（04吸积盘）和接触阴影（02海报球体）。

---

## 五、交互模式

### 触发方式分布
| 触发 | 覆盖 | 说明 |
|---|---|---|
| autoplay | 11/11 | 全部有自动播放循环作为基底 |
| drag | 6/11 | 拖拽旋转/平移，带惯性 |
| scroll | 5/11 | 滚动驱动时间线/视差 |
| hover | 5/11 | 悬停tilt/放大/变色 |
| click | 4/11 | 点击切换/展开 |
| mouse_move | 3/11 | 鼠标跟随视差 |

### 反馈形式
视觉scale（9视频）> 位移displacement（7）> 颜色变化（5）> 3D tilt（4）> 进度指示（3）> 光标变化（3）

**音频反馈：0/11**（全部无声）

### 可访问性现状
**严重缺失**。仅05号（3D拍立得相机）同时具备键盘导航、prefers-reduced-motion降级、ARIA标签、焦点管理。其余10/11缺少reduced-motion fallback，8/11纯鼠标无键盘。

---

## 六、可复用参数（直接填入GSAP/Three.js）

```json
{
  "motion": {
    "duration_ms": { "global_median": 900, "autoplay": 1200, "click": 600, "hover": 400, "scroll": 950 },
    "stagger_ms": 60,
    "easing": { "default": "power2.out", "entrance": "power3.out", "loop": "linear", "color_morph": "sine.inOut" },
    "hover": { "enter_ms": 430, "exit_ms": 700, "exit_slower_ratio": 1.5, "rotateY_deg": 20, "rotateX_deg": 12, "translateZ_px": 30, "scale": 1.2 },
    "inertia": { "drag_damping": 0.95, "wheel_inertia": 0.94, "lerp": 0.1, "settle_ms": 500 }
  },
  "color": {
    "background": "#FFFFFF",
    "text_primary": "#1A1A1A",
    "text_secondary": "#888888",
    "accent_area_ratio": 0.15,
    "color_temp_k": 6500,
    "page_gradient": false
  },
  "tech_stack": {
    "primary": ["Three.js", "GSAP"],
    "secondary": ["CSS3D", "ScrollTrigger", "Vanilla JS"],
    "build": "Vite",
    "framework": "React"
  },
  "interaction": {
    "base": "autoplay_loop",
    "supported": ["drag", "scroll", "hover", "click"],
    "audio": false,
    "accessibility": "needs_work"
  }
}
```

---

## 七、素材文件

- `keyframes/` — 22张精选关键帧（每视频2张）
- `motion-tech-stack.json` — 技术栈推断矩阵
- `color-visual-system.json` — 色彩视觉体系
- `interaction-patterns.json` — 交互模式聚合
- `motion.constraints.json` — 动效约束参数
- `interaction.constraints.json` — 交互约束参数
- `color.constraints.json` — 色彩约束参数
