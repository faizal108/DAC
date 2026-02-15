/**
 * Serial protocol parser
 */
export class Parser {
  parse(line) {
    line = line.trim();

    if (!line) return null;

    // Example: X:123,Y:456 OR X:12.34,Y:-0.40[,U:mm]
    let m = /X:\s*(-?\d+(?:\.\d+)?)\s*,\s*Y:\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*U(?:NIT)?:\s*([a-zA-Z]+))?/i.exec(
      line,
    );

    // Example: 12.34,56.78
    if (!m) {
      m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(line);
      if (m) {
        return {
          type: "POINT",
          x: Number(m[1]),
          y: Number(m[2]),
          t: Date.now(),
          source: "serial",
        };
      }
      return null;
    }

    return {
      type: "POINT",
      x: Number(m[1]),
      y: Number(m[2]),
      unit: m[3]?.toLowerCase(),
      t: Date.now(),
      source: "serial",
    };
  }
}
