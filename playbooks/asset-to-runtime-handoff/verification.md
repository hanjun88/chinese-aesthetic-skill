# Verification: 中式美学资产到 Runtime 的交接

## 验收标准（Acceptance Criteria）

### AC-0: 输入验证与工具链（对应 Phase 0）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-0.1 | 必填参数已设置 | AESTHETIC_REPO / COMPILER_REPO / ASSET_DIR / SCENE_JSON / MANIFEST_JSON 均非空 | 任一缺失 → BLOCKED_ENV | PARAM_MISSING (BLOCKED_ENV) |
| AC-0.2 | 目录和文件存在 | 两个仓库根目录、资产目录、scene.json、manifest.json 均存在 | 任一不存在 → BLOCKED_ENV | DIR_NOT_FOUND / FILE_NOT_FOUND (BLOCKED_ENV) |
| AC-0.3 | 工具链完整 | jq / ffprobe / sha256sum / stat / mktemp / grep / find / cp 均可用 | 任一缺失 → BLOCKED_ENV | TOOL_MISSING (BLOCKED_ENV) |

### AC-1: 审美验收确认（对应 SC-1 / Step 1）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-1.1 | CA-PB-003 验收通过 | 找到审美验收报告且包含 PASS | 报告未找到 → BLOCKED_ENV；报告不含 PASS → FAIL | ACCEPTANCE_NOT_FOUND (BLOCKED_ENV) / ACCEPTANCE_NOT_PASS (FAIL) |
| AC-1.2 | CA-PB-001 约束就绪 | 找到约束包且 status 为 PASS 或 TEMPLATE | 约束包未找到 → BLOCKED_ENV；status 非 PASS/TEMPLATE → FAIL | CONSTRAINT_NOT_FOUND (BLOCKED_ENV) / CONSTRAINT_NOT_READY (FAIL) |

### AC-2: 编译契约版本（对应 SC-2 / Step 2）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-2.1 | scene.json schema 可定位 | 在 design-compiler 中找到 types.ts 或 schema 定义文件 | 未找到 → BLOCKED_ENV | SCHEMA_NOT_FOUND (BLOCKED_ENV) |
| AC-2.2 | manifest schema 已确认 | SceneAssetManifest 类型定义存在于 schema 文件中 | 未找到 → BLOCKED_ENV | MANIFEST_SCHEMA_NOT_FOUND (BLOCKED_ENV) |

### AC-3: 资产清单完整性（对应 SC-3 / Step 3）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-3.1 | 资产目录可扫描 | find 命令成功列出资产文件 | 扫描失败 → BLOCKED_ENV | ASSET_SCAN_FAILED (BLOCKED_ENV) |
| AC-3.2 | 必需资产齐全 | scene.webp / depth.webp / scene.json / manifest.json 均存在 | 任一缺失 → FAIL | MISSING_REQUIRED_ASSETS (FAIL) |
| AC-3.3 | 命名规范合规 | 所有文件名只含小写字母、数字、连字符、点号 | 含大写/空格/下划线 → FAIL | NAMING_VIOLATION (FAIL) |

### AC-4: 技术规格验证（对应 SC-4 / Step 4）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-4.1 | ffprobe 可执行 | ffprobe 成功解析所有图像文件 | 执行失败 → BLOCKED_ENV | FFPROBE_ERROR (BLOCKED_ENV) |
| AC-4.2 | 主图规格符合 | scene.webp 格式为 webp，分辨率 >= 1024x1024 | 格式不符或分辨率不足 → FAIL | FORMAT_MISMATCH / RESOLUTION_TOO_SMALL (FAIL) |
| AC-4.3 | 深度图规格符合 | depth.webp 格式为 webp，分辨率 >= 1024x1024 | 格式不符或分辨率不足 → FAIL | FORMAT_MISMATCH / RESOLUTION_TOO_SMALL (FAIL) |
| AC-4.4 | 深度图位深 16-bit | depth.webp 的 pix_fmt 含 16 或 bits_per_raw_sample >= 16 | 位深不足 16-bit → FAIL | DEPTH_BIT_DEPTH_INSUFFICIENT (FAIL) |
| AC-4.5 | 技术规格汇总 | 所有图像通过规格检查 | 任一失败 → FAIL | TECH_SPEC_FAILURE (FAIL) |

