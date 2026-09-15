# API 集成指南

## 1. 通用 API 接口

### 输入格式（JSON）

```json
{
  "scene": "ACT0_gate",
  "colors": ["#88C3EB", "#8B4513"],
  "materials": [
    {"type": "wood", "color": "#8B4513", "roughness": 0.6},
    {"type": "stone", "color": "#A9A9A9", "roughness": 0.9}
  ],
  "dimensions": {
    "width": 34, "height": 17,
    "humanHeight": 1.7, "buildingHeight": 17
  },
  "voidRatio": 0.65,
  "offsetPercent": 3,
  "design": {
    "context": "residential",
    "elements": ["cloud-pattern-bg"],
    "saturation": 45,
    "lighting": {"contrastRatio": 3.5}
  },
  "events": ["mouseMove", "click", "scroll"]
}
```

### 输出格式（JSON）

```json
{
  "timestamp": "2026-09-15T01:00:00.000Z",
  "scene": "ACT0_gate",
  "overall": {
    "pass": true,
    "score": 85,
    "p0Violations": 0,
    "p1Violations": 2
  },
  "colors": {
    "recommended": ["#E8E4D9", "#2C3E50", "#B8860B"],
    "violations": [
      {"color": "#88C3EB", "severity": "P1", "message": "饱和度65%超过60%阈值"}
    ]
  },
  "layout": {
    "centerAxis": true,
    "voidRatio": 0.65,
    "recommended": "宋韵清雅"
  },
  "materials": {
    "recommended": [
      {"type": "wood", "color": "#8B4513", "roughness": 0.6, "metalness": 0.0}
    ]
  },
  "effects": ["cloudDisturb", "mossGrow", "swirlDive"],
  "violations": [
    {"rule_id": "color", "severity": "P1", "message": "..."},
    {"rule_id": "taboo", "severity": "P0", "message": "..."}
  ],
  "chinesenessTest": {
    "score": 0.8,
    "pass": true,
    "message": "去掉表面元素后仍有80%东方结构特征"
  }
}
```

### CLI 调用

```bash
# 基本校验（Gate1-3结构检查）
node scripts/validate.js --scene ACT0_gate

# 带输入数据的完整校验
node scripts/validate.js --scene ACT0_gate --input input.json --output report.json

# 仅色彩校验
node scripts/validate.js --check color --colors '#FF0000,#8B2500'

# 仅比例校验
node scripts/validate.js --check proportion --width 34 --height 17
```

---

## 2. Impeccable 集成

### 安装
```bash
npx skills add git+https://github.com/hanjun88/chinese-aesthetic-skill.git
```

### 调用方式
在 Impeccable 对话中指定技能名称：

```
用中式美学设计 Skill 帮我设计 ACT0 云海+单门场景
```

或使用指令：
```
@ChineseAestheticSkill 应用中式配色和比例到当前设计
```

### 输出
Impeccable 会自动读取 skill.yaml 中的规则定义，在设计过程中应用约束，并在完成后输出校验报告。

---

## 3. Figma 集成

### 方式一：ChatGPT-Figma 插件
在 Figma 插件中发送：
```
@ChineseAestheticSkill 检查当前画板的中式美学合规性
```

### 方式二：Figma 插件命令
在插件面板中调用：
```
/applyChineseAesthetic
```
读取当前选中的设计元素，自动应用色彩/比例/布局约束。

### 方式三：手动校验
1. 导出设计稿的色值/尺寸/布局数据为 JSON
2. 运行 `node scripts/validate.js --input design.json`
3. 根据报告修正设计

### Figma 变量映射
| Skill 规则 | Figma 变量 |
|---|---|
| 五方正色 | Color Styles → `color/chinese/qing`, `color/chinese/chi`, ... |
| 比例 | Layout Grid → `grid/3-part`, `grid/√2` |
| 留白 | Spacing → `spacing/void-lg` (60%), `spacing/void-md` (40%) |
| 材质 | Effects → `effect/wood-grain`, `effect/stone-rough` |

---

## 4. Codex / Cursor / v0 集成

### 代码注释触发
在代码中使用特殊标签，Codex/Cursor 在生成代码时参考本 Skill：

```javascript
// @skill: chinese-aesthetic
// @rule: color, proportion, taboo
// @scene: ACT0_gate
function createGateScene() {
  // 生成的代码会自动应用中式美学约束
}
```

