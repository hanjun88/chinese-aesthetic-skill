# 如何创建美学约束单（AestheticConstraintSheet）

> 约束单是 CAS 引擎输出、喂给融合层的**唯一输入物**。本文指导如何填出一张合法、可编译、可回评的约束单。

## 1. 约束单的本质

约束单不是"设计稿"，而是一组**可被纯函数消费的约束**：色彩角色、留白比、光位、材质包浆、违禁清单、违例。它由 `lib/` 原 10 维引擎或人工蒸馏产出，形状见 `types/aesthetic-sheet.ts`。

## 2. 必填字段清单

| 字段 | 约束 |
|------|------|
| `sheetId` | 唯一 id，会派生 `irId` |
| `designBrief` | 一句话设计意图 |
| `mood` | 五选一：`song-elegant` / `chan-zen` / `tang-tang` / `night-feast` / `misty-blue` |
| `attributionStatement` | ≤200 字归因（"为什么这样是中国的"） |
| `structuralDimensions` | 至少 1 条，`weight` ∈ primary/secondary/tertiary |
| `colorSystem.palette` | **必须含 dominant / secondary / accent 三个角色** |
| `colorSystem.saturationMax` | 铁律 0.5 |
| `proportion.voidSolidRatio` | `"a:b"` 格式，如 `"7:5"` |
| `lighting.primarySource` | skylight/leaked/side/bounced/moonlight |
| `lighting.timeSetting` | dawn/noon/dusk/night/cloudy |
| `lighting.lightDarkRatio` | `"亮:暗"` 格式 |
| `score` | 0-100，仅 metadata |

缺 palette 角色或比例格式错误会在 `sheetToCangjie` 阶段直接抛错。

## 3. 色彩：君臣佐使与降饱和

```ts
colorSystem: {
  palette: [
    { role: "dominant",  name: "月白", hex: "#EDEAE4", areaPct: 0.65, usage: "底色" },
    { role: "secondary", name: "黛青", hex: "#2C3E50", areaPct: 0.25, usage: "门框/文字" },
    { role: "accent",    name: "古金", hex: "#B8893A", areaPct: 0.05, usage: "点题" },
  ],
  saturationMax: 0.5,
  hardFailHex: ["#FF0000", "#FFD700", "#000000", "#00FFFF"],
}
```

- hex 必须是**已降饱和的执行值**（S≤50%），运行时不再二次降饱和；
- `hardFailHex` 是 P0 黑名单：出现即被 G2/契约 C 判违例；
- 面积占比：dominant 60-70%、secondary 20-30%、accent ≤8%。

## 4. 维度权重怎么选

`structuralDimensions[].weight` 决定 fidelity 目标分（primary=90 / secondary=80 / tertiary=70）：

- **primary**：该场景的命门（如书院入口的"虚实"与"中轴"）；
- **secondary**：调性支撑（如色彩、光影）；
- **tertiary**：点缀约束（如动势、反俗套）。

未在 `structuralDimensions` 声明的维度，回评时记 `unspecified`，按裁决给分。

## 5. 违例（violations）怎么写

```ts
violations: [
  { ruleId: "saturation", severity: "P0", message: "某候选稿饱和度过高" },
  { ruleId: "void-solid", severity: "P1", message: "留白不足，壅塞" },
]
```

- `P0` → DC 侧翻译为 `fatalBelow` + `not-in` 阈值约束（BLOCK）；
- `P1` → 翻译为 `range.hard:[0.3,0.7]`（REPAIR）；
- ruleId 见 `VIOLATION_RULE_PATH` 表（saturation / pure-red / bright-gold / pure-black / void-solid / symmetry / light-ratio …）。

## 6. 一个完整样例

参考 `examples/fusion-demo/sheet.json`（书院入口）。最小可编译样例见 [`../quick-start.md`](../quick-start.md)。

## 7. 自检清单

- [ ] palette 三角色齐全？
- [ ] 所有 hex 饱和度 ≤ 50%？
- [ ] 没有把正红/亮金/死黑/青放进 palette？
- [ ] `voidSolidRatio` / `lightDarkRatio` 是 `"a:b"`？
- [ ] mood 是五选一？
- [ ] `capturedAt` 由调用方传入（不在 sheet 里写死时间）？
