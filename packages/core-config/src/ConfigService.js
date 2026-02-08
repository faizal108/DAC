import { LocalStorage } from "./Storage/LocalStorage.js";

export class ConfigService {
  constructor(storage = new LocalStorage()) {
    this.storage = storage;

    this._config = {};
    this._subs = new Set();
  }

  async load() {
    this._config =
      (await this.storage.load()) || {};
  }

  get(path) {
    return path
      .split(".")
      .reduce((o, k) => o?.[k], this._config);
  }

  set(path, value) {
    const keys = path.split(".");
    let obj = this._config;

    while (keys.length > 1) {
      const k = keys.shift();
      obj[k] ??= {};
      obj = obj[k];
    }

    obj[keys[0]] = value;

    this.save();
    this._notify();
  }

  async save() {
    await this.storage.save(this._config);
  }

  subscribe(fn) {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }

  _notify() {
    for (const fn of this._subs) {
      fn(this._config);
    }
  }
}
