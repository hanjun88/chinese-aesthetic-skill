# Chinese Aesthetic Design Skill

> 为 HEARTMIRROR Act 0 提供中式传统建筑与美学的可执行约束。不是"贴中国元素"，是从结构层面回答"这个设计为什么是中国的"。

## 定位

本 Skill 嵌入设计管线：

```
finesse-brief（需求规格）
  → chinese-aesthetic-skill（中式美学约束）← 本 Skill
    → finesse-skill（界面设计执行）
      → frame-smith（动效执行）
        → finesse-term（术语对齐）
```

## 安装

```bash
# 方式一：Impeccable / CLI
npx skills add git+https://github.com/hanjun88/chinese-aesthetic-skill.git

# 方式二：克隆到本地 skills 目录
git clone https://github.com/hanjun88/chinese-aesthetic-skill.git ~/.skills/chinese-aesthetic-skill

# 方式三：npm 包（Node.js 项目中直接 import）
npm install github:hanjun88/chinese-aesthetic-skill
```

## 使用方法（快速开始）

### 对话调用

```
@ChineseAestheticSkill 请根据当前 ACT0 云海+单门场景，应用中式配色、比例和交互规则
```

### API 调用

```json
// 输入
{
  "scene": "ACT0_gate",
  "colors": ["#88C3EB"],
  "materials": [{"type": "wood", "color": "#8B4513"}],
  "events": ["mouseMove", "click", "scroll"],
  "dimensions": {"width": 1920, "height": 1080}
}
```

```json
// 输出
{
  "colors": ["#DA291C", "#F5DEB3", "#4A5568"],
  "layout": {"centerAxis": true, "voidRatio": 0.65},
  "materials": [{"type": "wood", "color": "#8B4513", "roughness": 0.7}],
  "effects": ["cloudDisturb", "mossGrow", "swirlDive"],
  "violations": [{"rule_id": "color", "severity": "P0", "message": "主色#88C3EB偏离五方正色范围"}],
  "score": 72
}
```

## 核心引擎（8个可执行决策引擎）

本 Skill 的核心不是规则手册，是**可执行的决策引擎**。每个引擎输入设计参数，输出判定结果或生成方案。

```javascript
import { chineseness, clicheDetector, colorEngine, fullAssessment } from 'chinese-aesthetic-skill';

// 1. 判定"这个设计为什么是中国的"（10维评分 + 结构东方性测试）
const result = chineseness.assessChineseness({
  voidRatio: 0.65,
  colors: ['#E8E4D9', '#2C3E50', '#B8860B'],
  brightnessRatio: 4,
  buildingToHumanRatio: 10,
});
console.log(result.score, result.level, result.coreAnswer);
// → 76, "authentic", "这个设计是中国的，主要因为留白≥50%、不完整入画..."

// 2. 反俗套检测（国潮贴图/古装影视/仿古景区/AI国风）
const cliches = clicheDetector.detectCliches({
  patternCoverage: 0.25,
  colors: ['#FF0000', '#FFD700'],
});
// → { overallScore: 0.78, clicheTypes: ['guochao','guzhuang','fanggu','aiGuofeng'] }

// 3. 生成配色方案（五方正色 + 君臣佐使70:20:10）
const scheme = colorEngine.generateColorScheme({ preset: 'act0-cloud-gate' });
// → { colors: { main: '#E8E4D9', secondary: '#2C3E50', accent: '#B8860B' }, ratio: {...} }

// 4. 一站式综合评估（运行所有8个引擎）
const full = fullAssessment(design);
// → { overallScore: 91, level: 'authentic', engines: {...}, recommendations: [...] }
```

| 引擎 | 核心能力 | 输入 → 输出 |
|---|---|---|
| **chineseness** | "为什么是中国的"判定 | 设计参数 → 10维评分(0-100) + 结构东方性测试 + 核心回答 |
| **clicheDetector** | 四类俗套自动检测 | 设计参数 → 俗套类型 + 评分 + 违规项 + 修复建议 |
| **spatialEngine** | 空间秩序生成器 | 场景类型/尺寸 → 中轴/开间/层级/尺度/进深/虚实分配 |
| **colorEngine** | 色彩决策器 | 场景/情绪 → 五方正色选择 + 君臣佐使比例 + HEX色值 |
| **lightEngine** | 光影决策器 | 时间/场景 → 光源类型/角度/强度 + 阴影 + 体积光 + 暗部色 |
| **interactionEngine** | 交互语义映射器 | 用户动作 → 东方意象响应 + 动画参数 + FSM状态转换 |
| **proportionEngine** | 比例校验与生成器 | 尺寸参数 → √2/三段式/出檐/巨构比例合规性 + 推荐值 |
| **materialEngine** | 材质决策器 | 元素类型 → PBR材质参数(color/roughness/metalness) + 风化包浆 |

### 引擎测试

```bash
npm test
# → 74 passed, 0 failed
```

## 目录结构

