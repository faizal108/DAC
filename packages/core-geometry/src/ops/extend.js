import { intersectLineLine } from "./intersections.js";
import { createLine } from "../primitives/line.js";

/**
 * Extend line until it meets another line
 */
export function extendLineToLine(target, boundary) {
  const pts = intersectLineLine(target, boundary);

  if (!pts.length) return target;

  const p = pts[0];

  return createLine(target.start, p);
}
