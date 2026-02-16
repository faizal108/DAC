import { Command } from "./Command.js";
import { createLine } from "@dac/core-geometry";

export class CommitCaptureCommand extends Command {
  constructor(points) {
    super();
    this.points = points;
    this.ids = [];
  }

  execute(scene) {
    if (!this.points.length) return;

    this.ids = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      try {
        const line = createLine(this.points[i], this.points[i + 1]);
        this.ids.push(scene.add(line));
      } catch {
        // Ignore zero-length segment
      }
    }
  }

  undo(scene) {
    if (!this.ids.length) return;
    for (const id of this.ids) {
      scene.remove(id);
    }
  }
}
