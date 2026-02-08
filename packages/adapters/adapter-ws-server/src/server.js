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
});

console.log("Bridge running");
