import { BaseTool } from "./BaseTool.js";
import { ReplaceEntityCommand } from "@dac/core-commands";
import { intersectLineLine, intersectLineCircle } from "@dac/core-geometry";
import { splitLineAtPoint } from "@dac/core-geometry";

function dist2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function midPoint(line) {
  return {
    x: Math.round((line.start.x + line.end.x) / 2),
    y: Math.round((line.start.y + line.end.y) / 2),
  };
}

export class TrimTool extends BaseTool {
  constructor(ws) {
    super(ws);
    this.cutterA = null;
    this.cutterB = null;
  }

  _pickEntityAt(p) {
    const tf = this.ws.transform;
    const toleranceUm = (10 / tf.scale) * 1000;
    const hits = this.ws.scene.index.queryPoint(p, toleranceUm);
    return hits.length ? hits[0] : null;
  }

  _intersections(lineGeom) {
    const points = [];

    const cutters = [this.cutterA, this.cutterB].filter(Boolean);
    for (const c of cutters) {
      if (c.type === "LINE") {
        points.push(...intersectLineLine(lineGeom, c.geometry));
      }
      if (c.type === "CIRCLE") {
        points.push(...intersectLineCircle(lineGeom, c.geometry));
      }
    }

    // Unique by rounded coordinate key.
    const uniq = new Map();
    for (const p of points) {
      uniq.set(`${p.x},${p.y}`, p);
    }
    return Array.from(uniq.values());
  }

  onMouseDown(p) {
    if (!this.cutterA) {
      this.cutterA = this._pickEntityAt(p);
      return;
    }

    if (!this.cutterB) {
      const picked = this._pickEntityAt(p);
      if (!picked) return;
      if (picked.id === this.cutterA.id) return;
      this.cutterB = picked;
      return;
    }

    const target = this._pickEntityAt(p);
    if (!target || target.type !== "LINE") return;
    if (target.id === this.cutterA.id || target.id === this.cutterB.id) return;

    const points = this._intersections(target.geometry);
    if (!points.length) return;

    let nearest = points[0];
    let nearestD2 = dist2(p, nearest);
    for (let i = 1; i < points.length; i++) {
      const d2 = dist2(p, points[i]);
      if (d2 < nearestD2) {
        nearestD2 = d2;
        nearest = points[i];
      }
    }

    let parts = [];
    try {
      parts = splitLineAtPoint(target.geometry, nearest);
    } catch {
      return;
    }
    if (parts.length < 2) return;

    // Remove the half closest to click and keep the opposite half.
    const p0 = midPoint(parts[0]);
    const p1 = midPoint(parts[1]);
    const keep = dist2(p, p0) > dist2(p, p1) ? parts[0] : parts[1];

    this.ws.commands.execute(new ReplaceEntityCommand(target.id, keep));
  }

  onCancel() {
    this.cutterA = null;
    this.cutterB = null;
  }

  getHint() {
    if (!this.cutterA) return "Trim: select 1st cutter object";
    if (!this.cutterB) return "Trim: select 2nd cutter object";
    return "Trim: click side of target line to remove (Esc to reset cutters)";
  }

  drawOverlay(ctx) {
    const tf = this.ws.transform;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#b45309";

    for (const c of [this.cutterA, this.cutterB]) {
      if (!c) continue;
      const g = c.geometry;
      if (c.type === "LINE") {
        const a = tf.worldToScreen(g.start.x, g.start.y);
        const b = tf.worldToScreen(g.end.x, g.end.y);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      if (c.type === "CIRCLE") {
        const cc = tf.worldToScreen(g.center.x, g.center.y);
        const r = (g.radius / 1000) * tf.scale;
        ctx.beginPath();
        ctx.arc(cc.x, cc.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
