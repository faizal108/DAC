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
    this.entityId = null;
  }

  onMouseDown(p) {
    const tf = this.ws.transform;
    const tol = (10 / tf.scale) * 1000;
    const hits = this.ws.scene.index.queryPoint(p, tol);
    if (!hits.length) return;

    this.entityId = hits[0].id;
    this.dragStart = p;
    this.ws.scene.selection.clear();
    this.ws.scene.selection.add(this.entityId);
  }

  onMouseUp(p) {
    if (!this.dragStart || !this.entityId) return;

    const entity = this.ws.scene.get(this.entityId);
    if (!entity) {
      this.onCancel();
      return;
    }

    const dx = p.x - this.dragStart.x;
    const dy = p.y - this.dragStart.y;
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
    this.entityId = null;
  }
}
