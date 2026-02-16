/**
 * UI-level snapping engine
 */
export class SnapEngine {
  constructor(scene, tolerancePx = 10) {
    this.scene = scene;
    this.tolerance = tolerancePx;
  }

  snap(point, transform) {
    let best = null;
    let minDist = Infinity;

    const entities = this.scene.getAll();

    for (const e of entities) {
      const g = e.geometry;

      // Snap to point
      if (g.type === "POINT") {
        this._check(g, point, transform, ({ p, d }) => {
          if (d < minDist) {
            minDist = d;
            best = p;
          }
        });
      }

      // Snap to line endpoints
      if (g.type === "LINE") {
        this._check(g.start, point, transform, ({ p, d }) => {
          if (d < minDist) {
            minDist = d;
            best = p;
          }
        });

        this._check(g.end, point, transform, ({ p, d }) => {
          if (d < minDist) {
            minDist = d;
            best = p;
          }
        });
      }

      // Snap to circle center
      if (g.type === "CIRCLE") {
        this._check(g.center, point, transform, ({ p, d }) => {
          if (d < minDist) {
            minDist = d;
            best = p;
          }
        });
      }

      if (g.type === "POLYLINE" && Array.isArray(g.points)) {
        for (const v of g.points) {
          this._check(v, point, transform, ({ p, d }) => {
            if (d < minDist) {
              minDist = d;
              best = p;
            }
          });
        }
      }
    }

    return best || point;
  }

  _check(target, cur, tf, set) {
    const s1 = tf.worldToScreen(target.x, target.y);

    const s2 = tf.worldToScreen(cur.x, cur.y);

    const dx = s1.x - s2.x;
    const dy = s1.y - s2.y;

    const d = Math.hypot(dx, dy);

    if (d < this.tolerance) {
      set({
        p: {
          x: target.x,
          y: target.y,
        },
        d,
      });
    }
  }
}
