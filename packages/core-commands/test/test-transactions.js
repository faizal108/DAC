import { Scene } from "@dac/core-scene";
import {
  CommandManager,
  AddEntityCommand,
  ReplaceEntityCommand,
} from "../src/index.js";

import { createPoint, createLine } from "@dac/core-geometry";

console.log("Running Transaction Tests...");

const scene = new Scene();
const mgr = new CommandManager(scene);

// Begin batch
mgr.beginTransaction("Draw L");

// Add
mgr.execute(new AddEntityCommand(createPoint(0, 0)));

mgr.execute(new AddEntityCommand(createPoint(5, 0)));

// Commit
mgr.commitTransaction();

console.assert(scene.size() === 2, "Batch add");

// Undo batch
mgr.undo();

console.assert(scene.size() === 0, "Batch undo");

// Redo batch
mgr.redo();

console.assert(scene.size() === 2, "Batch redo");

console.log("All Transaction Tests Passed ✅");
