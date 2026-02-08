import { useRef } from "react";
import "./WorkspaceView.css";

export function WorkspaceView() {
  const ref = useRef(null);

  return <canvas ref={ref} className="workspace" />;
}
