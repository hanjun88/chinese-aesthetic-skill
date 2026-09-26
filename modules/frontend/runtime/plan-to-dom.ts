/**
 * plan-to-dom.ts — 接口契约 B：RuntimeExecutionPlan → DomComponentPlan
 *
 * 纯 mapper，镜像 DC compiler-core/three-js-scene-mapper.ts 的风格：
 * 不发明默认值、业务失败抛 MapperError；hex/ratio 直接写进 CSS 变量，
 * **不在运行时二次降饱和**（S≤50% 在 sheet 侧已钉死）。
 *
 * 对齐 docs/fusion-architecture.md §2.2：
 *   - 6 组件（月洞门/卷轴/屏风/花窗/匾额/博古架）逐字段映射；
 *   - resolveTokens()：DC 计划字段 → tokens.css 语义槽。
 *
 * @module modules/frontend/runtime/plan-to-dom
 */

import type {
  CangjieEstimatedParameter,
  RuntimeExecutionPlan,
} from "./types/dc-types.ts";
import type {
  DomComponentInstance,
  DomComponentPlan,
  RendererChannel,
  ResolvedMotion,
} from "./types/dom-component-plan.ts";
import type { CanonicalDimensionId } from "./dimension-registry.ts";

/** mapper 错误 */
export class MapperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapperError";
  }
}

/** plan-to-dom 输入：G3 计划 + G2 后已验证的扁平参数 */
export interface PlanToDomInput {
  plan: RuntimeExecutionPlan;
  /** G2 补丁后的 validated parameters（用来取色值/比例） */
  validatedParams: CangjieEstimatedParameter[];
  testCaseId: string;
}

/* ------------------------------------------------------------------ *
 * 参数取值工具
 * ------------------------------------------------------------------ */

function pickParam(params: CangjieEstimatedParameter[], path: string): CangjieEstimatedParameter {
  const hit = params.find((p) => p.path === path);
  if (!hit) throw new MapperError(`[plan-to-dom] 缺少已验证参数: ${path}`);
  return hit;
}

function num(params: CangjieEstimatedParameter[], path: string): number {
  return Number(pickParam(params, path).value);
}

function hex(params: CangjieEstimatedParameter[], path: string): string {
  return String(pickParam(params, path).value);
}

/* ------------------------------------------------------------------ *
 * resolveTokens：DC 计划字段 → tokens.css 语义槽（§2.2 桥接表）
 * ------------------------------------------------------------------ */

/**
 * tokens.css 桥接：把已验证参数投影为 :root 语义变量。
 * 纯函数，不做任何 color-mix 降饱和。
 */
export function resolveTokens(
  params: CangjieEstimatedParameter[],
): Record<string, string> {
  const root: Record<string, string> = {};

  // color.dominant → --color-bg（月白底 60-70%）
  root["--color-bg"] = hex(params, "/color/dominant/value");
  // color.secondary → --color-text（黛青 20-30%）
  root["--color-text"] = hex(params, "/color/secondary/value");
  // color.accent → --color-accent（古金 ≤8%）
  root["--color-accent"] = hex(params, "/color/accent/value");

  // negativeSpaceRatio(0..1) → --space-* 倍数（0.45→6m 大节留白）
  const nsr = num(params, "/composition/negativeSpaceRatio/value");
  root["--space-leak-mult"] = String(nsr.toFixed(2));
  root["--space-proportion"] = nsr >= 0.45 ? "var(--space-4xl)" : nsr >= 0.38 ? "var(--space-3xl)" : "var(--space-2xl)";

  // lighting.colorTemp → 阴影三套（天光/月光/漏光）
  const cct = num(params, "/lighting/keyLight/colorTemp/value");
  root["--shadow-token"] = cct >= 6800 ? "--shadow-moon" : cct <= 3800 ? "--shadow-leak" : "--shadow-skylight";

  // roughness → 屏风/博古架半透 opacity（越粗糙越不透明）
  const rough = num(params, "/materials/0/roughness/value");
  root["--material-opacity"] = String(Math.min(1, Math.max(0.35, rough)).toFixed(2));

  return root;
}

/* ------------------------------------------------------------------ *
 * 动效解析：cameraRig.params.motion → ResolvedMotion
 * ------------------------------------------------------------------ */

const EASE_BY_PROTO: Record<string, ResolvedMotion["easingToken"]> = {
  cloud: "--ease-cloud",
  water: "--ease-water",
  smoke: "--ease-smoke",
  wind: "--ease-wind",
  light: "--ease-breath",
};

function resolveMotion(plan: RuntimeExecutionPlan): ResolvedMotion | undefined {
  const motion = plan.runtimePlan.sceneBindings.cameraRig.params.motion as
    | { proto?: string; durationMs?: [number, number]; amplitude?: number }
    | undefined;
  if (!motion || !motion.proto) return undefined;
  const proto = motion.proto as ResolvedMotion["prototype"];
  const duration = motion.durationMs?.[1] ?? 1500;
  return {
    prototype: proto,
    durationMs: duration,
    easingToken: EASE_BY_PROTO[proto] ?? "--ease-cloud",
    amplitude: motion.amplitude ?? 0.05,
  };
}

