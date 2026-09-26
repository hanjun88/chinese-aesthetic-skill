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
  buildFigmaExport,
  hexToHsl,
  hexToCssRgb,
  EcosystemError,
  type PlanToFigmaInput,
  type FigmaVariableDefinitions,
  type FigmaRGB,
  type FigmaVariable,
  type FigmaVariableCollection,
  type FigmaPaintStyle,
  type FigmaEffectStyle,
  type FigmaComponentProperty,
  type FigmaEcosystemPlan,
  type FigmaExport,
  type FigmaColorToken,
  type FigmaTextStyle,
  type FigmaLayoutGrid,
  type FigmaAutoLayout,
  type FigmaGradientPaint,
  type AestheticStyleTag,
} from "./plan-to-figma.ts";

export {
  planUniformsToThreeJS,
  planMaterialsToThreeJS,
  planToThreeJS,
  materialKindToThreeParams,
  lightMoodToLights,
  styleToThreeScene,
  hexToThreeColor,
  type ThreeMeshStandardParams,
  type ThreeJSConfig,
  type ThreeJSEcosystemPlan,
  type ThreeMaterialEcosystemSpec,
  type ThreeMaterialKind,
  type ThreeLightEcosystemSpec,
  type ThreeLightMood,
  type ThreeSceneEcosystemSpec,
} from "./plan-to-threejs.ts";

export {
  planToReact,
  planToReactComponents,
  type ReactComponentTemplate,
  type ReactComponents,
  type ReactComponentDef,
  type ReactEcosystemConfig,
  type ReactPalette,
} from "./plan-to-react.ts";
