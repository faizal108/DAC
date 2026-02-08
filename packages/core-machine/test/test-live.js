import { SerialAdapter } from "@dac/adapter-serial";
import { MachineController } from "../src/index.js";

import { Scene } from "@dac/core-scene";
import { CommandManager } from "@dac/core-commands";

const port = process.argv[2];

if (!port) {
  console.log("Usage: node test-live.js /dev/ttyUSB0");
  process.exit(1);
}

const scene = new Scene();
const mgr = new CommandManager(scene);

const machine = new MachineController(mgr);

const adapter = new SerialAdapter(port);

adapter.onPoint((evt) => {
  machine.onEvent(evt);

  console.log("Scene size:", scene.size());
});

await adapter.connect();

console.log("Live plotting...");
