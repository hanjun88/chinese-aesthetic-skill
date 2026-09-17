# Procedure: 中式巨构场景资产验收

> 代码块性质声明：本文档中所有 bash 代码块均为可直接执行的命令序列。
> 失败处理统一使用 `echo "ERROR_CODE" && exit 1`（或 `exit 2` 表示 BLOCKED_ENV）形式，
> 不再使用 `FAIL (ERROR_CODE)` 伪代码。所有 stderr 必须原始留存，不得使用 `2>/dev/null` 静默吞掉关键路径错误。
>
> 视觉检查说明：Steps 2-8 为主观视觉质量维度，由人或 AI 视觉模型检查后记录到 VISUAL_INSPECTION_FILE（JSON）。
> 本 procedure 验证该文件存在、JSON 合法、7 个维度均有 verdict(PASS/FAIL) + evidence(非空)，FAIL 计数纳入最终判定。
> 禁止信任生成工具的自我声明，必须有实际检查证据。

## Phase 0: 输入验证与工具链检查

1. 验证必填输入参数：

```bash
# REV-3 修正：M1 — 移除 ${VAR:?}，改用纯手动检查（对齐 CA-PB-002 REV-3），确保 PARAM_MISSING 错误码可产出
SCENE_JSON="${SCENE_JSON:-}"
MANIFEST_JSON="${MANIFEST_JSON:-}"
```

2. 手动检查必填参数（输出 PARAM_MISSING 错误码）：

```bash
ERR_FILE=$(mktemp -t acceptance-err-XXXXXX)
ACCEPTANCE_LOG=$(mktemp -t acceptance-log-XXXXXX)
EVIDENCE_DIR=$(mktemp -d -t acceptance-evidence-XXXXXX)

FAIL_COUNT=0
BLOCKED_COUNT=0

for var_name in ASSET_DIR VISUAL_INSPECTION_FILE; do
  eval "var_value=\${$var_name:-}"
  if [ -z "$var_value" ]; then
    echo "PARAM_MISSING: $var_name not set"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  fi
done

echo "ASSET_DIR=$ASSET_DIR" >> "$ACCEPTANCE_LOG"
echo "VISUAL_INSPECTION_FILE=$VISUAL_INSPECTION_FILE" >> "$ACCEPTANCE_LOG"
echo "SCENE_JSON=$SCENE_JSON" >> "$ACCEPTANCE_LOG"
echo "MANIFEST_JSON=$MANIFEST_JSON" >> "$ACCEPTANCE_LOG"
echo "EVIDENCE_DIR=$EVIDENCE_DIR" >> "$ACCEPTANCE_LOG"

for dir in "$ASSET_DIR"; do
  if [ ! -d "$dir" ]; then
    echo "DIR_NOT_FOUND: $dir" >> "$ACCEPTANCE_LOG"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  fi
done

if [ ! -f "$VISUAL_INSPECTION_FILE" ]; then
  echo "VISUAL_INSPECTION_FILE_NOT_FOUND: $VISUAL_INSPECTION_FILE" >> "$ACCEPTANCE_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
```

3. 工具链前置检查：

```bash
REQUIRED_TOOLS="jq ffprobe sha256sum stat mktemp grep find"
TOOL_MISSING=0
for tool in $REQUIRED_TOOLS; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "TOOL_MISSING: $tool" >> "$ACCEPTANCE_LOG"
    TOOL_MISSING=1
  fi
done

if [ "$TOOL_MISSING" -eq 1 ]; then
  echo "TOOL_MISSING"
  exit 2
fi
```

判定分类：
- `PARAM_MISSING` / `DIR_NOT_FOUND` / `VISUAL_INSPECTION_FILE_NOT_FOUND` / `TOOL_MISSING` → BLOCKED_ENV
- 所有输入有效、工具链完整 → Phase 0 PASS

## Step 1: 技术规格验证

1. 列出资产文件并检查必需资产：