### CSS 变量模板
```css
/* @skill: chinese-aesthetic */
:root {
  /* 五方正色 */
  --color-qing: #2E7D32;
  --color-chi: #8B2500;
  --color-huang: #C4A35A;
  --color-bai: #E8E4D9;
  --color-hei: #1A1A2E;
  /* 点缀色 */
  --color-gold: #B8860B;
  /* 比例 */
  --ratio-√2: 1.414;
  --ratio-3part-base: 0.2;
  --ratio-3part-body: 0.5;
  --ratio-3part-roof: 0.3;
  /* 留白 */
  --void-ratio: 0.65;
}
```

### Three.js 材质模板
```javascript
// @skill: chinese-aesthetic
// @rule: material, light-shadow
const materials = {
  doorWood: new THREE.MeshStandardMaterial({
    color: 0x8B4513, roughness: 0.6, metalness: 0.0,
    map: woodTexture, normalMap: woodNormal
  }),
  floorStone: new THREE.MeshStandardMaterial({
    color: 0xA9A9A9, roughness: 0.9, metalness: 0.0
  }),
  cloudVolume: new THREE.ShaderMaterial({
    transparent: true, opacity: 0.5, depthWrite: false
  })
};
```

---

## 5. Floot 集成

### OpenAI Function Call
通过 Floot 的函数调用接口传递场景 JSON：

```javascript
// Floot function call
const response = await floot.callFunction({
  name: 'chinese_aesthetic_validate',
  parameters: {
    scene: 'ACT0_gate',
    colors: ['#88C3EB'],
    dimensions: { width: 34, height: 17 }
  }
});
// response 包含校验报告和改进建议
```

### 自动化约束
在 Floot 工作流中，将本 Skill 作为设计生成后的自动校验节点：
1. 设计工具输出设计 JSON
2. 自动调用 chinese-aesthetic_validate
3. P0 违规自动回退重新生成
4. P1 违规生成改进建议

---

## 6. img2threejs 集成

### 深度图/遮罩规范
img2threejs 生成 2.5D 效果时，使用本 Skill 输出的深度图和遮罩：

```
assets/ACT0/
├── depth.png          # 灰度深度图（门=白/前景，云海=黑/远景）
├── mask_door.png       # 门的遮罩（交互命中检测）
├── mask_cloud.png      # 云海遮罩（粒子扰动范围）
└── mask_ground.png     # 地面遮罩（苔藓生长范围）
```

### 材质参数传递
```javascript
// img2threejs 配置
const config = {
  depthMap: 'assets/ACT0/depth.png',
  masks: {
    door: 'assets/ACT0/mask_door.png',
    cloud: 'assets/ACT0/mask_cloud.png'
  },
  materials: {
    // 从 chinese-aesthetic-skill 输出的材质参数
    door: { color: '#8B4513', roughness: 0.6, metalness: 0.0 },
    ground: { color: '#A9A9A9', roughness: 0.9, metalness: 0.0 }
  },
  interactions: {
    'mask_cloud': { onMouseMove: 'cloudDisturb', onClick: 'mossGrow' },
    'mask_door': { onClick: 'cameraPenetrate', onDrag: 'doorRotate' }
  }
};
```

### 深度分层
| 层级 | 深度值 | 内容 |
|---|---|---|
| Layer 0（最远） | 1.0 | 天空/远景云海 |
| Layer 1 | 0.7 | 中景云海 |
| Layer 2 | 0.3 | 门体 |
| Layer 3（最近） | 0.1 | 前景云雾/金粉 |

---

## 7. 版本管理与回滚

### 语义化版本
```
v1.0.0 — 初始发布（10规则+ACT0规范+验证脚本）
v1.1.0 — 新增配色方案/规则优化（向后兼容）
v2.0.0 — 破坏性更新（规则接口变更，需迁移）
```

### 回滚策略
1. 版本更新前运行完整测试（116项）
2. 若视觉不一致或测试失败，回滚到前一稳定版本
3. Git tag 标记每个稳定版本
4. `git checkout v1.0.0` 快速回滚

### 测试钩子
- `pre-commit`: 运行 Gate1-3 测试
- `pre-push`: 运行完整校验+ACT0端到端测试
- CI/CD: 每次 PR 自动运行全部测试
