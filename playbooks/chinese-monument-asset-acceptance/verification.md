# Verification: 中式巨构场景资产验收

## 验收标准（Acceptance Criteria）

### AC-0: 输入验证与工具链（对应 Phase 0）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-0.1 | 必填参数已设置 | ASSET_DIR / VISUAL_INSPECTION_FILE 均非空 | 任一缺失 → BLOCKED_ENV | PARAM_MISSING (BLOCKED_ENV) |
| AC-0.2 | 目录和文件存在 | ASSET_DIR 存在、VISUAL_INSPECTION_FILE 存在 | 任一不存在 → BLOCKED_ENV | DIR_NOT_FOUND / VISUAL_INSPECTION_FILE_NOT_FOUND (BLOCKED_ENV) |
| AC-0.3 | 工具链完整 | jq / ffprobe / sha256sum / stat / mktemp / grep / find 均可用 | 任一缺失 → BLOCKED_ENV | TOOL_MISSING (BLOCKED_ENV) |

### AC-1: 技术规格验证（对应 SC-1 / Step 1）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-1.1 | 资产目录可扫描 | find 命令成功列出资产文件 | 扫描失败 → BLOCKED_ENV | ASSET_SCAN_FAILED (BLOCKED_ENV) |
| AC-1.2 | 必需资产齐全 | scene.webp / depth.webp 均存在 | 任一缺失 → FAIL | MISSING_REQUIRED_ASSETS (FAIL) |
| AC-1.3 | 主图规格符合 | scene.webp 格式为 webp，分辨率 >= 1024 | 格式不符或分辨率不足 → FAIL | FORMAT_MISMATCH / RESOLUTION_TOO_SMALL (FAIL) |
| AC-1.4 | 深度图规格符合 | depth.webp 格式为 webp，分辨率 >= 1024 | 格式不符或分辨率不足 → FAIL | FORMAT_MISMATCH / RESOLUTION_TOO_SMALL (FAIL) |
| AC-1.5 | ffprobe 可执行 | ffprobe 成功解析所有图像文件 | 执行失败 → BLOCKED_ENV | FFPROBE_ERROR (BLOCKED_ENV) |
| AC-1.6 | 文件大小合理 | 所有文件非空且 < 100MB | 空文件或异常大 → FAIL | FILE_EMPTY / FILE_ABNORMALLY_LARGE (FAIL) |
| AC-1.7 | 技术规格汇总 | 所有图像通过规格检查 | 任一失败 → FAIL | TECH_SPEC_FAILURE (FAIL) |
| AC-1.8 | 命名规范合规 | 所有文件名只含小写字母、数字、连字符、点号 | 含大写/空格/下划线 → FAIL | NAMING_VIOLATION (FAIL) |

### AC-2: 主体尺度检查（对应 SC-2 / Step 2）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-2.1 | 视觉检查记录含主体尺度维度 | VISUAL_INSPECTION_FILE.dimensions.subjectScale 存在 | 缺失 → FAIL | VISUAL_INSPECTION_INCOMPLETE (FAIL) |
| AC-2.2 | 主体尺度 verdict 为 PASS | subjectScale.verdict == "PASS" 且 evidence 非空 | verdict == "FAIL" → FAIL | VISUAL_QUALITY_FAIL (FAIL) |

> AC-2 纪律：主体尺度必须宏大、有压迫感、人在其中显得渺小。必须有尺度参照（人、物、环境元素）。缺乏尺度感或主体过小 → FAIL。

### AC-3: 建筑结构检查（对应 SC-3 / Step 3）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-3.1 | 视觉检查记录含建筑结构维度 | architecturalStructure 存在且有 verdict+evidence | 缺失 → FAIL | VISUAL_INSPECTION_INCOMPLETE (FAIL) |
| AC-3.2 | 建筑结构 verdict 为 PASS | 真实梁柱/斗拱/门体/屋檐结构，有结构逻辑 | 仅有装饰性纹理 → FAIL | VISUAL_QUALITY_FAIL (FAIL) |

