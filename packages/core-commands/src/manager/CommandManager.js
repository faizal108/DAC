import { TransactionCommand } from "../commands/TransactionCommand.js";

/**
 * Manage command history
 */
export class CommandManager {
  constructor(scene) {
    this.scene = scene;

    this._undo = [];
    this._redo = [];

    this._currentTx = null;
  }

  execute(command) {
    // Inside transaction
    if (this._currentTx) {
      this._currentTx.add(command);
      command.execute(this.scene);
      return;
    }

    command.execute(this.scene);

    this._undo.push(command);
    this._redo.length = 0;
  }

  beginTransaction(name) {
    if (this._currentTx) {
      throw new Error("Transaction already open");
    }

    this._currentTx = new TransactionCommand(name);
  }

  commitTransaction() {
    if (!this._currentTx) return;

    this._currentTx.close();

    this._undo.push(this._currentTx);
    this._redo.length = 0;

    this._currentTx = null;
  }

  rollbackTransaction() {
    if (!this._currentTx) return;

    // Undo all
    this._currentTx.undo(this.scene);

    this._currentTx = null;
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
