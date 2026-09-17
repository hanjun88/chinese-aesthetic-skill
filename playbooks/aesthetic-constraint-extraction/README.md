# CA-PB-001: 中式美学设计约束提取

## Purpose

将设计意图转化为可执行、可验证的美学约束包，严格区分四层：设计意图（纯描述）→ 视觉约束（可观察特征）→ 实现参数（具体数值）→ 验收指标（可测量标准）。约束包可直接被 design-compiler 消费。

## Trigger

- 新场景设计启动时
- 设计意图需要转化为技术参数时
- 资产规范需要明确时
- 审美验收标准需要建立时

## Inputs

- 设计意图描述文件（文字、参考图、风格关键词）
- HeartMirror 既定设计语言
- 场景类型和用途
- 技术约束（分辨率、格式、运行时能力）

## Preconditions

- 设计意图已明确表达（文件存在且非空）
- HeartMirror 设计语言文档可查阅
- 场景类型和核心情感已定义（在 HeartMirror 枚举中）
- 工具链可用：jq / sha256sum / stat / mktemp / grep

## Success Criteria

| ID | 标准 | 对应 AC | 对应 Procedure Step |
|---|---|---|---|
| SC-1 | 设计意图明确，场景类型和核心情感在枚举中 | AC-1.1 ~ AC-1.3 | Step 1 |
| SC-2 | HeartMirror 色彩六角色完整，主色调和光照方向已指定 | AC-2.1 ~ AC-2.4 | Step 2 |
| SC-3 | 视觉约束可观察，五层（色彩/材质/光照/构图/细节）完整，无具体色值 | AC-3.1 ~ AC-3.3 | Step 3 |
| SC-4 | 实现参数具体可执行，无主观描述（占位符检查在 Step 8，模板阶段允许占位符） | AC-4.1 ~ AC-4.4 | Step 4 |
| SC-5 | 验收指标可测量，每项有检测方法和阈值，无模糊词 | AC-5.1 ~ AC-5.4 | Step 5 |
| SC-6 | 禁用倾向明确可检测，每项有检测方法和阈值 | AC-6.1 ~ AC-6.4 | Step 6 |
| SC-7 | 四层分离清晰，无跨层污染，独立复核报告已留存 | AC-7.1 ~ AC-7.5 | Step 7 |
| SC-8 | 约束包已合并生成，SHA-256 已计算，证据完整归档 | AC-8.1 ~ AC-8.4 | Step 8 |

## Outcome

PASS / TEMPLATE / FAIL / BLOCKED_ENV / NOT_RUN

- **PASS**：四层分离清晰，所有占位符已填充，约束包可直接交付 design-compiler 消费
- **TEMPLATE**：四层分离清晰，模板生成成功，但含未填充占位符（可交付设计团队填充，填充后重新运行可达 PASS）
- BLOCKED_ENV 和 NOT_RUN 永不报告为 PASS；TEMPLATE 不等于 PASS
