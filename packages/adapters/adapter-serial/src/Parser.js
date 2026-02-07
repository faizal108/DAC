/**
 * Serial protocol parser
 */
export class Parser {
  parse(line) {
    line = line.trim();

    if (!line) return null;

    // Example: X:123,Y:456
    const m = /X:(-?\d+),Y:(-?\d+)/.exec(line);

    if (!m) return null;

    return {
      type: "POINT",
      x: Number(m[1]),
      y: Number(m[2]),
      t: Date.now(),
      source: "serial",
    };
  }
}
