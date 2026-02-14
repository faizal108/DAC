import { useEffect, useRef, useState } from "react";

import "./theme/tokens.css";
import "./App.css";

import { MenuBar } from "./components/MenuBar/MenuBar";
import { ToolBar } from "./components/ToolBar/ToolBar";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { WorkspaceView } from "./components/Workspace/WorkspaceView";
import { InspectorPanel } from "./components/Inspector/InspectorPanel";
import {
  downloadFile,
  exportCanvasImage,
  exportSceneToDxf,
} from "./exporters";

import { CanvasRenderer, ViewTransform, Viewport } from "@dac/renderer-canvas";
import { Scene, Serializer } from "@dac/core-scene";
import { CommandManager, CommitCaptureCommand } from "@dac/core-commands";
import {
  CircleTool,
  LineTool,
  MoveTool,
  SelectTool,
  TrimTool,
  Workspace,
} from "@dac/core-workspace";
import { MachineSession } from "@dac/core-machine";

const TOOL_FACTORY = {
  select: (ws) => new SelectTool(ws),
  line: (ws) => new LineTool(ws),
  circle: (ws) => new CircleTool(ws),
  trim: (ws) => new TrimTool(ws),
  move: (ws) => new MoveTool(ws),
};

export function App() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const commandMgrRef = useRef(null);
  const workspaceRef = useRef(null);
  const machineSessionRef = useRef(null);
  const rendererRef = useRef(null);
  const transformRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const keepWsAliveRef = useRef(true);
  const connectWsRef = useRef(() => {});

  const [status, setStatus] = useState({
    x: 0,
    y: 0,
    zoom: 100,
    capture: "IDLE",
    grid: "ON",
    snap: true,
    connection: "DISCONNECTED",
  });
  const [activeTool, setActiveTool] = useState("select");
  const [ready, setReady] = useState(false);
  const [inspectorCtx, setInspectorCtx] = useState(null);

  useEffect(() => {
    let disposed = false;

    function resizeCanvas(canvas) {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
    }

    function connectWs() {
      if (disposed || !keepWsAliveRef.current) return;

      const socket = new WebSocket("ws://localhost:8080");
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus((s) => ({ ...s, connection: "CONNECTED (WS)" }));
      };

      socket.onmessage = (e) => {
        machineSessionRef.current?.ingest(e.data);
      };

      socket.onclose = () => {
        if (!keepWsAliveRef.current || disposed) return;
        setStatus((s) => ({ ...s, connection: "RECONNECTING (WS)" }));
        reconnectTimerRef.current = window.setTimeout(connectWs, 1500);
      };

      socket.onerror = () => {
        socket.close();
      };
    }
    connectWsRef.current = connectWs;

    function init() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      resizeCanvas(canvas);

      const tf = new ViewTransform();
      tf.scale = 40;
      tf.offsetX = canvas.width / 2;
      tf.offsetY = canvas.height / 2;
      transformRef.current = tf;

      const renderer = new CanvasRenderer(canvas, tf);
      rendererRef.current = renderer;
      new Viewport(tf, canvas);

      const scene = new Scene();
      sceneRef.current = scene;

      const commands = new CommandManager(scene);
      commandMgrRef.current = commands;
      setInspectorCtx({ scene, commands });

      const ws = new Workspace(canvas, scene, renderer, tf);
      ws.commands = commands;
      ws.tools.set(new SelectTool(ws));
      workspaceRef.current = ws;

      const session = new MachineSession({ previewLimit: 2000 });
      machineSessionRef.current = session;
      session.on("state", (s) => {
        setStatus((prev) => ({ ...prev, capture: s }));
      });

      const resizeObserver = new ResizeObserver(() => resizeCanvas(canvas));
      resizeObserver.observe(canvas);

      const onMouseMove = (e) => {
        const r = canvas.getBoundingClientRect();
        const p = tf.screenToWorld(e.clientX - r.left, e.clientY - r.top);

        setStatus((s) => ({
          ...s,
          x: Math.round(p.x),
          y: Math.round(p.y),
          zoom: Math.round(tf.scale * 2.5),
        }));
      };
      canvas.addEventListener("mousemove", onMouseMove);

      connectWs();

      function loop() {
        if (disposed) return;

        renderer.drawAll(scene.getAll(), scene.selection);
        if (session.state === "CAPTURING") {
          drawPreviewPolyline(renderer.ctx, session.preview, tf);
        }
        const tool = ws.tools.get();
        if (tool?.drawOverlay) tool.drawOverlay(renderer.ctx);

        requestAnimationFrame(loop);
      }
      loop();

      setReady(true);

      return () => {
        resizeObserver.disconnect();
        canvas.removeEventListener("mousemove", onMouseMove);
      };
    }

    const teardown = init();

    return () => {
      disposed = true;
      keepWsAliveRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      teardown?.();
    };
  }, []);

  function setTool(toolKey) {
    const ws = workspaceRef.current;
    if (!ws || !TOOL_FACTORY[toolKey]) return;
    ws.tools.set(TOOL_FACTORY[toolKey](ws));
    setActiveTool(toolKey);
  }

  function startCapture() {
    machineSessionRef.current?.start();
  }

  function stopCapture() {
    const session = machineSessionRef.current;
    const mgr = commandMgrRef.current;
    if (!session || !mgr) return;

    session.stop();
    if (session.points.length < 2) return;

    mgr.execute(new CommitCaptureCommand([...session.points]));
    session.points = [];
    session.preview = [];
  }

  function toggleConnection() {
    const socket = wsRef.current;

    if (socket && socket.readyState <= 1) {
      keepWsAliveRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      socket.close();
      setStatus((s) => ({ ...s, connection: "DISCONNECTED" }));
      return;
    }

    keepWsAliveRef.current = true;
    setStatus((s) => ({ ...s, connection: "RECONNECTING (WS)" }));
    clearTimeout(reconnectTimerRef.current);
    connectWsRef.current();
  }

  function exportJson() {
    const scene = sceneRef.current;
    if (!scene) return;
    const json = JSON.stringify(Serializer.serialize(scene), null, 2);
    downloadFile("workspace.json", json, "application/json");
  }

  function exportDxf() {
    const scene = sceneRef.current;
    if (!scene) return;
    const dxf = exportSceneToDxf(scene.getAll());
    downloadFile("workspace.dxf", dxf, "application/dxf");
  }

  function exportImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportCanvasImage(canvas);
  }

  function exportGcode() {
    const scene = sceneRef.current;
    if (!scene) return;

    const lines = scene
      .getAll()
      .filter((e) => e.type === "LINE")
      .flatMap((e) => {
        const a = e.geometry.start;
        const b = e.geometry.end;
        return [
          `G0 X${(a.x / 1000).toFixed(3)} Y${(a.y / 1000).toFixed(3)}`,
          `G1 X${(b.x / 1000).toFixed(3)} Y${(b.y / 1000).toFixed(3)}`,
        ];
      });

    downloadFile("workspace.gcode", lines.join("\n"), "text/plain");
  }

  function onMenuAction(actionId) {
    if (actionId === "file.save") exportJson();
    if (actionId === "file.export.dxf") exportDxf();
    if (actionId === "file.export.gcode") exportGcode();
    if (actionId === "file.export.image") exportImage();
    if (actionId === "machine.capture") startCapture();
  }

  return (
    <div className="main">
      <MenuBar onAction={onMenuAction} />

      <ToolBar
        activeTool={activeTool}
        onSelectTool={setTool}
        onStartCapture={startCapture}
        onStopCapture={stopCapture}
        onToggleConnection={toggleConnection}
        connected={status.connection.startsWith("CONNECTED")}
      />

      <div className="content">
        <div className="workspace-container">
          <WorkspaceView canvasRef={canvasRef} />
        </div>

        <div className="inspector">
          {ready && inspectorCtx && (
            <InspectorPanel
              scene={inspectorCtx.scene}
              commands={inspectorCtx.commands}
            />
          )}
        </div>
      </div>

      <StatusBar status={status} />
    </div>
  );
}

function drawPreviewPolyline(ctx, points, tf) {
  if (!points || points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1;

  ctx.beginPath();
  const p0 = tf.worldToScreen(points[0].x, points[0].y);
  ctx.moveTo(p0.x, p0.y);

  for (let i = 1; i < points.length; i++) {
    const p = tf.worldToScreen(points[i].x, points[i].y);
    ctx.lineTo(p.x, p.y);
  }

  ctx.stroke();
  ctx.restore();
}
