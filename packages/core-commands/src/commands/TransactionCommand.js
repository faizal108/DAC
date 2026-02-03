import { CompositeCommand } from "./CompositeCommand.js";

/**
 * Atomic batch command
 */
export class TransactionCommand extends CompositeCommand {
  constructor(name = "Transaction") {
    super([]);

    this.name = name;
    this._active = true;
  }

  add(cmd) {
    if (!this._active) {
      throw new Error("Transaction already closed");
    }

    this.commands.push(cmd);
  }

  close() {
    this._active = false;
  }
}
