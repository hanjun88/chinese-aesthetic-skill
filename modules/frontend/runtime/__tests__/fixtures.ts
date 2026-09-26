/**
 * fixtures.ts — 测试共用的合法 AestheticConstraintSheet 与 Cangjie 参数夹具
 */
import type { AestheticConstraintSheet } from "../types/aesthetic-sheet.ts";
import type { CangjieEstimatedParameter } from "../types/dc-types.ts";

/** 一份通过 G1 requiredPaths 校验的合法 sheet */
export function makeValidSheet(overrides: Partial<AestheticConstraintSheet> = {}): AestheticConstraintSheet {
  return {
    sheetId: "test-sheet",
    designBrief: "测试书院入口",
    mood: "song-elegant",
    attributionStatement: "测试用归因。",
    structuralDimensions: [
      { id: "void-solid", weight: "primary" },
      { id: "spatial-order", weight: "primary" },
      { id: "motion", weight: "tertiary" },
      { id: "philosophy", weight: "tertiary" },
    ],
    colorSystem: {
      palette: [
        { role: "dominant", name: "月白", hex: "#EDEAE4", hsl: "", areaPct: 0.65, usage: "bg" },
        { role: "secondary", name: "黛青", hex: "#2C3E50", hsl: "", areaPct: 0.25, usage: "text" },
        { role: "accent", name: "哑金", hex: "#B8860B", hsl: "", areaPct: 0.05, usage: "accent" },
        { role: "shadow", name: "墨黛", hex: "#1A1A2E", hsl: "", areaPct: 0.05, usage: "shadow" },
      ],
      saturationMax: 0.5,
      hardFailHex: ["#FF0000", "#FFD700", "#000000", "#00FFFF"],
    },
    proportion: { baseModulePx: 8, spacingScale: [1, 2, 3, 4, 6, 8], voidSolidRatio: "7:5", focalPointsMax: 1 },
    spatial: { axis: "strict", bays: 3, hierarchyLevelsMin: 3 },
    lighting: { primarySource: "skylight", timeSetting: "cloudy", lightDarkRatio: "3:7" },
    motion: { prototypes: ["light", "cloud"], durationMs: [1500, 8000], entryMode: "emerge", hardFail: ["bounce", "particle"] },
    antiCliche: { scanned: true, hardFailHits: [], forbidden: ["国潮贴图感"] },
    violations: [],
    score: 88,
    ...overrides,
  };
}

/** 一份最小合法的 validated 参数集（plan-to-dom 所需路径齐全） */
export function makeValidParams(): CangjieEstimatedParameter[] {
  const mk = (path: string, value: unknown, unit = "scalar"): CangjieEstimatedParameter => ({
    path, value, unit, confidence: 0.9, status: "estimated",
    source: { type: "expert-judgment", ref: "test" },
    calibration: { method: "test", status: "PRODUCTION" },
  });
  return [
    mk("/color/dominant/value", "#EDEAE4", "hex"),
    mk("/color/secondary/value", "#2C3E50", "hex"),
    mk("/color/accent/value", "#B8860B", "hex"),
    mk("/composition/negativeSpaceRatio/value", 0.58, "ratio"),
    mk("/composition/symmetry/value", 1, "ratio"),
    mk("/composition/depthLayerCount/value", 3, "scalar"),
    mk("/composition/focalPoint/value", [0.5, 0.5], "vector2"),
    mk("/lighting/keyLight/azimuth/value", 0, "degrees"),
    mk("/lighting/keyLight/elevation/value", 78, "degrees"),
    mk("/lighting/keyLight/colorTemp/value", 5600, "kelvin"),
    mk("/lighting/ambientRatio/value", 0.7, "ratio"),
    mk("/materials/0/baseType/value", "aged-paper-wood"),
    mk("/materials/0/roughness/value", 0.72),
    mk("/materials/0/metalness/value", 0.04),
    mk("/materials/0/wear/value", 0.32),
    mk("/camera/fov/value", 35, "degrees"),
    mk("/camera/shotSize/value", "medium"),
    mk("/camera/angle/value", 0, "degrees"),
    mk("/camera/height/value", 1.6),
  ];
}
