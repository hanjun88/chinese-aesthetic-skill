# Procedure: 中式美学设计约束提取

> 本 Playbook 将设计意图转化为可执行、可验证的美学约束包。核心纪律是**四层严格分离**：设计意图（纯描述）→ 视觉约束（可观察特征）→ 实现参数（具体数值）→ 验收指标（可测量标准）。层级混淆即 FAIL。
>
> 代码块性质声明：本文档中的所有 shell 命令均为可执行模板。`<intent-file>`、`<output-dir>` 等尖括号占位符必须替换为实际值后执行。失败处理统一使用 `echo "ERROR_CODE" && exit 1`（或 `exit 2` 表示 BLOCKED_ENV）形式，不再使用 `FAIL (ERROR_CODE)` 伪代码。所有命令的退出码、stdout 和 stderr 必须原始留存。

## Phase 0: 前置条件与变量初始化

```bash
# 工具链检查
for tool in jq sha256sum stat mktemp grep; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "TOOL_MISSING: $tool not found"
    exit 2
  fi
done

# 输入参数（调用方必须提供）
INTENT_FILE="${INTENT_FILE:?INTENT_FILE not set (path to design intent description)}"
OUTPUT_DIR="${OUTPUT_DIR:?OUTPUT_DIR not set}"
SCENE_TYPE="${SCENE_TYPE:?SCENE_TYPE not set}"
CORE_EMOTION="${CORE_EMOTION:?CORE_EMOTION not set}"

# 证据文件初始化（mktemp 隔离路径，不删除，纳入证据清单）
CONSTRAINT_REPORT=$(mktemp -t constraint-report-XXXXXX.json)
INTENT_VALIDATION_FILE=$(mktemp -t intent-validation-XXXXXX.txt)
LAYER_CHECK_FILE=$(mktemp -t layer-check-XXXXXX.txt)
FORBIDDEN_CHECK_FILE=$(mktemp -t forbidden-check-XXXXXX.txt)
CONSTRAINT_PACKAGE=$(mktemp -t constraint-package-XXXXXX.json)
EVIDENCE_DIR="${OUTPUT_DIR}/evidence"
ERR_FILE=$(mktemp -t constraint-err-XXXXXX.txt)
EXTRACT_LOG=$(mktemp -t extract-log-XXXXXX.txt)

# 状态变量
EXTRACT_STATUS="NOT_RUN"
FAIL_COUNT=0
BLOCKED_COUNT=0

# 允许的场景类型和核心情感（HeartMirror 设计语言枚举）
VALID_SCENES="山门|宫殿|园林|宇宙入口|书院|禅院|市井|秘境"
VALID_EMOTIONS="敬畏|宁静|庄严|神秘|悠远|温润|辽阔|肃穆"

echo "INTENT_FILE=$INTENT_FILE"
echo "OUTPUT_DIR=$OUTPUT_DIR"
echo "SCENE_TYPE=$SCENE_TYPE"
echo "CORE_EMOTION=$CORE_EMOTION"
echo "CONSTRAINT_PACKAGE=$CONSTRAINT_PACKAGE"
```

## Step 1: 明确设计意图

1. 验证设计意图输入文件存在且非空：

```bash
if [ ! -f "$INTENT_FILE" ]; then
  echo "INTENT_FILE_MISSING: $INTENT_FILE not found" >> "$EXTRACT_LOG"
  echo "INTENT_FILE_MISSING"
  exit 2
fi

INTENT_SIZE=$(stat -c %s "$INTENT_FILE" 2>"$ERR_FILE")
STAT_EXIT=$?
if [ $STAT_EXIT -ne 0 ]; then
  echo "INTENT_FILE_STAT_ERROR: stat failed (exit=$STAT_EXIT)" >> "$EXTRACT_LOG"
  cat "$ERR_FILE" >> "$EXTRACT_LOG"
  echo "INTENT_FILE_STAT_ERROR"
  exit 2
fi

if [ "$INTENT_SIZE" -eq 0 ]; then
  echo "INTENT_FILE_EMPTY: $INTENT_FILE is 0 bytes" >> "$EXTRACT_LOG"
  echo "INTENT_FILE_EMPTY"
  exit 2
fi

echo "INTENT_FILE_SIZE=$INTENT_SIZE" >> "$EXTRACT_LOG"
```

2. 验证场景类型和核心情感在 HeartMirror 枚举中：

