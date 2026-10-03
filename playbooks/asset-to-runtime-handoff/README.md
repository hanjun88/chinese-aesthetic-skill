# CA-PB-002: 中式美学资产到 Runtime 的交接

## Purpose

验证设计资产在交接给 design-compiler 之前通过资产 QA（命名、技术规格、资产包描述与清单、运行时兼容），并确认两个仓库之间唯一的机器契约（AestheticConstraintSheet）的钉扎一致、职责边界清晰。建立标准化的跨仓库资产交接流程。

## Trigger

- 资产从 chinese-aesthetic-skill 交付到 design-compiler 时
- 运行时集成前
- 跨仓库交接时
- 资产格式或命名规范变更时

## Inputs

- 资产清单（来自 chinese-aesthetic-skill）
- 资产文件（图片、深度图、遮罩、配置）
- AestheticConstraintSheet 契约钉扎（`contract/dc-contract.pin.json`；schema 由 design-compiler 持有）与编译器侧的契约锁（`contracts/aesthetic-constraint-sheet/contract.lock.json`）
- 运行时能力说明（WebGL2/WebGL1/Static/Neutral 降级）

## Preconditions

- 资产已通过 CA-PB-003（中式巨构场景资产验收）
- 设计约束已通过 CA-PB-001（中式美学设计约束提取）
- AestheticConstraintSheet 钉扎有效（本仓库 `contract/dc-contract.pin.json` 存在）
- 两个仓库的职责边界已确认

## Success Criteria

| ID | 标准 | 对应 AC | 对应 Procedure Step |
|---|---|---|---|
| SC-1 | 审美验收和约束提取均已通过 | AC-1.1 ~ AC-1.2 | Step 1 |
| SC-2 | 交接契约（AestheticConstraintSheet）版本明确，钉扎与编译器的契约锁一致 | AC-2.1 ~ AC-2.2 | Step 2 |
| SC-3 | 资产清单完整，必需资产齐全，命名规范 | AC-3.1 ~ AC-3.3 | Step 3 |
| SC-4 | 技术规格符合（分辨率/格式/位深） | AC-4.1 ~ AC-4.4 | Step 4 |
| SC-5 | scene.json（资产包描述）字段完整，路径合规，无运行时专有状态 | AC-5.1 ~ AC-5.5 | Step 5 |
| SC-6 | manifest.json fileCount/SHA-256/byteSize/truthClass 全部正确 | AC-6.1 ~ AC-6.6 | Step 6 |
| SC-7 | 运行时兼容层级明确，降级策略完整 | AC-7.1 ~ AC-7.2 | Step 7 |
| SC-8 | 两仓库职责分离，无代码复制耦合 | AC-8.1 ~ AC-8.3 | Step 8 |
| SC-9 | 资产成功交接，交接清单和元数据已记录 | AC-9.1 ~ AC-9.4 | Step 9 |
| SC-10 | 编译验证可执行，交接资产完整 | AC-10.1 ~ AC-10.2 | Step 10 |

## Outcome

PASS / FAIL / BLOCKED_ENV / NOT_RUN

- BLOCKED_ENV 和 NOT_RUN 永不报告为 PASS
- PASS 时资产可交付 design-compiler 编译
- 编译验证必须在 design-compiler 侧实际执行 DC-PB-001/002
