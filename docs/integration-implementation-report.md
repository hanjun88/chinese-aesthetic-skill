# 三产品融合 P0 最小可运行原型 — 实现报告

> 实现日期：2026-09-26
> 依据：`docs/fusion-architecture.md` v1.0（§2 接口契约 / §3 六个接入点 / §4 双轨统一 / §5 P0 路线图）
> 分支：CAS `feat/frontend-playbook-v2` ｜ DC `feat/aesthetic-integration`

---

## 0. 一句话结果

**一句「设计一个中式书院入口页面」已经能端到端跑通：**
`用户需求 → lib/colorEngine → AestheticConstraintSheet → sheet-to-cangjie → CangjieRawDesignIR（19 参数 / 7 requiredPaths 全过 G1）→ 模拟 G1/G2/G3 → RuntimeExecutionPlan → plan-to-dom → 6 组件 DomComponentPlan → demo.html 渲染月洞门+匾额`。
**29/29 单元测试通过；连续两次跑 `run-demo.sh` 产出的 `rawIRHash / validatedIRHash / executionPlanHash` 完全一致（确定性）。**

---

## 1. 实现文件清单

### 1.1 CAS 仓库（`eastern-aesthetic-decision-engine/`，分支 `feat/frontend-playbook-v2`，全部新增/增量）

| 文件 | 功能 |
|---|---|
| `modules/frontend/runtime/types/dc-types.ts` | DC 形状的本地 type-only 镜像（CangjieRawDesignIR / CangjieEstimatedParameter / CangjieConstraint / RuntimeExecutionPlan / AdvisorGrammarRule）。不 import DC 源码，避免运行时耦合。 |
| `modules/frontend/runtime/types/aesthetic-sheet.ts` | `AestheticConstraintSheet` 结构化 TS 定义（fusion-arch §2.1）。 |
| `modules/frontend/runtime/types/cangjie.ts` | 契约 A 输出 `SheetToCangjieResult` + 选项（capturedAt 由调用方传入）。 |
| `modules/frontend/runtime/types/dom-component-plan.ts` | 契约 B 输出 `DomComponentPlan / DomComponentInstance / ResolvedMotion`。 |
| `modules/frontend/runtime/dimension-registry.ts` | **维度双轨 SSOT**：legacy 10 维 / v2 11 维 / DC 术语三向映射；导出 `getDimensionId / getLegacyId / getAllDimensions / DIMENSION_TO_TARGET`。 |
| `modules/frontend/runtime/severity-map.ts` | **severity 四级统一**：P0/P1 ↔ HARD/SOFT ↔ BLOCK/REPAIR/WARN/OK ↔ P0_CRITICAL/P1_WARNING/P2_INFO ↔ fatalBelow/hard/warning/preferred；导出 `mapSeverity / isBlocking`。 |
| `modules/frontend/runtime/sheet-to-cangjie.ts` | **接口契约 A**：sheet → CangjieRawDesignIR。13 条映射表 `PARAMETER_PATH_MAPPINGS`、7 条 `REQUIRED_PATHS` 硬校验（confidence≥0.85 && PRODUCTION）、P0→fatalBelow+threshold 约束、P1→hard 区间、advisorRulePack（CA-TABOO/CA-ADVISOR，ruleId ASCII 排序）、unmappedDimensions（motion/philosophy 转 runtime/sidecar）。 |
| `modules/frontend/runtime/plan-to-dom.ts` | **接口契约 B**：RuntimeExecutionPlan + validatedParams → DomComponentPlan。`resolveTokens()` 桥接 hex/ratio → tokens.css 语义槽；6 组件逐字段映射；缺参数抛 `MapperError`（不发明默认值）。 |
| `modules/frontend/runtime/index.ts` | 统一导出入口。 |
| `modules/frontend/runtime/__tests__/fixtures.ts` | 测试夹具（合法 sheet / validated params）。 |
| `modules/frontend/runtime/__tests__/dimension-registry.test.ts` | 维度映射测试（7 case）。 |
| `modules/frontend/runtime/__tests__/severity-map.test.ts` | severity 翻译与阻塞判断（6 case）。 |
| `modules/frontend/runtime/__tests__/sheet-to-cangjie.test.ts` | 13 映射 + 7 requiredPaths + P0/P1 range + 分数隔离 + 哈希恒等（10 case）。 |
| `modules/frontend/runtime/__tests__/plan-to-dom.test.ts` | 6 组件映射 + tokens 桥接 + renderer 降级 + MapperError（6 case）。 |
| `examples/fusion-demo/demo-input.json` | 示例需求「中式书院入口页面」。 |
| `examples/fusion-demo/generate-sheet.js` | 步骤 1：调 `lib/color-engine.js`（零改动）产出 AestheticConstraintSheet → `sheet.json`。 |
| `examples/fusion-demo/compile.js` | 步骤 2：契约 A 转换 + 模拟 G1 DataGate / G2 PatchEngine / G3 assemblePlan（含 plan-enricher 注入 motion/extensions/postprocessing），输出 `cangjie-ir.json / validated-params.json / execution-plan.json`。 |
| `examples/fusion-demo/render.js` | 步骤 3：契约 B 转换 → `dom-plan.json`。 |
| `examples/fusion-demo/demo.html` | 自包含演示页：链接 tokens.css，内嵌 DomComponentPlan，runtime-binder 写 :root 变量，渲染月洞门（黛青门框+呼吸光）+ 匾额（古金线+落地钤印），右侧流水线 trace（hash 链）。 |
| `examples/fusion-demo/run-demo.sh` | 一键跑通三步，打印每步中间结果。 |
| `package.json` | 增量脚本 `test:runtime` / `demo:fusion`（不改既有脚本）。 |

