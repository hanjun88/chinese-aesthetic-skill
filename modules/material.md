# 模块：材料与质感（material）

对应规则：guidelines/material.md | 优先级：P1

> Implementation: `lib/material-engine.js`（`MATERIAL_LIBRARY` 材质库、`generateMaterial` 生成 PBR 参数与 Three.js 代码、`validateMaterials` 校验）· thresholds: PBR 判据（粗糙度、金属度、塑料感等）尚未登记（以 `guidelines/material.md` 与引擎内判据为准；朝代粗糙度与包浆先验见 `CAS-PB-*-ROUGHNESS` / `CAS-PB-*-PATINALEVEL`）· rationale: `guidelines/material.md`
>
> 本模块不内嵌算法、代码与 PBR 参数表：材质库与校验在引擎里，判据在 guidelines（待登记）。以下只保留原则要点与素材库实证（观察值，不是阈值）。

## 原则要点

- **东方材质偏好石/木/玉/布，不是工业金属**：金属度低；金属只做点缀（金只做线/点/光，配深色底才发光）。
- **粗糙度中高**，避免塑料感与镜面感。塑料感的典型表现：极低粗糙度加极低金属度；清漆层过厚（廉价塑料光泽）；环境光反射过强（镜面塑料）；没有法线/凹凸贴图的光滑表面。判据见引擎 `validateMaterials` 与 guidelines。
- **清漆层给漆器/陶瓷质感，光泽层（sheen）给丝绸/布料质感，透射给玉石/半透明材质**。
- **材质东方性评分**：低金属度、中高粗糙度，加上清漆/光泽/透射的恰当使用得分；评分与分级由引擎实现。
- **场景敏感**：非未来城市场景不应出现高金属度材质。
- **东方材质的特征**（参数见 guidelines 与引擎）：玉石——半透明温润，次表面散射（SSS）；漆器——深底色加金纹；丝绸——各向异性光泽；青铜——做旧纹理；宣纸——纤维纹理；木材——年轮纹理。

## 素材库实证（Distillation Evidence）

> 数据来源：`../distillation/` ai-linggan（15视频）+ ivanchiu（11张），关联索引见 `evidence-index.md`。
> 以下是**观察值**（来源与样本量见各行），不是阈值；PBR 参数见 guidelines 与 `lib/material-engine.js`。

### 材质分布（ai-linggan 15视频）

| 材质 | 出现率 | 典型应用 | 备注 |
|---|---|---|---|
| water 水体 | 100% | 云海/河流/瀑布 | – |
| stone 石材 | 87% | 建筑/山体/地面 | 需要法线贴图 |
| cloud 云雾 | 73% | 大气/体积光介质 | 体积材质 |
| glass 玻璃 | 67% | 幕墙/水晶/透镜 | – |
| metal 金属 | 40% | 装饰/结构/未来城市 | 避免全镜面 |

### ivanchiu 云海天宫材质特征（11张）

| 材质 | 出现率 | 说明 |
|---|---|---|
| 白玉 white jade | 100% | 建筑主体，半透明温润质感 |
| 悬浮建筑 floating architecture | 100% | 反重力结构 |
| 金顶 liquid gold roof | 100% | 屋顶，流动金属质感 |
| 不可能建筑 impossible architecture | 100% | 非欧几何结构 |
| 金缮 kintsugi | 9% | 1/11有金色裂纹修复 |
| 半透明玉拱桥 translucent jade glow | 9% | 1/11有发光玉质 |
