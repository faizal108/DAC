/**
 * Central entity registry
 */
export class EntityStore {
  constructor() {
    this._map = new Map();
  }

  has(id) {
    return this._map.has(id);
  }

  get(id) {
    return this._map.get(id) || null;
  }

  getAll() {
    return Array.from(this._map.values());
  }

  add(entity) {
    if (this._map.has(entity.id)) {
      throw new Error(`Entity ${entity.id} already exists`);
    }

    this._map.set(entity.id, entity);
  }

  remove(id) {
    if (!this._map.has(id)) return false;

    this._map.delete(id);
    return true;
  }

  replace(id, newEntity) {
    if (!this._map.has(id)) {
      throw new Error(`Entity ${id} not found`);
    }

    this._map.set(id, newEntity);
  }

  clear() {
    this._map.clear();
  }

  size() {
    return this._map.size;
  }
}
