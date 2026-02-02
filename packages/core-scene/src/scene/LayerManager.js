/**
 * Manage drawing layers
 */
export class LayerManager {
  constructor() {
    this._layers = new Map();

    // Default layer
    this.createLayer("default", {
      name: "Default",
      visible: true,
      locked: false,
      color: "#000000",
    });
  }

  createLayer(id, opts = {}) {
    if (this._layers.has(id)) {
      throw new Error(`Layer ${id} already exists`);
    }

    const layer = {
      id,
      name: opts.name || id,
      visible: opts.visible ?? true,
      locked: opts.locked ?? false,
      color: opts.color || "#000000",
    };

    this._layers.set(id, layer);

    return layer;
  }

  get(id) {
    return this._layers.get(id) || null;
  }

  getAll() {
    return Array.from(this._layers.values());
  }

  remove(id) {
    if (id === "default") {
      throw new Error("Cannot remove default layer");
    }

    if (!this._layers.has(id)) {
      return false;
    }

    this._layers.delete(id);

    return true;
  }

  setVisible(id, visible) {
    const layer = this.get(id);

    if (!layer) {
      throw new Error("Layer not found");
    }

    layer.visible = !!visible;
  }

  setLocked(id, locked) {
    const layer = this.get(id);

    if (!layer) {
      throw new Error("Layer not found");
    }

    layer.locked = !!locked;
  }

  rename(id, name) {
    const layer = this.get(id);

    if (!layer) {
      throw new Error("Layer not found");
    }

    layer.name = name;
  }

  setColor(id, color) {
    const layer = this.get(id);

    if (!layer) {
      throw new Error("Layer not found");
    }

    layer.color = color;
  }
}
