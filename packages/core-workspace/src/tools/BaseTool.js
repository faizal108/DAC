/**
 * Base tool interface
 */
export class BaseTool {
  constructor(workspace) {
    this.ws = workspace;
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
