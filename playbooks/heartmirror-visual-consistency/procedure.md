# Procedure: HeartMirror 视觉一致性审查

> 代码块性质声明：本文档中所有 bash 代码块均为可直接执行的命令序列。
> 失败处理统一使用 `echo "ERROR_CODE" && exit 1`（或 `exit 2` 表示 BLOCKED_ENV）形式，
> 不再使用 `FAIL (ERROR_CODE)` 伪代码。所有 stderr 必须原始留存，不得使用 `2>/dev/null` 静默吞掉关键路径错误。
>
> 一致性审查说明：Steps 3-9 为跨场景视觉一致性维度，由人或 AI 视觉模型检查后记录到 CONSISTENCY_REVIEW_FILE（JSON）。
> 本 procedure 验证该文件存在、JSON 合法、7 个维度均有 verdict(PASS/FAIL) + evidence(非空) + comparison(场景对对比详情)，
> FAIL 计数纳入最终判定。禁止信任生成工具的自我声明，必须有实际检查证据和跨场景对比记录。
>
> 自动化辅助校验：Steps 3-5 同时包含基于 ffprobe/identify 的客观参数提取（色彩统计、位深、分辨率），
> 用于为主观一致性判定提供可复核的数值证据。客观参数异常直接计 FAIL，不依赖主观判断。

## Phase 0: 输入验证与工具链检查

1. 验证必填输入参数：

```bash
# 对齐 CA-PB-003 REV-3：移除 ${VAR:?}，改用纯手动检查，确保 PARAM_MISSING 错误码可产出
SCENE_DIRS="${SCENE_DIRS:-}"
CONSISTENCY_REVIEW_FILE="${CONSISTENCY_REVIEW_FILE:-}"
GOLDEN_CASE_DIR="${GOLDEN_CASE_DIR:-}"
DESIGN_LANGUAGE_DOC="${DESIGN_LANGUAGE_DOC:-}"
CONSTRAINT_DOC="${CONSTRAINT_DOC:-}"
```

2. 手动检查必填参数（输出 PARAM_MISSING 错误码）：

```bash
ERR_FILE=$(mktemp -t consistency-err-XXXXXX)
CONSISTENCY_LOG=$(mktemp -t consistency-log-XXXXXX)
EVIDENCE_DIR=$(mktemp -d -t consistency-evidence-XXXXXX)

FAIL_COUNT=0
BLOCKED_COUNT=0

for var_name in SCENE_DIRS CONSISTENCY_REVIEW_FILE GOLDEN_CASE_DIR; do
  eval "var_value=\${$var_name:-}"
  if [ -z "$var_value" ]; then
    echo "PARAM_MISSING: $var_name not set"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  fi
done

echo "SCENE_DIRS=$SCENE_DIRS" >> "$CONSISTENCY_LOG"
echo "CONSISTENCY_REVIEW_FILE=$CONSISTENCY_REVIEW_FILE" >> "$CONSISTENCY_LOG"
echo "GOLDEN_CASE_DIR=$GOLDEN_CASE_DIR" >> "$CONSISTENCY_LOG"
echo "DESIGN_LANGUAGE_DOC=$DESIGN_LANGUAGE_DOC" >> "$CONSISTENCY_LOG"
echo "CONSTRAINT_DOC=$CONSTRAINT_DOC" >> "$CONSISTENCY_LOG"
echo "EVIDENCE_DIR=$EVIDENCE_DIR" >> "$CONSISTENCY_LOG"

if [ ! -f "$CONSISTENCY_REVIEW_FILE" ]; then
  echo "CONSISTENCY_REVIEW_FILE_NOT_FOUND: $CONSISTENCY_REVIEW_FILE" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi

if [ ! -d "$GOLDEN_CASE_DIR" ]; then
  echo "GOLDEN_CASE_NOT_FOUND: $GOLDEN_CASE_DIR" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi

if [ -n "$DESIGN_LANGUAGE_DOC" ] && [ ! -f "$DESIGN_LANGUAGE_DOC" ]; then
  echo "DESIGN_LANGUAGE_DOC_NOT_FOUND: $DESIGN_LANGUAGE_DOC" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
```

3. 工具链前置检查：

```bash
REQUIRED_TOOLS="jq ffprobe sha256sum stat mktemp grep find wc sort"
TOOL_MISSING=0
for tool in $REQUIRED_TOOLS; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "TOOL_MISSING: $tool" >> "$CONSISTENCY_LOG"
    TOOL_MISSING=1
  fi
done

# identify (ImageMagick) 为可选工具，用于色彩统计辅助；缺失不阻断但记录
IDENTIFY_AVAILABLE=0
if command -v identify >/dev/null 2>&1; then
  IDENTIFY_AVAILABLE=1
fi
echo "IDENTIFY_AVAILABLE=$IDENTIFY_AVAILABLE" >> "$CONSISTENCY_LOG"

if [ "$TOOL_MISSING" -eq 1 ]; then
  echo "TOOL_MISSING"
  exit 2
fi
```

判定分类：
- `PARAM_MISSING` / `CONSISTENCY_REVIEW_FILE_NOT_FOUND` / `GOLDEN_CASE_NOT_FOUND` / `DESIGN_LANGUAGE_DOC_NOT_FOUND` / `TOOL_MISSING` → BLOCKED_ENV
- 所有输入有效、工具链完整 → Phase 0 PASS

## Step 1: 审查基准建立与场景清单验证

1. 解析场景目录列表并验证每个场景目录存在：

