import { EPS } from "../utils/numbers.js";

/**
 * Line-Circle intersection
 */
export function intersectLineCircle(line, circle) {
  const cx = circle.center.x;
  const cy = circle.center.y;
  const r = circle.radius;

  const x1 = line.start.x - cx;
  const y1 = line.start.y - cy;
  const x2 = line.end.x - cx;
  const y2 = line.end.y - cy;

  const dx = x2 - x1;
  const dy = y2 - y1;

  const a = dx * dx + dy * dy;
  const b = 2 * (x1 * dx + y1 * dy);
  const c = x1 * x1 + y1 * y1 - r * r;

  const disc = b * b - 4 * a * c;

  if (disc < -EPS) return [];

  const out = [];

  if (Math.abs(disc) <= EPS) {
    const t = -b / (2 * a);

    if (t >= 0 && t <= 1) {
      out.push({
        x: Math.round(x1 + t * dx + cx),
        y: Math.round(y1 + t * dy + cy),
      });
    }

    return out;
  }

  const sqrt = Math.sqrt(disc);

  const t1 = (-b + sqrt) / (2 * a);
  const t2 = (-b - sqrt) / (2 * a);

  if (t1 >= 0 && t1 <= 1) {
    out.push({
      x: Math.round(x1 + t1 * dx + cx),
      y: Math.round(y1 + t1 * dy + cy),
    });
  }

  if (t2 >= 0 && t2 <= 1) {
    out.push({
      x: Math.round(x1 + t2 * dx + cx),
      y: Math.round(y1 + t2 * dy + cy),
    });
  }

  return out;
}

/**
 * Circle-Circle intersection
 */
export function intersectCircleCircle(c1, c2) {
  const x0 = c1.center.x;
  const y0 = c1.center.y;
  const r0 = c1.radius;

  const x1 = c2.center.x;
  const y1 = c2.center.y;
  const r1 = c2.radius;

  const dx = x1 - x0;
  const dy = y1 - y0;

  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > r0 + r1 + EPS) return [];
  if (d < Math.abs(r0 - r1) - EPS) return [];
  if (d < EPS && Math.abs(r0 - r1) < EPS) return [];

  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);

  const h2 = r0 * r0 - a * a;
  if (h2 < -EPS) return [];

  const h = Math.sqrt(Math.max(0, h2));

  const xm = x0 + (a * dx) / d;
  const ym = y0 + (a * dy) / d;

  const rx = (-dy * h) / d;
  const ry = (dx * h) / d;

  const p1 = {
    x: Math.round(xm + rx),
    y: Math.round(ym + ry),
  };

  const p2 = {
    x: Math.round(xm - rx),
    y: Math.round(ym - ry),
  };

  if (Math.abs(h) <= EPS) return [p1];

  return [p1, p2];
}
