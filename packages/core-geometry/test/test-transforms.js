import {
  createPoint,
  createLine,
  createCircle,
  identity,
  translate,
  rotate,
  scale,
  multiply,
  invert,
  transformPoint,
  transformEntity,
} from "../src/index.js";

console.log("Running Transform Tests...");

// Point move
const p = createPoint(1, 1);
const t = translate(2, 3);

const p2 = transformPoint(p, t);

console.assert(p2.x === 3000, "Translate X");
console.assert(p2.y === 4000, "Translate Y");

// Rotate 90 deg
const r = rotate(Math.PI / 2);

const pr = transformPoint(createPoint(1, 0), r);

console.assert(Math.abs(pr.x) < 20, "Rotate X");

console.assert(Math.abs(pr.y - 1000) < 20, "Rotate Y");

// Invert
const m = multiply(t, r);
const inv = invert(m);

const back = transformPoint(transformPoint(p, m), inv);

console.assert(Math.abs(back.x - p.x) < 10, "Invert X");

console.assert(Math.abs(back.y - p.y) < 10, "Invert Y");

// Entity
const line = createLine(createPoint(0, 0), createPoint(5, 0));

const moved = transformEntity(line, translate(1, 1));

console.assert(moved.start.x === 1000, "Entity move");

console.log("All Transform Tests Passed ✅");
