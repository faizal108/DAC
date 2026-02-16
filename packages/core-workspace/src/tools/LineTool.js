import { BaseTool } from "./BaseTool.js";
import { AddEntityCommand } from "@dac/core-commands";
import { createLine } from "@dac/core-geometry";

export class LineTool extends BaseTool {
  constructor(ws) {
    super(ws);

    this.start = null;
    this.current = null;
    this.shiftLock = false;
  }

  _constrain(p) {
    if (!this.start || !this.shiftLock) return p;
    const dx = p.x - this.start.x;
    const dy = p.y - this.start.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return { x: p.x, y: this.start.y };
    }
    return { x: this.start.x, y: p.y };
  }

  onMouseDown(p) {
    if (!this.start) {
      this.start = p;
      this.current = p;
    } else {
      const end = this._constrain(this.current || p);
      try {
        const line = createLine(this.start, end);
        this.ws.commands.execute(new AddEntityCommand(line));
        this.start = end;
        this.current = end;
      } catch {
        // ignore invalid short segment
      }
    }
  }

  onMouseMove(p, e) {
    this.shiftLock = !!e?.shiftKey;
    this.current = this._constrain(p);
  }

  drawOverlay(ctx) {
    if (!this.start) return;

    const cur = this.current || this.ws.lastMouse;

    if (!cur) return;

    const a = this.ws.transform.worldToScreen(this.start.x, this.start.y);
    const b = this.ws.transform.worldToScreen(cur.x, cur.y);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    const lenUm = Math.hypot(cur.x - this.start.x, cur.y - this.start.y);
    const lenMm = lenUm / 1000;
    ctx.save();
    ctx.fillStyle = "#1f2937";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(`${lenMm.toFixed(2)} mm`, b.x + 8, b.y - 8);
    ctx.restore();
  }

  onKeyDown(e) {
    if (!this.start || e.key !== "Enter") return;
    const ref = this.current || this.start;
    const dx = ref.x - this.start.x;
    const dy = ref.y - this.start.y;
    const dirLen = Math.hypot(dx, dy) || 1;
    const raw = window.prompt("Line length (mm):");
    if (raw == null) return;
    const lenMm = Number(raw);
    if (!Number.isFinite(lenMm) || lenMm <= 0) return;
    const lenUm = Math.round(lenMm * 1000);
    const ux = dx / dirLen;
    const uy = dy / dirLen;
    const end = {
      x: Math.round(this.start.x + ux * lenUm),
      y: Math.round(this.start.y + uy * lenUm),
    };
    try {
      const line = createLine(this.start, end);
      this.ws.commands.execute(new AddEntityCommand(line));
      this.start = end;
      this.current = end;
    } catch {
      // ignore invalid short segment
    }
  }

  onCancel() {
    this.start = null;
    this.current = null;
    this.shiftLock = false;
  }

  getHint() {
    if (!this.start) return "Line: pick first point";
    return "Line: pick next point (Shift=orthogonal, Enter=typed length, Esc=finish)";
  }
}