### AC-5: scene.json 契约验证（对应 SC-5 / Step 5）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-5.1 | JSON 合法 | scene.json 可被 jq 解析 | 解析失败 → FAIL | SCENE_JSON_INVALID (FAIL) |
| AC-5.2 | sceneId 存在 | scene.json 包含非空 sceneId 字段 | 缺失 → FAIL | SCENE_ID_MISSING (FAIL) |
| AC-5.3 | 路径合规 | 所有资产路径为相对路径，不含 `..` 或绝对路径 | 违规 → FAIL | ABSOLUTE_OR_PARENT_PATH (FAIL) |
| AC-5.4 | 无运行时专有状态 | scene.json 不含 runtimeState / tempMatrix / interactionState 等键 | 含运行时专有状态 → FAIL | RUNTIME_PROPRIETARY_STATE (FAIL) |
| AC-5.5 | 必需字段完整 | scene.json 包含视差层级、深度范围、入口 ID 声明 | 任一缺失 → FAIL | SCENE_REQUIRED_FIELDS_MISSING (FAIL) |

### AC-6: manifest.json 验证（对应 SC-6 / Step 6）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-6.1 | JSON 合法 | manifest.json 可被 jq 解析 | 解析失败 → FAIL | MANIFEST_JSON_INVALID (FAIL) |
| AC-6.2 | fileCount 一致 | 声明的 fileCount 与 files[] 实际长度一致 | 不一致 → FAIL | FILECOUNT_MISMATCH (FAIL) |
| AC-6.3 | SHA-256 正确 | 每个资产的声明 SHA-256 与实际文件计算值一致 | 不一致 → FAIL | SHA256_MISMATCH (FAIL) |
| AC-6.4 | byteSize 正确 | 每个资产的声明 byteSize 与实际文件大小一致 | 不一致 → FAIL | BYTESIZE_MISMATCH (FAIL) |
| AC-6.5 | truthClass 有效 | 每个资产的 truthClass 为 SOURCE/DERIVED/GENERATED 之一（或为 null） | 无效值 → FAIL | TRUTHCLASS_INVALID (FAIL) |
| AC-6.6 | SHA 工具执行成功 | sha256sum 对所有文件执行成功 | 执行失败 → BLOCKED_ENV | SHA256_EXEC_ERROR (BLOCKED_ENV) |
| AC-6.7 | 路径一致性 | manifest.json 资产路径与 scene.json 引用路径一致 | 不一致 → FAIL | PATH_INCONSISTENCY (FAIL) |

### AC-7: 运行时兼容性（对应 SC-7 / Step 7）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-7.1 | 运行时层级明确 | runtimeTier 为 WebGL2/WebGL1/Static/Neutral 之一 | 缺失或无效 → BLOCKED_ENV | RUNTIME_TIER_INVALID_OR_MISSING (BLOCKED_ENV) |
| AC-7.2 | 降级策略完整 | 若使用 WebGL2-only 特性，必须声明降级策略 | 有特性无降级 → FAIL | DEGRADATION_MISSING (FAIL) |

### AC-8: 职责边界检查（对应 SC-8 / Step 8）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-8.1 | 审美仓库无编译逻辑 | chinese-aesthetic-skill src/ 不含 webpack/rollup/compiler/shader 等编译模式 | 含编译逻辑 → FAIL | COMPILE_LOGIC_IN_AESTHETIC (FAIL) |
| AC-8.2 | 编译器无美学规范 | design-compiler src/ 不含 HeartMirror/色彩六角色/宋式温润等美学规范定义 | 含美学规范 → FAIL | AESTHETIC_SPEC_IN_COMPILER (FAIL) |
| AC-8.3 | 无跨仓库代码依赖 | chinese-aesthetic-skill 不 import design-compiler 代码 | 有代码依赖 → FAIL | CODE_DEPENDENCY (FAIL) |

