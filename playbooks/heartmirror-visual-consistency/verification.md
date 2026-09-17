# Verification: HeartMirror 视觉一致性审查

## 验收标准（Acceptance Criteria）

### AC-0: 输入验证与工具链（对应 Phase 0）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-0.1 | 必填参数已设置 | SCENE_DIRS / CONSISTENCY_REVIEW_FILE / GOLDEN_CASE_DIR 均非空 | 任一缺失 → BLOCKED_ENV | PARAM_MISSING (BLOCKED_ENV) |
| AC-0.2 | 审查文件存在 | CONSISTENCY_REVIEW_FILE 存在且可读 | 不存在 → BLOCKED_ENV | CONSISTENCY_REVIEW_FILE_NOT_FOUND (BLOCKED_ENV) |
| AC-0.3 | Golden Case 存在 | GOLDEN_CASE_DIR 目录存在 | 不存在 → BLOCKED_ENV | GOLDEN_CASE_NOT_FOUND (BLOCKED_ENV) |
| AC-0.4 | 设计语言文档可查阅（如提供） | DESIGN_LANGUAGE_DOC 存在 | 不存在 → BLOCKED_ENV | DESIGN_LANGUAGE_DOC_NOT_FOUND (BLOCKED_ENV) |
| AC-0.5 | 工具链完整 | jq / ffprobe / sha256sum / stat / mktemp / grep / find / wc / sort 均可用 | 任一缺失 → BLOCKED_ENV | TOOL_MISSING (BLOCKED_ENV) |

### AC-1: 审查基准建立与场景清单（对应 Step 1）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-1.1 | 场景目录列表可解析 | SCENE_DIRS 冒号分隔路径成功拆分 | 解析失败 → BLOCKED_ENV | SCENE_DIR_PARSE_ERROR (BLOCKED_ENV) |
| AC-1.2 | 场景数量充足 | 至少 2 个场景用于一致性对比 | < 2 个 → FAIL | SCENE_COUNT_INSUFFICIENT (FAIL) |
| AC-1.3 | 场景目录存在 | 所有列出的场景目录均存在 | 任一不存在 → FAIL | SCENE_DIR_NOT_FOUND (FAIL) |
| AC-1.4 | 必需资产齐全 | 每个场景含 scene.webp / depth.webp | 任一缺失 → FAIL | MISSING_REQUIRED_ASSETS (FAIL) |
| AC-1.5 | 命名规范合规 | 场景目录名只含小写字母、数字、连字符 | 含大写/空格/下划线 → FAIL | NAMING_VIOLATION (FAIL) |
| AC-1.6 | Golden Case 资产完整 | Golden Case 含 scene.webp / depth.webp | 任一缺失 → FAIL | GOLDEN_CASE_ASSET_MISSING (FAIL) |

### AC-2: CONSISTENCY_REVIEW_FILE 结构（对应 Step 2，核心）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-2.1 | JSON 合法 | CONSISTENCY_REVIEW_FILE 可被 jq empty 解析 | 解析失败 → BLOCKED_ENV | CONSISTENCY_REVIEW_JSON_INVALID (BLOCKED_ENV) |
| AC-2.2 | 7 维度齐全 | colorConsistency / materialConsistency / lightingConsistency / compositionConsistency / styleContinuity / narrativeCoherence / motionStaticHarmony 均存在 | 任一缺失 → FAIL | CONSISTENCY_DIMENSION_MISSING (FAIL) |
| AC-2.3 | verdict 合法 | 每个维度 verdict 为 PASS 或 FAIL | 其他值 → FAIL | CONSISTENCY_DIMENSION_INVALID_VERDICT (FAIL) |
| AC-2.4 | evidence 非空 | 每个维度有非空 evidence 字段 | 为空 → FAIL | CONSISTENCY_DIMENSION_NO_EVIDENCE (FAIL) |
| AC-2.5 | comparison 非空 | 每个维度有非空 comparison（场景对对比详情） | 为空 → FAIL | CONSISTENCY_DIMENSION_NO_COMPARISON (FAIL) |
| AC-2.6 | 维度无 FAIL | 7 个维度 verdict 全部为 PASS | 任一 FAIL → FAIL | CONSISTENCY_FAIL (FAIL) |
| AC-2.7 | 审查记录完整 | 所有维度有 verdict + evidence + comparison | 任一缺失 → FAIL | CONSISTENCY_REVIEW_INCOMPLETE (FAIL) |

