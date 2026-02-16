import { useEffect, useMemo, useRef, useState } from "react";

import "./theme/tokens.css";
import "./App.css";

import { MenuBar } from "./components/MenuBar/MenuBar";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { WorkspaceView } from "./components/Workspace/WorkspaceView";
import { InspectorPanel } from "./components/Inspector/InspectorPanel";
import { SubMenuPanel } from "./components/SubMenu/SubMenuPanel";
import { TOP_MENUS } from "./config/MenuConfig";
import {
  downloadFile,
  exportCanvasImage,
  exportSceneToCsv,
  exportSceneToDxf,
  exportSceneToGcode,
} from "./exporters";
import { usePlatform } from "./platform/PlatformContext";

import { CanvasRenderer, ViewTransform, Viewport } from "@dac/renderer-canvas";
import { Scene, Serializer } from "@dac/core-scene";
import { CommandManager, CommitCaptureCommand } from "@dac/core-commands";
import {
  CopyTool,
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
  copy: (ws) => new CopyTool(ws),
};

function defaultWifiProfiles() {
  return [
    {
      id: "default",
      name: "Default Device",
      protocol: "ws",
      host: "192.168.4.1",
      port: "81",
      path: "/",
    },
  ];
}

function formatCoord(um, unit) {
  if (unit === "inch") return `${(um / 25400).toFixed(4)} in`;
  return `${(um / 1000).toFixed(2)} mm`;
}

function sendMachineCommand(socket, command, source = "serial") {
  if (!socket || socket.readyState !== 1) return false;
  if (source === "serial") {
    socket.send(
      JSON.stringify({
        type: "COMMAND",
        command,
        t: Date.now(),
      }),
    );
  } else {
    socket.send(command);
  }
  return true;
}

function buildWifiUrl(settings) {
  const proto = settings.wifiProtocol || "ws";
  const host = (settings.wifiHost || "").trim() || "192.168.4.1";
  const port = String(settings.wifiPort || "81").trim() || "81";
  let path = String(settings.wifiPath || "/").trim() || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  return `${proto}://${host}:${port}${path}`;
}

function computeSceneBounds(entities) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function pushPoint(p) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  for (const e of entities) {
    const g = e.geometry;
    if (e.type === "POINT") pushPoint(g);
    if (e.type === "LINE") {
      pushPoint(g.start);
      pushPoint(g.end);
    }
    if (e.type === "CIRCLE") {
      pushPoint({ x: g.center.x - g.radius, y: g.center.y - g.radius });
      pushPoint({ x: g.center.x + g.radius, y: g.center.y + g.radius });
    }
    if (e.type === "POLYLINE") {
      for (const p of g.points || []) pushPoint(p);
    }
  }

  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

