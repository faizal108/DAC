import {
  createPoint,
  createLine,
  bboxLine,
  projectPointOnLine,
  intersectLineLine,
  splitLineAtPoint,
} from "../src/index.js";

console.log("Running Line Tests...");

const a = createPoint(0, 0);
const b = createPoint(10, 0);
const c = createPoint(5, -5);
const d = createPoint(5, 5);

const l1 = createLine(a, b);
const l2 = createLine(c, d);

// BBox
const box = bboxLine(l1);
console.assert(box.minX === 0, "BBox minX");
console.assert(box.maxX === 10000, "BBox maxX");

// Projection
const p = createPoint(5, 3);
const proj = projectPointOnLine(p, l1);
console.assert(proj.point.y === 0, "Projection failed");

// Intersection
const i = intersectLineLine(l1, l2);
console.assert(i.length === 1, "Intersection count");
console.assert(i[0].x === 5000, "Intersection x");

// Split
const parts = splitLineAtPoint(l1, i[0]);
console.assert(parts.length === 2, "Split count");

console.log("All Line Tests Passed ✅");
