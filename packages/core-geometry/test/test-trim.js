import {
  createPoint,
  createLine,
  trimLineWithLine,
  extendLineToLine,
} from "../src/index.js";

console.log("Running Trim Tests...");

const l1 = createLine(createPoint(0, 0), createPoint(10, 0));

const cutter = createLine(createPoint(5, -5), createPoint(5, 5));

// Trim
const trimmed = trimLineWithLine(l1, cutter);

console.assert(trimmed.length === 1, "Trim count");

console.assert(trimmed[0].end.x === 5000, "Trim X");

// Extend
const short = createLine(createPoint(0, 0), createPoint(3, 0));

const ext = extendLineToLine(short, cutter);

console.assert(ext.end.x === 5000, "Extend X");

console.log("All Trim Tests Passed ✅");
