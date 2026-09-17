# Procedure: 中式美学资产到 Runtime 的交接

> 代码块性质声明：本文档中所有 bash 代码块均为可直接执行的命令序列。
> 失败处理统一使用 `echo "ERROR_CODE" && exit 1`（或 `exit 2` 表示 BLOCKED_ENV）形式，
> 不再使用 `FAIL (ERROR_CODE)` 伪代码。所有 stderr 必须原始留存，不得使用 `2>/dev/null` 静默吞掉关键路径错误。

## Phase 0: 输入验证与工具链检查

1. 验证必填输入参数：

```bash
# REV-3 修正：M5 — 手动检查必填参数，输出 PARAM_MISSING 错误码（${VAR:?} 不产出错误码）
for var_name in AESTHETIC_REPO COMPILER_REPO ASSET_DIR SCENE_JSON MANIFEST_JSON; do
  eval "var_value=\${$var_name:-}"
  if [ -z "$var_value" ]; then
    echo "PARAM_MISSING: $var_name not set"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  fi
done
if [ "$BLOCKED_COUNT" -gt 0 ]; then
  exit 2
fi
```

2. 验证目录和文件存在：

```bash
ERR_FILE=$(mktemp -t handoff-err-XXXXXX)
HANDOFF_LOG=$(mktemp -t handoff-log-XXXXXX)
EVIDENCE_DIR=$(mktemp -d -t handoff-evidence-XXXXXX)

echo "AESTHETIC_REPO=$AESTHETIC_REPO" >> "$HANDOFF_LOG"
echo "COMPILER_REPO=$COMPILER_REPO" >> "$HANDOFF_LOG"
echo "ASSET_DIR=$ASSET_DIR" >> "$HANDOFF_LOG"
echo "SCENE_JSON=$SCENE_JSON" >> "$HANDOFF_LOG"
echo "MANIFEST_JSON=$MANIFEST_JSON" >> "$HANDOFF_LOG"
echo "EVIDENCE_DIR=$EVIDENCE_DIR" >> "$HANDOFF_LOG"

FAIL_COUNT=0
BLOCKED_COUNT=0

for dir in "$AESTHETIC_REPO" "$COMPILER_REPO" "$ASSET_DIR"; do
  if [ ! -d "$dir" ]; then
    echo "DIR_NOT_FOUND: $dir" >> "$HANDOFF_LOG"
    echo "DIR_NOT_FOUND: $dir"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  fi
done

for f in "$SCENE_JSON" "$MANIFEST_JSON"; do
  if [ ! -f "$f" ]; then
    echo "FILE_NOT_FOUND: $f" >> "$HANDOFF_LOG"
    echo "FILE_NOT_FOUND: $f"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  fi
done
```

3. 工具链前置检查：

```bash
REQUIRED_TOOLS="jq ffprobe sha256sum stat mktemp grep find cp"
TOOL_MISSING=0
for tool in $REQUIRED_TOOLS; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "TOOL_MISSING: $tool" >> "$HANDOFF_LOG"
    echo "TOOL_MISSING: $tool"
    TOOL_MISSING=1
  fi
done

if [ "$TOOL_MISSING" -eq 1 ]; then
  echo "TOOL_MISSING"
  exit 2
fi
```

判定分类：
- `DIR_NOT_FOUND` / `FILE_NOT_FOUND` / `TOOL_MISSING` → BLOCKED_ENV
- 所有输入有效、工具链完整 → Phase 0 PASS

## Step 1: 确认资产已通过审美验收

1. 检查 CA-PB-003（中式巨构场景资产验收）通过记录：

```bash
ACCEPTANCE_EVIDENCE=""
for candidate in \
  "$ASSET_DIR/../evidence/acceptance-report.txt" \
  "$ASSET_DIR/evidence/acceptance-report.txt" \
  "$AESTHETIC_REPO/playbooks/chinese-monument-asset-acceptance/evidence/acceptance-report.txt"; do
  if [ -f "$candidate" ]; then
    ACCEPTANCE_EVIDENCE="$candidate"
    break
  fi
done

if [ -z "$ACCEPTANCE_EVIDENCE" ]; then
  echo "ACCEPTANCE_NOT_FOUND: no CA-PB-003 acceptance report found" >> "$HANDOFF_LOG"
  echo "ACCEPTANCE_NOT_FOUND"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
else
  echo "ACCEPTANCE_EVIDENCE=$ACCEPTANCE_EVIDENCE" >> "$HANDOFF_LOG"
  if grep -qE '(^|[^A-Z_])PASS([^A-Z_]|$)' "$ACCEPTANCE_EVIDENCE" 2>/dev/null; then
    echo "ACCEPTANCE_STATUS=PASS" >> "$HANDOFF_LOG"
  else
    echo "ACCEPTANCE_NOT_PASS: acceptance report does not contain PASS" >> "$HANDOFF_LOG"
    echo "ACCEPTANCE_NOT_PASS"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
fi
```

2. 检查 CA-PB-001（设计约束提取）通过记录：

```bash
CONSTRAINT_EVIDENCE=""
for candidate in \
  "$ASSET_DIR/../evidence/constraint-package.json" \
  "$ASSET_DIR/evidence/constraint-package.json" \
  "$AESTHETIC_REPO/playbooks/aesthetic-constraint-extraction/evidence/constraint-package.json"; do
  if [ -f "$candidate" ]; then
    CONSTRAINT_EVIDENCE="$candidate"
    break
  fi
done

if [ -z "$CONSTRAINT_EVIDENCE" ]; then
  echo "CONSTRAINT_NOT_FOUND: no CA-PB-001 constraint package found" >> "$HANDOFF_LOG"
  echo "CONSTRAINT_NOT_FOUND"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
else
  echo "CONSTRAINT_EVIDENCE=$CONSTRAINT_EVIDENCE" >> "$HANDOFF_LOG"
  CONSTRAINT_STATUS=$(jq -r '.validation.status // "UNKNOWN"' "$CONSTRAINT_EVIDENCE" 2>"$ERR_FILE")
  JQ_EXIT=$?
  if [ $JQ_EXIT -ne 0 ]; then
    echo "CONSTRAINT_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$HANDOFF_LOG"
    cat "$ERR_FILE" >> "$HANDOFF_LOG"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  else
    echo "CONSTRAINT_STATUS=$CONSTRAINT_STATUS" >> "$HANDOFF_LOG"
    if [ "$CONSTRAINT_STATUS" != "PASS" ] && [ "$CONSTRAINT_STATUS" != "TEMPLATE" ]; then
      echo "CONSTRAINT_NOT_READY: status=$CONSTRAINT_STATUS" >> "$HANDOFF_LOG"
      echo "CONSTRAINT_NOT_READY"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  fi
fi
```

