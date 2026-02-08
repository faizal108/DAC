import "./ToolBar.css";

export function ToolBar() {
  return (
    <div className="tool-bar">
      <button className="tool-btn active">Select</button>
      <button className="tool-btn">Line</button>
      <button className="tool-btn">Circle</button>
      <button className="tool-btn">Trim</button>
    </div>
  );
}