```bash
SCENE_LIST_FILE=$(mktemp -t scene-list-XXXXXX)
SCENE_LIST_RAW=$(mktemp -t scene-list-raw-XXXXXX)

# SCENE_DIRS 为冒号分隔的路径列表，拆分到临时文件
echo "$SCENE_DIRS" | tr ':' '\n' > "$SCENE_LIST_RAW"
TR_EXIT=$?
if [ $TR_EXIT -ne 0 ]; then
  echo "SCENE_DIR_PARSE_ERROR: tr exit=$TR_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
sort "$SCENE_LIST_RAW" > "$SCENE_LIST_FILE"

SCENE_COUNT=$(wc -l < "$SCENE_LIST_FILE")
WC_EXIT=$?
if [ $WC_EXIT -ne 0 ]; then
  echo "SCENE_COUNT_ERROR: wc exit=$WC_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
echo "SCENE_COUNT=$SCENE_COUNT" >> "$CONSISTENCY_LOG"

# 一致性审查至少需要 2 个场景
if [ "$SCENE_COUNT" -lt 2 ]; then
  echo "SCENE_COUNT_INSUFFICIENT: need at least 2 scenes for consistency review, got $SCENE_COUNT" >> "$CONSISTENCY_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

SCENE_DIR_VALIDATION_FILE=$(mktemp -t scene-dir-validation-XXXXXX)
MISSING_SCENE_DIRS=0
while IFS= read -r scene_dir; do
  [ -z "$scene_dir" ] && continue
  if [ ! -d "$scene_dir" ]; then
    echo "SCENE_DIR_NOT_FOUND: $scene_dir" >> "$SCENE_DIR_VALIDATION_FILE"
    MISSING_SCENE_DIRS=$((MISSING_SCENE_DIRS + 1))
  else
    echo "SCENE_DIR_OK: $scene_dir" >> "$SCENE_DIR_VALIDATION_FILE"
  fi
done < "$SCENE_LIST_FILE"

echo "MISSING_SCENE_DIRS=$MISSING_SCENE_DIRS" >> "$CONSISTENCY_LOG"
if [ "$MISSING_SCENE_DIRS" -gt 0 ]; then
  cat "$SCENE_DIR_VALIDATION_FILE" >> "$CONSISTENCY_LOG"
  FAIL_COUNT=$((FAIL_COUNT + MISSING_SCENE_DIRS))
fi
```

2. 验证每个场景目录含必需资产（scene.webp / depth.webp）：

```bash
REQUIRED_ASSETS="scene.webp depth.webp"
MISSING_ASSET_FILE=$(mktemp -t missing-asset-XXXXXX)
MISSING_ASSET_COUNT=0

while IFS= read -r scene_dir; do
  [ -z "$scene_dir" ] && continue
  [ ! -d "$scene_dir" ] && continue
  for asset in $REQUIRED_ASSETS; do
    if [ ! -f "$scene_dir/$asset" ]; then
      echo "MISSING_REQUIRED_ASSET: $scene_dir/$asset" >> "$MISSING_ASSET_FILE"
      MISSING_ASSET_COUNT=$((MISSING_ASSET_COUNT + 1))
    fi
  done
done < "$SCENE_LIST_FILE"

echo "MISSING_ASSET_COUNT=$MISSING_ASSET_COUNT" >> "$CONSISTENCY_LOG"
if [ "$MISSING_ASSET_COUNT" -gt 0 ]; then
  cat "$MISSING_ASSET_FILE" >> "$CONSISTENCY_LOG"
  echo "MISSING_REQUIRED_ASSETS: $MISSING_ASSET_COUNT asset(s) missing across scenes" >> "$CONSISTENCY_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

3. 命名规范检查（场景目录名只含小写字母、数字、连字符）：

```bash
NAMING_VIOLATION_FILE=$(mktemp -t naming-violation-XXXXXX)
while IFS= read -r scene_dir; do
  [ -z "$scene_dir" ] && continue
  scene_basename=$(basename "$scene_dir")
  case "$scene_basename" in
    *[A-Z]*|*' '*|*_*)
      echo "NAMING_VIOLATION $scene_basename (contains uppercase/space/underscore)" >> "$NAMING_VIOLATION_FILE"
      ;;
  esac
done < "$SCENE_LIST_FILE"

NAMING_VIOLATION_COUNT=$(wc -l < "$NAMING_VIOLATION_FILE")
WC_EXIT=$?
echo "NAMING_VIOLATION_COUNT=$NAMING_VIOLATION_COUNT" >> "$CONSISTENCY_LOG"
if [ "$NAMING_VIOLATION_COUNT" -gt 0 ]; then
  cat "$NAMING_VIOLATION_FILE" >> "$CONSISTENCY_LOG"
  echo "NAMING_VIOLATION: $NAMING_VIOLATION_COUNT scene dir(s) violate naming convention" >> "$CONSISTENCY_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

4. Golden Case 资产完整性验证：

```bash
GOLDEN_ASSET_FILE=$(mktemp -t golden-asset-XXXXXX)
GOLDEN_MISSING=0
for asset in $REQUIRED_ASSETS; do
  if [ ! -f "$GOLDEN_CASE_DIR/$asset" ]; then
    echo "GOLDEN_CASE_ASSET_MISSING: $GOLDEN_CASE_DIR/$asset" >> "$GOLDEN_ASSET_FILE"
    GOLDEN_MISSING=$((GOLDEN_MISSING + 1))
  else
    echo "GOLDEN_CASE_ASSET_OK: $GOLDEN_CASE_DIR/$asset" >> "$GOLDEN_ASSET_FILE"
  fi
done

echo "GOLDEN_MISSING=$GOLDEN_MISSING" >> "$CONSISTENCY_LOG"
if [ "$GOLDEN_MISSING" -gt 0 ]; then
  cat "$GOLDEN_ASSET_FILE" >> "$CONSISTENCY_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `SCENE_DIR_PARSE_ERROR` / `SCENE_COUNT_ERROR` → BLOCKED_ENV
- `SCENE_COUNT_INSUFFICIENT` / `SCENE_DIR_NOT_FOUND` / `MISSING_REQUIRED_ASSETS` / `NAMING_VIOLATION` / `GOLDEN_CASE_ASSET_MISSING` → FAIL
- 所有场景目录存在、必需资产齐全、命名合规、Golden Case 完整 → Step 1 PASS

## Step 2: CONSISTENCY_REVIEW_FILE 结构验证（核心）

1. 前置 jq empty 校验，非法 JSON 提前熔断：

```bash
jq empty "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE"
JQ_EMPTY_EXIT=$?
if [ $JQ_EMPTY_EXIT -ne 0 ]; then
  echo "CONSISTENCY_REVIEW_JSON_INVALID: jq empty exit=$JQ_EMPTY_EXIT" >> "$CONSISTENCY_LOG"
  cat "$ERR_FILE" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
```

2. 验证 7 个一致性维度均存在且有 verdict + evidence + comparison：

```bash
CONSISTENCY_DIMENSIONS="colorConsistency materialConsistency lightingConsistency compositionConsistency styleContinuity narrativeCoherence motionStaticHarmony"
CONSISTENCY_FAIL_COUNT=0
CONSISTENCY_MISSING_COUNT=0
DIMENSION_DETAIL_FILE=$(mktemp -t dimension-detail-XXXXXX)

