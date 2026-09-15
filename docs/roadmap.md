# 后续任务路线图

## 任务总览

| # | 任务 | 负责人 | 工时 | 优先级 | 验收标准 | 状态 |
|---|---|---|---|---|---|---|
| 1 | Skill 基础框架搭建 | 技术负责人 | 8h | P0 | 仓库结构符合规范，README和skill.yaml包含必需字段 | ✅ 已完成 |
| 2 | 编写核心规则文档 | 内容负责人/中式建筑专家 | 24h | P0 | 10个规则文档各≥500字，有目的/指标/示例，同事评审通过 | ✅ 已完成 |
| 3 | 开发规则验证脚本 | 前端开发 | 16h | P0 | `npm test`通过率≥90%，针对输入示例返回正确判定 | ✅ 已完成（Gate1-3，116项全通过） |
| 4 | 集成 Skill 至 Pipeline | 全栈开发 | 16h | P1 | 调用示例（ACT0 JSON）输出符合格式的建议，前端效果接入无错误 | ⏳ 进行中 |
| 5 | 完善示例与README | UI设计师/文档专员 | 12h | P1 | ACT0示例可复现，README安装/使用说明正确 | ⏳ 待开始 |

---

## 任务4：集成 Skill 至 Pipeline（16h）

### 目标
将 chinese-aesthetic-skill 嵌入 finesse-brief → finesse-skill → frame-smith 设计管线，实现自动化美学约束。

### 子任务

| 子任务 | 工时 | 负责人 | 验收标准 |
|---|---|---|---|
| 4.1 finesse-brief 集成 | 3h | 全栈开发 | finesse-brief 输出的 spec.md 中包含 `aesthetic_constraints` 字段，由本 Skill 生成 |
| 4.2 finesse-skill 集成 | 4h | 全栈开发 | finesse-skill 读取 aesthetic_constraints，在 UI 设计中自动应用色彩/比例/材质约束 |
| 4.3 frame-smith 集成 | 3h | 全栈开发 | frame-smith 读取动势约束，在视频动效中应用云水烟风光运动原型 |
| 4.4 finesse-term 术语对齐 | 2h | 全栈开发 | 本 Skill 的术语（界/虚实/举折/出檐等）在 finesse-term 中可查 |
| 4.5 端到端测试 | 4h | 全栈开发 | 从 finesse-brief 输入一句话到最终 UI/动效输出，全流程美学约束生效 |

### 依赖
- 任务1-3完成（已完成）
- finesse-brief/finesse-skill/frame-smith/finesse-term 四个仓库已克隆

### 风险
- 四个 Skill 的接口格式可能不兼容 → 先做接口适配层
- 美学约束可能与 finesse-skill 的 anti-slop 规则冲突 → 优先级：本 Skill P0 > finesse-skill 规则

---

## 任务5：完善示例与README（12h）

### 目标
补充 ACT0 完整示例素材（深度图、效果图、可运行demo），完善 README 和文档。

### 子任务

| 子任务 | 工时 | 负责人 | 验收标准 |
|---|---|---|---|
| 5.1 ACT0 效果图生成 | 3h | UI设计师 | 生成3张以上 ACT0 云海+单门效果图（不同光照/色彩方案） |
| 5.2 ACT0 深度图/遮罩制作 | 2h | UI设计师 | depth.png/mask_door.png/mask_cloud.png/mask_ground.png 四张图 |
| 5.3 ACT0 可运行Demo | 4h | 前端开发 | Three.js 可运行 demo，包含5种交互（鼠标扰动/点击生长/拖拽旋转/滚动下潜/点击穿门） |
| 5.4 README 完善 | 2h | 文档专员 | 安装/使用/API/示例/贡献指南完整，截图/动图展示 |
| 5.5 文档站/GitHub Pages | 1h | 文档专员 | docs/ 目录可通过 GitHub Pages 访问 |

### 依赖
- 任务4完成（Demo需要管线集成）

### 交付物
- `assets/ACT0/renderings/` — 效果图
- `assets/ACT0/depth.png` 等 — 深度图/遮罩
- `demo/` — 可运行 Three.js demo
- GitHub Pages 文档站

---

## 任务6（新增）：唐代建筑能力卡集成（8h）

### 目标
将 tang-architecture Skill 的15个能力卡（方五斜七比例法、举折曲线计算法、三朝制宫殿分区等）集成到本 Skill 的比例/建筑/彩画规则中。

### 子任务
| 子任务 | 工时 | 验收标准 |
|---|---|---|
| 6.1 比例规则增强 | 2h | proportion.md 引用方五斜七√2作图法、佛光寺1:2比例实测数据 |
| 6.2 建筑规则增强 | 3h | architecture相关规则引用三段式、举折曲线、出檐采光平衡法 |
| 6.3 彩画规则增强 | 1h | color.md 引用七朱八白标准化彩画法 |
| 6.4 交叉验证 | 2h | 唐代建筑能力卡的参数与本 Skill 规则一致，无矛盾 |

---

## 任务7（新增）：7位博主创作实践校准（6h）

### 目标
将7位东方美学博主（Lumax MJ/晓白ALEX/设计师陈欢/异创视界/书香Design/Paul W/RAN design）的创作实践校准到本 Skill 规则中。

### 子任务
| 子任务 | 工时 | 验收标准 |
|---|---|---|
| 7.1 色彩方案校准 | 2h | color.md 增加4套博主验证配色（国色单色/红金绿/紫金/青绿山水） |
| 7.2 反俗套校准 | 2h | taboo.md 增加7位博主验证禁忌表（12条HARD FAIL） |
| 7.3 光影校准 | 1h | light-shadow.md 增加月光法（晓白ALEX标志性手法） |
| 7.4 建筑校准 | 1h | architecture相关规则增加京派/徽派巨构块面转译法 |

---

## 里程碑

| 里程碑 | 时间 | 交付物 |
|---|---|---|
| M1: 框架+规则+验证 | 已完成 | 仓库+10规则+116项测试 |
| M2: 管线集成 | 任务4完成 | finesse-brief→本Skill→finesse-skill→frame-smith 全流程 |
| M3: 示例+Demo | 任务5完成 | ACT0效果图+深度图+可运行Demo+文档站 |
| M4: 学术+实践校准 | 任务6+7完成 | 唐代建筑15能力卡+7位博主实践全部集成 |
| M5: v1.0 发布 | 全部完成 | GitHub Release + npm 发布 + 完整文档 |
