import { clamp } from "../utils/numbers.js";

/**
 * Project point onto line segment
 */
export function projectPointOnLine(point, line) {
  const ax = line.start.x;
  const ay = line.start.y;

  const bx = line.end.x;
  const by = line.end.y;

  const px = point.x;
  const py = point.y;

  const dx = bx - ax;
  const dy = by - ay;

  const len2 = dx * dx + dy * dy;

  if (len2 === 0) {
    return {
      point: line.start,
      t: 0,
    };
  }

  let t = ((px - ax) * dx + (py - ay) * dy) / len2;

  t = clamp(t, 0, 1);

  return {
    point: {
      x: Math.round(ax + t * dx),
      y: Math.round(ay + t * dy),
    },
    t,
  };
}
