# 规则9：禁忌（Taboo）

**规则ID：** taboo
**优先级：** P0
**模块文件：** modules/taboo.md
**蒸馏来源：** 7位博主（反俗套实践）、AI生图工程调优方案（环状颗粒感/塑料油润感/数码过拟合味消除）、大唐营造（建筑等级制度）

## 目的

尊重传统礼制，避免元素滥用和视觉俗套。禁忌不是"不能用红色"，是"不能在错误的语境用错误的符号"——皇家五爪龙不能出现在民宅，斗拱有等级规定，AI生成的"国风贴图感"是最大的俗套。核心新增：AI生图的三类伪影（环状颗粒感/塑料油润感/数码过拟合味）的检测与消除工程。

## 可测指标

| 指标 | 阈值 | 测量方法 | 来源 |
|---|---|---|---|
| 皇家符号检测 | 无五爪龙/龙凤/琉璃黄瓦（非宫殿场景） | 图案/色值识别 | 建筑等级制度 |
| 宗教符号检测 | 无佛像/莲花台/卍字（非宗教场景） | 图案识别 | — |
| 俗套元素检测 | 无祥云纹满铺/回纹边框/毛笔字标题 | 元素占比检测 | 博主反俗套 |
| AI国风感检测 | 无高饱和渐变/塑料质感/均匀打光 | 综合评分 | — |
| 环状颗粒感 | 无同心圆环/油斑伪影 | 频域分析/视觉检测 | AI生图调优方案 |
| 塑料油润感 | 无光滑塑料皮肤/油画质感 | 粗糙度+高光检测 | AI生图调优方案 |
| 数码过拟合味 | 无过度锐化/JPEG伪影/色带 | 边缘检测+渐变分析 | AI生图调优方案 |
| 西方符号检测 | 无教堂尖顶/哥特窗/现代霓虹 | 形状识别 | — |
| 建筑等级检测 | 斗拱/屋顶形式与建筑类型匹配 | 规则匹配 | 大唐营造 |

## 四类俗套（HARD FAIL）

### 1. 国潮贴图感
- 特征：祥云纹满铺背景、回纹做边框、红色+金色撞色、毛笔字大标题
- 判定：传统纹样占比 > 20% = FAIL
- 修复：纹样仅在 ≤5% 面积出现（如服饰细节），背景用纯色或渐变

### 2. 古装影视感
- 特征：人物正面特写、华丽服饰细节、戏剧化打光、宫斗氛围
- 判定：人物占画面 > 10% 且正面露脸 = FAIL
- 修复：人物 ≤5%，背影/侧面/剪影，打光用逆光/侧逆光

### 3. 仿古景区感
- 特征：精细斗拱/雕花/彩绘、新建的"古建筑"、游客视角、均匀亮度
- 判定：建筑细节 > 30% 且无块面剪影感 = FAIL
- 修复：建筑用大色块/剪影，重点在轮廓和比例，不在细节

### 4. AI国风感
- 特征：高饱和渐变、塑料质感材质、均匀打光无明暗、弹跳粒子特效、元素堆砌
- 判定：饱和度 > 60% 且材质光滑度 > 0.8 = FAIL
- 修复：全部低饱和 S≤50%，材质 roughness≥0.5，明暗比≥5:1

## AI生图三类伪影与消除工程（新增）

### 伪影1：环状颗粒感（Concentric Ring Artifacts）
- **表现**：平滑过渡区域出现同心圆环/油斑/过饱和色圈
- **成因**：高CFG迫使潜变量超出正态分布阈值，导致色彩通道截断(clipping)与局部驻波伪影
- **检测**：频域分析出现周期性环状频谱，或平滑区域色阶不连续
- **消除工程**：
  1. **压低CFG Scale**：SDXL/SD1.5 控制在 3.0~5.5；Flux(Flow Matching) 控制在 1.0~2.5
  2. **CFG Rescale**：设为 0.7 左右，动态压缩极值
  3. **Dynamic Thresholding (Mimic CFG)**：插件级动态阈值，避免平滑区形成同心圆环
  4. **优化采样器**：DPM++ 2M Karras / Euler / UniPC，28~35步（Karras在去噪末期分配更密集步数，平滑微观收敛）

