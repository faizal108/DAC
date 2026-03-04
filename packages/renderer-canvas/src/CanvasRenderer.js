/**
 * Canvas renderer
 */
export class CanvasRenderer {
  constructor(canvas, transform) {
    this.ctx = canvas.getContext("2d");
    this.transform = transform;
    this.showGrid = true;
    // World unit is micrometers (um). 1000um = 1mm.
    this.gridSpacingUm = 1000;
    this.showPoints = false;
    this.showLinePointLabels = false;
    this.colors = {
      line: "#1d4ed8",
      lineSelected: "#60a5fa",
      grid: "#d7deeb",
      point: "#2563eb",
      pointSelected: "#f59e0b",
      label: "#3b82f6",
    };
  }

  clear() {
    const c = this.ctx.canvas;

    this.ctx.clearRect(0, 0, c.width, c.height);
  }

  _readCssVar(name, fallback) {
    if (typeof window === "undefined") return fallback;
    const root = document.documentElement;
    const value = window.getComputedStyle(root).getPropertyValue(name).trim();
    return value || fallback;
  }

  _resolveThemeColors() {
    this.colors.line = this._readCssVar("--cad-line", this.colors.line);
    this.colors.lineSelected = this._readCssVar(
      "--cad-line-selected",
      this.colors.lineSelected,
    );
    this.colors.grid = this._readCssVar("--cad-grid", this.colors.grid);
    this.colors.point = this._readCssVar("--cad-point", this.colors.point);
    this.colors.pointSelected = this._readCssVar(
      "--cad-point-selected",
      this.colors.pointSelected,
    );
    this.colors.label = this._readCssVar("--cad-line", this.colors.label);
  }

  drawPoint(p) {
    const s = this.transform.worldToScreen(p.x, p.y);

    this.ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
  }

  drawLine(l, opts = {}) {
    const a = this.transform.worldToScreen(l.start.x, l.start.y);

    const b = this.transform.worldToScreen(l.end.x, l.end.y);

    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.stroke();

    if (this.showPoints) {
      this._drawMarker(a.x, a.y, opts.selected);
      this._drawMarker(b.x, b.y, opts.selected);
      if (this.showLinePointLabels) {
        this._drawLabel("S", a.x + 5, a.y - 5);
        this._drawLabel("E", b.x + 5, b.y - 5);
      }
    }
  }

  drawCircle(c, opts = {}) {
    const s = this.transform.worldToScreen(c.center.x, c.center.y);

    const r = (c.radius / 1000) * this.transform.scale;

    this.ctx.beginPath();
    this.ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    this.ctx.stroke();

    if (this.showPoints) {
      this._drawMarker(s.x, s.y, opts.selected);
      if (this.showLinePointLabels) {
        this._drawLabel("C", s.x + 5, s.y - 5);
      }
    }
  }

  drawEntity(e, opts = {}) {
    const ctx = this.ctx;
    const tf = this.transform;
    const g = e.geometry;
    const renderColor = e?.meta?.renderColor;

    ctx.save();
    const stroke = opts.selected
      ? this.colors.lineSelected
      : renderColor || this.colors.line;
    ctx.strokeStyle = stroke;
    ctx.fillStyle = stroke;
    ctx.lineWidth = opts.selected ? 1.5 : 1;
    switch (e.type) {
      case "POINT":
        this.drawPoint(g);
        if (this.showPoints) {
          const p = tf.worldToScreen(g.x, g.y);
          this._drawMarker(p.x, p.y, opts.selected);
        }
        break;

      case "LINE":
        this.drawLine(g, opts);
        break;

      case "CIRCLE":
        this.drawCircle(g, opts);
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
            this._drawMarker(p.x, p.y, opts.selected);
            if (this.showLinePointLabels) {
              this._drawLabel(`${i}`, p.x + 5, p.y - 5);
            }
          }
        }
        break;
      }
    }
    ctx.restore();
  }

  drawSelection(entities, selection) {
    if (!selection) return;

    const ids = new Set(selection.getAll());
    if (!ids.size) return;

    this.ctx.save();
    this.ctx.setLineDash([8, 4]);

    for (const e of entities) {
      if (!ids.has(e.id)) continue;
      this.drawEntity(e, { selected: true });
    }

    this.ctx.restore();
  }

  drawAll(entities, selection) {
    this._resolveThemeColors();
    this.clear();
    if (this.showGrid) {
      this.drawGrid();
    }

    for (const e of entities) {
      this.drawEntity(e);
    }

    this.drawSelection(entities, selection);
  }

  drawGrid() {
    const ctx = this.ctx;
    const tf = this.transform;

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const spacingUm = Math.max(1, Number(this.gridSpacingUm) || 1000);
    const spacingPx = (spacingUm / 1000) * tf.scale;
    if (!Number.isFinite(spacingPx) || spacingPx < 8) return;

    ctx.save();
    ctx.strokeStyle = this.colors.grid;
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

  _drawMarker(x, y, selected = false) {
    this.ctx.save();
    const size = selected ? 7 : 5;
    const half = size / 2;
    this.ctx.strokeStyle = selected ? this.colors.pointSelected : this.colors.point;
    this.ctx.lineWidth = selected ? 1.5 : 1;
    this.ctx.setLineDash([]);
    this.ctx.strokeRect(x - half, y - half, size, size);

    if (selected) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - half - 1, y);
      this.ctx.lineTo(x + half + 1, y);
      this.ctx.moveTo(x, y - half - 1);
      this.ctx.lineTo(x, y + half + 1);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  _drawLabel(text, x, y) {
    this.ctx.save();
    this.ctx.fillStyle = this.colors.label;
    this.ctx.font = "10px ui-monospace, monospace";
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }
}