```bash
ASSET_LIST_FILE=$(mktemp -t asset-list-XXXXXX)
ASSET_LIST_RAW=$(mktemp -t asset-list-raw-XXXXXX)
# REV-2 修正：拆开 find | sort 管道，独立捕获 find 退出码
find "$ASSET_DIR" -maxdepth 1 -type f -printf '%f\n' 2>"$ERR_FILE" > "$ASSET_LIST_RAW"
FIND_EXIT=$?
if [ $FIND_EXIT -ne 0 ]; then
  echo "ASSET_SCAN_FAILED: find exit=$FIND_EXIT" >> "$ACCEPTANCE_LOG"
  cat "$ERR_FILE" >> "$ACCEPTANCE_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
sort "$ASSET_LIST_RAW" > "$ASSET_LIST_FILE"

ASSET_COUNT=$(wc -l < "$ASSET_LIST_FILE")
WC_EXIT=$?
if [ $WC_EXIT -ne 0 ]; then
  echo "ASSET_COUNT_ERROR: wc exit=$WC_EXIT" >> "$ACCEPTANCE_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
echo "ASSET_COUNT=$ASSET_COUNT" >> "$ACCEPTANCE_LOG"

REQUIRED_ASSETS="scene.webp depth.webp"
MISSING_REQUIRED=""
for asset in $REQUIRED_ASSETS; do
  if ! grep -q "^${asset}$" "$ASSET_LIST_FILE" 2>/dev/null; then
    MISSING_REQUIRED="$MISSING_REQUIRED $asset"
  fi
done

if [ -n "$MISSING_REQUIRED" ]; then
  echo "MISSING_REQUIRED_ASSETS:$MISSING_REQUIRED" >> "$ACCEPTANCE_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# REV-3 修正：M4 — 新增命名规范检查（只含小写字母、数字、连字符、点号）
NAMING_VIOLATION_FILE=$(mktemp -t naming-violation-XXXXXX)
while IFS= read -r asset_name; do
  [ -z "$asset_name" ] && continue
  case "$asset_name" in
    *[A-Z]*|*' '*|*_*)
      echo "NAMING_VIOLATION $asset_name (contains uppercase/space/underscore)" >> "$NAMING_VIOLATION_FILE"
      ;;
  esac
done < "$ASSET_LIST_FILE"

NAMING_VIOLATION_COUNT=$(wc -l < "$NAMING_VIOLATION_FILE")
WC_EXIT=$?
echo "NAMING_VIOLATION_COUNT=$NAMING_VIOLATION_COUNT" >> "$ACCEPTANCE_LOG"
if [ "$NAMING_VIOLATION_COUNT" -gt 0 ]; then
  cat "$NAMING_VIOLATION_FILE" >> "$ACCEPTANCE_LOG"
  echo "NAMING_VIOLATION: $NAMING_VIOLATION_COUNT file(s) violate naming convention" >> "$ACCEPTANCE_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

2. ffprobe 验证主图和深度图规格：

```bash
FFPROBE_ERR_FILE=$(mktemp -t ffprobe-err-XXXXXX)
TECH_RESULT_FILE=$(mktemp -t tech-result-XXXXXX)

check_image_spec() {
  local file="$1"
  local label="$2"
  local expected_format="${3:-}"
  local min_width="${4:-0}"

  if [ ! -f "$file" ]; then
    echo "SKIP $label (file not found)" >> "$TECH_RESULT_FILE"
    return 0
  fi

  local probe_json
  probe_json=$(ffprobe -v error -print_format json -show_format -show_streams "$file" 2>"$FFPROBE_ERR_FILE")
  local PROBE_EXIT=$?
  if [ $PROBE_EXIT -ne 0 ]; then
    echo "FFPROBE_ERROR $label (exit=$PROBE_EXIT)" >> "$TECH_RESULT_FILE"
    cat "$FFPROBE_ERR_FILE" >> "$TECH_RESULT_FILE"
    return 1
  fi

  local width height format_name color_space
  width=$(printf '%s' "$probe_json" | jq -r '.streams[0].width // 0' 2>/dev/null)
  height=$(printf '%s' "$probe_json" | jq -r '.streams[0].height // 0' 2>/dev/null)
  format_name=$(printf '%s' "$probe_json" | jq -r '.format.format_name // "unknown"' 2>/dev/null)
  color_space=$(printf '%s' "$probe_json" | jq -r '.streams[0].color_space // "unknown"' 2>/dev/null)

  echo "OK $label: ${width}x${height} format=$format_name color_space=$color_space" >> "$TECH_RESULT_FILE"

  local issues=0
  case "$width" in ''|*[!0-9]*)
    echo "RESOLUTION_PARSE_WARNING $label: width='$width' is not a valid integer" >> "$TECH_RESULT_FILE"
    issues=1
    width=0 ;;
  esac
  if [ -n "$expected_format" ] && [ "$format_name" != "$expected_format" ]; then
    echo "FORMAT_MISMATCH $label: expected=$expected_format actual=$format_name" >> "$TECH_RESULT_FILE"
    issues=1
  fi
  if [ "$min_width" -gt 0 ] && [ "$width" -lt "$min_width" ] 2>/dev/null; then
    echo "RESOLUTION_TOO_SMALL $label: width=$width min=$min_width" >> "$TECH_RESULT_FILE"
    issues=1
  fi
  return $issues
}

