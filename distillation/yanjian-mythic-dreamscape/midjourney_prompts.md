# 岩見 — Midjourney V8.2 提示词库

**8 视频蒸馏转化 · DISTILLATION_SPEC_v2.0 · 配套 COMPILED_REPORT.md**

---

## 1. 使用指南

### 1.1 如何使用本文件

1. 每条提示词的 `full_prompt` 字段已用代码块包裹，**整段复制即可直接粘贴到 Midjourney Discord / 网页端 prompt 栏**，末尾参数（`--ar / --stylize / --weird / --v 8.2 / --hd / --style raw`）已包含在内。
2. 替换 `{subject}` 占位符为你自己的主体（人物 / 灵兽 / 场景），其余 medium / lighting / material 句式保留不动——这是岩見风格的骨架。
3. 每条提示词末尾的 `palette` 给出 hex 色板，可在提示词中以 `#RRGGBB` 形式显式注入（岩見本人在 v003 / v007 已经这样做）。

### 1.2 参数说明

| 参数 | 岩見推荐区间 | 说明 |
|---|---|---|
| `--ar` | 9:16（7/8）或 3:2（工笔横卷） | 竖版短视频语境；v003 工笔用 3:2 |
| `--stylize` | 400–450（均值 425） | 太高（>500）会丢东方克制感 |
| `--weird` | 0–50（灵兽神话可到 200） | 岩見 6/8 条为 0 |
| `--style raw` | 仅墨色 / 低饱和题材启用 | 压制 MJ 默认艳化（v004 唯一启用） |
| `--hd` | 默认全开（8/8） | 2048px 原生直出，无需二次 upscale |
| `--v` | 8.2（显式指定） | V8.2 默认美学更精致 |

### 1.3 迭代建议

- **SD 探路 → HD 终出**：先用 SD（1024px，0.8 GPU-min）跑 4 宫格，确认构图 / 色彩方向后再上 HD（2048px，1.3 GPU-min）。
- **`--chaos` 探索期 25–50，收束期 0–10**：V8.2 默认波动已比 V8.1 大，chaos 建议比 V8.1 低 10–20。
- **角色一致性**：V8.2 已不支持 `--cref / --oref`，需要跨图保持同一人物时改用 Edit Model 多图参考（最多 4 张）。
- **文字渲染**：V8.2 已改善，但仍建议在提示词末尾加 `--no text, watermark`（v002 已示范）。

---

## 2. 博主风格通用模板

### 模板 A：竖版神话梦境（覆盖 v001 / v002 / v006 / v007 / v008）

```text
{subject}, surreal cinematic 3D render meets Chinese shan-shui ink painting,
Chinese mythic surrealism, ethereal immortal qi, {palette_hex_1} dominant with
{palette_hex_2} secondary and {palette_hex_3} accent, soft volumetric god rays
through {canopy}, mirror-flat water reflection, perfectly symmetrical or
rule-of-thirds composition, soft hemispheric gradient light, no hard shadows,
gentle bloom on highlights, smooth silk and fur and cloud-canopy materials,
in the spirit of Moebius composition + James Jean ethereal color + Guo Xi
monumental landscape, serene melancholic sacred dreamlike mood
--ar 9:16 --stylize 425 --weird {0|50|200} --v 8.2 --hd
```

### 模板 B：电影感山水文人（覆盖 v004 / v005）

```text
{subject}, cinematic matte painting, 35mm film still, Chinese shan-shui ink
landscape meets cinematic chiaroscuro, one-corner Ma Yuan composition, Roger
Deakins lighting meets Guo Xi monumental landscape, Wong Kar-wai restrained
color grading, {dominant_hex} muted desaturated palette with single accent,
soft volumetric mist and aerial perspective between ridges, contemplative
negative space with small figure against vast landscape, soft diffused key
light with moonlit rim backlight, weathered stone / waxy pine / translucent
petals, poetic reclusion melancholic stillness
--ar 9:16 --stylize 400 --v 8.2 {--style raw} --hd
```

> 模板 B 中 `--style raw` 仅在 dominant 是墨蓝 / 深青等低饱和色时启用（v004 启用，v005 不启用——v005 是暖金云海，MJ 默认美化反而是加分项）。

---

## 3. 八个视频完整提示词

### 3.1 video_001 —《踏遍千古，伴我无声》

