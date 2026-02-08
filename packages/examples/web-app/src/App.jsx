import { useEffect, useRef, useState } from "react";

import "./theme/tokens.css";
import "./App.css";

import { MenuBar } from "./components/MenuBar/MenuBar";
import { ToolBar } from "./components/ToolBar/ToolBar";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { WorkspaceView } from "./components/Workspace/WorkspaceView";

import { CanvasRenderer, ViewTransform, Viewport } from "@dac/renderer-canvas";

import { Scene } from "@dac/core-scene";
import { CommandManager } from "@dac/core-commands";

import { Workspace, SelectTool, LineTool } from "@dac/core-workspace";

import { ConfigService } from "@dac/core-config";
import { AuthService } from "@dac/core-auth";
import { LocalProvider } from "@dac/core-auth/Providers/LocalProvider";

export function App() {
  const canvasRef = useRef(null);

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
      const config = new ConfigService();
      await config.load();

      const auth = new AuthService(new LocalProvider());
      await auth.load();

      if (disposed) return;

      const canvas = document.querySelector(".workspace");

      const tf = new ViewTransform();
      tf.scale = 40;
      tf.offsetX = 500;
      tf.offsetY = 350;

      const renderer = new CanvasRenderer(canvas, tf);
      new Viewport(tf, canvas);

      const scene = new Scene();
      const mgr = new CommandManager(scene);

      const ws = new Workspace(canvas, scene, renderer, tf);
      ws.commands = mgr;
      ws.tools.set(new SelectTool(ws));

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

      function loop() {
        renderer.drawAll(scene.getAll(), scene.selection);

        const tool = ws.tools.get();
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

        <div className="inspector">{/* Inspector content comes next */}</div>
      </div>

      <StatusBar status={status} />
    </div>
  );
}
