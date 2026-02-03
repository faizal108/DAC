import { Command } from "./Command.js";

export class AddEntityCommand extends Command {
  constructor(geometry, opts = {}) {
    super();

    this.geometry = geometry;
    this.opts = opts;

    this._id = null;
  }

  execute(scene) {
    this._id = scene.add(this.geometry, this.opts);
  }

  undo(scene) {
    if (this._id) {
      scene.remove(this._id);
    }
  }
}
