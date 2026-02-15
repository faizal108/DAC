function toUnit(um, unit) {
  return unit === "inch" ? um / 25400 : um / 1000;
}

function lineToDxf(line, unit) {
  return [
    "0",
    "LINE",
    "8",
    "0",
    "10",
    `${toUnit(line.start.x, unit)}`,
    "20",
    `${toUnit(line.start.y, unit)}`,
    "11",
    `${toUnit(line.end.x, unit)}`,
    "21",
    `${toUnit(line.end.y, unit)}`,
  ].join("\n");
}

function circleToDxf(circle, unit) {
  return [
    "0",
    "CIRCLE",
    "8",
    "0",
    "10",
    `${toUnit(circle.center.x, unit)}`,
    "20",
    `${toUnit(circle.center.y, unit)}`,
    "40",
    `${toUnit(circle.radius, unit)}`,
  ].join("\n");
}

function polylineToDxf(polyline, unit) {
  const chunks = ["0", "LWPOLYLINE", "8", "0", "90", `${polyline.points.length}`];

  for (const p of polyline.points) {
    chunks.push("10", `${toUnit(p.x, unit)}`, "20", `${toUnit(p.y, unit)}`);
  }

  return chunks.join("\n");
}

export function exportSceneToDxf(entities, unit = "mm") {
  const body = [];
  for (const e of entities) {
    if (e.type === "LINE") body.push(lineToDxf(e.geometry, unit));
    if (e.type === "CIRCLE") body.push(circleToDxf(e.geometry, unit));
    if (e.type === "POLYLINE") body.push(polylineToDxf(e.geometry, unit));
  }

  const insUnitsCode = unit === "inch" ? "1" : "4"; // 1 inch, 4 mm

  return [
    "0",
    "SECTION",
    "2",
    "HEADER",
    "9",
    "$INSUNITS",
    "70",
    insUnitsCode,
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
    "EOF",
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

export function exportCanvasImage(canvas) {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = "workspace.png";
  a.click();
}
