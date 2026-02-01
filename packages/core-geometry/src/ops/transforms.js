import { toInternal } from "../utils/numbers.js";
import { createPointInternal } from "../primitives/point.js";
import { createLine } from "../primitives/line.js";
import { createCircle } from "../primitives/circle.js";
import { createArc } from "../primitives/arc.js";

/**
 * Apply matrix to point
 */
export function transformPoint(point, m) {
  const [a, b, c, d, tx, ty] = m;

  const x = a * point.x + c * point.y + tx;
  const y = b * point.x + d * point.y + ty;

  return createPointInternal(Math.round(x), Math.round(y));
}

/**
 * Transform entity
 */
export function transformEntity(entity, matrix) {
  switch (entity.type) {
    case "LINE": {
      return createLine(
        transformPoint(entity.start, matrix),
        transformPoint(entity.end, matrix),
      );
    }

    case "CIRCLE": {
      const c = transformPoint(entity.center, matrix);

      // Assume uniform scale
      const s = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);

      return createCircle(c, Math.round(entity.radius * s));
    }

    case "ARC": {
      const c = transformPoint(entity.center, matrix);

      const s = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);

      return createArc(
        c,
        Math.round(entity.radius * s),
        entity.startAngle,
        entity.endAngle,
        entity.clockwise,
      );
    }

    default:
      throw new Error("Unsupported entity type");
  }
}
