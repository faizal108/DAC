import {
  createPoint,
  createLine,
  createCircle,
  createArc,
  intersectLineCircle,
  intersectCircleCircle,
  isAngleOnArc,
} from "../src/index.js";

console.log("Running Circle/Arc Tests...");

const center = createPoint(0, 0);
const circle = createCircle(center, 5000); // r = 5mm

// Line intersection
const l = createLine(createPoint(-10, 0), createPoint(10, 0));

const pts = intersectLineCircle(l, circle);

console.assert(pts.length === 2, "Line-circle count");

// Tangent case (1 intersection)
const c2 = createCircle(createPoint(10, 0), 5000);

const cc = intersectCircleCircle(circle, c2);
console.assert(cc.length === 1, "Circle-circle tangent");

// Two-intersection case
const c3 = createCircle(createPoint(8, 0), 5000);

const cc2 = intersectCircleCircle(circle, c3);
console.assert(cc2.length === 2, "Circle-circle two points");

// Arc
const arc = createArc(center, 5000, 0, Math.PI);

console.assert(isAngleOnArc(0.5, arc), "Arc test failed");
console.assert(!isAngleOnArc(4, arc), "Arc exclusion failed");

console.log("All Circle/Arc Tests Passed ✅");