判定分类：
- `ACCEPTANCE_NOT_FOUND` / `CONSTRAINT_NOT_FOUND` / `CONSTRAINT_PARSE_ERROR` → BLOCKED_ENV
- `ACCEPTANCE_NOT_PASS` / `CONSTRAINT_NOT_READY` → FAIL
- 审美验收和约束提取均通过 → Step 1 PASS

## Step 2: 确认编译契约版本

1. 查阅 design-compiler 的 scene.json schema 版本：

```bash
# REV-4 修正：F7 — 添加实际 A 轨 schema 路径 chinese-aesthetic/scene-contract/types.ts（P0 阻断修复）
SCHEMA_FILE=""
for candidate in \
  "$COMPILER_REPO/chinese-aesthetic/scene-contract/types.ts" \
  "$COMPILER_REPO/src/scene-contract/types.ts" \
  "$COMPILER_REPO/scene-contract/types.ts" \
  "$COMPILER_REPO/types/scene.ts"; do
  if [ -f "$candidate" ]; then
    SCHEMA_FILE="$candidate"
    break
  fi
done

if [ -z "$SCHEMA_FILE" ]; then
  echo "SCHEMA_NOT_FOUND: scene.json schema types file not found in design-compiler" >> "$HANDOFF_LOG"
  echo "SCHEMA_NOT_FOUND"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
else
  echo "SCHEMA_FILE=$SCHEMA_FILE" >> "$HANDOFF_LOG"
  SCHEMA_VERSION=$(grep -oE 'schemaVersion["\s:=]+["'\'']?[0-9.]+' "$SCHEMA_FILE" 2>/dev/null | head -1)
  echo "SCHEMA_VERSION=${SCHEMA_VERSION:-unknown}" >> "$HANDOFF_LOG"
fi
```

2. 确认 manifest.json 格式要求和资产命名规范：

```bash
MANIFEST_SCHEMA_FOUND=0
if [ -n "$SCHEMA_FILE" ]; then
  if grep -q "SceneAssetManifest" "$SCHEMA_FILE" 2>/dev/null; then
    MANIFEST_SCHEMA_FOUND=1
    echo "MANIFEST_SCHEMA=SceneAssetManifest found in $SCHEMA_FILE" >> "$HANDOFF_LOG"
  fi
fi

if [ "$MANIFEST_SCHEMA_FOUND" -eq 0 ]; then
  echo "MANIFEST_SCHEMA_NOT_FOUND: SceneAssetManifest not found" >> "$HANDOFF_LOG"
  echo "MANIFEST_SCHEMA_NOT_FOUND"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
```

判定分类：
- `SCHEMA_NOT_FOUND` / `MANIFEST_SCHEMA_NOT_FOUND` → BLOCKED_ENV
- 编译契约版本明确 → Step 2 PASS

## Step 3: 资产清单完整性检查

1. 列出所有待交接资产并检查必需资产：

```bash
ASSET_LIST_FILE=$(mktemp -t asset-list-XXXXXX)
ASSET_LIST_RAW=$(mktemp -t asset-list-raw-XXXXXX)
# REV-3 修正：H2 — 拆开 find | sort 管道，独立捕获 find 退出码
find "$ASSET_DIR" -maxdepth 1 -type f -printf '%f\n' 2>"$ERR_FILE" > "$ASSET_LIST_RAW"
FIND_EXIT=$?
if [ $FIND_EXIT -ne 0 ]; then
  echo "ASSET_SCAN_FAILED: find exit=$FIND_EXIT" >> "$HANDOFF_LOG"
  cat "$ERR_FILE" >> "$HANDOFF_LOG"
  echo "ASSET_SCAN_FAILED"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
sort "$ASSET_LIST_RAW" > "$ASSET_LIST_FILE"

ASSET_COUNT=$(wc -l < "$ASSET_LIST_FILE")
WC_EXIT=$?
if [ $WC_EXIT -ne 0 ]; then
  echo "ASSET_COUNT_ERROR: wc exit=$WC_EXIT" >> "$HANDOFF_LOG"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
echo "ASSET_COUNT=$ASSET_COUNT" >> "$HANDOFF_LOG"

REQUIRED_ASSETS="scene.webp depth.webp scene.json manifest.json"
MISSING_REQUIRED=""
for asset in $REQUIRED_ASSETS; do
  if ! grep -q "^${asset}$" "$ASSET_LIST_FILE" 2>/dev/null; then
    MISSING_REQUIRED="$MISSING_REQUIRED $asset"
  fi
done

if [ -n "$MISSING_REQUIRED" ]; then
  echo "MISSING_REQUIRED_ASSETS:$MISSING_REQUIRED" >> "$HANDOFF_LOG"
  echo "MISSING_REQUIRED_ASSETS:$MISSING_REQUIRED"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

2. 检查可选资产声明和文件命名规范：

```bash
OPTIONAL_ASSETS="water-mask.webp normal.webp"
DECLARED_OPTIONAL=""
for asset in $OPTIONAL_ASSETS; do
  if grep -q "^${asset}$" "$ASSET_LIST_FILE" 2>/dev/null; then
    DECLARED_OPTIONAL="$DECLARED_OPTIONAL $asset"
  fi
done
echo "OPTIONAL_ASSETS_PRESENT:$DECLARED_OPTIONAL" >> "$HANDOFF_LOG"

