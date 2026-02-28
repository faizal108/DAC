function toUnit(um, unit) {
  return unit === "inch" ? um / 25400 : um / 1000;
}

function toSafeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asDxfNumber(value, precision = 6) {
  const n = toSafeNumber(value);
  return Number(n.toFixed(precision)).toString();
}

function lineToDxf(line, unit) {
  return [
    "0",
    "LINE",
    "8",
    "0",
    "10",
    asDxfNumber(toUnit(line.start.x, unit)),
    "20",
    asDxfNumber(toUnit(line.start.y, unit)),
    "30",
    "0",
    "11",
    asDxfNumber(toUnit(line.end.x, unit)),
    "21",
    asDxfNumber(toUnit(line.end.y, unit)),
    "31",
    "0",
  ].join("\n");
}

function circleToDxf(circle, unit) {
  return [
    "0",
    "CIRCLE",
    "8",
    "0",
    "10",
    asDxfNumber(toUnit(circle.center.x, unit)),
    "20",
    asDxfNumber(toUnit(circle.center.y, unit)),
    "30",
    "0",
    "40",
    asDxfNumber(toUnit(circle.radius, unit)),
  ].join("\n");
}

function pointToDxf(point, unit) {
  return [
    "0",
    "POINT",
    "8",
    "0",
    "10",
    asDxfNumber(toUnit(point.x, unit)),
    "20",
    asDxfNumber(toUnit(point.y, unit)),
    "30",
    "0",
  ].join("\n");
}

function polylinePointsToDxf(points, unit, closed = false) {
  if (points.length < 2) return "";
  const chunks = [
    "0",
    "POLYLINE",
    "8",
    "0",
    "66",
    "1",
    "70",
    closed ? "1" : "0",
  ];

  for (const p of points) {
    chunks.push(
      "0",
      "VERTEX",
      "8",
      "0",
      "10",
      asDxfNumber(toUnit(p.x, unit)),
      "20",
      asDxfNumber(toUnit(p.y, unit)),
      "30",
      "0",
    );
  }

  chunks.push("0", "SEQEND");
  return chunks.join("\n");
}

function polylineToDxf(polyline, unit) {
  const points = Array.isArray(polyline?.points) ? polyline.points : [];
  return polylinePointsToDxf(points, unit, false);
}

export function exportSceneToDxf(entities, unit = "mm") {
  const body = [];
  const lineVertexPoints = new Map();

  for (const e of entities) {
    if (e.type === "POINT") body.push(pointToDxf(e.geometry, unit));
    if (e.type === "LINE") {
      body.push(lineToDxf(e.geometry, unit));
      const a = e.geometry?.start;
      const b = e.geometry?.end;
      if (a) lineVertexPoints.set(`${a.x},${a.y}`, a);
      if (b) lineVertexPoints.set(`${b.x},${b.y}`, b);
    }
    if (e.type === "CIRCLE") body.push(circleToDxf(e.geometry, unit));
    if (e.type === "POLYLINE") {
      const poly = polylineToDxf(e.geometry, unit);
      if (poly) body.push(poly);
    }
  }

  for (const p of lineVertexPoints.values()) {
    body.push(pointToDxf(p, unit));
  }

  const insUnitsCode = unit === "inch" ? "1" : "4"; // 1 inch, 4 mm

  return [
    "0",
    "SECTION",
    "2",
    "HEADER",
    "9",
    "$ACADVER",
    "1",
    "AC1009",
    "9",
    "$INSUNITS",
    "70",
    insUnitsCode,
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "TABLES",
    "0",
    "TABLE",
    "2",
    "LTYPE",
    "70",
    "1",
    "0",
    "LTYPE",
    "2",
    "CONTINUOUS",
    "70",
    "64",
    "3",
    "Solid line",
    "72",
    "65",
    "73",
    "0",
    "40",
    "0.0",
    "0",
    "ENDTAB",
    "0",
    "TABLE",
    "2",
    "LAYER",
    "70",
    "1",
    "0",
    "LAYER",
    "2",
    "0",
    "70",
    "0",
    "62",
    "7",
    "6",
    "CONTINUOUS",
    "0",
    "ENDTAB",
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "ENTITIES",
    body.join("\n"),
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "OBJECTS",
    "0",
    "ENDSEC",
    "0",
    "EOF",
    "",
  ].join("\n");
}

export function exportSceneToGcode(entities, unit = "mm") {
  const mode = unit === "inch" ? "G20" : "G21";
  const out = [mode];

  for (const e of entities) {
    if (e.type !== "LINE") continue;
    const a = e.geometry.start;
    const b = e.geometry.end;
    out.push(
      `G0 X${toUnit(a.x, unit).toFixed(4)} Y${toUnit(a.y, unit).toFixed(4)}`,
    );
    out.push(
      `G1 X${toUnit(b.x, unit).toFixed(4)} Y${toUnit(b.y, unit).toFixed(4)}`,
    );
  }

  return out.join("\n");
}

export function exportSceneToCsv(entities, unit = "mm") {
  const rows = [`entity,type,x(${unit}),y(${unit}),meta`];

  for (const e of entities) {
    if (e.type === "LINE") {
      rows.push(
        `${e.id},LINE_START,${toUnit(e.geometry.start.x, unit)},${toUnit(e.geometry.start.y, unit)},start`,
      );
      rows.push(
        `${e.id},LINE_END,${toUnit(e.geometry.end.x, unit)},${toUnit(e.geometry.end.y, unit)},end`,
      );
    }

    if (e.type === "CIRCLE") {
      rows.push(
        `${e.id},CIRCLE_CENTER,${toUnit(e.geometry.center.x, unit)},${toUnit(e.geometry.center.y, unit)},r=${toUnit(e.geometry.radius, unit)}`,
      );
    }

    if (e.type === "POLYLINE") {
      e.geometry.points.forEach((p, idx) => {
        rows.push(
          `${e.id},POLY_PT,${toUnit(p.x, unit)},${toUnit(p.y, unit)},idx=${idx}`,
        );
      });
    }
  }

  return rows.join("\n");
}

export function downloadFile(name, data, mimeType) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCanvasImage(canvas, name = "workspace") {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.png`;
  a.click();
}
