import { useEffect, useRef } from "react";

import { CanvasRenderer, ViewTransform, Viewport } from "@dac/renderer-canvas";

import { Scene } from "@dac/core-scene";
import { CommandManager } from "@dac/core-commands";
import { MachineController } from "@dac/core-machine";

import {
  Workspace,
  SelectTool,
  LineTool,
  CircleTool,
  TrimTool,
} from "@dac/core-workspace";

export function App() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    const tf = new ViewTransform();

    tf.scale = 40;
    tf.offsetX = 400;
    tf.offsetY = 300;

    const renderer = new CanvasRenderer(canvas, tf);

    new Viewport(tf, canvas);

    const scene = new Scene();
    const mgr = new CommandManager(scene);

    // Machine bridge
    const machine = new MachineController(mgr);

    const ws = new Workspace(canvas, scene, renderer, tf);

    ws.commands = mgr;

    ws.tools.set(new SelectTool(ws));

    // WebSocket to bridge
    const wsConn = new WebSocket("ws://localhost:8080");

    wsConn.onmessage = (e) => {
      const evt = JSON.parse(e.data);
      console.log("Received event:", evt);
      
      machine.onEvent(evt);
    };

    wsConn.onopen = () => {
      console.log("WS connected");
    };

    window.addEventListener("keydown", (e) => {
      if (e.key === "l") {
        ws.tools.set(new LineTool(ws));
        console.log("Line");
      }

      if (e.key === "c") {
        ws.tools.set(new CircleTool(ws));
        console.log("Circle");
      }

      if (e.key === "t") {
        ws.tools.set(new TrimTool(ws));
        console.log("Trim");
      }

      if (e.key === "s") {
        ws.tools.set(new SelectTool(ws));
        console.log("Select");
      }
    });

    function loop() {
      renderer.drawAll(scene.getAll());

      const tool = ws.tools.get();

      if (tool?.drawOverlay) {
        tool.drawOverlay(renderer.ctx);
      }

      requestAnimationFrame(loop);
    }

    loop();
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: "1px solid black",
        }}
      />
    </div>
  );
}
