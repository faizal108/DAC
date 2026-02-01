import { distance } from "../primitives/point.js";
import { projectPointOnLine } from "./projections.js";
import { intersectLineLine } from "./intersections.js";

/**
 * Endpoint snaps
 */
function endpointSnaps(point, entities) {
  const out = [];

  for (const e of entities) {
    if (e.type === "LINE") {
      out.push({
        type: "ENDPOINT",
        point: e.start,
        distance: distance(point, e.start),
      });

      out.push({
        type: "ENDPOINT",
        point: e.end,
        distance: distance(point, e.end),
      });
    }
  }

  return out;
}

/**
 * Midpoint snaps
 */
function midpointSnaps(point, entities) {
  const out = [];

  for (const e of entities) {
    if (e.type === "LINE") {
      const mx = Math.round((e.start.x + e.end.x) / 2);
      const my = Math.round((e.start.y + e.end.y) / 2);

      out.push({
        type: "MIDPOINT",
        point: { x: mx, y: my },
        distance: distance(point, {
          x: mx,
          y: my,
        }),
      });
    }
  }

  return out;
}

/**
 * Nearest-on-entity snaps
 */
function nearestSnaps(point, entities) {
  const out = [];

  for (const e of entities) {
    if (e.type === "LINE") {
      const proj = projectPointOnLine(point, e);

      out.push({
        type: "NEAREST",
        point: proj.point,
        distance: distance(point, proj.point),
      });
    }
  }

  return out;
}

/**
 * Intersection snaps
 */
function intersectionSnaps(point, entities) {
  const out = [];

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i];
      const b = entities[j];

      if (a.type === "LINE" && b.type === "LINE") {
        const pts = intersectLineLine(a, b);

        for (const p of pts) {
          out.push({
            type: "INTERSECTION",
            point: p,
            distance: distance(point, p),
          });
        }
      }
    }
  }

  return out;
}

/**
 * Find best snap
 */
const PRIORITY = {
  INTERSECTION: 1,
  ENDPOINT: 2,
  MIDPOINT: 3,
  CENTER: 4,
  NEAREST: 5,
};

export function findSnap(
  cursorPoint,
  entities,
  maxDist = 500, // 0.5mm
) {
  let candidates = [];

  candidates.push(...endpointSnaps(cursorPoint, entities));

  candidates.push(...midpointSnaps(cursorPoint, entities));

  candidates.push(...intersectionSnaps(cursorPoint, entities));

  candidates.push(...nearestSnaps(cursorPoint, entities));

  // Filter by max distance
  candidates = candidates.filter((c) => c.distance <= maxDist);

  if (!candidates.length) return null;

  // Sort by priority first, distance second
  candidates.sort((a, b) => {
    const pa = PRIORITY[a.type] || 99;
    const pb = PRIORITY[b.type] || 99;

    if (pa !== pb) {
      return pa - pb;
    }

    return a.distance - b.distance;
  });

  return candidates[0];
}
