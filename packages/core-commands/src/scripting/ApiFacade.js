import {
  AddEntityCommand,
  ReplaceEntityCommand,
  RemoveEntityCommand,
} from "../index.js";

/**
 * Safe API exposed to scripts
 */
export class ApiFacade {
  constructor(scene, commandManager) {
    this._scene = scene;
    this._mgr = commandManager;
  }

  add(geometry, opts) {
    this._mgr.execute(new AddEntityCommand(geometry, opts));
  }

  replace(id, geometry) {
    this._mgr.execute(new ReplaceEntityCommand(id, geometry));
  }

  remove(id) {
    this._mgr.execute(new RemoveEntityCommand(id));
  }

  list() {
    return this._scene.getAll();
  }

  get(id) {
    return this._scene.get(id);
  }
}
