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

      const box = this._entityBox(e);
      if (!box) continue;

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

      if (e.type === "LINE" && this._hitLine(e.geometry, point, tol)) out.push(e);
      if (e.type === "CIRCLE" && this._hitCircle(e.geometry, point, tol))
        out.push(e);
      if (e.type === "POINT" && this._hitPoint(e.geometry, point, tol)) out.push(e);
      if (e.type === "POLYLINE" && this._hitPolyline(e.geometry, point, tol))
        out.push(e);
    }

    return out;
  }

  _entityBox(entity) {
    const g = entity.geometry;

    if (entity.type === "LINE") return bboxLine(g);

    if (entity.type === "CIRCLE") {
      return {
        minX: g.center.x - g.radius,
        maxX: g.center.x + g.radius,
        minY: g.center.y - g.radius,
        maxY: g.center.y + g.radius,
      };
    }

    if (entity.type === "POINT") {
      return { minX: g.x, maxX: g.x, minY: g.y, maxY: g.y };
    }

    if (entity.type === "POLYLINE" && g.points?.length) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const p of g.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }

      return { minX, minY, maxX, maxY };
    }

    return null;
  }

  _hitPoint(target, p, tol) {
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    return dx * dx + dy * dy <= tol * tol;
  }

  _hitLine(line, p, tol) {
    const box = bboxLine(line);
    if (
      p.x < box.minX - tol ||
      p.x > box.maxX + tol ||
      p.y < box.minY - tol ||
      p.y > box.maxY + tol
    ) {
      return false;
    }

    return this._distPointToSeg2(p, line.start, line.end) <= tol * tol;
  }

  _hitCircle(circle, p, tol) {
    const dx = p.x - circle.center.x;
    const dy = p.y - circle.center.y;
    const d = Math.hypot(dx, dy);
    return Math.abs(d - circle.radius) <= tol;
  }

  _hitPolyline(poly, p, tol) {
    const pts = poly.points || [];
    for (let i = 0; i < pts.length - 1; i++) {
      if (this._distPointToSeg2(p, pts[i], pts[i + 1]) <= tol * tol) return true;
    }
    return false;
  }

  _distPointToSeg2(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) {
      const px = p.x - a.x;
      const py = p.y - a.y;
      return px * px + py * py;
    }

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const x = a.x + t * dx;
    const y = a.y + t * dy;
    const px = p.x - x;
    const py = p.y - y;
    return px * px + py * py;
  }
}