check_image_spec "$ASSET_DIR/scene.webp" "scene" "webp" 1024
SCENE_EXIT=$?
check_image_spec "$ASSET_DIR/depth.webp" "depth" "webp" 1024
DEPTH_EXIT=$?

TECH_FAIL_COUNT=0
for exit_code in $SCENE_EXIT $DEPTH_EXIT; do
  if [ "$exit_code" -ne 0 ]; then
    TECH_FAIL_COUNT=$((TECH_FAIL_COUNT + 1))
  fi
done

echo "TECH_FAIL_COUNT=$TECH_FAIL_COUNT" >> "$ACCEPTANCE_LOG"
if [ "$TECH_FAIL_COUNT" -gt 0 ]; then
  echo "TECH_SPEC_FAILURE: $TECH_FAIL_COUNT image(s) failed spec check" >> "$ACCEPTANCE_LOG"
  cat "$TECH_RESULT_FILE" >> "$ACCEPTANCE_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

3. 文件大小合理性检查：

```bash
SIZE_RESULT_FILE=$(mktemp -t size-result-XXXXXX)
while IFS= read -r asset_file; do
  [ -z "$asset_file" ] && continue
  full_path="$ASSET_DIR/$asset_file"
  file_size=$(stat -c%s "$full_path" 2>"$ERR_FILE")
  STAT_EXIT=$?
  if [ $STAT_EXIT -ne 0 ]; then
    echo "STAT_ERROR $asset_file (exit=$STAT_EXIT)" >> "$SIZE_RESULT_FILE"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    continue
  fi
  if [ "$file_size" -eq 0 ]; then
    echo "FILE_EMPTY $asset_file" >> "$SIZE_RESULT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  elif [ "$file_size" -gt 104857600 ]; then
    echo "FILE_ABNORMALLY_LARGE $asset_file size=$file_size (>100MB)" >> "$SIZE_RESULT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  else
    echo "SIZE_OK $asset_file size=$file_size" >> "$SIZE_RESULT_FILE"
  fi
done < "$ASSET_LIST_FILE"
```

判定分类：
- `FFPROBE_ERROR` / `STAT_ERROR` / `ASSET_SCAN_FAILED` → BLOCKED_ENV
- `MISSING_REQUIRED_ASSETS` / `TECH_SPEC_FAILURE` / `FORMAT_MISMATCH` / `RESOLUTION_TOO_SMALL` / `FILE_EMPTY` / `FILE_ABNORMALLY_LARGE` → FAIL
- 所有图像技术规格符合、文件大小合理 → Step 1 PASS

## Step 2: 主体尺度检查（视觉检查记录验证）

1. 验证视觉检查记录中主体尺度维度：

