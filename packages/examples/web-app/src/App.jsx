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

import { MachineSession } from "@dac/core-machine";

/* ----------------------------------------- */

export function App() {
  const sceneRef = useRef(null);
  const commandMgrRef = useRef(null);
  const workspaceRef = useRef(null);
  const machineSessionRef = useRef(null);
  const rendererRef = useRef(null);
  const transformRef = useRef(null);
  const wsRef = useRef(null);

  const [status, setStatus] = useState({
    x: 0,
    y: 0,
    zoom: 100,
    capture: "IDLE",
  });

  useEffect(() => {
    let disposed = false;

    async function init() {
      /* ---------- platform ---------- */
      const config = new ConfigService();
      await config.load();

      const auth = new AuthService(new LocalProvider());
      await auth.load();

      if (disposed) return;

      /* ---------- canvas ---------- */
      const canvas = document.querySelector(".workspace");

      const tf = new ViewTransform();
      tf.scale = 40;
      tf.offsetX = 500;
      tf.offsetY = 350;
      transformRef.current = tf;

      const renderer = new CanvasRenderer(canvas, tf);
      rendererRef.current = renderer;
      new Viewport(tf, canvas);

      /* ---------- scene ---------- */
      const scene = new Scene();
      sceneRef.current = scene;

      const commands = new CommandManager(scene);
      commandMgrRef.current = commands;

      const ws = new Workspace(canvas, scene, renderer, tf);
      ws.commands = commands;
      ws.tools.set(new SelectTool(ws));
      workspaceRef.current = ws;

      /* ---------- machine session ---------- */
      const session = new MachineSession({ previewLimit: 1000 });
      machineSessionRef.current = session;

      session.on("state", (s) => {
        setStatus((prev) => ({ ...prev, capture: s }));
      });

      /* ---------- WebSocket (Node bridge) ---------- */
      const socket = new WebSocket("ws://localhost:8080");
      wsRef.current = socket;

      socket.onmessage = (e) => {
        // e.data is "x,y"
        session.ingest(e.data);
      };

      socket.onerror = (err) => {
        console.error("WS error", err);
      };

      /* ---------- mouse tracking ---------- */
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

      /* ---------- render loop ---------- */
      function loop() {
        if (disposed) return;

        renderer.drawAll(scene.getAll(), scene.selection);

        if (session.state === "CAPTURING") {
          drawPreviewPolyline(renderer.ctx, session.preview, tf);
        }

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
      wsRef.current?.close();
    };
  }, []);

  /* ---------- UI actions ---------- */
  function startCapture() {
    machineSessionRef.current?.start();
  }

  function stopCapture() {
    machineSessionRef.current?.stop();
  }

  return (
    <div className="main">
      <MenuBar />

      <ToolBar onStartCapture={startCapture} onStopCapture={stopCapture} />

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

/* ----------------------------------------- */

function drawPreviewPolyline(ctx, points, tf) {
  if (!points || points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1;

  ctx.beginPath();
  const p0 = tf.worldToScreen(points[0]);
  ctx.moveTo(p0.x, p0.y);

  for (let i = 1; i < points.length; i++) {
    const p = tf.worldToScreen(points[i]);
    ctx.lineTo(p.x, p.y);
  }

  ctx.stroke();
  ctx.restore();
}
