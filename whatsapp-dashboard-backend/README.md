# WhatsApp Dashboard — Backend

Implements every endpoint from `frontend_api_overview.md`, plus a Socket.io layer for real-time updates the REST spec implied but didn't detail (typing indicator, live new messages, live lead updates).

## Setup

Auth is now self-serve: create a workspace from the frontend signup page or
with `POST /api/v1/auth/signup`. Login returns a short-lived access token plus
a refresh token; use `POST /api/v1/auth/refresh` to rotate the refresh token
and get a new access token.

To enable Google OAuth 2.0, create a Google OAuth client and set
`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`GOOGLE_OAUTH_REDIRECT_URI`, and `FRONTEND_ORIGIN`.

```bash
npm install
cp .env.example .env   # fill in real values
psql $DATABASE_URL -f db/schema.sql
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # → put in ENCRYPTION_KEY
npm run dev
```

Optional manual seed for local testing:

```sql
INSERT INTO workspaces (name, email, password_hash)
VALUES ('Test Workspace', 'you@example.com', '$2b$10$...'); -- bcrypt hash, 10 rounds
```

Generate the hash: `node -e "require('bcrypt').hash('yourpassword', 10).then(console.log)"`

## Critical integration point: this is NOT your WhatsApp webhook backend

This project is the **dashboard's** API — auth, leads, conversations-as-stored-in-Postgres, analytics. It does **not** receive inbound WhatsApp messages directly.

Your existing WhatsApp automation backend (Express webhook + Redis session state machine + BullMQ + Claude Haiku intent detection) is where messages actually arrive from Meta/the BSP. Two things need to connect:

1. **Inbound**: when your webhook backend receives a customer message, it should also `INSERT INTO messages (...)` in this same Postgres DB (`is_agent = false`), then call `emitToWorkspace(workspaceId, 'message:new', {...})` — import `src/realtime/socket.js` into that service, or expose this dashboard's socket emit as a tiny internal HTTP endpoint the webhook backend calls.
2. **Outbound**: `conversations.service.js#sendMessage` currently only writes to Postgres. Add a call from there to whatever function your webhook backend uses to actually push a message to the WhatsApp Cloud API/BSP — this is marked with a `NOTE:` comment in the file.

Simplest path: run both as one Express app sharing the same Postgres pool and Redis client (this project's `src/config/db.js` and `src/config/redis.js` are structured to make that a straightforward merge — same connection string, same instance).

## Assumptions made (not fully specified in the frontend doc)

- **"On Deck"** — no follow-up scheduling existed in the spec. Added `contacts.next_followup_at`; set this whenever an agent manually schedules a follow-up (no UI for this yet — needs a small addition to the Leads or Conversations page).
- **"Today's Cash"** — assumed to mean bookings *recorded* today, not bookings *scheduled for* today (the spec's Overview page description conflates the two). If you meant the latter, add a `scheduled_for` column to `bookings` and filter on that instead of `booked_at`.
- **Booking creation** — a row is written to `bookings` automatically whenever a lead's status flips to `'Booked'` via `PATCH /leads/:id`. If bookings should be a separate manual action instead, split this into its own endpoint.
- **Conversation online/unread counts** — both computed live via subquery. Fine at current scale; if a workspace grows past a few thousand contacts, precompute these into denormalized columns updated on write instead.

## Realtime events (frontend should subscribe via socket.io-client)

```js
const socket = io(BACKEND_URL, { auth: { token: jwtFromLogin } });
socket.on("message:new", ({ contactId, message }) => { /* update conversation thread */ });
socket.on("typing", ({ contactId, isTyping }) => { /* show/hide typing indicator */ });
socket.on("lead:created", (lead) => { /* prepend to leads table */ });
socket.on("lead:updated", (lead) => { /* patch leads table row */ });
```

## Security notes

- WhatsApp API token is encrypted (AES-256-GCM) before storage — set `ENCRYPTION_KEY` in `.env`, generate with the command in Setup above. Never log or return this token in any response.
- Every query filters by `workspace_id` derived from the verified JWT — never from `req.params`/`req.body`, so one workspace can never read/write another's data even if IDs are guessed.
- Login and signup are rate-limited (10 attempts / 15 min / IP).
- Refresh tokens are stored hashed, rotated on use, and revoked on logout.
- Google OAuth 2.0 uses the authorization code flow and a signed short-lived state value.
- All write endpoints validate input via Zod before touching the DB.

## Not yet built (flag if you need these before shipping)

- File/media upload handling for `mediaUrl` (currently expects the frontend to already have a hosted URL, e.g. via a separate upload step to S3/Cloudinary)
