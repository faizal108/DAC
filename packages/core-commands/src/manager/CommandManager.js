/**
 * Manage command history
 */
export class CommandManager {
  constructor(scene) {
    this.scene = scene;

    this._undo = [];
    this._redo = [];
  }

  execute(command) {
    command.execute(this.scene);

    this._undo.push(command);
    this._redo.length = 0;
  }

  undo() {
    const cmd = this._undo.pop();

    if (!cmd) return;

    cmd.undo(this.scene);

    this._redo.push(cmd);
  }

  redo() {
    const cmd = this._redo.pop();

    if (!cmd) return;

    cmd.execute(this.scene);

    this._undo.push(cmd);
  }

  clear() {
    this._undo.length = 0;
    this._redo.length = 0;
  }

  canUndo() {
    return this._undo.length > 0;
  }

  canRedo() {
    return this._redo.length > 0;
  }
}
