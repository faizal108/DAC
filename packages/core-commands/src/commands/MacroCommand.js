import { CompositeCommand } from "./CompositeCommand.js";

/**
 * Reusable macro
 */
export class MacroCommand extends CompositeCommand {
  constructor(name, commands = []) {
    super(commands);

    this.name = name;
  }

  clone() {
    return new MacroCommand(this.name, [...this.commands]);
  }
}
