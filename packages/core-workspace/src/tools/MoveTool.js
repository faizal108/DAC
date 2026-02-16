import { BaseTool } from "./BaseTool.js";
import { ReplaceEntityCommand } from "@dac/core-commands";

function shiftPoint(p, dx, dy) {
  return { x: p.x + dx, y: p.y + dy };
}

function moveGeometry(geometry, dx, dy) {
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

export class MoveTool extends BaseTool {
  constructor(ws) {
    super(ws);
    this.dragStart = null;
    this.current = null;
    this.entityId = null;
    this.entity = null;
  }

  onMouseDown(p) {
    const tf = this.ws.transform;
    const tol = (10 / tf.scale) * 1000;
    const hits = this.ws.scene.index.queryPoint(p, tol);
    if (!hits.length) return;

    this.entityId = hits[0].id;
    this.entity = this.ws.scene.get(this.entityId);
    this.dragStart = p;
    this.current = p;
    this.ws.scene.selection.clear();
    this.ws.scene.selection.add(this.entityId);
  }

  onMouseMove(p) {
    if (!this.dragStart) return;
    this.current = p;
  }

  onMouseUp(p) {
    if (!this.dragStart || !this.entityId) return;

    const entity = this.ws.scene.get(this.entityId);
    if (!entity) {
      this.onCancel();
      return;
    }

    const ref = this.current || p;
    const dx = ref.x - this.dragStart.x;
    const dy = ref.y - this.dragStart.y;
    if (!dx && !dy) {
      this.onCancel();
      return;
    }

    const moved = moveGeometry(entity.geometry, dx, dy);
    this.ws.commands.execute(new ReplaceEntityCommand(entity.id, moved));
    this.onCancel();
  }

  onCancel() {
    this.dragStart = null;
    this.current = null;
    this.entityId = null;
    this.entity = null;
  }

  getHint() {
    if (this.dragStart) return "Move: drag to destination, release to place";
    return "Move: select object to move";
  }

  drawOverlay(ctx) {
    if (!this.dragStart || !this.current || !this.entity) return;

    const dx = this.current.x - this.dragStart.x;
    const dy = this.current.y - this.dragStart.y;
    const moved = moveGeometry(this.entity.geometry, dx, dy);
    const tf = this.ws.transform;

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#0f766e";

    if (moved.type === "LINE") {
      const a = tf.worldToScreen(moved.start.x, moved.start.y);
      const b = tf.worldToScreen(moved.end.x, moved.end.y);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    if (moved.type === "CIRCLE") {
      const c = tf.worldToScreen(moved.center.x, moved.center.y);
      const r = (moved.radius / 1000) * tf.scale;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (moved.type === "POLYLINE") {
      const pts = moved.points || [];
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

    if (moved.type === "POINT") {
      const p = tf.worldToScreen(moved.x, moved.y);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }

    ctx.restore();
  }
}
