import { Scene } from "../src/index.js";
import { createPoint, createLine } from "@dac/core-geometry";

console.log("Running Scene Tests...");

const scene = new Scene();

// Add
const p1 = createPoint(0, 0);
const l1 = createLine(createPoint(0, 0), createPoint(5, 0));

const id1 = scene.add(p1);
const id2 = scene.add(l1);

console.assert(scene.size() === 2, "Add");

console.assert(scene.get(id1).geometry === p1, "Get");

// Replace
const l2 = createLine(createPoint(0, 0), createPoint(10, 0));

scene.replace(id2, l2);

console.assert(scene.get(id2).geometry === l2, "Replace");

// Remove
scene.remove(id1);

console.assert(scene.size() === 1, "Remove");

// Version
console.assert(scene.version >= 3, "Version");

// Clear
scene.clear();

console.assert(scene.size() === 0, "Clear");

console.log("All Scene Tests Passed ✅");
