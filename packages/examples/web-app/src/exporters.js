function lineToDxf(line) {
  return [
    "0",
    "LINE",
    "8",
    "0",
    "10",
    `${line.start.x / 1000}`,
    "20",
    `${line.start.y / 1000}`,
    "11",
    `${line.end.x / 1000}`,
    "21",
    `${line.end.y / 1000}`,
  ].join("\n");
}

function circleToDxf(circle) {
  return [
    "0",
    "CIRCLE",
    "8",
    "0",
    "10",
    `${circle.center.x / 1000}`,
    "20",
    `${circle.center.y / 1000}`,
    "40",
    `${circle.radius / 1000}`,
  ].join("\n");
}

function polylineToDxf(polyline) {
  const chunks = ["0", "LWPOLYLINE", "8", "0", "90", `${polyline.points.length}`];

  for (const p of polyline.points) {
    chunks.push("10", `${p.x / 1000}`, "20", `${p.y / 1000}`);
  }

  return chunks.join("\n");
}

export function exportSceneToDxf(entities) {
  const body = [];

  for (const e of entities) {
    if (e.type === "LINE") body.push(lineToDxf(e.geometry));
    if (e.type === "CIRCLE") body.push(circleToDxf(e.geometry));
    if (e.type === "POLYLINE") body.push(polylineToDxf(e.geometry));
  }

  return [
    "0",
    "SECTION",
    "2",
    "HEADER",
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
