/**
 * Normalize unknown machine input into MachinePoint
 * Returns null if input is invalid
 */
const UNIT_TO_UM = {
  um: 1,
  mm: 1000,
  cm: 10000,
  inch: 25400,
  in: 25400,
};

function toUm(v, unit) {
  const scale = UNIT_TO_UM[unit] || UNIT_TO_UM.um;
  return Math.round(v * scale);
}

export function normalizePoint(input, { unit = "um" } = {}) {
  if (!input) return null;

  let x,
    y,
    t,
    parsedUnit,
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
    parsedUnit = typeof input.unit === "string" ? input.unit.toLowerCase() : null;
  }

  // CSV string: "x,y"
  else if (typeof input === "string") {
    const trimmed = input.trim();

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return normalizePoint(JSON.parse(trimmed), { unit });
      } catch {
        // Fallback to CSV parsing below.
      }
    }

    // "X:123,Y:456[,U:mm]" format
    const keyed = /X:\s*(-?\d+(?:\.\d+)?)\s*,\s*Y:\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*U(?:NIT)?:\s*([a-zA-Z]+))?/i.exec(
      trimmed,
    );
    if (keyed) {
      x = Number(keyed[1]);
      y = Number(keyed[2]);
      if (keyed[3]) parsedUnit = keyed[3].toLowerCase();
    }

    const parts = trimmed.split(",");
    if (!keyed && parts.length >= 2) {
      x = Number(parts[0]);
      y = Number(parts[1]);
    }
  }

  // Validation
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  const effectiveUnit = parsedUnit || unit;

  return {
    x: toUm(x, effectiveUnit),
    y: toUm(y, effectiveUnit),
    t: Number.isFinite(t) ? t : Date.now(),
    meta: {
      ...meta,
      inputUnit: effectiveUnit,
    },
  };
}
