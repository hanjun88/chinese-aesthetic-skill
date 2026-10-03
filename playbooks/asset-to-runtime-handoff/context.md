# Context: 中式美学资产到 Runtime 的交接

## 背景

chinese-aesthetic-skill 负责设计规范、资产意图和审美验收，design-compiler 负责场景编译、资产处理和运行时交付验证。两个仓库必须保持职责隔离，不得通过复制代码制造隐式耦合。本 Playbook 建立标准化的跨仓库资产交接流程：交接前完成资产 QA，并确认两个仓库之间唯一的机器契约（AestheticConstraintSheet）钉扎一致。

## 仓库职责边界

```
chinese-aesthetic-skill                    design-compiler
┌─────────────────────────┐               ┌─────────────────────────┐
│ 设计规范                 │               │ 场景编译                 │
│ 资产意图                 │   资产交接    │ 资产处理                 │
│ 审美验收                 │ ────────────> │ 运行时交付验证            │
│ 规则登记簿与约束表       │   约束表      │ SceneCompilationIR(内部) │
│ CA-PB-001~003           │ ────────────> │ DC-PB-001~004           │
└─────────────────────────┘               └─────────────────────────┘
         ↑                                          │
         │               反馈/兼容性问题              │
         └──────────────────────────────────────────┘
```

### chinese-aesthetic-skill 负责

- 设计规范和美学约束
- 资产意图和视觉目标
- 审美验收（CA-PB-001~003）
- 资产命名和组织规范

### design-compiler 负责

- AestheticConstraintSheet 的 schema 与校验（`contracts/aesthetic-constraint-sheet/`）
- 场景编译（内部中间表示 SceneCompilationIR，仅编译器内部使用，不是与本仓库的契约）
- 资产处理（格式转换、深度估计、遮罩生成）
- 运行时交付验证（DC-PB-001~004）
- 运行时兼容性（WebGL2/WebGL1/Static 降级）

### 禁止

- 不得将两个仓库的职责混写
- 不得通过复制代码制造隐式耦合
- 不得在 chinese-aesthetic-skill 中实现编译逻辑
- 不得在 design-compiler 中定义美学规范

## 契约边界

| 方向 | 契约 | schema 所有者 | 在本仓库的体现 |
|---|---|---|---|
| chinese-aesthetic-skill → design-compiler | AestheticConstraintSheet | design-compiler（`contracts/aesthetic-constraint-sheet/`） | `contract/dc-contract.pin.json` 钉扎版本与哈希；`node scripts/emit-sheet.mjs` 生成；不保留 schema 或类型副本 |
| design-compiler 内部 | SceneCompilationIR | design-compiler | 无：本仓库不绑定、不复制、不校验编译器内部契约 |

美学约束只通过 AestheticConstraintSheet 交接。下面的资产文件（场景图、深度图、遮罩等）是本 Playbook 的 QA 对象，不是契约；scene.json / manifest.json 在编译器侧的输出格式由 design-compiler 持有，并由 DC-PB-001 验收。

## 资产包要求（本 Playbook 的 QA 对象）

| 资产类型 | 格式要求 | 命名规范 | 必需性 |
|---|---|---|---|
| 主场景图 | WebP/PNG | scene.webp | 必需 |
| 深度图 | 16-bit WebP/PNG | depth.webp | 必需 |
| 水面遮罩 | 8-bit WebP/PNG | water-mask.webp | 可选 |
| 法线贴图 | WebP/PNG | normal.webp | 可选 |
| 分层图 | WebP/PNG | layer-{name}.webp | 可选 |
| 资产包描述 | JSON | scene.json | 必需 |
| 资产清单 | JSON | manifest.json | 必需 |

## scene.json（资产包描述）要求

字段与检查项由本 Playbook 的 AC-5 定义，不对应任何编译器 schema：

- 必须包含 sceneId、资产清单、视差层级、深度范围
- 资产路径必须为相对路径，不含 `..` 或绝对路径
- 入口 ID 必须与运行时注册一致
- 不得包含运行时专有状态（交互状态、临时矩阵）

## 运行时兼容性

- WebGL2：完整功能（透视相机、深度缓冲、高级着色器）
- WebGL1：降级功能（简化着色器、有限视差）
- Static：静态降级（无动画、固定视角）
- Neutral：中性降级（无美学处理，仅显示原始资产）

## 约束

- 资产必须先通过 CA-PB-003 验收才能交接
- 交接前必须确认 AestheticConstraintSheet 的钉扎与 design-compiler 的契约锁一致
- 不得假设运行时能力，必须明确降级层级
- 交接后必须在 design-compiler 中执行完整编译验证
- 反馈循环：编译失败时必须返回 chinese-aesthetic-skill 修改，不得在 design-compiler 中静默修复

## 前置条件

1. 资产已通过 CA-PB-003（中式巨构场景资产验收）
2. AestheticConstraintSheet 钉扎有效（`contract/dc-contract.pin.json`），且 design-compiler 侧的契约锁可读取
3. 两个仓库的职责边界已确认
4. 运行时能力说明已获取
