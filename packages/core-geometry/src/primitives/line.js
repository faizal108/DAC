import { equals } from "./point.js";
import { EPS } from "../utils/numbers.js";

/**
 * Create a normalized line segment
 */
export function createLine(start, end) {
  if (equals(start, end, EPS)) {
    throw new Error("Zero-length line not allowed");
  }

  return Object.freeze({
    type: "LINE",
    // Preserve caller direction; capture/export pipelines depend on sequence.
    start,
    end,
  });
}