export function App() {
  const { auth, config } = usePlatform();

  const contentRef = useRef(null);
  const canvasRef = useRef(null);
  const transformRef = useRef(null);
  const viewportRef = useRef(null);
  const sceneRef = useRef(null);
  const commandMgrRef = useRef(null);
  const workspaceRef = useRef(null);
  const machineSessionRef = useRef(null);
  const rendererRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const keepWsAliveRef = useRef(true);
  const connectWsRef = useRef(() => {});
  const resizeStateRef = useRef(null);
  const settingsRef = useRef(null);
  const sceneVersionRef = useRef(0);
  const fileInputRef = useRef(null);
  const savedSceneVersionRef = useRef(0);

  const [status, setStatus] = useState({
    x: 0,
    y: 0,
    zoom: 100,
    capture: "IDLE",
    connection: "DISCONNECTED",
  });
  const [activeTool, setActiveTool] = useState("select");
  const [activeMenu, setActiveMenu] = useState("draw");
  const [leftMenuCollapsed, setLeftMenuCollapsed] = useState(
    config.get("ui.leftMenuCollapsed") ?? false,
  );
  const [submenuWidth, setSubmenuWidth] = useState(
    config.get("ui.submenuWidth") ?? 260,
  );
  const [inspectorCollapsed, setInspectorCollapsed] = useState(
    config.get("ui.inspectorCollapsed") ?? false,
  );
  const [inspectorWidth, setInspectorWidth] = useState(
    config.get("ui.inspectorWidth") ?? 300,
  );
  const [ready, setReady] = useState(false);
  const [inspectorCtx, setInspectorCtx] = useState(null);
  const [settings, setSettings] = useState(() => ({
    theme: config.get("ui.theme") || "light",
    measure: config.get("ui.measure") || "mm",
    inputUnit: config.get("ui.inputUnit") || "um",
    machineSource: config.get("ui.machineSource") || "serial",
    wifiProtocol: config.get("ui.wifiProtocol") || "ws",
    wifiHost: config.get("ui.wifiHost") || "192.168.4.1",
    wifiPort: config.get("ui.wifiPort") || "81",
    wifiPath: config.get("ui.wifiPath") || "/",
    wifiProfileName: config.get("ui.wifiProfileName") || "My Device",
    grid: config.get("ui.grid") ?? true,
    snap: config.get("ui.snap") ?? true,
    showPoints: config.get("ui.showPoints") ?? false,
    showLinePoints: config.get("ui.showLinePoints") ?? false,
    autoFocus: config.get("ui.autoFocus") ?? false,
    autoCenter: config.get("ui.autoCenter") ?? false,
    debugIO: config.get("ui.debugIO") ?? true,
  }));
  const [wifiProfiles, setWifiProfiles] = useState(() => {
    const profiles = config.get("ui.wifiProfiles");
    return Array.isArray(profiles) && profiles.length ? profiles : defaultWifiProfiles();
  });
  const [activeWifiProfileId, setActiveWifiProfileId] = useState(
    config.get("ui.activeWifiProfileId") || "default",
  );
  const [debugLogs, setDebugLogs] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: null,
  });
  const [warningModal, setWarningModal] = useState({
    open: false,
    message: "",
  });
  const [toolHint, setToolHint] = useState("Select: click object");

  function pushDebug(line) {
    setDebugLogs((prev) => {
      const next = [...prev, `${new Date().toLocaleTimeString()} ${line}`];
      return next.slice(-30);
    });
  }

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

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

      const source = settingsRef.current?.machineSource || "serial";
      const url =
        source === "wifi"
          ? buildWifiUrl(settingsRef.current || {})
          : "ws://localhost:8080";
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus((s) => ({
          ...s,
          connection:
            source === "wifi" ? `CONNECTED (WIFI:${url})` : "CONNECTED (SERIAL)",
        }));
        const unit = settingsRef.current?.inputUnit || "um";
        const sent = sendMachineCommand(socket, `unit ${unit}`, source);
        if (sent && settingsRef.current?.debugIO) {
          pushDebug(`TX unit ${unit}`);
        }
      };
      socket.onmessage = (e) => {
        let msg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          machineSessionRef.current?.ingest(e.data);
          return;
        }

        if (msg.type === "POINT") {
          if (settingsRef.current?.debugIO) {
            pushDebug(`RX POINT x=${msg.x} y=${msg.y}${msg.unit ? ` unit=${msg.unit}` : ""}`);
          }
          machineSessionRef.current?.ingest(msg);
          return;
        }

        if (msg.type === "STATUS") {
          setStatus((s) => ({
            ...s,
            connection:
              source === "wifi"
                ? `CONNECTED (WIFI:${url})`
                : `CONNECTED (${msg.serialPort || "SERIAL"})`,
          }));
          return;
        }

        if (msg.type === "ACK") {
          if (settingsRef.current?.debugIO) {
            pushDebug(`ACK ${msg.command}`);
          }
          setStatus((s) => ({
            ...s,
            connection: `ACK:${msg.command}`,
          }));
          setTimeout(() => {
            setStatus((s) => ({ ...s, connection: "CONNECTED (WS)" }));
          }, 1200);
          return;
        }

        if (msg.type === "ERROR") {
          if (settingsRef.current?.debugIO) {
            pushDebug(`ERROR ${msg.message}`);
          }
          setStatus((s) => ({
            ...s,
            connection: `ERROR:${msg.message}`,
          }));
          return;
        }

        if (msg.type === "TEXT" && settingsRef.current?.debugIO) {
          pushDebug(`SERIAL ${msg.text}`);
        }
      };
      socket.onclose = () => {
        if (!keepWsAliveRef.current || disposed) return;
        setStatus((s) => ({
          ...s,
          connection:
            source === "wifi" ? "RECONNECTING (WIFI)" : "RECONNECTING (SERIAL)",
        }));
        reconnectTimerRef.current = window.setTimeout(connectWs, 1500);
      };
      socket.onerror = () => socket.close();
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
      viewportRef.current = new Viewport(tf, canvas);

      const scene = new Scene();
      sceneRef.current = scene;

      const commands = new CommandManager(scene);
      commandMgrRef.current = commands;
      setInspectorCtx({ scene, commands });

      const ws = new Workspace(canvas, scene, renderer, tf);
      ws.commands = commands;
      ws.tools.set(new SelectTool(ws));
      workspaceRef.current = ws;

      const session = new MachineSession({
        previewLimit: 2000,
        inputUnit: "um",
      });
      machineSessionRef.current = session;
      session.on("state", (s) => setStatus((prev) => ({ ...prev, capture: s })));
      session.on("point", (pt) => {
        if (settingsRef.current?.autoCenter) {
          const tf = transformRef.current;
          const canvasEl = canvasRef.current;
          if (!tf || !canvasEl) return;
          tf.offsetX = canvasEl.width / 2 - (pt.x / 1000) * tf.scale;
          tf.offsetY = canvasEl.height / 2 + (pt.y / 1000) * tf.scale;
        }
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
      const onWheel = () => {
        requestAnimationFrame(() => {
          setStatus((s) => ({ ...s, zoom: Math.round(tf.scale * 2.5) }));
        });
      };
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("wheel", onWheel, { passive: true });

      connectWs();

      function fitDrawingInViewLocal() {
        const bounds = computeSceneBounds(scene.getAll());
        if (!bounds) return;

        const widthMm = Math.max((bounds.maxX - bounds.minX) / 1000, 0.1);
        const heightMm = Math.max((bounds.maxY - bounds.minY) / 1000, 0.1);
        const pad = 48;

        const sx = (canvas.width - pad * 2) / widthMm;
        const sy = (canvas.height - pad * 2) / heightMm;
        const nextScale = Math.max(
          viewportRef.current.minScale,
          Math.min(viewportRef.current.maxScale, Math.min(sx, sy)),
        );

        tf.scale = nextScale;
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        tf.offsetX = canvas.width / 2 - (cx / 1000) * tf.scale;
        tf.offsetY = canvas.height / 2 + (cy / 1000) * tf.scale;
      }

      function loop() {
        if (disposed) return;
        renderer.drawAll(scene.getAll(), scene.selection);
        if (settingsRef.current?.autoFocus && scene.version !== sceneVersionRef.current) {
          sceneVersionRef.current = scene.version;
          fitDrawingInViewLocal();
        }
        if (session.state === "CAPTURING") {
          drawPreviewPolyline(renderer.ctx, session.preview, tf);
        }
        const tool = ws.tools.get();
        const hint = tool?.getHint?.() || "";
        setToolHint((prev) => (prev === hint ? prev : hint));
        if (tool?.drawOverlay) tool.drawOverlay(renderer.ctx);
        requestAnimationFrame(loop);
      }
      loop();

      setReady(true);
      savedSceneVersionRef.current = scene.version;

      return () => {
        resizeObserver.disconnect();
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("wheel", onWheel);
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

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.showGrid = settings.grid;
    if (rendererRef.current) rendererRef.current.showPoints = settings.showPoints;
    if (rendererRef.current) {
      rendererRef.current.showLinePointLabels = settings.showLinePoints;
    }
    if (workspaceRef.current) workspaceRef.current.snapEnabled = settings.snap;
    if (machineSessionRef.current) {
      machineSessionRef.current.setInputUnit(settings.inputUnit);
    }
  }, [
    settings.grid,
    settings.snap,
    settings.inputUnit,
    settings.showPoints,
    settings.showLinePoints,
  ]);

  useEffect(() => {
    function onMove(e) {
      if (!resizeStateRef.current) return;

      if (resizeStateRef.current.mode === "inspector") {
        const next = window.innerWidth - e.clientX;
        const clamped = Math.max(220, Math.min(560, next));
        setInspectorWidth(clamped);
      }

      if (resizeStateRef.current.mode === "submenu") {
        const rect = contentRef.current?.getBoundingClientRect();
        if (!rect) return;
        const next = e.clientX - rect.left;
        const clamped = Math.max(180, Math.min(520, next));
        setSubmenuWidth(clamped);
      }
    }

    function onUp() {
      if (!resizeStateRef.current) return;
      const mode = resizeStateRef.current.mode;
      resizeStateRef.current = null;
      if (mode === "inspector") {
        config.set("ui.inspectorWidth", inspectorWidth);
      }
      if (mode === "submenu") {
        config.set("ui.submenuWidth", submenuWidth);
      }
      document.body.classList.remove("is-resizing");
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [config, inspectorWidth, submenuWidth]);

  function updateSetting(key, value) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      settingsRef.current = next;
      config.set(`ui.${key}`, value);
      return next;
    });
  }

  function toggleLeftMenu() {
    const next = !leftMenuCollapsed;
    setLeftMenuCollapsed(next);
    config.set("ui.leftMenuCollapsed", next);
  }

  function toggleInspectorCollapsed() {
    const next = !inspectorCollapsed;
    setInspectorCollapsed(next);
    config.set("ui.inspectorCollapsed", next);
  }

  function startInspectorResize() {
    resizeStateRef.current = { mode: "inspector" };
    document.body.classList.add("is-resizing");
  }

  function startSubmenuResize() {
    resizeStateRef.current = { mode: "submenu" };
    document.body.classList.add("is-resizing");
  }

  function zoomBy(factor) {
    const canvas = canvasRef.current;
    const vp = viewportRef.current;
    if (!canvas || !vp) return;

    vp.zoomAt(canvas.width / 2, canvas.height / 2, factor);
    setStatus((s) => ({
      ...s,
      zoom: Math.round((transformRef.current?.scale || 0) * 2.5),
    }));
  }

  function resetZoom() {
    const canvas = canvasRef.current;
    const tf = transformRef.current;
    if (!canvas || !tf) return;

    tf.scale = 40;
    tf.offsetX = canvas.width / 2;
    tf.offsetY = canvas.height / 2;
    setStatus((s) => ({ ...s, zoom: 100 }));
  }

  function fitDrawingInView() {
    const canvas = canvasRef.current;
    const tf = transformRef.current;
    const vp = viewportRef.current;
    const scene = sceneRef.current;
    if (!canvas || !tf || !vp || !scene) return;

    const bounds = computeSceneBounds(scene.getAll());
    if (!bounds) return;

    const widthMm = Math.max((bounds.maxX - bounds.minX) / 1000, 0.1);
    const heightMm = Math.max((bounds.maxY - bounds.minY) / 1000, 0.1);
    const pad = 48;

    const sx = (canvas.width - pad * 2) / widthMm;
    const sy = (canvas.height - pad * 2) / heightMm;
    const nextScale = Math.max(vp.minScale, Math.min(vp.maxScale, Math.min(sx, sy)));

    tf.scale = nextScale;
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    tf.offsetX = canvas.width / 2 - (cx / 1000) * tf.scale;
    tf.offsetY = canvas.height / 2 + (cy / 1000) * tf.scale;

    setStatus((s) => ({ ...s, zoom: Math.round(tf.scale * 2.5) }));
  }

  function centerDrawing() {
    const canvas = canvasRef.current;
    const tf = transformRef.current;
    const scene = sceneRef.current;
    if (!canvas || !tf || !scene) return;
    const bounds = computeSceneBounds(scene.getAll());
    if (!bounds) return;
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    tf.offsetX = canvas.width / 2 - (cx / 1000) * tf.scale;
    tf.offsetY = canvas.height / 2 + (cy / 1000) * tf.scale;
  }

  function resetRoom() {
    // Reset camera/capture state without deleting existing drawing.
    machineSessionRef.current?.stop();
    if (machineSessionRef.current) {
      machineSessionRef.current.points = [];
      machineSessionRef.current.preview = [];
    }
    resetZoom();
    fitDrawingInView();
  }

  function undo() {
    commandMgrRef.current?.undo();
  }

  function redo() {
    commandMgrRef.current?.redo();
  }

  function doNewFile() {
    const scene = sceneRef.current;
    const mgr = commandMgrRef.current;
    if (!scene || !mgr) return;

    scene.clear();
    scene.selection.clear();
    scene.layers._layers.clear();
    scene.layers.createLayer("default", {
      name: "Default",
      visible: true,
      locked: false,
      color: "#000000",
    });
    mgr.clear();
    savedSceneVersionRef.current = scene.version;
    resetZoom();
  }

  function requestSafeAction(action) {
    if (!hasUnsavedChanges()) {
      if (action === "new") doNewFile();
      if (action === "open") doOpenFilePicker();
      return;
    }
    setConfirmModal({ open: true, action });
  }

  function resolveConfirm(choice) {
    const action = confirmModal.action;
    setConfirmModal({ open: false, action: null });
    if (!action || choice === "cancel") return;

    if (choice === "save") exportJson();
    if (action === "new") doNewFile();
    if (action === "open") doOpenFilePicker();
  }

  function setTool(toolKey) {
    const ws = workspaceRef.current;
    if (!ws || !TOOL_FACTORY[toolKey]) return;
    ws.tools.set(TOOL_FACTORY[toolKey](ws));
    setActiveTool(toolKey);
  }

  function setMenu(menuKey) {
    setActiveMenu(menuKey);
    if (menuKey === "draw") return;
    const ws = workspaceRef.current;
    if (!ws) return;
    ws.tools.set(new SelectTool(ws));
    setActiveTool("select");
  }

  function isMachineConnected() {
    const socket = wsRef.current;
    return !!socket && socket.readyState === 1;
  }

  function startCapture() {
    if (!isMachineConnected()) {
      setWarningModal({
        open: true,
        message:
          "Machine is disconnected. Please connect to controller before starting capture.",
      });
      return;
    }

    if (settings.debugIO) pushDebug("TX record");
    sendMachineCommand(wsRef.current, "record", settings.machineSource);
    machineSessionRef.current?.start();
  }

  function stopCapture() {
    const session = machineSessionRef.current;
    const mgr = commandMgrRef.current;
    if (!session || !mgr) return;
    session.stop();
    if (settings.debugIO) pushDebug("TX stop");
    sendMachineCommand(wsRef.current, "stop", settings.machineSource);
    if (session.points.length < 2) return;
    mgr.execute(new CommitCaptureCommand([...session.points]));
    session.points = [];
    session.preview = [];
  }

  function toggleCapture() {
    const session = machineSessionRef.current;
    if (!session) return;
    if (session.state === "CAPTURING") stopCapture();
    else startCapture();
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

  function reconnectMachineTransport() {
    const socket = wsRef.current;
    keepWsAliveRef.current = false;
    clearTimeout(reconnectTimerRef.current);
    if (socket && socket.readyState <= 1) {
      socket.close();
    }

    keepWsAliveRef.current = true;
    setStatus((s) => ({ ...s, connection: "RECONNECTING..." }));
    connectWsRef.current();
  }

  function saveWifiProfiles(nextProfiles, nextActiveId = activeWifiProfileId) {
    setWifiProfiles(nextProfiles);
    setActiveWifiProfileId(nextActiveId);
    config.set("ui.wifiProfiles", nextProfiles);
    config.set("ui.activeWifiProfileId", nextActiveId);
  }

  function applyWifiProfile(profileId) {
    const profile = wifiProfiles.find((p) => p.id === profileId);
    if (!profile) return;
    setActiveWifiProfileId(profile.id);
    config.set("ui.activeWifiProfileId", profile.id);
    updateSetting("wifiProfileName", profile.name || "My Device");
    updateSetting("wifiProtocol", profile.protocol || "ws");
    updateSetting("wifiHost", profile.host || "192.168.4.1");
    updateSetting("wifiPort", profile.port || "81");
    updateSetting("wifiPath", profile.path || "/");
  }

  function saveCurrentWifiProfile() {
    const name = String(settings.wifiProfileName || "").trim();
    if (!name) {
      setWarningModal({ open: true, message: "Please enter a profile name first." });
      return;
    }

    const existing = wifiProfiles.find((p) => p.id === activeWifiProfileId);
    const payload = {
      id: existing?.id || `p_${Date.now()}`,
      name,
      protocol: settings.wifiProtocol,
      host: settings.wifiHost,
      port: settings.wifiPort,
      path: settings.wifiPath,
    };

    const nextProfiles = existing
      ? wifiProfiles.map((p) => (p.id === existing.id ? payload : p))
      : [...wifiProfiles, payload];
    saveWifiProfiles(nextProfiles, payload.id);
    pushDebug(`Saved WiFi profile: ${payload.name}`);
  }

  function deleteCurrentWifiProfile() {
    if (activeWifiProfileId === "default") {
      setWarningModal({
        open: true,
        message: "Default profile cannot be deleted.",
      });
      return;
    }

    const nextProfiles = wifiProfiles.filter((p) => p.id !== activeWifiProfileId);
    const fallback = nextProfiles[0] || defaultWifiProfiles()[0];
    const finalProfiles = nextProfiles.length ? nextProfiles : [fallback];
    saveWifiProfiles(finalProfiles, fallback.id);
    applyWifiProfile(fallback.id);
    pushDebug("Deleted WiFi profile");
  }

  function testWifiConnection() {
    const url = buildWifiUrl(settings);
    let done = false;
    let testSocket = null;

    try {
      testSocket = new WebSocket(url);
    } catch {
      setWarningModal({ open: true, message: `Invalid WiFi URL: ${url}` });
      return;
    }

    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      try {
        testSocket?.close();
      } catch {
        // ignore
      }
      setWarningModal({ open: true, message: `WiFi test failed: timeout (${url})` });
    }, 3000);

    testSocket.onopen = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      testSocket.close();
      setWarningModal({ open: true, message: `WiFi test success: ${url}` });
    };

    testSocket.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      setWarningModal({ open: true, message: `WiFi test failed: cannot connect (${url})` });
    };
  }

  function exportJson() {
    const scene = sceneRef.current;
    if (!scene) return;
    const json = JSON.stringify(Serializer.serialize(scene), null, 2);
    downloadFile("workspace.json", json, "application/json");
    savedSceneVersionRef.current = scene.version;
  }

  function hasUnsavedChanges() {
    const scene = sceneRef.current;
    if (!scene) return false;
    return scene.version !== savedSceneVersionRef.current;
  }

  function applyLoadedScene(data) {
    const scene = sceneRef.current;
    const mgr = commandMgrRef.current;
    if (!scene || !mgr) return;

    scene.clear();
    scene.selection.clear();
    scene.layers._layers.clear();
    scene.layers.createLayer("default", {
      name: "Default",
      visible: true,
      locked: false,
      color: "#000000",
    });

    const layers = Array.isArray(data?.layers) ? data.layers : [];
    for (const l of layers) {
      if (!l?.id || l.id === "default") continue;
      scene.layers.createLayer(l.id, l);
    }

    const entities = Array.isArray(data?.entities) ? data.entities : [];
    for (const e of entities) {
      if (!e?.geometry) continue;
      const layerId = e.layerId && scene.layers.get(e.layerId) ? e.layerId : "default";
      try {
        scene.add(e.geometry, {
          layerId,
          visible: e.visible,
          locked: e.locked,
        });
      } catch {
        // ignore malformed entity
      }
    }

    mgr.clear();
    savedSceneVersionRef.current = scene.version;
    fitDrawingInView();
  }

  function doOpenFilePicker() {
    fileInputRef.current?.click();
  }

  async function onOpenFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      applyLoadedScene(data);
      pushDebug(`Loaded ${file.name}`);
    } catch {
      pushDebug("Open failed: invalid JSON");
    }
  }

  function exportDxf() {
    const scene = sceneRef.current;
    if (!scene) return;
    const dxf = exportSceneToDxf(scene.getAll(), settings.measure);
    downloadFile(`workspace_${settings.measure}.dxf`, dxf, "application/dxf");
  }

  function exportImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportCanvasImage(canvas);
  }

  function exportGcode() {
    const scene = sceneRef.current;
    if (!scene) return;
    const gcode = exportSceneToGcode(scene.getAll(), settings.measure);
    downloadFile(`workspace_${settings.measure}.gcode`, gcode, "text/plain");
  }

  function exportCsv() {
    const scene = sceneRef.current;
    if (!scene) return;
    const csv = exportSceneToCsv(scene.getAll(), settings.measure);
    downloadFile(`workspace_${settings.measure}.csv`, csv, "text/csv");
  }

  function runAction(actionId, payload) {
    if (actionId === "tool.select") setTool("select");
    if (actionId === "tool.line") setTool("line");
    if (actionId === "tool.circle") setTool("circle");
    if (actionId === "tool.trim") setTool("trim");
    if (actionId === "tool.move") setTool("move");
    if (actionId === "tool.copy") setTool("copy");
    if (actionId === "tool.undo") undo();
    if (actionId === "tool.redo") redo();

    if (actionId === "machine.connect") toggleConnection();
    if (actionId === "machine.captureToggle") toggleCapture();
    if (actionId === "machine.start") startCapture();
    if (actionId === "machine.stop") stopCapture();
    if (actionId === "machine.status") {
      if (settings.debugIO) pushDebug("TX status");
      sendMachineCommand(wsRef.current, "status", settings.machineSource);
    }
    if (actionId === "machine.inputUnit") {
      updateSetting("inputUnit", payload);
      const sent = sendMachineCommand(
        wsRef.current,
        `unit ${payload}`,
        settings.machineSource,
      );
      if (settings.debugIO && sent) pushDebug(`TX unit ${payload}`);
    }
    if (actionId === "machine.source") {
      updateSetting("machineSource", payload);
      reconnectMachineTransport();
    }
    if (actionId === "machine.profile") {
      applyWifiProfile(payload);
    }
    if (actionId === "machine.profileName") updateSetting("wifiProfileName", payload);
    if (actionId === "machine.profileSave") saveCurrentWifiProfile();
    if (actionId === "machine.profileDelete") deleteCurrentWifiProfile();
    if (actionId === "machine.testConnection") testWifiConnection();
    if (actionId === "machine.wifiProtocol") updateSetting("wifiProtocol", payload);
    if (actionId === "machine.wifiHost") updateSetting("wifiHost", payload);
    if (actionId === "machine.wifiPort") updateSetting("wifiPort", payload);
    if (actionId === "machine.wifiPath") updateSetting("wifiPath", payload);
    if (actionId === "machine.clearDebug") setDebugLogs([]);

    if (actionId === "file.save") exportJson();
    if (actionId === "file.new") requestSafeAction("new");
    if (actionId === "file.open") requestSafeAction("open");
    if (actionId === "file.export.dxf") exportDxf();
    if (actionId === "file.export.gcode") exportGcode();
    if (actionId === "file.export.csv") exportCsv();
    if (actionId === "file.export.image") exportImage();
    if (actionId === "file.export.json") exportJson();

    if (actionId === "system.theme") updateSetting("theme", payload);
    if (actionId === "system.measure") updateSetting("measure", payload);
    if (actionId === "system.grid") updateSetting("grid", !settings.grid);
    if (actionId === "system.snap") updateSetting("snap", !settings.snap);
    if (actionId === "system.showPoints") {
      updateSetting("showPoints", !settings.showPoints);
    }
    if (actionId === "system.showLinePoints") {
      updateSetting("showLinePoints", !settings.showLinePoints);
    }
    if (actionId === "system.autoFocus") {
      updateSetting("autoFocus", !settings.autoFocus);
    }
    if (actionId === "system.autoCenter") {
      updateSetting("autoCenter", !settings.autoCenter);
    }
    if (actionId === "system.fit") fitDrawingInView();
    if (actionId === "system.center") centerDrawing();
    if (actionId === "system.resetRoom") resetRoom();
    if (actionId === "system.debugIO") updateSetting("debugIO", !settings.debugIO);
  }

  const sections = useMemo(() => {
    if (activeMenu === "file") {
      return [
        {
          id: "file-main",
          label: "Project",
          items: [
            {
              id: "new",
              label: "New",
              icon: "NW",
              action: "file.new",
            },
            {
              id: "open",
              label: "Open JSON",
              icon: "OP",
              action: "file.open",
            },
            {
              id: "save",
              label: "Save",
              icon: "SV",
              action: "file.save",
              disabled: !auth.can("SAVE_PROJECT"),
            },
            {
              id: "export",
              type: "split",
              label: "Export",
              icon: "EX",
              action: "file.export.dxf",
              options: [
                {
                  id: "dxf",
                  label: `DXF (${settings.measure.toUpperCase()})`,
                  action: "file.export.dxf",
                },
                {
                  id: "gcode",
                  label: `GCode (${settings.measure.toUpperCase()})`,
                  action: "file.export.gcode",
                },
                {
                  id: "csv",
                  label: `CSV (${settings.measure.toUpperCase()})`,
                  action: "file.export.csv",
                },
                { id: "image", label: "Image", action: "file.export.image" },
                { id: "json", label: "JSON", action: "file.export.json" },
              ],
            },
          ],
        },
      ];
    }

    if (activeMenu === "machine") {
      const machineItems = [
        {
          id: "source",
          type: "select",
          label: "Input Source",
          action: "machine.source",
          value: settings.machineSource,
          options: [
            { value: "serial", label: "Serial Bridge" },
            { value: "wifi", label: "WiFi Socket" },
          ],
        },
        {
          id: "conn",
          label: status.connection.startsWith("CONNECTED")
            ? "Disconnect"
            : "Connect",
          icon: "IO",
          action: "machine.connect",
          tone: status.connection.startsWith("CONNECTED")
            ? "success"
            : "danger",
          active: status.connection.startsWith("CONNECTED"),
        },
      ];

      if (settings.machineSource === "wifi") {
        machineItems.push(
          {
            id: "wifi-profile",
            type: "select",
            label: "WiFi Profile",
            action: "machine.profile",
            value: activeWifiProfileId,
            options: wifiProfiles.map((p) => ({ value: p.id, label: p.name })),
          },
          {
            id: "wifi-profile-name",
            type: "input",
            label: "Profile Name",
            action: "machine.profileName",
            value: settings.wifiProfileName,
            placeholder: "My Device",
          },
          {
            id: "wifi-profile-save",
            label: "Save Profile",
            icon: "SV",
            action: "machine.profileSave",
          },
          {
            id: "wifi-profile-delete",
            label: "Delete Profile",
            icon: "DL",
            action: "machine.profileDelete",
            tone: "warning",
          },
          {
            id: "wifi-proto",
            type: "select",
            label: "Protocol",
            action: "machine.wifiProtocol",
            value: settings.wifiProtocol,
            options: [
              { value: "ws", label: "ws" },
              { value: "wss", label: "wss" },
            ],
          },
          {
            id: "wifi-host",
            type: "input",
            label: "WiFi Host/IP",
            action: "machine.wifiHost",
            value: settings.wifiHost,
            placeholder: "192.168.4.1",
          },
          {
            id: "wifi-port",
            type: "input",
            label: "WiFi Port",
            action: "machine.wifiPort",
            value: settings.wifiPort,
            inputType: "number",
            placeholder: "81",
          },
          {
            id: "wifi-path",
            type: "input",
            label: "WiFi Path",
            action: "machine.wifiPath",
            value: settings.wifiPath,
            placeholder: "/",
          },
          {
            id: "wifi-test",
            label: "Test Connection",
            icon: "TS",
            action: "machine.testConnection",
          },
        );
      }

      machineItems.push(
        {
          id: "input-unit",
          type: "select",
          label: "Input Unit",
          action: "machine.inputUnit",
          value: settings.inputUnit,
          options: [
            { value: "um", label: "Micrometer (um)" },
            { value: "mm", label: "Millimeter (mm)" },
            { value: "cm", label: "Centimeter (cm)" },
            { value: "inch", label: "Inch (in)" },
          ],
        },
        {
          id: "capture-toggle",
          label: status.capture === "CAPTURING" ? "Stop Capture" : "Start Capture",
          icon: status.capture === "CAPTURING" ? "SP" : "ST",
          action: "machine.captureToggle",
          disabled: !auth.can("CAPTURE"),
          tone: status.capture === "CAPTURING" ? "danger" : "success",
          active: status.capture === "CAPTURING",
        },
        {
          id: "status",
          label: "Controller Status",
          icon: "QS",
          action: "machine.status",
        },
        {
          id: "clear-debug",
          label: "Clear Debug",
          icon: "CL",
          action: "machine.clearDebug",
        },
      );

      return [
        {
          id: "machine-ops",
          label: "Capture",
          items: machineItems,
        },
      ];
    }

    if (activeMenu === "system") {
      return [
        {
          id: "system-appearance",
          label: "Appearance",
          items: [
            {
              id: "theme",
              type: "select",
              label: "Theme",
              action: "system.theme",
              value: settings.theme,
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ],
            },
          ],
        },
        {
          id: "system-workspace",
          label: "Workspace",
          items: [
            {
              id: "measure",
              type: "select",
              label: "Measure",
              action: "system.measure",
              value: settings.measure,
              options: [
                { value: "mm", label: "Millimeter" },
                { value: "inch", label: "Inch" },
              ],
            },
            {
              id: "grid",
              label: settings.grid ? "Grid ON" : "Grid OFF",
              icon: "GD",
              action: "system.grid",
              active: settings.grid,
            },
            {
              id: "snap",
              label: settings.snap ? "Snap ON" : "Snap OFF",
              icon: "SN",
              action: "system.snap",
              active: settings.snap,
            },
            {
              id: "show-points",
              label: settings.showPoints ? "Points ON" : "Points OFF",
              icon: "PT",
              action: "system.showPoints",
              active: settings.showPoints,
            },
            {
              id: "show-line-points",
              label: settings.showLinePoints ? "Line Pts ON" : "Line Pts OFF",
              icon: "LP",
              action: "system.showLinePoints",
              active: settings.showLinePoints,
            },
            {
              id: "auto-focus",
              label: settings.autoFocus ? "Auto Focus ON" : "Auto Focus OFF",
              icon: "AF",
              action: "system.autoFocus",
              active: settings.autoFocus,
            },
            {
              id: "auto-center",
              label: settings.autoCenter ? "Auto Center ON" : "Auto Center OFF",
              icon: "AC",
              action: "system.autoCenter",
              active: settings.autoCenter,
            },
            {
              id: "fit",
              label: "Fit Screen",
              icon: "FT",
              action: "system.fit",
            },
            {
              id: "center",
              label: "Center Drawing",
              icon: "CT",
              action: "system.center",
            },
            {
              id: "reset-room",
              label: "Reset Room",
              icon: "RS",
              action: "system.resetRoom",
            },
            {
              id: "debug-io",
              label: settings.debugIO ? "Debug I/O ON" : "Debug I/O OFF",
              icon: "DB",
              action: "system.debugIO",
              active: settings.debugIO,
            },
          ],
        },
      ];
    }

    return [
      {
        id: "draw-create",
        label: "Create",
        items: [
          {
            id: "line",
            label: "Line",
            icon: "LN",
            action: "tool.line",
            active: activeTool === "line",
          },
          {
            id: "circle",
            label: "Circle",
            icon: "CI",
            action: "tool.circle",
            active: activeTool === "circle",
            disabled: !auth.can("CIRCLE_TOOL"),
          },
        ],
      },
      {
        id: "draw-modify",
        label: "Modify",
        items: [
          {
            id: "select",
            label: "Select",
            icon: "SE",
            action: "tool.select",
            active: activeTool === "select",
          },
          {
            id: "move",
            label: "Move",
            icon: "MV",
            action: "tool.move",
            active: activeTool === "move",
          },
          {
            id: "copy",
            label: "Copy",
            icon: "CP",
            action: "tool.copy",
            active: activeTool === "copy",
          },
          {
            id: "trim",
            label: "Trim",
            icon: "TR",
            action: "tool.trim",
            active: activeTool === "trim",
            disabled: !auth.can("ADVANCED_TRIM"),
          },
          {
            id: "undo",
            label: "Undo",
            icon: "UN",
            action: "tool.undo",
          },
          {
            id: "redo",
            label: "Redo",
            icon: "RE",
            action: "tool.redo",
          },
        ],
      },
    ];
  }, [
    activeMenu,
    activeTool,
    auth,
    settings,
    status.connection,
    status.capture,
    wifiProfiles,
    activeWifiProfileId,
  ]);

  const activeMenuLabel =
    TOP_MENUS.find((m) => m.id === activeMenu)?.label || "Draw";

  return (
    <div className="main">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="file-open-input"
        onChange={onOpenFileSelected}
      />

      <MenuBar
        menus={TOP_MENUS}
        activeMenu={activeMenu}
        onSelectMenu={setMenu}
      />

      <div className="content" ref={contentRef}>
        <SubMenuPanel
          activeMenuLabel={activeMenuLabel}
          unitLabel={settings.measure === "inch" ? "Inch" : "Millimeter"}
          cursorLabel={`X ${formatCoord(status.x, settings.measure)} | Y ${formatCoord(status.y, settings.measure)}`}
          sections={sections}
          onAction={runAction}
          collapsed={leftMenuCollapsed}
          onToggleCollapsed={toggleLeftMenu}
          width={submenuWidth}
        />
        {!leftMenuCollapsed && (
          <div
            className="submenu-resizer"
            onMouseDown={startSubmenuResize}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize submenu"
          />
        )}

        <div className="workspace-container">
          <WorkspaceView canvasRef={canvasRef} />
          <div className="workspace-hint">{toolHint}</div>
          {settings.debugIO && (
            <div className="io-debug">
              <div className="io-debug-title">I/O Debug</div>
              <div className="io-debug-list">
                {debugLogs.map((line, i) => (
                  <div key={`${line}-${i}`} className="io-debug-line">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="workspace-zoom-controls">
            <button className="zoom-btn" onClick={undo}>
              Undo
            </button>
            <button className="zoom-btn" onClick={redo}>
              Redo
            </button>
            <button className="zoom-btn" onClick={() => zoomBy(1.2)}>
              +
            </button>
            <button className="zoom-btn" onClick={() => zoomBy(1 / 1.2)}>
              -
            </button>
            <button className="zoom-btn" onClick={resetZoom}>
              100%
            </button>
          </div>
        </div>

        {!inspectorCollapsed && (
          <div
            className="inspector-resizer"
            onMouseDown={startInspectorResize}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize inspector"
          />
        )}

        <div
          className={`inspector ${inspectorCollapsed ? "collapsed" : ""}`}
          style={{ width: `${inspectorCollapsed ? 34 : inspectorWidth}px` }}
        >
          <div className="inspector-header">
            <button
              className="inspector-collapse-btn"
              onClick={toggleInspectorCollapsed}
            >
              {inspectorCollapsed ? "<" : ">"}
            </button>
          </div>

          {!inspectorCollapsed && (
            <div className="inspector-content">
              {ready && inspectorCtx && (
                <InspectorPanel
                  scene={inspectorCtx.scene}
                  commands={inspectorCtx.commands}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <StatusBar
        status={status}
        measure={settings.measure}
        theme={settings.theme}
        inputUnit={settings.inputUnit}
      />

      {confirmModal.open && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <h3>Unsaved Changes</h3>
            <p>Do you want to save current workspace before continuing?</p>
            <div className="confirm-actions">
              <button onClick={() => resolveConfirm("save")}>Save</button>
              <button onClick={() => resolveConfirm("discard")}>
                Don&apos;t Save
              </button>
              <button onClick={() => resolveConfirm("cancel")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {warningModal.open && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <h3>Machine Warning</h3>
            <p>{warningModal.message}</p>
            <div className="confirm-actions">
              <button
                onClick={() => setWarningModal({ open: false, message: "" })}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
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
