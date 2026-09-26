/**
 * compute-composition.js — Canonical composition derivation (SSOT).
 *
 * Single source of truth for deriving canonical composition fields
 * (negativeSpaceRatio, symmetry, focalPoint) from raw sheet inputs.
 * Both TS type system and plain-JS demo generator import from here.
 */
export function computeComposition(voidSolidRatio, spatialAxis, focalPointsMax) {
  const [voidPart, solidPart] = String(voidSolidRatio).split(":").map(Number);
  const negativeSpaceRatio = Number((voidPart / (voidPart + solidPart)).toFixed(4));
  const symmetry = spatialAxis === "strict" ? 1 : spatialAxis === "offset" ? 0.5 : 0.15;
  const focalPoint =
    spatialAxis === "strict" && focalPointsMax <= 1
      ? [0.62, 0.38]
      : spatialAxis === "offset"
        ? [0.38, 0.5]
        : [0.5, 0.5];
  return { negativeSpaceRatio, symmetry, focalPoint };
}
