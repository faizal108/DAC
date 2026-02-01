/**
 * Bounding box of line
 */
export function bboxLine(line) {
  return {
    minX: Math.min(line.start.x, line.end.x),
    minY: Math.min(line.start.y, line.end.y),
    maxX: Math.max(line.start.x, line.end.x),
    maxY: Math.max(line.start.y, line.end.y),
  };
}
