import { Command } from "./Command.js";

export class RemoveEntityCommand extends Command {
  constructor(id) {
    super();

    this.id = id;
    this._backup = null;
  }

  execute(scene) {
    const e = scene.get(this.id);

    if (!e) return;

    this._backup = e;

    scene.remove(this.id);
  }

  undo(scene) {
    if (this._backup) {
      scene._store.add(this._backup);
      scene.index.insert(this._backup);
    }
  }
}