for dim in $CONSISTENCY_DIMENSIONS; do
  DIM_VERDICT=$(jq -r ".dimensions.$dim.verdict // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
  JQ_EXIT=$?
  if [ $JQ_EXIT -ne 0 ]; then
    echo "CONSISTENCY_REVIEW_PARSE_ERROR: dimension=$dim jq exit=$JQ_EXIT" >> "$CONSISTENCY_LOG"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    continue
  fi

  DIM_EVIDENCE=$(jq -r ".dimensions.$dim.evidence // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
  DIM_COMPARISON=$(jq -r ".dimensions.$dim.comparison // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")

  if [ -z "$DIM_VERDICT" ]; then
    echo "CONSISTENCY_DIMENSION_MISSING: $dim has no verdict" >> "$DIMENSION_DETAIL_FILE"
    CONSISTENCY_MISSING_COUNT=$((CONSISTENCY_MISSING_COUNT + 1))
  elif [ "$DIM_VERDICT" != "PASS" ] && [ "$DIM_VERDICT" != "FAIL" ]; then
    echo "CONSISTENCY_DIMENSION_INVALID_VERDICT: $dim verdict='$DIM_VERDICT' (must be PASS or FAIL)" >> "$DIMENSION_DETAIL_FILE"
    CONSISTENCY_MISSING_COUNT=$((CONSISTENCY_MISSING_COUNT + 1))
  elif [ -z "$DIM_EVIDENCE" ]; then
    echo "CONSISTENCY_DIMENSION_NO_EVIDENCE: $dim verdict=$DIM_VERDICT but evidence is empty" >> "$DIMENSION_DETAIL_FILE"
    CONSISTENCY_MISSING_COUNT=$((CONSISTENCY_MISSING_COUNT + 1))
  elif [ -z "$DIM_COMPARISON" ]; then
    echo "CONSISTENCY_DIMENSION_NO_COMPARISON: $dim verdict=$DIM_VERDICT but comparison (scene-pair detail) is empty" >> "$DIMENSION_DETAIL_FILE"
    CONSISTENCY_MISSING_COUNT=$((CONSISTENCY_MISSING_COUNT + 1))
  elif [ "$DIM_VERDICT" = "FAIL" ]; then
    echo "CONSISTENCY_DIMENSION_FAIL: $dim" >> "$DIMENSION_DETAIL_FILE"
    CONSISTENCY_FAIL_COUNT=$((CONSISTENCY_FAIL_COUNT + 1))
  else
    echo "CONSISTENCY_DIMENSION_PASS: $dim" >> "$DIMENSION_DETAIL_FILE"
  fi
done

cat "$DIMENSION_DETAIL_FILE" >> "$CONSISTENCY_LOG"
echo "CONSISTENCY_FAIL_COUNT=$CONSISTENCY_FAIL_COUNT" >> "$CONSISTENCY_LOG"
echo "CONSISTENCY_MISSING_COUNT=$CONSISTENCY_MISSING_COUNT" >> "$CONSISTENCY_LOG"

if [ "$CONSISTENCY_MISSING_COUNT" -gt 0 ]; then
  echo "CONSISTENCY_REVIEW_INCOMPLETE: $CONSISTENCY_MISSING_COUNT dimension(s) missing verdict/evidence/comparison"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

if [ "$CONSISTENCY_FAIL_COUNT" -gt 0 ]; then
  echo "CONSISTENCY_FAIL: $CONSISTENCY_FAIL_COUNT consistency dimension(s) failed inspection"
  FAIL_COUNT=$((FAIL_COUNT + CONSISTENCY_FAIL_COUNT))
fi
```

3. 验证 issues 数组结构（如存在）：

```bash
ISSUES_COUNT=$(jq -r ".issues | length // 0" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "ISSUES_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
else
  echo "ISSUES_COUNT=$ISSUES_COUNT" >> "$CONSISTENCY_LOG"
fi
```

判定分类：
- `CONSISTENCY_REVIEW_JSON_INVALID` / `CONSISTENCY_REVIEW_PARSE_ERROR` / `ISSUES_PARSE_ERROR` → BLOCKED_ENV
- `CONSISTENCY_DIMENSION_MISSING` / `CONSISTENCY_DIMENSION_INVALID_VERDICT` / `CONSISTENCY_DIMENSION_NO_EVIDENCE` / `CONSISTENCY_DIMENSION_NO_COMPARISON` / `CONSISTENCY_REVIEW_INCOMPLETE` → FAIL
- `CONSISTENCY_FAIL`（维度 FAIL）→ FAIL
- 7 个一致性维度全部 PASS 且有 evidence + comparison → Step 2 PASS

> Steps 3-9 的一致性维度均在上方循环中统一验证。各维度的具体检查标准如下：
> - **colorConsistency（色彩一致性）**：主色调/辅色/点缀色在场景间角色一致；HeartMirror 六色体系（青蓝/紫/金/白/朱砂/藤黄）无偏离；无高饱和荧光色；色彩角色分配（境/玄/脉/息/印/生）统一
> - **materialConsistency（材质一致性）**：同类物体（木门/石柱/金属/玉）在不同场景中材质处理统一；纹理风格/粗糙度/金属度一致；无塑料感/玻璃幕墙等非中式材质
> - **lightingConsistency（光照一致性）**：同类型场景光源方向一致（晨曦左上/黄昏低角度/天光顶漫射）；色温范围统一；阴影风格（软/硬、阴影颜色）一致；无光照逻辑突兀
> - **compositionConsistency（构图一致性）**：视角类型（平视/仰视/俯视）符合场景类型；空间尺度和纵深比例统一；视觉焦点位置（三分法/中心/对称）符合产品规范
> - **styleContinuity（风格连续性）**：相邻场景之间无突兀风格跳变；美学特质组合（宋式温润+晨曦天光+辽阔敬畏+中式巨构）一致；无赛博朋克/极简现代等风格跳变
> - **narrativeCoherence（叙事连贯性）**：首次入境仪式视觉叙事连贯（入口→主场景过渡）；多宇宙观入口视觉风格统一；场景间转场逻辑（淡入淡出/视差移动/粒子效果）一致
> - **motionStaticHarmony（动静协调）**：动态转场效果色彩/风格与静态资产一致；动画/粒子效果符合 HeartMirror 语言；运行时渲染效果与设计稿一致

## Step 3: 色彩一致性自动化校验（客观参数辅助）

1. 提取每个场景主图的 ffprobe 色彩信息：

```bash
COLOR_PROBE_FILE=$(mktemp -t color-probe-XXXXXX)
COLOR_PROBE_ERROR=0

while IFS= read -r scene_dir; do
  [ -z "$scene_dir" ] && continue
  [ ! -f "$scene_dir/scene.webp" ] && continue
  scene_name=$(basename "$scene_dir")

  probe_json=$(ffprobe -v error -print_format json -show_format -show_streams "$scene_dir/scene.webp" 2>"$ERR_FILE")
  PROBE_EXIT=$?
  if [ $PROBE_EXIT -ne 0 ]; then
    echo "COLOR_PROBE_ERROR $scene_name (exit=$PROBE_EXIT)" >> "$COLOR_PROBE_FILE"
    cat "$ERR_FILE" >> "$COLOR_PROBE_FILE"
    COLOR_PROBE_ERROR=$((COLOR_PROBE_ERROR + 1))
    continue
  fi

  color_space=$(printf '%s' "$probe_json" | jq -r '.streams[0].color_space // "unknown"' 2>/dev/null)
  color_transfer=$(printf '%s' "$probe_json" | jq -r '.streams[0].color_transfer // "unknown"' 2>/dev/null)
  color_primaries=$(printf '%s' "$probe_json" | jq -r '.streams[0].color_primaries // "unknown"' 2>/dev/null)
  width=$(printf '%s' "$probe_json" | jq -r '.streams[0].width // 0' 2>/dev/null)
  height=$(printf '%s' "$probe_json" | jq -r '.streams[0].height // 0' 2>/dev/null)

  echo "COLOR_PROBE_OK $scene_name: ${width}x${height} color_space=$color_space transfer=$color_transfer primaries=$color_primaries" >> "$COLOR_PROBE_FILE"
done < "$SCENE_LIST_FILE"

# Golden Case 同样提取
if [ -f "$GOLDEN_CASE_DIR/scene.webp" ]; then
  probe_json=$(ffprobe -v error -print_format json -show_format -show_streams "$GOLDEN_CASE_DIR/scene.webp" 2>"$ERR_FILE")
  PROBE_EXIT=$?
  if [ $PROBE_EXIT -ne 0 ]; then
    echo "COLOR_PROBE_ERROR golden-case (exit=$PROBE_EXIT)" >> "$COLOR_PROBE_FILE"
    COLOR_PROBE_ERROR=$((COLOR_PROBE_ERROR + 1))
  else
    color_space=$(printf '%s' "$probe_json" | jq -r '.streams[0].color_space // "unknown"' 2>/dev/null)
    echo "COLOR_PROBE_OK golden-case: color_space=$color_space" >> "$COLOR_PROBE_FILE"
  fi
fi

echo "COLOR_PROBE_ERROR=$COLOR_PROBE_ERROR" >> "$CONSISTENCY_LOG"
if [ "$COLOR_PROBE_ERROR" -gt 0 ]; then
  cat "$COLOR_PROBE_FILE" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + COLOR_PROBE_ERROR))
fi
```

2. 色彩空间一致性检查（所有场景应使用相同 color_space）：

```bash
# REV-2 修正：L3 — 拆分 grep | sed | sort | uniq 管道，独立捕获 grep 退出码
COLOR_SPACE_RAW=$(mktemp -t color-space-raw-XXXXXX)
grep "^COLOR_PROBE_OK" "$COLOR_PROBE_FILE" 2>"$ERR_FILE" > "$COLOR_SPACE_RAW"
GREP_EXIT=$?
COLOR_SPACE_FILE=$(mktemp -t color-space-XXXXXX)
if [ $GREP_EXIT -ne 0 ]; then
  echo "COLOR_SPACE_GREP_ERROR: grep exit=$GREP_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
sed 's/.*color_space=//' "$COLOR_SPACE_RAW" | sed 's/ .*//' | sort | uniq -c > "$COLOR_SPACE_FILE"

COLOR_SPACE_VARIETY=$(wc -l < "$COLOR_SPACE_FILE")
WC_EXIT=$?
echo "COLOR_SPACE_VARIETY=$COLOR_SPACE_VARIETY" >> "$CONSISTENCY_LOG"

if [ "$COLOR_SPACE_VARIETY" -gt 1 ]; then
  echo "COLOR_SPACE_INCONSISTENT: scenes use $COLOR_SPACE_VARIETY different color_spaces" >> "$CONSISTENCY_LOG"
  cat "$COLOR_SPACE_FILE" >> "$CONSISTENCY_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

3. 色彩统计辅助记录（identify 可用时，仅作参考，不做客观判定）：

```bash
FLUORESCENT_FILE=$(mktemp -t fluorescent-XXXXXX)

if [ "$IDENTIFY_AVAILABLE" -eq 1 ]; then
  while IFS= read -r scene_dir; do
    [ -z "$scene_dir" ] && continue
    [ ! -f "$scene_dir/scene.webp" ] && continue
    scene_name=$(basename "$scene_dir")

    identify -verbose "$scene_dir/scene.webp" 2>"$ERR_FILE" | grep -A5 "Channel statistics:" > /dev/null 2>&1
    IDENTIFY_EXIT=$?
    if [ $IDENTIFY_EXIT -ne 0 ]; then
      echo "identify skipped for $scene_name (exit=$IDENTIFY_EXIT)" >> "$FLUORESCENT_FILE"
      continue
    fi

    # 仅统计唯一色彩数作为辅助参考；高饱和荧光色的主观判定在 CONSISTENCY_REVIEW_FILE colorConsistency 维度完成
    color_count=$(identify -format "%k" "$scene_dir/scene.webp" 2>"$ERR_FILE")
    IDENTIFY_EXIT=$?
    if [ $IDENTIFY_EXIT -eq 0 ]; then
      echo "COLOR_COUNT $scene_name: $color_count unique colors (reference only)" >> "$FLUORESCENT_FILE"
    fi
  done < "$SCENE_LIST_FILE"
else
  echo "COLOR_IDENTIFY_SKIPPED: ImageMagick identify not available, color statistics skipped" >> "$FLUORESCENT_FILE"
fi

cat "$FLUORESCENT_FILE" >> "$CONSISTENCY_LOG"
```

判定分类：
- `COLOR_PROBE_ERROR` → BLOCKED_ENV
- `COLOR_SPACE_INCONSISTENT` → FAIL
- `HIGH_SATURATION_FLUORESCENT`（主观维度在 CONSISTENCY_REVIEW_FILE 中判定，客观参数仅作辅助记录）→ FAIL
- 所有场景色彩空间一致、无高饱和荧光色客观异常 → Step 3 PASS

## Step 4: 材质一致性校验

1. 提取每个场景深度图和主图的技术参数作为材质一致性参考：

```bash
MATERIAL_PROBE_FILE=$(mktemp -t material-probe-XXXXXX)
MATERIAL_PROBE_ERROR=0

while IFS= read -r scene_dir; do
  [ -z "$scene_dir" ] && continue
  scene_name=$(basename "$scene_dir")

  for asset in scene.webp depth.webp; do
    [ ! -f "$scene_dir/$asset" ] && continue
    probe_json=$(ffprobe -v error -print_format json -show_streams "$scene_dir/$asset" 2>"$ERR_FILE")
    PROBE_EXIT=$?
    if [ $PROBE_EXIT -ne 0 ]; then
      echo "MATERIAL_PROBE_ERROR $scene_name/$asset (exit=$PROBE_EXIT)" >> "$MATERIAL_PROBE_FILE"
      MATERIAL_PROBE_ERROR=$((MATERIAL_PROBE_ERROR + 1))
      continue
    fi
    pix_fmt=$(printf '%s' "$probe_json" | jq -r '.streams[0].pix_fmt // "unknown"' 2>/dev/null)
    bits=$(printf '%s' "$probe_json" | jq -r '.streams[0].bits_per_raw_sample // 0' 2>/dev/null)
    echo "MATERIAL_PROBE_OK $scene_name/$asset: pix_fmt=$pix_fmt bits=$bits" >> "$MATERIAL_PROBE_FILE"
  done
done < "$SCENE_LIST_FILE"

echo "MATERIAL_PROBE_ERROR=$MATERIAL_PROBE_ERROR" >> "$CONSISTENCY_LOG"
if [ "$MATERIAL_PROBE_ERROR" -gt 0 ]; then
  cat "$MATERIAL_PROBE_FILE" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + MATERIAL_PROBE_ERROR))
fi
```

2. 深度图位深一致性检查（所有场景深度图应统一 16-bit）：

```bash
# REV-2 修正：L3 — 拆分 grep | sed | sort | uniq 管道，独立捕获 grep 退出码
DEPTH_BIT_RAW=$(mktemp -t depth-bit-raw-XXXXXX)
grep "depth.webp" "$MATERIAL_PROBE_FILE" 2>"$ERR_FILE" > "$DEPTH_BIT_RAW"
GREP_EXIT=$?
DEPTH_BIT_FILE=$(mktemp -t depth-bit-XXXXXX)
if [ $GREP_EXIT -ne 0 ]; then
  echo "DEPTH_BIT_GREP_ERROR: grep exit=$GREP_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
sed 's/.*bits=//' "$DEPTH_BIT_RAW" | sort | uniq -c > "$DEPTH_BIT_FILE"

DEPTH_BIT_VARIETY=$(wc -l < "$DEPTH_BIT_FILE")
WC_EXIT=$?
echo "DEPTH_BIT_VARIETY=$DEPTH_BIT_VARIETY" >> "$CONSISTENCY_LOG"

if [ "$DEPTH_BIT_VARIETY" -gt 1 ]; then
  echo "DEPTH_BIT_INCONSISTENT: scenes use $DEPTH_BIT_VARIETY different depth bit depths" >> "$CONSISTENCY_LOG"
  cat "$DEPTH_BIT_FILE" >> "$CONSISTENCY_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `MATERIAL_PROBE_ERROR` → BLOCKED_ENV
- `DEPTH_BIT_INCONSISTENT` / `MATERIAL_TEXTURE_INCONSISTENT`（主观维度在 CONSISTENCY_REVIEW_FILE 中判定）→ FAIL
- 所有场景深度图位深统一、材质处理一致 → Step 4 PASS

## Step 5: 光照一致性校验

1. 提取每个场景主图的分辨率和色彩传输特征作为光照参考：

```bash
LIGHTING_PROBE_FILE=$(mktemp -t lighting-probe-XXXXXX)

while IFS= read -r scene_dir; do
  [ -z "$scene_dir" ] && continue
  [ ! -f "$scene_dir/scene.webp" ] && continue
  scene_name=$(basename "$scene_dir")

  probe_json=$(ffprobe -v error -print_format json -show_streams "$scene_dir/scene.webp" 2>"$ERR_FILE")
  PROBE_EXIT=$?
  if [ $PROBE_EXIT -ne 0 ]; then
    echo "LIGHTING_PROBE_ERROR $scene_name (exit=$PROBE_EXIT)" >> "$LIGHTING_PROBE_FILE"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    continue
  fi

  color_transfer=$(printf '%s' "$probe_json" | jq -r '.streams[0].color_transfer // "unknown"' 2>/dev/null)
  color_range=$(printf '%s' "$probe_json" | jq -r '.streams[0].color_range // "unknown"' 2>/dev/null)
  echo "LIGHTING_PROBE_OK $scene_name: transfer=$color_transfer range=$color_range" >> "$LIGHTING_PROBE_FILE"
done < "$SCENE_LIST_FILE"

cat "$LIGHTING_PROBE_FILE" >> "$CONSISTENCY_LOG"
```

2. 光照参数一致性检查：

```bash
# REV-2 修正：L3 — 拆分 grep | sed | sort | uniq 管道，独立捕获 grep 退出码
LIGHTING_TRANSFER_RAW=$(mktemp -t lighting-transfer-raw-XXXXXX)
grep "^LIGHTING_PROBE_OK" "$LIGHTING_PROBE_FILE" 2>"$ERR_FILE" > "$LIGHTING_TRANSFER_RAW"
GREP_EXIT=$?
LIGHTING_TRANSFER_FILE=$(mktemp -t lighting-transfer-XXXXXX)
if [ $GREP_EXIT -ne 0 ]; then
  echo "LIGHTING_TRANSFER_GREP_ERROR: grep exit=$GREP_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
sed 's/.*transfer=//' "$LIGHTING_TRANSFER_RAW" | sed 's/ .*//' | sort | uniq -c > "$LIGHTING_TRANSFER_FILE"

LIGHTING_TRANSFER_VARIETY=$(wc -l < "$LIGHTING_TRANSFER_FILE")
WC_EXIT=$?
echo "LIGHTING_TRANSFER_VARIETY=$LIGHTING_TRANSFER_VARIETY" >> "$CONSISTENCY_LOG"

# 注意：不同场景类型（晨曦/黄昏/夜景）允许不同 color_transfer，此处仅记录不直接判 FAIL
# 光照一致性的主观判定在 CONSISTENCY_REVIEW_FILE 的 lightingConsistency 维度中完成
cat "$LIGHTING_TRANSFER_FILE" >> "$CONSISTENCY_LOG"
```

判定分类：
- `LIGHTING_PROBE_ERROR` → BLOCKED_ENV
- `LIGHTING_PARAM_INCONSISTENT` / `COLOR_TEMPERATURE_DEVIATION`（主观维度在 CONSISTENCY_REVIEW_FILE 中判定）→ FAIL
- 同类型场景光照参数一致、色温范围统一 → Step 5 PASS

## Step 6: 构图一致性校验

1. 提取每个场景主图的分辨率和宽高比：

```bash
COMPOSITION_FILE=$(mktemp -t composition-XXXXXX)
ASPECT_RATIO_FILE=$(mktemp -t aspect-ratio-XXXXXX)

while IFS= read -r scene_dir; do
  [ -z "$scene_dir" ] && continue
  [ ! -f "$scene_dir/scene.webp" ] && continue
  scene_name=$(basename "$scene_dir")

  probe_json=$(ffprobe -v error -print_format json -show_streams "$scene_dir/scene.webp" 2>"$ERR_FILE")
  PROBE_EXIT=$?
  if [ $PROBE_EXIT -ne 0 ]; then
    echo "COMPOSITION_PROBE_ERROR $scene_name (exit=$PROBE_EXIT)" >> "$COMPOSITION_FILE"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    continue
  fi

  width=$(printf '%s' "$probe_json" | jq -r '.streams[0].width // 0' 2>/dev/null)
  height=$(printf '%s' "$probe_json" | jq -r '.streams[0].height // 0' 2>/dev/null)

  # 计算宽高比（保留两位小数）
  if [ "$height" -gt 0 ] 2>/dev/null; then
    aspect_ratio=$(awk "BEGIN {printf \"%.2f\", $width / $height}")
    echo "COMPOSITION_OK $scene_name: ${width}x${height} aspect=$aspect_ratio" >> "$COMPOSITION_FILE"
    echo "$aspect_ratio" >> "$ASPECT_RATIO_FILE"
  else
    echo "COMPOSITION_RESOLUTION_ERROR $scene_name: width=$width height=$height" >> "$COMPOSITION_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done < "$SCENE_LIST_FILE"

cat "$COMPOSITION_FILE" >> "$CONSISTENCY_LOG"
```

2. 宽高比一致性检查：

```bash
ASPECT_VARIETY=$(sort "$ASPECT_RATIO_FILE" | uniq | wc -l)
WC_EXIT=$?
echo "ASPECT_VARIETY=$ASPECT_VARIETY" >> "$CONSISTENCY_LOG"

if [ "$ASPECT_VARIETY" -gt 1 ]; then
  echo "ASPECT_RATIO_INCONSISTENT: scenes use $ASPECT_VARIETY different aspect ratios" >> "$CONSISTENCY_LOG"
  sort "$ASPECT_RATIO_FILE" | uniq -c >> "$CONSISTENCY_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `COMPOSITION_PROBE_ERROR` → BLOCKED_ENV
- `COMPOSITION_RESOLUTION_ERROR` / `ASPECT_RATIO_INCONSISTENT` / `VIEWPOINT_INCONSISTENT` / `COMPOSITION_DEVIATION`（主观维度在 CONSISTENCY_REVIEW_FILE 中判定）→ FAIL
- 所有场景分辨率有效、宽高比统一、构图符合规范 → Step 6 PASS

## Step 7: 风格连续性校验

1. 验证相邻场景对的风格过渡记录存在于 CONSISTENCY_REVIEW_FILE：

```bash
# Step 2 已统一验证 styleContinuity 维度的 verdict+evidence+comparison，此处仅提取归档
STYLE_TRANSITION_FILE=$(mktemp -t style-transition-XXXXXX)

STYLE_COMPARISON=$(jq -r ".dimensions.styleContinuity.comparison // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "STYLE_COMPARISON_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
else
  echo "STYLE_TRANSITION_ARCHIVE: styleContinuity comparison recorded" >> "$STYLE_TRANSITION_FILE"
  echo "$STYLE_COMPARISON" >> "$STYLE_TRANSITION_FILE"
fi

cat "$STYLE_TRANSITION_FILE" >> "$CONSISTENCY_LOG"
```

2. 美学特质组合一致性检查（从 context 中定义的 HeartMirror 美学特质枚举）：

```bash
AESTHETIC_TRAITS="宋式温润 晨曦天光 辽阔敬畏 中式巨构"
AESTHETIC_TRAIT_FILE=$(mktemp -t aesthetic-trait-XXXXXX)

# 检查 CONSISTENCY_REVIEW_FILE 中是否引用了美学特质
for trait in $AESTHETIC_TRAITS; do
  # REV-2 修正：L1 — grep -c 显式退出码处理，移除 || echo 0 静默吞错
  trait_count=$(grep -c "$trait" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
  GREP_EXIT=$?
  if [ $GREP_EXIT -eq 2 ]; then
    echo "AESTHETIC_TRAIT_GREP_ERROR $trait (exit=$GREP_EXIT)" >> "$AESTHETIC_TRAIT_FILE"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    trait_count=0
  fi
  echo "AESTHETIC_TRAIT $trait: referenced $trait_count time(s)" >> "$AESTHETIC_TRAIT_FILE"
done

cat "$AESTHETIC_TRAIT_FILE" >> "$CONSISTENCY_LOG"
```

判定分类：
- `STYLE_COMPARISON_PARSE_ERROR` → BLOCKED_ENV
- `STYLE_ABRUPT_CHANGE` / `AESTHETIC_TRAIT_MISMATCH`（主观维度在 CONSISTENCY_REVIEW_FILE 中判定）→ FAIL
- 相邻场景风格过渡有记录、美学特质组合一致 → Step 7 PASS

## Step 8: 叙事连贯性校验

1. 验证叙事连贯性维度的 comparison 字段包含入境仪式和多宇宙入口：

```bash
# Step 2 已统一验证 narrativeCoherence 维度的 verdict+evidence+comparison，此处仅提取归档
NARRATIVE_FILE=$(mktemp -t narrative-XXXXXX)
NARRATIVE_COMPARISON=$(jq -r ".dimensions.narrativeCoherence.comparison // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "NARRATIVE_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
else
  echo "NARRATIVE_ARCHIVE: narrativeCoherence comparison recorded" >> "$NARRATIVE_FILE"
  echo "$NARRATIVE_COMPARISON" >> "$NARRATIVE_FILE"
fi

cat "$NARRATIVE_FILE" >> "$CONSISTENCY_LOG"
```

2. 转场资产存在性检查（如场景目录含 transition 相关资产）：

```bash
TRANSITION_ASSET_FILE=$(mktemp -t transition-asset-XXXXXX)
TRANSITION_RAW=$(mktemp -t transition-raw-XXXXXX)
while IFS= read -r scene_dir; do
  [ -z "$scene_dir" ] && continue
  [ ! -d "$scene_dir" ] && continue
  scene_name=$(basename "$scene_dir")

  # REV-2 修正：M1 — 拆分 find | wc 管道，独立捕获 find 退出码（对齐 CA-PB-002 REV-3 H2）
  find "$scene_dir" -maxdepth 1 -type f \( -name "*transition*" -o -name "*particle*" -o -name "*entrance*" \) 2>"$ERR_FILE" > "$TRANSITION_RAW"
  FIND_EXIT=$?
  if [ $FIND_EXIT -ne 0 ]; then
    echo "TRANSITION_SCAN_ERROR $scene_name (exit=$FIND_EXIT)" >> "$TRANSITION_ASSET_FILE"
    cat "$ERR_FILE" >> "$TRANSITION_ASSET_FILE"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  else
    transition_count=$(wc -l < "$TRANSITION_RAW")
    echo "TRANSITION_ASSET $scene_name: $transition_count transition-related file(s)" >> "$TRANSITION_ASSET_FILE"
  fi
done < "$SCENE_LIST_FILE"

cat "$TRANSITION_ASSET_FILE" >> "$CONSISTENCY_LOG"
```

判定分类：
- `NARRATIVE_PARSE_ERROR` / `TRANSITION_SCAN_ERROR` → BLOCKED_ENV
- `NARRATIVE_BREAK` / `ENTRY_RITUAL_INCONSISTENT`（主观维度在 CONSISTENCY_REVIEW_FILE 中判定）→ FAIL
- 叙事连贯性有对比记录、转场资产齐全 → Step 8 PASS

## Step 9: 动静协调校验

1. 验证动静协调维度的 comparison 字段：

```bash
# Step 2 已统一验证 motionStaticHarmony 维度的 verdict+evidence+comparison，此处仅提取归档
MOTION_STATIC_FILE=$(mktemp -t motion-static-XXXXXX)
MOTION_COMPARISON=$(jq -r ".dimensions.motionStaticHarmony.comparison // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "MOTION_STATIC_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
else
  echo "MOTION_STATIC_ARCHIVE: motionStaticHarmony comparison recorded" >> "$MOTION_STATIC_FILE"
  echo "$MOTION_COMPARISON" >> "$MOTION_STATIC_FILE"
fi

cat "$MOTION_STATIC_FILE" >> "$CONSISTENCY_LOG"
```

判定分类：
- `MOTION_STATIC_PARSE_ERROR` → BLOCKED_ENV
- `MOTION_STATIC_MISMATCH`（主观维度在 CONSISTENCY_REVIEW_FILE 中判定）→ FAIL
- 动静协调有对比记录、动态转场与静态资产风格一致 → Step 9 PASS

## Step 10: 问题分类与严重程度汇总

1. 验证 CONSISTENCY_REVIEW_FILE 中 issues 数组的每条问题均有分类和严重程度：

```bash
ISSUE_VALIDATION_FILE=$(mktemp -t issue-validation-XXXXXX)
ISSUE_NOT_CLASSIFIED=0
ISSUE_NO_EVIDENCE=0
ISSUE_SEVERITY_INVALID=0

if [ "$ISSUES_COUNT" -gt 0 ] 2>/dev/null; then
  for i in $(seq 0 $((ISSUES_COUNT - 1))); do
    issue_category=$(jq -r ".issues[$i].category // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
    issue_severity=$(jq -r ".issues[$i].severity // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
    issue_evidence=$(jq -r ".issues[$i].evidence // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
    issue_desc=$(jq -r ".issues[$i].description // empty" "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")

    # 分类必须是四类之一
    case "$issue_category" in
      aesthetic|technical|asset|narrative) ;;
      *)
        echo "ISSUE_NOT_CLASSIFIED: issue[$i] category='$issue_category' (must be aesthetic/technical/asset/narrative)" >> "$ISSUE_VALIDATION_FILE"
        ISSUE_NOT_CLASSIFIED=$((ISSUE_NOT_CLASSIFIED + 1))
        ;;
    esac

    # 严重程度必须是三级之一
    case "$issue_severity" in
      blocking|important|suggestion) ;;
      *)
        echo "ISSUE_SEVERITY_INVALID: issue[$i] severity='$issue_severity' (must be blocking/important/suggestion)" >> "$ISSUE_VALIDATION_FILE"
        ISSUE_SEVERITY_INVALID=$((ISSUE_SEVERITY_INVALID + 1))
        ;;
    esac

    # 证据非空
    if [ -z "$issue_evidence" ]; then
      echo "ISSUE_NO_EVIDENCE: issue[$i] '$issue_desc' has no evidence" >> "$ISSUE_VALIDATION_FILE"
      ISSUE_NO_EVIDENCE=$((ISSUE_NO_EVIDENCE + 1))
    fi
  done
fi

echo "ISSUE_NOT_CLASSIFIED=$ISSUE_NOT_CLASSIFIED" >> "$CONSISTENCY_LOG"
echo "ISSUE_NO_EVIDENCE=$ISSUE_NO_EVIDENCE" >> "$CONSISTENCY_LOG"
echo "ISSUE_SEVERITY_INVALID=$ISSUE_SEVERITY_INVALID" >> "$CONSISTENCY_LOG"

if [ "$ISSUE_NOT_CLASSIFIED" -gt 0 ] || [ "$ISSUE_NO_EVIDENCE" -gt 0 ] || [ "$ISSUE_SEVERITY_INVALID" -gt 0 ]; then
  cat "$ISSUE_VALIDATION_FILE" >> "$CONSISTENCY_LOG"
  FAIL_COUNT=$((FAIL_COUNT + ISSUE_NOT_CLASSIFIED + ISSUE_NO_EVIDENCE + ISSUE_SEVERITY_INVALID))
fi
```

2. 阻断级问题计数：

```bash
BLOCKING_ISSUES=$(jq -r '[.issues[] | select(.severity == "blocking")] | length // 0' "$CONSISTENCY_REVIEW_FILE" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "BLOCKING_ISSUES_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$CONSISTENCY_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
else
  echo "BLOCKING_ISSUES=$BLOCKING_ISSUES" >> "$CONSISTENCY_LOG"
  if [ "$BLOCKING_ISSUES" -gt 0 ]; then
    echo "BLOCKING_ISSUE_DETECTED: $BLOCKING_ISSUES blocking-level issue(s) require immediate fix" >> "$CONSISTENCY_LOG"
    FAIL_COUNT=$((FAIL_COUNT + BLOCKING_ISSUES))
  fi
fi
```

判定分类：
- `BLOCKING_ISSUES_PARSE_ERROR` → BLOCKED_ENV
- `ISSUE_NOT_CLASSIFIED` / `ISSUE_NO_EVIDENCE` / `ISSUE_SEVERITY_INVALID` / `BLOCKING_ISSUE_DETECTED` → FAIL
- 所有问题已分类（美学/技术/资产/叙事）、有证据、严重程度合规 → Step 10 PASS

## 最终状态判定与证据归档

1. 确定最终状态：

```bash
if [ "$BLOCKED_COUNT" -gt 0 ]; then
  CONSISTENCY_STATUS="BLOCKED_ENV"
elif [ "$FAIL_COUNT" -gt 0 ]; then
  CONSISTENCY_STATUS="FAIL"
else
  CONSISTENCY_STATUS="PASS"
fi

echo "CONSISTENCY_STATUS=$CONSISTENCY_STATUS"
echo "FAIL_COUNT=$FAIL_COUNT"
echo "BLOCKED_COUNT=$BLOCKED_COUNT"
echo "CONSISTENCY_FAIL_COUNT=$CONSISTENCY_FAIL_COUNT"
echo "CONSISTENCY_MISSING_COUNT=$CONSISTENCY_MISSING_COUNT"
```

2. 归档证据：

```bash
ARCHIVE_ERROR=0
cp "$CONSISTENCY_REVIEW_FILE" "$EVIDENCE_DIR/consistency-review.json" || ARCHIVE_ERROR=1
cp "$SCENE_LIST_FILE" "$EVIDENCE_DIR/scene-list.txt" || ARCHIVE_ERROR=1
cp "$SCENE_DIR_VALIDATION_FILE" "$EVIDENCE_DIR/scene-dir-validation.txt" || ARCHIVE_ERROR=1
cp "$DIMENSION_DETAIL_FILE" "$EVIDENCE_DIR/dimension-detail.txt" || ARCHIVE_ERROR=1
cp "$COLOR_PROBE_FILE" "$EVIDENCE_DIR/color-probe.txt" || ARCHIVE_ERROR=1
cp "$COLOR_SPACE_FILE" "$EVIDENCE_DIR/color-space.txt" || ARCHIVE_ERROR=1
cp "$MATERIAL_PROBE_FILE" "$EVIDENCE_DIR/material-probe.txt" || ARCHIVE_ERROR=1
cp "$DEPTH_BIT_FILE" "$EVIDENCE_DIR/depth-bit.txt" || ARCHIVE_ERROR=1
cp "$LIGHTING_PROBE_FILE" "$EVIDENCE_DIR/lighting-probe.txt" || ARCHIVE_ERROR=1
cp "$COMPOSITION_FILE" "$EVIDENCE_DIR/composition.txt" || ARCHIVE_ERROR=1
cp "$ASPECT_RATIO_FILE" "$EVIDENCE_DIR/aspect-ratio.txt" || ARCHIVE_ERROR=1
cp "$STYLE_TRANSITION_FILE" "$EVIDENCE_DIR/style-transition.txt" || ARCHIVE_ERROR=1
cp "$NARRATIVE_FILE" "$EVIDENCE_DIR/narrative.txt" || ARCHIVE_ERROR=1
cp "$MOTION_STATIC_FILE" "$EVIDENCE_DIR/motion-static.txt" || ARCHIVE_ERROR=1
cp "$ISSUE_VALIDATION_FILE" "$EVIDENCE_DIR/issue-validation.txt" || ARCHIVE_ERROR=1
cp "$CONSISTENCY_LOG" "$EVIDENCE_DIR/consistency-log.txt" || ARCHIVE_ERROR=1

if [ "$ARCHIVE_ERROR" -ne 0 ]; then
  echo "EVIDENCE_ARCHIVE_ERROR: failed to archive consistency evidence"
  exit 2
fi

echo "EVIDENCE_DIR=$EVIDENCE_DIR"
```

3. 输出最终状态：

```bash
case "$CONSISTENCY_STATUS" in
  PASS)
    echo "CONSISTENCY_REVIEW_PASS: all 7 consistency dimensions passed, visual language unified across scenes"
    exit 0
    ;;
  FAIL)
    echo "CONSISTENCY_REVIEW_FAIL: $FAIL_COUNT failure(s) detected (dimension FAIL + objective parameter mismatch + issue validation)"
    exit 1
    ;;
  BLOCKED_ENV)
    echo "CONSISTENCY_REVIEW_BLOCKED: $BLOCKED_COUNT blocker(s) - input missing or environment issue"
    exit 2
    ;;
  *)
    echo "CONSISTENCY_REVIEW_NOT_RUN: consistency review did not complete"
    exit 2
    ;;
esac
```

判定分类：
- `EVIDENCE_ARCHIVE_ERROR` → BLOCKED_ENV
- 7 个一致性维度全部 PASS（有 evidence + comparison）、客观参数一致、问题分类完整 → PASS
- 有 FAIL 项（维度 FAIL、色彩空间/位深/宽高比不一致、问题未分类/无证据、阻断级问题）→ FAIL
- 有 BLOCKED_ENV 项（输入缺失、工具缺失、ffprobe/jq 执行失败）→ BLOCKED_ENV

## 决策点

- 色彩系统崩溃（六色体系偏离、高饱和荧光色泛滥）→ FAIL，需返回设计修改
- 风格完全偏离（赛博朋克/极简现代跳变）→ FAIL，需重新生成场景
- 叙事断裂（入境仪式不连贯、多宇宙入口风格冲突）→ FAIL，需调整叙事设计
- 客观参数不一致（色彩空间/深度位深/宽高比不统一）→ FAIL，需修复技术管线
- 问题未分类或无证据 → FAIL，需补全审查记录
- 阻断级问题存在 → FAIL，需立即修复后复审
- Golden Case 缺失、CONSISTENCY_REVIEW_FILE 缺失、工具不可用 → BLOCKED_ENV
- 全部通过 → PASS
