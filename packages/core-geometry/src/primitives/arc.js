import { EPS } from "../utils/numbers.js";

const TWO_PI = Math.PI * 2;

function normalizeAngle(a) {
  a = a % TWO_PI;
  if (a < 0) a += TWO_PI;
  return a;
}

/**
 * Create arc
 */
export function createArc(
  center,
  radiusUm,
  startAngle,
  endAngle,
  clockwise = false,
) {
  if (radiusUm <= EPS) {
    throw new Error("Invalid arc radius");
  }

  const s = normalizeAngle(startAngle);
  const e = normalizeAngle(endAngle);

  if (Math.abs(s - e) < 1e-9) {
    throw new Error("Degenerate arc");
  }

  return Object.freeze({
    type: "ARC",
    center,
    radius: radiusUm,
    startAngle: s,
    endAngle: e,
    clockwise: !!clockwise,
  });
}

export function isAngleOnArc(angle, arc) {
  angle = normalizeAngle(angle);

  let s = arc.startAngle;
  let e = arc.endAngle;

  if (!arc.clockwise) {
    if (s <= e) return angle >= s && angle <= e;
    return angle >= s || angle <= e;
  } else {
    if (e <= s) return angle <= s && angle >= e;
    return angle <= s || angle >= e;
  }
}
