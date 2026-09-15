# ACT0 材质参数表

## Three.js / PBR 材质规范

| 材质 | 类型 | Color | Roughness | Metalness | 贴图 | 说明 |
|---|---|---|---|---|---|---|
| **门（木）** | MeshStandardMaterial | #8B4513 | 0.6 | 0.0 | map=wood.jpg, normalMap=wood_normal.jpg | 深色木纹，表面半光，无金属光泽 |
| **屋檐（檐板）** | MeshStandardMaterial | #C28840 | 0.7 | 0.0 | map=eave_wood.jpg | 木质屋檐，反射小，底部镶浅灰梁枋 |
| **地面（石）** | MeshStandardMaterial | #A9A9A9 | 0.9 | 0.0 | map=stone.jpg, normalMap=stone_normal.jpg | 青石板纹理，略显磨损，高粗糙度 |
| **云雾粒子** | PointsMaterial / ShaderMaterial | #FFFFFF | - | - | size=2-8, opacity=0.5, transparent=true, depthWrite=false | 半透明白粒子，大小变动，体积感 |
| **金色粒子** | PointsMaterial | #FFD700→#DAA520 | - | - | size=1-3, opacity=0.8, transparent=true | 小型金色粒子（落尘），随滚动缓慢移动 |
| **底座/栏杆** | MeshStandardMaterial | #4B4B4B | 0.85 | 0.0 | map=dark_stone.jpg | 深色青石材质，表面可有苔藓渐变贴图 |
| **体积雾** | ShaderMaterial / FogExp2 | #E8E4D9 | - | - | density=0.02, transparent=true | 场景级体积雾，增加纵深 |

## 材质详细参数

### 门（Wood）
```javascript
const doorMaterial = new THREE.MeshStandardMaterial({
  color: 0x8B4513,
  roughness: 0.6,
  metalness: 0.0,
  map: woodTexture,        // 木纹贴图，repeat (2,1)
  normalMap: woodNormal,   // 木纹法线，scale (0.3, 0.3)
  aoMap: woodAO,           // 环境光遮蔽
  envMapIntensity: 0.3     // 低环境反射
});
```

### 地面（Stone）
```javascript
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0xA9A9A9,
  roughness: 0.9,
  metalness: 0.0,
  map: stoneTexture,       // 青石板贴图，repeat (4,4)
  normalMap: stoneNormal,  // 石板法线，scale (0.5, 0.5)
  displacementMap: stoneDisp, // 轻微凹凸，scale 0.05
  envMapIntensity: 0.1
});
```

### 云雾（Cloud Volume）
```javascript
const cloudMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xFFFFFF) },
    opacity: { value: 0.5 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying float vNoise;
    uniform float time;
    // 噪声函数...
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vNoise;
    uniform vec3 color;
    uniform float opacity;
    void main() {
      float alpha = smoothstep(0.3, 0.7, vNoise) * opacity;
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide
});
```

### 金色粒子（Gold Dust）
```javascript
const goldDustMaterial = new THREE.PointsMaterial({
  color: 0xDAA520,
  size: 2,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
```

## 材质禁忌

| 禁忌 | 说明 |
|---|---|
| 塑料感门 | roughness < 0.3 且 metalness < 0.1 = 塑料感 FAIL |
| 亮金 | #FFD700 满铺 = 廉价感，必须用 #DAA520 哑金且面积 ≤2% |
| 光滑地面 | roughness < 0.5 = 现代地砖感，必须 ≥0.8 |
| 金属门 | metalness > 0.3 = 现代金属门，必须 0.0 |
| 纯白云雾 | #FFFFFF 无渐变 = 假云，必须有 #E8E4D9 月白渐变 |

## 贴图资源建议

| 贴图 | 来源 | 规格 |
|---|---|---|
| wood.jpg | 实木纹理照片/绘制 | 2048×2048, seamless |
| wood_normal.jpg | 从 wood.jpg 生成 | 2048×2048 |
| stone.jpg | 青石板纹理照片 | 2048×2048, seamless |
| stone_normal.jpg | 从 stone.jpg 生成 | 2048×2048 |
| eave_wood.jpg | 旧木梁纹理 | 1024×1024 |
| dark_stone.jpg | 深色青石纹理 | 1024×1024 |
| moss_gradient.png | 苔藓渐变（底部深绿→顶部透明） | 512×512 |
