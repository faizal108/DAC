import { Command } from "./Command.js";
import { createPolyline } from "@dac/core-geometry";

export class CommitCaptureCommand extends Command {
  constructor(points) {
    super();
    this.points = points;
    this.id = null;
  }

  execute(scene) {
    if (!this.points.length) return;

    const poly = createPolyline(this.points);

    this.id = scene.add(poly);
  }

  undo(scene) {
    if (this.id) {
      scene.remove(this.id);
    }
  }
}
