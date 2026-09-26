/**
 * ecosystem/index.ts — 生态扩展统一入口（§5）
 *
 * 三个外部消费端平级投影：
 *   - plan-to-figma   ValidatedDesignIR + RuntimeExecutionPlan → Figma 变量
 *   - plan-to-threejs materials[].uniforms → Three.js MeshStandardMaterial
 *   - plan-to-react   DomComponentPlan → React 组件模板
 *
 * @module modules/frontend/runtime/ecosystem
 */

export {
  planToFigma,
  hexToFigmaRgb,
  EcosystemError,
  type PlanToFigmaInput,
  type FigmaVariableDefinitions,
  type FigmaRGB,
  type FigmaVariable,
  type FigmaVariableCollection,
  type FigmaPaintStyle,
  type FigmaEffectStyle,
  type FigmaComponentProperty,
} from "./plan-to-figma.ts";

export {
  planUniformsToThreeJS,
  planMaterialsToThreeJS,
  hexToThreeColor,
  type ThreeMeshStandardParams,
} from "./plan-to-threejs.ts";

export {
  planToReact,
  type ReactComponentTemplate,
} from "./plan-to-react.ts";
