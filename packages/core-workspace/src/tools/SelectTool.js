import { BaseTool } from "./BaseTool.js";

export class SelectTool extends BaseTool {
  constructor(ws) {
    super(ws);
    this.useSnap = false;
    this._dragStart = null;
    this._dragCurrent = null;
    this._dragging = false;
    this._shiftDrag = false;
  }

  onMouseDown(p, e) {
    if (e.button !== 0) return;
    this._dragStart = p;
    this._dragCurrent = p;
    this._dragging = false;
    this._shiftDrag = !!e.shiftKey;
  }

  onMouseMove(p) {
    if (!this._dragStart) return;
    this._dragCurrent = p;

    const dx = p.x - this._dragStart.x;
    const dy = p.y - this._dragStart.y;
    // Start box selection after small movement threshold (~6px).
    const pxThresh = 6;
    const worldThresh = (pxThresh / this.ws.transform.scale) * 1000;
    if (!this._dragging && dx * dx + dy * dy > worldThresh * worldThresh) {
      this._dragging = true;
    }
  }

  onMouseUp(p, e) {
    if (e.button !== 0 || !this._dragStart) return;

    const tf = this.ws.transform;
    const tol = (10 / tf.scale) * 1000;
    const isShift = this._shiftDrag || !!e.shiftKey;

    if (this._dragging && this._dragCurrent) {
      const a = this._dragStart;
      const b = this._dragCurrent;
      const minX = Math.min(a.x, b.x);
      const minY = Math.min(a.y, b.y);
      const maxX = Math.max(a.x, b.x);
      const maxY = Math.max(a.y, b.y);
      this.ws.scene.selection.selectInBox(
        minX,
        minY,
        maxX,
        maxY,
        isShift ? "add" : "replace",
      );
    } else {
      this.ws.scene.selection.selectAt(p, tol, isShift ? "toggle" : "replace");
    }

    this._dragStart = null;
    this._dragCurrent = null;
    this._dragging = false;
    this._shiftDrag = false;
  }

  drawOverlay(ctx) {
    if (!this._dragging || !this._dragStart || !this._dragCurrent) return;
    const tf = this.ws.transform;
    const a = tf.worldToScreen(this._dragStart.x, this._dragStart.y);
    const b = tf.worldToScreen(this._dragCurrent.x, this._dragCurrent.y);
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);

    ctx.save();
    ctx.fillStyle = "rgba(37, 99, 235, 0.12)";
    ctx.strokeStyle = "rgba(37, 99, 235, 0.75)";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  getHint() {
    if (this._dragging) {
      return this._shiftDrag
        ? "Select: drag box to add selection"
        : "Select: drag box to select";
    }
    return "Select: click | Shift+click multi-select | drag box";
  }
}