- **medium**：surreal offline path-traced 3D render, Octane-grade smooth surfaces, dreamlike matte finish
- **art_movement**：Chinese mythic surrealism, blending Dunhuang apsara aesthetics with René Magritte's silent stillness
- **artist_reference**：Toshio Saeki serenity + Wang Mu gongbi cloud motifs + James Jean luminous gradients
- **风格标签**：`#对称拱门` `#珊瑚粉云树` `#镜面水` `#敦煌飞天` `#Magritte式静谧`

**完整提示词（可直接粘贴）：**

```text
a lone ancient Chinese woman in flowing white silk robe standing at the far end of a nested pale-blue meander-pattern archway, twin giant cotton-candy coral-pink cloud-canopy trees framing the gate on both sides, still mirror water reflecting everything, hair in a sleek low bun, seen from behind, surreal 3D render, surreal 3D render, Chinese fairyland aesthetic, Chinese fairyland aesthetic, mythic dreamscape, cotton-soft cloud canopies, matte ceramic huiwen meander relief arch, mirror-flat water reflection, pastel dreamlike palette, ethereal immortal qi, perfectly symmetrical composition, no hard shadows, soft gradient sky, cinematic stillness, Octane-grade offline path-traced render, smooth ceramic and silk surfaces, soft hemispheric gradient light, deep indigo zenith fading to warm peach horizon, backlit rim glow on cloud canopies, gentle bloom on highlights, 58mm equivalent eye-level camera, strict bilateral symmetry, serene melancholic timeless sacred silence --ar 9:16 --stylize 400 --v 8.2
```

- **推荐参数**：`--ar 9:16 --stylize 400 --weird 0 --v 8.2 --hd`（不启用 raw）
- **palette hex**：`#1f3a6e` 深靛青 · `#f5a8a0` 珊瑚粉（primary）· `#7b9ede` 长春花蓝（secondary）· `#f2a65a` 金橙（accent）· `#b8c4e8` 月白拱门 · `#ffb89a` 暖桃地平线 · `#f2e6f0` 丝绸白 · `#2a3a6a` 深水
- **使用场景**：做品牌主视觉 / 手机壁纸 / 汉服博主封面——严格对称 + 镜面水，天然适合居中排版。

---

### 3.2 video_002 —《灵兽同行，山河入梦》

- **medium**：surreal cinematic 3D render, octane path-traced, meets Chinese gongbi ethereal silk-painting elegance
- **art_movement**：Chinese mythological surrealism, dreamlike shanshui reinterpretation, minimalist zen composition
- **artist_reference**：ethereal James Jean softness fused with traditional Chinese gongbi figure painting and Moebius-clean silhouettes
- **风格标签**：`#玄武` `#天马` `#青丘白狐` `#品红靛蓝` `#自发光云树`

**完整提示词（可直接粘贴）：**

```text
a serene young Chinese woman in flowing sheer lavender Hanfu robes with a neat low bun, standing and sitting beside spirit creatures — a white celestial horse with a glowing pink-orange gradient mane and tail, a giant teal xuanwu tortoise gliding on mirror-still water, a white fox spirit sitting at her knee — in a mythic dreamland where tall dark mossy trunks support canopies made entirely of self-luminous pink cumulus clouds, ethereal Chinese mythological dreamscape, surreal 3D render, gongbi-inspired graceful figure painting, luminous self-glowing cloud-trees, perfect mirror-water reflection, symmetrical wide composition, cool deep-indigo moonlight key with warm pink-orange inner cloud glow, magenta horizon bounce, soft rim light on silk, 50mm lens low horizon at 25% frame, serene mythic tranquility, octane path-traced render fused with Chinese gongbi silk-painting elegance, no text no watermark --ar 9:16 --stylize 450 --weird 200 --v 8.2
```

- **推荐参数**：`--ar 9:16 --stylize 450 --weird 200 --v 8.2 --hd`
- **palette hex**：`#1e3a8a` 靛蓝 · `#c026d3` 品红地平线 · `#fb923c` 云树橙 · `#f9a8d4` 云粉 · `#c4b5fd` 薰衣草袍 · `#1f4d3a` 苔绿 · `#4a7c8a` 玄武青 · `#f5f3ff` 灵兽白 · `#fbbf24` 暖月
- **使用场景**：山海经 / 国风插画选题卡——`--weird 200` 是 8 条中最高，适合想要「非现实变异感」时使用。

---

### 3.3 video_003 —《一眼千载，与兽同栖》