### AC-9: 交接执行（对应 SC-9 / Step 9）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-9.1 | 编译器输入目录可创建 | mkdir -p 成功创建输入目录 | 创建失败 → BLOCKED_ENV | INPUT_DIR_CREATE_FAILED (BLOCKED_ENV) |
| AC-9.2 | 资产复制成功 | 所有资产文件成功复制到编译器输入目录 | 复制失败 → BLOCKED_ENV | ASSET_COPY_FAILED (BLOCKED_ENV) |
| AC-9.3 | 交接清单已记录 | handoff-manifest.tsv 含文件名、SHA-256、byteSize、源路径 | 未记录 → 证据缺失 | — |
| AC-9.4 | 交接元数据已记录 | 交接时间、双方 commit SHA 已记录 | 未记录 → 证据缺失 | — |

### AC-10: 编译验证（对应 SC-10 / Step 10）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-10.1 | DC-PB-001 可执行 | design-compiler 中存在 scene-compilation-contract/procedure.md | 未找到 → BLOCKED_ENV | DC_PB001_NOT_FOUND (BLOCKED_ENV) |
| AC-10.2 | 交接资产完整 | 编译器输入目录中所有必需资产存在 | 缺失 → FAIL | HANDOFF_INCOMPLETE (FAIL) |

> AC-10 纪律：编译验证必须在 design-compiler 侧实际执行 DC-PB-001/002，本 Playbook 仅做前置检查和交接确认。编译失败时必须返回 chinese-aesthetic-skill 修改，不得在 design-compiler 中静默修复。

## 证据要求（Evidence Requirements）

必须保留以下原始输出，不得使用摘要或截图替代：

1. **审美验收记录**：CA-PB-003 验收报告（含 PASS 标记）
2. **约束包状态**：CA-PB-001 constraint-package.json（含 validation.status）
3. **资产清单**：asset-list.txt（find 输出的完整文件列表）
4. **技术规格结果**：tech-spec-results.txt（ffprobe 输出的分辨率、格式、位深）
5. **scene.json 验证**：scene-json-validation.txt（jq 解析结果、路径检查、运行时状态检查）
6. **manifest 验证**：manifest-validation.txt（fileCount 对比、truthClass 检查）
7. **SHA-256 结果**：sha256-results.txt（逐项 MATCH/MISMATCH 记录）
8. **职责边界检查**：boundary-check.txt（grep 匹配结果）
9. **交接清单**：handoff-manifest.tsv（文件名、SHA-256、byteSize、源路径）
10. **交接日志**：handoff-log.txt（完整执行日志，含所有检查结果和计数）
11. **交接元数据**：交接时间（UTC ISO 8601）、双方仓库 commit SHA

## 判定规则（Verdict Rules）

- **PASS**：资产通过审美验收、编译契约明确、必需资产齐全、技术规格符合、scene.json/manifest 合规、运行时层级明确、职责边界清晰、资产成功交接、证据完整归档
- **FAIL**：资产缺失、技术规格不符、schema 违规、SHA-256/byteSize 不匹配、职责混写、交接不完整
- **BLOCKED_ENV**：输入缺失、工具缺失、编译契约不明确、运行时能力不确认、ffprobe/sha256sum 执行失败、资产复制失败——不得标记 PASS
- **NOT_RUN**：资产未生成或交接未执行

**绝不因任何前序步骤为 FAIL / BLOCKED_ENV / NOT_RUN 而发出 PASS。**

## 错误码封闭清单（Error Code Taxonomy）