> AC-2 纪律：7 个一致性维度必须全部由人或 AI 视觉模型实际跨场景对比检查后记录到 CONSISTENCY_REVIEW_FILE。每个维度必须有 verdict(PASS/FAIL) + evidence(非空，指向标注图/色值/参数) + comparison(非空，场景对对比详情)。禁止信任生成工具的自我声明。

### AC-3: 色彩一致性（对应 Step 3）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-3.1 | ffprobe 可执行 | ffprobe 成功解析所有场景主图 | 执行失败 → BLOCKED_ENV | COLOR_PROBE_ERROR (BLOCKED_ENV) |
| AC-3.2 | 色彩空间一致 | 所有场景主图使用相同 color_space | 不一致 → FAIL | COLOR_SPACE_INCONSISTENT (FAIL) |
| AC-3.3 | 六色体系一致 | 主色调/辅色/点缀色角色符合 HeartMirror 六色体系 | 偏离 → FAIL | CONSISTENCY_FAIL (colorConsistency 维度) |
| AC-3.4 | 无高饱和荧光色 | 无场景出现高饱和荧光色或赛博朋克霓虹倾向 | 出现 → FAIL | HIGH_SATURATION_FLUORESCENT (FAIL，主观维度判定) |
| AC-3.5 | 色彩角色分配一致 | 境/玄/脉/息/印/生六角色在场景间分配统一 | 不一致 → FAIL | CONSISTENCY_FAIL (colorConsistency 维度) |

### AC-4: 材质一致性（对应 Step 4）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-4.1 | ffprobe 可执行 | ffprobe 成功解析所有场景资产 | 执行失败 → BLOCKED_ENV | MATERIAL_PROBE_ERROR (BLOCKED_ENV) |
| AC-4.2 | 深度图位深统一 | 所有场景 depth.webp 位深一致（目标 16-bit） | 不一致 → FAIL | DEPTH_BIT_INCONSISTENT (FAIL) |
| AC-4.3 | 同类物体材质统一 | 木门/石柱/金属/玉在不同场景中材质处理一致 | 不一致 → FAIL | MATERIAL_TEXTURE_INCONSISTENT (FAIL，主观维度判定) |
| AC-4.4 | 无非中式材质 | 无塑料感/玻璃幕墙等非中式材质 | 出现 → FAIL | CONSISTENCY_FAIL (materialConsistency 维度) |

### AC-5: 光照一致性（对应 Step 5）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-5.1 | ffprobe 可执行 | ffprobe 成功解析所有场景主图 | 执行失败 → BLOCKED_ENV | LIGHTING_PROBE_ERROR (BLOCKED_ENV) |
| AC-5.2 | 同类型场景光源方向一致 | 晨曦场景光源来自左上、黄昏低角度、天光顶漫射 | 不一致 → FAIL | LIGHTING_PARAM_INCONSISTENT (FAIL，主观维度判定) |
| AC-5.3 | 色温范围统一 | 同类型场景色温在统一范围内 | 偏离 → FAIL | COLOR_TEMPERATURE_DEVIATION (FAIL，主观维度判定) |
| AC-5.4 | 阴影风格一致 | 软/硬阴影、阴影颜色在同类型场景中一致 | 不一致 → FAIL | CONSISTENCY_FAIL (lightingConsistency 维度) |

### AC-6: 构图一致性（对应 Step 6）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-6.1 | ffprobe 可执行 | ffprobe 成功解析所有场景主图 | 执行失败 → BLOCKED_ENV | COMPOSITION_PROBE_ERROR (BLOCKED_ENV) |
| AC-6.2 | 分辨率有效 | 所有场景主图 width/height 为正整数 | 解析失败 → FAIL | COMPOSITION_RESOLUTION_ERROR (FAIL) |
| AC-6.3 | 宽高比统一 | 所有场景主图宽高比一致 | 不一致 → FAIL | ASPECT_RATIO_INCONSISTENT (FAIL) |
| AC-6.4 | 视角类型一致 | 视角类型（平视/仰视/俯视）符合场景类型 | 不一致 → FAIL | VIEWPOINT_INCONSISTENT (FAIL，主观维度判定) |
| AC-6.5 | 视觉焦点合规 | 焦点位置（三分法/中心/对称）符合产品规范 | 偏离 → FAIL | COMPOSITION_DEVIATION (FAIL，主观维度判定) |

