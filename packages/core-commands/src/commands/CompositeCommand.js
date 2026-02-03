import { Command } from "./Command.js";

/**
 * Execute multiple commands as one
 */
export class CompositeCommand extends Command {
  constructor(commands = []) {
    super();

    this.commands = commands;
  }

  execute(scene) {
    for (const c of this.commands) {
      c.execute(scene);
    }
  }

  undo(scene) {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo(scene);
    }
  }
}
