import { BaseTool } from "./BaseTool.js";

export class SelectTool extends BaseTool {
  onMouseDown(p) {
    const hits = this.ws.scene.index.queryPoint(p);

    if (hits.length) {
      this.ws.scene.selection.set(hits[0].id);
    } else {
      this.ws.scene.selection.clear();
    }
  }
}
