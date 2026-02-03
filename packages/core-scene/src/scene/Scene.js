import { EntityStore } from "./EntityStore.js";
import { LayerManager } from "./LayerManager.js";
import { Selection } from "./Selection.js";
import { SpatialIndex } from "./SpatialIndex.js";

/**
 * Scene: system of record
 */
export class Scene {
  constructor() {
    this._store = new EntityStore();
    this.layers = new LayerManager();
    this.selection = new Selection(this);
    this.index = new SpatialIndex();

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

    const layerId = opts.layerId || "default";

    if (!this.layers.get(layerId)) {
      throw new Error(`Layer ${layerId} does not exist`);
    }
    const entity = {
      id,
      type: geometry.type,
      geometry,

      layerId,
      visible: opts.visible ?? true,
      locked: opts.locked ?? false,

      meta: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    this._store.add(entity);
    this.index.insert(entity);

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
    this.index.remove(id);

    if (ok) this._touch();

    return ok;
  }

  /**
   * Internal: restore full entity (for undo)
   */
  _restoreEntity(entity) {
    // Remove current version
    this._store.remove(entity.id);
    this.index.remove(entity.id);

    // Restore
    this._store.add(entity);
    this.index.insert(entity);

    this._touch();
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

      type: newGeometry.type,
      geometry: newGeometry,

      meta: {
        ...old.meta,
        updatedAt: Date.now(),
      },
    };

    this.index.remove(id);
    this._store.replace(id, updated);
    this.index.insert(updated);

    this._touch();
  }

  clear() {
    this._store.clear();
    this.index.clear();
    this._touch();
  }

  size() {
    return this._store.size();
  }
}