```bash
# REV-3 修正：L2 — 前置 jq empty 校验，非法 JSON 提前熔断（避免 7 个维度逐个报 PARSE_ERROR）
jq empty "$VISUAL_INSPECTION_FILE" 2>"$ERR_FILE"
JQ_EMPTY_EXIT=$?
if [ $JQ_EMPTY_EXIT -ne 0 ]; then
  echo "VISUAL_INSPECTION_JSON_INVALID: jq empty exit=$JQ_EMPTY_EXIT" >> "$ACCEPTANCE_LOG"
  cat "$ERR_FILE" >> "$ACCEPTANCE_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi

VISUAL_DIMENSIONS="subjectScale architecturalStructure materialTexture lightingShadow spatialDepth visualFocus colorSystem"
VISUAL_FAIL_COUNT=0
VISUAL_MISSING_COUNT=0

for dim in $VISUAL_DIMENSIONS; do
  DIM_VERDICT=$(jq -r ".dimensions.$dim.verdict // empty" "$VISUAL_INSPECTION_FILE" 2>"$ERR_FILE")
  JQ_EXIT=$?
  if [ $JQ_EXIT -ne 0 ]; then
    echo "VISUAL_INSPECTION_PARSE_ERROR: dimension=$dim jq exit=$JQ_EXIT" >> "$ACCEPTANCE_LOG"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    continue
  fi

  DIM_EVIDENCE=$(jq -r ".dimensions.$dim.evidence // empty" "$VISUAL_INSPECTION_FILE" 2>"$ERR_FILE")

  if [ -z "$DIM_VERDICT" ]; then
    echo "VISUAL_DIMENSION_MISSING: $dim has no verdict" >> "$ACCEPTANCE_LOG"
    VISUAL_MISSING_COUNT=$((VISUAL_MISSING_COUNT + 1))
  elif [ "$DIM_VERDICT" != "PASS" ] && [ "$DIM_VERDICT" != "FAIL" ]; then
    echo "VISUAL_DIMENSION_INVALID_VERDICT: $dim verdict='$DIM_VERDICT' (must be PASS or FAIL)" >> "$ACCEPTANCE_LOG"
    VISUAL_MISSING_COUNT=$((VISUAL_MISSING_COUNT + 1))
  elif [ -z "$DIM_EVIDENCE" ]; then
    echo "VISUAL_DIMENSION_NO_EVIDENCE: $dim verdict=$DIM_VERDICT but evidence is empty" >> "$ACCEPTANCE_LOG"
    VISUAL_MISSING_COUNT=$((VISUAL_MISSING_COUNT + 1))
  elif [ "$DIM_VERDICT" = "FAIL" ]; then
    echo "VISUAL_DIMENSION_FAIL: $dim" >> "$ACCEPTANCE_LOG"
    VISUAL_FAIL_COUNT=$((VISUAL_FAIL_COUNT + 1))
  else
    echo "VISUAL_DIMENSION_PASS: $dim" >> "$ACCEPTANCE_LOG"
  fi
done

echo "VISUAL_FAIL_COUNT=$VISUAL_FAIL_COUNT" >> "$ACCEPTANCE_LOG"
echo "VISUAL_MISSING_COUNT=$VISUAL_MISSING_COUNT" >> "$ACCEPTANCE_LOG"

if [ "$VISUAL_MISSING_COUNT" -gt 0 ]; then
  echo "VISUAL_INSPECTION_INCOMPLETE: $VISUAL_MISSING_COUNT dimension(s) missing verdict or evidence"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

if [ "$VISUAL_FAIL_COUNT" -gt 0 ]; then
  echo "VISUAL_QUALITY_FAIL: $VISUAL_FAIL_COUNT visual dimension(s) failed inspection"
  FAIL_COUNT=$((FAIL_COUNT + VISUAL_FAIL_COUNT))
fi
```

判定分类：
- `VISUAL_INSPECTION_PARSE_ERROR` → BLOCKED_ENV
- `VISUAL_INSPECTION_INCOMPLETE`（缺 verdict/evidence）/ `VISUAL_QUALITY_FAIL`（维度 FAIL）→ FAIL
- 7 个视觉维度全部 PASS 且有证据 → Steps 2-8 视觉检查 PASS

> Steps 3-8 的视觉维度（architecturalStructure / materialTexture / lightingShadow / spatialDepth / visualFocus / colorSystem）
> 均在上方循环中统一验证。各维度的具体检查标准如下：
> - **subjectScale（主体尺度）**：宏大、有压迫感、人在其中显得渺小；有尺度参照（人、物、环境元素）；主体在画面中占比合理
> - **architecturalStructure（建筑结构）**：真实的梁柱、斗拱、门体、屋檐结构；结构有逻辑（承重、连接、比例）；非仅有装饰性纹理
> - **materialTexture（材质纹理）**：木材、石材、金属、玉等中式材质；纹理分辨率和细节充足；无塑料感、玻璃幕墙等非中式材质
> - **lightingShadow（光影层次）**：光源方向明确（晨曦/黄昏/天光）；阴影有层次和方向性；无平光、无阴影、过曝
> - **spatialDepth（空间纵深）**：前景、中景、远景分层；透视正确（近大远小、消失点）；非平面背景
> - **visualFocus（视觉焦点）**：视觉焦点明确（主体建筑、门体、光源）；视线引导清晰（构图、光影、色彩引导）；无元素堆砌、焦点模糊
> - **colorSystem（色彩系统）**：主色调符合 HeartMirror 色彩系统；色彩角色分配（境/玄/脉/息/印/生）合理；无高饱和荧光色、无赛博朋克霓虹倾向

## Step 9: 视差层级验证

1. 深度图位深和格式验证：