```bash
SCENE_VALID=0
echo "$VALID_SCENES" | tr '|' '\n' | while IFS= read -r scene; do
  [ "$scene" = "$SCENE_TYPE" ] && echo "SCENE_MATCH" >> "$INTENT_VALIDATION_FILE"
done

if [ -f "$INTENT_VALIDATION_FILE" ] && grep -q "SCENE_MATCH" "$INTENT_VALIDATION_FILE" 2>/dev/null; then
  SCENE_VALID=1
fi

if [ "$SCENE_VALID" -eq 0 ]; then
  echo "SCENE_TYPE_INVALID: '$SCENE_TYPE' not in HeartMirror scene enum" >> "$EXTRACT_LOG"
  echo "VALID_SCENES=$VALID_SCENES" >> "$EXTRACT_LOG"
  echo "SCENE_TYPE_INVALID"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi

# 核心情感验证（同上模式）
EMOTION_VALID=0
echo "$VALID_EMOTIONS" | tr '|' '\n' | while IFS= read -r emotion; do
  [ "$emotion" = "$CORE_EMOTION" ] && echo "EMOTION_MATCH" >> "$INTENT_VALIDATION_FILE"
done

if grep -q "EMOTION_MATCH" "$INTENT_VALIDATION_FILE" 2>/dev/null; then
  EMOTION_VALID=1
fi

if [ "$EMOTION_VALID" -eq 0 ]; then
  echo "EMOTION_INVALID: '$CORE_EMOTION' not in HeartMirror emotion enum" >> "$EXTRACT_LOG"
  echo "VALID_EMOTIONS=$VALID_EMOTIONS" >> "$EXTRACT_LOG"
  echo "EMOTION_INVALID"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi

echo "SCENE_TYPE=$SCENE_TYPE (valid=$SCENE_VALID)" >> "$EXTRACT_LOG"
echo "CORE_EMOTION=$CORE_EMOTION (valid=$EMOTION_VALID)" >> "$EXTRACT_LOG"
```

判定分类：
- `INTENT_FILE_MISSING` / `INTENT_FILE_EMPTY` / `INTENT_FILE_STAT_ERROR` → BLOCKED_ENV
- `SCENE_TYPE_INVALID` / `EMOTION_INVALID` → BLOCKED_ENV（需补充输入，非设计本身问题）
- 设计意图文件存在且非空、场景类型和核心情感在枚举中 → Step 1 PASS

## Step 2: 映射 HeartMirror 设计语言

1. 验证色彩角色分配完整性（境/玄/脉/息/印/生 六角色）：

```bash
COLOR_ROLES="境 玄 脉 息 印 生"
COLOR_ROLE_COUNT=0
MISSING_ROLES=""

for role in $COLOR_ROLES; do
  # REV-3 修正：检查角色分配模式（为X / X为），而非单字匹配（M1）
  if grep -qE "为${role}|${role}为" "$INTENT_FILE" 2>/dev/null; then
    COLOR_ROLE_COUNT=$((COLOR_ROLE_COUNT + 1))
  else
    MISSING_ROLES="$MISSING_ROLES $role"
  fi
done

echo "COLOR_ROLE_COUNT=$COLOR_ROLE_COUNT/6" >> "$EXTRACT_LOG"
if [ "$COLOR_ROLE_COUNT" -lt 6 ]; then
  echo "COLOR_ROLE_INCOMPLETE: missing roles:$MISSING_ROLES" >> "$EXTRACT_LOG"
  echo "COLOR_ROLE_INCOMPLETE"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

2. 验证主色调在 HeartMirror 色彩系统中：

```bash
HEARTMIRROR_COLORS="青蓝 紫 金 白 朱砂 藤黄"
PRIMARY_COLOR_FOUND=0

for color in $HEARTMIRROR_COLORS; do
  if grep -q "$color" "$INTENT_FILE" 2>/dev/null; then
    PRIMARY_COLOR_FOUND=1
    echo "PRIMARY_COLOR=$color" >> "$EXTRACT_LOG"
    break
  fi
done

if [ "$PRIMARY_COLOR_FOUND" -eq 0 ]; then
  echo "PRIMARY_COLOR_MISSING: no HeartMirror palette color found in intent" >> "$EXTRACT_LOG"
  echo "HEARTMIRROR_COLORS=$HEARTMIRROR_COLORS" >> "$EXTRACT_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

3. 验证美学特质和光照方向：