| 错误码 | 判定 | 来源 Step |
|---|---|---|
| PARAM_MISSING | BLOCKED_ENV | Phase 0 |
| DIR_NOT_FOUND | BLOCKED_ENV | Phase 0 |
| FILE_NOT_FOUND | BLOCKED_ENV | Phase 0 |
| TOOL_MISSING | BLOCKED_ENV | Phase 0 |
| ACCEPTANCE_NOT_FOUND | BLOCKED_ENV | Step 1 |
| ACCEPTANCE_NOT_PASS | FAIL | Step 1 |
| CONSTRAINT_NOT_FOUND | BLOCKED_ENV | Step 1 |
| CONSTRAINT_NOT_READY | FAIL | Step 1 |
| CONSTRAINT_PARSE_ERROR | BLOCKED_ENV | Step 1 |
| SCHEMA_NOT_FOUND | BLOCKED_ENV | Step 2 |
| MANIFEST_SCHEMA_NOT_FOUND | BLOCKED_ENV | Step 2 |
| ASSET_SCAN_FAILED | BLOCKED_ENV | Step 3 |
| ASSET_COUNT_ERROR | BLOCKED_ENV | Step 3 |
| MISSING_REQUIRED_ASSETS | FAIL | Step 3 |
| NAMING_VIOLATION | FAIL | Step 3 |
| FFPROBE_ERROR | BLOCKED_ENV | Step 4 |
| FORMAT_MISMATCH | FAIL | Step 4 |
| RESOLUTION_TOO_SMALL | FAIL | Step 4 |
| RESOLUTION_PARSE_WARNING | FAIL | Step 4 |
| DEPTH_BIT_DEPTH_INSUFFICIENT | FAIL | Step 4 |
| DEPTH_PROBE_ERROR | BLOCKED_ENV | Step 4 |
| TECH_SPEC_FAILURE | FAIL | Step 4 |
| SCENE_JSON_INVALID | FAIL | Step 5 |
| SCENE_ID_MISSING | FAIL | Step 5 |
| ABSOLUTE_OR_PARENT_PATH | FAIL | Step 5 |
| PATH_CHECK_ERROR | BLOCKED_ENV | Step 5 |
| RUNTIME_PROPRIETARY_STATE | FAIL | Step 5 |
| SCENE_REQUIRED_FIELDS_MISSING | FAIL | Step 5 |
| MANIFEST_JSON_INVALID | FAIL | Step 6 |
| FILECOUNT_MISMATCH | FAIL | Step 6 |
| SHA256_MISMATCH | FAIL | Step 6 |
| BYTESIZE_MISMATCH | FAIL | Step 6 |
| TRUTHCLASS_INVALID | FAIL | Step 6 |
| PATH_INCONSISTENCY | FAIL | Step 6 |
| SHA256_EXEC_ERROR | BLOCKED_ENV | Step 6 |
| STAT_ERROR | BLOCKED_ENV | Step 6 |
| FILE_NOT_IN_DIR | BLOCKED_ENV | Step 6 |
| MANIFEST_VERIFY_BLOCKED | BLOCKED_ENV | Step 6 |
| RUNTIME_TIER_INVALID_OR_MISSING | BLOCKED_ENV | Step 7 |
| DEGRADATION_MISSING | FAIL | Step 7 |
| COMPILE_LOGIC_IN_AESTHETIC | FAIL | Step 8 |
| AESTHETIC_SPEC_IN_COMPILER | FAIL | Step 8 |
| CODE_DEPENDENCY | FAIL | Step 8 |
| BOUNDARY_GREP_ERROR | BLOCKED_ENV | Step 8 |
| INPUT_DIR_CREATE_FAILED | BLOCKED_ENV | Step 9 |
| ASSET_COPY_FAILED | BLOCKED_ENV | Step 9 |
| DC_PB001_NOT_FOUND | BLOCKED_ENV | Step 10 |
| HANDOFF_INCOMPLETE | FAIL | Step 10 |
| EVIDENCE_ARCHIVE_ERROR | BLOCKED_ENV | 最终归档 |

## 禁止行为（Forbidden Actions）

- 禁止未通过审美验收（CA-PB-003）就交接资产
- 禁止在 chinese-aesthetic-skill 中实现编译逻辑（webpack/rollup/compiler/shader）
- 禁止在 design-compiler 中定义美学规范（HeartMirror/色彩六角色/宋式温润）
- 禁止通过复制代码制造隐式耦合
- 禁止在 scene.json 中包含运行时专有状态（交互状态、临时矩阵）
- 禁止编译失败时在 design-compiler 中静默修复（必须返回 chinese-aesthetic-skill 修改）
- 禁止假设运行时能力（必须明确降级层级 WebGL2/WebGL1/Static/Neutral）
- 禁止资产路径使用绝对路径或 `..`（必须为相对路径）
- 禁止 manifest.json 的 fileCount 与实际资产数不一致
- 禁止 SHA-256 或 byteSize 与实际文件不匹配
- 禁止在 BLOCKED_ENV 状态下标记 PASS
