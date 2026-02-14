export function createPolyline(points) {
  if (!points || points.length < 2) {
    throw new Error("Polyline requires ≥ 2 points");
  }

  return {
    type: "POLYLINE",
    points,
  };
}
