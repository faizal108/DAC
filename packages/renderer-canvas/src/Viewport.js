/**
 * Viewport controller
 * Handles zoom & pan
 */
export class Viewport {
  constructor(transform, canvas) {
    this.transform = transform;
    this.canvas = canvas;
    this.minScale = 2;
    this.maxScale = 200;

    this._dragging = false;
    this._last = null;

    this._bind();
  }

  _bind() {
    // Zoom
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Exponential factor gives smoother zoom behavior than fixed jumps.
        const factor = Math.exp(-e.deltaY * 0.0015);
        this.zoomAt(x, y, factor);
      },
      { passive: false },
    );

    // Pan
    this.canvas.addEventListener("mousedown", (e) => {
      // Keep left click free for drawing/select tools.
      if (e.button === 0) return;

      this._dragging = true;
      this._last = {
        x: e.clientX,
        y: e.clientY,
      };
    });

    window.addEventListener("mouseup", () => {
      this._dragging = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (!this._dragging) return;

      const dx = e.clientX - this._last.x;
      const dy = e.clientY - this._last.y;

      this.transform.offsetX += dx;
      this.transform.offsetY += dy;

      this._last = {
        x: e.clientX,
        y: e.clientY,
      };
    });
  }

  zoomAt(screenX, screenY, factor) {
    const before = this.transform.screenToWorld(screenX, screenY);

    const nextScale = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.transform.scale * factor),
    );
    this.transform.scale = nextScale;
    this.transform.offsetX = screenX - (before.x / 1000) * this.transform.scale;
    this.transform.offsetY = screenY + (before.y / 1000) * this.transform.scale;
  }
}
