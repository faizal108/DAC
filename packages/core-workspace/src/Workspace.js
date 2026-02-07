import { ToolManager } from "./ToolManager.js";

export class Workspace {
  constructor(canvas, scene, renderer, transform) {
    this.canvas = canvas;
    this.scene = scene;
    this.renderer = renderer;
    this.transform = transform;

    this.tools = new ToolManager(this);

    this._bind();
  }

  _bind() {
    this.canvas.addEventListener("mousedown", (e) => this._onDown(e));

    this.canvas.addEventListener("mousemove", (e) => this._onMove(e));

    window.addEventListener("mouseup", (e) => this._onUp(e));

    window.addEventListener("keydown", (e) => this._onKey(e));
  }

  _worldPos(e) {
    const r = this.canvas.getBoundingClientRect();

    return this.transform.screenToWorld(e.clientX - r.left, e.clientY - r.top);
  }

  _onDown(e) {
    const p = this._worldPos(e);

    this.tools.get()?.onMouseDown(p, e);
  }

  _onMove(e) {
    const p = this._worldPos(e);

    this.tools.get()?.onMouseMove(p, e);
  }

  _onUp(e) {
    const p = this._worldPos(e);

    this.tools.get()?.onMouseUp(p, e);
  }

  _onKey(e) {
    this.tools.get()?.onKeyDown(e);
  }
}
