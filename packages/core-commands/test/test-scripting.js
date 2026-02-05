import { Scene } from "@dac/core-scene";
import {
  CommandManager,
  ApiFacade,
  ScriptContext,
  PluginManager,
} from "../src/index.js";

import { createPoint } from "@dac/core-geometry";

console.log("Running Scripting Tests...");

const scene = new Scene();
const mgr = new CommandManager(scene);

const api = new ApiFacade(scene, mgr);
const ctx = new ScriptContext(api, mgr);
const plugins = new PluginManager(ctx);

// Register plugin
plugins.register("drawSquare", (api) => {
  api.add(createPoint(0, 0));
  api.add(createPoint(10, 0));
  api.add(createPoint(10, 10));
  api.add(createPoint(0, 10));
});

// Run
plugins.run("drawSquare");

console.assert(scene.size() === 4, "Plugin draw");

// Undo plugin
mgr.undo();

console.assert(scene.size() === 0, "Undo");

console.log("All Scripting Tests Passed ✅");