- **medium**：Chinese gongbi meticulous heavy-color painting, mineral pigments on silk, fine iron-wire outline brushwork, flat layered ink-wash washes
- **art_movement**：traditional Chinese guofeng illustration meets contemporary surreal fairyland (guofeng xianjing)
- **artist_reference**：modern gongbi revival blended with moody shan-shui atmosphere
- **风格标签**：`#工笔重彩` `#铁线描` `#绢本矿物色` `#人马合一` `#银杏`

**完整提示词（可直接粘贴）：**

```text
Chinese gongbi meticulous heavy-color painting of a solitary young woman in flowing deep indigo-teal hanfu seated barefoot on mossy rocks beside a pale white horse, her long black hair flowing and merging into the horse's white mane, surrounded by large fan-shaped ginkgo leaves and sparse cinnabar-orange coral-like branches, meticulous gongbi linework, meticulous gongbi detail, mineral pigment texture, flat layered ink-wash washes, fine iron-wire outline brushwork, fairy-tale beast-and-human harmony, serene ancient dreamlike mood, soft diffused canopy skylight with cool green ambient bounce and faint warm amber light through dark treetops, gentle painted atmospheric mist, matte mineral pigment on silk, translucent pale gauze, palette of deep teal #1f4d52, pale mist #dce8e6, cinnabar orange #c85a2a, ink dark #0e222b, warm highlight #f2e2b8, elegant guofeng fairyland, no photographic realism --ar 3:2 --stylize 400 --v 8.2
```

- **推荐参数**：`--ar 3:2 --stylize 400 --weird 0 --v 8.2 --hd`（**唯一横版**）
- **palette hex**：`#1f4d52` 深青主 · `#dce8e6` 雾白辅 · `#c85a2a` 朱砂橙点 · `#0e222b` 墨底 · `#f2e2b8` 暖光高光
- **使用场景**：做装饰画 / 横版海报 / 公众号头图——这是 8 条中最「传统工笔」的一条，显式写 `no photographic realism` 压住 3D 感。

---

### 3.4 video_004 —《当电影感配色遇上中国古诗词》（菊 / 雨松 / 月桥）

- **medium**：cinematic matte painting, 35mm film still, photorealistic yet painterly
- **art_movement**：Chinese shan shui ink landscape reimagined as cinematic chiaroscuro
- **artist_reference**：Roger Deakins lighting meets Guo Xi ink composition, Wong Kar wai restrained color grading
- **风格标签**：`#电影感哑光` `#雨山青` `#菊花金` `#月桥靛` `#--style raw`

**完整提示词（可直接粘贴）：**

```text
a solitary robed scholar in weathered raw silk Hanfu sitting on a mossy wet boulder, small contemplative back view silhouette in a vast layered misty mountain landscape, holding a wine gourd, ancient gnarled pine branches framing the upper edge, foreground sea of warm golden chrysanthemums, distant layered blue ridges fading into atmospheric haze, still dark water reflecting a full moon, cinematic matte painting meets Chinese shan shui ink landscape, three layer depth foreground midground distance, restrained desaturated palette with dominant deep teal cyan and warm gold accents, soft volumetric rain haze and aerial perspective, chiaroscuro soft overcast key light at 7500K with moonlit rim backlight, 50mm f2.8 shallow depth of field on foreground chrysanthemums, eye level locked off static composition, weathered rough wet stone, waxy pine needles, delicate translucent petals, twisted dry wood, serene solitary reclusion mood, melancholic stillness, classical Chinese poetry atmosphere --ar 9:16 --stylize 400 --v 8.2 --style raw
```

- **推荐参数**：`--ar 9:16 --stylize 400 --weird 0 --v 8.2 --style raw --hd`（**唯一启用 raw**）
- **palette hex**：`#1E5A5A` 深青主 · `#D8A838` 菊金辅 · `#3A3A6A` 月桥靛点 · `#0E2A2A` 阴影 · `#C8D8D8` 高光 · `#8FA8B8` 雾天 · `#EDE8DC` 素丝
- **使用场景**：墨色 / 低饱和山水题材——必须 `--style raw`，否则 MJ 会把 `#1E5A5A` 自动加饱和。提示词注释提示可换主色做菊花金（6200K）或月桥靛（加满月石拱桥镜面水）变体。

---

### 3.5 video_005 —《当电影感配色遇上中国古诗词》（云海 / 莲 / 亭）

- **medium**：cinematic matte painting, 35mm film still, wuxia film frame
- **art_movement**：Chinese shan-shui ink landscape meets cinematic chiaroscuro, one-corner composition (Ma Yuan)
- **artist_reference**：Roger Deakins lighting, Guo Xi monumental landscape, Wong Kar-wai / Kar Wai wuxia color grading
- **风格标签**：`#武侠电影帧` `#琥珀金云海` `#马远一角` `#黄山` `#65%留白`

