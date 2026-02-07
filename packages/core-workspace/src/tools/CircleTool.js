import { BaseTool } from "./BaseTool.js";

import { AddEntityCommand } from "../../../core-commands/src/index.js";

import { createCircle } from "../../../core-geometry/src/index.js";

export class CircleTool extends BaseTool {
  constructor(ws) {
    super(ws);

    this.center = null;
  }

  onMouseDown(p) {
    if (!this.center) {
      this.center = p;
    } else {
      const dx = p.x - this.center.x;
      const dy = p.y - this.center.y;

      const r = Math.round(Math.hypot(dx, dy));

      const circle = createCircle(this.center, r);

      this.ws.commands.execute(new AddEntityCommand(circle));

      this.center = null;
    }
  }

  drawOverlay(ctx) {
    if (!this.center) return;

    const cur = this.ws.lastMouse;

    if (!cur) return;

    const tf = this.ws.transform;

    const c = tf.worldToScreen(this.center.x, this.center.y);

    const dx = cur.x - this.center.x;
    const dy = cur.y - this.center.y;

    const r = (Math.hypot(dx, dy) / 1000) * tf.scale;

    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  onCancel() {
    this.center = null;
  }
}
