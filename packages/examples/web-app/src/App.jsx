import { useEffect, useRef, useState } from "react";

import "./theme/tokens.css";
import "./App.css";

import { MenuBar } from "./components/MenuBar/MenuBar";
import { ToolBar } from "./components/ToolBar/ToolBar";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { WorkspaceView } from "./components/Workspace/WorkspaceView";
import { InspectorPanel } from "./components/Inspector/InspectorPanel";

import { CanvasRenderer, ViewTransform, Viewport } from "@dac/renderer-canvas";
import { Scene } from "@dac/core-scene";
import { CommandManager } from "@dac/core-commands";
import { Workspace, SelectTool } from "@dac/core-workspace";

import { ConfigService } from "@dac/core-config";
import { AuthService } from "@dac/core-auth";
import { LocalProvider } from "@dac/core-auth/Providers/LocalProvider";

export function App() {
  const canvasRef = useRef(null);

  // Core engine refs (stable, non-reactive)
  const sceneRef = useRef(null);
  const commandMgrRef = useRef(null);
  const workspaceRef = useRef(null);

  // UI-only state
  const [status, setStatus] = useState({
    x: 0,
    y: 0,
    zoom: 100,
    grid: "10mm",
    snap: true,
  });

  useEffect(() => {
    let disposed = false;

    async function init() {
      // --- platform init (already correct) ---
      const config = new ConfigService();
      await config.load();

      const auth = new AuthService(new LocalProvider());
      await auth.load();

      if (disposed) return;

      // --- canvas ---
      const canvas = document.querySelector(".workspace");

      const tf = new ViewTransform();
      tf.scale = 40;
      tf.offsetX = 500;
      tf.offsetY = 350;

      const renderer = new CanvasRenderer(canvas, tf);
      new Viewport(tf, canvas);

      // --- core engine ---
      sceneRef.current = new Scene();
      commandMgrRef.current = new CommandManager(sceneRef.current);

      const ws = new Workspace(canvas, sceneRef.current, renderer, tf);

      ws.commands = commandMgrRef.current;
      ws.tools.set(new SelectTool(ws));

      workspaceRef.current = ws;

      // --- mouse tracking (UI only) ---
      canvas.addEventListener("mousemove", (e) => {
        const r = canvas.getBoundingClientRect();
        const p = tf.screenToWorld(e.clientX - r.left, e.clientY - r.top);

        setStatus((s) => ({
          ...s,
          x: Math.round(p.x),
          y: Math.round(p.y),
          zoom: Math.round(tf.scale * 2.5),
        }));
      });

      // --- render loop ---
      function loop() {
        const scene = sceneRef.current;
        const workspace = workspaceRef.current;

        if (!scene || !workspace) return;

        renderer.drawAll(scene.getAll(), scene.selection);

        const tool = workspace.tools.get();
        if (tool?.drawOverlay) {
          tool.drawOverlay(renderer.ctx);
        }

        requestAnimationFrame(loop);
      }

      loop();
    }

    init();

    return () => {
      disposed = true;
    };
  }, []);

  return (
    <div className="main">
      <MenuBar />
      <ToolBar />

      <div className="content">
        <div className="workspace-container">
          <WorkspaceView />
        </div>

        <div className="inspector">
          {sceneRef.current && commandMgrRef.current && (
            <InspectorPanel
              scene={sceneRef.current}
              commands={commandMgrRef.current}
            />
          )}
        </div>
      </div>

      <StatusBar status={status} />
    </div>
  );
}