### AC-7: 风格连续性（对应 Step 7）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-7.1 | comparison 可解析 | styleContinuity.comparison 字段可被 jq 解析 | 解析失败 → BLOCKED_ENV | STYLE_COMPARISON_PARSE_ERROR (BLOCKED_ENV) |
| AC-7.2 | 无突兀风格跳变 | 相邻场景之间无赛博朋克/极简现代等跳变 | 出现 → FAIL | STYLE_ABRUPT_CHANGE (FAIL，主观维度判定) |
| AC-7.3 | 美学特质组合一致 | 宋式温润+晨曦天光+辽阔敬畏+中式巨构组合统一 | 不一致 → FAIL | AESTHETIC_TRAIT_MISMATCH (FAIL，主观维度判定) |

### AC-8: 叙事连贯性（对应 Step 8）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-8.1 | comparison 可解析 | narrativeCoherence.comparison 字段可被 jq 解析 | 解析失败 → BLOCKED_ENV | NARRATIVE_PARSE_ERROR (BLOCKED_ENV) |
| AC-8.2 | 入境仪式连贯 | 首次入境仪式视觉叙事（入口→主场景）连贯 | 断裂 → FAIL | NARRATIVE_BREAK (FAIL，主观维度判定) |
| AC-8.3 | 多宇宙入口统一 | 不同宇宙入口的视觉风格统一 | 不一致 → FAIL | ENTRY_RITUAL_INCONSISTENT (FAIL，主观维度判定) |
| AC-8.4 | 转场资产可扫描 | find 成功扫描场景中转场相关文件 | 扫描失败 → BLOCKED_ENV | TRANSITION_SCAN_ERROR (BLOCKED_ENV) |

### AC-9: 动静协调（对应 Step 9）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-9.1 | comparison 可解析 | motionStaticHarmony.comparison 字段可被 jq 解析 | 解析失败 → BLOCKED_ENV | MOTION_STATIC_PARSE_ERROR (BLOCKED_ENV) |
| AC-9.2 | 动静协调 | 动态转场色彩/风格与静态资产一致 | 冲突 → FAIL | MOTION_STATIC_MISMATCH (FAIL，主观维度判定) |
| AC-9.3 | 动画效果合规 | 动画/粒子效果符合 HeartMirror 语言 | 偏离 → FAIL | CONSISTENCY_FAIL (motionStaticHarmony 维度) |

### AC-10: 问题分类与严重程度（对应 Step 10）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-10.1 | 阻断级问题可解析 | issues 数组中 severity=blocking 计数可被 jq 解析 | 解析失败 → BLOCKED_ENV | BLOCKING_ISSUES_PARSE_ERROR (BLOCKED_ENV) |
| AC-10.2 | 问题已分类 | 每条 issue.category 为 aesthetic/technical/asset/narrative 之一 | 未分类或非法值 → FAIL | ISSUE_NOT_CLASSIFIED (FAIL) |
| AC-10.3 | 问题有证据 | 每条 issue.evidence 非空 | 为空 → FAIL | ISSUE_NO_EVIDENCE (FAIL) |
| AC-10.4 | 严重程度合规 | 每条 issue.severity 为 blocking/important/suggestion 之一 | 非法值 → FAIL | ISSUE_SEVERITY_INVALID (FAIL) |
| AC-10.5 | 无阻断级问题 | issues 中无 severity=blocking 的问题 | 存在 → FAIL | BLOCKING_ISSUE_DETECTED (FAIL) |

## 证据要求（Evidence Requirements）

必须保留以下原始输出，不得使用摘要或截图替代：

1. **一致性审查记录**：CONSISTENCY_REVIEW_FILE（JSON，含 7 个维度的 verdict + evidence + comparison + issues 数组）
2. **场景清单**：scene-list.txt（待审查场景目录路径列表）
3. **场景目录验证**：scene-dir-validation.txt（每个场景目录存在性检查结果）
4. **维度详情**：dimension-detail.txt（7 个维度逐项 PASS/FAIL/MISSING 记录）
5. **色彩探测结果**：color-probe.txt（ffprobe 输出的色彩空间、传输特性、主色）
6. **色彩空间统计**：color-space.txt（各场景 color_space 分布统计）
7. **材质探测结果**：material-probe.txt（ffprobe 输出的 pix_fmt、位深）
8. **深度图位深统计**：depth-bit.txt（各场景 depth.webp 位深分布）
9. **光照探测结果**：lighting-probe.txt（color_transfer、color_range）
10. **构图参数**：composition.txt（分辨率、宽高比）
11. **风格过渡记录**：style-transition.txt（相邻场景风格对比记录）
12. **叙事连贯性记录**：narrative.txt（入境仪式/多宇宙入口对比记录）
13. **动静协调记录**：motion-static.txt（动态转场与静态资产对比记录）
14. **问题验证结果**：issue-validation.txt（issues 数组分类/严重程度/证据检查）
15. **审查日志**：consistency-log.txt（完整执行日志，含所有检查结果和计数）

