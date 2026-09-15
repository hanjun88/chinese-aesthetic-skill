# 规则4：材料与质感（Material）

**规则ID：** material
**优先级：** P1
**模块文件：** modules/material.md

## 目的

遵循古建材料逻辑，偏好天然纹理和色彩。材料不是"贴图"，是"物"——木的纹理、石的粗糙、金的哑光、纸的半透，每一种材料都有真实的物理属性和时间痕迹。

## 可测指标

| 指标 | 阈值 | 测量方法 |
|---|---|---|
| 材质类型 | 木/石/土/金/纸/雾/光 | 材质分类检测 |
| 表面粗糙度 | roughness ≥ 0.5 | PBR 材质 roughness 值 |
| 金属度 | metalness ≤ 0.3（金除外） | PBR 材质 metalness 值 |
| 纹理类型 | 天然纹理优先 | 贴图内容检测 |
| 磨损度 | 有风化/包浆痕迹 | 纹理变化检测 |
| 塑料感检测 | 无光滑塑料质感 | roughness+metalness+高光综合 |

## 七种东方材料

| 材料 | 特征 | roughness | metalness | 参考色值 | 用法 |
|---|---|---|---|---|---|
| 木 | 纹理清晰，半光，无金属感 | 0.5-0.7 | 0.0 | #8B4513 ~ #5D4037 | 门/柱/梁/窗 |
| 石 | 粗糙，哑光，有风化痕迹 | 0.8-0.95 | 0.0 | #A9A9A9 ~ #696969 | 台基/地面/墙 |
| 土 | 细腻，哑光，暖色 | 0.7-0.9 | 0.0 | #C4A35A ~ #8B7355 | 墙/地面/陶 |
| 金 | 哑金/古金，非亮金 | 0.3-0.5 | 0.7-0.9 | #B8860B ~ #DAA520 | 装饰/点缀≤15% |
| 纸 | 半透明，柔光，纤维感 | 0.6-0.8 | 0.0 | #F5F5DC ~ #E8E4D9 | 窗纸/灯笼/屏风 |
| 雾 | 半透明，体积感，流动 | - | - | #FFFFFF opacity 0.3-0.7 | 云海/氛围/纵深 |
| 光 | 体积光，有方向，非灯效 | - | - | 暖色/冷色 | 天光/漏光/侧光 |

## 实现建议

1. **天然纹理优先**：木纹/石纹/砖纹，不用纯色或光滑材质。
2. **PBR 参数真实**：roughness ≥ 0.5，metalness ≤ 0.3（金除外）。
3. **时间痕迹**：材质有风化/包浆/磨损，不是全新的。木梁略显风化，金属有铜锈，石面有苔藓。
4. **禁止塑料感**：roughness < 0.3 且 metalness < 0.1 = 塑料感 FAIL。
5. **金色必须哑**：#B8860B ~ #DAA520，roughness 0.3-0.5，禁止 #FFD700 亮金。
6. **雾是体积不是粒子**：云海用体积雾/半透明层，不用离散粒子（除非是金粉点缀）。

```javascript
// Three.js 材质参数示例
const materials = {
  doorWood: new THREE.MeshStandardMaterial({
    color: 0x8B4513,
    roughness: 0.6,
    metalness: 0.0,
    map: woodTexture,
    normalMap: woodNormal
  }),
  floorStone: new THREE.MeshStandardMaterial({
    color: 0xA9A9A9,
    roughness: 0.9,
    metalness: 0.0,
    map: stoneTexture
  }),
  goldDust: new THREE.MeshStandardMaterial({
    color: 0xDAA520,
    roughness: 0.4,
    metalness: 0.8,
    transparent: true,
    opacity: 0.8
  }),
  cloudVolume: new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.5,
    roughness: 1.0,
    metalness: 0.0,
    depthWrite: false
  })
};
```

## P1 判定条件

- 使用明显非中式材质（光滑塑料、过度饱和金属、现代玻璃）
- 材质映射与场景风格不符（云海场景用金属地板）
- 材质过于全新（无风化/磨损痕迹）
- roughness < 0.3 且 metalness < 0.1（塑料感）

## 示例参考

- **佛光寺东大殿**：木构建筑，木材有千年风化痕迹，斗拱裸露无彩画
- **徽派民居**：白粉墙（土/石灰）+ 黑瓦（陶土），材质对比强烈
- **Paul W 鎏金瀑布**：暗底+金色纹理，金色是哑金非亮金
- **反例**：光滑塑料感的"中式门"= FAIL

## 与其他规则的关系

- 材料的本色是 06 色彩 的来源
- 材料的粗糙度影响 05 光影 的反射/漫反射
- 金粉/云雾是 07 动势 的载体
- 时间痕迹是 08 时间感 的视觉表达
