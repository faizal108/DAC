/**
 * Normalize unknown machine input into MachinePoint
 * Returns null if input is invalid
 */
export function normalizePoint(input) {
  if (!input) return null;

  let x,
    y,
    t,
    meta = {};

  // Array format: [x, y]
  if (Array.isArray(input) && input.length >= 2) {
    x = Number(input[0]);
    y = Number(input[1]);
  }

  // Object format: { x, y, ... }
  else if (typeof input === "object") {
    x = Number(input.x);
    y = Number(input.y);

    if (input.timestamp != null) {
      t = Number(input.timestamp);
    }

    meta = { ...input };
    delete meta.x;
    delete meta.y;
    delete meta.timestamp;
  }

  // CSV string: "x,y"
  else if (typeof input === "string") {
    const trimmed = input.trim();

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return normalizePoint(JSON.parse(trimmed));
      } catch {
        // Fallback to CSV parsing below.
      }
    }

    const parts = trimmed.split(",");
    if (parts.length >= 2) {
      x = Number(parts[0]);
      y = Number(parts[1]);
    }
  }

  // Validation
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x,
    y,
    t: Number.isFinite(t) ? t : Date.now(),
    meta,
  };
}
