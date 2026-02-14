import "./ToolBar.css";

export function ToolBar({
  activeTool,
  onSelectTool,
  onStartCapture,
  onStopCapture,
  onToggleConnection,
  connected,
}) {
  const tools = ["select", "line", "circle", "trim", "move"];

  return (
    <div className="tool-bar">
      {tools.map((tool) => (
        <button
          key={tool}
          className={`tool-btn ${activeTool === tool ? "active" : ""}`}
          onClick={() => onSelectTool?.(tool)}
        >
          {tool[0].toUpperCase() + tool.slice(1)}
        </button>
      ))}

      <div className="tool-divider" />

      <button className="tool-btn" onClick={onStartCapture}>
        Start Capture
      </button>
      <button className="tool-btn" onClick={onStopCapture}>
        Stop Capture
      </button>

      <button className="tool-btn" onClick={onToggleConnection}>
        {connected ? "Disconnect USB/WS" : "Connect USB/WS"}
      </button>
    </div>
  );
}