/* ------------------------------------------------------------------ *
 * 6 组件装配（§2.2 表）
 * ------------------------------------------------------------------ */

interface ComponentSpec {
  kind: DomComponentInstance["kind"];
  prefix: DomComponentInstance["prefix"];
  order: number;
  drivenBy: CanonicalDimensionId[];
}

const COMPONENT_SPECS: ComponentSpec[] = [
  { kind: "moon-gate", prefix: "mg", order: 1, drivenBy: ["void-solid", "interaction"] },
  { kind: "scroll-panel", prefix: "sp", order: 2, drivenBy: ["motion", "temporal"] },
  { kind: "folding-screen", prefix: "fs", order: 3, drivenBy: ["material", "void-solid"] },
  { kind: "lattice-window", prefix: "lw", order: 4, drivenBy: ["light", "spatial-order"] },
  { kind: "plaque", prefix: "pl", order: 5, drivenBy: ["interaction", "color"] },
  { kind: "curio-shelf", prefix: "cs", order: 6, drivenBy: ["void-solid", "material"] },
];

function buildComponents(
  input: PlanToDomInput,
  rootVars: Record<string, string>,
  globalMotion: ResolvedMotion | undefined,
): DomComponentInstance[] {
  const { plan, validatedParams: params } = input;
  const secondary = hex(params, "/color/secondary/value");
  const accent = hex(params, "/color/accent/value");
  const rough = num(params, "/materials/0/roughness/value");
  const nsr = num(params, "/composition/negativeSpaceRatio/value");

  return COMPONENT_SPECS.map((spec): DomComponentInstance => {
    const base: DomComponentInstance = {
      kind: spec.kind,
      prefix: spec.prefix,
      order: spec.order,
      cssVars: {},
      drivenBy: spec.drivenBy,
    };

    switch (spec.kind) {
      case "moon-gate":
        // 门框黛青（secondary），state 闭合，呼吸光
        base.cssVars["--color-border-strong"] = secondary;
        base.state = { open: false };
        base.motion = {
          prototype: "light",
          durationMs: globalMotion?.durationMs ?? 8000,
          easingToken: "--ease-breath",
          amplitude: 0.04,
        };
        break;

      case "scroll-panel":
        // 展卷有重量（water 原型），横向展开
        base.motion = globalMotion?.prototype === "water" ? globalMotion : {
          prototype: "water",
          durationMs: 3500,
          easingToken: "--ease-water",
          amplitude: 10,
        };
        base.state = { orientation: "horizontal", expanded: false };
        break;

      case "folding-screen":
        // 半透材质由 roughness 决定 opacity
        base.cssVars["--color-surface"] = rootVars["--color-bg"];
        base.cssVars["--screen-opacity"] = String(Math.min(0.9, Math.max(0.35, rough)).toFixed(2));
        base.state = { folded: false };
        break;

      case "lattice-window":
        // 漏光色 + 三层视差 0.2/0.5/1.0
        base.cssVars["--color-shadow-leak"] = accent;
        base.state = { parallaxLayers: [0.2, 0.5, 1.0], lattice: "step" };
        break;

      case "plaque":
        // 居中题眼，古金线，IO 阈值 0.4
        base.cssVars["--color-accent"] = accent;
        base.state = { landed: false, sealed: false, observerThreshold: 0.4 };
        break;

      case "curio-shelf":
        // 虚实格距由负空间比决定
        base.cssVars["--space-cell"] = nsr >= 0.45 ? "var(--space-3xl)" : "var(--space-2xl)";
        base.state = { hoverLift: "-4px" };
        break;
    }
    return base;
  });
}

/* ------------------------------------------------------------------ *
 * 主入口
 * ------------------------------------------------------------------ */

/**
 * 把 G3 RuntimeExecutionPlan + 已验证参数投影为 DOM 装配计划。
 *
 * @throws MapperError 当必需参数缺失时
 */
export function planToDom(input: PlanToDomInput): DomComponentPlan {
  const { plan, validatedParams: params, testCaseId } = input;

  // 必需参数存在性校验（不发明默认值）
  for (const path of [
    "/color/dominant/value",
    "/color/secondary/value",
    "/color/accent/value",
    "/composition/negativeSpaceRatio/value",
    "/lighting/keyLight/colorTemp/value",
    "/materials/0/roughness/value",
  ]) {
    pickParam(params, path); // 缺失即抛 MapperError
  }

  const rootCssVars = resolveTokens(params);
  const globalMotion = resolveMotion(plan);
  const components = buildComponents(input, rootCssVars, globalMotion);

  // negotiation.selectedTier → 渲染通道
  const renderer: RendererChannel =
    plan.negotiation.selectedTier === "A"
      ? "WebGL2Renderer"
      : plan.negotiation.selectedTier === "B"
        ? "WebGL1Renderer"
        : "DOMCanvas"; // C 档降级到 DOM 组件

  return {
    planId: plan.planId,
    testCaseId,
    links: { ...plan.hashes },
    renderer,
    downgrades: plan.negotiation.downgrades,
    components,
    rootCssVars,
  };
}