```bash
AESTHETIC_TRAITS="宋式温润 晨曦天光 辽阔敬畏 中式巨构"
TRAIT_COUNT=0
for trait in $AESTHETIC_TRAITS; do
  if grep -q "$trait" "$INTENT_FILE" 2>/dev/null; then
    TRAIT_COUNT=$((TRAIT_COUNT + 1))
    echo "AESTHETIC_TRAIT=$trait" >> "$EXTRACT_LOG"
  fi
done
echo "AESTHETIC_TRAIT_COUNT=$TRAIT_COUNT" >> "$EXTRACT_LOG"

LIGHTING_DIRECTIONS="晨曦 黄昏 月夜 天光"
LIGHTING_FOUND=0
for light in $LIGHTING_DIRECTIONS; do
  if grep -q "$light" "$INTENT_FILE" 2>/dev/null; then
    LIGHTING_FOUND=1
    echo "LIGHTING_DIRECTION=$light" >> "$EXTRACT_LOG"
    break
  fi
done
if [ "$LIGHTING_FOUND" -eq 0 ]; then
  echo "LIGHTING_DIRECTION_MISSING: no lighting direction specified" >> "$EXTRACT_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `COLOR_ROLE_INCOMPLETE` / `PRIMARY_COLOR_MISSING` / `LIGHTING_DIRECTION_MISSING` → FAIL
- 六色彩角色完整、主色调在 HeartMirror 系统中、光照方向已指定 → Step 2 PASS

## Step 3: 提取视觉约束

1. 生成视觉约束 JSON（色彩/材质/光照/构图/细节五层）：

```bash
# 视觉约束层：可观察特征，禁止具体色值（#RRGGBB / rgb()）
jq -n \
  --arg scene "$SCENE_TYPE" \
  --arg emotion "$CORE_EMOTION" \
  --rawfile intent "$INTENT_FILE" \
  '{
    layer: "visual_constraints",
    scene: $scene,
    coreEmotion: $emotion,
    color: {
      primary: "从意图文件中提取的主色调描述（非色值）",
      secondary: "辅色调描述",
      accent: "点缀色描述",
      note: "本层禁止具体色值，色值在 implementation_params 层定义"
    },
    material: {
      primary: "主要材质描述（如：温润木材、粗粝石材）",
      secondary: "次要材质描述",
      texture: "纹理特征描述"
    },
    lighting: {
      direction: "光源方向描述（如：左上方晨曦）",
      intensity: "强度描述（如：柔和、漫射）",
      colorTemperature: "色温描述（如：暖白、冷青）",
      shadow: "阴影特征描述（如：长投影、柔和边界）"
    },
    composition: {
      viewpoint: "视角描述（如：低角度仰视）",
      scale: "空间尺度描述（如：宏大、压迫感）",
      depth: "纵深描述（如：多层递进）",
      focalPoint: "视觉焦点描述"
    },
    detail: {
      decorativeElements: "装饰元素描述",
      symbols: "符号描述",
      patterns: "纹理图案描述"
    },
    sourceIntent: $intent
  }' > "${CONSTRAINT_PACKAGE}.visual.json" 2>"$ERR_FILE"
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "VISUAL_CONSTRAINT_GENERATION_FAILED: jq exit=$JQ_EXIT" >> "$EXTRACT_LOG"
  cat "$ERR_FILE" >> "$EXTRACT_LOG"
  echo "VISUAL_CONSTRAINT_GENERATION_FAILED"
  exit 2
