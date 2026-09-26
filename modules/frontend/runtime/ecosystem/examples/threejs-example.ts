/**
 * examples/threejs-example.ts — 禅意风格 DC 计划 → Three.js 场景配置
 *
 * 运行：npx tsx examples/threejs-example.ts
 *
 * 演示：把东方材料（纸 / 木 / 瓷 / 墨）+ 禅意光影 + 极简氛围
 *       投影为 Three.js 可直接初始化的 materials / lights / scene 配置。
 */
import {
  planToThreeJS,
  type ThreeJSEcosystemPlan,
} from "../plan-to-threejs.ts";

const zenPlan: ThreeJSEcosystemPlan = {
  style: "chan-minimal",
  lightMood: "zen-shadow",
  lightColor: "#F2EDE0",
  materials: [
    { id: "floor", kind: "paper", color: "#E8E6E1" },
    { id: "pillar", kind: "wood", color: "#5B4636" },
    { id: "vase", kind: "porcelain", color: "#C9D6D9" },
    { id: "inkstone", kind: "ink", color: "#22223A" },
  ],
};

const config = planToThreeJS(zenPlan);

console.log("=== 禅意 → Three.js 场景配置 ===");
console.log("Scene 背景：", config.scene.background, "| 环境强度：", config.scene.environmentIntensity);
console.log("雾效：", config.scene.fog ? `${config.scene.fog.color} near=${config.scene.fog.near} far=${config.scene.fog.far}` : "无");

console.log("\n--- 材质 ---");
for (const m of config.materials) {
  console.log(
    `  [${m.kind}] ${m.id}: color=0x${m.params.color?.toString(16)} roughness=${m.params.roughness} metalness=${m.params.metalness}`,
  );
}

console.log("\n--- 光源（禅意阴影）---");
for (const l of config.lights) {
  console.log(
    `  ${l.type} ${l.name}: intensity=${l.intensity} color=${l.color} position=${l.position?.join(",") ?? "n/a"}`,
  );
}

console.log("\n=== 完整配置 JSON（截断预览）===");
console.log(JSON.stringify(config, null, 2).slice(0, 500) + "\n...");