**完整提示词（可直接粘贴）：**

```text
a solitary ancient Chinese scholar in flowing wide-sleeved hanfu robes seen from behind, standing on weathered granite cliff steps, gazing out over an infinite sea of golden-amber clouds with jagged karst peaks piercing the mist, twisted pine branch framing the upper left, wind lifting the robe hem, vast misty negative space, shan-shui landscape, wuxia atmosphere, poetic solitude, Chinese classical poetry mood, cinematic matte painting, 35mm film still, wuxia film frame, Chinese shan-shui ink landscape meets cinematic chiaroscuro, one-corner Ma Yuan composition, Roger Deakins lighting, Guo Xi monumental landscape, Wong Kar-wai color grading, golden-hour chiaroscuro, volumetric mist, atmospheric perspective, muted cinematic palette, soft diffused light, epic lonely figure, low warm amber sun at 12-degree elevation, 3200K key light, soft rim light on shoulder, lifted shadows, gentle bloom on cloud highlights, 50mm lens, rule of thirds, figure on right third, 65 percent negative space, layered depth, flowing silk-cotton robe, rough granite, waxy pine needles, billowing cloud, melancholic grandeur, poetic solitude, ethereal, transcendent --ar 9:16 --stylize 400 --weird 0 --v 8.2 --hd
```

- **推荐参数**：`--ar 9:16 --stylize 400 --weird 0 --v 8.2 --hd`
- **palette hex**：`#d4a04a` 琥珀金主（primary）· `#3a6a4a` 荷叶玉绿（secondary）· `#d4889a` 莲粉（accent）· `#6a4a20` 深褐辅 · `#8b4a2a` 红棕袍 · `#f0c060` 高光 · `#2a2018` 阴影 · `#e8d4a0` 雾金
- **使用场景**：暖金武侠 / 黄山云海选题——与 v004 同系列但不 raw，因为 3200K 暖金需要 MJ 默认的美化加一层。

---

### 3.6 video_006 —《忽逢桃花林，夹岸数百步…》

- **medium**：ethereal cinematic 3D render meets Chinese shan-shui ink painting, soft painterly finish
- **art_movement**：Chinese shan-shui landscape fantasy, ukiyo-e inspired composition, dreamlike utopian aesthetic
- **artist_reference**：in the spirit of Moebius composition + James Jean ethereal color + Guo Xi monumental landscape
- **风格标签**：`#桃花源` `#落英缤纷` `#粉金河道` `#夹岸对称` `#乌托邦`

**完整提示词（可直接粘贴）：**

```text
a lone robed ancient traveler with woven bamboo conical hat standing on a small wooden raft drifting down a narrow river, flanked on both banks by dense blooming pink peach blossom forest, no other trees, falling pink peach blossom petals filling the air and carpeting the water surface, falling cherry blossom petals, pink peach blossom forest, volumetric light through trees, ethereal dreamlike utopian atmosphere, pink and gold harmonious palette, soft volumetric god rays filtering through blossom canopy, misty pink haze between trees, classical Chinese shan-shui corridor composition, delicate petal particles floating in air and on water, tranquil meditative mood, ethereal cinematic 3D render meets Chinese shan-shui ink painting, soft painterly finish, in the spirit of Moebius composition and James Jean ethereal color, warm golden backlight filtering through pink canopy, soft pink bounced ambient skylight, gentle rim light on the robed figure, misty aerial perspective, shot on 35mm, low angle river-level wide shot, shallow depth of field with soft bokeh foreground petals, centered symmetrical composition, rough weathered bamboo raft wood, soft linen robe fabric, delicate translucent peach petals, rippling clear stream water with pink reflections, mossy golden-brown bank vegetation, serene nostalgic dreamlike utopian solitary wonder --ar 9:16 --stylize 450 --v 8.2
```

- **推荐参数**：`--ar 9:16 --stylize 450 --weird 0 --v 8.2 --hd`
- **palette hex**：`#f7a8c4` 桃花粉主 · `#ffd9a8` 暖光辅 · `#3a5a6a` 溪水青灰点 · `#d8a8c0` 粉影 · `#fff0e0` 高光
- **使用场景**：春日 / 七夕 / 桃花主题——`--stylize 450` 给粉金一点梦幻感，不 weird。