fi
echo "VISUAL_CONSTRAINT_FILE=${CONSTRAINT_PACKAGE}.visual.json" >> "$EXTRACT_LOG"
```

2. 验证视觉约束层无具体色值（四层分离关键检查）：

```bash
VISUAL_FILE="${CONSTRAINT_PACKAGE}.visual.json"
COLOR_VALUE_VIOLATIONS=$(grep -cE '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(' "$VISUAL_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then
  COLOR_VALUE_VIOLATIONS=0
elif [ $GREP_EXIT -gt 1 ]; then
  echo "GREP_ERROR: visual constraint color check failed (exit=$GREP_EXIT)" >> "$EXTRACT_LOG"
  COLOR_VALUE_VIOLATIONS=0
fi

echo "VISUAL_LAYER_COLOR_VALUES=$COLOR_VALUE_VIOLATIONS" >> "$EXTRACT_LOG"
if [ "$COLOR_VALUE_VIOLATIONS" -gt 0 ]; then
  echo "LAYER_CONTAMINATION: visual_constraints layer contains concrete color values ($COLOR_VALUE_VIOLATIONS occurrences)" >> "$EXTRACT_LOG"
  grep -nE '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(' "$VISUAL_FILE" >> "$EXTRACT_LOG"
  echo "LAYER_CONTAMINATION"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `VISUAL_CONSTRAINT_GENERATION_FAILED` → BLOCKED_ENV
- `LAYER_CONTAMINATION`（视觉约束层含具体色值）→ FAIL
- 视觉约束 JSON 已生成、无具体色值污染 → Step 3 PASS

## Step 4: 转化为实现参数

1. 生成实现参数 JSON（供 design-compiler 消费）：

```bash
# 实现参数层：具体数值，禁止主观描述（"好看""有感觉"）
jq -n \
  --arg scene "$SCENE_TYPE" \
  '{
    layer: "implementation_params",
    scene: $scene,
    color: {
      primaryHex: "待填充：#RRGGBB",
      secondaryHex: "待填充：#RRGGBB",
      accentHex: "待填充：#RRGGBB",
      saturationRange: [0.0, 1.0],
      brightnessRange: [0.0, 1.0]
    },
    material: {
      textureType: "待填充：纹理类型标识",
      roughness: 0.0,
      metalness: 0.0,
      textureResolution: "待填充：如 2048x2048"
    },
    lighting: {
      keyLightPosition: [0.0, 0.0, 0.0],
      keyLightAngle: 0.0,
      keyLightIntensity: 0.0,
      colorTemperatureK: 0,
      ambientIntensity: 0.0
    },
    geometry: {
      scaleRatio: "待填充：如 1:3:1（宽:高:深）",
      parallaxLayers: 0,
      layout: "待填充：空间布局标识"
    },
    output: {
      resolution: "待填充：如 1920x1080",
      format: "待填充：如 PNG/WebP",
      namingConvention: "待填充：如 scene_{type}_{index}.png"
    },
    note: "本层所有字段必须填充具体数值，模板中的占位标记交付前必须替换"
  }' > "${CONSTRAINT_PACKAGE}.params.json" 2>"$ERR_FILE"
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "IMPLEMENTATION_PARAMS_GENERATION_FAILED: jq exit=$JQ_EXIT" >> "$EXTRACT_LOG"
  cat "$ERR_FILE" >> "$EXTRACT_LOG"
  echo "IMPLEMENTATION_PARAMS_GENERATION_FAILED"
  exit 2
fi
echo "IMPLEMENTATION_PARAMS_FILE=${CONSTRAINT_PACKAGE}.params.json" >> "$EXTRACT_LOG"
```

2. 验证实现参数层无主观描述词、无未替换占位符：

```bash
PARAMS_FILE="${CONSTRAINT_PACKAGE}.params.json"
SUBJECTIVE_WORDS="好看|有感觉|不错|棒|美|舒服|和谐|到位"
SUBJECTIVE_VIOLATIONS=$(grep -cE "$SUBJECTIVE_WORDS" "$PARAMS_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then
  SUBJECTIVE_VIOLATIONS=0
elif [ $GREP_EXIT -gt 1 ]; then
  echo "GREP_ERROR: params subjective check failed (exit=$GREP_EXIT)" >> "$EXTRACT_LOG"
  SUBJECTIVE_VIOLATIONS=0
fi

echo "PARAMS_SUBJECTIVE_VIOLATIONS=$SUBJECTIVE_VIOLATIONS" >> "$EXTRACT_LOG"

# REV-3 修正：占位符检查移至 Step 8 最终封签前（模板生成阶段允许占位符）
if [ "$SUBJECTIVE_VIOLATIONS" -gt 0 ]; then
  echo "SUBJECTIVE_DESCRIPTION_IN_PARAMS: implementation params layer contains subjective words" >> "$EXTRACT_LOG"
  grep -nE "$SUBJECTIVE_WORDS" "$PARAMS_FILE" >> "$EXTRACT_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `IMPLEMENTATION_PARAMS_GENERATION_FAILED` → BLOCKED_ENV
- `SUBJECTIVE_DESCRIPTION_IN_PARAMS` → FAIL
- 实现参数 JSON 已生成、无主观描述 → Step 4 PASS（占位符检查在 Step 8 最终封签前执行）

## Step 5: 定义验收指标

1. 生成验收指标 JSON（可测量标准）：

```bash
# 验收指标层：可测量，禁止模糊词（"好看""有感觉""差不多"）
jq -n \
  --arg scene "$SCENE_TYPE" \
  '{
    layer: "acceptance_metrics",
    scene: $scene,
    color: {
      primaryColorRatio: {
        metric: "主色占画面比例",
        min: 0.0,
        max: 1.0,
        target: "待填充：如 >0.6",
        method: "色彩直方图统计"
      },
      colorTemperatureRange: {
        metric: "色温范围（K）",
        min: 0,
        max: 10000,
        target: "待填充：如 4000-5000",
        method: "白平衡分析"
      },
      forbiddenColors: {
        metric: "禁用色检查",
        target: "0 个高饱和荧光色像素",
        method: "色域扫描（HSV S>0.8 且 V>0.8）"
      }
    },
    material: {
      textureResolution: {
        metric: "纹理分辨率",
        target: "待填充：如 >=2048x2048",
        method: "文件头解析"
      },
      channelCompleteness: {
        metric: "通道完整性",
        target: "RGBA 四通道均非空",
        method: "通道方差检测"
      }
    },
    lighting: {
      lightDirectionDeviation: {
        metric: "光源方向偏差（度）",
        target: "待填充：如 <=15°",
        method: "高光区域几何中心分析"
      },
      shadowQuality: {
        metric: "阴影质量",
        target: "无锯齿、无完全死黑（RGB>0）",
        method: "边缘检测 + 暗部统计"
      }
    },
    composition: {
      spatialDepth: {
        metric: "空间纵深层数",
        target: "待填充：如 >=3 层视差",
        method: "深度图分层统计"
      },
      focalPointPosition: {
        metric: "视觉焦点位置",
        target: "待填充：如画面上 1/3 中线",
        method: "显著性图分析"
      }
    },
    overall: {
      referenceSimilarity: {
        metric: "与参考图相似度",
        target: "待填充：如 >=0.75（SSIM）",
        method: "SSIM / 特征点匹配"
      },
      forbiddenStyleCheck: {
        metric: "禁用倾向检查",
        target: "0 项命中（赛博朋克/UI卡片化/高饱和荧光）",
        method: "风格分类器 + 人工复核"
      }
    },
    note: "所有 target 字段必须填充具体数值或范围，模板中的占位标记交付前必须替换"
  }' > "${CONSTRAINT_PACKAGE}.metrics.json" 2>"$ERR_FILE"
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "ACCEPTANCE_METRICS_GENERATION_FAILED: jq exit=$JQ_EXIT" >> "$EXTRACT_LOG"
  cat "$ERR_FILE" >> "$EXTRACT_LOG"
  echo "ACCEPTANCE_METRICS_GENERATION_FAILED"
  exit 2
