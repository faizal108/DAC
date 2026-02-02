import { Scene, Serializer } from "../src/index.js";
import { createPoint, createLine } from "@dac/core-geometry";

console.log("Running Serializer Tests...");

const scene = new Scene();

scene.layers.createLayer("walls");

const l = createLine(createPoint(0, 0), createPoint(10, 0));

const id = scene.add(l, {
  layerId: "walls",
});

// Serialize
const data = Serializer.serialize(scene);

// Deserialize
const restored = Serializer.deserialize(data);

console.assert(restored.size() === 1, "Entity restore");

console.assert(restored.layers.get("walls"), "Layer restore");

const e = restored.get(id);

console.assert(e.geometry.start.x === 0, "Geom restore");

console.assert(restored.version === scene.version, "Version restore");

console.log("All Serializer Tests Passed ✅");