# 命名规范检查：只允许小写字母、数字、连字符、点号，不得含空格或大写
NAMING_VIOLATIONS=$(grep -cE '[A-Z]| |_' "$ASSET_LIST_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then NAMING_VIOLATIONS=0; elif [ $GREP_EXIT -gt 1 ]; then NAMING_VIOLATIONS=0; fi
echo "NAMING_VIOLATIONS=$NAMING_VIOLATIONS" >> "$HANDOFF_LOG"

if [ "$NAMING_VIOLATIONS" -gt 0 ]; then
  echo "NAMING_VIOLATION: $NAMING_VIOLATIONS files violate naming convention" >> "$HANDOFF_LOG"
  grep -nE '[A-Z]| |_' "$ASSET_LIST_FILE" >> "$HANDOFF_LOG"
  echo "NAMING_VIOLATION"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `ASSET_SCAN_FAILED` / `ASSET_COUNT_ERROR` → BLOCKED_ENV
- `MISSING_REQUIRED_ASSETS` / `NAMING_VIOLATION` → FAIL
- 必需资产齐全、命名规范 → Step 3 PASS

## Step 4: 技术规格验证

1. 检查主图分辨率和格式（ffprobe）：

```bash
FFPROBE_ERR_FILE=$(mktemp -t ffprobe-err-XXXXXX)
TECH_RESULT_FILE=$(mktemp -t tech-result-XXXXXX)

check_image_spec() {
  local file="$1"
  local label="$2"
  local expected_format="${3:-}"
  local min_width="${4:-0}"
  local min_height="${5:-0}"

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

  local width height format_name
  width=$(printf '%s' "$probe_json" | jq -r '.streams[0].width // 0' 2>/dev/null)
  height=$(printf '%s' "$probe_json" | jq -r '.streams[0].height // 0' 2>/dev/null)
  format_name=$(printf '%s' "$probe_json" | jq -r '.format.format_name // "unknown"' 2>/dev/null)

  echo "OK $label: ${width}x${height} format=$format_name" >> "$TECH_RESULT_FILE"

  local issues=0
  if [ -n "$expected_format" ] && [ "$format_name" != "$expected_format" ]; then
    echo "FORMAT_MISMATCH $label: expected=$expected_format actual=$format_name" >> "$TECH_RESULT_FILE"
    issues=1
  fi
  # REV-3 修正：L4 — width/height 非整数时告警，不再静默跳过
  case "$width" in ''|*[!0-9]*)
    echo "RESOLUTION_PARSE_WARNING $label: width='$width' is not a valid integer" >> "$TECH_RESULT_FILE"
    issues=1
    width=0 ;;
  esac
  if [ "$min_width" -gt 0 ] && [ "$width" -lt "$min_width" ] 2>/dev/null; then
    echo "RESOLUTION_TOO_SMALL $label: width=$width min=$min_width" >> "$TECH_RESULT_FILE"
    issues=1
  fi
  return $issues
}

check_image_spec "$ASSET_DIR/scene.webp" "scene" "webp" 1024 1024
SCENE_EXIT=$?
check_image_spec "$ASSET_DIR/depth.webp" "depth" "webp" 1024 1024
DEPTH_EXIT=$?
check_image_spec "$ASSET_DIR/water-mask.webp" "water-mask" "webp" 0 0
WATER_EXIT=$?
check_image_spec "$ASSET_DIR/normal.webp" "normal" "webp" 0 0
NORMAL_EXIT=$?

TECH_FAIL_COUNT=0
for exit_code in $SCENE_EXIT $DEPTH_EXIT $WATER_EXIT $NORMAL_EXIT; do
  if [ "$exit_code" -ne 0 ]; then
    TECH_FAIL_COUNT=$((TECH_FAIL_COUNT + 1))
  fi
done

echo "TECH_FAIL_COUNT=$TECH_FAIL_COUNT" >> "$HANDOFF_LOG"
if [ "$TECH_FAIL_COUNT" -gt 0 ]; then
  echo "TECH_SPEC_FAILURE: $TECH_FAIL_COUNT image(s) failed spec check" >> "$HANDOFF_LOG"
  cat "$TECH_RESULT_FILE" >> "$HANDOFF_LOG"
  echo "TECH_SPEC_FAILURE"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

2. 检查深度图位深（16-bit）和水面遮罩位深（8-bit）：

```bash
# 深度图位深检查（REV-3 修正：M2 — 自动化校验 16-bit，不再仅记录供人工确认）
if [ -f "$ASSET_DIR/depth.webp" ]; then
  DEPTH_PROBE=$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,bits_per_raw_sample,codec_name -of csv=p=0 "$ASSET_DIR/depth.webp" 2>"$FFPROBE_ERR_FILE")
  FFPROBE_EXIT=$?
  echo "DEPTH_PROBE=$DEPTH_PROBE" >> "$HANDOFF_LOG"

  if [ $FFPROBE_EXIT -ne 0 ]; then
    echo "DEPTH_PROBE_ERROR: ffprobe exit=$FFPROBE_EXIT" >> "$HANDOFF_LOG"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
  else
    # 检查位深：pix_fmt 含 "16" 或 bits_per_raw_sample >= 16
    DEPTH_BIT_OK=0
    case "$DEPTH_PROBE" in
      *16*) DEPTH_BIT_OK=1 ;;
    esac
    # 也检查 bits_per_raw_sample 数值
    DEPTH_BITS=$(printf '%s' "$DEPTH_PROBE" | awk -F',' '{print $2}' 2>/dev/null)
    if [ -n "$DEPTH_BITS" ] && [ "$DEPTH_BITS" -ge 16 ] 2>/dev/null; then
      DEPTH_BIT_OK=1
    fi

    if [ "$DEPTH_BIT_OK" -eq 0 ]; then
      echo "DEPTH_BIT_DEPTH_INSUFFICIENT: depth map is not 16-bit (probe=$DEPTH_PROBE)" >> "$HANDOFF_LOG"
      echo "DEPTH_BIT_DEPTH_INSUFFICIENT"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    else
      echo "DEPTH_BIT_DEPTH=16bit_OK" >> "$HANDOFF_LOG"
    fi
  fi
fi

# 透明通道检查（scene.webp 如有 alpha）
if [ -f "$ASSET_DIR/scene.webp" ]; then
  SCENE_HAS_ALPHA=$(ffprobe -v error -select_streams v:0 -show_entries stream=has_alpha -of csv=p=0 "$ASSET_DIR/scene.webp" 2>"$FFPROBE_ERR_FILE")
  echo "SCENE_HAS_ALPHA=$SCENE_HAS_ALPHA" >> "$HANDOFF_LOG"
fi
```

判定分类：
- `FFPROBE_ERROR`（工具执行失败）→ BLOCKED_ENV
- `TECH_SPEC_FAILURE` / `FORMAT_MISMATCH` / `RESOLUTION_TOO_SMALL` → FAIL
- 所有图像技术规格符合 → Step 4 PASS

## Step 5: scene.json 契约验证

1. 解析 scene.json 并验证 schema：

```bash
SCENE_VALIDATION_FILE=$(mktemp -t scene-validation-XXXXXX)

