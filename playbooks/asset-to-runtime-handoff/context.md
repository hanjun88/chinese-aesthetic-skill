# Context: 中式美学资产到 Runtime 的交接

## 背景

chinese-aesthetic-skill 负责设计规范、资产意图和审美验收，design-compiler 负责编译契约、资产处理和运行时交付验证。两个仓库必须保持职责隔离，不得通过复制代码制造隐式耦合。本 Playbook 建立标准化的跨仓库资产交接流程，确保设计资产能被 design-compiler 正确接收和编译。

## 仓库职责边界

```
chinese-aesthetic-skill                    design-compiler
┌─────────────────────────┐               ┌─────────────────────────┐
│ 设计规范                 │               │ 编译契约                 │
│ 资产意图                 │   资产交接    │ 资产处理                 │
│ 审美验收                 │ ────────────> │ 运行时交付验证            │
│ 色彩/材质/光照约束       │               │ scene.json 解析          │
│ CA-PB-001~003           │               │ DC-PB-001~004           │
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

- 编译契约（scene.json schema、manifest 格式）
- 资产处理（格式转换、深度估计、遮罩生成）
- 运行时交付验证（DC-PB-001~004）
- 运行时兼容性（WebGL2/WebGL1/Static 降级）

### 禁止

- 不得将两个仓库的职责混写
- 不得通过复制代码制造隐式耦合
- 不得在 chinese-aesthetic-skill 中实现编译逻辑
- 不得在 design-compiler 中定义美学规范

## 资产交接契约

| 资产类型 | 格式要求 | 命名规范 | 必需性 |
|---|---|---|---|
| 主场景图 | WebP/PNG | scene.webp | 必需 |
| 深度图 | 16-bit WebP/PNG | depth.webp | 必需 |
| 水面遮罩 | 8-bit WebP/PNG | water-mask.webp | 可选 |
| 法线贴图 | WebP/PNG | normal.webp | 可选 |
| 分层图 | WebP/PNG | layer-{name}.webp | 可选 |
| 场景配置 | JSON | scene.json | 必需 |
| 资产清单 | JSON | manifest.json | 必需 |

## scene.json 交接要求

- 必须符合 design-compiler 定义的 schema
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
- 交接前必须确认 design-compiler 编译契约版本
- 不得假设运行时能力，必须明确降级层级
- 交接后必须在 design-compiler 中执行完整编译验证
- 反馈循环：编译失败时必须返回 chinese-aesthetic-skill 修改，不得在 design-compiler 中静默修复

## 前置条件

1. 资产已通过 CA-PB-003（中式巨构场景资产验收）
2. design-compiler 编译契约（scene.json schema）已明确
3. 两个仓库的职责边界已确认
4. 运行时能力说明已获取
