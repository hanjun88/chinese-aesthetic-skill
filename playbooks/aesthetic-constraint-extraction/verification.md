# Verification: 中式美学设计约束提取

> 本 Playbook 是设计约束提取的质量门禁。核心纪律是**四层严格分离**：设计意图（纯描述）→ 视觉约束（可观察特征）→ 实现参数（具体数值）→ 验收指标（可测量标准）。层级混淆即 FAIL。
>
> README 中的 SC-N（Success Criteria）与本表的 AC-N.x 一一对应：SC-1 → AC-1.x，SC-2 → AC-2.x，依此类推。

## 代码块性质声明（与 procedure.md 一致）

本文档中的所有 shell 命令示例均为**可执行模板**：

- `<intent-file>`、`<output-dir>` 等尖括号占位符必须替换为实际值后执行
- 失败处理统一使用 `echo "ERROR_CODE" && exit 1`（或 `exit 2` 表示 BLOCKED_ENV）形式，**不再使用 `FAIL (ERROR_CODE)` 伪代码**；验收标准表格中的 `FAIL (ERROR_CODE)` 为状态说明，不是可执行命令
- 所有命令的退出码、stdout 和 stderr 必须原始留存

## 验收标准（Acceptance Criteria）

### AC-1: 设计意图明确（对应 SC-1）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-1.1 | 意图文件存在且非空 | `stat -c %s` > 0 | 缺失或为空 → BLOCKED_ENV | INTENT_FILE_MISSING / INTENT_FILE_EMPTY (BLOCKED_ENV) |
| AC-1.2 | 场景类型在枚举中 | 场景类型匹配 HeartMirror 场景枚举（山门/宫殿/园林/宇宙入口等） | 不在枚举中 → BLOCKED_ENV | SCENE_TYPE_INVALID (BLOCKED_ENV) |
| AC-1.3 | 核心情感在枚举中 | 核心情感匹配 HeartMirror 情感枚举（敬畏/宁静/庄严/神秘等） | 不在枚举中 → BLOCKED_ENV | EMOTION_INVALID (BLOCKED_ENV) |

> AC-1.2/1.3 纪律：场景类型和核心情感必须从 HeartMirror 既定枚举中选择，不得随意创造。
> 不在枚举中的值意味着设计语言未对齐，需补充输入而非强行通过。

### AC-2: HeartMirror 设计语言映射（对应 SC-2）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-2.1 | 六色彩角色完整 | 境/玄/脉/息/印/生 六角色均已分配 | 缺失任一角色 → FAIL | COLOR_ROLE_INCOMPLETE (FAIL) |
| AC-2.2 | 主色调在 HeartMirror 系统中 | 主色调为青蓝/紫/金/白/朱砂/藤黄之一 | 未使用 HeartMirror 色彩 → FAIL | PRIMARY_COLOR_MISSING (FAIL) |
| AC-2.3 | 美学特质已指定 | 至少一项美学特质（宋式温润/晨曦天光/辽阔敬畏/中式巨构）已指定 | 未指定 → 记录，非阻断 | — |
| AC-2.4 | 光照方向已指定 | 光照方向为晨曦/黄昏/月夜/天光之一 | 未指定 → FAIL | LIGHTING_DIRECTION_MISSING (FAIL) |

> AC-2.1 纪律：HeartMirror 色彩系统是六角色体系（青蓝为境、紫为玄、金为脉、白为息、朱砂为印、藤黄为生），必须完整分配，不得随意替换或省略。
>
> AC-2.2 纪律：主色调必须从 HeartMirror 六色中选择，不得引入体系外色彩作为主色调。

### AC-3: 视觉约束可观察（对应 SC-3）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-3.1 | 视觉约束 JSON 已生成 | `visual-constraints.json` 已通过 `jq -n` 生成，含色彩/材质/光照/构图/细节五层 | 生成失败 → BLOCKED_ENV | VISUAL_CONSTRAINT_GENERATION_FAILED (BLOCKED_ENV) |
| AC-3.2 | 约束层无具体色值 | 视觉约束层不含 `#RRGGBB` / `rgb()` / `rgba()` | 含具体色值 → FAIL（层级混淆） | LAYER_CONTAMINATION (FAIL) |
| AC-3.3 | 五层约束完整 | 色彩/材质/光照/构图/细节五层均有内容 | 某层为空 → 记录，非阻断 | — |