### 1.2 DC 仓库（`/tmp/design-compiler-inspect/`，分支 `feat/aesthetic-integration`，纯新增）

| 文件 | 功能 |
|---|---|
| `aesthetic-gate/aesthetic-advisor.ts` | G2 语法建议：`AestheticConstraintSheetDTO → GrammarRulePatch[]`（反俗套 op:test P0_CRITICAL；violations/借景 op:replace P1_WARNING；ruleId ASCII 排序；category 硬枚举四值）。 |
| `aesthetic-gate/aesthetic-diagnostics.ts` | G4* 软门禁：`evaluateSoftGate(params, ctx) → {diagnostics, fatalThresholdHits, hasAestheticConcern}`，**只写文案不阻断**，status 不变。 |
| `aesthetic-gate/index.ts` | 美学接入点统一导出。 |
| `index.ts`（根，新增） | re-export 美学接入 API；不修改任何既有公开 API。 |
| `schemas/aesthetic-constraint-sheet.schema.json` | 美学约束 Sheet 的 JSON Schema（独立版本 0.1.0；不动既有 5 份 FROZEN schema）。 |

---

## 2. 关键设计落地对照（fusion-arch §2/§4）

### 2.1 契约 A（sheet-to-cangjie）
- **13 条映射**全部在 `PARAMETER_PATH_MAPPINGS` 中登记（色彩 3 / 构图 3+焦点 1 / 光影 4 / 材质 4 / 相机 4，按架构表行计为 13 条规则）。
- **7 条 requiredPaths**：`/composition/focalPoint`、`/composition/negativeSpaceRatio`、`/camera/fov`、`/lighting/keyLight/azimuth`、`/lighting/keyLight/elevation`、`/color/dominant`、`/materials/0/baseType` —— 全部 `confidence≥0.85 && calibration.status=PRODUCTION`，缺一则抛 `code=BLOCKED_DATA`。
- **severity→range**：P0 → `range.fatalBelow` + `CangjieConstraint{type:threshold, condition:{operator:"not-in", value:hardFailHex}}`；P1 → `range.hard:[min,max]`。
- **分数隔离**：`aestheticScore` 只进 `provenance.aestheticScore` 与返回值 metadata，**单测断言**它从未写成任何参数 confidence。
- **哈希纪律**：`capturedAt` 由 `SheetToCangjieOptions` 显式传入，模块内零 `new Date()`；同输入两次序列化字节相等（单测锁定）。

### 2.2 契约 B（plan-to-dom）
- 6 组件（mg/sp/fs/lw/pl/cs）按架构表逐字段映射：门框色=secondary、卷轴 water 原型、屏风 opacity=roughness、花窗漏光=accent+三层视差 0.2/0.5/1.0、匾额 IO 阈值 0.4、博古架格距=负空间比。
- `resolveTokens()`：`color.dominant→--color-bg`、`secondary→--color-text`、`accent→--color-accent`、`negativeSpaceRatio→--space-*`、`colorTemp→--shadow-*` 三套、`roughness→opacity`；**不做运行时二次降饱和**。
- renderer 随 `negotiation.selectedTier` 降级：A→WebGL2 / B→WebGL1 / C→DOMCanvas。

### 2.3 双轨统一
- 维度：`light-shadow→light`、`time→temporal`、`taboo→anti-cliche`、`spatial→spatial-order`；v2 新增 `philosophy/architecture` 无 legacy 对应，`getLegacyId` 返回 null；motion/temporal→runtime、philosophy→sidecar。
- severity：`P0→BLOCK→P0_CRITICAL/fatalBelow/op:test`、`P1→REPAIR→P1_WARNING/hard/op:replace`。

