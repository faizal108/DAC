import { BaseTool } from "./BaseTool.js";

import { RemoveEntityCommand } from "../../../core-commands/src/index.js";

export class TrimTool extends BaseTool {
  onMouseDown(p) {
    const tf = this.ws.transform;

    // Convert ~10px to world units
    const toleranceUm = (10 / tf.scale) * 1000;

    const hits = this.ws.scene.index.queryPoint(p, toleranceUm);

    if (!hits.length) return;

    const id = hits[0].id;

    this.ws.commands.execute(new RemoveEntityCommand(id));
  }
}