> AC-3.2 纪律：视觉约束层是**可观察特征**层，描述"看起来是什么样"，不得包含具体色值。
> 具体色值属于实现参数层。两层混淆是最常见的设计约束提取错误。

### AC-4: 实现参数具体可执行（对应 SC-4）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-4.1 | 实现参数 JSON 已生成 | `implementation-params.json` 已生成，含色彩/材质/光照/几何/输出五组参数 | 生成失败 → BLOCKED_ENV | IMPLEMENTATION_PARAMS_GENERATION_FAILED (BLOCKED_ENV) |
| AC-4.2 | 参数层无主观描述 | 实现参数层不含"好看""有感觉""不错"等主观词 | 含主观描述 → FAIL | SUBJECTIVE_DESCRIPTION_IN_PARAMS (FAIL) |
| AC-4.3 | 参数层字段结构完整 | 色彩/材质/光照/几何/输出五组参数均存在且非空 | 某组缺失 → 记录，非阻断 | — |
| AC-4.4 | 占位符检查在 Step 8 | 模板生成阶段允许占位符，最终检查在 Step 8 执行 | Step 4 检查占位符 → 流程错误 | — |

> AC-4.2 纪律：实现参数层是**技术数值**层，每个字段必须是具体数值或标识符，不得包含主观评价。
> "好看""有感觉"等词出现在参数层意味着约束未被量化。
>
> AC-4.4 纪律：占位符检查已从 Step 4 移至 Step 8 最终封签前。模板生成阶段允许"待填充"标记，全部填充后可达 PASS；含占位符时为 TEMPLATE 状态。

### AC-5: 验收指标可测量（对应 SC-5）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-5.1 | 验收指标 JSON 已生成 | `acceptance-metrics.json` 已生成，含色彩/材质/光照/构图/整体五组指标 | 生成失败 → BLOCKED_ENV | ACCEPTANCE_METRICS_GENERATION_FAILED (BLOCKED_ENV) |
| AC-5.2 | 指标层无模糊词 | 验收指标层不含"好看""差不多""大概"等模糊词 | 含模糊词 → FAIL | VAGUE_WORDS_IN_METRICS (FAIL) |
| AC-5.3 | 每项指标有检测方法 | 每项指标含 `method` 字段，说明如何测量 | 缺检测方法 → FAIL | METRIC_WITHOUT_METHOD (FAIL) |
| AC-5.4 | 占位符检查在 Step 8 | 模板生成阶段允许占位符，最终检查在 Step 8 执行 | Step 5 检查占位符 → 流程错误 | — |

> AC-5.2 纪律：验收指标必须**可测量**，"好看""差不多"等模糊词无法作为通过/失败的判定依据。
> 每项指标必须有具体的数值范围或阈值。
>
> AC-5.3 纪律：有指标无检测方法等于无指标。必须说明用什么工具、什么算法、什么标准来测量。
>
> AC-5.4 纪律：占位符检查已从 Step 5 移至 Step 8 最终封签前，同 AC-4.4。

### AC-6: 禁用倾向明确可检测（对应 SC-6）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-6.1 | 禁用倾向清单已生成 | `forbidden-tendencies.json` 已生成，含至少 6 项禁用倾向 | 生成失败 → BLOCKED_ENV | FORBIDDEN_TENDENCY_GENERATION_FAILED (BLOCKED_ENV) |
| AC-6.2 | 每项有检测方法 | 每项禁用倾向含 `detectionMethod` 字段 | 缺检测方法 → FAIL | FORBIDDEN_NOT_DETECTABLE (FAIL) |
| AC-6.3 | 每项有阈值 | 每项禁用倾向含 `threshold` 字段 | 缺阈值 → FAIL | FORBIDDEN_NOT_DETECTABLE (FAIL) |
| AC-6.4 | 覆盖常见禁用倾向 | 清单覆盖赛博朋克/UI卡片化/高饱和荧光/平面背景/装饰无结构/西方奇幻 | 缺关键项 → 记录，非阻断 | — |