```bash
DEPTH_VALIDATION_FILE=$(mktemp -t depth-validation-XXXXXX)

if [ -f "$ASSET_DIR/depth.webp" ]; then
  DEPTH_PROBE=$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,bits_per_raw_sample,codec_name -of csv=p=0 "$ASSET_DIR/depth.webp" 2>"$FFPROBE_ERR_FILE")
  FFPROBE_EXIT=$?
  echo "DEPTH_PROBE=$DEPTH_PROBE" >> "$DEPTH_VALIDATION_FILE"

  if [ $FFPROBE_EXIT -ne 0 ]; then
    echo "DEPTH_PROBE_ERROR: ffprobe exit=$FFPROBE_EXIT" >> "$DEPTH_VALIDATION_FILE"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  else
    DEPTH_BIT_OK=0
    case "$DEPTH_PROBE" in
      *16*) DEPTH_BIT_OK=1 ;;
    esac
    DEPTH_BITS=$(printf '%s' "$DEPTH_PROBE" | awk -F',' '{print $2}' 2>/dev/null)
    if [ -n "$DEPTH_BITS" ] && [ "$DEPTH_BITS" -ge 16 ] 2>/dev/null; then
      DEPTH_BIT_OK=1
    fi

    if [ "$DEPTH_BIT_OK" -eq 0 ]; then
      echo "DEPTH_BIT_DEPTH_INSUFFICIENT: depth map is not 16-bit (probe=$DEPTH_PROBE)" >> "$DEPTH_VALIDATION_FILE"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    else
      echo "DEPTH_BIT_DEPTH=16bit_OK" >> "$DEPTH_VALIDATION_FILE"
    fi
  fi
else
  echo "DEPTH_FILE_MISSING: depth.webp not found" >> "$DEPTH_VALIDATION_FILE"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

2. 水面遮罩和法线贴图验证（如存在）：

```bash
if [ -f "$ASSET_DIR/water-mask.webp" ]; then
  # REV-3 修正：L1 — 水面遮罩 8-bit 自动化校验（对齐 CA-PB-002 REV-3 深度图位深检查模式）
  WM_PROBE=$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,bits_per_raw_sample -of csv=p=0 "$ASSET_DIR/water-mask.webp" 2>"$FFPROBE_ERR_FILE")
  WM_PROBE_EXIT=$?
  echo "WATER_MASK_PROBE=$WM_PROBE" >> "$DEPTH_VALIDATION_FILE"
  if [ $WM_PROBE_EXIT -ne 0 ]; then
    echo "WATER_MASK_PROBE_ERROR: ffprobe exit=$WM_PROBE_EXIT" >> "$DEPTH_VALIDATION_FILE"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  else
    WM_BIT_OK=0
    case "$WM_PROBE" in
      *8*) WM_BIT_OK=1 ;;
    esac
    WM_BITS=$(printf '%s' "$WM_PROBE" | awk -F',' '{print $2}' 2>/dev/null)
    if [ -n "$WM_BITS" ] && [ "$WM_BITS" -le 8 ] 2>/dev/null; then
      WM_BIT_OK=1
    fi
    if [ "$WM_BIT_OK" -eq 0 ]; then
      echo "WATER_MASK_BIT_DEPTH_INVALID: water-mask is not 8-bit (probe=$WM_PROBE)" >> "$DEPTH_VALIDATION_FILE"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    else
      echo "WATER_MASK_BIT_DEPTH=8bit_OK" >> "$DEPTH_VALIDATION_FILE"
    fi
  fi
fi

if [ -f "$ASSET_DIR/normal.webp" ]; then
  NM_PROBE=$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0 "$ASSET_DIR/normal.webp" 2>"$FFPROBE_ERR_FILE")
  echo "NORMAL_MAP_PROBE=$NM_PROBE" >> "$DEPTH_VALIDATION_FILE"
fi

