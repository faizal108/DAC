/**
 * World <-> Screen transform
 */
export class ViewTransform {
  constructor() {
    this.scale = 1; // px per mm
    this.offsetX = 0;
    this.offsetY = 0;
  }

  worldToScreen(xUm, yUm) {
    const xMm = xUm / 1000;
    const yMm = yUm / 1000;

    return {
      x: xMm * this.scale + this.offsetX,
      y: -yMm * this.scale + this.offsetY,
    };
  }

  screenToWorld(xPx, yPx) {
    return {
      x: ((xPx - this.offsetX) / this.scale) * 1000,
      y: (-(yPx - this.offsetY) / this.scale) * 1000,
    };
  }
}