### AC-4: 材质纹理检查（对应 SC-4 / Step 4）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-4.1 | 视觉检查记录含材质纹理维度 | materialTexture 存在且有 verdict+evidence | 缺失 → FAIL | VISUAL_INSPECTION_INCOMPLETE (FAIL) |
| AC-4.2 | 材质纹理 verdict 为 PASS | 木/石/金/玉等中式材质，细节充足，无塑料感/玻璃幕墙 | 非中式材质或塑料感 → FAIL | VISUAL_QUALITY_FAIL (FAIL) |

### AC-5: 光影层次检查（对应 SC-5 / Step 5）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-5.1 | 视觉检查记录含光影层次维度 | lightingShadow 存在且有 verdict+evidence | 缺失 → FAIL | VISUAL_INSPECTION_INCOMPLETE (FAIL) |
| AC-5.2 | 光影层次 verdict 为 PASS | 光源方向明确（晨曦/黄昏/天光），阴影有层次和方向性 | 平光/无阴影/过曝 → FAIL | VISUAL_QUALITY_FAIL (FAIL) |

### AC-6: 空间纵深检查（对应 SC-6 / Step 6）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-6.1 | 视觉检查记录含空间纵深维度 | spatialDepth 存在且有 verdict+evidence | 缺失 → FAIL | VISUAL_INSPECTION_INCOMPLETE (FAIL) |
| AC-6.2 | 空间纵深 verdict 为 PASS | 前景/中景/远景分层，透视正确，非平面背景 | 平面背景/无纵深 → FAIL | VISUAL_QUALITY_FAIL (FAIL) |

### AC-7: 视觉焦点检查（对应 SC-7 / Step 7）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-7.1 | 视觉检查记录含视觉焦点维度 | visualFocus 存在且有 verdict+evidence | 缺失 → FAIL | VISUAL_INSPECTION_INCOMPLETE (FAIL) |
| AC-7.2 | 视觉焦点 verdict 为 PASS | 焦点明确（主体建筑/门体/光源），视线引导清晰 | 焦点模糊/元素堆砌 → FAIL | VISUAL_QUALITY_FAIL (FAIL) |

### AC-8: 色彩系统检查（对应 SC-8 / Step 8）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-8.1 | 视觉检查记录含色彩系统维度 | colorSystem 存在且有 verdict+evidence | 缺失 → FAIL | VISUAL_INSPECTION_INCOMPLETE (FAIL) |
| AC-8.2 | 色彩系统 verdict 为 PASS | HeartMirror 色彩系统，低饱和温润，无高饱和荧光/赛博朋克霓虹 | 高饱和荧光/赛博朋克倾向 → FAIL | VISUAL_QUALITY_FAIL (FAIL) |

> AC-2~AC-8 纪律：7 个视觉维度必须全部由人或 AI 视觉模型实际检查后记录到 VISUAL_INSPECTION_FILE。每个维度必须有 verdict(PASS/FAIL) + evidence(非空，指向标注图/描述/参考对比)。禁止信任生成工具的自我声明。

### AC-9: 视差层级验证（对应 SC-9 / Step 9）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-9.1 | 深度图存在 | depth.webp 存在 | 缺失 → FAIL | DEPTH_FILE_MISSING (FAIL) |
| AC-9.2 | 深度图位深 16-bit | pix_fmt 含 16 或 bits_per_raw_sample >= 16 | 位深不足 → FAIL | DEPTH_BIT_DEPTH_INSUFFICIENT (FAIL) |
| AC-9.3 | ffprobe 可执行 | ffprobe 成功解析深度图 | 执行失败 → BLOCKED_ENV | DEPTH_PROBE_ERROR (BLOCKED_ENV) |
| AC-9.4 | 水面遮罩 8-bit（如存在） | water-mask.webp 位深 <= 8-bit | 位深无效 → FAIL | WATER_MASK_BIT_DEPTH_INVALID (FAIL) |
| AC-9.5 | 水面遮罩 ffprobe 可执行（如存在） | ffprobe 成功解析水面遮罩 | 执行失败 → BLOCKED_ENV | WATER_MASK_PROBE_ERROR (BLOCKED_ENV) |
| AC-9.6 | 法线/分层资产（如存在）验证通过 | 格式正确，与场景一致 | 格式错误 → FAIL | — |

