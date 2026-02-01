import { createLine } from "../primitives/line.js";
import { equals } from "../primitives/point.js";

/**
 * Split line at point
 */
export function splitLineAtPoint(line, point) {
  if (equals(line.start, point) || equals(line.end, point)) {
    return [line];
  }

  const l1 = createLine(line.start, point);
  const l2 = createLine(point, line.end);

  return [l1, l2];
}