```
chinese-aesthetic-skill/
├── skill.yaml              # Skill 元数据与接口规范
├── README.md               # 本文件
├── guidelines/             # 10条核心美学规则（P0/P1 判定）
│   ├── spatial-order.md    # 空间秩序
│   ├── void-solid.md       # 虚实关系
│   ├── proportion.md       # 比例
│   ├── material.md         # 材料与质感
│   ├── light-shadow.md     # 光影布局
│   ├── color.md            # 色彩体系
│   ├── motion.md           # 运动动势
│   ├── time.md             # 时间感
│   ├── taboo.md            # 禁忌
│   └── interaction.md      # 交互语义
├── modules/                # 可执行实现模块
│   ├── spatial.md          # 轴线计算与布局
│   ├── void_solid.md       # 虚实比例检测
│   ├── proportion.md       # 比例校验
│   ├── material.md         # 材质参数推荐
│   ├── light_shadow.md     # 光照方案
│   ├── color.md            # 色彩校验与推荐
│   ├── motion.md           # 动效方案
│   ├── time.md             # 时间变化方案
│   ├── taboo.md            # 禁忌检测
│   └── interaction.md      # 交互编排
├── lib/                    # ★ 核心引擎（可执行代码）
│   ├── index.js            # 统一入口 + fullAssessment 一站式评估
│   ├── chineseness.js      # "为什么是中国的"判定引擎（10维评分+结构东方性测试）
│   ├── cliche-detector.js  # 反俗套检测引擎（四类俗套）
│   ├── spatial-engine.js   # 空间秩序生成器（中轴/开间/层级/尺度/进深）
│   ├── color-engine.js     # 色彩决策器（五方正色+君臣佐使）
│   ├── light-engine.js     # 光影决策器（天光/漏光/侧光/体积光）
│   ├── interaction-engine.js # 交互语义映射器（动作→意象+FSM）
│   ├── proportion-engine.js # 比例校验与生成器（√2/三段式/出檐/巨构）
│   ├── material-engine.js  # 材质决策器（PBR参数+风化包浆）
│   └── utils/              # 工具函数（色彩转换/数学计算）
├── docs/                   # 设计说明文档
├── assets/
│   └── ACT0/               # ACT0 场景规范与素材
│       ├── master-plate.md
│       ├── material-params.md
│       ├── interaction-timeline.md
│       └── fsm.md
├── tests/                  # 验证脚本
│   ├── engines.test.js     # ★ 8个核心引擎集成测试（74项）
│   ├── gate1-structure.test.js
│   ├── gate2-rules.test.js
│   └── gate3-algorithm.test.js
└── scripts/
    └── validate.js         # 规则校验 CLI
```

## 十大核心规则

| # | 规则 | 优先级 | 一句话 |
|---|---|---|---|
| 1 | 空间秩序 | P0 | 中轴为骨，层级递进，偏移>10%判FAIL |
| 2 | 虚实关系 | P0 | 留白≥30%，虚大于实 |
| 3 | 比例 | P0 | 方五斜七(√2)，偏差>10%判FAIL |
| 4 | 材料 | P1 | 木石土金纸的真实感，禁塑料感 |
| 5 | 光影 | P1 | 柔光分层，禁硬光斑和聚光灯 |
| 6 | 色彩 | P0 | 五方正色体系，禁霓虹色 |
| 7 | 动势 | P1 | 云流旋生长，禁弹跳粒子特效 |
| 8 | 时间感 | P1 | 风化昼夜变化，禁全程静止 |
| 9 | 禁忌 | P0 | 禁皇家符号滥用、禁廉价感 |
| 10 | 交互语义 | P0 | 鼠标扰动云海、点击生长、滚动下潜 |

## ACT0 示例：云海+单门

详见 [`assets/ACT0/master-plate.md`](assets/ACT0/master-plate.md)。

核心参数：
- 门材质：乌木 #8B4513，半光，无金属感
- 地面：青石板 #A9A9A9，roughness=0.9
- 云雾：半透明白粒子，opacity=0.5
- 色彩：蔚蓝(天)、乳白(云)、檀木红(门)、墨灰(基座)
- 交互：鼠标移动→扰动云海；点击→裂隙发光苔藓生长；滚动→下潜旋流

## 验收流程（Gate1-Gate5）

| Gate | 类型 | 检查内容 |
|---|---|---|
| Gate1 | 自动 | 仓库结构与文档完整性 |
| Gate2 | 自动+人工 | 模块文件与规则完整性（≥10规则） |
| Gate3 | 自动 | 规则算法与示例可执行 |
| Gate4 | 集成 | UI/动效集成验证（ACT0场景） |
| Gate5 | 人工 | 用户验收与审美评估（≥80%满意） |

运行验证：
```bash
node scripts/validate.js --scene ACT0_gate
npm test
```

## 贡献

1. Fork 仓库
2. 创建特性分支
3. 确保 `npm test` 通过
4. 提交 PR

更新规则前请先运行验证脚本，确保不破坏现有规则判定。

## 参考来源

- CGTN「大唐营造」交互展
- 佛光寺东大殿考证资料（林徽因、梁思成）
- 王南《营造天书》古建比例研究
- 《华夏意匠：中国古典建筑设计原理分析》
- 《营造法式》（宋·李诫）
- Three.js 官方文档
- img2threejs 文档
- mouse-lin/finesse-brief, finesse-skill, frame-smith, finesse-term

## License

MIT
