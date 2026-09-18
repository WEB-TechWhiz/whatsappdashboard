# Cloudflare Tunnel Setup

This backend sits behind Cloudflare Tunnel when Lovable or another hosted frontend calls the API directly. Cloudflare adds `X-Forwarded-For` to every request, so Express must trust the tunnel proxy before `express-rate-limit` runs. Without that, successful logins can be returned as `500 INTERNAL_ERROR`.

## Backend `.env`

Set these values in `whatsapp-dashboard-backend/.env`:

```env
PORT=4000
TRUST_PROXY_HOPS=1
FRONTEND_ORIGIN=https://your-lovable-app.lovable.app,https://*.lovable.app
API_PUBLIC_ORIGIN=https://api.yourdomain.com
GOOGLE_OAUTH_REDIRECT_URI=auto
WHATSAPP_WEBHOOK_VERIFY_TOKEN=replace-me
WHATSAPP_WEBHOOK_SECRET=replace-with-your-meta-app-secret
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_WORKSPACE_ID=your-workspace-uuid
```

Notes:

- `TRUST_PROXY_HOPS=1` is the default and is correct for a single Cloudflare Tunnel hop.
- `FRONTEND_ORIGIN` is a comma-separated allowlist shared by Express CORS and Socket.IO.
- Wildcards are supported in `FRONTEND_ORIGIN`, for example `https://*.lovable.app`.
- For local development, include local origins too, for example `http://localhost:3000,http://localhost:5173,https://your-lovable-app.lovable.app`.
- `API_PUBLIC_ORIGIN` is your public HTTPS backend/API tunnel origin.
- `GOOGLE_OAUTH_REDIRECT_URI=auto` makes the backend generate `${API_PUBLIC_ORIGIN}/api/v1/auth/oauth/google/callback`.
- The generated callback URL must exactly match an Authorized redirect URI in your Google Cloud OAuth client. If your backend is reached through Cloudflare, do not leave the callback as `http://localhost:4000/...`.

## Cloudflare `config.yml`

Point the public tunnel hostname at the backend port:

```yaml
tunnel: whatsapp-dashboard-backend
credentials-file: C:\Users\<you>\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:4000
    originRequest:
      httpHostHeader: localhost
      noTLSVerify: true
  - service: http_status:404
```

Then run:

```powershell
cloudflared tunnel run whatsapp-dashboard-backend
```

## Frontend Environment

Point the frontend at the HTTPS tunnel host:

```env
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_SOCKET_URL=https://api.yourdomain.com
```

Restart the backend after changing `.env`. The Socket.IO client and server both prefer websocket first and fall back to polling if needed.

## WhatsApp Webhook

Use this callback URL in Meta:

```text
https://api.yourdomain.com/api/v1/webhooks/whatsapp
```

Use the same value from `WHATSAPP_WEBHOOK_VERIFY_TOKEN` as Meta's verify token.
Set `WHATSAPP_WEBHOOK_SECRET` to your Meta app secret so signed webhook payloads can be verified. If you have more than one workspace, set `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_WORKSPACE_ID` so inbound messages are stored in the correct workspace.

## Google OAuth Debug

After restarting the backend, open:

```text
https://api.yourdomain.com/api/v1/auth/oauth/google/debug
```

The response shows the exact `redirectUri` the backend sends to Google. Copy that exact URL into Google Cloud Console under your OAuth client's **Authorized redirect URIs**.
