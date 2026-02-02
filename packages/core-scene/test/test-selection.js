import { Scene } from "../src/index.js";
import { createPoint, createLine } from "@dac/core-geometry";

console.log("Running Selection Tests...");

const scene = new Scene();

const l1 = createLine(createPoint(0, 0), createPoint(10, 0));

const l2 = createLine(createPoint(0, 5), createPoint(10, 5));

const id1 = scene.add(l1);
const id2 = scene.add(l2);

// Click select
const sel1 = scene.selection.selectAt(createPoint(5, 0));

console.assert(sel1.length === 1 && sel1[0] === id1, "Click select");

// Box select
const sel2 = scene.selection.selectInBox(0, 0, 10000, 6000);

console.assert(sel2.length === 2, "Box select");

// Lock layer
scene.layers.setLocked("default", true);

const sel3 = scene.selection.selectAt(createPoint(5, 0));

console.assert(sel3.length === 0, "Locked skip");

console.log("All Selection Tests Passed ✅");