---

### 3.7 video_007 —《北冥有鱼，其名为鲲；化而为鸟，其名为鹏》

- **medium**：epic cinematic 3D render meets Chinese mythic ink-wash realism
- **art_movement**：Chinese mythology surrealism, xianxia grand landscape, romantic sublime
- **artist_reference**：inspired by Moebius cinematic compositions, James Jean ethereal mythology, Chinese shan shui painting masters Fan Kuan and Guo Xi
- **风格标签**：`#鲲鹏` `#庄子逍遥游` `#1:50尺度对比` `#水下丁达尔` `#崇高感`

**完整提示词（可直接粘贴）：**

```text
colossal mythical beast kun transforming from deep-sea whale to soaring peng bird, lone ancient chinese scholar in flowing hanfu robe standing on a weathered stone platform gazing upward at the divine beast, epic scale contrast between tiny human and monumental creature, ancient Chinese mythology, Zhuangzi Xiaoyaoyou, deep ocean to sky transformation, colossal mythical beast, monumental scale, Chinese mythic realism, cinematic epic, spiritual transcendence, soft volumetric god rays through deep blue water, warm golden hour sunset on towering cumulus clouds, cool celestial blue rim light, ethereal sublime atmosphere, layered misty atmospheric perspective, epic cinematic 3D render meets Chinese mythic ink-wash realism, xianxia grand landscape, inspired by Moebius compositions and Chinese shan shui painting, smooth whale skin with subsurface scattering, layered feather wings, matte linen robe, weathered granite rock, volumetric cloud sea, deep ocean blue #2A6FA8, golden amber #E8B878, luminous white #FFFFFF, cool shadow blue #1A3A5C, transcendent awe, philosophical solitude, mythic grandeur --ar 9:16 --stylize 450 --weird 50 --v 8.2
```

- **推荐参数**：`--ar 9:16 --stylize 450 --weird 50 --v 8.2 --hd`
- **palette hex**：`#2A6FA8` 北冥蓝主 · `#E8B878` 鹏羽赭金辅 · `#FFFFFF` 星尘白 · `#1A4A7C` 深海 · `#7FC8E8` 天青 · `#D89A4C` 黄昏金 · `#E8C0A0` 云桃 · `#1A3A5C` 冷影
- **使用场景**：史诗 / 神话 / 哲学感封面——`--weird 50` 给鲲鹏一点生物变异感，24mm 广角低角度是关键。

---

### 3.8 video_008 —《绥绥白狐，九尾庞庞》

- **medium**：cinematic 3D digital painting, ultra-detailed strand-based fur render, path-traced moonlight
- **art_movement**：Chinese mythic fantasy, Shan Hai Jing bestiary, ethereal guofeng concept art
- **artist_reference**：WLOP ethereal lighting meets Dong Gunho creature design, Chinese shan shui atmosphere
- **风格标签**：`#九尾白狐` `#山海经` `#8200K冷月` `#strand毛皮` `#紫衣女子`

**完整提示词（可直接粘贴）：**

```text
nine-tailed white fox, Chinese mythical creature, Shan Hai Jing bestiary, ethereal mystical atmosphere, ethereal white fox with nine flowing lavender-tipped tails standing in moonlit shallow pool, a woman in translucent purple silk robe facing it across dark reflective water, deep blue-teal night forest with pale pink blossoms, cool blue moonlight 8200K, soft rim glow on fluffy strand-level fur, faint volumetric moon shafts, single warm golden-amber slit pupil eye, cinematic 3D digital painting, path-traced moonlight, WLOP ethereal lighting meets Chinese shan shui mythic concept art, centered symmetrical composition, lower-third waterline horizon, serene sacred melancholic transcendent mood --ar 9:16 --stylize 450 --weird 0 --v 8.2
```

- **推荐参数**：`--ar 9:16 --stylize 450 --weird 0 --v 8.2 --hd`
- **palette hex**：`#16233f` 夜林深主 · `#c9d8f5` 月光 · `#e6e4f0` 狐毛白 · `#9a7fd4` 尾尖薰衣草 · `#6e5aa8` 紫丝袍 · `#d9a53a` 金瞳 · `#c97aa8` 粉花
- **使用场景**：灵兽 / 妖异 / 夜神话题材——WLOP 灯光是关键参考，单只金瞳是全画面唯一暖色点。

---

## 4. 风格混搭建议

### 混搭 1：岩見配色 + 赛博朋克

