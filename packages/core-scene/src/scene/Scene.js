import { EntityStore } from "./EntityStore.js";

/**
 * Scene: system of record
 */
export class Scene {
  constructor() {
    this._store = new EntityStore();

    this._idCounter = 1;

    this.version = 0;
  }

  _nextId() {
    return `e${this._idCounter++}`;
  }

  _touch() {
    this.version++;
  }

  /**
   * Add geometry as entity
   */
  add(geometry, opts = {}) {
    const id = this._nextId();

    const entity = {
      id,
      type: geometry.type,
      geometry,

      layerId: opts.layerId || "default",
      visible: opts.visible ?? true,
      locked: opts.locked ?? false,

      meta: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    this._store.add(entity);

    this._touch();

    return id;
  }

  get(id) {
    return this._store.get(id);
  }

  getAll() {
    return this._store.getAll();
  }

  remove(id) {
    const ok = this._store.remove(id);

    if (ok) this._touch();

    return ok;
  }

  /**
   * Replace geometry of entity
   */
  replace(id, newGeometry) {
    const old = this._store.get(id);

    if (!old) {
      throw new Error(`Entity ${id} not found`);
    }

    const updated = {
      ...old,

      geometry: newGeometry,

      meta: {
        ...old.meta,
        updatedAt: Date.now(),
      },
    };

    this._store.replace(id, updated);

    this._touch();
  }

  clear() {
    this._store.clear();
    this._touch();
  }

  size() {
    return this._store.size();
  }
}
