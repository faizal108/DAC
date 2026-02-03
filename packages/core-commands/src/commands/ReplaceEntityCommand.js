import { Command } from "./Command.js";

export class ReplaceEntityCommand extends Command {
  constructor(id, newGeometry) {
    super();

    this.id = id;
    this.newGeometry = newGeometry;

    this._backup = null;
  }

  execute(scene) {
    const e = scene.get(this.id);

    if (!e) return;

    // Full snapshot (memento)
    this._backup = {
      ...e,
      geometry: e.geometry,
      meta: { ...e.meta },
    };

    scene.replace(this.id, this.newGeometry);
  }

  undo(scene) {
    if (!this._backup) return;

    // Restore through Scene
    scene._restoreEntity(this._backup);
  }
}
