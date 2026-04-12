# DAC
DAC (Direct Automated CAD) is an automated 2D drafting system that converts digital inputs into machine-driven drawings with high precision.

## 1. Prerequisites
- Node.js 20+
- `pnpm` 9+
- Linux/macOS/WSL recommended for serial access
- User must have serial permission (Linux: `dialout` group)

## 2. Install
```bash
pnpm install
```

## 3. Local development (recommended first)

### Terminal A: USB serial bridge
```bash
cd packages/adapters/adapter-ws-server
node src/server.js /dev/ttyUSB0
```

Expected logs:
- `WS listening: 8080`
- `Serial connected: /dev/ttyUSB0`

### Terminal B: Web app
```bash
cd packages/examples/web-app
pnpm dev --host 0.0.0.0 --port 5173
```

Open:
- `http://localhost:5173`

## 4. Machine modes in app

### Serial mode
- Machine source: `Serial Bridge`
- App connects to: `ws://localhost:8080`
- Use when controller is connected by USB to same machine as bridge.

### Wi-Fi mode
- Machine source: `WiFi Socket`
- Example URL fields:
  - protocol: `ws`
  - host: `dac-esp-01.local` or device IP
  - port: `81`
  - path: `/`
- Use when ESP exposes websocket directly.

## 5. Production / live deployment

### Important architecture rule
- USB device is physical, so **serial bridge must run on the machine that has USB connected**.
- Remote users should connect to that bridge through a secure tunnel/reverse proxy.

### Recommended production stack
1. Build frontend:
```bash
cd packages/examples/web-app
pnpm build
```
2. Serve static app via Nginx/Caddy.
3. Run serial bridge with `pm2` or `systemd`.
4. Put websocket behind reverse proxy with TLS.
5. Restrict access with auth (VPN, Cloudflare Access, or private network).

## 6. Internet access options

### Option A (best): VPN / private network
- Tailscale / WireGuard
- Keep bridge private, no public open websocket.

### Option B: Reverse proxy + TLS + access control
- Expose web app + websocket on your domain.
- Enable TLS (`wss://`) and authentication.

### Option C: Cloudflare Tunnel
- No router port-forward needed.
- Publish app and websocket securely.

## 7. Reliability checklist
- Stable power for ESP8266 (5V/1A+).
- USB bridge as background service (auto-restart).
- Keep `ws://localhost:8080` only for local serial; use `wss://` for internet.
- Add health monitoring (pm2 status/logs).
- Backup Wi-Fi profiles and machine settings.

## 8. Common issues
- `Serial not connected`: wrong device path or permission.
- Wi-Fi timeout: wrong host/port, hotspot isolation, or ESP offline.
- `.local` not resolving: use direct IP.

## 9. Quick commands
```bash
# install
pnpm install

# run bridge
cd packages/adapters/adapter-ws-server
node src/server.js /dev/ttyUSB0

# run app
cd packages/examples/web-app
pnpm dev --host 0.0.0.0 --port 5173
```
