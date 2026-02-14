import "./StatusBar.css";

export function StatusBar({ status }) {
  return (
    <div className="status-bar">
      X:{status.x} Y:{status.y}
      {" | "}
      Zoom:{status.zoom}%{" | "}
      Grid:{status.grid}
      {" | "}
      Snap:{status.snap ? "ON" : "OFF"}
      {" | "}
      Link:{status.connection}
    </div>
  );
}
