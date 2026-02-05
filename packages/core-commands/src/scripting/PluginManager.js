/**
 * Manage plugins
 */
export class PluginManager {
  constructor(context) {
    this._context = context;

    this._plugins = new Map();
  }

  register(name, fn) {
    if (this._plugins.has(name)) {
      throw new Error("Plugin already registered");
    }

    this._plugins.set(name, fn);
  }

  run(name) {
    const fn = this._plugins.get(name);

    if (!fn) {
      throw new Error("Plugin not found");
    }

    return this._context.run(fn);
  }

  list() {
    return Array.from(this._plugins.keys());
  }
}
