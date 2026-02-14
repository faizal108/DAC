import "./WorkspaceView.css";

export function WorkspaceView({ canvasRef }) {
  return <canvas ref={canvasRef} className="workspace" />;
}