# 分层资产检查（layer-*.webp）
LAYER_COUNT=$(grep -cE '^layer-' "$ASSET_LIST_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then LAYER_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then LAYER_COUNT=0; fi
echo "LAYERED_ASSET_COUNT=$LAYER_COUNT" >> "$DEPTH_VALIDATION_FILE"
```

判定分类：
- `DEPTH_PROBE_ERROR` → BLOCKED_ENV
- `DEPTH_BIT_DEPTH_INSUFFICIENT` / `DEPTH_FILE_MISSING` → FAIL
- 深度图 16-bit、格式正确、遮罩/法线/分层资产（如存在）验证通过 → Step 9 PASS

## Step 10: scene.json / manifest.json 对应验证

1. 如果提供了 SCENE_JSON 或 MANIFEST_JSON，验证资产对应关系：

```bash
SCENE_VALIDATION_FILE=$(mktemp -t scene-validation-XXXXXX)

if [ -n "$MANIFEST_JSON" ] && [ -f "$MANIFEST_JSON" ]; then
  jq empty "$MANIFEST_JSON" 2>"$ERR_FILE"
  JQ_EXIT=$?
  if [ $JQ_EXIT -ne 0 ]; then
    echo "MANIFEST_JSON_INVALID: jq parse exit=$JQ_EXIT" >> "$SCENE_VALIDATION_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  else
    DECLARED_FILECOUNT=$(jq -r '.fileCount // 0' "$MANIFEST_JSON" 2>"$ERR_FILE")
    ACTUAL_FILECOUNT=$(jq -r '.files | length' "$MANIFEST_JSON" 2>"$ERR_FILE")
    echo "DECLARED_FILECOUNT=$DECLARED_FILECOUNT ACTUAL_FILECOUNT=$ACTUAL_FILECOUNT" >> "$SCENE_VALIDATION_FILE"

    if [ "$DECLARED_FILECOUNT" != "$ACTUAL_FILECOUNT" ]; then
      echo "FILECOUNT_MISMATCH: declared=$DECLARED_FILECOUNT actual=$ACTUAL_FILECOUNT" >> "$SCENE_VALIDATION_FILE"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi

    # 逐项 SHA-256 和 byteSize 验证
    SHA_RESULT_FILE=$(mktemp -t sha-results-XXXXXX)
    jq -r '.files[] | "\(.path)\t\(.sha256)\t\(.byteSize)"' "$MANIFEST_JSON" 2>"$ERR_FILE" | while IFS=$'\t' read -r path expected_sha expected_size; do
      [ -z "$path" ] && continue
      local_file="$ASSET_DIR/$path"
      if [ ! -f "$local_file" ]; then
        echo "FILE_NOT_IN_DIR $path" >> "$SHA_RESULT_FILE"
        continue
      fi
      # REV-2 修正：拆开 sha256sum | awk 管道
      SHA256_OUTPUT=$(sha256sum "$local_file" 2>"$ERR_FILE")
      SHA_EXIT=$?
      if [ $SHA_EXIT -ne 0 ]; then
        echo "SHA256_EXEC_ERROR $path (exit=$SHA_EXIT)" >> "$SHA_RESULT_FILE"
        continue
      fi
      actual_sha=$(printf '%s' "$SHA256_OUTPUT" | awk '{print $1}')
      # REV-3 修正：M2 — stat 增加退出码捕获，失败时记录 STAT_ERROR 而非误报 BYTESIZE_MISMATCH
      actual_size=$(stat -c%s "$local_file" 2>"$ERR_FILE")
      STAT_EXIT=$?
      if [ $STAT_EXIT -ne 0 ]; then
        echo "STAT_ERROR $path (exit=$STAT_EXIT)" >> "$SHA_RESULT_FILE"
        continue
      fi

      if [ "$actual_sha" != "$expected_sha" ]; then
        echo "SHA_MISMATCH $path expected=$expected_sha actual=$actual_sha" >> "$SHA_RESULT_FILE"
      elif [ "$actual_size" != "$expected_size" ]; then
        echo "BYTESIZE_MISMATCH $path expected=$expected_size actual=$actual_size" >> "$SHA_RESULT_FILE"
      else
        echo "MATCH $path" >> "$SHA_RESULT_FILE"
      fi
    done

    # 计数各类结果
    SHA_MISMATCH_COUNT=$(grep -c '^SHA_MISMATCH' "$SHA_RESULT_FILE" 2>/dev/null)
    GREP_EXIT=$?; if [ $GREP_EXIT -eq 1 ]; then SHA_MISMATCH_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then SHA_MISMATCH_COUNT=0; fi

    BYTESIZE_MISMATCH_COUNT=$(grep -c '^BYTESIZE_MISMATCH' "$SHA_RESULT_FILE" 2>/dev/null)
    GREP_EXIT=$?; if [ $GREP_EXIT -eq 1 ]; then BYTESIZE_MISMATCH_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then BYTESIZE_MISMATCH_COUNT=0; fi

    FILE_NOT_IN_DIR_COUNT=$(grep -c '^FILE_NOT_IN_DIR' "$SHA_RESULT_FILE" 2>/dev/null)
    GREP_EXIT=$?; if [ $GREP_EXIT -eq 1 ]; then FILE_NOT_IN_DIR_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then FILE_NOT_IN_DIR_COUNT=0; fi

    SHA256_EXEC_ERROR_COUNT=$(grep -c '^SHA256_EXEC_ERROR' "$SHA_RESULT_FILE" 2>/dev/null)
    GREP_EXIT=$?; if [ $GREP_EXIT -eq 1 ]; then SHA256_EXEC_ERROR_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then SHA256_EXEC_ERROR_COUNT=0; fi

    # REV-3 修正：M2 — 新增 STAT_ERROR 计数
    STAT_ERROR_COUNT=$(grep -c '^STAT_ERROR' "$SHA_RESULT_FILE" 2>/dev/null)
    GREP_EXIT=$?; if [ $GREP_EXIT -eq 1 ]; then STAT_ERROR_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then STAT_ERROR_COUNT=0; fi

    echo "SHA_MISMATCH_COUNT=$SHA_MISMATCH_COUNT" >> "$SCENE_VALIDATION_FILE"
    echo "BYTESIZE_MISMATCH_COUNT=$BYTESIZE_MISMATCH_COUNT" >> "$SCENE_VALIDATION_FILE"
    echo "FILE_NOT_IN_DIR_COUNT=$FILE_NOT_IN_DIR_COUNT" >> "$SCENE_VALIDATION_FILE"
    echo "STAT_ERROR_COUNT=$STAT_ERROR_COUNT" >> "$SCENE_VALIDATION_FILE"

    if [ "$SHA_MISMATCH_COUNT" -gt 0 ]; then
      echo "SHA256_MISMATCH: $SHA_MISMATCH_COUNT file(s)" >> "$SCENE_VALIDATION_FILE"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    if [ "$BYTESIZE_MISMATCH_COUNT" -gt 0 ]; then
      echo "BYTESIZE_MISMATCH: $BYTESIZE_MISMATCH_COUNT file(s)" >> "$SCENE_VALIDATION_FILE"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    if [ "$FILE_NOT_IN_DIR_COUNT" -gt 0 ] || [ "$SHA256_EXEC_ERROR_COUNT" -gt 0 ] || [ "$STAT_ERROR_COUNT" -gt 0 ]; then
      echo "MANIFEST_VERIFY_BLOCKED: missing=$FILE_NOT_IN_DIR_COUNT exec_error=$SHA256_EXEC_ERROR_COUNT stat_error=$STAT_ERROR_COUNT" >> "$SCENE_VALIDATION_FILE"
      BLOCKED_COUNT=$((BLOCKED_COUNT + FILE_NOT_IN_DIR_COUNT + SHA256_EXEC_ERROR_COUNT + STAT_ERROR_COUNT))
    fi
  fi
else
  echo "MANIFEST_NOT_PROVIDED: skipping manifest verification (MANIFEST_JSON not set)" >> "$SCENE_VALIDATION_FILE"
fi

# REV-3 修正：M3 — 新增 SCENE_JSON 验证分支
if [ -n "$SCENE_JSON" ] && [ -f "$SCENE_JSON" ]; then
  jq empty "$SCENE_JSON" 2>"$ERR_FILE"
  JQ_EXIT=$?
  if [ $JQ_EXIT -ne 0 ]; then
    echo "SCENE_JSON_INVALID: jq parse exit=$JQ_EXIT" >> "$SCENE_VALIDATION_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  else
    SCENE_ID=$(jq -r '.sceneId // empty' "$SCENE_JSON" 2>"$ERR_FILE")
    if [ -z "$SCENE_ID" ]; then
      echo "SCENE_ID_MISSING: scene.json has no sceneId" >> "$SCENE_VALIDATION_FILE"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    else
      echo "SCENE_ID=$SCENE_ID" >> "$SCENE_VALIDATION_FILE"
    fi
    # 路径合规性检查：所有资产路径为相对路径，不含 .. 或绝对路径
    SCENE_PATH_COUNT=$(jq -r '[.. | strings | select(test("\\.(webp|png|jpg|json)$"))] | length' "$SCENE_JSON" 2>"$ERR_FILE")
    echo "SCENE_REFERENCED_ASSET_COUNT=$SCENE_PATH_COUNT" >> "$SCENE_VALIDATION_FILE"
    PATH_VIOLATION=$(jq -r '[.. | strings | select(test("\\.(webp|png|jpg|json)$"))] | .[] | select(startswith("/") or contains(".."))' "$SCENE_JSON" 2>"$ERR_FILE")
    if [ -n "$PATH_VIOLATION" ]; then
      echo "ABSOLUTE_OR_PARENT_PATH: $PATH_VIOLATION" >> "$SCENE_VALIDATION_FILE"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  fi
else
  echo "SCENE_JSON_NOT_PROVIDED: skipping scene.json verification (SCENE_JSON not set)" >> "$SCENE_VALIDATION_FILE"
fi
```

判定分类：
- `MANIFEST_VERIFY_BLOCKED`（文件缺失/sha256sum/stat 执行失败）→ BLOCKED_ENV
- `MANIFEST_JSON_INVALID` / `FILECOUNT_MISMATCH` / `SHA256_MISMATCH` / `BYTESIZE_MISMATCH` / `SCENE_JSON_INVALID` / `SCENE_ID_MISSING` / `ABSOLUTE_OR_PARENT_PATH` → FAIL
- manifest 和 scene.json 验证通过（或未提供时跳过）→ Step 10 PASS

## 最终状态判定与证据归档

1. 确定最终状态：

```bash
if [ "$BLOCKED_COUNT" -gt 0 ]; then
  ACCEPTANCE_STATUS="BLOCKED_ENV"
elif [ "$FAIL_COUNT" -gt 0 ]; then
  ACCEPTANCE_STATUS="FAIL"
else
  ACCEPTANCE_STATUS="PASS"
fi

echo "ACCEPTANCE_STATUS=$ACCEPTANCE_STATUS"
echo "FAIL_COUNT=$FAIL_COUNT"
echo "BLOCKED_COUNT=$BLOCKED_COUNT"
echo "VISUAL_FAIL_COUNT=$VISUAL_FAIL_COUNT"
```

2. 归档证据：

```bash
ARCHIVE_ERROR=0
cp "$VISUAL_INSPECTION_FILE" "$EVIDENCE_DIR/visual-inspection.json" || ARCHIVE_ERROR=1
cp "$ASSET_LIST_FILE" "$EVIDENCE_DIR/asset-list.txt" || ARCHIVE_ERROR=1
cp "$TECH_RESULT_FILE" "$EVIDENCE_DIR/tech-spec-results.txt" || ARCHIVE_ERROR=1
cp "$SIZE_RESULT_FILE" "$EVIDENCE_DIR/file-size-results.txt" || ARCHIVE_ERROR=1
cp "$DEPTH_VALIDATION_FILE" "$EVIDENCE_DIR/depth-validation.txt" || ARCHIVE_ERROR=1
cp "$SCENE_VALIDATION_FILE" "$EVIDENCE_DIR/scene-manifest-validation.txt" || ARCHIVE_ERROR=1
cp "$ACCEPTANCE_LOG" "$EVIDENCE_DIR/acceptance-log.txt" || ARCHIVE_ERROR=1
if [ -n "$SHA_RESULT_FILE" ] && [ -f "$SHA_RESULT_FILE" ]; then
  cp "$SHA_RESULT_FILE" "$EVIDENCE_DIR/sha256-results.txt" || ARCHIVE_ERROR=1
fi

if [ "$ARCHIVE_ERROR" -ne 0 ]; then
  echo "EVIDENCE_ARCHIVE_ERROR: failed to archive acceptance evidence"
  exit 2
fi

echo "EVIDENCE_DIR=$EVIDENCE_DIR"
```

3. 输出最终状态：

```bash
case "$ACCEPTANCE_STATUS" in
  PASS)
    echo "ASSET_ACCEPTANCE_PASS: all technical and visual checks passed, asset meets Chinese monument standards"
    exit 0
    ;;
  FAIL)
    echo "ASSET_ACCEPTANCE_FAIL: $FAIL_COUNT failure(s) detected (technical + visual)"
    exit 1
    ;;
  BLOCKED_ENV)
    echo "ASSET_ACCEPTANCE_BLOCKED: $BLOCKED_COUNT blocker(s) - input missing or environment issue"
    exit 2
    ;;
  *)
    echo "ASSET_ACCEPTANCE_NOT_RUN: acceptance did not complete"
    exit 2
    ;;
esac
```

判定分类：
- `EVIDENCE_ARCHIVE_ERROR` → BLOCKED_ENV
- 全部技术规格通过、7 个视觉维度全部 PASS（有证据）、视差层级验证通过、manifest 对应验证通过 → PASS
- 有 FAIL 项（技术规格不符、视觉维度 FAIL、深度图位深不足、哈希不匹配）→ FAIL
- 有 BLOCKED_ENV 项（输入缺失、工具缺失、ffprobe/sha256sum 执行失败）→ BLOCKED_ENV

## 决策点

- 技术规格不符（分辨率/格式/命名/大小）→ FAIL，需重新生成资产
- 视觉质量不符（主体尺度/建筑结构/材质/光影/纵深/焦点/色彩任一维度 FAIL）→ FAIL，需修改设计
- 视差层级不符（深度图非 16-bit、深度图缺失）→ FAIL，需重新生成深度图
- manifest 对应验证失败（哈希/byteSize/fileCount 不匹配）→ FAIL，需更新 manifest
- 资产文件缺失、视觉检查记录缺失、工具不可用 → BLOCKED_ENV
- 全部通过 → PASS