> AC-6.2/6.3 纪律：禁用倾向必须**可检测**。"禁止赛博朋克风格"如果没有检测方法和阈值，就是一句无法执行的空话。
> 每项必须说明：用什么工具检测、阈值是多少、超过阈值即判定违反。

### AC-7: 四层分离校验（对应 SC-7）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-7.1 | 意图层无技术参数 | 设计意图文件不含 `#RRGGBB` / `rgb()` 等具体色值 | 含具体色值 → FAIL | LAYER_CONTAMINATION (FAIL) |
| AC-7.2 | 约束层无具体色值 | 视觉约束层不含具体色值（同 AC-3.2，复核） | 含具体色值 → FAIL | LAYER_CONTAMINATION (FAIL) |
| AC-7.3 | 参数层无主观描述 | 实现参数层不含主观描述词（同 AC-4.2，复核） | 含主观描述 → FAIL | LAYER_CONTAMINATION (FAIL) |
| AC-7.4 | 指标层无模糊词 | 验收指标层不含模糊词（同 AC-5.2，复核） | 含模糊词 → FAIL | LAYER_CONTAMINATION (FAIL) |
| AC-7.5 | 层级检查报告已留存 | `layer-check.txt` 已生成并归档 | 未生成 → BLOCKED_ENV | LAYER_CHECK_MISSING (BLOCKED_ENV) |

> AC-7 纪律：四层分离是本 Playbook 的核心纪律。每一层有明确的内容边界，跨层污染即 FAIL。
> Step 7 的跨层污染检查是对 Step 3-5 各层检查的独立复核，不得省略。

### AC-8: 约束包完整归档（对应 SC-8）

| ID | 检查项 | PASS 条件 | FAIL 条件 | 错误码 |
|---|---|---|---|---|
| AC-8.1 | 约束包 JSON 已生成 | `constraint-package.json` 已合并四层内容，含 schemaVersion/scene/source/layers/validation | 生成失败 → BLOCKED_ENV | CONSTRAINT_PACKAGE_GENERATION_FAILED (BLOCKED_ENV) |
| AC-8.2 | SHA-256 已计算 | 约束包 SHA-256 已计算并记录 | 计算失败 → BLOCKED_ENV | SHA256_FAILED (BLOCKED_ENV) |
| AC-8.3 | 证据已归档 | 6 个 JSON + layer-check.txt + extract-log.txt 已复制到 evidence/ | 归档失败 → BLOCKED_ENV | EVIDENCE_ARCHIVE_ERROR (BLOCKED_ENV) |
| AC-8.4 | 状态枚举正确 | 最终状态为 PASS/TEMPLATE/FAIL/BLOCKED_ENV/NOT_RUN 之一 | 状态缺失或非法 → FAIL | — |
| AC-8.5 | 最终占位符检查 | 约束包无"待填充"→PASS；含"待填充"→TEMPLATE（非FAIL，可交付填充） | 未执行检查 → BLOCKED_ENV | LAYER_CHECK_MISSING (BLOCKED_ENV) |

## 证据要求（Evidence Requirements）

必须保留以下原始输出，不得使用摘要或截图替代：

1. **设计意图**：原始意图文件内容（嵌入约束包 source.intentContent）
2. **HeartMirror 映射**：色彩角色分配表、主色调、美学特质、光照方向（extract-log.txt）
3. **视觉约束**：`visual-constraints.json` 完整 JSON
4. **实现参数**：`implementation-params.json` 完整 JSON
5. **验收指标**：`acceptance-metrics.json` 完整 JSON
6. **禁用倾向**：`forbidden-tendencies.json` 完整 JSON
7. **四层分离检查**：`layer-check.txt` 原始检查结果
8. **约束包**：`constraint-package.json` 完整 JSON + SHA-256
9. **提取日志**：`extract-log.txt` 完整执行日志

## 判定规则（Verdict Rules）

- **PASS**：四层分离清晰，约束可执行可验证，HeartMirror 语言已应用，验收指标可测量，禁用倾向可检测，证据完整归档，所有占位符已填充
- **TEMPLATE**：四层分离清晰，模板生成成功，结构完整，但含未填充占位符（可交付设计团队填充，填充后重新运行可达 PASS）
- **FAIL**：层级混淆、约束不可观察、参数含主观描述、指标不可测量、指标缺检测方法、禁用项不可检测
- **BLOCKED_ENV**：设计意图不明确（文件缺失/为空/场景无效）、工具缺失、JSON 生成失败、SHA-256 计算失败、证据归档失败、层级检查缺失——不得标记 PASS
- **NOT_RUN**：设计意图未收集或约束提取未执行

