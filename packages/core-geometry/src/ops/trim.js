import { intersectLineLine } from "./intersections.js";
import { splitLineAtPoint } from "./splits.js";
import { equals } from "../primitives/point.js";

/**
 * Trim line with another line (MVP version)
 * Keeps segment connected to original start
 */
export function trimLineWithLine(target, cutter) {
  const pts = intersectLineLine(target, cutter);

  if (!pts.length) {
    return [target];
  }

  const p = pts[0];

  const parts = splitLineAtPoint(target, p);

  if (parts.length === 1) {
    return parts;
  }

  // Keep part that shares target.start
  for (const part of parts) {
    if (equals(part.start, target.start)) {
      return [part];
    }
  }

  // Fallback (should never happen)
  return [parts[0]];
}
