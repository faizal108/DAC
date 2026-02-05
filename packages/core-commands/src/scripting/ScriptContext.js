/**
 * Script execution context
 */
export class ScriptContext {
  constructor(api, commandManager) {
    this.api = api;
    this._mgr = commandManager;
  }

  run(fn) {
    if (typeof fn !== "function") {
      throw new Error("Script must be function");
    }

    // Auto transaction
    this._mgr.beginTransaction("Script");

    try {
      const result = fn(this.api);

      this._mgr.commitTransaction();

      return result;
    } catch (err) {
      this._mgr.rollbackTransaction();
      throw err;
    }
  }
}
