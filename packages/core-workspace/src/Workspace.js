import { ToolManager } from "./ToolManager.js";
import { SnapEngine } from "./tools/SnapEngine.js";

export class Workspace {
  constructor(canvas, scene, renderer, transform) {
    this.canvas = canvas;
    this.scene = scene;
    this.renderer = renderer;
    this.transform = transform;

    this.tools = new ToolManager(this);
    this.snap = new SnapEngine(scene);
    this.snapEnabled = true;
    this.lastMouse = null;

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
    const tool = this.tools.get();
    let p = this._worldPos(e);
    if (this.snapEnabled && tool?.useSnap !== false) {
      p = this.snap.snap(p, this.transform);
    }
    tool?.onMouseDown(p, e);
  }

  _onMove(e) {
    const tool = this.tools.get();
    let p = this._worldPos(e);

    this.lastMouse = p;

    // Apply snap
    if (this.snapEnabled && tool?.useSnap !== false) {
      p = this.snap.snap(p, this.transform);
    }

    tool?.onMouseMove(p, e);
  }

  _onUp(e) {
    const tool = this.tools.get();
    let p = this._worldPos(e);
    if (this.snapEnabled && tool?.useSnap !== false) {
      p = this.snap.snap(p, this.transform);
    }

    tool?.onMouseUp(p, e);
  }

  _onKey(e) {
    this.tools.get()?.onKeyDown(e);
  }
}