### AC-10: scene.json / manifest 对应验证（对应 SC-10 / Step 10）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-10.1 | manifest JSON 合法（如提供） | manifest.json 可被 jq 解析 | 解析失败 → FAIL | MANIFEST_JSON_INVALID (FAIL) |
| AC-10.2 | fileCount 一致 | 声明的 fileCount 与 files[] 实际长度一致 | 不一致 → FAIL | FILECOUNT_MISMATCH (FAIL) |
| AC-10.3 | SHA-256 正确 | 每个资产的声明 SHA-256 与实际文件计算值一致 | 不一致 → FAIL | SHA256_MISMATCH (FAIL) |
| AC-10.4 | byteSize 正确 | 每个资产的声明 byteSize 与实际文件大小一致 | 不一致 → FAIL | BYTESIZE_MISMATCH (FAIL) |
| AC-10.5 | 文件存在且 sha256sum/stat 可执行 | manifest 引用的文件均在磁盘上，sha256sum/stat 执行成功 | 文件缺失或执行失败 → BLOCKED_ENV | MANIFEST_VERIFY_BLOCKED (BLOCKED_ENV) |
| AC-10.6 | scene.json 合法（如提供） | scene.json 可被 jq 解析 | 解析失败 → FAIL | SCENE_JSON_INVALID (FAIL) |
| AC-10.7 | sceneId 存在（如提供） | scene.json 包含非空 sceneId | 缺失 → FAIL | SCENE_ID_MISSING (FAIL) |
| AC-10.8 | 路径合规（如提供） | scene.json 中资产路径为相对路径，不含 .. 或绝对路径 | 违规 → FAIL | ABSOLUTE_OR_PARENT_PATH (FAIL) |

## 证据要求（Evidence Requirements）

必须保留以下原始输出，不得使用摘要或截图替代：

1. **视觉检查记录**：VISUAL_INSPECTION_FILE（JSON，含 7 个维度的 verdict + evidence）
2. **资产文件清单**：asset-list.txt（路径、大小）
3. **技术规格验证输出**：tech-spec-results.txt（ffprobe 输出的分辨率、格式、色彩空间）
4. **文件大小验证输出**：file-size-results.txt（逐项大小检查）
5. **深度图验证输出**：depth-validation.txt（位深、格式、遮罩/法线/分层资产）
6. **scene.json/manifest 验证输出**：scene-manifest-validation.txt（fileCount、SHA-256、byteSize）
7. **SHA-256 结果**：sha256-results.txt（逐项 MATCH/MISMATCH 记录）
8. **验收日志**：acceptance-log.txt（完整执行日志，含所有检查结果和计数）

## 判定规则（Verdict Rules）

- **PASS**：全部技术规格通过、7 个视觉维度全部 PASS（有证据）、视差层级验证通过、manifest 对应验证通过
- **FAIL**：任一技术规格不符、任一视觉维度 FAIL、深度图位深不足、哈希/byteSize/fileCount 不匹配
- **BLOCKED_ENV**：资产文件缺失、视觉检查记录缺失、工具不可用、ffprobe/sha256sum 执行失败——不得标记 PASS
- **NOT_RUN**：资产未生成或验收未执行

**绝不因任何前序步骤为 FAIL / BLOCKED_ENV / NOT_RUN 而发出 PASS。**

## 错误码封闭清单（Error Code Taxonomy）

