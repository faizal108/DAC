import { EPS, approxEqual } from "../utils/numbers.js";

/**
 * Line segment intersection
 */
export function intersectLineLine(l1, l2, eps = EPS) {
  const x1 = l1.start.x;
  const y1 = l1.start.y;
  const x2 = l1.end.x;
  const y2 = l1.end.y;

  const x3 = l2.start.x;
  const y3 = l2.start.y;
  const x4 = l2.end.x;
  const y4 = l2.end.y;

  const dx1 = x2 - x1;
  const dy1 = y2 - y1;
  const dx2 = x4 - x3;
  const dy2 = y4 - y3;

  const denom = dx1 * dy2 - dy1 * dx2;

  // Parallel
  if (Math.abs(denom) <= eps) {
    return [];
  }

  const t = ((x3 - x1) * dy2 - (y3 - y1) * dx2) / denom;

  const u = ((x3 - x1) * dy1 - (y3 - y1) * dx1) / denom;

  if (t < -eps || t > 1 + eps) return [];
  if (u < -eps || u > 1 + eps) return [];

  const ix = x1 + t * dx1;
  const iy = y1 + t * dy1;

  return [
    {
      x: Math.round(ix),
      y: Math.round(iy),
    },
  ];
}
