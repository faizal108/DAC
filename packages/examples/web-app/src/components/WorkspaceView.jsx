import { useRef, useEffect } from "react";

export function WorkspaceView({ onMove }) {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;

    const handler = (e) => {
      onMove(e);
    };

    c.addEventListener("mousemove", handler);

    return () => {
      c.removeEventListener("mousemove", handler);
    };
  }, []);

  return <canvas ref={ref} width={1000} height={700} className="workspace" />;
}
