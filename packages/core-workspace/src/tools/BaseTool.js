/**
 * Base tool interface
 */
export class BaseTool {
  constructor(workspace) {
    this.ws = workspace;
    this.useSnap = true;
  }

  onMouseDown() {}
  onMouseMove() {}
  onMouseUp() {}
  onKeyDown() {}
  onCancel() {}
  drawOverlay() {}
  getHint() {
    return "";
  }
}
