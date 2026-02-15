/**
 * Canvas renderer
 */
export class CanvasRenderer {
  constructor(canvas, transform) {
    this.ctx = canvas.getContext("2d");
    this.transform = transform;
    this.showGrid = true;
    this.showPoints = false;
    this.showLinePointLabels = false;
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

    if (this.showPoints) {
      this._drawMarker(a.x, a.y);
      this._drawMarker(b.x, b.y);
      if (this.showLinePointLabels) {
        this._drawLabel("S", a.x + 5, a.y - 5);
        this._drawLabel("E", b.x + 5, b.y - 5);
      }
    }
  }

  drawCircle(c) {
    const s = this.transform.worldToScreen(c.center.x, c.center.y);

    const r = (c.radius / 1000) * this.transform.scale;

    this.ctx.beginPath();
    this.ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    this.ctx.stroke();

    if (this.showPoints) {
      this._drawMarker(s.x, s.y);
      if (this.showLinePointLabels) {
        this._drawLabel("C", s.x + 5, s.y - 5);
      }
    }
  }

  drawEntity(e) {
    const ctx = this.ctx;
    const tf = this.transform;
    const g = e.geometry;

    switch (e.type) {
      case "POINT":
        this.drawPoint(g);
        if (this.showPoints) {
          const p = tf.worldToScreen(g.x, g.y);
          this._drawMarker(p.x, p.y);
        }
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

        if (this.showPoints) {
          for (let i = 0; i < pts.length; i++) {
            const p = tf.worldToScreen(pts[i].x, pts[i].y);
            this._drawMarker(p.x, p.y);
            if (this.showLinePointLabels) {
              this._drawLabel(`${i}`, p.x + 5, p.y - 5);
            }
          }
        }
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
    if (this.showGrid) {
      this.drawGrid();
    }

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
    if (!Number.isFinite(spacingPx) || spacingPx < 8) return;

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

  _drawMarker(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = "#ef4444";
    this.ctx.fillRect(x - 2, y - 2, 4, 4);
    this.ctx.restore();
  }

  _drawLabel(text, x, y) {
    this.ctx.save();
    this.ctx.fillStyle = "#b91c1c";
    this.ctx.font = "10px ui-monospace, monospace";
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }
}
