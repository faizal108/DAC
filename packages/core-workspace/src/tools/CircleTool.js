import { BaseTool } from "./BaseTool.js";
import { AddEntityCommand } from "@dac/core-commands";
import { createCircle } from "@dac/core-geometry";

export class CircleTool extends BaseTool {
  constructor(ws) {
    super(ws);

    this.center = null;
    this.current = null;
  }

  onMouseDown(p) {
    if (!this.center) {
      this.center = p;
      this.current = p;
    } else {
      const ref = this.current || p;
      const dx = ref.x - this.center.x;
      const dy = ref.y - this.center.y;

      const r = Math.round(Math.hypot(dx, dy));

      try {
        const circle = createCircle(this.center, r);
        this.ws.commands.execute(new AddEntityCommand(circle));
      } catch {
        // ignore invalid tiny radius
      }

      this.center = null;
      this.current = null;
    }
  }

  onMouseMove(p) {
    this.current = p;
  }

  drawOverlay(ctx) {
    if (!this.center) return;

    const cur = this.current || this.ws.lastMouse;

    if (!cur) return;

    const tf = this.ws.transform;

    const c = tf.worldToScreen(this.center.x, this.center.y);

    const dx = cur.x - this.center.x;
    const dy = cur.y - this.center.y;

    const r = (Math.hypot(dx, dy) / 1000) * tf.scale;

    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.stroke();

    const radiusMm = Math.hypot(dx, dy) / 1000;
    ctx.save();
    ctx.fillStyle = "#1f2937";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(`R ${radiusMm.toFixed(2)} mm`, c.x + r + 8, c.y);
    ctx.restore();
  }

  onKeyDown(e) {
    if (!this.center || e.key !== "Enter") return;
    const raw = window.prompt("Circle radius (mm):");
    if (raw == null) return;
    const rMm = Number(raw);
    if (!Number.isFinite(rMm) || rMm <= 0) return;
    const rUm = Math.round(rMm * 1000);
    try {
      const circle = createCircle(this.center, rUm);
      this.ws.commands.execute(new AddEntityCommand(circle));
    } catch {
      // ignore invalid radius
    }
    this.center = null;
    this.current = null;
  }

  onCancel() {
    this.center = null;
    this.current = null;
  }

  getHint() {
    if (!this.center) return "Circle: pick center";
    return "Circle: pick radius point (Enter=typed radius)";
  }
}
