/**
 * Viewport controller
 * Handles zoom & pan
 */
export class Viewport {
  constructor(transform, canvas) {
    this.transform = transform;
    this.canvas = canvas;

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

        const scale = e.deltaY < 0 ? 1.1 : 0.9;

        this.transform.scale *= scale;
      },
      { passive: false },
    );

    // Pan
    this.canvas.addEventListener("mousedown", (e) => {
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
}
