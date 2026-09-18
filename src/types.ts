export interface DesignParams {
  sceneType?: string;
  voidRatio: number; // 0 - 1
  colors: string[];
  colorHierarchy: {
    main: number;
    secondary: number;
    accent: number;
    bg: number;
  };
  brightnessRatio: number; // e.g. 4
  lightAngle: number; // e.g. 135
  buildingToHumanRatio: number; // e.g. 10
  aspectRatio: number; // e.g. 1.414
  hasIncompleteFraming: boolean;
  hasProgression: boolean;
  hasScaleAnchor: boolean;
  hasGodRay: boolean;
  hasSoftShadow: boolean;
  darkPartHasColor: boolean;
  hasPatina: boolean;
  spatialLayers: number;
  axisOffsetPercent: number; // e.g. 5
  materials: Array<{
    type: string;
    variant: string;
    areaRatio: number;
  }>;
  animations?: Array<{
    target: string;
    easing: string;
    duration: number;
    loop: boolean;
  }>;
  aiParams?: {
    cfg: number;
    steps: number;
    sampler: string;
    prompt: string;
  };
}

export interface AestheticTerm {
  id: string;
  title: string;
  en: string;
  aliases: string[];
  layer: string;
  plain: string;
  say: string;
  trap: string;
  pairs: string[];
  trigger: string[];
}