fi
echo "ACCEPTANCE_METRICS_FILE=${CONSTRAINT_PACKAGE}.metrics.json" >> "$EXTRACT_LOG"
```

2. 验证验收指标层无模糊词、无未替换占位符：

```bash
METRICS_FILE="${CONSTRAINT_PACKAGE}.metrics.json"
VAGUE_WORDS="好看|有感觉|差不多|还行|凑合|大概|应该|可能|尽量|适当"
VAGUE_VIOLATIONS=$(grep -cE "$VAGUE_WORDS" "$METRICS_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then
  VAGUE_VIOLATIONS=0
elif [ $GREP_EXIT -gt 1 ]; then
  VAGUE_VIOLATIONS=0
fi

echo "METRICS_VAGUE_VIOLATIONS=$VAGUE_VIOLATIONS" >> "$EXTRACT_LOG"

# REV-3 修正：检查每项指标是否有 method 字段（M2: METRIC_WITHOUT_METHOD）
METRICS_WITHOUT_METHOD=$(jq '[.. | objects | select(.metric != null and .method == null)] | length' "$METRICS_FILE" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "METRIC_METHOD_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$EXTRACT_LOG"
  METRICS_WITHOUT_METHOD=0
fi
echo "METRICS_WITHOUT_METHOD=$METRICS_WITHOUT_METHOD" >> "$EXTRACT_LOG"

if [ "$VAGUE_VIOLATIONS" -gt 0 ]; then
  echo "VAGUE_WORDS_IN_METRICS: acceptance metrics layer contains vague words" >> "$EXTRACT_LOG"
  grep -nE "$VAGUE_WORDS" "$METRICS_FILE" >> "$EXTRACT_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

if [ "$METRICS_WITHOUT_METHOD" -gt 0 ]; then
  echo "METRIC_WITHOUT_METHOD: $METRICS_WITHOUT_METHOD metrics missing detection method" >> "$EXTRACT_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
# REV-3 修正：占位符检查移至 Step 8 最终封签前
```

判定分类：
- `ACCEPTANCE_METRICS_GENERATION_FAILED` → BLOCKED_ENV
- `VAGUE_WORDS_IN_METRICS` / `METRIC_WITHOUT_METHOD` → FAIL
- 验收指标 JSON 已生成、无模糊词、每项有检测方法 → Step 5 PASS（占位符检查在 Step 8 最终封签前执行）

## Step 6: 明确禁用倾向

1. 生成禁用倾向清单并验证可检测性：

```bash
jq -n '{
  layer: "forbidden_tendencies",
  items: [
    {
      id: "CYBERPUNK",
      name: "赛博朋克默认视觉",
      description: "霓虹光效、高对比未来感、电子故障美学",
      detectionMethod: "风格分类器 + 霓虹色占比（HSV S>0.9, V>0.9 的品红/青色）",
      threshold: "霓虹色像素占比 < 1%"
    },
    {
      id: "UI_CARD",
      name: "UI 卡片化布局",
      description: "圆角卡片、投影、按钮样式、栅格化布局",
      detectionMethod: "几何形状检测（圆角矩形占比）+ 布局分析",
      threshold: "圆角矩形元素占比 < 5%"
    },
    {
      id: "NEON_SATURATION",
      name: "高饱和荧光色泛滥",
      description: "HSV 饱和度 > 0.8 且明度 > 0.8 的颜色大面积使用",
      detectionMethod: "色域扫描（HSV 空间统计）",
      threshold: "高饱和荧光色像素占比 < 3%"
    },
    {
      id: "FLAT_BACKGROUND",
      name: "缺乏空间尺度的平面背景",
      description: "无纵深、无视差、无层次的纯平面背景",
      detectionMethod: "深度图方差分析 + 视差层数检测",
      threshold: "深度图层数 >= 3，深度方差 > 阈值"
    },
    {
      id: "DECORATION_ONLY",
      name: "仅有装饰性纹理而无结构",
      description: "画面充满纹理但缺乏建筑结构、空间关系",
      detectionMethod: "边缘检测 + 结构线条分析 + 人工复核",
      threshold: "结构性线条占总边缘 >= 30%"
    },
    {
      id: "WESTERN_FANTASY",
      name: "西方奇幻风格",
      description: "尖塔、魔法光效、哥特式建筑、龙与地下城美学",
      detectionMethod: "风格分类器 + 建筑形态识别 + 人工复核",
      threshold: "西方奇幻风格置信度 < 0.3"
    }
  ],
  note: "每项禁用倾向必须有 detectionMethod 和 threshold，不可检测的禁用项无效"
}' > "${CONSTRAINT_PACKAGE}.forbidden.json" 2>"$ERR_FILE"
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "FORBIDDEN_TENDENCY_GENERATION_FAILED: jq exit=$JQ_EXIT" >> "$EXTRACT_LOG"
  cat "$ERR_FILE" >> "$EXTRACT_LOG"
  echo "FORBIDDEN_TENDENCY_GENERATION_FAILED"
  exit 2
fi
echo "FORBIDDEN_TENDENCY_FILE=${CONSTRAINT_PACKAGE}.forbidden.json" >> "$EXTRACT_LOG"
```

2. 验证每项禁用倾向有检测方法和阈值：

```bash
FORBIDDEN_FILE="${CONSTRAINT_PACKAGE}.forbidden.json"
FORBIDDEN_ITEM_COUNT=$(jq '.items | length' "$FORBIDDEN_FILE" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "FORBIDDEN_COUNT_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$EXTRACT_LOG"
  FORBIDDEN_ITEM_COUNT=0
fi

# 检查每项是否有 detectionMethod 和 threshold
# REV-3 修正：jq 调用增加退出码捕获（M3）
MISSING_DETECTION=$(jq '[.items[] | select(.detectionMethod == null or .detectionMethod == "")] | length' "$FORBIDDEN_FILE" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "FORBIDDEN_DETECTION_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$EXTRACT_LOG"
  MISSING_DETECTION=0
fi
MISSING_THRESHOLD=$(jq '[.items[] | select(.threshold == null or .threshold == "")] | length' "$FORBIDDEN_FILE" 2>"$ERR_FILE")
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "FORBIDDEN_THRESHOLD_PARSE_ERROR: jq exit=$JQ_EXIT" >> "$EXTRACT_LOG"
  MISSING_THRESHOLD=0
fi

echo "FORBIDDEN_ITEM_COUNT=$FORBIDDEN_ITEM_COUNT" >> "$EXTRACT_LOG"
echo "FORBIDDEN_MISSING_DETECTION=$MISSING_DETECTION" >> "$EXTRACT_LOG"
echo "FORBIDDEN_MISSING_THRESHOLD=$MISSING_THRESHOLD" >> "$EXTRACT_LOG"

if [ "$MISSING_DETECTION" -gt 0 ] || [ "$MISSING_THRESHOLD" -gt 0 ]; then
  echo "FORBIDDEN_NOT_DETECTABLE: $MISSING_DETECTION items missing detectionMethod, $MISSING_THRESHOLD items missing threshold" >> "$EXTRACT_LOG"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `FORBIDDEN_TENDENCY_GENERATION_FAILED` → BLOCKED_ENV
- `FORBIDDEN_NOT_DETECTABLE`（缺检测方法或阈值）→ FAIL
- 禁用倾向清单已生成、每项均可检测 → Step 6 PASS

## Step 7: 四层分离校验

1. 跨层污染检查（每层不得包含其他层的内容）：

```bash
LAYER_PASS=1

# 检查 1: 设计意图层（原始 INTENT_FILE）不得包含技术参数
# （意图文件是纯描述，允许包含色彩名称等高层描述，但不得包含 #RRGGBB 或具体数值参数）
INTENT_COLOR_VALUES=$(grep -cE '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(' "$INTENT_FILE" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then INTENT_COLOR_VALUES=0; elif [ $GREP_EXIT -gt 1 ]; then INTENT_COLOR_VALUES=0; fi

echo "INTENT_LAYER_COLOR_VALUES=$INTENT_COLOR_VALUES" >> "$LAYER_CHECK_FILE"
if [ "$INTENT_COLOR_VALUES" -gt 0 ]; then
  echo "LAYER_CONTAMINATION_INTENT: design intent layer contains concrete color values" >> "$LAYER_CHECK_FILE"
  LAYER_PASS=0
fi

# 检查 2: 视觉约束层不得包含具体色值（已在 Step 3 检查，此处复核）
VISUAL_COLOR_VALUES=$(grep -cE '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(' "${CONSTRAINT_PACKAGE}.visual.json" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then VISUAL_COLOR_VALUES=0; elif [ $GREP_EXIT -gt 1 ]; then VISUAL_COLOR_VALUES=0; fi
echo "VISUAL_LAYER_COLOR_VALUES=$VISUAL_COLOR_VALUES" >> "$LAYER_CHECK_FILE"
if [ "$VISUAL_COLOR_VALUES" -gt 0 ]; then
  echo "LAYER_CONTAMINATION_VISUAL: visual constraints layer contains concrete color values" >> "$LAYER_CHECK_FILE"
  LAYER_PASS=0
fi

# 检查 3: 实现参数层不得包含主观描述词（已在 Step 4 检查，此处复核）
PARAMS_SUBJECTIVE=$(grep -cE '好看|有感觉|不错|棒|美|舒服|和谐|到位' "${CONSTRAINT_PACKAGE}.params.json" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then PARAMS_SUBJECTIVE=0; elif [ $GREP_EXIT -gt 1 ]; then PARAMS_SUBJECTIVE=0; fi
echo "PARAMS_LAYER_SUBJECTIVE=$PARAMS_SUBJECTIVE" >> "$LAYER_CHECK_FILE"
if [ "$PARAMS_SUBJECTIVE" -gt 0 ]; then
  echo "LAYER_CONTAMINATION_PARAMS: implementation params layer contains subjective descriptions" >> "$LAYER_CHECK_FILE"
  LAYER_PASS=0
fi

# 检查 4: 验收指标层不得包含模糊词（已在 Step 5 检查，此处复核）
METRICS_VAGUE=$(grep -cE '好看|有感觉|差不多|还行|凑合|大概|应该|可能|尽量|适当' "${CONSTRAINT_PACKAGE}.metrics.json" 2>/dev/null)
GREP_EXIT=$?
if [ $GREP_EXIT -eq 1 ]; then METRICS_VAGUE=0; elif [ $GREP_EXIT -gt 1 ]; then METRICS_VAGUE=0; fi
echo "METRICS_LAYER_VAGUE=$METRICS_VAGUE" >> "$LAYER_CHECK_FILE"
if [ "$METRICS_VAGUE" -gt 0 ]; then
  echo "LAYER_CONTAMINATION_METRICS: acceptance metrics layer contains vague words" >> "$LAYER_CHECK_FILE"
  LAYER_PASS=0
fi

echo "LAYER_SEPARATION_PASS=$LAYER_PASS" >> "$LAYER_CHECK_FILE"
echo "LAYER_CHECK_FILE=$LAYER_CHECK_FILE" >> "$EXTRACT_LOG"

if [ "$LAYER_PASS" -eq 0 ]; then
  echo "LAYER_SEPARATION_FAILED: four-layer separation violated"
  cat "$LAYER_CHECK_FILE"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

判定分类：
- `LAYER_SEPARATION_FAILED`（任一层包含其他层内容）→ FAIL
- 四层分离清晰，无跨层污染 → Step 7 PASS

## Step 8: 生成约束包并归档

1. 合并四层为完整约束包 JSON：

```bash
# REV-4 修正：在包生成前计算占位符数并确定最终状态，传入约束包 JSON（N3）
TEMPLATE_PLACEHOLDERS=0
for layer_file in "${CONSTRAINT_PACKAGE}.visual.json" "${CONSTRAINT_PACKAGE}.params.json" "${CONSTRAINT_PACKAGE}.metrics.json" "${CONSTRAINT_PACKAGE}.forbidden.json"; do
  if [ -f "$layer_file" ]; then
    LAYER_COUNT=$(grep -c '待填充' "$layer_file" 2>/dev/null)
    LAYER_GREP_EXIT=$?
    if [ $LAYER_GREP_EXIT -eq 1 ]; then LAYER_COUNT=0; elif [ $LAYER_GREP_EXIT -gt 1 ]; then LAYER_COUNT=0; fi
    TEMPLATE_PLACEHOLDERS=$((TEMPLATE_PLACEHOLDERS + LAYER_COUNT))
  fi
done
echo "TEMPLATE_PLACEHOLDERS=$TEMPLATE_PLACEHOLDERS" >> "$EXTRACT_LOG"

if [ "$BLOCKED_COUNT" -gt 0 ]; then
  EXTRACT_STATUS="BLOCKED_ENV"
elif [ "$FAIL_COUNT" -gt 0 ]; then
  EXTRACT_STATUS="FAIL"
elif [ "$TEMPLATE_PLACEHOLDERS" -gt 0 ]; then
  EXTRACT_STATUS="TEMPLATE"
else
  EXTRACT_STATUS="PASS"
fi

jq -n \
  --arg scene "$SCENE_TYPE" \
  --arg emotion "$CORE_EMOTION" \
  --arg intentFile "$INTENT_FILE" \
  --rawfile intent "$INTENT_FILE" \
  --slurpfile visual "${CONSTRAINT_PACKAGE}.visual.json" \
  --slurpfile params "${CONSTRAINT_PACKAGE}.params.json" \
  --slurpfile metrics "${CONSTRAINT_PACKAGE}.metrics.json" \
  --slurpfile forbidden "${CONSTRAINT_PACKAGE}.forbidden.json" \
  --rawfile layerCheck "$LAYER_CHECK_FILE" \
  --rawfile extractLog "$EXTRACT_LOG" \
  --argjson failCount "$FAIL_COUNT" \
  --argjson blockedCount "$BLOCKED_COUNT" \
  --argjson templatePlaceholders "$TEMPLATE_PLACEHOLDERS" \
  --arg finalStatus "$EXTRACT_STATUS" \
  '{
    schemaVersion: "1.0",
    scene: $scene,
    coreEmotion: $emotion,
    source: {
      intentFile: $intentFile,
      intentContent: $intent
    },
    layers: {
      visualConstraints: $visual[0],
      implementationParams: $params[0],
      acceptanceMetrics: $metrics[0],
      forbiddenTendencies: $forbidden[0]
    },
    validation: {
      layerSeparationCheck: $layerCheck,
      extractLog: $extractLog,
      failCount: $failCount,
      blockedCount: $blockedCount,
      templatePlaceholderCount: $templatePlaceholders,
      status: $finalStatus
    }
  }' > "$CONSTRAINT_PACKAGE" 2>"$ERR_FILE"
JQ_EXIT=$?
if [ $JQ_EXIT -ne 0 ]; then
  echo "CONSTRAINT_PACKAGE_GENERATION_FAILED: jq exit=$JQ_EXIT"
  cat "$ERR_FILE"
  exit 2
fi

# REV-4 修正：占位符数和状态已在包生成前计算并传入 JSON（见上方）
# REV-3 修正：LAYER_CHECK_FILE 存在性检查（M2: LAYER_CHECK_MISSING）
if [ ! -f "$LAYER_CHECK_FILE" ]; then
  echo "LAYER_CHECK_MISSING: layer check file not found" >> "$EXTRACT_LOG"
  echo "LAYER_CHECK_MISSING"
  BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
fi
```

2. 计算约束包 SHA-256 并归档证据：

```bash
# REV-2 修正：拆开 sha256sum | awk 管道，先捕获 sha256sum 退出码再解析
SHA256_OUTPUT=$(sha256sum "$CONSTRAINT_PACKAGE" 2>"$ERR_FILE")
SHA_EXIT=$?
if [ $SHA_EXIT -ne 0 ]; then
  echo "SHA256_FAILED: constraint package (exit=$SHA_EXIT)"
  cat "$ERR_FILE"
  exit 2
fi
PACKAGE_SHA=$(printf '%s' "$SHA256_OUTPUT" | awk '{print $1}')
echo "CONSTRAINT_PACKAGE_SHA256=$PACKAGE_SHA"

# 创建证据目录并归档
mkdir -p "$EVIDENCE_DIR" 2>"$ERR_FILE"
MKDIR_EXIT=$?
if [ $MKDIR_EXIT -ne 0 ]; then
  echo "EVIDENCE_DIR_CREATE_FAILED: mkdir exit=$MKDIR_EXIT"
  cat "$ERR_FILE"
  exit 2
fi

ARCHIVE_ERROR=0
cp "$CONSTRAINT_PACKAGE" "$EVIDENCE_DIR/constraint-package.json" || ARCHIVE_ERROR=1
cp "${CONSTRAINT_PACKAGE}.visual.json" "$EVIDENCE_DIR/visual-constraints.json" || ARCHIVE_ERROR=1
cp "${CONSTRAINT_PACKAGE}.params.json" "$EVIDENCE_DIR/implementation-params.json" || ARCHIVE_ERROR=1
cp "${CONSTRAINT_PACKAGE}.metrics.json" "$EVIDENCE_DIR/acceptance-metrics.json" || ARCHIVE_ERROR=1
cp "${CONSTRAINT_PACKAGE}.forbidden.json" "$EVIDENCE_DIR/forbidden-tendencies.json" || ARCHIVE_ERROR=1
cp "$LAYER_CHECK_FILE" "$EVIDENCE_DIR/layer-check.txt" || ARCHIVE_ERROR=1
cp "$EXTRACT_LOG" "$EVIDENCE_DIR/extract-log.txt" || ARCHIVE_ERROR=1

if [ "$ARCHIVE_ERROR" -ne 0 ]; then
  echo "EVIDENCE_ARCHIVE_ERROR: failed to archive constraint evidence"
  exit 2
fi

echo "EVIDENCE_DIR=$EVIDENCE_DIR"
echo "CONSTRAINT_PACKAGE=$CONSTRAINT_PACKAGE"
echo "PACKAGE_SHA256=$PACKAGE_SHA"
```

3. 确定最终状态并输出：

```bash
if [ "$BLOCKED_COUNT" -gt 0 ]; then
  EXTRACT_STATUS="BLOCKED_ENV"
elif [ "$FAIL_COUNT" -gt 0 ]; then
  EXTRACT_STATUS="FAIL"
elif [ "$TEMPLATE_PLACEHOLDERS" -gt 0 ]; then
  EXTRACT_STATUS="TEMPLATE"
else
  EXTRACT_STATUS="PASS"
fi

echo "EXTRACT_STATUS=$EXTRACT_STATUS"
echo "FAIL_COUNT=$FAIL_COUNT"
echo "BLOCKED_COUNT=$BLOCKED_COUNT"
echo "TEMPLATE_PLACEHOLDERS=$TEMPLATE_PLACEHOLDERS"

case "$EXTRACT_STATUS" in
  PASS)
    echo "CONSTRAINT_EXTRACTION_PASS: four-layer separation clear, constraints executable and verifiable, all placeholders filled"
    exit 0
    ;;
  TEMPLATE)
    echo "CONSTRAINT_EXTRACTION_TEMPLATE: template generated, $TEMPLATE_PLACEHOLDERS placeholders remain for design team to fill"
    exit 0
    ;;
  FAIL)
    echo "CONSTRAINT_EXTRACTION_FAIL: $FAIL_COUNT failure(s) detected"
    exit 1
    ;;
  BLOCKED_ENV)
    echo "CONSTRAINT_EXTRACTION_BLOCKED: $BLOCKED_COUNT blocker(s) - input missing or environment issue"
    exit 2
    ;;
  *)
    echo "CONSTRAINT_EXTRACTION_NOT_RUN: extraction did not complete"
    exit 2
    ;;
