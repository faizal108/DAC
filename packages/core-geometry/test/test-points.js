import {
  createPoint,
  createPointInternal,
  distance,
  equals,
  toDisplay,
  toInternal,
  approxEqual,
} from "../src/index.js";

console.log("Running Point Tests...");

// Creation
const p1 = createPoint(10, 20);
const p2 = createPoint(10.001, 20.001);

console.assert(p1.x === 10000, "Quantization failed");
console.assert(p1.y === 20000, "Quantization failed");

// Distance
const d = distance(p1, p2);
console.assert(d > 0, "Distance invalid");

// Equality with EPS
console.assert(equals(p1, p2), "Equals with EPS failed");

// Display
const disp = toDisplay(p1);
console.assert(disp.x === 10, "Display x failed");
console.assert(disp.y === 20, "Display y failed");

// Internal creation
const p3 = createPointInternal(5000, 6000);
console.assert(p3.x === 5000, "Internal create failed");

// approxEqual
console.assert(approxEqual(1000, 1005, 10), "Approx equal failed");

console.log("All Point Tests Passed ✅");