### 伪影2：塑料油润感（Plastic / Oily Texture）
- **表现**：人物皮肤光滑如塑料、材质有油画般油润反光、缺乏真实微观纹理
- **成因**：VAE解码器反卷积(Transposed Convolution)的棋盘格伪影 + 模型训练集被锐化过度/JPEG压缩的高权重图激活
- **检测**：皮肤/材质区域粗糙度<0.3且高光均匀分布，无毛孔/纤维/环境杂色
- **消除工程**：
  1. **替换VAE**：原生VAE→vae-ft-mse-840000-ema 或基模专门调校的防烧色VAE
  2. **Tiled VAE配置**：Tile Size≥1024，Overlap 64~128像素，防止拼缝周期性循环噪斑
  3. **二阶段重绘**：低降噪0.25~0.38重绘，借助扩散模型重新生成真实微观毛孔/纤维/环境杂色，洗去数码环状噪波
  4. **停用画质玄学词**：hyper-detailed / 8k resolution / masterpiece / ultra-realistic / sharp focus（这些词激活训练集中被锐化过度的高权重图）
  5. **改用真实摄影参数**：shot on 35mm lens, f/2.8, subtle depth of field, natural lighting, soft rim light, soft skin texture, natural imperfections, raw photo, film stock

### 伪影3：数码过拟合味（Digital Overfitting Taste）
- **表现**：过度锐化纹理震荡、色带(banding)、JPEG压缩伪影、边缘过冲(edge overshoot)
- **成因**：步数>50步过锐化 + 高CFG色彩截断 + 渐变区域8位色深不足
- **检测**：边缘出现白色过冲线，渐变区域出现可见色带，纹理高频震荡
- **消除工程**：
  1. **步数控制**：28~35步，低于20去噪不充分，高于50过锐化纹理震荡
  2. **像素级后期**：
     - 胶片颗粒Overlay：3%~6%真实扫描胶片颗粒（Kodak Portra 400噪点层），混合模式Overlay/Soft Light，真实不规则噪点打散AI规则微型圆圈
     - De-banding：轻微高斯抖动(Dithering)或0.5px表面模糊(Surface Blur)，再压回输出曲线，让光影渐变恢复物理连续性
  3. **负向提示词拦截**：smooth plastic skin, oil painting texture, circular artifacts, banding, oversaturated, chromatic aberration, digital noise, oversharpened

### 二阶段放大与重绘策略（通用伪影消除）

不要一步生成2K/4K，直接大尺寸生成必然导致重复注意力斑纹。必须"小图奠定构图，分块重绘高频"：
1. **第一阶段**：模型原生训练分辨率生成（SD1.5用512×768，SDXL/Flux用1024×1024），潜空间注意力场分布最均匀
2. **第二阶段**：
   - 模型放大而非潜变量直接放大：不用Latent模式放大（直接插值Latent会将低频噪点放大为同心圆斑），优先用NMKD Superscale/4x-UltraSharp/RealESRGAN_x4plus先像素空间放大1.5~2倍
   - 低降噪重绘：放大后的像素图重新编码回潜空间，重绘幅度0.25~0.38，步数15~20步，重新生成真实微观质感

## 文化禁忌

| 禁忌 | 说明 | 正确用法 |
|---|---|---|
| 五爪龙 | 皇家专用，普通建筑/场景禁用 | 可用四爪蟒（非皇家），或不用龙纹 |
| 琉璃黄瓦 | 皇家宫殿专用，民宅禁用 | 民宅用青瓦/灰瓦 |
| 龙凤呈祥 | 婚礼/皇家可用，日常场景慎用 | 可用鸳鸯/并蒂莲替代 |
| 佛像/菩萨 | 宗教场景专用，不可做装饰元素 | 可用莲花（去宗教化）但需谨慎 |
| 卍字 | 佛教符号，不可随意使用 | 不用，或用回纹替代 |
| 斗拱等级 | 高等级斗拱（八铺作）仅宫殿可用 | 民居用简单斗拱或不用 |
| 歇山顶/庑殿顶 | 高等级屋顶，普通建筑禁用 | 民居用硬山顶/悬山顶 |

