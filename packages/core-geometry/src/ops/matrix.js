import { toInternal } from "../utils/numbers.js";

/**
 * Identity matrix
 */
export function identity() {
  return [1, 0, 0, 1, 0, 0];
}

/**
 * Translation matrix (mm)
 */
export function translate(dxMm, dyMm) {
  const dx = toInternal(dxMm);
  const dy = toInternal(dyMm);

  return [1, 0, 0, 1, dx, dy];
}

/**
 * Scale matrix
 */
export function scale(sx, sy = sx) {
  return [sx, 0, 0, sy, 0, 0];
}

/**
 * Rotation matrix (radians)
 */
export function rotate(theta) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);

  return [c, s, -s, c, 0, 0];
}

/**
 * Multiply two matrices
 */
export function multiply(m1, m2) {
  const [a1, b1, c1, d1, tx1, ty1] = m1;
  const [a2, b2, c2, d2, tx2, ty2] = m2;

  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,

    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,

    a1 * tx2 + c1 * ty2 + tx1,
    b1 * tx2 + d1 * ty2 + ty1,
  ];
}

/**
 * Invert matrix
 */
export function invert(m) {
  const [a, b, c, d, tx, ty] = m;

  const det = a * d - b * c;

  if (Math.abs(det) < 1e-12) {
    throw new Error("Non-invertible matrix");
  }

  const inv = 1 / det;

  return [
    d * inv,
    -b * inv,

    -c * inv,
    a * inv,

    (c * ty - d * tx) * inv,
    (b * tx - a * ty) * inv,
  ];
}
