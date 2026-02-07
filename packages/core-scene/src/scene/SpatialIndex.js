import { bboxLine } from "@dac/core-geometry";

const CELL_SIZE = 10000; // 10mm in um

function cellKey(x, y) {
  return `${x},${y}`;
}

function worldToCell(v) {
  return Math.floor(v / CELL_SIZE);
}

/**
 * Uniform grid spatial index
 */
export class SpatialIndex {
  constructor() {
    this._cells = new Map(); // key -> Set<id>
    this._entityMap = new Map(); // id -> [keys]
    this._entities = new Map(); // id -> entity   
  }

  clear() {
    this._cells.clear();
    this._entityMap.clear();
    this._entities.clear(); 
  }

  /**
   * Insert entity
   */
  insert(entity) {
    this._entities.set(entity.id, entity);

    const keys = this._computeKeys(entity);

    this._entityMap.set(entity.id, keys);

    for (const k of keys) {
      if (!this._cells.has(k)) {
        this._cells.set(k, new Set());
      }

      this._cells.get(k).add(entity.id);
    }
  }

  /**
   * Remove entity
   */
  remove(id) {
    const keys = this._entityMap.get(id);

    if (!keys) return;

    for (const k of keys) {
      const set = this._cells.get(k);

      if (!set) continue;

      set.delete(id);

      if (!set.size) {
        this._cells.delete(k);
      }
    }

    this._entityMap.delete(id);
    this._entities.delete(id);
  }

  /**
   * Update entity
   */
  update(entity) {
    this.remove(entity.id);
    this.insert(entity);
  }

  /**
   * Query by bounding box
   */
  queryBox(minX, minY, maxX, maxY) {
    const minCX = worldToCell(minX);
    const maxCX = worldToCell(maxX);

    const minCY = worldToCell(minY);
    const maxCY = worldToCell(maxY);

    const out = new Set();

    for (let x = minCX; x <= maxCX; x++) {
      for (let y = minCY; y <= maxCY; y++) {
        const k = cellKey(x, y);

        const set = this._cells.get(k);

        if (!set) continue;

        for (const id of set) {
          out.add(id);
        }
      }
    }

    return Array.from(out);
  }

  /**
   * Query entities near a world point
   */
  queryPoint(p, radiusUm = 1000) {
    const result = [];

    const r2 = radiusUm * radiusUm;

    // Brute force scan (safe)
    for (const e of this._entities.values()) {
      const g = e.geometry;

      let d2 = Infinity;

      if (g.type === "POINT") {
        const dx = g.x - p.x;
        const dy = g.y - p.y;

        d2 = dx * dx + dy * dy;
      }

      if (g.type === "LINE") {
        d2 = this._distPointToLine2(p, g.start, g.end);
      }

      if (g.type === "CIRCLE") {
        const dx = g.center.x - p.x;
        const dy = g.center.y - p.y;

        const d = Math.hypot(dx, dy);

        d2 = Math.abs(d - g.radius) ** 2;
      }

      if (d2 <= r2) {
        result.push(e);
      }
    }

    return result;
  }

  _distPointToLine2(p, a, b) {
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

  _computeKeys(entity) {
    let box;

    const g = entity.geometry;

    switch (g.type) {
      case "LINE": {
        box = bboxLine(g);
        break;
      }

      case "CIRCLE":
      case "ARC": {
        const c = g.center;
        const r = g.radius;

        box = {
          minX: c.x - r,
          minY: c.y - r,
          maxX: c.x + r,
          maxY: c.y + r,
        };
        break;
      }

      case "POINT":
      default: {
        // Point or unknown → treat as single cell
        box = {
          minX: g.x,
          minY: g.y,
          maxX: g.x,
          maxY: g.y,
        };
        break;
      }
    }

    const minCX = worldToCell(box.minX);
    const maxCX = worldToCell(box.maxX);

    const minCY = worldToCell(box.minY);
    const maxCY = worldToCell(box.maxY);

    const keys = [];

    for (let x = minCX; x <= maxCX; x++) {
      for (let y = minCY; y <= maxCY; y++) {
        keys.push(cellKey(x, y));
      }
    }

    return keys;
  }
}
