import { BaseTool } from "./BaseTool.js";
import { AddEntityCommand } from "../../../core-commands/src/index.js";

import { createLine } from "../../../core-geometry/src/index.js";

export class LineTool extends BaseTool {
  constructor(ws) {
    super(ws);

    this.start = null;
  }

  onMouseDown(p) {
    if (!this.start) {
      this.start = p;
    } else {
      const line = createLine(this.start, p);

      this.ws.commands.execute(new AddEntityCommand(line));

      this.start = null;
    }
  }

  drawOverlay(ctx) {
    if (!this.start) return;

    const cur = this.ws.lastMouse;

    if (!cur) return;

    const a = this.ws.transform.worldToScreen(this.start.x, this.start.y);

    const b = this.ws.transform.worldToScreen(cur.x, cur.y);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  onCancel() {
    this.start = null;
  }
}
