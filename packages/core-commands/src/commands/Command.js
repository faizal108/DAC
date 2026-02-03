/**
 * Base command interface
 */
export class Command {
  execute(scene) {
    throw new Error("execute() not implemented");
  }

  undo(scene) {
    throw new Error("undo() not implemented");
  }
}
