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
  }

  clear() {
    this._cells.clear();
    this._entityMap.clear();
  }

  /**
   * Insert entity
   */
  insert(entity) {
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

  _computeKeys(entity) {
    let box;

    if (entity.type === "LINE") {
      box = bboxLine(entity.geometry);
    } else {
      // fallback: use center
      const c = entity.geometry.center;

      box = {
        minX: c.x,
        minY: c.y,
        maxX: c.x,
        maxY: c.y,
      };
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
