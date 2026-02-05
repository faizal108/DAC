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
    switch (e.type) {
      case "POINT":
        this.drawPoint(e.geometry);
        break;

      case "LINE":
        this.drawLine(e.geometry);
        break;

      case "CIRCLE":
        this.drawCircle(e.geometry);
        break;
    }
  }

  drawAll(entities) {
    this.clear();

    for (const e of entities) {
      this.drawEntity(e);
    }
  }
}
