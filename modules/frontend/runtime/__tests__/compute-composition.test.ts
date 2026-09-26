import { test } from "node:test";
import assert from "node:assert/strict";
import { computeComposition } from "../types/aesthetic-sheet.ts";

test("computeComposition: strict axis + single focal → golden-ratio anchor [0.62, 0.38]", () => {
  const result = computeComposition({
    proportion: { voidSolidRatio: "7:5", focalPointsMax: 1 },
    spatial: { axis: "strict", bays: 3 },
  });
  assert.equal(result.negativeSpaceRatio, 0.5833);
  assert.equal(result.symmetry, 1);
  assert.deepEqual(result.focalPoint, [0.62, 0.38]);
});

test("computeComposition: offset axis → [0.38, 0.5], symmetry 0.5", () => {
  const result = computeComposition({
    proportion: { voidSolidRatio: "6:4", focalPointsMax: 2 },
    spatial: { axis: "offset", bays: 3 },
  });
  assert.equal(result.negativeSpaceRatio, 0.6);
  assert.equal(result.symmetry, 0.5);
  assert.deepEqual(result.focalPoint, [0.38, 0.5]);
});

test("computeComposition: hidden/free axis → center [0.5, 0.5], symmetry 0.15", () => {
  const result = computeComposition({
    proportion: { voidSolidRatio: "1:1", focalPointsMax: 3 },
    spatial: { axis: "hidden", bays: 3 },
  });
  assert.equal(result.negativeSpaceRatio, 0.5);
  assert.equal(result.symmetry, 0.15);
  assert.deepEqual(result.focalPoint, [0.5, 0.5]);
});

test("computeComposition: strict + multi-focal falls back to center (caller should override)", () => {
  const result = computeComposition({
    proportion: { voidSolidRatio: "7:3", focalPointsMax: 2 },
    spatial: { axis: "strict", bays: 3 },
  });
  assert.equal(result.negativeSpaceRatio, 0.7);
  assert.deepEqual(result.focalPoint, [0.5, 0.5]);
});

test("computeComposition: output matches JS utility directly (SSOT no drift)", async () => {
  const { computeComposition: jsImpl } = await import("../utils/compute-composition.js");
  const sheet = { proportion: { voidSolidRatio: "4:6", focalPointsMax: 1 }, spatial: { axis: "strict" as const, bays: 3 } };
  assert.deepEqual(computeComposition(sheet), jsImpl("4:6", "strict", 1));
});
