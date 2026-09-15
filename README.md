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
npx skills add git+https://github.com/HEARTMIRROR/chinese-aesthetic-skill.git

# 方式二：克隆到本地 skills 目录
git clone https://github.com/HEARTMIRROR/chinese-aesthetic-skill.git ~/.skills/chinese-aesthetic-skill
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
├── docs/                   # 设计说明文档
├── assets/
│   └── ACT0/               # ACT0 场景规范与素材
│       ├── master-plate.md
│       ├── material-params.md
│       ├── interaction-timeline.md
│       └── fsm.md
├── tests/                  # 验证脚本
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
