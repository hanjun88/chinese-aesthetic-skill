# 中式美学引擎 · 打磨报告（Polish Report）

- **分支**：`feat/frontend-playbook-v2`
- **打磨日期**：2026-09-26
- **范围**：实现层（`components/`、`modules/frontend/`、`tools/`、`templates/`、文档）
- **约束遵守**：11 个原美学模块（`modules/01..11-*.md`）零改动；未删除任何现有文件。

---

## 一、结论

6 个 HTML 组件此前**无法在浏览器中正确渲染**（令牌路径全部 404），反俗套 lint 工具**启动即崩溃**。上述 P0 问题已全部修复并验证：6 个组件结构完整、内联 JS 语法正确、令牌变量全部解析；lint 工具可执行且输出与文档一致；引擎与 gate 测试全部回归通过。

---

## 二、问题清单与修复状态

### P0 — 阻断运行（Critical）

| # | 问题 | 文件 | 影响 | 修复状态 |
|---|---|---|---|---|
| 1 | `@import url('../frontend-modules/tokens.css')` 路径错误，实际目录为 `modules/frontend/` | 6 个组件 `.html` | 所有 CSS 变量（颜色/间距/动效/阴影）解析失败，组件退化为无样式裸 HTML | ✅ 已改为 `../modules/frontend/tokens.css` |
| 2 | lint 工具用 CommonJS `require()`，但 `package.json` 为 `"type":"module"` | `tools/anti-cliche-lint.js` | 启动即抛 `require is not defined`，工具完全不可用 | ✅ 改为 ESM `import fs/path from 'node:*'` |
| 3 | `grid-template-areas` 中 `c` 区域为 L 形（非矩形） | `components/curio-shelf.html` | CSS Grid 规定命名区域必须为矩形；非法声明被整体丢弃，博古架格子错乱 | ✅ 重排为全矩形（末行末列留 `.` 虚位） |

### P1 — 功能一致性 / 可维护性

| # | 问题 | 文件 | 修复状态 |
|---|---|---|---|
| 4 | 类名前缀不一致：注释约定 `pl-`，但 section 类写成 `ll-section` | `components/plaque.html` | ✅ 统一为 `pl-section`（CSS 3 处 + HTML 1 处） |
| 5 | 模板销毁逻辑错误：`removeEventListener('load', arguments.callee)` 移除的是 pagehide 回调本身（错对象），且 `arguments.callee` 在严格模式禁用；示例 `querySelector('__btn')` 选择器非法 | `templates/component.template.html` | ✅ 命名 `onLoad` 函数并正确摘除；示例改为 `.{{COMPONENT_CLASS}}__btn` |
| 6 | 文档沿用旧目录名 `frontend-modules/` | `components/README.md`(4处)、`docs/code-generation-protocol.md`、`templates/project-structure.txt` | ✅ 全部更正为 `modules/frontend/` |

### 已核查、无需改动（验证通过）

- **tokens.css**：102 个变量齐备（五色正色 5 档 / 语义色 / 8px 模数间距 9 级 / 字号 7 级 / 5 条东方缓动 / 7 档时长 / 5 套阴影 / 4 级圆角 / √2 比例常数）。组件引用的变量全部有定义；仅模板自包含内联的 `--c-*` 属预期。
- **poc-fixed.css 仍报 6 处 HARD FAIL**：经核对 `J-anti-cliche-code-review.md` §4.2，这是文档**明确记录的选择器命名误报**（`.palace-scene`/`.particle-container` 等旧类名与注释），非缺陷，保持原状。
- **src/ TypeScript**：为 Vite Studio 工程，无 `node_modules` 不构建；不在纯静态组件范围内，未改动。
- **11 个原美学模块**：按约束保持不变。

---

## 三、修复后验证结果

| 验证项 | 结果 |
|---|---|
| 6 个组件 `@import` 解析到真实文件 | ✅ 6/6 OK |
| 6 个组件 HTML 标签配对（doctype/html/body/style） | ✅ 全部平衡 |
| 6 个组件内联 JS `node --check` | ✅ 全部通过（curio-shelf 无脚本，纯 CSS hover，符合设计） |
| 博古架 grid 区域全部为矩形 | ✅ a–h 8 区全部 RECT OK |
| 组件引用变量 ⊆ tokens.css 定义 | ✅ 0 个未定义变量 |
| `anti-cliche-lint.js` 运行 | ✅ ugly POC：62 命中 / 44 HARD FAIL / 41 规则，退出码 1；缺失文件退出码 2；`--json` 正常 |
| 引擎测试 `node tests/engines.test.js` | ✅ 112 passed, 0 failed |
| Gate 测试 gate1/2/3 | ✅ 23 / 71 / 22 断言全过 |
| `scripts/validate.cjs` | ✅ overall pass, score 100 |

---

## 四、改动文件清单（11 个）

```
components/moon-gate.html            # 修令牌路径
components/scroll-panel.html          # 修令牌路径
components/folding-screen.html       # 修令牌路径
components/lattice-window.html       # 修令牌路径
components/plaque.html               # 修令牌路径 + ll-section→pl-section
components/curio-shelf.html          # 修令牌路径 + 修非法 L 形网格
components/README.md                 # 更正令牌路径文档
tools/anti-cliche-lint.js            # CommonJS→ESM，恢复可执行
templates/component.template.html    # 修销毁逻辑 + 修示例选择器
templates/project-structure.txt      # 更正令牌路径文档
docs/code-generation-protocol.md     # 更正旧目录名
```

---

## 五、遗留建议（非阻断，未改动）

- `anti-cliche-lint` 的 R-MOTION-004（`rotate`/`spin`）会对月洞门 `rotateY(±115°)`、屏风 `rotateY(±38°)` 报 HARD FAIL——这是组件**有意的推门/折屏运动**，属规则启发式误报。后续可把规则收窄为"入场关键帧中的 rotate"而非"任意 rotateY"，但需改规则语义，本次按"直接修复可见 bug、不改设计意图"原则保留。
- `modules/frontend/*.md` 仍标注 DRAFT v0.1（等待 721 集课程精填），属路线图状态，非缺陷。
