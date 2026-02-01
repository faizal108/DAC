// Internal unit scale: 1mm = 1000um
export const UNIT_SCALE = 1000;

// Tolerance in internal units (10um = 0.01mm)
export const EPS = 10;

/**
 * Convert external (mm) value to internal integer (um)
 */
export function toInternal(valueMm) {
  if (!Number.isFinite(valueMm)) {
    throw new Error("Invalid numeric value");
  }

  return Math.round(valueMm * UNIT_SCALE);
}

/**
 * Convert internal (um) to external (mm)
 */
export function toExternal(valueUm) {
  return valueUm / UNIT_SCALE;
}

/**
 * Compare two internal numbers with tolerance
 */
export function approxEqual(a, b, eps = EPS) {
  return Math.abs(a - b) <= eps;
}

/**
 * Clamp a value between min and max
 */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
