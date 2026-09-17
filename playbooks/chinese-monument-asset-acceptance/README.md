# CA-PB-003: 中式巨构场景资产验收

## Purpose

验证场景资产是否满足中式巨构视觉与技术要求，确保主体尺度、建筑结构、材质光影、空间纵深和视差层级符合设计规范。建立标准化的资产验收流程，结合自动化技术检查与人/AI 视觉质量检查。

## Trigger

- 新场景资产生成后
- 资产入库前
- Golden Case 验证阶段
- 运行时集成前

## Inputs

- 场景资产文件（主图、深度图、遮罩、分层图）
- 场景配置（scene.json 或等效，可选）
- 资产清单（manifest.json，可选）
- 视觉检查记录（VISUAL_INSPECTION_FILE，JSON，含 7 个维度的 verdict+evidence）
- 设计约束文档（来自 CA-PB-001）
- 技术规格（分辨率、格式、命名规范）

## Preconditions

- 资产文件已生成并落盘
- 设计约束已提取（CA-PB-001 已通过）
- 技术规格已明确
- 视觉检查记录已由人或 AI 视觉模型完成（VISUAL_INSPECTION_FILE 存在且合法）

## Success Criteria

| ID | 标准 | 对应 AC | 对应 Procedure Step |
|---|---|---|---|
| SC-1 | 技术规格符合（分辨率/格式/命名/大小） | AC-1.1 ~ AC-1.7 | Step 1 |
| SC-2 | 主体尺度宏大、有压迫感、有尺度参照 | AC-2.1 ~ AC-2.2 | Step 2 |
| SC-3 | 建筑结构合理，非装饰性纹理堆砌 | AC-3.1 ~ AC-3.2 | Step 3 |
| SC-4 | 材质纹理符合中式美学（木、石、金、玉） | AC-4.1 ~ AC-4.2 | Step 4 |
| SC-5 | 光影层次分明，有方向性和氛围 | AC-5.1 ~ AC-5.2 | Step 5 |
| SC-6 | 空间纵深充足，非平面背景 | AC-6.1 ~ AC-6.2 | Step 6 |
| SC-7 | 视觉焦点明确，视线引导清晰 | AC-7.1 ~ AC-7.2 | Step 7 |
| SC-8 | 色彩系统符合 HeartMirror，低饱和温润 | AC-8.1 ~ AC-8.2 | Step 8 |
| SC-9 | 视差层级与深度图一致（16-bit） | AC-9.1 ~ AC-9.4 | Step 9 |
| SC-10 | 资产命名规范、格式正确、与 scene.json/manifest 对应 | AC-10.1 ~ AC-10.5 | Step 10 |

## Outcome

PASS / FAIL / BLOCKED_ENV / NOT_RUN

- BLOCKED_ENV 和 NOT_RUN 永不报告为 PASS
- PASS 时资产可入库和进入运行时集成
- 视觉检查必须有实际证据（VISUAL_INSPECTION_FILE 每个维度 evidence 非空），禁止信任生成工具自我声明