esac
```

判定分类：
- `CONSTRAINT_PACKAGE_GENERATION_FAILED` / `SHA256_FAILED` / `EVIDENCE_DIR_CREATE_FAILED` / `EVIDENCE_ARCHIVE_ERROR` / `LAYER_CHECK_MISSING` → BLOCKED_ENV
- 四层分离清晰、约束可执行可验证、禁用倾向可检测、证据完整归档、无占位符 → PASS
- 四层分离清晰、模板生成成功但含占位符 → TEMPLATE（可交付设计团队填充，填充后重新运行可达 PASS）
- 有 FAIL 项（层级混淆、约束不可观察、指标不可测量、禁用项不可检测）→ FAIL
- 有 BLOCKED_ENV 项（输入缺失、工具缺失、生成失败）→ BLOCKED_ENV

## 决策点

- 设计意图不明确（文件缺失/为空/场景类型无效）→ BLOCKED_ENV，需补充输入
- 视觉约束不可观察（含具体色值）→ FAIL，需重新提取
- 实现参数含主观描述或未填充占位符 → FAIL，需量化
- 验收指标不可测量（含模糊词）→ FAIL，需量化
- 禁用倾向不可检测（缺检测方法或阈值）→ FAIL，需补充
- 四层分离混淆 → FAIL，需重新分离
- 四层分离清晰、约束可执行可验证、HeartMirror 语言已应用、禁用倾向明确可检测 → PASS