---

## 3. 测试结果

```
$ npm run test:runtime
# tests 29
# pass 29
# fail 0
```

覆盖：
- dimension-registry：legacy 10 / v2 11 / DC 别名全覆盖、反向 legacy、落点归类、未知别名抛错。
- severity-map：P0/P1 双向翻译、isBlocking 判定、非法输入。
- sheet-to-cangjie：13 映射值正确、7 requiredPaths 置信度、P0→fatalBelow、P1→hard、分数隔离、advisor 规则排序与前缀、unmappedDimensions、确定性字节恒等。
- plan-to-dom：resolveTokens 7 条桥接、6 组件逐字段、renderer 降级、hash 链接、缺参抛 MapperError、drivenBy 溯源。

---

## 4. 原型运行输出（`./run-demo.sh` 实跑）

```
[1/3] 美学引擎 → AestheticConstraintSheet
  mood: song-elegant  palette: 月白=#EDEAE4 / 黛青=#2C3E50 / 哑金=#B8860B / 墨黛=#1A1A2E  score: 88

[2/3] 契约 A → CangjieRawDesignIR → 模拟 G1/G2/G3
  g1: PASS（7/7 requiredPaths）  g2PatchesApplied: []（本案例未触发补丁）
  unmappedDimensions: ["motion"]
  hashes:
    rawIRHash        = sha256:8e4ad3a28edf21cf68805cda
    validatedIRHash  = sha256:8e4ad3a28edf21cf68805cda
    executionPlanHash= sha256:e26e15df330645b2a4ef1edb

[3/3] 契约 B → RuntimeExecutionPlan → DomComponentPlan
  renderer: WebGL2Renderer
  rootCssVars: --color-bg=#EDEAE4 / --color-text=#2C3E50 / --color-accent=#B8860B / ...
  components: moon-gate(motion=light, open=false) → scroll-panel(water) → folding-screen → lattice-window → plaque(landed=false) → curio-shelf
```

连续两次运行 hash 完全一致（确定性验证通过）。`demo.html` 用上述 rootCssVars 把月洞门渲染为黛青圆形门洞、匾额为古金线「书院」，点击「推门」触发 light 呼吸光 + water 落匾动效。

---

## 5. 硬约束遵守自查

| 约束 | 状态 |
|---|---|
| 零改 DC master（所有 DC 改动在 feat/aesthetic-integration） | ✅ master 仅含初始 docs/ baseline，新增全部在 feature 分支 |
| 零改 CAS lib/（原 10 维引擎） | ✅ 仅 import 调用，未改任何 lib/*.js |
| 零破 FROZEN ABI / 不动 schemas 下既有 5 份 | ✅ DC schemas/ 仅新增 aesthetic-constraint-sheet.schema.json（该快照下 schemas/ 本不存在） |
| 零改 11 个原美学模块 modules/01..11 | ✅ 仅新增 modules/frontend/runtime/ 与 examples/ |
| 新代码 TypeScript + JSDoc | ✅ runtime/ 全部 .ts，每文件头部 JSDoc |
| 代码可实际运行、无占位符 | ✅ run-demo.sh 跑通、29 测试通过 |

---

## 6. 已知限制 / P1 待办

1. **DC 源码不在快照内**：`/tmp/design-compiler-inspect/` 仅含 `docs/integration-analysis-dc.md`，本实现按分析报告逐文件核对的类型形状做了 type-only 镜像；`compile.js` 里的 G1/G2/G3 是**本地内存模拟**，未真正 `import` DC 的 `normalizeIntent / patch-engine / capability-negotiator`。接真实 DC 时只需把 `compile.js` 的模拟段替换为 DC 既有入口，契约 A/B 形状不变。
2. **plan-enricher / rendered-feedback（契约 C）未实现**：P0 只做了接口 A/B + 双轨表；motion 注入目前内联在 `compile.js` 演示中，未抽成独立 `plan-enricher.ts`；sidecar 评估报告（AestheticEvaluationReport）留待 P1。
3. **G4 软门禁在 DC 侧已实现**（aesthetic-gate/aesthetic-diagnostics.ts），但 CAS 侧尚未在编译链路里调用它写 diagnostics；当前 demo 未挂接。
4. **组件 data-* 钩子**：demo.html 用独立 CSS 复刻了月洞门/匾额外观，未改动 `components/moon-gate.html` 等 6 个既有组件文件（P1 再给它们追加 `setState` 钩子）。
5. **时间戳/hash**：demo 用 Node `crypto.sha256` 截断 24 位展示；真实 DC 用 RFC8785 JCS，接真实流水线时替换哈希函数即可，不影响参数形状。