## 实现建议

1. **建立禁忌元素黑名单**，设计完成后自动扫描。
2. **传统纹样最小化**：纹样仅在 ≤5% 面积出现，不可做背景/边框。
3. **建筑等级匹配**：根据场景类型（宫殿/民居/寺庙）选择对应的屋顶/斗拱/色彩等级。
4. **AI国风感检测**：饱和度、材质光滑度、明暗比三项综合评分。
5. **AI伪影三类检测**：环状颗粒感（频域）、塑料油润感（粗糙度+高光）、数码过拟合味（边缘过冲+色带）。
6. **生图参数校验**：CFG 3-5.5、采样器DPM++ 2M Karras、步数28-35、VAE用vae-ft-mse、二阶段放大0.25-0.38降噪。
7. **提示词校验**：无画质玄学词，有真实摄影参数，负向提示词包含三类伪影拦截词。
8. **"为什么是中国的"测试**：去掉所有红色/飞檐/毛笔字后，设计仍然是东方的吗？不是=FAIL。

## P0 判定条件

- 出现皇家符号（五爪龙/琉璃黄瓦）在非宫殿场景
- 出现宗教符号（佛像/卍字）在非宗教场景
- 传统纹样占比 > 20%（国潮贴图感）
- AI国风感评分 > 0.7
- 出现西方符号（教堂尖顶/哥特窗）
- 环状颗粒感检测阳性（同心圆环/油斑）
- 塑料油润感检测阳性（皮肤光滑无毛孔/材质油画反光）
- 数码过拟合味检测阳性（边缘过冲/色带/过度锐化）
- CFG > 7（SDXL/SD1.5）或 > 3（Flux）
- 步数 > 50 或 < 20

## P1 判定条件

- 传统纹样占比 10-20%
- AI国风感评分 0.5-0.7
- 建筑等级轻微不匹配
- CFG 5.5-7（偏高但未超限）
- 步数 35-50（偏多但未过锐化）
- 胶片颗粒Overlay < 3%（不足）
- 负向提示词缺少部分伪影拦截词

## 示例参考

- **Lumax MJ**：无传统纹样，无人物正面，建筑用剪影，全部低饱和——零俗套
- **晓白ALEX**：暗调月光，人物剪影，无纹样——零俗套
- **反例1**：红色背景+金色祥云纹+毛笔字"中式美学"标题=国潮贴图感 FAIL
- **反例2**：CFG=9, 步数=60, 原生VAE, 一步生成4K=环状颗粒+塑料油润+数码过拟合三连 FAIL
- **正例**：CFG=4.5, DPM++ 2M Karras, 30步, vae-ft-mse, 1024→2K二阶段放大0.3降噪, 胶片颗粒5% Overlay=零AI伪影 PASS

## 与其他规则的关系

- 禁忌检测是所有规则的最后一道门
- 国潮贴图感与 06 色彩 的饱和度直接相关
- 仿古景区感与 09 建筑 的块面剪影原则直接相关
- AI国风感与 04 材料 的真实感原则直接相关
- AI伪影消除工程与 04 材料 的微观质感、05 光影 的软阴影直接相关
- 生图参数校验是 07 动势 粒子效果的前置条件（无伪影才谈动效）

## 提示词工程方法论（11卡实证）

**蒸馏来源：** 11张Midjourney 8.2提示词参考卡（四神兽完整prompt卡4张 + 实用关键词手册7页：封面/基础公式/镜头景别/构图视角/光线氛围/真人质感/艺术风格）。聚焦prompt构造纪律，不重复已有视觉原则（构图/色彩/意象已由其他规则覆盖）。

