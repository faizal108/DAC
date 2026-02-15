import "./StatusBar.css";

function formatCoord(um, measure) {
  if (measure === "inch") return `${(um / 25400).toFixed(4)} in`;
  return `${(um / 1000).toFixed(2)} mm`;
}

export function StatusBar({ status, measure, theme, inputUnit }) {
  return (
    <div className="status-bar">
      X:{formatCoord(status.x, measure)} Y:{formatCoord(status.y, measure)}
      {" | "}
      Zoom:{status.zoom}%{" | "}
      Measure:{measure.toUpperCase()}
      {" | "}
      Input:{inputUnit.toUpperCase()}
      {" | "}
      Theme:{theme}
      {" | "}
      Capture:{status.capture}
      {" | "}
      Link:{status.connection}
    </div>
  );
}
