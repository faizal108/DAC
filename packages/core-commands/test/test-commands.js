import { Scene } from "@dac/core-scene";
import {
  CommandManager,
  AddEntityCommand,
  RemoveEntityCommand,
  ReplaceEntityCommand,
} from "../src/index.js";

import { createPoint, createLine } from "@dac/core-geometry";

console.log("Running Command Tests...");

const scene = new Scene();
const mgr = new CommandManager(scene);

// Add
const add = new AddEntityCommand(createPoint(0, 0));

mgr.execute(add);

console.assert(scene.size() === 1, "Add");

// Replace
const id = scene.getAll()[0].id;

const rep = new ReplaceEntityCommand(
  id,
  createLine(createPoint(0, 0), createPoint(5, 0)),
);

mgr.execute(rep);

console.assert(scene.get(id).type === "LINE", "Replace");

// Undo replace
mgr.undo();

console.assert(scene.get(id).type === "POINT", "Undo replace");

// Remove
const rem = new RemoveEntityCommand(id);

mgr.execute(rem);

console.assert(scene.size() === 0, "Remove");

// Undo remove
mgr.undo();

console.assert(scene.size() === 1, "Undo remove");

// Undo add
mgr.undo();

console.assert(scene.size() === 0, "Undo add");

console.log("All Command Tests Passed ✅");
