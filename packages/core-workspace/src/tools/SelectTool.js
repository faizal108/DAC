import { BaseTool } from "./BaseTool.js";

export class SelectTool extends BaseTool {
  onMouseDown(p) {
    const tf = this.ws.transform;

    // Convert 10px → world units
    const tol = (10 / tf.scale) * 1000;

    this.ws.scene.selection.selectAt(p, tol);
  }

  getHint() {
    return "Select: click object";
  }
}
