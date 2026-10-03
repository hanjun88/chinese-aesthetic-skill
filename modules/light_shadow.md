# 模块：光影布局（light_shadow）

对应规则：guidelines/light-shadow.md | 优先级：P1

> Implementation: `lib/light-engine.js`（`generateLighting`：光源类型/角度/强度、阴影、体积光与 `threeJsConfig`；时间预设 `listTimePresets`）· thresholds: 光影判据（明暗比、阴影软硬度、体积光数量等）尚未登记（以 `guidelines/light-shadow.md` 与引擎内判据为准；rules registry family `CAS-LT`（光照默认值）为其预留，目前为空；朝代光照先验——天光亮度、雾密度、阴影色温、强调色亮度——见 family `CAS-PB` 的 `*-SKYLUMINANCE` / `*-MISTDENSITY` / `*-SHADOWTEMPERATURE` / `*-ACCENTLUMINANCE` 规则）· rationale: `guidelines/light-shadow.md`
>
> 本模块不内嵌算法、代码与参数配置：光照方案与 Three.js 配置由引擎生成，判据在 guidelines（待登记）。以下只保留原则要点与素材库实证（观察值，不是阈值）。

## 原则要点

- **体积光按场景类型配置**：仙境——低角度冷白日光加指数平方雾；宫殿——偏暖的低角度光（金色调）加雾加体积光；山——更低角度的冷光加浓雾；城市——中性白光，不用 god rays。仙境与宫殿场景应有体积光（低角度光源加雾介质）。
- **丁达尔效应的构成**：低角度光源、散射介质（雾/粒子）、足够多的粒子、光源在相机视野内或边缘；综合这几项判定是否具备丁达尔效应。
- **柔光阴影**：东方风格偏好柔光，用 PCFSoftShadowMap，硬阴影要提示。
- **Bloom**：只让高亮区域泛光；阈值过低会让全画面泛白，强度过高会过曝。
- **东方仙境光照的搭建思路**：主光为低角度冷白日光，开启投影并使用 PCFSoftShadowMap；雾用 FogExp2 模拟大气散射；环境光保持低强度以保留暗部细节；后处理用 EffectComposer（RenderPass + UnrealBloomPass）加体积光。

## 素材库实证（Distillation Evidence）

> 数据来源：`../distillation/` ai-linggan（15视频）+ ivanchiu（11张），关联索引见 `evidence-index.md`。
> 以下是**观察值**（来源与样本量见各行），不是阈值；光影判据见 guidelines 与引擎。

### 体积光观察（ai-linggan 15视频）

| 参数 | 观察值 | 实证依据 |
|---|---|---|
| 体积光启用率 | 100% | 15/15全员启用 |
| 丁达尔效应 | 67% | 10/15有丁达尔 |
| 光源仰角 | 15°-45° | 低角度为主，营造长阴影和光束 |
| 光源色温 | 5500K-6500K | 冷白日光 |
| 阴影类型 | PCFSoft | 全部柔光阴影 |
| 雾类型 | exp2 | 指数平方雾，模拟大气散射 |
| 雾密度 | 0.015-0.025 | 场景相关 |
| 大气透视 | 0.6 | 远景偏蓝偏灰 |

### Bloom 观察（ai-linggan + xiaoai黑洞视频）

| 参数 | 观察值 | 适用场景 |
|---|---|---|
| bloom_strength | 0.6-1.0 | 通用仙境场景 |
| bloom_radius | 0.3-0.5 | – |
| bloom_threshold | 0.8-0.9 | 仅高亮区域泛光 |
| 黑洞bloom | 1.8 | xiaoai视频04，金色辉光 |

### ivanchiu 云海天宫光影特征（11张）

| 特征 | 出现率 | 说明 |
|---|---|---|
| 体积光/光束 | 36% | 4/11有明显god rays |
| 长焦压缩 | 100% | 全部使用长焦镜头压缩空间 |
| 侧光/侧逆光 | 55% | 6/11使用侧光营造立体感 |
| 半透明玉质发光 | 18% | 2/11有translucent jade glow |
| 镜面地板无限反射 | 9% | 1/11有mirror floor infinity |
| 彩虹光折射 | 9% | 1/11有iridescent light refraction |