| 错误码 | 判定 | 来源 Step |
|---|---|---|
| PARAM_MISSING | BLOCKED_ENV | Phase 0 |
| DIR_NOT_FOUND | BLOCKED_ENV | Phase 0 |
| VISUAL_INSPECTION_FILE_NOT_FOUND | BLOCKED_ENV | Phase 0 |
| TOOL_MISSING | BLOCKED_ENV | Phase 0 |
| ASSET_SCAN_FAILED | BLOCKED_ENV | Step 1 |
| ASSET_COUNT_ERROR | BLOCKED_ENV | Step 1 |
| MISSING_REQUIRED_ASSETS | FAIL | Step 1 |
| FFPROBE_ERROR | BLOCKED_ENV | Step 1 |
| FORMAT_MISMATCH | FAIL | Step 1 |
| RESOLUTION_TOO_SMALL | FAIL | Step 1 |
| RESOLUTION_PARSE_WARNING | FAIL | Step 1 |
| TECH_SPEC_FAILURE | FAIL | Step 1 |
| STAT_ERROR | BLOCKED_ENV | Step 1 |
| FILE_EMPTY | FAIL | Step 1 |
| FILE_ABNORMALLY_LARGE | FAIL | Step 1 |
| NAMING_VIOLATION | FAIL | Step 1 |
| VISUAL_INSPECTION_JSON_INVALID | BLOCKED_ENV | Step 2 |
| VISUAL_INSPECTION_PARSE_ERROR | BLOCKED_ENV | Step 2 |
| VISUAL_INSPECTION_INCOMPLETE | FAIL | Step 2 |
| VISUAL_DIMENSION_INVALID_VERDICT | FAIL | Step 2 |
| VISUAL_DIMENSION_NO_EVIDENCE | FAIL | Step 2 |
| VISUAL_QUALITY_FAIL | FAIL | Step 2-8 |
| DEPTH_FILE_MISSING | FAIL | Step 9 |
| DEPTH_BIT_DEPTH_INSUFFICIENT | FAIL | Step 9 |
| DEPTH_PROBE_ERROR | BLOCKED_ENV | Step 9 |
| WATER_MASK_BIT_DEPTH_INVALID | FAIL | Step 9 |
| WATER_MASK_PROBE_ERROR | BLOCKED_ENV | Step 9 |
| MANIFEST_JSON_INVALID | FAIL | Step 10 |
| FILECOUNT_MISMATCH | FAIL | Step 10 |
| SHA256_MISMATCH | FAIL | Step 10 |
| BYTESIZE_MISMATCH | FAIL | Step 10 |
| FILE_NOT_IN_DIR | BLOCKED_ENV | Step 10 |
| SHA256_EXEC_ERROR | BLOCKED_ENV | Step 10 |
| MANIFEST_VERIFY_BLOCKED | BLOCKED_ENV | Step 10 |
| SCENE_JSON_INVALID | FAIL | Step 10 |
| SCENE_ID_MISSING | FAIL | Step 10 |
| ABSOLUTE_OR_PARENT_PATH | FAIL | Step 10 |
| EVIDENCE_ARCHIVE_ERROR | BLOCKED_ENV | 最终归档 |

## 禁止行为（Forbidden Actions）

- 禁止用装饰性纹理替代建筑结构
- 禁止接受 UI 卡片化布局
- 禁止接受赛博朋克默认视觉
- 禁止接受高饱和荧光色泛滥
- 禁止接受缺乏空间尺度的平面背景
- 禁止信任生成工具的自我声明（必须实际检查，VISUAL_INSPECTION_FILE 必须有 evidence）
- 禁止用主观评价替代证据记录（每个视觉维度必须有非空 evidence 字段）
- 禁止用 CSS scale 替代真实视差
- 禁止在 BLOCKED_ENV 状态下标记 PASS
- 禁止视觉检查记录缺维度或缺 evidence 时标记 PASS
