/**
 * Canvas renderer
 */
export class CanvasRenderer {
  constructor(canvas, transform) {
    this.ctx = canvas.getContext("2d");
    this.transform = transform;
  }

  clear() {
    const c = this.ctx.canvas;

    this.ctx.clearRect(0, 0, c.width, c.height);
  }

  drawPoint(p) {
    const s = this.transform.worldToScreen(p.x, p.y);

    this.ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
  }

  drawLine(l) {
    const a = this.transform.worldToScreen(l.start.x, l.start.y);

    const b = this.transform.worldToScreen(l.end.x, l.end.y);

    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.stroke();
  }

  drawCircle(c) {
    const s = this.transform.worldToScreen(c.center.x, c.center.y);

    const r = (c.radius / 1000) * this.transform.scale;

    this.ctx.beginPath();
    this.ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  drawEntity(e) {
    const ctx = this.ctx;
    const tf = this.transform;
    const g = e.geometry;

    switch (e.type) {
      case "POINT":
        this.drawPoint(g);
        break;

      case "LINE":
        this.drawLine(g);
        break;

      case "CIRCLE":
        this.drawCircle(g);
        break;
      case "POLYLINE": {
        const pts = g.points;
        if (pts.length < 2) break;

        ctx.beginPath();
        const p0 = tf.worldToScreen(pts[0].x, pts[0].y);
        ctx.moveTo(p0.x, p0.y);

        for (let i = 1; i < pts.length; i++) {
          const p = tf.worldToScreen(pts[i].x, pts[i].y);
          ctx.lineTo(p.x, p.y);
        }

        ctx.stroke();
        break;
      }
    }
  }

  drawSelection(entities, selection) {
    if (!selection) return;

    const ids = new Set(selection.getAll());
    if (!ids.size) return;

    this.ctx.save();
    this.ctx.strokeStyle = "#1d4ed8";
    this.ctx.lineWidth = 2;

    for (const e of entities) {
      if (!ids.has(e.id)) continue;
      this.drawEntity(e);
    }

    this.ctx.restore();
  }

  drawAll(entities, selection) {
    this.clear();
    this.drawGrid();

    for (const e of entities) {
      this.drawEntity(e);
    }

    this.drawSelection(entities, selection);
  }

  drawGrid(spacingMm = 10) {
    const ctx = this.ctx;
    const tf = this.transform;

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const spacingPx = spacingMm * tf.scale;

    ctx.save();
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;

    const ox = tf.offsetX % spacingPx;
    const oy = tf.offsetY % spacingPx;

    for (let x = ox; x < w; x += spacingPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = oy; y < h; y += spacingPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.restore();
  }
}
