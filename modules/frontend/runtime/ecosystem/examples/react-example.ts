/**
 * examples/react-example.ts — 生成 6 个东方美学 React 组件
 *
 * 运行：npx tsx examples/react-example.ts
 *
 * 演示：把唐韵华丽调色板投影为 6 个自包含 React 函数组件源码字符串，
 *       每个组件含完整 props 类型、内联 CSS-in-JS、children、aria 无障碍属性。
 */
import {
  planToReactComponents,
} from "../plan-to-react.ts";

const tangComponents = planToReactComponents({
  style: "tang-ornate",
  palette: {
    bg: "#2A1E1A",
    ink: "#F0E6D2",
    accent: "#C93B3E",
    paper: "#3A2A22",
  },
});

console.log("=== 唐韵 → 6 个 React 组件 ===");
console.log("已生成组件：");
for (const c of tangComponents.components) {
  console.log(`  - ${c.name} (${c.kind})  props=${c.propsInterface.split("\n").length - 2} 字段`);
}

console.log("\n=== 桶文件 index.ts ===");
console.log(tangComponents.barrel);

console.log("\n=== 示例：PlaqueTitle 组件完整源码 ===");
const plaque = tangComponents.components.find((c) => c.kind === "plaque")!;
console.log(plaque.componentCode);

console.log("\n=== 使用示例 ===");
console.log(plaque.usage);