### 6段式提示词构造公式

所有Midjourney prompt按6段顺序组织，段间用逗号分隔，参数统一放最后：

| 段 | 名称 | 回答的问题 | 示例词 |
|---|---|---|---|
| 01 | 主体 | 谁或什么 | 宋代女子 / 巨型火焰朱雀 / 白色异形剑齿虎 |
| 02 | 场景 | 在哪里 | 坐在廊下 / 高速飞越云海 / 中景云海之中 |
| 03 | 构图 | 景别与视角 | 近景三分之四视角 / 超广角极端仰视 / 广角构图 |
| 04 | 光线 | 方向与色温 | 暖金侧光 / 左侧金色逆光穿透云层 / 黄昏金橙色逆光 |
| 05 | 质感 | 照片、电影或绘画 | 电影胶片摄影 / 真实摄影质感 / 电影级幻想概念艺术 |
| 06 | 参数 | 统一放在最后 | --ar 3:4 --raw --s 100 / --ar 16:9 --stylize 350 --hd --v 8.2 |

**关键纪律：** 先确定景别，再描述人物和环境。短而准确，比堆满形容词更稳定。

### 中式神话题材prompt范式（四神兽实证）

从朱雀/白虎/青龙/玄武四张完整prompt卡提炼的中式神话构造规律：

1. **主体描述层**：先给神兽定性（"巨型火焰朱雀"、"白色异形剑齿虎"、"上古东方神龙"、"北天镇界神兽龟蛇合体"），再展开材质细节（苍青玉鳞鎏金描边 / 剑齿外露骨甲尖刺 / 流光火焰包裹 / 爪甲厚重如山岩）
2. **环境叙事层**：云海+天宫仙山+悬浮建筑是标准环境三件套——云海做虚实基底，天宫仙山做文化锚点，悬浮/倒悬建筑制造神性尺度
3. **构图巨物层**：超广角+极端仰视/低空俯冲+前中远景平行，用渺小建筑反衬神兽体量（"用建筑尺度反衬玄武的恐怖体量"）
4. **光线情绪层**：青龙=淡蓝色高空明亮日光（圣洁），朱雀=清晨金色逆光+体积光（辉煌），白虎=黄昏金橙色逆光（神秘），玄武=冷月+北天星河（冷肃压迫）
5. **风格收束层**：统一用"电影级XX + 东方/国风XX + 超高细节"收束，如"电影级幻想概念艺术，东方上古神话，华丽圣洁"
6. **参数规律**：四神兽全部 --ar 16:9 --hd --v 8.2，--stylize 在200-350之间（白虎200偏写实，朱雀/青龙/玄武350偏幻想）

### 反塑料感prompt技巧

**核心原则：4K/8K/HD只是画质描述，不能替代具体的皮肤、镜头与光线语言。**

| 维度 | 塑料感写法（禁用） | 反塑料感写法（推荐） |
|---|---|---|
| 皮肤 | 光滑皮肤 / beautiful face | realistic skin texture（真实皮肤纹理）、subtle pores（细微毛孔）、natural skin translucency（自然通透感）、natural facial asymmetry（自然面部差异）、unretouched editorial portrait（未经磨皮的人像） |
| 镜头 | sharp focus / high resolution | shallow depth of field（浅景深）、natural lens bloom（自然镜头柔光）、35mm/50mm/85mm/100mm macro 具体焦段 |
| 光线 | cinematic lighting（笼统） | 写清方向、软硬与色温——backlighting（逆光）、rim light（轮廓光）、soft diffused light（柔和漫射光）、Rembrandt lighting（伦勃朗光）、volumetric light（体积光）、golden hour（黄金时刻） |
| 质感 | best quality / masterpiece | candid photography（抓拍感）、documentary photography（纪实摄影）、cinematic film still（电影剧照）、subtle film grain（轻微胶片颗粒）、analog film aesthetic（胶片美学） |

