/**
 * Manages active tool
 */
export class ToolManager {
  constructor(workspace) {
    this.ws = workspace;
    this.active = null;
  }

  set(tool) {
    if (this.active?.onCancel) {
      this.active.onCancel();
    }

    this.active = tool;
  }

  get() {
    return this.active;
  }
}
