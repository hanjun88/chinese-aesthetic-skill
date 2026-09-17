# CA-PB-004: HeartMirror 视觉一致性审查

## Purpose

检查不同场景、资产和运行阶段是否保持统一的 HeartMirror 产品视觉语言，防止风格漂移。通过 CONSISTENCY_REVIEW_FILE 标准化跨场景对比记录，结合客观参数自动化校验，确保 7 个一致性维度有可复核证据。

## Trigger

- 新场景资产完成后
- 多场景对比审查时
- 运行时集成前后
- 版本发布前
- 跨代理交接时

## Inputs

- SCENE_DIRS：待审查的场景目录列表（冒号分隔，至少 2 个）
- CONSISTENCY_REVIEW_FILE：一致性审查记录文件（JSON，含 7 维度 verdict+evidence+comparison）
- GOLDEN_CASE_DIR：Golden Case 参考目录
- DESIGN_LANGUAGE_DOC：HeartMirror 设计语言文档（可选）
- CONSTRAINT_DOC：设计约束文档（来自 CA-PB-001，可选）

## Preconditions

- 待审查资产已生成
- HeartMirror 设计语言已定义
- Golden Case 参考已建立
- CONSISTENCY_REVIEW_FILE 已由人或 AI 视觉模型填写

## Success Criteria

| ID | 标准 | 对应 AC | 对应 Procedure Step |
|---|---|---|---|
| SC-1 | 输入参数完整、Golden Case 存在、工具链可用 | AC-0.1 ~ AC-0.5 | Phase 0 |
| SC-2 | 场景清单完整（≥2 场景）、必需资产齐全、命名合规 | AC-1.1 ~ AC-1.6 | Step 1 |
| SC-3 | CONSISTENCY_REVIEW_FILE 结构合法，7 维度齐全且有 evidence+comparison | AC-2.1 ~ AC-2.7 | Step 2 |
| SC-4 | 色彩空间一致、六色体系角色统一、无高饱和荧光色 | AC-3.1 ~ AC-3.5 | Step 3 |
| SC-5 | 深度图位深统一、同类物体材质处理一致、无非中式材质 | AC-4.1 ~ AC-4.4 | Step 4 |
| SC-6 | 同类型场景光源方向/色温/阴影一致 | AC-5.1 ~ AC-5.4 | Step 5 |
| SC-7 | 分辨率有效、宽高比统一、视角/焦点合规 | AC-6.1 ~ AC-6.5 | Step 6 |
| SC-8 | 相邻场景无突兀风格跳变、美学特质组合一致 | AC-7.1 ~ AC-7.3 | Step 7 |
| SC-9 | 入境仪式叙事连贯、多宇宙入口风格统一、转场资产齐全 | AC-8.1 ~ AC-8.4 | Step 8 |
| SC-10 | 动态转场与静态资产视觉协调、动画效果合规 | AC-9.1 ~ AC-9.3 | Step 9 |
| SC-11 | 所有问题已分类（美学/技术/资产/叙事）、有证据、无阻断级问题 | AC-10.1 ~ AC-10.5 | Step 10 |

## Outcome

PASS / FAIL / BLOCKED_ENV / NOT_RUN

- BLOCKED_ENV 和 NOT_RUN 永不报告为 PASS
- PASS 时可签发 CONSISTENCY_SEALED
