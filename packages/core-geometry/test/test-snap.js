import {
  createPoint,
  createLine,
  findSnap,
  measureDistance,
} from "../src/index.js";

console.log("Running Snap Tests...");

const l1 = createLine(createPoint(0, 0), createPoint(10, 0));

const l2 = createLine(createPoint(5, -5), createPoint(5, 5));

const entities = [l1, l2];

// Near intersection
const cursor = createPoint(5.1, 0.1);

const snap = findSnap(cursor, entities);

console.assert(snap.type === "INTERSECTION", "Intersection snap");

console.assert(snap.point.x === 5000, "Snap X");

// Measure
const d = measureDistance(createPoint(0, 0), createPoint(3, 4));

console.assert(Math.abs(d - 5) < 0.01, "Distance measure");

console.log("All Snap Tests Passed ✅");
