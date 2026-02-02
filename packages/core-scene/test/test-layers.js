import { Scene } from "../src/index.js";
import { createPoint } from "@dac/core-geometry";

console.log("Running Layer Tests...");

const scene = new Scene();

// Default layer
const def = scene.layers.get("default");

console.assert(def, "Default layer exists");

// Create layer
scene.layers.createLayer("walls", {
  name: "Walls",
  color: "#ff0000",
});

console.assert(scene.layers.get("walls"), "Layer created");

// Add to layer
const p = createPoint(1, 1);

const id = scene.add(p, {
  layerId: "walls",
});

console.assert(scene.get(id).layerId === "walls", "Layer assign");

// Visibility
scene.layers.setVisible("walls", false);

console.assert(scene.layers.get("walls").visible === false, "Visibility");

// Lock
scene.layers.setLocked("walls", true);

console.assert(scene.layers.get("walls").locked === true, "Lock");

// Remove
scene.layers.remove("walls");

console.log("All Layer Tests Passed ✅");