jq empty "$SCENE_JSON" 2>"$ERR_FILE"
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "SCENE_JSON_INVALID: jq parse exit=$JQ_EXIT" >> "$SCENE_VALIDATION_FILE"
  cat "$ERR_FILE" >> "$SCENE_VALIDATION_FILE"
  echo "SCENE_JSON_INVALID"
  FAIL_COUNT=$((FAIL_COUNT + 1))
else
  echo "SCENE_JSON_PARSE=OK" >> "$SCENE_VALIDATION_FILE"
fi
```

2. 检查 sceneId 格式和资产路径合规性：

```bash
SCENE_ID=$(jq -r '.sceneId // empty' "$SCENE_JSON" 2>"$ERR_FILE")
echo "SCENE_ID=$SCENE_ID" >> "$SCENE_VALIDATION_FILE"

if [ -z "$SCENE_ID" ]; then
  echo "SCENE_ID_MISSING: scene.json has no sceneId" >> "$SCENE_VALIDATION_FILE"
  echo "SCENE_ID_MISSING"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# 检查所有资产路径为相对路径，不含 .. 或绝对路径
PATH_VIOLATIONS=$(jq -r '[.. | strings | select(test("^/|\\.\\.|^[A-Za-z]:"))] | length' "$SCENE_JSON" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "PATH_CHECK_ERROR: jq exit=$JQ_EXIT" >> "$SCENE_VALIDATION_FILE"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
else
  echo "PATH_VIOLATIONS=$PATH_VIOLATIONS" >> "$SCENE_VALIDATION_FILE"
  if [ "$PATH_VIOLATIONS" -gt 0 ] 2>/dev/null; then
    echo "ABSOLUTE_OR_PARENT_PATH: $PATH_VIOLATIONS path(s) violate relative path rule" >> "$SCENE_VALIDATION_FILE"
    jq -r '[.. | strings | select(test("^/|\\.\\.|^[A-Za-z]:"))] | .[]' "$SCENE_JSON" >> "$SCENE_VALIDATION_FILE"
    echo "ABSOLUTE_OR_PARENT_PATH"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
fi
```

3. 检查视差层级、深度范围和入口 ID：

```bash
PARALLAX_LAYERS=$(jq -r '.parallaxLayers // .layers // empty | length' "$SCENE_JSON" 2>"$ERR_FILE")
echo "PARALLAX_LAYERS=$PARALLAX_LAYERS" >> "$SCENE_VALIDATION_FILE"

DEPTH_RANGE=$(jq -r '.depthRange // .depth // empty' "$SCENE_JSON" 2>"$ERR_FILE")
echo "DEPTH_RANGE=$DEPTH_RANGE" >> "$SCENE_VALIDATION_FILE"

ENTRY_IDS=$(jq -r '.entryIds // .entries // empty | length' "$SCENE_JSON" 2>"$ERR_FILE")
echo "ENTRY_ID_COUNT=$ENTRY_IDS" >> "$SCENE_VALIDATION_FILE"

# REV-3 修正：M3 — 视差层级/深度范围/入口 ID 缺失必须计入 FAIL
SCENE_REQUIRED_MISSING=0
if [ -z "$PARALLAX_LAYERS" ] || [ "$PARALLAX_LAYERS" = "0" ] || [ "$PARALLAX_LAYERS" = "null" ]; then
  echo "PARALLAX_LAYERS_MISSING: scene.json has no parallax layers declaration" >> "$SCENE_VALIDATION_FILE"
  SCENE_REQUIRED_MISSING=1
fi
if [ -z "$DEPTH_RANGE" ] || [ "$DEPTH_RANGE" = "null" ]; then
  echo "DEPTH_RANGE_MISSING: scene.json has no depth range declaration" >> "$SCENE_VALIDATION_FILE"
  SCENE_REQUIRED_MISSING=1
fi
if [ -z "$ENTRY_IDS" ] || [ "$ENTRY_IDS" = "0" ] || [ "$ENTRY_IDS" = "null" ]; then
  echo "ENTRY_IDS_MISSING: scene.json has no entry IDs declaration" >> "$SCENE_VALIDATION_FILE"
  SCENE_REQUIRED_MISSING=1
fi
if [ "$SCENE_REQUIRED_MISSING" -eq 1 ]; then
  echo "SCENE_REQUIRED_FIELDS_MISSING"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# 检查是否包含运行时专有状态（交互状态、临时矩阵等）
RUNTIME_STATE_KEYS=$(jq -r '[paths(scalars) | join(".") | select(test("runtimeState|tempMatrix|interactionState|transient"))] | length' "$SCENE_JSON" 2>"$ERR_FILE")
echo "RUNTIME_STATE_KEYS=$RUNTIME_STATE_KEYS" >> "$SCENE_VALIDATION_FILE"

if [ "$RUNTIME_STATE_KEYS" -gt 0 ] 2>/dev/null; then
  echo "RUNTIME_PROPRIETARY_STATE: $RUNTIME_STATE_KEYS key(s) contain runtime-proprietary state" >> "$SCENE_VALIDATION_FILE"
  echo "RUNTIME_PROPRIETARY_STATE"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `PATH_CHECK_ERROR` → BLOCKED_ENV
- `SCENE_JSON_INVALID` / `SCENE_ID_MISSING` / `ABSOLUTE_OR_PARENT_PATH` / `RUNTIME_PROPRIETARY_STATE` → FAIL
- scene.json 符合 schema、路径合规、无运行时专有状态 → Step 5 PASS

## Step 6: manifest.json 验证

1. 解析 manifest.json 并检查 fileCount：

```bash
MANIFEST_VALIDATION_FILE=$(mktemp -t manifest-validation-XXXXXX)

jq empty "$MANIFEST_JSON" 2>"$ERR_FILE"
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "MANIFEST_JSON_INVALID: jq parse exit=$JQ_EXIT" >> "$MANIFEST_VALIDATION_FILE"
  cat "$ERR_FILE" >> "$MANIFEST_VALIDATION_FILE"
  echo "MANIFEST_JSON_INVALID"
  FAIL_COUNT=$((FAIL_COUNT + 1))
else
  echo "MANIFEST_JSON_PARSE=OK" >> "$MANIFEST_VALIDATION_FILE"
fi

DECLARED_FILECOUNT=$(jq -r '.fileCount // 0' "$MANIFEST_JSON" 2>"$ERR_FILE")
ACTUAL_FILECOUNT=$(jq -r '.files | length' "$MANIFEST_JSON" 2>"$ERR_FILE")
echo "DECLARED_FILECOUNT=$DECLARED_FILECOUNT" >> "$MANIFEST_VALIDATION_FILE"
echo "ACTUAL_FILECOUNT=$ACTUAL_FILECOUNT" >> "$MANIFEST_VALIDATION_FILE"

if [ "$DECLARED_FILECOUNT" != "$ACTUAL_FILECOUNT" ]; then
  echo "FILECOUNT_MISMATCH: declared=$DECLARED_FILECOUNT actual=$ACTUAL_FILECOUNT" >> "$MANIFEST_VALIDATION_FILE"
  echo "FILECOUNT_MISMATCH"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

2. 逐项验证 SHA-256 和 byteSize：

```bash
SHA_RESULT_FILE=$(mktemp -t sha-results-XXXXXX)

jq -r '.files[] | "\(.path)\t\(.sha256)\t\(.byteSize)"' "$MANIFEST_JSON" 2>"$ERR_FILE" | while IFS=$'\t' read -r path expected_sha expected_size; do
  [ -z "$path" ] && continue
  local_file="$ASSET_DIR/$path"

  if [ ! -f "$local_file" ]; then
    echo "FILE_NOT_IN_DIR $path" >> "$SHA_RESULT_FILE"
    continue
  fi

  # REV-2 修正：拆开 sha256sum | awk 管道，先捕获 sha256sum 退出码
  SHA256_OUTPUT=$(sha256sum "$local_file" 2>"$ERR_FILE")
  SHA_EXIT=$?
  if [ $SHA_EXIT -ne 0 ]; then
    echo "SHA256_EXEC_ERROR $path (exit=$SHA_EXIT)" >> "$SHA_RESULT_FILE"
    continue
  fi
  actual_sha=$(printf '%s' "$SHA256_OUTPUT" | awk '{print $1}')

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

SHA_MISMATCH_COUNT=$(grep -c '^SHA_MISMATCH' "$SHA_RESULT_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then SHA_MISMATCH_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then SHA_MISMATCH_COUNT=0; fi

BYTESIZE_MISMATCH_COUNT=$(grep -c '^BYTESIZE_MISMATCH' "$SHA_RESULT_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then BYTESIZE_MISMATCH_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then BYTESIZE_MISMATCH_COUNT=0; fi

echo "SHA_MISMATCH_COUNT=$SHA_MISMATCH_COUNT" >> "$MANIFEST_VALIDATION_FILE"
echo "BYTESIZE_MISMATCH_COUNT=$BYTESIZE_MISMATCH_COUNT" >> "$MANIFEST_VALIDATION_FILE"

if [ "$SHA_MISMATCH_COUNT" -gt 0 ]; then
  echo "SHA256_MISMATCH: $SHA_MISMATCH_COUNT file(s) hash mismatch" >> "$MANIFEST_VALIDATION_FILE"
  grep '^SHA_MISMATCH' "$SHA_RESULT_FILE" >> "$MANIFEST_VALIDATION_FILE"
  echo "SHA256_MISMATCH"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

if [ "$BYTESIZE_MISMATCH_COUNT" -gt 0 ]; then
  echo "BYTESIZE_MISMATCH: $BYTESIZE_MISMATCH_COUNT file(s) size mismatch" >> "$MANIFEST_VALIDATION_FILE"
  echo "BYTESIZE_MISMATCH"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# REV-3 修正：H1 — 三类异常必须计入 BLOCKED_COUNT，不得静默通过
FILE_NOT_IN_DIR_COUNT=$(grep -c '^FILE_NOT_IN_DIR' "$SHA_RESULT_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then FILE_NOT_IN_DIR_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then FILE_NOT_IN_DIR_COUNT=0; fi

SHA256_EXEC_ERROR_COUNT=$(grep -c '^SHA256_EXEC_ERROR' "$SHA_RESULT_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then SHA256_EXEC_ERROR_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then SHA256_EXEC_ERROR_COUNT=0; fi

STAT_ERROR_COUNT=$(grep -c '^STAT_ERROR' "$SHA_RESULT_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then STAT_ERROR_COUNT=0; elif [ $GREP_EXIT -gt 1 ]; then STAT_ERROR_COUNT=0; fi

echo "FILE_NOT_IN_DIR_COUNT=$FILE_NOT_IN_DIR_COUNT" >> "$MANIFEST_VALIDATION_FILE"
echo "SHA256_EXEC_ERROR_COUNT=$SHA256_EXEC_ERROR_COUNT" >> "$MANIFEST_VALIDATION_FILE"
echo "STAT_ERROR_COUNT=$STAT_ERROR_COUNT" >> "$MANIFEST_VALIDATION_FILE"

MANIFEST_BLOCKED_TOTAL=$((FILE_NOT_IN_DIR_COUNT + SHA256_EXEC_ERROR_COUNT + STAT_ERROR_COUNT))
if [ "$MANIFEST_BLOCKED_TOTAL" -gt 0 ]; then
  echo "MANIFEST_VERIFY_BLOCKED: $MANIFEST_BLOCKED_TOTAL error(s) in manifest verification (missing files / sha256 exec / stat)" >> "$MANIFEST_VALIDATION_FILE"
  grep -E '^(FILE_NOT_IN_DIR|SHA256_EXEC_ERROR|STAT_ERROR)' "$SHA_RESULT_FILE" >> "$MANIFEST_VALIDATION_FILE"
  BLOCKED_COUNT=$((BLOCKED_COUNT + MANIFEST_BLOCKED_TOTAL))
fi
```

3. 检查 truthClass 标注和资产路径与 scene.json 一致性：

```bash
INVALID_TRUTHCLASS=$(jq -r '[.files[] | select(.truthClass != null and .truthClass != "SOURCE" and .truthClass != "DERIVED" and .truthClass != "GENERATED")] | length' "$MANIFEST_JSON" 2>"$ERR_FILE")
echo "INVALID_TRUTHCLASS=$INVALID_TRUTHCLASS" >> "$MANIFEST_VALIDATION_FILE"

if [ "$INVALID_TRUTHCLASS" -gt 0 ] 2>/dev/null; then
  echo "TRUTHCLASS_INVALID: $INVALID_TRUTHCLASS file(s) have invalid truthClass" >> "$MANIFEST_VALIDATION_FILE"
  echo "TRUTHCLASS_INVALID"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# 资产路径与 scene.json 一致性检查
MANIFEST_PATHS=$(mktemp -t manifest-paths-XXXXXX)
SCENE_PATHS=$(mktemp -t scene-paths-XXXXXX)
jq -r '.files[].path' "$MANIFEST_JSON" 2>/dev/null | sort > "$MANIFEST_PATHS"
jq -r '[.. | strings | select(test("\\.(webp|png|jpg|json)$"))] | unique | .[]' "$SCENE_JSON" 2>/dev/null | sort > "$SCENE_PATHS"

# REV-4 修正：拆开 comm | wc -l 管道，独立捕获 comm 退出码
PATH_DIFF_FILE=$(mktemp -t path-diff-XXXXXX)
comm -3 "$MANIFEST_PATHS" "$SCENE_PATHS" > "$PATH_DIFF_FILE"
COMM_EXIT=$?
if [ $COMM_EXIT -ne 0 ]; then
  echo "PATH_DIFF_ERROR: comm exit=$COMM_EXIT" >> "$MANIFEST_VALIDATION_FILE"
fi
PATH_DIFF=$(wc -l < "$PATH_DIFF_FILE")
WC_EXIT=$?
echo "PATH_DIFF_COUNT=$PATH_DIFF" >> "$MANIFEST_VALIDATION_FILE"
if [ "$PATH_DIFF" -gt 0 ] 2>/dev/null; then
  echo "PATH_INCONSISTENCY: manifest and scene.json have $PATH_DIFF differing paths" >> "$MANIFEST_VALIDATION_FILE"
  cat "$PATH_DIFF_FILE" >> "$MANIFEST_VALIDATION_FILE"
  # REV-3 修正：M4 — PATH_INCONSISTENCY 必须计入 FAIL_COUNT
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `SHA256_EXEC_ERROR` / `STAT_ERROR` → BLOCKED_ENV
- `MANIFEST_JSON_INVALID` / `FILECOUNT_MISMATCH` / `SHA256_MISMATCH` / `BYTESIZE_MISMATCH` / `TRUTHCLASS_INVALID` → FAIL
- fileCount 一致、SHA-256 正确、byteSize 正确、truthClass 标注有效 → Step 6 PASS

## Step 7: 运行时兼容性确认

1. 确认资产支持的最低运行时层级：

```bash
RUNTIME_TIER=$(jq -r '.runtimeTier // .minRuntimeTier // .compatibility.minTier // "UNKNOWN"' "$SCENE_JSON" 2>"$ERR_FILE")
echo "RUNTIME_TIER=$RUNTIME_TIER" >> "$HANDOFF_LOG"

VALID_TIERS="WebGL2 WebGL1 Static Neutral"
TIER_VALID=0
for tier in $VALID_TIERS; do
  if [ "$RUNTIME_TIER" = "$tier" ]; then
    TIER_VALID=1
    break
  fi
done

if [ "$TIER_VALID" -eq 0 ]; then
  echo "RUNTIME_TIER_INVALID_OR_MISSING: tier=$RUNTIME_TIER" >> "$HANDOFF_LOG"
  echo "RUNTIME_TIER_INVALID_OR_MISSING"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
```

2. 检查 WebGL2-only 特性和降级策略：

```bash
WEBGL2_FEATURES=$(jq -r '[.. | strings | select(test("advancedShader|perspectiveCamera|depthBuffer|floatTexture|webgl2_only"))] | length' "$SCENE_JSON" 2>"$ERR_FILE")
echo "WEBGL2_FEATURE_COUNT=$WEBGL2_FEATURES" >> "$HANDOFF_LOG"

DEGRADATION_STRATEGY=$(jq -r '.degradation // .fallback // .degradationStrategy // empty' "$SCENE_JSON" 2>"$ERR_FILE")
echo "DEGRADATION_STRATEGY=${DEGRADATION_STRATEGY:-not_declared}" >> "$HANDOFF_LOG"

if [ "$WEBGL2_FEATURES" -gt 0 ] 2>/dev/null && [ -z "$DEGRADATION_STRATEGY" ]; then
  echo "DEGRADATION_MISSING: WebGL2 features present but no degradation strategy declared" >> "$HANDOFF_LOG"
  echo "DEGRADATION_MISSING"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `RUNTIME_TIER_INVALID_OR_MISSING` → BLOCKED_ENV
- `DEGRADATION_MISSING` → FAIL
- 运行时层级明确、降级策略完整 → Step 7 PASS

## Step 8: 职责边界检查

1. 确认 chinese-aesthetic-skill 中无编译逻辑：

```bash
BOUNDARY_RESULT_FILE=$(mktemp -t boundary-result-XXXXXX)

COMPILE_PATTERNS='webpack|rollup|esbuild|vite\.config|tsconfig.*build|compiler|compile|shader.*compile|glsl.*compile'
COMPILE_RAW=$(mktemp -t compile-raw-XXXXXX)
# REV-3 修正：M1 — 拆开 grep | grep -v | wc -l 管道，独立捕获 grep 退出码
grep -rIlE "$COMPILE_PATTERNS" "$AESTHETIC_REPO/src" "$AESTHETIC_REPO/lib" 2>"$ERR_FILE" > "$COMPILE_RAW"
GREP_EXIT=$?
if [ $GREP_EXIT -gt 1 ]; then
  echo "BOUNDARY_GREP_ERROR: compile pattern grep exit=$GREP_EXIT" >> "$BOUNDARY_RESULT_FILE"
  cat "$ERR_FILE" >> "$BOUNDARY_RESULT_FILE"
fi
COMPILE_MATCHES=$(grep -vc 'node_modules\|\.git' "$COMPILE_RAW" 2>/dev/null)
echo "AESTHETIC_COMPILE_MATCHES=$COMPILE_MATCHES" >> "$BOUNDARY_RESULT_FILE"

if [ "$COMPILE_MATCHES" -gt 0 ] 2>/dev/null; then
  echo "COMPILE_LOGIC_IN_AESTHETIC: $COMPILE_MATCHES file(s) in chinese-aesthetic-skill match compile patterns" >> "$BOUNDARY_RESULT_FILE"
  grep -v 'node_modules\|\.git' "$COMPILE_RAW" >> "$BOUNDARY_RESULT_FILE"
  echo "COMPILE_LOGIC_IN_AESTHETIC"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

2. 确认 design-compiler 中无美学规范定义：

```bash
AESTHETIC_PATTERNS='HeartMirror|aesthetic.*constraint|色彩六角色|宋式温润|chinese.*aesthetic.*spec|aestheticScore|ChineseScore'
AESTHETIC_RAW=$(mktemp -t aesthetic-raw-XXXXXX)
# REV-3 修正：M1 — 拆开管道，独立捕获 grep 退出码
grep -rIlE "$AESTHETIC_PATTERNS" "$COMPILER_REPO/src" "$COMPILER_REPO/lib" 2>"$ERR_FILE" > "$AESTHETIC_RAW"
GREP_EXIT=$?
if [ $GREP_EXIT -gt 1 ]; then
  echo "BOUNDARY_GREP_ERROR: aesthetic pattern grep exit=$GREP_EXIT" >> "$BOUNDARY_RESULT_FILE"
fi
AESTHETIC_MATCHES=$(grep -vc 'node_modules\|\.git\|playbooks' "$AESTHETIC_RAW" 2>/dev/null)
echo "COMPILER_AESTHETIC_MATCHES=$AESTHETIC_MATCHES" >> "$BOUNDARY_RESULT_FILE"

if [ "$AESTHETIC_MATCHES" -gt 0 ] 2>/dev/null; then
  echo "AESTHETIC_SPEC_IN_COMPILER: $AESTHETIC_MATCHES file(s) in design-compiler match aesthetic spec patterns" >> "$BOUNDARY_RESULT_FILE"
  grep -v 'node_modules\|\.git\|playbooks' "$AESTHETIC_RAW" >> "$BOUNDARY_RESULT_FILE"
  echo "AESTHETIC_SPEC_IN_COMPILER"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

3. 确认交接仅通过资产文件和配置文件，无代码依赖：

```bash
# 检查 chinese-aesthetic-skill 是否 import design-compiler 的代码
CROSS_IMPORT_RAW=$(mktemp -t cross-import-raw-XXXXXX)
# REV-3 修正：M1 — 拆开管道，独立捕获 grep 退出码
grep -rIlE "from.*design-compiler|require.*design-compiler|import.*@design-compiler" "$AESTHETIC_REPO/src" 2>"$ERR_FILE" > "$CROSS_IMPORT_RAW"
GREP_EXIT=$?
if [ $GREP_EXIT -gt 1 ]; then
  echo "BOUNDARY_GREP_ERROR: cross-import grep exit=$GREP_EXIT" >> "$BOUNDARY_RESULT_FILE"
fi
CROSS_IMPORT=$(grep -vc 'node_modules' "$CROSS_IMPORT_RAW" 2>/dev/null)
echo "CROSS_IMPORT_COUNT=$CROSS_IMPORT" >> "$BOUNDARY_RESULT_FILE"

if [ "$CROSS_IMPORT" -gt 0 ] 2>/dev/null; then
  echo "CODE_DEPENDENCY: chinese-aesthetic-skill imports design-compiler code" >> "$BOUNDARY_RESULT_FILE"
  echo "CODE_DEPENDENCY"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `COMPILE_LOGIC_IN_AESTHETIC` / `AESTHETIC_SPEC_IN_COMPILER` / `CODE_DEPENDENCY` → FAIL
- 两仓库职责分离、无代码复制耦合 → Step 8 PASS

## Step 9: 交接执行

1. 将资产文件复制到 design-compiler 的输入目录：

```bash
COMPILER_INPUT_DIR="${COMPILER_INPUT_DIR:-$COMPILER_REPO/input/scenes}"
mkdir -p "$COMPILER_INPUT_DIR" 2>"$ERR_FILE"
MKDIR_EXIT=$?
if [ $MKDIR_EXIT -ne 0 ]; then
  echo "INPUT_DIR_CREATE_FAILED: mkdir exit=$MKDIR_EXIT" >> "$HANDOFF_LOG"
  cat "$ERR_FILE" >> "$HANDOFF_LOG"
  echo "INPUT_DIR_CREATE_FAILED"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi

HANDOFF_MANIFEST=$(mktemp -t handoff-manifest-XXXXXX)
echo "filename\tsha256\tbyteSize\tsource" > "$HANDOFF_MANIFEST"

COPY_ERROR=0
while IFS= read -r asset_file; do
  [ -z "$asset_file" ] && continue
  basename=$(basename "$asset_file")
  cp "$asset_file" "$COMPILER_INPUT_DIR/$basename" 2>"$ERR_FILE"
  CP_EXIT=$?
  if [ $CP_EXIT -ne 0 ]; then
    echo "COPY_FAILED $basename (exit=$CP_EXIT)" >> "$HANDOFF_LOG"
    cat "$ERR_FILE" >> "$HANDOFF_LOG"
    COPY_ERROR=1
    continue
  fi

  # 记录交接清单
  SHA256_OUTPUT=$(sha256sum "$asset_file" 2>"$ERR_FILE")
  SHA_EXIT=$?
  if [ $SHA_EXIT -ne 0 ]; then
    echo "SHA256_ERROR $basename" >> "$HANDOFF_LOG"
    continue
  fi
  file_sha=$(printf '%s' "$SHA256_OUTPUT" | awk '{print $1}')
  file_size=$(stat -c%s "$asset_file" 2>/dev/null)
  echo -e "$basename\t$file_sha\t$file_size\t$asset_file" >> "$HANDOFF_MANIFEST"
done < "$ASSET_LIST_FILE"

if [ "$COPY_ERROR" -eq 1 ]; then
  echo "ASSET_COPY_FAILED"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi

echo "COMPILER_INPUT_DIR=$COMPILER_INPUT_DIR" >> "$HANDOFF_LOG"
echo "HANDOFF_MANIFEST=$HANDOFF_MANIFEST" >> "$HANDOFF_LOG"
```

2. 记录交接时间和双方 commit SHA：

```bash
HANDOFF_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AESTHETIC_COMMIT=$(cd "$AESTHETIC_REPO" && git rev-parse HEAD 2>/dev/null || echo "UNKNOWN")
COMPILER_COMMIT=$(cd "$COMPILER_REPO" && git rev-parse HEAD 2>/dev/null || echo "UNKNOWN")

echo "HANDOFF_TIME=$HANDOFF_TIME" >> "$HANDOFF_LOG"
echo "AESTHETIC_COMMIT=$AESTHETIC_COMMIT" >> "$HANDOFF_LOG"
echo "COMPILER_COMMIT=$COMPILER_COMMIT" >> "$HANDOFF_LOG"
```

判定分类：
- `INPUT_DIR_CREATE_FAILED` / `ASSET_COPY_FAILED` → BLOCKED_ENV
- 资产全部复制、交接清单已记录 → Step 9 PASS

## Step 10: 编译验证（在 design-compiler 侧）

1. 执行 DC-PB-001（Scene Compilation Contract 验收）：

```bash
DC_PB001_DIR="$COMPILER_REPO/playbooks/scene-compilation-contract"
if [ -f "$DC_PB001_DIR/procedure.md" ]; then
  echo "DC_PB001_AVAILABLE=yes" >> "$HANDOFF_LOG"
  echo "NOTE: DC-PB-001 must be executed in design-compiler context with OUTPUT_DIR and COMPILE_COMMAND"
  echo "DC_PB001_PENDING" >> "$HANDOFF_LOG"
else
  echo "DC_PB001_NOT_FOUND: $DC_PB001_DIR/procedure.md" >> "$HANDOFF_LOG"
  echo "DC_PB001_NOT_FOUND"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
```

2. 确认编译输出完整和运行时可加载：

```bash
# 编译输出目录检查（编译需在 design-compiler 侧执行，此处做前置检查）
EXPECTED_OUTPUT_FILES="scene.webp depth.webp scene.json manifest.json"
OUTPUT_MISSING=""
for f in $EXPECTED_OUTPUT_FILES; do
  if [ ! -f "$COMPILER_INPUT_DIR/$f" ]; then
    OUTPUT_MISSING="$OUTPUT_MISSING $f"
  fi
done

if [ -n "$OUTPUT_MISSING" ]; then
  echo "HANDOFF_INCOMPLETE: missing in compiler input:$OUTPUT_MISSING" >> "$HANDOFF_LOG"
  echo "HANDOFF_INCOMPLETE"
  FAIL_COUNT=$((FAIL_COUNT + 1))
else
  echo "HANDOFF_COMPLETE: all required assets present in compiler input dir" >> "$HANDOFF_LOG"
fi
```

判定分类：
- `DC_PB001_NOT_FOUND` → BLOCKED_ENV
- `HANDOFF_INCOMPLETE` → FAIL
- 交接资产完整、DC-PB-001 可执行 → Step 10 PASS（编译验证需在 design-compiler 侧实际执行）

## 最终状态判定与证据归档

1. 确定最终状态：

```bash
if [ "$BLOCKED_COUNT" -gt 0 ]; then
  HANDOFF_STATUS="BLOCKED_ENV"
elif [ "$FAIL_COUNT" -gt 0 ]; then
  HANDOFF_STATUS="FAIL"
else
  HANDOFF_STATUS="PASS"
fi

echo "HANDOFF_STATUS=$HANDOFF_STATUS"
echo "FAIL_COUNT=$FAIL_COUNT"
echo "BLOCKED_COUNT=$BLOCKED_COUNT"
```

2. 归档证据：

```bash
ARCHIVE_ERROR=0
cp "$HANDOFF_LOG" "$EVIDENCE_DIR/handoff-log.txt" || ARCHIVE_ERROR=1
cp "$ASSET_LIST_FILE" "$EVIDENCE_DIR/asset-list.txt" || ARCHIVE_ERROR=1
cp "$TECH_RESULT_FILE" "$EVIDENCE_DIR/tech-spec-results.txt" || ARCHIVE_ERROR=1
cp "$SCENE_VALIDATION_FILE" "$EVIDENCE_DIR/scene-json-validation.txt" || ARCHIVE_ERROR=1
cp "$MANIFEST_VALIDATION_FILE" "$EVIDENCE_DIR/manifest-validation.txt" || ARCHIVE_ERROR=1
cp "$SHA_RESULT_FILE" "$EVIDENCE_DIR/sha256-results.txt" || ARCHIVE_ERROR=1
cp "$BOUNDARY_RESULT_FILE" "$EVIDENCE_DIR/boundary-check.txt" || ARCHIVE_ERROR=1
cp "$HANDOFF_MANIFEST" "$EVIDENCE_DIR/handoff-manifest.tsv" || ARCHIVE_ERROR=1

if [ "$ARCHIVE_ERROR" -ne 0 ]; then
  echo "EVIDENCE_ARCHIVE_ERROR: failed to archive handoff evidence"
  exit 2
fi

echo "EVIDENCE_DIR=$EVIDENCE_DIR"
```

3. 输出最终状态：

```bash
case "$HANDOFF_STATUS" in
  PASS)
    echo "ASSET_HANDOFF_PASS: all checks passed, assets ready for design-compiler compilation"
    exit 0
    ;;
  FAIL)
    echo "ASSET_HANDOFF_FAIL: $FAIL_COUNT failure(s) detected"
    exit 1
    ;;
  BLOCKED_ENV)
    echo "ASSET_HANDOFF_BLOCKED: $BLOCKED_COUNT blocker(s) - input missing or environment issue"
    exit 2
    ;;
  *)
    echo "ASSET_HANDOFF_NOT_RUN: handoff did not complete"
    exit 2
    ;;
esac
```

判定分类：
- `EVIDENCE_ARCHIVE_ERROR` → BLOCKED_ENV
- 全部检查通过、资产完整交接、证据归档 → PASS
- 有 FAIL 项（资产缺失、技术规格不符、schema 违规、职责混写、哈希不匹配）→ FAIL
- 有 BLOCKED_ENV 项（输入缺失、工具缺失、编译契约不明确、运行时能力不确认）→ BLOCKED_ENV

## 决策点

- 资产未通过审美验收（CA-PB-003）或约束未就绪（CA-PB-001）→ 不得交接，返回修改
- 编译契约不明确（schema 缺失）→ BLOCKED_ENV，需确认 design-compiler 版本
- 必需资产缺失或命名违规 → FAIL
- 技术规格不符（分辨率/格式/位深）→ FAIL
- scene.json schema 违规或路径不合规 → FAIL
- manifest.json fileCount/SHA-256/byteSize 不一致 → FAIL
- 运行时层级不明确 → BLOCKED_ENV
- 职责边界混写（编译逻辑在审美仓库 / 美学规范在编译器）→ FAIL
- 编译验证失败 → 返回 chinese-aesthetic-skill 修改，不得在 design-compiler 中静默修复
- 全部通过且编译验证成功 → PASS
