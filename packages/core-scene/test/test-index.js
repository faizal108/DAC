import { Scene } from "../src/index.js";
import { createPoint, createLine } from "@dac/core-geometry";

console.log("Running Spatial Index Tests...");

const scene = new Scene();

// Create many lines
for (let i = 0; i < 100; i++) {
  const l = createLine(createPoint(i, 0), createPoint(i, 10));

  scene.add(l);
}

// Query box
const hits = scene.index.queryBox(2000, 0, 4000, 20000);

console.assert(hits.length > 0, "Index query");

// Replace
const id = scene.getAll()[0].id;

const newLine = createLine(createPoint(50, 0), createPoint(50, 10));

scene.replace(id, newLine);

const hits2 = scene.index.queryBox(49000, 0, 51000, 20000);

console.assert(hits2.includes(id), "Index update");

// Remove
scene.remove(id);

const hits3 = scene.index.queryBox(49000, 0, 51000, 20000);

console.assert(!hits3.includes(id), "Index remove");

console.log("All Spatial Index Tests Passed ✅");
