import { equals } from "./point.js";
import { EPS } from "../utils/numbers.js";

/**
 * Create a normalized line segment
 */
export function createLine(start, end) {
  if (equals(start, end, EPS)) {
    throw new Error("Zero-length line not allowed");
  }

  // Canonical ordering
  let s = start;
  let e = end;

  if (s.x > e.x || (s.x === e.x && s.y > e.y)) {
    s = end;
    e = start;
  }

  return Object.freeze({
    type: "LINE",
    start: s,
    end: e,
  });
}
