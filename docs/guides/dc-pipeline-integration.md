# 与 DC PipelineRunner 集成

> 本文说明 CAS（本仓库）如何把约束单喂进 Design Compiler（DC）的真实 G1→G2→G3 流水线。

## 1. 两种集成路径

| 路径 | 入口 | 适用 |
|------|------|------|
| CAS 侧契约 A | `sheetToCangjie(sheet, opts)` | 在本仓库内产出 Cangjie IR + advisorRulePack |
| DC 侧端到端 | DC `AestheticPipelineRunner().execute(sheet, hostCaps, opts)` | 直接拿到 G1→G3 全链路结果（推荐生产） |

两者转换逻辑**独立移植**、结果对齐；DC 侧不 import CAS 代码。

## 2. 数据流

```
CAS sheet ──► [DC] sheetToCangjieIR  ──► CangjieRawDesignIR
                     │
                     ▼
              normalizeIntent  ──► Core RawDesignIR
                     │
                     ▼
              PipelineRunner.execute
                ├─ G1 DataGate (confidence<0.6 / requiredPaths)
                ├─ G2 PatchEngine (42 rules, RFC6902)
                └─ G3 CapNeg (TIER_A/B/C)
                     │
                     ▼
              RuntimeExecutionPlan + hashChain
                     │
                     ▼
        [CAS] planToDom ──► DomComponentPlan
```

## 3. 关键差异（必须知道）

| 项 | CAS 侧 | DC 侧 |
|----|--------|-------|
| 参数 path | 带 `/value` 后缀 | 不带（pointer-map 寻址） |
| paramId | 无 | 自动 `aes-001` 递增 |
| confidence override key | `/color/dominant/value` | `/color/dominant` |
| 美学分 | 进 provenance.aestheticScore | 进 metadata.aestheticScore |

DC adapter 负责剥离 `/value` 后缀并补全 paramId/source/calibration。

## 4. 在 DC 侧运行

```ts
import { AestheticPipelineRunner } from "./aesthetic-integration";

const runner = new AestheticPipelineRunner(); // 自动加载 config/*.json
const result = runner.execute(sheet, { webgl2: true, floatTextures: true }, {
  capturedAt: "2026-09-27T00:00:00Z",
  testCaseId: "AES-shuyuan",
});

if (result.pipeline.status === "SUCCESS") {
  // result.pipeline.executionPlan → 回 CAS 做契约 B
}
```

## 5. 把 DC 结果接回 CAS（契约 B/C）

拿到 `executionPlan` 与 G2 后参数后：

```ts
import { planToDom, generateFidelityReport } from ".../runtime";

const dom = planToDom({
  plan: result.pipeline.executionPlan,
  validatedParams: result.pipeline.validatedIR, // 取已验证参数
  testCaseId: "AES-shuyuan",
});

// 渲染后回评
const report = generateFidelityReport({
  sheet, code: { css, plan: dom },
  links: {
    testCaseId: "AES-shuyuan",
    inputHash: result.pipeline.hashChain.inputHash,
    validatedIRHash: result.pipeline.hashChain.validatedIRHash,
    executionPlanHash: result.pipeline.hashChain.executionPlanHash,
  },
});
```

## 6. 边界铁律

- **不改 compiler-core/、不改 schemas/**：美学接入全部在 `aesthetic-integration/` 内；
- **美学分不进 confidence**：`aestheticScore` 只作 metadata；
- **sidecar reportHash 不进 FROZEN 5 元 hashChain**：评估报告是旁挂文档；
- **时间戳调用方传入**：`capturedAt` 必传，保证哈希恒等。

## 7. 常见终止态

| haltStage | 原因 | 处理 |
|-----------|------|------|
| G1_DATA_GATE | required path 缺/置信度<0.6 | 补全 sheet 或用 confidenceOverrides 定位 |
| G3_CAPABILITY_NEGOTIATOR | 宿主能力不足 | 补 hostCaps（webgl2/floatTextures）或接受降级 TIER_C |