**万能反塑料短语：** `beautiful but unretouched`（想要美女但不塑料时直接加这句）

### Prompt纪律（三条铁律）

1. **风格词选1-2个即可，过多容易互相冲突。** 不要同时堆"杂志摄影+纪实+电影剧照+艺术摄影+胶片美学"——选一个最贴合情绪的。
2. **优先描述视觉特征，不必堆叠艺术家姓名。** 说"浅景深+逆光+胶片颗粒"比说"by Annie Leibovitz by Peter Lindbergh"更可控。
3. **短而准确比堆满形容词更稳定。** 示例："宋代女子，坐在廊下，近景三分之四视角，暖金侧光，电影胶片摄影 --ar 3:4 --raw --s 100"——6段齐全，每段一个核心词，不堆形容词。

### 摄影语言词汇表（可直接用于prompt）

**景别（Shot Size）——先定景别再描述内容：**
- Extreme close-up（局部特写）/ Close-up（面部特写）/ Medium close-up（胸部以上）/ Medium shot（腰部以上）/ Full-body shot（完整全身）/ Wide shot（人物与环境）/ Extreme wide shot（超远景大场面）

**镜头焦段（Lens Choice）：**
- 35mm（环境叙事）/ 50mm（自然视角）/ 85mm（经典人像）/ 100mm macro（微距细节）

**视角（Camera Angle）：**
- Eye-level view（平视）/ High-angle view（俯视）/ Low-angle view（仰视）/ Bird's-eye view（鸟瞰）/ Overhead shot（正上方俯拍）/ Worm's-eye view（贴地仰拍）/ Three-quarter view（四分之三视角）/ Over-the-shoulder（越肩视角）/ Point-of-view shot（主观视角）
- 想要正脸：near-frontal three-quarter view

**构图秩序（Composition Order）：**
- Centered composition（中心构图）/ Rule of thirds（三分法）/ Symmetrical composition（对称构图）/ Leading lines（引导线）/ Layered composition（前中后景层次）

**光线（Lighting）——写清方向、软硬与色温：**
- Natural light（自然光）/ Golden hour（黄金时刻）/ Soft diffused light（柔和漫射光）/ Side lighting（侧光）/ Backlighting（逆光）/ Rim light（轮廓光）/ Soft reflected light（柔和反射光）/ Rembrandt lighting（伦勃朗光）/ Volumetric light（体积光）/ Chiaroscuro（明暗对照）

**氛围控制（Atmosphere）：**
- Warm color temperature（暖色温）/ Cool color temperature（冷色温）/ Low contrast（低反差柔和感）/ High contrast（高反差戏剧感）/ Atmospheric haze（空气雾感）

**皮肤与面部（Skin & Face）：**
- realistic skin texture（真实皮肤纹理）/ subtle pores（细微毛孔）/ natural skin translucency（自然通透感）/ natural facial asymmetry（自然面部差异）/ unretouched editorial portrait（未经磨皮的人像）

**摄影质感（Photographic Texture）：**
- candid photography（抓拍感）/ documentary photography（纪实摄影）/ cinematic film still（电影剧照）/ shallow depth of field（浅景深）/ natural lens bloom（自然镜头柔光）/ subtle film grain（轻微胶片颗粒）

**艺术风格（Art Style）——选1-2个：**
- 摄影电影：editorial photography（杂志摄影）/ documentary photography（纪实摄影）/ cinematic film still（电影剧照）/ fine-art photography（艺术摄影）/ analog film aesthetic（胶片美学）
- 绘画视觉：classical realism（古典写实）/ impressionism（印象主义）/ Chinese ink wash（中国水墨）/ watercolor painting（水彩画）/ art nouveau（新艺术）/ surrealism（超现实主义）/ minimalism（极简主义）/ brutalism（粗野主义）/ retrofuturism（复古未来主义）/ cyberpunk（赛博朋克）