把岩見的五方青蓝主色与霓虹品红叠加到赛博雨夜，但保留镜面水与对称构图。

```text
a lone figure in translucent silk hanfu standing on a rain-slicked mirror street between holographic Tang-dynasty lanterns, neon magenta #c026d3 signs reflecting on wet asphalt, deep indigo #1e3a8a night sky, cyberpunk shan-shui, Chinese futurism, James Jean ethereal glow meets Blade Runner 2049 neon, volumetric rain god rays, soft bloom, symmetric vanishing-point composition --ar 9:16 --stylize 450 --v 8.2 --hd
```

### 混搭 2：岩見构图 + Ukiyo-e 版画

保留桃花林 / 河道的对称走廊构图，但浮世绘平涂色块 + 大和绘线条。

```text
ukiyo-e woodblock print of a lone traveler on a bamboo raft drifting down a narrow peach blossom river flanked by pink #f7a8c4 cherry trees, flat mineral color blocks, Hokusai-inspired wave patterns, Edo period print, Bokuzan-style clouds, no gradient shading, paper grain, limited palette of pink peach #f7a8c4, warm gold #ffd9a8, ink teal #3a5a6a, white #ffffff --ar 9:16 --stylize 350 --v 8.2 --hd
```

### 混搭 3：岩見光影 + 蒸汽朋克 / 机械山海经

把鲲鹏换成蒸汽机械神兽，但保留 1:50 尺度对比与水下丁达尔。

```text
colossal steampunk mechanical kun whale with brass gears and copper rivets gliding through deep blue #2A6FA8 underwater, a tiny scholar in oil-stained linen hanfu on a rusted stone platform gazing up, volumetric god rays through water, brass amber #E8B878 accents, dark industrial shan-shui, Moebius industrial linework meets James Jean glow, scale contrast 1:50 --ar 9:16 --stylize 450 --weird 100 --v 8.2 --hd
```

### 混搭 4：岩見工笔 + 暗黑哥特

把 video_003 的工笔绢本基底换成哥特式月夜 + 教堂彩窗。

```text
Chinese gongbi meticulous heavy-color painting on aged silk, a pale woman in indigo-teal hanfu seated beside a black wolf instead of a white horse, ginkgo leaves replaced by thorned black roses, cathedral rose window glow through canopy, iron-wire outline brushwork, palette of deep teal #1f4d52, bone white #dce8e6, blood cinnabar #c85a2a, ink black #0e222b, gothic guofeng fusion, no photographic realism --ar 3:2 --stylize 400 --v 8.2 --hd
```

### 混搭 5：岩見云海 + 极简瑞士国际主义

把 video_005 的 65% 留白推到极端，变成平面海报。

```text
ultra-minimal Swiss international poster, a single tiny black calligraphic figure on a granite cliff edge, vast flat amber-gold #d4a04a cloud sea occupying 80 percent of frame, one thin twisted pine silhouette upper left, generous white negative space, Guo Xi monumental landscape reduced to geometry, flat color blocks, no texture, no gradient, Bauhaus grid composition --ar 9:16 --stylize 200 --style raw --v 8.2 --hd
```

---

## 5. 参数速查表

| 视频 | 标题缩写 | --ar | --stylize | --weird | --style raw | --hd | 主色 hex |
|---|---|---|---|---|---|---|---|
| v001 | 踏遍千古 | 9:16 | 400 | 0 | off | on | `#f5a8a0` |
| v002 | 灵兽同行 | 9:16 | 450 | **200** | off | on | `#1e3a8a` |
| v003 | 一眼千载 | **3:2** | 400 | 0 | off | on | `#1f4d52` |
| v004 | 电影感配色·菊雨月 | 9:16 | 400 | 0 | **on** | on | `#1E5A5A` |
| v005 | 电影感配色·云海莲亭 | 9:16 | 400 | 0 | off | on | `#d4a04a` |
| v006 | 桃花林 | 9:16 | 450 | 0 | off | on | `#f7a8c4` |
| v007 | 鲲鹏 | 9:16 | 450 | 50 | off | on | `#2A6FA8` |
| v008 | 九尾白狐 | 9:16 | 450 | 0 | off | on | `#16233f` |
| **均值** | — | 9:16×7 / 3:2×1 | **425** | **31.25** | 1/8 | **8/8** | — |

---

*本文件所有 full_prompt 字段均逐字摘自 `video_001.json` ~ `video_008.json` 的 `midjourney_prompt.full_prompt`，未做改写；hex 色值与参数均来自对应 JSON。*
