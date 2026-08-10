# Cloudflare Tunnel — WhatsApp Dashboard

Expose your local WhatsApp Dashboard (frontend + backend + websockets) to the internet via [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/). No port forwarding, no firewall rules, automatic HTTPS.

## Architecture

```
Browser ──HTTPS──▶ Cloudflare Edge ──tunnel──▶ localhost
                     │                           │
                     │  dashboard.example.com     │  :3000  (Vite / TanStack Start)
                     │  api.example.com           │  :4000  (Express API + Socket.IO)
                     │                           │
                     └───────────────────────────┘
```

Cloudflare Tunnel creates an outbound-only connection from your machine to Cloudflare's edge network. Traffic flows:

1. User visits `https://dashboard.example.com`
2. Cloudflare terminates TLS, routes to the tunnel
3. `cloudflared` on your machine receives it and forwards to `localhost:3000`
4. API calls / websockets from the browser go to `https://api.example.com` → `localhost:4000`

---

## Prerequisites

- **cloudflared** installed and on PATH  
  Download: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  
  ```powershell
  # Verify installation
  cloudflared --version
  ```

- **Frontend** dev server running on port 3000 (`npm run dev`)
- **Backend** dev server running on port 4000 (`cd whatsapp-dashboard-backend && npm run dev`)

---

## Quick Tunnel (Development)

Quick tunnels give you a temporary `*.trycloudflare.com` URL with zero configuration. Perfect for:
- Testing webhooks (WhatsApp, payment gateways)
- Sharing your dev environment with teammates
- Mobile device testing

### One-Command Launch

```powershell
# From the whatsappdashboard/ directory:
npm run tunnel:dev
```

This runs `start-tunnel.ps1` which:
1. Starts a tunnel for the **backend** (port 4000) 
2. Starts a tunnel for the **frontend** (port 3000)
3. Prints both public URLs
4. Shows the WhatsApp webhook URL and OAuth redirect URI
5. Cleans up everything on `Ctrl+C`

### Manual Quick Tunnels

If you prefer to run tunnels individually:

```powershell
# Terminal 1: Backend tunnel
cd whatsapp-dashboard-backend
npm run tunnel

# Terminal 2: Frontend tunnel  
npm run tunnel
```

### Quick Tunnel Caveats

> [!WARNING]
> - URLs change every time you restart the tunnel
> - No custom domain — always `*.trycloudflare.com`
> - Not suitable for production (no SLA, URLs are ephemeral)
> - You'll need to update the WhatsApp webhook URL each time

---

## Named Tunnel (Production)

Named tunnels give you persistent, custom-domain URLs. They survive restarts and can run as a system service.

### Setup Wizard

```powershell
npm run tunnel:setup
```

This interactive script will:
1. Authenticate with Cloudflare (opens browser)
2. Create a named tunnel called `whatsapp-dashboard`
3. Ask for your custom domain names
4. Create DNS CNAME records
5. Generate `cloudflared.yml` config

### Manual Setup

If you prefer to set up manually:

```powershell
# 1. Authenticate (one-time)
cloudflared tunnel login

# 2. Create tunnel
cloudflared tunnel create whatsapp-dashboard

# 3. Create DNS routes
cloudflared tunnel route dns whatsapp-dashboard dashboard.yourdomain.com
cloudflared tunnel route dns whatsapp-dashboard api.yourdomain.com

# 4. Copy and edit the config template
copy cloudflared.example.yml cloudflared.yml
# Edit cloudflared.yml with your tunnel ID, credentials path, and hostnames

# 5. Run the tunnel
cloudflared tunnel run whatsapp-dashboard
```

### Running the Named Tunnel

```powershell
# Using npm script
npm run tunnel:run

# Or directly
cloudflared tunnel run whatsapp-dashboard
```

### Running as a Windows Service

For persistent production deployment:

```powershell
# Install as a service (run as Administrator)
cloudflared service install

# The service reads from %USERPROFILE%\.cloudflared\config.yml
# Copy your cloudflared.yml there:
copy cloudflared.yml $env:USERPROFILE\.cloudflared\config.yml
```

---

## Environment Configuration

### Backend `.env`

When using a **named tunnel** in production, add the tunnel dashboard origin to CORS:

```env
# Your custom dashboard origin — allows CORS from the tunnel URL
CF_TUNNEL_ORIGIN=https://dashboard.yourdomain.com

# If using a named tunnel, also update the frontend origin
FRONTEND_ORIGIN=https://dashboard.yourdomain.com

# And the Google OAuth redirect URI
GOOGLE_OAUTH_REDIRECT_URI=https://api.yourdomain.com/api/v1/auth/oauth/google/callback
```

For **quick tunnels** in development, `*.trycloudflare.com` origins are automatically allowed — no `.env` changes needed.

### Frontend

The frontend automatically derives the API URL from `window.location.origin`, so it works transparently through tunnels. The Vite dev server proxy handles `/api/v1` and `/socket.io` routing.

If you need to point the frontend to a different API URL (e.g., the backend tunnel URL directly):

```env
# In .env.local (frontend)
VITE_API_URL=https://your-backend-tunnel-url.trycloudflare.com/api/v1
```

---

## NPM Scripts Reference

### Frontend (`whatsappdashboard/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `tunnel` | `cloudflared tunnel --url http://localhost:3000` | Quick-tunnel frontend only |
| `tunnel:dev` | `powershell ... start-tunnel.ps1` | Quick-tunnel both frontend + backend |
| `tunnel:setup` | `powershell ... setup-tunnel.ps1` | Named tunnel setup wizard |
| `tunnel:run` | `cloudflared tunnel run whatsapp-dashboard` | Run the named tunnel |

### Backend (`whatsapp-dashboard-backend/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `tunnel` | `cloudflared tunnel --url http://localhost:4000` | Quick-tunnel backend only |

---

## WhatsApp Webhook Configuration

When using a tunnel, update your WhatsApp webhook URL in the [Meta Developer Portal](https://developers.facebook.com/):

- **Quick tunnel**: `https://<random>.trycloudflare.com/api/v1/webhooks/whatsapp`
- **Named tunnel**: `https://api.yourdomain.com/api/v1/webhooks/whatsapp`

The `start-tunnel.ps1` script prints the webhook URL automatically.

> [!IMPORTANT]
> Quick tunnel URLs change every restart. For stable webhook delivery, use a named tunnel.

---

## Google OAuth Configuration

When using a tunnel URL, update the redirect URI in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

**Authorized redirect URIs:**
- `https://api.yourdomain.com/api/v1/auth/oauth/google/callback` (named tunnel)
- Or the backend quick-tunnel URL + `/api/v1/auth/oauth/google/callback`

Also update `GOOGLE_OAUTH_REDIRECT_URI` in the backend `.env`.

---

## Troubleshooting

### CORS Errors

**Symptom**: Browser console shows `Origin not allowed by CORS` errors.

**Fix**: 
- For quick tunnels: Ensure `NODE_ENV` is not `production` (dev mode auto-allows `*.trycloudflare.com`)
- For named tunnels: Set `CF_TUNNEL_ORIGIN=https://dashboard.yourdomain.com` in backend `.env`
- For multiple origins: Use comma-separated values: `CF_TUNNEL_ORIGIN=https://a.example.com,https://b.example.com`

### WebSocket Disconnects

**Symptom**: Socket.IO repeatedly connects and disconnects through the tunnel.

**Fix**: The `cloudflared.example.yml` already configures `keepAliveTimeout: 90s` for the API hostname. If issues persist:
- Check that the API hostname routes to port 4000 (not 3000)
- Ensure the browser connects to the API tunnel URL for websockets

### Tunnel Won't Start

**Symptom**: `cloudflared tunnel run` fails.

**Fix**:
1. Verify credentials: `cloudflared tunnel list`
2. Check the config file path: `cloudflared tunnel --config cloudflared.yml run whatsapp-dashboard`
3. Re-authenticate: `cloudflared tunnel login`

### Quick Tunnel URL Not Captured

**Symptom**: `start-tunnel.ps1` times out waiting for URL.

**Fix**:
1. Ensure the local server is actually running on the expected port
2. Check firewall rules allowing `cloudflared` outbound
3. Run `cloudflared tunnel --url http://localhost:3000` manually to see error output

---

## File Reference

| File | Purpose |
|------|---------|
| `start-tunnel.ps1` | Quick-tunnel launcher (dev) |
| `setup-tunnel.ps1` | Named tunnel setup wizard |
| `cloudflared.example.yml` | Named tunnel config template |
| `cloudflared.yml` | Your actual tunnel config (gitignored) |
| `whatsapp-dashboard-backend/src/config/cors.js` | CORS config with tunnel support |