## 判定规则（Verdict Rules）

- **PASS**：7 个一致性维度全部 PASS（有 evidence + comparison）、客观参数一致（色彩空间/深度位深/宽高比统一）、所有问题已分类且有证据、无阻断级问题
- **FAIL**：任一一致性维度 FAIL、客观参数不一致、问题未分类或无证据、存在阻断级问题
- **BLOCKED_ENV**：CONSISTENCY_REVIEW_FILE 缺失、Golden Case 缺失、工具不可用、ffprobe/jq 执行失败——不得标记 PASS
- **NOT_RUN**：审查未执行或基准未建立

**绝不因任何前序步骤为 FAIL / BLOCKED_ENV / NOT_RUN 而发出 PASS。**

## 错误码封闭清单（Error Code Taxonomy）

| 错误码 | 判定 | 来源 Step | 产出方式 |
|---|---|---|---|
| PARAM_MISSING | BLOCKED_ENV | Phase 0 | 代码直接产出 |
| CONSISTENCY_REVIEW_FILE_NOT_FOUND | BLOCKED_ENV | Phase 0 | 代码直接产出 |
| GOLDEN_CASE_NOT_FOUND | BLOCKED_ENV | Phase 0 | 代码直接产出 |
| DESIGN_LANGUAGE_DOC_NOT_FOUND | BLOCKED_ENV | Phase 0 | 代码直接产出 |
| TOOL_MISSING | BLOCKED_ENV | Phase 0 | 代码直接产出 |
| SCENE_DIR_PARSE_ERROR | BLOCKED_ENV | Step 1 | 代码直接产出 |
| SCENE_COUNT_ERROR | BLOCKED_ENV | Step 1 | 代码直接产出 |
| SCENE_COUNT_INSUFFICIENT | FAIL | Step 1 | 代码直接产出 |
| SCENE_DIR_NOT_FOUND | FAIL | Step 1 | 代码直接产出 |
| MISSING_REQUIRED_ASSETS | FAIL | Step 1 | 代码直接产出 |
| NAMING_VIOLATION | FAIL | Step 1 | 代码直接产出 |
| GOLDEN_CASE_ASSET_MISSING | FAIL | Step 1 | 代码直接产出 |
| CONSISTENCY_REVIEW_JSON_INVALID | BLOCKED_ENV | Step 2 | 代码直接产出 |
| CONSISTENCY_REVIEW_PARSE_ERROR | BLOCKED_ENV | Step 2 | 代码直接产出 |
| ISSUES_PARSE_ERROR | BLOCKED_ENV | Step 2 | 代码直接产出 |
| CONSISTENCY_DIMENSION_MISSING | FAIL | Step 2 | 代码直接产出 |
| CONSISTENCY_DIMENSION_INVALID_VERDICT | FAIL | Step 2 | 代码直接产出 |
| CONSISTENCY_DIMENSION_NO_EVIDENCE | FAIL | Step 2 | 代码直接产出 |
| CONSISTENCY_DIMENSION_NO_COMPARISON | FAIL | Step 2 | 代码直接产出 |
| CONSISTENCY_REVIEW_INCOMPLETE | FAIL | Step 2 | 代码直接产出 |
| CONSISTENCY_FAIL | FAIL | Step 2 | 代码直接产出（维度 FAIL 计数） |
| COLOR_PROBE_ERROR | BLOCKED_ENV | Step 3 | 代码直接产出 |
| COLOR_SPACE_INCONSISTENT | FAIL | Step 3 | 代码直接产出 |
| COLOR_SPACE_GREP_ERROR | BLOCKED_ENV | Step 3 | 代码直接产出 |
| HIGH_SATURATION_FLUORESCENT | FAIL | Step 3 | 主观维度判定（colorConsistency FAIL 时 evidence 描述） |
| MATERIAL_PROBE_ERROR | BLOCKED_ENV | Step 4 | 代码直接产出 |
| DEPTH_BIT_INCONSISTENT | FAIL | Step 4 | 代码直接产出 |
| DEPTH_BIT_GREP_ERROR | BLOCKED_ENV | Step 4 | 代码直接产出 |
| MATERIAL_TEXTURE_INCONSISTENT | FAIL | Step 4 | 主观维度判定（materialConsistency FAIL 时 evidence 描述） |
| LIGHTING_PROBE_ERROR | BLOCKED_ENV | Step 5 | 代码直接产出 |
| LIGHTING_TRANSFER_GREP_ERROR | BLOCKED_ENV | Step 5 | 代码直接产出 |
| LIGHTING_PARAM_INCONSISTENT | FAIL | Step 5 | 主观维度判定（lightingConsistency FAIL 时 evidence 描述） |
| COLOR_TEMPERATURE_DEVIATION | FAIL | Step 5 | 主观维度判定（lightingConsistency FAIL 时 evidence 描述） |
| COMPOSITION_PROBE_ERROR | BLOCKED_ENV | Step 6 | 代码直接产出 |
| COMPOSITION_RESOLUTION_ERROR | FAIL | Step 6 | 代码直接产出 |
| ASPECT_RATIO_INCONSISTENT | FAIL | Step 6 | 代码直接产出 |
| VIEWPOINT_INCONSISTENT | FAIL | Step 6 | 主观维度判定（compositionConsistency FAIL 时 evidence 描述） |
| COMPOSITION_DEVIATION | FAIL | Step 6 | 主观维度判定（compositionConsistency FAIL 时 evidence 描述） |
| STYLE_COMPARISON_PARSE_ERROR | BLOCKED_ENV | Step 7 | 代码直接产出 |
| AESTHETIC_TRAIT_GREP_ERROR | BLOCKED_ENV | Step 7 | 代码直接产出 |
| STYLE_ABRUPT_CHANGE | FAIL | Step 7 | 主观维度判定（styleContinuity FAIL 时 evidence 描述） |
| AESTHETIC_TRAIT_MISMATCH | FAIL | Step 7 | 主观维度判定（styleContinuity FAIL 时 evidence 描述） |
| NARRATIVE_PARSE_ERROR | BLOCKED_ENV | Step 8 | 代码直接产出 |
| TRANSITION_SCAN_ERROR | BLOCKED_ENV | Step 8 | 代码直接产出 |
| NARRATIVE_BREAK | FAIL | Step 8 | 主观维度判定（narrativeCoherence FAIL 时 evidence 描述） |
| ENTRY_RITUAL_INCONSISTENT | FAIL | Step 8 | 主观维度判定（narrativeCoherence FAIL 时 evidence 描述） |
| MOTION_STATIC_PARSE_ERROR | BLOCKED_ENV | Step 9 | 代码直接产出 |
| MOTION_STATIC_MISMATCH | FAIL | Step 9 | 主观维度判定（motionStaticHarmony FAIL 时 evidence 描述） |
| BLOCKING_ISSUES_PARSE_ERROR | BLOCKED_ENV | Step 10 | 代码直接产出 |
| ISSUE_NOT_CLASSIFIED | FAIL | Step 10 | 代码直接产出 |
| ISSUE_NO_EVIDENCE | FAIL | Step 10 | 代码直接产出 |
| ISSUE_SEVERITY_INVALID | FAIL | Step 10 | 代码直接产出 |
| BLOCKING_ISSUE_DETECTED | FAIL | Step 10 | 代码直接产出 |
| EVIDENCE_ARCHIVE_ERROR | BLOCKED_ENV | 最终归档 | 代码直接产出 |

**双向封闭性**：procedure 实际产出码 ⊆ taxonomy，taxonomy 无悬空码。主观维度判定码（标注"主观维度判定"）在对应维度 verdict=FAIL 时，必须在 evidence 字段中明确引用该错误码名称。

## 禁止行为（Forbidden Actions）

- 禁止仅用主观评价（"感觉不对"）替代证据记录
- 禁止混淆问题类别（将技术问题当作美学问题，将资产问题当作叙事问题）
- 禁止在无 Golden Case 参考时进行一致性判定
- 禁止随意更改 Golden Case 参考基准
- 禁止将建议级问题当作阻断级问题
- 禁止忽略阻断级问题而标记 PASS
- 禁止信任生成工具的自我声明（必须实际跨场景对比检查，CONSISTENCY_REVIEW_FILE 必须有 evidence + comparison）
- 禁止用 CSS scale 或后期调色伪造视觉一致性
- 禁止在 BLOCKED_ENV 状态下标记 PASS
- 禁止 CONSISTENCY_REVIEW_FILE 缺维度、缺 evidence 或缺 comparison 时标记 PASS
- 禁止在 comparison 字段中只写"已对比"而无具体场景对差异描述
