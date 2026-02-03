import { toInternal, toExternal, approxEqual } from "../utils/numbers.js";

/**
 * Create a normalized internal point
 * Input in mm, stored in um (int)
 */
export function createPoint(xMm, yMm) {
  const x = toInternal(xMm);
  const y = toInternal(yMm);

  return Object.freeze({
    type: "POINT", // ✅ ADD THIS
    x,
    y,
  });
}

/**
 * Create point directly from internal units
 */
export function createPointInternal(xUm, yUm) {
  if (!Number.isInteger(xUm) || !Number.isInteger(yUm)) {
    throw new Error("Internal coordinates must be integers");
  }

  return Object.freeze({
    type: "POINT", // ✅ ADD THIS
    x: xUm,
    y: yUm,
  });
}

/**
 * Distance between two internal points (returns um)
 */
export function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

/**
 * Compare two points with tolerance
 */
export function equals(p1, p2, eps) {
  return approxEqual(p1.x, p2.x, eps) && approxEqual(p1.y, p2.y, eps);
}

/**
 * Convert internal point to display (mm)
 */
export function toDisplay(point) {
  return {
    x: toExternal(point.x),
    y: toExternal(point.y),
  };
}