**绝不因任何前序步骤为 FAIL / BLOCKED_ENV / NOT_RUN 而发出 PASS。TEMPLATE 不等于 PASS（占位符未填充）。**

## 错误码封闭清单（Error Code Taxonomy）

| 错误码 | 判定 | 来源 Step |
|---|---|---|
| INTENT_FILE_MISSING | BLOCKED_ENV | Step 1 |
| INTENT_FILE_EMPTY | BLOCKED_ENV | Step 1 |
| INTENT_FILE_STAT_ERROR | BLOCKED_ENV | Step 1 |
| SCENE_TYPE_INVALID | BLOCKED_ENV | Step 1 |
| EMOTION_INVALID | BLOCKED_ENV | Step 1 |
| COLOR_ROLE_INCOMPLETE | FAIL | Step 2 |
| PRIMARY_COLOR_MISSING | FAIL | Step 2 |
| LIGHTING_DIRECTION_MISSING | FAIL | Step 2 |
| VISUAL_CONSTRAINT_GENERATION_FAILED | BLOCKED_ENV | Step 3 |
| LAYER_CONTAMINATION | FAIL | Step 3/7 |
| IMPLEMENTATION_PARAMS_GENERATION_FAILED | BLOCKED_ENV | Step 4 |
| SUBJECTIVE_DESCRIPTION_IN_PARAMS | FAIL | Step 4 |
| ACCEPTANCE_METRICS_GENERATION_FAILED | BLOCKED_ENV | Step 5 |
| VAGUE_WORDS_IN_METRICS | FAIL | Step 5 |
| METRIC_WITHOUT_METHOD | FAIL | Step 5 |
| METRIC_METHOD_PARSE_ERROR | BLOCKED_ENV | Step 5 |
| FORBIDDEN_TENDENCY_GENERATION_FAILED | BLOCKED_ENV | Step 6 |
| FORBIDDEN_NOT_DETECTABLE | FAIL | Step 6 |
| FORBIDDEN_COUNT_PARSE_ERROR | BLOCKED_ENV | Step 6 |
| FORBIDDEN_DETECTION_PARSE_ERROR | BLOCKED_ENV | Step 6 |
| FORBIDDEN_THRESHOLD_PARSE_ERROR | BLOCKED_ENV | Step 6 |
| LAYER_SEPARATION_FAILED | FAIL | Step 7 |
| LAYER_CHECK_MISSING | BLOCKED_ENV | Step 7/8 |
| CONSTRAINT_PACKAGE_GENERATION_FAILED | BLOCKED_ENV | Step 8 |
| SHA256_FAILED | BLOCKED_ENV | Step 8 |
| EVIDENCE_DIR_CREATE_FAILED | BLOCKED_ENV | Step 8 |
| EVIDENCE_ARCHIVE_ERROR | BLOCKED_ENV | Step 8 |
| TOOL_MISSING | BLOCKED_ENV | Phase 0 |
| GREP_ERROR | BLOCKED_ENV | 多步 |

## 禁止行为（Forbidden Actions）

- 禁止将设计意图直接当作实现参数（跳过视觉约束层）
- 禁止跳过视觉约束直接写代码
- 禁止用"好看""有感觉""差不多"等主观描述作为验收指标
- 禁止随意替换 HeartMirror 色彩系统（六角色必须完整）
- 禁止生成 aestheticScore / ChineseScore 等主观评分
- 禁止将经验性建议写成强制性事实
- 禁止在视觉约束层使用具体色值（#RRGGBB / rgb()）
- 禁止在实现参数层使用主观描述词
- 禁止将含"待填充"占位符的约束包标记为 PASS（TEMPLATE 状态允许交付含占位符的模板供设计团队填充，但不得标记为 PASS）
- 禁止定义不可检测的禁用倾向（缺检测方法或阈值）
- 禁止在 BLOCKED_ENV 状态下标记 PASS
- 禁止省略四层分离校验（Step 7 是独立复核，不得用 Step 3-5 的检查替代）
