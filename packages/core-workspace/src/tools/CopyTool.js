import { BaseTool } from "./BaseTool.js";
import { AddEntityCommand } from "@dac/core-commands";

function shiftPoint(p, dx, dy) {
  return { x: p.x + dx, y: p.y + dy };
}

function copyGeometry(geometry, dx, dy) {
  switch (geometry.type) {
    case "POINT":
      return { ...geometry, x: geometry.x + dx, y: geometry.y + dy };
    case "LINE":
      return {
        ...geometry,
        start: shiftPoint(geometry.start, dx, dy),
        end: shiftPoint(geometry.end, dx, dy),
      };
    case "CIRCLE":
      return { ...geometry, center: shiftPoint(geometry.center, dx, dy) };
    case "POLYLINE":
      return {
        ...geometry,
        points: geometry.points.map((p) => shiftPoint(p, dx, dy)),
      };
    default:
      return geometry;
  }
}

export class CopyTool extends BaseTool {
  constructor(ws) {
    super(ws);
    this.base = null;
    this.current = null;
    this.entity = null;
  }

  onMouseDown(p) {
    if (!this.base) {
      const tol = (10 / this.ws.transform.scale) * 1000;
      const hits = this.ws.scene.index.queryPoint(p, tol);
      if (!hits.length) return;
      this.entity = this.ws.scene.get(hits[0].id);
      this.base = p;
      this.current = p;
      this.ws.scene.selection.clear();
      this.ws.scene.selection.add(hits[0].id);
      return;
    }

    if (!this.entity) return;
    const ref = this.current || p;
    const dx = ref.x - this.base.x;
    const dy = ref.y - this.base.y;
    const copied = copyGeometry(this.entity.geometry, dx, dy);
    this.ws.commands.execute(new AddEntityCommand(copied));
  }

  onMouseMove(p) {
    if (!this.base) return;
    this.current = p;
  }

  onCancel() {
    this.base = null;
    this.current = null;
    this.entity = null;
  }

  getHint() {
    if (!this.base) return "Copy: pick source object";
    return "Copy: click destination to place copy, ESC to exit";
  }

  drawOverlay(ctx) {
    if (!this.base || !this.current || !this.entity) return;
    const dx = this.current.x - this.base.x;
    const dy = this.current.y - this.base.y;
    const g = copyGeometry(this.entity.geometry, dx, dy);
    const tf = this.ws.transform;

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#0369a1";

    if (g.type === "LINE") {
      const a = tf.worldToScreen(g.start.x, g.start.y);
      const b = tf.worldToScreen(g.end.x, g.end.y);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    if (g.type === "CIRCLE") {
      const c = tf.worldToScreen(g.center.x, g.center.y);
      const r = (g.radius / 1000) * tf.scale;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (g.type === "POLYLINE") {
      const pts = g.points || [];
      if (pts.length > 1) {
        const p0 = tf.worldToScreen(pts[0].x, pts[0].y);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < pts.length; i++) {
          const p = tf.worldToScreen(pts[i].x, pts[i].y);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
    }

    if (g.type === "POINT") {
      const p = tf.worldToScreen(g.x, g.y);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }

    ctx.restore();
  }
}
