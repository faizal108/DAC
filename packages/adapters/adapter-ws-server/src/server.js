import { WebSocketServer } from "ws";

import { SerialAdapter } from "@dac/adapter-serial";

/**
 * Serial → WebSocket bridge
 */

const PORT = 8080;
const SERIAL = process.argv[2] || "/dev/ttyUSB0";

// WebSocket server
const wss = new WebSocketServer({
  port: PORT,
});

console.log("WS listening:", PORT);

// Serial adapter
const serial = new SerialAdapter(SERIAL);

await serial.connect();

console.log("Serial connected:", SERIAL);

// Broadcast helper
function broadcast(data) {
  const msg = JSON.stringify(data);

  for (const c of wss.clients) {
    if (c.readyState === 1) {
      c.send(msg);
    }
  }
}

// Listen serial
serial.onPoint((evt) => {
  broadcast(evt);
  if (evt.type === "TEXT") {
    console.log("[SERIAL]", evt.text);
  }
});

function sendWs(client, data) {
  if (client.readyState === 1) {
    client.send(JSON.stringify(data));
  }
}

wss.on("connection", (socket, req) => {
  console.log("WS client connected:", req.socket.remoteAddress);
  sendWs(socket, {
    type: "STATUS",
    status: "CONNECTED",
    serialPort: SERIAL,
    t: Date.now(),
  });

  socket.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      sendWs(socket, {
        type: "ERROR",
        message: "Invalid JSON command",
        t: Date.now(),
      });
      return;
    }

    if (msg?.type !== "COMMAND" || typeof msg.command !== "string") {
      sendWs(socket, {
        type: "ERROR",
        message: "Unsupported message",
        t: Date.now(),
      });
      return;
    }

    const ok = serial.writeLine(msg.command.trim());
    if (!ok) {
      sendWs(socket, {
        type: "ERROR",
        message: "Serial not connected",
        t: Date.now(),
      });
      return;
    }

    console.log("CMD -> serial:", msg.command.trim());
    sendWs(socket, {
      type: "ACK",
      command: msg.command.trim(),
      t: Date.now(),
    });
  });

  socket.on("close", () => {
    console.log("WS client disconnected");
  });
});

console.log("Bridge running");
