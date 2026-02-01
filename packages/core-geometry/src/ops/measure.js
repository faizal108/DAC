import { distance } from "../primitives/point.js";

/**
 * Distance in mm
 */
export function measureDistance(p1, p2) {
  return distance(p1, p2) / 1000;
}

/**
 * Angle between two lines (rad)
 */
export function measureAngle(l1, l2) {
  const dx1 = l1.end.x - l1.start.x;
  const dy1 = l1.end.y - l1.start.y;

  const dx2 = l2.end.x - l2.start.x;
  const dy2 = l2.end.y - l2.start.y;

  const dot = dx1 * dx2 + dy1 * dy2;

  const m1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

  const m2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  return Math.acos(dot / (m1 * m2));
}
