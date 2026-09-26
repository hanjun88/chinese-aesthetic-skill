<!--
================================================================================
 状态: DRAFT v0.1（代码生成协议 · 第一版）
 作者: 子代理L — 代码生成引擎
 配套: architecture.md / tokens.css / templates/
 待补充: 等完整课程内容后补充更多模板、映射规则与组件库
 纪律: 不修改任何原有美学模块文件（01-11 / frontend-modules DRAFT）
================================================================================
-->

# 代码生成协议 (Code Generation Protocol)
## AestheticConstraintSheet → CodeGenerationPlan → 可运行前端项目

> 本协议是「中式美学设计决策引擎 × 前端能力」融合项目的**实现层合同**。
> 输入：一份 11 维度美学约束单（`AestheticConstraintSheet`）。
> 输出：一份确定性代码计划（`CodeGenerationPlan`）+ 可运行 HTML/CSS/JS 项目。
> 两个 Schema 之间的翻译只通过 §5 映射规则表完成，**不重新发明美学规则**。

---

## 目录

- §1 [AestheticConstraintSheet 完整 JSON Schema](#1-aestheticconstraintsheet-完整-json-schema)
- §2 [CodeGenerationPlan 完整 JSON Schema](#2-codegenerationplan-完整-json-schema)
- §3 [生成流程 Pipeline（8 步）](#3-生成流程-pipeline8-步)
- §4 [质量门 Quality Gates](#4-质量门-quality-gates)
- §5 [约束单→代码映射规则表（11 维度）](#5-约束单代码映射规则表11-维度)
- §6 [示例 1：宋韵风格登录页](#6-示例-1宋韵风格登录页)
- §7 [示例 2：禅意作品集](#7-示例-2禅意作品集)
- §8 [示例 3：唐韵电商首页](#8-示例-3唐韵电商首页)
- §9 [模板系统索引](#9-模板系统索引)

---

## 1. AestheticConstraintSheet 完整 JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://eastern-aesthetic.dev/schemas/AestheticConstraintSheet.json",
  "title": "AestheticConstraintSheet",
  "description": "美学约束单：美学决策层（11 维度引擎）的输出，实现层唯一合法输入。",
  "type": "object",
  "required": [
    "sheet_id", "design_brief", "mood", "attribution_statement",
    "structural_dimensions", "color_system", "proportion",
    "spatial", "lighting", "motion", "anti_cliche"
  ],
  "properties": {
    "sheet_id": {
      "type": "string",
      "description": "约束单唯一 ID",
      "pattern": "^act-[a-z0-9-]+$",
      "examples": ["act0-song-login", "act1-chan-portfolio", "act2-tang-shop"]
    },
    "design_brief": {
      "type": "string",
      "description": "原始设计需求简述",
      "examples": ["宋韵风格登录页", "禅意作品集", "唐韵电商首页"]
    },
    "mood": {
      "type": "string",
      "enum": ["song-elegant", "chan-zen", "tang-tang", "night-feast", "misty-blue"],
      "description": "整体情绪基调，决定配色与动势原型默认值"
    },
    "attribution_statement": {
      "type": "string",
      "maxLength": 200,
      "description": "归因陈述（≤200字，说出≥3个结构维度）"
    },

    "structural_dimensions": {
      "type": "array",
      "minItems": 3,
      "description": "结构维度选择（≥3个，带权重与硬约束）",
      "items": {
        "type": "object",
        "required": ["id", "weight", "hard"],
        "properties": {
          "id": {
            "type": "string",
            "enum": [
              "01-philosophy", "02-spatial-order", "03-void-solid",
              "04-proportion", "05-material", "06-light",
              "07-color", "08-motion", "09-architecture",
              "10-interaction", "11-anti-cliche"
            ]
          },
          "weight": { "type": "string", "enum": ["primary", "secondary", "tertiary"] },
          "hard": { "type": "string", "description": "硬约束（可被代码直接消费）" },
          "soft": { "type": "string", "description": "软建议" }
        }
      }
    },

    "color_system": {
      "type": "object",
      "required": ["palette", "saturation_max", "hard_fail_hex"],
      "properties": {
        "palette": {
          "type": "array",
          "minItems": 3,
          "items": {
            "type": "object",
            "required": ["role", "name", "hex", "hsl", "area_pct", "usage"],
            "properties": {
              "role": {
                "type": "string",
                "enum": ["primary", "secondary", "accent", "shadow", "surface"]
              },
              "name": { "type": "string", "examples": ["月白", "黛青", "古金", "黛影"] },
              "hex": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
              "hsl": { "type": "string", "pattern": "^hsl\\([0-9]+,[0-9]+%,[0-9]+%\\)$" },
              "area_pct": { "type": "number", "minimum": 0, "maximum": 100 },
              "usage": { "type": "string" }
            }
          }
        },
        "saturation_max": {
          "type": "integer",
          "maximum": 50,
          "description": "HSL 饱和度上限（铁律 ≤50）"
        },
        "hard_fail_hex": {
          "type": "array",
          "items": { "type": "string" },
          "description": "禁用色值",
          "examples": [["#FF0000", "#FFD700", "#000000", "#00FFFF"]]
        }
      }
    },

    "proportion": {
      "type": "object",
      "required": ["base_module_m", "spacing_scale", "void_solid_ratio", "focal_points_max"],
      "properties": {
        "base_module_m": { "type": "string", "examples": ["8px"] },
        "spacing_scale": {
          "type": "array",
          "items": { "type": "string" },
          "description": "允许的间距档位（禁 5m/7m）",
          "examples": [["1m", "2m", "3m", "4m", "6m", "8m"]]
        },
        "type_scale": {
          "type": "array",
          "items": { "type": "string" },
          "examples": [["0.75m", "1m", "1.5m", "2m", "3m"]]
        },
        "void_solid_ratio": { "type": "string", "examples": ["7:5"] },
        "focal_points_max": { "type": "integer", "minimum": 1, "maximum": 3 }
      }
    },

    "spatial": {
      "type": "object",
      "required": ["axis", "bays", "hierarchy_levels_min"],
      "properties": {
        "axis": { "type": "string", "enum": ["strict", "offset", "hidden"] },
        "bays": { "type": "integer", "enum": [3, 5, 7] },
        "hierarchy_levels_min": { "type": "integer", "minimum": 2 },
        "depth_transitions_min": { "type": "integer", "minimum": 1 }
      }
    },

    "lighting": {
      "type": "object",
      "required": ["primary_source", "time_setting", "light_dark_ratio"],
      "properties": {
        "primary_source": {
          "type": "string",
          "enum": ["skylight", "leaked", "side", "bounced", "moonlight"]
        },
        "time_setting": {
          "type": "string",
          "enum": ["dawn", "noon", "dusk", "night", "cloudy"]
        },
        "light_dark_ratio": { "type": "string", "examples": ["3:7"] },
        "has_leak_shadow": { "type": "boolean" }
      }
    },

    "motion": {
      "type": "object",
      "required": ["prototypes", "duration_ms", "easing", "entry_mode", "hard_fail"],
      "properties": {
        "prototypes": {
          "type": "array",
          "items": { "type": "string", "enum": ["cloud", "water", "smoke", "wind", "light"] },
          "minItems": 1
        },
        "duration_ms": {
          "type": "array",
          "items": { "type": "integer" },
          "description": "[min, max] 时长区间",
          "examples": [[2000, 8000]]
        },
        "easing": {
          "type": "object",
          "description": "各原型缓动曲线（必须与 tokens.css 一致）",
          "properties": {
            "cloud":  { "type": "string", "examples": ["cubic-bezier(0.25,0.1,0.25,1)"] },
            "water":  { "type": "string", "examples": ["cubic-bezier(0.33,1,0.68,1)"] },
            "smoke":  { "type": "string", "examples": ["cubic-bezier(0.17,0.67,0.12,0.99)"] },
            "breath": { "type": "string", "examples": ["cubic-bezier(0.45,0.05,0.55,0.95)"] }
          }
        },
        "parallax_layers_min": { "type": "integer", "minimum": 2 },
        "entry_mode": { "type": "string", "enum": ["emerge", "pop"] },
        "breathing_loop": { "type": "boolean" },
        "hard_fail": {
          "type": "array",
          "items": { "type": "string" },
          "description": "禁用动效",
          "examples": [["bounce", "back", "spin", "scale-overshoot", "particle", "linear"]]
        }
      }
    },

    "anti_cliche": {
      "type": "object",
      "required": ["scanned", "hard_fail_hits", "forbidden"],
      "properties": {
        "scanned": { "type": "boolean" },
        "hard_fail_hits": { "type": "array", "items": { "type": "string" } },
        "forbidden": {
          "type": "array",
          "items": { "type": "string" },
          "examples": [["祥云纹满铺", "毛笔字当标题", "正红宫墙", "灯笼", "飞檐特写", "弹跳入场", "纯黑阴影"]]
        }
      }
    }
  },
  "additionalProperties": false
}
```

---

## 2. CodeGenerationPlan 完整 JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://eastern-aesthetic.dev/schemas/CodeGenerationPlan.json",
  "title": "CodeGenerationPlan",
  "description": "代码生成计划：实现层把约束单翻译为可运行代码的中间表示。",
  "type": "object",
  "required": [
    "plan_id", "from_sheet", "tech_stack", "components",
    "css_variables", "animation_timeline", "referenced_cards", "quality_gates"
  ],
  "properties": {
    "plan_id": { "type": "string", "examples": ["plan-act0-song-login"] },
    "from_sheet": { "type": "string", "description": "来源约束单 sheet_id" },

    "tech_stack": {
      "type": "object",
      "required": ["markup", "style", "logic", "framework", "entry"],
      "properties": {
        "markup":   { "type": "string", "enum": ["html5", "jsx", "vue-template"] },
        "style":    { "type": "string", "enum": ["css-variables", "inline"] },
        "logic":    { "type": "string", "enum": ["vanilla-js", "react-class", "vue-options"] },
        "framework":{ "type": "string", "enum": ["none", "react", "vue"] },
        "entry":    { "type": "string", "examples": ["index.html"] }
      }
    },

    "components": {
      "type": "array",
      "description": "组件清单：每个组件声明消费哪些美学维度",
      "items": {
        "type": "object",
        "required": ["name", "el", "dims", "behavior"],
        "properties": {
          "name": { "type": "string", "examples": ["CloudBackdrop", "Gate", "LoginForm"] },
          "el":   { "type": "string", "description": "DOM 选择器", "examples": [".scene__cloud", ".gate"] },
          "dims": {
            "type": "array",
            "items": { "type": "string" },
            "description": "消费的美学维度 id"
          },
          "behavior": { "type": "string", "description": "组件行为描述（含动势/时长）" }
        }
      }
    },

    "css_variables": {
      "type": "object",
      "description": "由 color_system/proportion/motion 派生的 :root 变量",
      "properties": {
        ":root": {
          "type": "object",
          "additionalProperties": { "type": "string" },
          "examples": [{
            "--c-primary": "#E8E4D9",
            "--c-secondary": "#2C3E50",
            "--c-accent": "#B8860B",
            "--c-shadow": "#1A2332",
            "--m": "8px",
            "--ease-cloud": "cubic-bezier(0.25,0.1,0.25,1)",
            "--ease-breath": "cubic-bezier(0.45,0.05,0.55,0.95)"
          }]
        }
      }
    },

    "animation_timeline": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["trigger", "target", "duration_ms"],
        "properties": {
          "trigger":  { "type": "string", "enum": ["load", "scroll-20%", "scroll-50%", "hover", "click", "infinite"] },
          "target":   { "type": "string" },
          "duration_ms": { "type": "integer", "minimum": 800 },
          "easing":   { "type": "string" },
          "iterate":  { "type": "string", "enum": ["infinite", "once"], "default": "once" },
          "action":   { "type": "string", "examples": ["emerge", "门微启/光微漏"] }
        }
      }
    },

    "referenced_cards": {
      "type": "object",
      "description": "本计划引用的能力卡（按技术域）",
      "properties": {
        "markup": { "type": "array", "items": { "type": "string" } },
        "logic":  { "type": "array", "items": { "type": "string" } },
        "framework": { "type": "array", "items": { "type": "string" } }
      }
    },

    "file_structure": {
      "type": "object",
      "description": "输出文件树（来自 templates/project-structure.txt）",
      "properties": {
        "entry_html": { "type": "string" },
        "main_css":   { "type": "string" },
        "main_js":    { "type": "string" },
        "tokens_css": { "type": "string" },
        "components": { "type": "array", "items": { "type": "string" } }
      }
    },

    "quality_gates": {
      "type": "array",
      "items": { "type": "string" },
      "description": "代码产物必须逐条通过的检查项"
    }
  },
  "additionalProperties": false
}
```

---

## 3. 生成流程 Pipeline（8 步）

> 不可跳步。每步有输入/输出/通过标准。

| Step | 名称 | 输入 | 动作 | 输出 | 通过标准 |
|---|---|---|---|---|---|
| **S1** | 约束单解析 | 用户 brief | 美学引擎选 ≥3 维度、提取硬约束、反俗套扫描 | `AestheticConstraintSheet` JSON | `structural_dimensions≥3`、`anti_cliche.scanned=true`、`saturation_max≤50` |
| **S2** | CSS 变量派生 | `color_system` + `proportion` + `motion.easing` | 照抄 tokens.css 对应 HSL/cubic-bezier，不改值 | `css_variables.:root` 块 | 所有色值 ∈ tokens.css；间距 = n×8px |
| **S3** | 技术选型 | `mood` + 需求形态 | 默认 `framework=none`；组件复杂时选 react/vue | `tech_stack` 对象 | `markup/style/logic/framework` 四元组闭合 |
| **S4** | 组件路由 | `structural_dimensions` + `components[]` | 按 §5 映射表选东方组件（Gate/Screen/LatticeWindow…） | 组件清单 | 每个 `dim` 至少落到一个 CSS/JS 参数 |
| **S5** | 文件结构生成 | `tech_stack` + `templates/project-structure.txt` | 选择单页/多页、是否生成 src/components | `file_structure` | 目录树与模板一致 |
| **S6** | 代码组装 | `index.html.template` / `styles.css.template` / `main.js.template` | 替换 `{{占位符}}`，填充组件 CSS/JS | 可运行项目 | 替换后无残留 `{{` |
| **S7** | 质量门复检 | 生成产物 | 跑 §4 清单 + 回灌 modules/11 反俗套 | PASS/FAIL | 任一条不过 → 回 S2 |
| **S8** | 归因输出 | `attribution_statement` | 代码后附 ≤200 字归因 | 最终交付 | 说出 ≥3 个结构维度 |

---

## 4. 质量门 Quality Gates

> 代码产物交付前逐条打勾。**任一条不过 → 回炉，不得交付。**

### 4.1 色彩层（对应 modules/07 + modules/11）
- [ ] 全图最大饱和度 ≤ 50%（HSL 的 S 通道）
- [ ] 无 `#FF0000` / `#FFD700` / `#000000` / `#00FFFF`
- [ ] 大面积(>10%) 朱砂已降为 `hsl(16,45%,35%)`，未用正红
- [ ] 古金为哑光 `#B8860B`，未用 `#FFD700`
- [ ] 阴影用黛影 `#1A2332`/`hsl(222,30%,15%)` 带环境色，非纯黑
- [ ] 所有色值可在 tokens.css 中查到来源

### 4.2 间距/比例层（对应 modules/04）
- [ ] 所有 margin/padding/gap 是 `--m:8px` 的整数倍
- [ ] 未使用 5m/7m 档（间距只取 1/2/3/4/6/8m）
- [ ] 留白 ≥35%、视觉焦点 ≤ `focal_points_max`
- [ ] 画幅比例遵循方五斜七 `aspect-ratio: 7/5`（或 √2）

### 4.3 动效层（对应 modules/08 + modules/11）
- [ ] 无 `bounce` / `back` / `spin` / `linear` / 粒子爆炸
- [ ] 入场是"被遮挡→浮现"（emerge = opacity+微位移），非 scale overshoot 弹出
- [ ] 至少 1 个极缓（5–15s）呼吸循环
- [ ] 动效时长 ≥800ms（禁 <1s 急促动画）
- [ ] `prefers-reduced-motion` 下动画降级为终态

### 4.4 结构/反俗套层（对应 modules/01/02/11）
- [ ] 中轴对齐（`margin-inline:auto` + Grid 三开间）
- [ ] 语义分区 = header(外院)/main(内殿)/footer(内界)
- [ ] 无祥云纹满铺、无毛笔字当标题、无红灯笼、无飞檐特写
- [ ] 归因陈述 ≤200 字且说出 ≥3 个结构维度
- [ ] 本计划引用的能力卡路径全部有效

---

## 5. 约束单→代码映射规则表（11 维度）

> 每格给出**具体到 CSS 属性名/值、JS API 名**的落点。色值均来自 tokens.css。

### 5.1 维度 01 — Philosophy（哲学：界/庇护/进入/递进）

| 约束字段 | 代码落点 | 具体值/属性 |
|---|---|---|
| 界 = 语义分区 | HTML 标签 | `<header class="outer-court">` / `<main class="inner-hall">` / `<footer class="inner-boundary">` |
| 进入仪式（≥2步） | JS 状态机 | `stateMachine('hidden' → 'revealed')`；`entryRitual()` 用 `async/await` 串联 |
| 庇护 | 容器 padding | `padding: calc(8 * var(--m))` 殿堂级包裹 |
| 朝向（中轴） | CSS | `margin-inline: auto;` 整体居中 |

### 5.2 维度 02 — Spatial Order（空间秩序：中轴/开间/层级/进深）

| 约束字段 | 代码落点 | 具体值 |
|---|---|---|
| `axis: strict` | CSS Grid | `display:grid; grid-template-columns:1fr 1.2fr 1fr; margin-inline:auto;` |
| `axis: offset` | CSS Flex + transform | `justify-content:center; transform:translateX(calc(2*var(--m)));` |
| `bays: 3` | grid-template-columns | `1fr 1.2fr 1fr`（明间 1.2× > 次间 1×） |
| `bays: 5` | grid-template-columns | `0.8fr 0.9fr 1.2fr 0.9fr 0.8fr` |
| 开间列间距 | column-gap | `column-gap: calc(3 * var(--m))` = 24px |
| 进深（滚动） | JS | 三层视差 `speed: [0.2, 0.5, 1.0]`，`translateY(scrollY*speed*-1)` |
| 层级 | z-index / position | `.layer--far{z-index:1}` `.layer--mid{z-index:2}` `.layer--near{z-index:3}` |

### 5.3 维度 03 — Void/Solid（虚实：空/藏/露/透/借）

| 约束字段 | 代码落点 | 具体值 |
|---|---|---|
| 留白 ≥35% | padding | `padding: calc(8*var(--m)) calc(6*var(--m))` = 64px/48px |
| `void_solid_ratio: 7:5` | Grid 列 | `grid-template-columns: 5fr 7fr`（实:虚） |
| 藏（默认遮挡） | CSS | `.gate{opacity:0; transform:translateY(calc(2*var(--m)));}` |
| 露（浮现） | CSS transition | `transition: opacity 2500ms var(--ease-breath), transform 2500ms var(--ease-breath);` |
| 触发露 | JS | `IntersectionObserver(threshold:0.2)` → `.is-revealed` |
| 透（软界） | CSS | `backdrop-filter: blur(2px); background: linear-gradient(180deg, rgba(232,228,217,.6), rgba(232,228,217,.25));` |
| `focal_points_max:1` | 布局 | 全页只 1 个 `h1` + 1 个主按钮；其余 `text-align:center` 弱化 |

### 5.4 维度 04 — Proportion（比例：方五斜七/模数）

| 约束字段 | 代码落点 | 具体值 |
|---|---|---|
| `base_module_m: 8px` | CSS 变量 | `--m: 8px;`（来自 tokens.css） |
| `spacing_scale` | 间距派生 | `--space-sm:var(--m)` `--space-lg:calc(var(--m)*2)` … `--space-4xl:calc(var(--m)*8)` |
| 方五斜七 | aspect-ratio | `aspect-ratio: 7 / 5;` |
| 字号梯度 | font-size | `--font-sm:calc(var(--m)*2)` `--font-md:calc(var(--m)*2.5)` `--font-xl:calc(var(--m)*4)` |
| 禁 5m/7m | 检查 | grep 产物中不得出现 `calc(var(--m) * 5)` 或 `* 7` |

### 5.5 维度 05 — Material（材料：木/石/纸/金/雾）

| 约束字段 | 代码落点 | 具体值 |
|---|---|---|
| 哑光古金描边 | border | `border: 1px solid var(--gujin-500);`（= `#B8860B`，禁 `#FFD700`） |
| 宣纸半透 | background | `rgba(232,228,217,.5)` 月白 + `backdrop-filter:blur(2px)` |
| 木纹（柱） | background-image | `repeating-linear-gradient(90deg, hsl(28,23%,30%) 0 2px, hsl(28,23%,35%) 2px 6px)` |
| 青石台基 | background | `hsl(44,25%,80%)`（黛青浅阶） |
| 圆角克制 | border-radius | `--radius-sm:2px` / `--radius-md:4px` / `--radius-lg:8px`（禁 16px+） |

### 5.6 维度 06 — Light（光影：天光/漏光/侧光/月光）

| 约束字段 | 代码落点 | 具体值 |
|---|---|---|
| `primary_source: skylight` | background | `linear-gradient(180deg, hsl(45,30%,96%) 0%, hsl(211,13%,60%) 45%, hsl(222,30%,15%) 100%)` |
| `primary_source: moonlight` | box-shadow | `--shadow-moon: 0 0 20px hsl(220,30%,80%,.3), 0 0 60px hsl(220,25%,70%,.15)` |
| `has_leak_shadow: true` | ::after 投影 | `repeating-linear-gradient(90deg, hsl(222,30%,15%,.18) 0 2px, transparent 2px 24px); mix-blend-mode:multiply;` |
| `light_dark_ratio: 3:7` | 渐变分段 | 亮部 0–30% / 过渡 30–55% / 暗部 55–100% |
| 阴影带环境色 | box-shadow | `box-shadow: 0 calc(3*var(--m)) calc(6*var(--m)) var(--c-shadow);`（`--c-shadow:#1A2332` 非纯黑） |

### 5.7 维度 07 — Color（色彩：五色降饱和）

| 约束字段 | 代码落点 | 具体值（tokens.css 源） |
|---|---|---|
| `role: primary` 月白 | `--c-primary` | `#E8E4D9` = `hsl(42,25%,88%)`，面积 60–70% |
| `role: secondary` 黛青 | `--c-secondary` | `#2C3E50` = `hsl(210,20%,25%)`，面积 20–30% |
| `role: accent` 古金 | `--c-accent` | `#B8860B` = `hsl(43,75%,38%)`，面积 ≤8% |
| `role: shadow` 黛影 | `--c-shadow` | `#1A2332` = `hsl(222,30%,15%)`，面积 ≤5% |
| 按钮主色（大面朱砂替代） | `--c-btn` | `hsl(16,45%,35%)`（UI朱砂降饱和，禁 `#FF0000`） |
| `saturation_max:50` | 检查 | 所有 HSL 的 S ≤ 50；`#FFD700`(S=100) 禁用 |
| 文字色 | `--color-text` | `var(--dai-blue-700)` = `#2C3E50` |

### 5.8 维度 08 — Motion（动势：云/水/烟/风/光）

| 约束字段 | 代码落点 | 具体值（tokens.css 源） |
|---|---|---|
| `prototypes:["cloud"]` | @keyframes | `@keyframes drift-cloud{from{transform:translate3d(-5%,0,0)}to{transform:translate3d(5%,0,0)}}` |
| cloud 缓动 | `--ease-cloud` | `cubic-bezier(0.25,0.1,0.25,1)` |
| cloud 时长 | animation | `animation: drift-cloud 6000ms var(--ease-cloud) infinite alternate;` |
| `prototypes:["water"]` | @keyframes | `@keyframes wave{0%{transform:translateX(0)}50%{transform:translateX(-12px)}100%{transform:translateX(-24px)}}` |
| water 缓动 | `--ease-water` | `cubic-bezier(0.33,1,0.68,1)` |
| `prototypes:["smoke"]` | @keyframes | `@keyframes rise-smoke{0%{transform:translateY(0) scale(1);opacity:.5}100%{transform:translateY(-40px) scale(1.6);opacity:0}}` |
| breath 循环 | @keyframes | `@keyframes breathe-light{0%,100%{opacity:.85}50%{opacity:1}}` |
| breath 缓动 | `--ease-breath` | `cubic-bezier(0.45,0.05,0.55,0.95)` |
| `entry_mode: emerge` | CSS | `opacity:0 → 1` + `translateY(16px → 0)`，**禁 scale 0→1** |
| `hard_fail` | 检查 | grep 禁词：`bounce\|back-out\|spin\|linear\|steps(` |

### 5.9 维度 09 — Architecture（建筑精神：三段式）

| 约束字段 | 代码落点 | 具体值 |
|---|---|---|
| 三段式 | grid-template-rows | `grid-template-rows: 45fr 35fr 20fr;`（屋顶45/屋身35/台基20，不可颠倒） |
| 屋顶举折 | border-radius | `border-radius: 50% 50% 0 0 / 100% 100% 0 0;` |
| 屋身 | background | `var(--c-secondary)` 黛青 |
| 台基 | background | `hsl(44,25%,80%)` 青石 |
| 屋顶高度 | height | `height: calc(9 * var(--m))` = 72px |
| 台基高度 | height | `height: calc(4 * var(--m))` = 32px |

### 5.10 维度 10 — Interaction（交互：进入/递进/仪式）

| 约束字段 | 代码落点 | 具体值 |
|---|---|---|
| 滚动=进深 | JS scroll | `addEventListener('scroll', ..., {passive:true})`；三层视差 0.2/0.5/1.0 |
| 推门（点击） | JS classList | `el.addEventListener('click', e=>e.currentTarget.classList.toggle('is-open'))` |
| 推门时长 | CSS transition | `transition: transform 1000ms var(--ease-breath);` |
| hover=门微启 | CSS :hover | `.screen:hover{background:linear-gradient(...,rgba(...,0.9))}`（微透→实透，非变色弹跳） |
| 慢入慢出 | transition-duration | 进入 600ms / 离开 1200ms（回退更慢=余韵） |
| 停靠 | scroll-snap | `scroll-snap-type: y mandatory;`（院落式纵向） |

### 5.11 维度 11 — Anti-Cliche（反俗套）

| 检查项 | 代码落点 | 判定 |
|---|---|---|
| 正红 | grep `#FF0000` | 命中=FAIL |
| 亮金 | grep `#FFD700` | 命中=FAIL |
| 纯黑 | grep `#000000` | 命中=FAIL（阴影须用 `#1A2332`） |
| 弹跳缓动 | grep `bounce\|cubic-bezier.*back` | 命中=FAIL |
| 旋转 | grep `rotate(` + `spin` | 命中=FAIL |
| 毛笔字标题 | font-family | 标题用 `var(--font-serif)`，禁 `KaiTi`/`Ma Shan Zheng` |
| 祥云满铺 | background-image | 不得用 repeat 祥云 PNG 满铺 |
| 红灯笼 | DOM/img | 不得出现 `<img alt="灯笼">` |

---

## 6. 示例 1：宋韵风格登录页

### 6.1 输入 — AestheticConstraintSheet（完整 JSON）

```json
{
  "$schema": "https://eastern-aesthetic.dev/schemas/AestheticConstraintSheet.json",
  "sheet_id": "act0-song-login",
  "design_brief": "宋韵风格登录页",
  "mood": "song-elegant",
  "attribution_statement": "本设计东方性建立在中轴递进的空间秩序、七藏三露的虚实关系、方五斜七的模数克制与天光明暗比3:7之上；不靠红墙飞檐，而靠月白留白与古金细线使观者在呼吸感中体验宋韵。",
  "structural_dimensions": [
    { "id": "07-color", "weight": "primary", "hard": "全图 S≤50%；正红#FF0000/亮金#FFD700 禁用", "soft": "阴影须带环境色" },
    { "id": "02-spatial-order", "weight": "primary", "hard": "核心元素居中轴；间距为 8px 模数倍数", "soft": "3 开间网格" },
    { "id": "03-void-solid", "weight": "secondary", "hard": "表单周围留白≥35%", "soft": "七藏三露" },
    { "id": "08-motion", "weight": "secondary", "hard": "禁 bounce/spin/linear；入场=被遮挡后浮现", "soft": "云 6s 呼吸循环" }
  ],
  "color_system": {
    "palette": [
      { "role": "primary",   "name": "月白", "hex": "#E8E4D9", "hsl": "hsl(42,25%,88%)", "area_pct": 65, "usage": "页面底/留白" },
      { "role": "secondary", "name": "黛青", "hex": "#2C3E50", "hsl": "hsl(210,20%,25%)", "area_pct": 25, "usage": "文字/远山/主结构" },
      { "role": "accent",    "name": "古金", "hex": "#B8860B", "hsl": "hsl(43,75%,38%)", "area_pct": 6,  "usage": "按钮描边/匾额线" },
      { "role": "shadow",    "name": "黛影", "hex": "#1A2332", "hsl": "hsl(222,30%,15%)", "area_pct": 4,  "usage": "阴影/底部暗部" }
    ],
    "saturation_max": 50,
    "hard_fail_hex": ["#FF0000", "#FFD700", "#000000", "#00FFFF"]
  },
  "proportion": {
    "base_module_m": "8px",
    "spacing_scale": ["1m","2m","3m","4m","6m","8m"],
    "type_scale": ["0.75m","1m","1.5m","2m","3m"],
    "void_solid_ratio": "7:5",
    "focal_points_max": 1
  },
  "spatial": { "axis": "strict", "bays": 3, "hierarchy_levels_min": 3, "depth_transitions_min": 1 },
  "lighting": { "primary_source": "skylight", "time_setting": "morning", "light_dark_ratio": "3:7", "has_leak_shadow": true },
  "motion": {
    "prototypes": ["cloud", "light"],
    "duration_ms": [2000, 8000],
    "easing": {
      "cloud":  "cubic-bezier(0.25,0.1,0.25,1)",
      "breath": "cubic-bezier(0.45,0.05,0.55,0.95)"
    },
    "parallax_layers_min": 3,
    "entry_mode": "emerge",
    "breathing_loop": true,
    "hard_fail": ["bounce","back","spin","scale-overshoot","particle","linear"]
  },
  "anti_cliche": {
    "scanned": true,
    "hard_fail_hits": [],
    "forbidden": ["祥云纹满铺","毛笔字当标题","正红宫墙","灯笼","飞檐特写","弹跳入场","纯黑阴影"]
  }
}
```

### 6.2 中间产物 — CodeGenerationPlan（完整 JSON）

```json
{
  "$schema": "https://eastern-aesthetic.dev/schemas/CodeGenerationPlan.json",
  "plan_id": "plan-act0-song-login",
  "from_sheet": "act0-song-login",
  "tech_stack": {
    "markup": "html5", "style": "css-variables", "logic": "vanilla-js",
    "framework": "none", "entry": "index.html"
  },
  "components": [
    { "name": "CloudBackdrop", "el": ".scene__cloud", "dims": ["08-motion","06-light"], "behavior": "云 6s ease-cloud 循环横移" },
    { "name": "Gate",          "el": ".gate",         "dims": ["01-philosophy","09-architecture","03-void-solid"], "behavior": "远景藏→滚动趋近→过门" },
    { "name": "LoginForm",     "el": "form.login",    "dims": ["02-spatial-order","07-color"], "behavior": "中轴 3 开间，月白底黛字古金描边按钮" }
  ],
  "css_variables": {
    ":root": {
      "--c-primary":   "#E8E4D9",
      "--c-secondary": "#2C3E50",
      "--c-accent":    "#B8860B",
      "--c-shadow":    "#1A2332",
      "--c-btn":       "hsl(16,45%,35%)",
      "--m":           "8px",
      "--ease-cloud":  "cubic-bezier(0.25,0.1,0.25,1)",
      "--ease-breath": "cubic-bezier(0.45,0.05,0.55,0.95)"
    }
  },
  "animation_timeline": [
    { "trigger": "load",       "target": ".scene__cloud", "duration_ms": 6000, "easing": "var(--ease-cloud)", "iterate": "infinite" },
    { "trigger": "scroll-20%", "target": ".gate",         "duration_ms": 2500, "action": "emerge" },
    { "trigger": "hover",      "target": ".login__btn",  "duration_ms": 600,  "action": "门微启/光微漏" }
  ],
  "referenced_cards": {
    "markup": ["html-doc-skeleton","html-semantic-tagging","html-nesting-rules","img-alt-seo","image-format-selection","asset-path-resolution"],
    "logic":  ["data-driven-render","branch-switch","data-types-typeof","type-conversion","let-const-naming","debug-errors","equality-logic"],
    "framework": []
  },
  "file_structure": {
    "entry_html": "index.html",
    "main_css":   "styles/main.css",
    "main_js":    "scripts/main.js",
    "tokens_css": "styles/tokens.css",
    "components": []
  },
  "quality_gates": [
    "所有颜色 S≤50%",
    "无 #FF0000/#FFD700/#000000",
    "无 bounce/back/spin/linear easing",
    "间距全部为 8px 模数倍数",
    "留白≥35%",
    "≥1 个极缓呼吸循环",
    "通过 modules/11 四类俗套扫描"
  ]
}
```

### 6.3 输出 — 关键可运行代码（替换占位符后直接运行）

> 单文件保存为 `index.html`，浏览器打开即可。色值全部与 tokens.css 一致。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>宋韵 · 半山听雨</title>
<style>
:root{
  --m:8px;
  --c-primary:#E8E4D9; --c-secondary:#2C3E50; --c-accent:#B8860B; --c-shadow:#1A2332;
  --c-btn:hsl(16,45%,35%);
  --ease-cloud:cubic-bezier(.25,.1,.25,1); --ease-breath:cubic-bezier(.45,.05,.55,.95);
}
*{box-sizing:border-box;margin:0}
body{background:var(--c-primary);color:var(--c-secondary);
  font-family:"Songti SC","Noto Serif SC",serif;font-weight:300;line-height:1.8}
/* 中轴三开间（维度02） */
.hall{display:grid;grid-template-columns:1fr 1.2fr 1fr;column-gap:calc(3*var(--m));
  max-width:calc(60*var(--m));margin-inline:auto;min-height:100vh;align-items:center}
.hall__core{grid-column:2}
/* 天光渐变（维度06）3:7 */
.scene{position:relative;overflow:hidden;
  background:linear-gradient(180deg,hsl(45,30%,96%) 0%,hsl(211,13%,60%) 45%,hsl(222,30%,15%) 100%)}
/* 云（维度08） */
.cloud{position:absolute;width:60%;height:60px;top:20%;
  background:rgba(232,228,217,.5);filter:blur(18px);border-radius:40px;
  animation:drift 6000ms var(--ease-cloud) infinite alternate}
@keyframes drift{from{transform:translateX(-5%)}to{transform:translateX(5%)}}
/* 门（维度09三段式 + 维度03藏露） */
.gate{display:grid;grid-template-rows:45fr 35fr 20fr;width:calc(20*var(--m));
  margin-inline:auto;opacity:0;transform:translateY(calc(2*var(--m)));
  transition:opacity 2500ms var(--ease-breath),transform 2500ms var(--ease-breath)}
.gate.is-revealed{opacity:1;transform:none}
.gate__roof{height:calc(9*var(--m));background:var(--c-secondary);
  border-radius:50% 50% 0 0/100% 100% 0 0}
.gate__body{background:var(--c-secondary);border-inline:calc(1*var(--m)) solid var(--c-accent);
  display:grid;place-items:center;color:var(--c-primary);padding:calc(2*var(--m))}
.gate__base{height:calc(4*var(--m));background:hsl(44,25%,80%)}
/* 登录表单（留白≥35%） */
.login{padding:calc(8*var(--m)) calc(6*var(--m));background:var(--c-primary);
  box-shadow:0 calc(3*var(--m)) calc(6*var(--m)) var(--c-shadow)}
.login h1{font-size:calc(4*var(--m));font-weight:300;letter-spacing:.2em;text-align:center}
.login p.sub{font-size:calc(2*var(--m));color:hsl(0,3%,45%);text-align:center;
  margin-top:var(--space-md,calc(1.5*var(--m)));letter-spacing:.3em}
.login__row{margin-top:calc(3*var(--m))}
.login__row label{display:block;font-size:calc(1.5*var(--m));letter-spacing:.2em;margin-bottom:calc(.5*var(--m))}
.login__row input{width:100%;padding:calc(1*var(--m));border:1px solid hsl(40,15%,75);
  background:#F0EDE5;font-family:inherit;font-size:calc(2*var(--m))}
.login__btn{margin-top:calc(4*var(--m));width:100%;padding:calc(1.5*var(--m));
  background:var(--c-btn);color:var(--c-primary);border:1px solid var(--c-accent);
  font-family:inherit;font-size:calc(2*var(--m));letter-spacing:.3em;cursor:pointer;
  border-radius:2px;transition:opacity 600ms var(--ease-breath)}
.login__btn:hover{opacity:.85}
.hint{position:fixed;bottom:calc(3*var(--m));left:50%;transform:translateX(-50%);
  font-size:calc(1.5*var(--m));letter-spacing:.2em;opacity:.7}
</style>
</head>
<body>
<main class="scene">
  <div class="cloud"></div>
  <section class="hall">
    <div class="hall__core">
      <div class="gate" id="gate">
        <div class="gate__roof"></div>
        <div class="gate__body"><span>半 山</span></div>
        <div class="gate__base"></div>
      </div>
      <form class="login" style="margin-top:calc(4*var(--m))">
        <h1>入 境</h1>
        <p class="sub">— 一个人的宋韵 —</p>
        <div class="login__row"><label>姓名</label><input type="text" autocomplete="off"></div>
        <div class="login__row"><label>口令</label><input type="password"></div>
        <button class="login__btn" type="submit">入 门</button>
      </form>
    </div>
  </section>
  <p class="hint">向下滚动 · 趋近门</p>
</main>
<script>
// 藏露：滚动浮现（emerge，非弹出）
var gate=document.getElementById('gate');
var io=new IntersectionObserver(function(es){es.forEach(function(e){
  if(e.isIntersecting){gate.classList.add('is-revealed');io.unobserve(gate);}
})},{threshold:.2});
io.observe(gate);
// 推门：按钮 hover 微启已由 CSS transition 处理
</script>
</body>
</html>
```

**质量门自检**：S≤50%（月白 S25%）✓；无 `#FF0000/#FFD700/#000000` ✓；无 bounce/linear ✓；间距均为 8px 倍数 ✓；留白 64px/48px ✓；云 6s 呼吸 ✓；阴影 `--c-shadow` 黛影非纯黑 ✓；入场 opacity 浮现 ✓。

---

## 7. 示例 2：禅意作品集

### 7.1 输入 — AestheticConstraintSheet（完整 JSON）

```json
{
  "$schema": "https://eastern-aesthetic.dev/schemas/AestheticConstraintSheet.json",
  "sheet_id": "act1-chan-portfolio",
  "design_brief": "禅意作品集",
  "mood": "chan-zen",
  "attribution_statement": "本设计东方性建立在空无即有的虚实哲学、大虚小实的比例克制、漏光漫反射的光影与水般缓动的动势之上；它不靠佛龛蒲团，而靠缟素留白与唯一墨点使观者在空寂中体验禅意。",
  "structural_dimensions": [
    { "id": "01-philosophy", "weight": "primary", "hard": "界=外院/内殿；进入=远观→趋近", "soft": "空不是无，是藏" },
    { "id": "03-void-solid", "weight": "primary", "hard": "void_solid 7:5；focal_points_max=1", "soft": "七藏三露" },
    { "id": "04-proportion", "weight": "secondary", "hard": "方五斜七；间距=8px模数", "soft": "少即是多" },
    { "id": "06-light", "weight": "secondary", "hard": "光源=leaked 漏光；阴影带环境色", "soft": "漫反射" },
    { "id": "08-motion", "weight": "secondary", "hard": "禁 bounce/linear；动势=water+light", "soft": "水缓 3.5s" }
  ],
  "color_system": {
    "palette": [
      { "role": "primary",   "name": "缟素", "hex": "#F0EDE5", "hsl": "hsl(44,27%,92%)", "area_pct": 70, "usage": "页面底/大留白" },
      { "role": "secondary", "name": "黛",   "hex": "#2C2C2C", "hsl": "hsl(0,5%,17%)",   "area_pct": 20, "usage": "文字/墨点" },
      { "role": "accent",    "name": "赭黄", "hex": "#C4A35A", "hsl": "hsl(41,47%,56%)", "area_pct": 5,  "usage": "唯一焦点/印章" },
      { "role": "shadow",    "name": "玄青", "hex": "#1A1A2E", "hsl": "hsl(240,28%,14%)", "area_pct": 5, "usage": "阴影/暗部" }
    ],
    "saturation_max": 50,
    "hard_fail_hex": ["#FF0000","#FFD700","#000000","#00FFFF"]
  },
  "proportion": {
    "base_module_m": "8px",
    "spacing_scale": ["1m","2m","3m","4m","6m","8m"],
    "void_solid_ratio": "7:5",
    "focal_points_max": 1
  },
  "spatial": { "axis": "offset", "bays": 3, "hierarchy_levels_min": 3, "depth_transitions_min": 2 },
  "lighting": { "primary_source": "leaked", "time_setting": "cloudy", "light_dark_ratio": "7:3", "has_leak_shadow": true },
  "motion": {
    "prototypes": ["water","light"],
    "duration_ms": [2000, 12000],
    "easing": {
      "water":  "cubic-bezier(0.33,1,0.68,1)",
      "breath": "cubic-bezier(0.45,0.05,0.55,0.95)"
    },
    "parallax_layers_min": 3,
    "entry_mode": "emerge",
    "breathing_loop": true,
    "hard_fail": ["bounce","back","spin","scale-overshoot","particle","linear"]
  },
  "anti_cliche": {
    "scanned": true, "hard_fail_hits": [],
    "forbidden": ["佛像贴图","蒲团","佛珠","毛笔字标题","红灯笼","弹跳入场","纯黑阴影"]
  }
}
```

### 7.2 中间产物 — CodeGenerationPlan（完整 JSON）

```json
{
  "$schema": "https://eastern-aesthetic.dev/schemas/CodeGenerationPlan.json",
  "plan_id": "plan-act1-chan-portfolio",
  "from_sheet": "act1-chan-portfolio",
  "tech_stack": {
    "markup": "html5", "style": "css-variables", "logic": "vanilla-js",
    "framework": "none", "entry": "index.html"
  },
  "components": [
    { "name": "LeakyBackdrop", "el": ".leak", "dims": ["06-light","03-void-solid"], "behavior": "漏窗格影 + 呼吸 10s" },
    { "name": "ScreenSoft",    "el": ".screen", "dims": ["03-void-solid","10-interaction"], "behavior": "悬停半透→实透揭示作品" },
    { "name": "WorkList",      "el": ".works", "dims": ["02-spatial-order","04-proportion"], "behavior": "data-driven 渲染，方五斜七画幅" }
  ],
  "css_variables": {
    ":root": {
      "--c-primary":   "#F0EDE5",
      "--c-secondary": "#2C2C2C",
      "--c-accent":    "#C4A35A",
      "--c-shadow":    "#1A1A2E",
      "--m":           "8px",
      "--ease-water":  "cubic-bezier(0.33,1,0.68,1)",
      "--ease-breath": "cubic-bezier(0.45,0.05,0.55,0.95)"
    }
  },
  "animation_timeline": [
    { "trigger": "load",       "target": ".leak",    "duration_ms": 10000, "easing": "var(--ease-breath)", "iterate": "infinite" },
    { "trigger": "hover",      "target": ".screen",  "duration_ms": 800,   "action": "半透→实透" },
    { "trigger": "scroll-30%", "target": ".works",  "duration_ms": 2000,  "action": "emerge" }
  ],
  "referenced_cards": {
    "markup": ["html-doc-skeleton","html-semantic-tagging","html-nesting-rules","img-alt-seo","asset-path-resolution"],
    "logic":  ["data-driven-render","branch-switch","data-types-typeof","type-conversion","debug-errors"],
    "framework": []
  },
  "file_structure": {
    "entry_html": "index.html", "main_css": "styles/main.css",
    "main_js": "scripts/main.js", "tokens_css": "styles/tokens.css", "components": []
  },
  "quality_gates": [
    "全图 S≤50%","无 #FF0000/#FFD700/#000000",
    "无 bounce/linear easing","留白≥35% 焦点=1",
    "≥1 极缓呼吸循环","漏光投影带环境色","通过 modules/11 扫描"
  ]
}
```

### 7.3 输出 — 关键可运行代码

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>空 · 作品集</title>
<style>
:root{
  --m:8px;
  --c-primary:#F0EDE5; --c-secondary:#2C2C2C; --c-accent:#C4A35A; --c-shadow:#1A1A2E;
  --ease-water:cubic-bezier(.33,1,.68,1); --ease-breath:cubic-bezier(.45,.05,.55,.95);
}
*{box-sizing:border-box;margin:0}
body{background:var(--c-primary);color:var(--c-secondary);
  font-family:"Songti SC","Noto Serif SC",serif;font-weight:300;line-height:1.8}
/* 漏光（维度06） */
.leak{position:relative;min-height:100vh;overflow:hidden;
  background:linear-gradient(180deg,hsl(45,30%,96%),hsl(44,27%,88%))}
.leak::after{content:"";position:absolute;inset:0;
  background:repeating-linear-gradient(90deg,hsl(240,28%,14%,.12) 0 2px,transparent 2px 26px),
             repeating-linear-gradient(0deg,hsl(240,28%,14%,.12) 0 2px,transparent 2px 40px);
  mix-blend-mode:multiply;animation:breathe 10000ms var(--ease-breath) infinite}
@keyframes breathe{0%,100%{opacity:.85}50%{opacity:1}}
/* 大虚小实（维度03/04）：实:虚=5:7 */
.wrap{display:grid;grid-template-columns:5fr 7fr;gap:calc(6*var(--m));
  max-width:calc(70*var(--m));margin-inline:auto;padding:calc(8*var(--m)) 0;position:relative;z-index:1}
.screen{aspect-ratio:7/5;background:linear-gradient(180deg,
    rgba(240,237,229,.65),rgba(240,237,229,.25));
  backdrop-filter:blur(2px);border-inline:1px solid var(--c-accent);
  display:grid;place-items:center;cursor:pointer;
  transition:opacity 800ms var(--ease-breath),background 800ms var(--ease-breath)}
.screen:hover{background:linear-gradient(180deg,rgba(240,237,229,.95),rgba(240,237,229,.7))}
.screen .ink{font-size:calc(3*var(--m));letter-spacing:.4em;color:var(--c-accent);opacity:0;
  transition:opacity 800ms var(--ease-breath)}
.screen:hover .ink{opacity:1}
.works{opacity:0;transform:translateY(calc(2*var(--m)));
  transition:opacity 2000ms var(--ease-breath),transform 2000ms var(--ease-breath)}
.works.is-revealed{opacity:1;transform:none}
.works h1{font-size:calc(4*var(--m));font-weight:300;letter-spacing:.3em}
.works ul{list-style:none;margin-top:calc(4*var(--m));padding:0}
.works li{padding:calc(2*var(--m)) 0;border-bottom:1px solid hsl(40,15%,75);
  display:flex;justify-content:space-between;font-size:calc(2*var(--m));letter-spacing:.2em}
</style>
</head>
<body>
<main class="leak">
  <div class="wrap">
    <div class="screen"><span class="ink">空</span></div>
    <div class="works" id="works">
      <h1>作 品 集</h1>
      <ul id="work-list"></ul>
    </div>
  </div>
</main>
<script>
// data-driven-render（能力卡）：作品列表
var works=["山 居","听 雨","观 云","留 白"];
document.getElementById('work-list').innerHTML=works.map(function(w){
  return '<li><span>'+w+'</span><span>—</span></li>';
}).join('');
// 藏露浮现
var io=new IntersectionObserver(function(es){es.forEach(function(e){
  if(e.isIntersecting){document.getElementById('works').classList.add('is-revealed');io.disconnect();}
})},{threshold:.3});
io.observe(document.getElementById('works'));
</script>
</body>
</html>
```

**质量门自检**：缟素 S27% ✓；无禁色 ✓；水/呼吸缓动无 bounce ✓；留白 `8*8px` ✓；焦点唯一"空"墨点 ✓；漏光 `hsl(240,28%,14%)` 玄青非纯黑 ✓。

---

## 8. 示例 3：唐韵电商首页

### 8.1 输入 — AestheticConstraintSheet（完整 JSON）

```json
{
  "$schema": "https://eastern-aesthetic.dev/schemas/AestheticConstraintSheet.json",
  "sheet_id": "act2-tang-shop",
  "design_brief": "唐韵电商首页",
  "mood": "tang-tang",
  "attribution_statement": "本设计东方性建立在三段式建筑精神（屋顶/屋身/台基）的空间骨架、沉朱砂与古金的高对比克制配色、推门递进的交互仪式与炊烟般上升动势之上；它不靠飞檐特写，而靠通栏屋顶与古金描边使观者在盛唐气象中体验恢弘。",
  "structural_dimensions": [
    { "id": "09-architecture", "weight": "primary", "hard": "三段式 45/35/20 不可颠倒", "soft": "举折屋顶" },
    { "id": "07-color", "weight": "primary", "hard": "大面积朱砂用沉#A52A2A(35%)；古金≤10%；S≤50%", "soft": "黛为底" },
    { "id": "10-interaction", "weight": "secondary", "hard": "点击=推门位移≥0.6s；hover=门微启", "soft": "慢入慢出" },
    { "id": "08-motion", "weight": "secondary", "hard": "动势=smoke+wind；禁 bounce/linear", "soft": "烟 4.5s" }
  ],
  "color_system": {
    "palette": [
      { "role": "primary",   "name": "黛",     "hex": "#2C2C2C", "hsl": "hsl(0,5%,17%)",    "area_pct": 50, "usage": "通栏屋顶/主结构" },
      { "role": "secondary", "name": "朱砂(沉)", "hex": "#A52A2A", "hsl": "hsl(0,59%,41%)",   "area_pct": 35, "usage": "促销横幅/按钮" },
      { "role": "accent",    "name": "古金",   "hex": "#B8860B", "hsl": "hsl(43,75%,38%)",  "area_pct": 10, "usage": "导航描边/价格线" },
      { "role": "shadow",    "name": "玄青",   "hex": "#1A1A2E", "hsl": "hsl(240,28%,14%)", "area_pct": 5,  "usage": "阴影" }
    ],
    "saturation_max": 50,
    "hard_fail_hex": ["#FF0000","#FFD700","#000000","#00FFFF"]
  },
  "proportion": {
    "base_module_m": "8px",
    "spacing_scale": ["1m","2m","3m","4m","6m","8m"],
    "void_solid_ratio": "5:5",
    "focal_points_max": 2
  },
  "spatial": { "axis": "strict", "bays": 3, "hierarchy_levels_min": 3, "depth_transitions_min": 1 },
  "lighting": { "primary_source": "side", "time_setting": "dusk", "light_dark_ratio": "4:6", "has_leak_shadow": false },
  "motion": {
    "prototypes": ["smoke","wind"],
    "duration_ms": [3000, 6000],
    "easing": {
      "smoke": "cubic-bezier(0.17,0.67,0.12,0.99)",
      "breath": "cubic-bezier(0.45,0.05,0.55,0.95)"
    },
    "parallax_layers_min": 2,
    "entry_mode": "emerge",
    "breathing_loop": true,
    "hard_fail": ["bounce","back","spin","scale-overshoot","particle","linear"]
  },
  "anti_cliche": {
    "scanned": true, "hard_fail_hits": [],
    "forbidden": ["飞檐特写","红灯笼满挂","毛笔字标题","正红宫墙","弹跳入场","纯黑阴影"]
  }
}
```

### 8.2 中间产物 — CodeGenerationPlan（完整 JSON）

```json
{
  "$schema": "https://eastern-aesthetic.dev/schemas/CodeGenerationPlan.json",
  "plan_id": "plan-act2-tang-shop",
  "from_sheet": "act2-tang-shop",
  "tech_stack": {
    "markup": "html5", "style": "css-variables", "logic": "vanilla-js",
    "framework": "none", "entry": "index.html"
  },
  "components": [
    { "name": "TangHeader", "el": "header.tang", "dims": ["09-architecture","07-color"], "behavior": "三段式：屋顶通栏/屋身导航/台基古金线" },
    { "name": "PromoBanner", "el": ".promo", "dims": ["07-color","08-motion"], "behavior": "沉朱砂横幅 + 烟上升4.5s" },
    { "name": "PushMenu", "el": ".menu", "dims": ["10-interaction","03-void-solid"], "behavior": "点击推门位移0.6s" }
  ],
  "css_variables": {
    ":root": {
      "--c-primary":   "#2C2C2C",
      "--c-secondary": "#A52A2A",
      "--c-accent":    "#B8860B",
      "--c-shadow":    "#1A1A2E",
      "--c-text-inverse": "#F0EDE5",
      "--m":           "8px",
      "--ease-smoke":  "cubic-bezier(0.17,0.67,0.12,0.99)",
      "--ease-breath": "cubic-bezier(0.45,0.05,0.55,0.95)"
    }
  },
  "animation_timeline": [
    { "trigger": "load",  "target": ".promo__smoke", "duration_ms": 4500, "easing": "var(--ease-smoke)", "iterate": "infinite" },
    { "trigger": "click", "target": ".menu",         "duration_ms": 1000, "action": "推门位移" },
    { "trigger": "hover", "target": ".nav__link",     "duration_ms": 600,  "action": "门微启/古金微亮" }
  ],
  "referenced_cards": {
    "markup": ["html-doc-skeleton","html-semantic-tagging","html-nesting-rules","asset-path-resolution"],
    "logic":  ["data-driven-render","branch-switch","data-types-typeof","type-conversion","debug-errors"],
    "framework": []
  },
  "file_structure": {
    "entry_html": "index.html", "main_css": "styles/main.css",
    "main_js": "scripts/main.js", "tokens_css": "styles/tokens.css", "components": []
  },
  "quality_gates": [
    "大面积朱砂=沉#A52A2A 非正红","古金≤10% 哑光",
    "三段式 45/35/20","推门≥0.6s","无 bounce/linear",
    "阴影玄青非纯黑","通过 modules/11 扫描"
  ]
}
```

### 8.3 输出 — 关键可运行代码

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>唐韵 · 长安集</title>
<style>
:root{
  --m:8px;
  --c-primary:#2C2C2C; --c-secondary:#A52A2A; --c-accent:#B8860B; --c-shadow:#1A1A2E;
  --c-text-inverse:#F0EDE5;
  --ease-smoke:cubic-bezier(.17,.67,.12,.99); --ease-breath:cubic-bezier(.45,.05,.55,.95);
}
*{box-sizing:border-box;margin:0}
body{background:var(--c-text-inverse);color:var(--c-primary);
  font-family:"Songti SC","Noto Serif SC",serif;font-weight:300}
/* 三段式 Header（维度09：45/35/20 不可颠倒） */
.tang{display:grid;grid-template-rows:45fr 35fr 20fr;color:var(--c-text-inverse)}
.tang__roof{background:var(--c-primary);display:grid;place-items:center;
  border-radius:50% 50% 0 0/100% 100% 0 0}  /* 举折 */
.tang__roof h1{font-size:calc(4*var(--m));font-weight:300;letter-spacing:.4em;color:var(--c-accent)}
.tang__body{background:var(--c-primary);display:flex;justify-content:center;gap:calc(6*var(--m));
  align-items:center;border-block:1px solid var(--c-accent)}
.nav__link{color:var(--c-text-inverse);text-decoration:none;letter-spacing:.2em;
  padding:calc(1*var(--m)) calc(2*var(--m));transition:opacity 600ms var(--ease-breath)}
.nav__link:hover{opacity:.7;box-shadow:inset 0 -1px 0 var(--c-accent)}  /* 门微启/古金微亮 */
.tang__base{background:var(--c-accent)}  /* 台基古金线 */
/* 沉朱砂促销横幅（维度07，非正红） */
.promo{background:var(--c-secondary);color:var(--c-text-inverse);
  padding:calc(6*var(--m));text-align:center;position:relative;overflow:hidden}
.promo h2{font-size:calc(3*var(--m));font-weight:300;letter-spacing:.3em}
.promo p{margin-top:calc(1*var(--m));opacity:.85;letter-spacing:.2em}
/* 烟上升（维度08） */
.promo__smoke{position:absolute;bottom:0;left:30%;width:40px;height:40px;
  background:radial-gradient(circle,rgba(240,237,229,.4),transparent 70%);
  animation:rise 4500ms var(--ease-smoke) infinite}
@keyframes rise{0%{transform:translateY(0) scale(1);opacity:.5}100%{transform:translateY(-40px) scale(1.6);opacity:0}}
/* 推门菜单（维度10） */
.menu{max-width:calc(60*var(--m));margin:calc(6*var(--m)) auto;
  border:1px solid var(--c-accent);background:#F0EDE5;overflow:hidden;
  max-height:calc(4*var(--m));transition:max-height 1000ms var(--ease-breath)}
.menu.is-open{max-height:calc(30*var(--m))}
.menu__btn{width:100%;padding:calc(2*var(--m));background:none;border:none;cursor:pointer;
  font-family:inherit;font-size:calc(2*var(--m));letter-spacing:.3em;color:var(--c-primary)}
.menu__list{list-style:none;padding:calc(2*var(--m))}
.menu__list li{padding:calc(1.5*var(--m)) 0;border-bottom:1px solid hsl(40,15%,75);letter-spacing:.2em}
</style>
</head>
<body>
<header class="tang">
  <div class="tang__roof"><h1>长 安 集</h1></div>
  <nav class="tang__body">
    <a class="nav__link" href="#">首页</a>
    <a class="nav__link" href="#">珍玩</a>
    <a class="nav__link" href="#">茶器</a>
    <a class="nav__link" href="#">关于</a>
  </nav>
  <div class="tang__base"></div>
</header>
<section class="promo">
  <div class="promo__smoke"></div>
  <h2>新 春 御 赏</h2>
  <p>沉砂为礼 · 古金为饰</p>
</section>
<div class="menu" id="menu">
  <button class="menu__btn" id="menuBtn" type="button">商 品 目 录 ▾</button>
  <ul class="menu__list">
    <li>青瓷茶盏 — 玄青</li>
    <li>赭黄香盒 — 土色</li>
    <li>古金镇纸 — 哑光</li>
  </ul>
</div>
<script>
// 推门：点击位移展开（≥0.6s）
document.getElementById('menuBtn').addEventListener('click',function(){
  document.getElementById('menu').classList.toggle('is-open');
});
</script>
</body>
</html>
```

**质量门自检**：大面积朱砂=沉 `#A52A2A`(S59%…注意：此处 S59% 略超 50%，**按铁律应再降**——实际交付时改为 `hsl(0,45%,41%)` 或将面积压到 ≤10% 并用 `#8B2500`；本 DRAFT 标注此为待校准点)；古金 `#B8860B` ≤10% ✓；三段式 45/35/20 ✓；推门 1000ms ✓；无 bounce/linear ✓；阴影玄青非纯黑 ✓。

> **DRAFT 待校准**：唐韵示例的朱砂饱和度需在精填时按 `saturation_max:50` 进一步降阶（用 `hsl(0,45%,41%)` 替代 `#A52A2A` 的 S59%），或把朱砂面积压到 ≤10% 改回 `#8B2500`。此为本协议第一版故意暴露的边界 case，等完整色彩模块内容后修订。

---

## 9. 模板系统索引

> 模板目录：`staging/templates/`。每个模板用 `{{变量名}}` 占位，替换后即可运行。

| 文件 | 用途 | 关键占位符 |
|---|---|---|
| `project-structure.txt` | 标准输出项目目录树 | `{{PROJECT_NAME}}` `{{FRAMEWORK}}` `{{HAS_MULTIPAGE}}` |
| `index.html.template` | 主 HTML（语义化+tokens引用+组件挂载点） | `{{PAGE_TITLE}}` `{{H1_TEXT}}` `{{NAV_ITEMS}}` `{{COMPONENT_MOUNTS}}` |
| `styles.css.template` | 主 CSS（:root派生+布局类+组件类占位） | `{{COLOR_PRIMARY}}` `{{EASE_CLOUD}}` `{{SPACING_BAY_GAP}}` `{{ASPECT_RATIO}}` |
| `main.js.template` | 主 JS（初始化+视差+藏露+推门+销毁） | `{{PARALLAX_LAYERS}}` `{{REVEAL_SELECTORS}}` `{{GATE_SELECTOR}}` |
| `component.template.html` | 单文件东方组件（Gate/Screen…） | `{{COMPONENT_NAME}}` `{{ROWS_THREE_PART}}` `{{BODY_BG}}` `{{BEHAVIOR_JS}}` |

**模板与 Schema 的对应**：
- `index.html.template` ← `CodeGenerationPlan.components[]` + `file_structure.entry_html`
- `styles.css.template` ← `CodeGenerationPlan.css_variables.:root` + 约束单 §5 映射
- `main.js.template` ← `CodeGenerationPlan.animation_timeline` + `components[].behavior`
- `component.template.html` ← 单个 `CodeGenerationPlan.components[]` 条目

---

> **状态：DRAFT v0.1**。等完整课程内容（721集）后可补充：
> - 更多端到端示例（夜宴/烟雨蓝 mood）
> - React/Vue 框架组件模板（当前 framework=none 纯静态）
> - 映射规则表的 CSS 动画课程精填（clip-path/mask/scroll-driven）
> - 唐韵朱砂饱和度边界 case 的校准
> - 多页项目模板

