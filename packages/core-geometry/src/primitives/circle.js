import { EPS } from "../utils/numbers.js";

/**
 * Create circle
 */
export function createCircle(center, radiusUm) {
  if (!Number.isInteger(radiusUm)) {
    throw new Error("Radius must be integer (um)");
  }

  if (radiusUm <= EPS) {
    throw new Error("Radius too small");
  }

  return Object.freeze({
    type: "CIRCLE",
    center,
    radius: radiusUm,
  });
}
