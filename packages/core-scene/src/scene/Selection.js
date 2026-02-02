import { bboxLine } from "@dac/core-geometry";

/**
 * Selection manager
 */
export class Selection {
  constructor(scene) {
    this._scene = scene;

    this._ids = new Set();
  }

  clear() {
    this._ids.clear();
  }

  getAll() {
    return Array.from(this._ids);
  }

  has(id) {
    return this._ids.has(id);
  }

  add(id) {
    this._ids.add(id);
  }

  remove(id) {
    this._ids.delete(id);
  }

  toggle(id) {
    if (this._ids.has(id)) {
      this._ids.delete(id);
    } else {
      this._ids.add(id);
    }
  }

  /**
   * Select by point (click)
   */
  selectAt(point, tol = 200) {
    this.clear();

    const hits = this._hitTest(point, tol);

    if (hits.length) {
      this._ids.add(hits[0].id);
    }

    return this.getAll();
  }

  /**
   * Box selection
   */
  selectInBox(minX, minY, maxX, maxY) {
    this.clear();

    for (const e of this._scene.getAll()) {
      if (!this._isSelectable(e)) continue;

      const box = bboxLine(e.geometry);

      if (
        box.minX >= minX &&
        box.maxX <= maxX &&
        box.minY >= minY &&
        box.maxY <= maxY
      ) {
        this._ids.add(e.id);
      }
    }

    return this.getAll();
  }

  _isSelectable(entity) {
    const layer = this._scene.layers.get(entity.layerId);

    if (!layer) return false;

    if (!layer.visible) return false;
    if (layer.locked) return false;

    return true;
  }

  _hitTest(point, tol) {
    const out = [];

    for (const e of this._scene.getAll()) {
      if (!this._isSelectable(e)) continue;

      if (e.type === "LINE") {
        const box = bboxLine(e.geometry);

        if (
          point.x >= box.minX - tol &&
          point.x <= box.maxX + tol &&
          point.y >= box.minY - tol &&
          point.y <= box.maxY + tol
        ) {
          out.push(e);
        }
      }
    }

    return out;
  }
}
