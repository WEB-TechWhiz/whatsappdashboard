# WhatsApp Dashboard: Current Project and Automation Guide

**Last reviewed:** July 9, 2026

**Repository:** `whatsappdashboard`

**Current architecture:** TanStack Start frontend + Express monolith + PostgreSQL + Socket.IO

**Migration status:** API Gateway foundation exists; business services have not yet been extracted from the monolith.

## 1. Current Status

The repository contains two related systems:

1. A functional WhatsApp CRM dashboard covering authentication, conversations, leads, analytics, settings, inbound integration, outbound delivery forwarding, and realtime updates.
2. An AI automation implementation covering Meta webhooks, Gemini analysis, workflows, lead qualification, and human escalation. This code is present but is not currently production-ready or fully integrated with the PostgreSQL CRM.

### Status by area

| Area | Status | Notes |
|---|---|---|
| Email/password authentication | Implemented | JWT access tokens and rotating refresh tokens. |
| Google OAuth | Implemented, configuration required | Requires Google OAuth environment variables. |
| Workspace isolation | Implemented for CRM routes | Workspace ID comes from the verified JWT. |
| Conversations | Implemented | List conversations, load messages, send messages, typing state, read-on-open. |
| Leads | Implemented | List, search, filter, create, update status/value. |
| Analytics | Implemented | Live PostgreSQL queries for overview and bookings. |
| Settings | Implemented | Workspace profile, WhatsApp bridge settings, simple automation flags. |
| Realtime updates | Implemented | Socket.IO workspace rooms and four emitted event types. |
| Inbound WhatsApp bridge | Implemented | Internal service endpoint stores inbound messages. |
| Outbound WhatsApp bridge | Implemented, external sender required | Messages are stored locally and optionally forwarded to `WHATSAPP_SEND_URL`. |
| API Gateway | Implemented as a migration foundation | The browser does not use it by default. All configured services still point to port 4000. |
| AI automation source code | Partial | Present, but route mounting and PostgreSQL compatibility must be fixed. |
| Automation dashboard UI | Not implemented | Sidebar links exist, but no frontend automation route exists. |
| Redis-backed jobs/session state | Not integrated | Redis client exists but is not used by the current CRM request flow. |
| Automated test coverage | Limited | One automation test file exists; no complete frontend/backend integration suite. |

## 2. High-Level Architecture

```text
Browser
  |
  | React pages, React Query, apiFetch(), Socket.IO client
  v
TanStack Start frontend (normally port 5173)
  |
  | Current default: direct REST calls to http://localhost:4000/api/v1
  | Optional: /api/v1/* gateway proxy when VITE_API_URL points to the frontend origin
  v
Express monolith (normally port 4000)
  |
  +-- Auth routes
  +-- Conversation routes
  +-- Lead routes
  +-- Analytics routes
  +-- Settings routes
  +-- Internal WhatsApp integration route
  +-- Socket.IO server
  +-- Partially integrated automation routes
  |
  v
PostgreSQL
  +-- workspaces
  +-- refresh_tokens
  +-- contacts
  +-- messages
  +-- activity_log
  +-- bookings

External services
  +-- Google OAuth
  +-- Optional external WhatsApp sender
  +-- Optional inbound webhook/bridge service
  +-- Google Gemini for unfinished AI automation
```

### Current request paths

**Default browser path**

```text
Frontend apiFetch()
  -> VITE_API_URL or http://localhost:4000/api/v1
  -> Express route
  -> service module
  -> PostgreSQL
```

**Intended gateway path**

```text
Browser /api/v1/*
  -> TanStack catch-all API route
  -> gateway service registry
  -> Express monolith on port 4000
```

The gateway is a Strangler Fig migration foundation. Its current route-handler integration produces build warnings and must be verified before use. No separate auth, leads, analytics, conversations, settings, WhatsApp, or integrations services currently exist in this repository.

## 3. Project Structure

```text
whatsappdashboard/
|-- src/
|   |-- components/
|   |   |-- chat/
|   |   |   |-- MessageBubble.tsx
|   |   |   `-- TypingIndicator.tsx
|   |   |-- dashboard/
|   |   |   `-- AppSidebar.tsx
|   |   `-- ui/                       # Reusable shadcn/Radix UI primitives
|   |-- hooks/
|   |   `-- use-mobile.tsx
|   |-- lib/
|   |   |-- api.ts                    # REST auth/session client and Socket.IO client
|   |   |-- gateway-config.ts         # Route-to-service registry
|   |   |-- gateway-dispatcher.ts     # Gateway HTTP proxy
|   |   |-- gateway-health.ts         # Service health cache/checker
|   |   |-- gateway-startup.ts        # Gateway initialization helper
|   |   |-- error-capture.ts
|   |   |-- error-page.ts
|   |   `-- utils.ts
|   |-- routes/
|   |   |-- __root.tsx
|   |   |-- index.tsx
|   |   |-- login.tsx
|   |   |-- signup.tsx
|   |   |-- dashboard.tsx
|   |   |-- dashboard.index.tsx
|   |   |-- dashboard.conversations.tsx
|   |   |-- dashboard.leads.tsx
|   |   |-- dashboard.analytics.tsx
|   |   |-- dashboard.settings.tsx
|   |   `-- api/
|   |       |-- [...path].ts           # Gateway catch-all
|   |       `-- health.ts              # Gateway health report
|   |-- router.tsx
|   |-- routeTree.gen.ts
|   |-- server.ts
|   |-- start.ts
|   `-- styles.css
|-- whatsapp-dashboard-backend/
|   |-- db/
|   |   |-- schema.sql                 # Active PostgreSQL CRM schema
|   |   |-- auth_migration.sql
|   |   `-- migrations/
|   |       `-- 002_automation_workflows.sql
|   |-- prisma/
|   |   `-- schema.prisma              # Configuration only; no application models
|   |-- src/
|   |   |-- config/
|   |   |   |-- db.js
|   |   |   |-- logger.js
|   |   |   `-- redis.js
|   |   |-- middleware/
|   |   |   |-- auth.js
|   |   |   |-- errorHandler.js
|   |   |   |-- validate.js
|   |   |   `-- validation.js
|   |   |-- realtime/
|   |   |   `-- socket.js
|   |   |-- routes/
|   |   |   |-- auth.routes.js
|   |   |   |-- conversations.routes.js
|   |   |   |-- leads.routes.js
|   |   |   |-- analytics.routes.js
|   |   |   |-- settings.routes.js
|   |   |   |-- integrations.routes.js
|   |   |   `-- automation/
|   |   |       |-- workflows.routes.js
|   |   |       |-- webhooks.routes.js
|   |   |       |-- leads.routes.js
|   |   |       `-- escalations.routes.js
|   |   |-- services/
|   |   |   |-- conversations.service.js
|   |   |   |-- leads.service.js
|   |   |   |-- analytics.service.js
|   |   |   `-- ai-agent/
|   |   |       |-- analyzer.js
|   |   |       |-- webhook-handler.js
|   |   |       |-- workflow-engine.js
|   |   |       |-- routing-engine.js
|   |   |       `-- workflows/
|   |   |-- validators/
|   |   |   `-- schemas.js
|   |   |-- database.js                # Compatibility wrapper used by automation code
|   |   `-- server.js
|   `-- tests/
|       `-- automation.test.js
|-- package.json
|-- vite.config.ts
|-- tsconfig.json
|-- README.md
`-- WHATSAPP_AUTOMATION_GUIDE.md
```

## 4. Frontend Architecture

### Core libraries

- TanStack Start and TanStack Router for SSR and file-based routing.
- React 19 for UI.
- TanStack React Query for server state, caching, invalidation, and polling.
- Tailwind CSS v4 and Radix/shadcn-style primitives for presentation.
- Socket.IO Client for realtime conversation and lead events.
- React Hook Form and Zod are installed, although the current route forms mostly use local React state.
- Recharts is used by the mock dashboard overview.

### Session and API client

`src/lib/api.ts` is the frontend integration boundary.

- Default REST base: `http://localhost:4000/api/v1`
- Default Socket.IO base: `http://localhost:4000`
- Access token keys: `workspace_access_token` and legacy `workspace_token`
- Refresh token key: `workspace_refresh_token`
- Workspace cache key: `workspace_profile`
- Adds `Authorization: Bearer <accessToken>` to protected requests.
- On HTTP 401, calls `POST /auth/refresh`, stores the rotated session, and retries once.
- If refresh fails, clears local storage and redirects to `/login`.
- Creates one authenticated Socket.IO connection per browser session.

### Implemented frontend routes

| Frontend route | Source file | Current data source |
|---|---|---|
| `/` | `src/routes/index.tsx` | Static landing content. |
| `/login` | `src/routes/login.tsx` | Auth API. |
| `/signup` | `src/routes/signup.tsx` | Auth API. |
| `/dashboard` | `src/routes/dashboard.index.tsx` | Mock constants only. |
| `/dashboard/conversations` | `src/routes/dashboard.conversations.tsx` | Conversations API + Socket.IO. |
| `/dashboard/leads` | `src/routes/dashboard.leads.tsx` | Leads API + Socket.IO. |
| `/dashboard/analytics` | `src/routes/dashboard.analytics.tsx` | Analytics API with 15-second polling. |
| `/dashboard/settings` | `src/routes/dashboard.settings.tsx` | Workspace and settings APIs. |

`src/routes/dashboard.tsx` is the shared layout. Its global search, business switcher, quick-create menu, AI button, notification button, profile menu, status bar, version, and connection labels are currently presentation-only.

`src/components/dashboard/AppSidebar.tsx` contains many planned links, but only Dashboard, Leads, WhatsApp Conversations, Analytics, and Settings have matching route files.

## 5. Frontend Component to Backend Endpoint Map

All endpoints below are relative to `/api/v1` unless noted.

### Authentication

| Frontend component/function | Method and endpoint | Backend owner | Dependency |
|---|---|---|---|
| `SignupRoute.handleSignup` | `POST /auth/signup` | `auth.routes.js` | Creates a workspace, hashes password, returns access token, refresh token, and workspace. |
| `LoginRoute.handleLogin` | `POST /auth/login` | `auth.routes.js` | Verifies password and returns a session. |
| `startGoogleOAuth()` used by Login and Signup | `GET /auth/oauth/google?redirect=/dashboard` | `auth.routes.js` | Returns the Google authorization URL. |
| Browser Google callback | `GET /auth/oauth/google/callback` | `auth.routes.js` | Exchanges code, upserts workspace, redirects to `/login#...`. |
| `auth.refreshSession()` | `POST /auth/refresh` | `auth.routes.js` | Rotates the refresh token and returns a new session. |
| `auth.logout()` | `POST /auth/logout` | `auth.routes.js` | Revokes the current refresh token. |
| `SettingsPage` initial load | `GET /workspace/profile` | `auth.routes.js` | Loads profile, WhatsApp settings, and rule flags. |

### Conversations

| Frontend component/action | Method and endpoint | Backend owner | Dependency |
|---|---|---|---|
| `ConversationsPage` conversation query | `GET /conversations?search=<text>` | `conversations.routes.js` -> `conversations.service.js` | Conversation list, latest preview, timestamp, unread count, online flag. |
| Active conversation query | `GET /conversations/:id/messages` | Same | Loads up to 50 messages and marks unread inbound messages as read. |
| Send form | `POST /conversations/:id/messages` | Same | Stores agent message, optionally forwards it externally, emits `message:new`. |
| Message input typing state | `POST /conversations/:id/typing` | Same | Emits `typing`; no database write. |
| `MessageBubble` | No direct API call | Parent route data | Renders message DTO returned by the message endpoint. |
| `TypingIndicator` | No direct API call | Socket event state | Renders when the parent receives `typing: true`. |

Conversation query behavior:

- List polling fallback: every 10 seconds.
- Message list: loaded when the selected contact changes.
- Realtime listeners: `message:new` and `typing`.
- Search is sent to the backend on every query state change; there is no debounce.

### Leads

| Frontend component/action | Method and endpoint | Backend owner | Dependency |
|---|---|---|---|
| `LeadsPage` list | `GET /leads?search=<name>&status=<status>` | `leads.routes.js` -> `leads.service.js` | Loads contacts as lead DTOs. |
| Add Lead dialog | `POST /leads` | Same | Creates a contact and activity record, emits `lead:created`. |
| Status selector | `PATCH /leads/:id` | Same | Updates status; moving to `Booked` creates a booking snapshot. |
| Deal value input blur | `PATCH /leads/:id` | Same | Updates `deal_value`. |
| Realtime refresh | Socket `lead:created`, `lead:updated` | `socket.js` | Invalidates lead and overview queries. |

The CRM intentionally uses the same `contacts` row as both a conversation contact and a lead. This avoids separate lead/contact synchronization.

### Analytics

| Frontend component/action | Method and endpoint | Backend owner | Dependency |
|---|---|---|---|
| Overview cards | `GET /analytics/overview?range=week|month` | `analytics.routes.js` -> `analytics.service.js` | Response rate and booking rate. The response also includes leaks, today's cash, and on-deck counts, but this page does not display them. |
| Bookings chart | `GET /analytics/bookings?range=7days|30days` | Same | Daily booking count and revenue. |

Both analytics queries poll every 15 seconds.

Backend-only analytics endpoints not currently used by the frontend:

- `GET /analytics/activity?limit=10`
- `GET /analytics/summary`

The main `/dashboard` overview does not use these endpoints. Its KPIs, charts, activity feed, staff list, and pipeline values are hardcoded mock data.

### Settings

| Frontend component/action | Method and endpoint | Backend owner | Dependency |
|---|---|---|---|
| Initial settings load | `GET /workspace/profile` | `auth.routes.js` | Populates all settings fields. |
| Save profile | `PUT /settings/profile` | `settings.routes.js` | Updates workspace name and email. |
| Save WhatsApp integration | `PUT /settings/whatsapp` | `settings.routes.js` | Stores phone/webhook URL and encrypts a supplied API token. |
| Save rule switches | `PUT /settings/rules` | `settings.routes.js` | Saves `autoReply`, `notifyNewLeads`, and `flagLeaks`. |

The three settings switches are persisted configuration. Only `flag_leaks` corresponds to an existing analytics concept; the current backend does not run a scheduler that performs auto-replies or notifications from these flags.

### Sidebar and layout

| Component | Backend dependency | Current behavior |
|---|---|---|
| `AppSidebar` logout button | `POST /auth/logout` | Functional. |
| Sidebar workspace/admin labels | None | Hardcoded as Acme Wellness/Admin. |
| Sidebar badges | None | Hardcoded. |
| `DashboardLayout` top navigation | None | Mostly local UI state. |
| Dashboard access protection | No loader/route guard | Protected APIs redirect after a 401, but the layout itself does not currently enforce authentication before rendering. |

## 6. Backend API Inventory

### Public and session endpoints

| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/api/v1/auth/signup` | No |
| `POST` | `/api/v1/auth/login` | No |
| `POST` | `/api/v1/auth/refresh` | Refresh token in body |
| `POST` | `/api/v1/auth/logout` | Refresh token in body |
| `GET` | `/api/v1/auth/oauth/google` | No |
| `GET` | `/api/v1/auth/oauth/google/callback` | OAuth code/state |
| `GET` | `/health` | No |

### JWT-protected CRM endpoints

| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/workspace/profile` |
| `GET` | `/api/v1/conversations` |
| `GET` | `/api/v1/conversations/:id/messages` |
| `POST` | `/api/v1/conversations/:id/messages` |
| `POST` | `/api/v1/conversations/:id/typing` |
| `GET` | `/api/v1/leads` |
| `POST` | `/api/v1/leads` |
| `PATCH` | `/api/v1/leads/:id` |
| `GET` | `/api/v1/analytics/overview` |
| `GET` | `/api/v1/analytics/bookings` |
| `GET` | `/api/v1/analytics/activity` |
| `GET` | `/api/v1/analytics/summary` |
| `PUT` | `/api/v1/settings/profile` |
| `PUT` | `/api/v1/settings/whatsapp` |
| `PUT` | `/api/v1/settings/rules` |

### Internal integration endpoint

| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/api/v1/integrations/whatsapp/inbound` | `x-internal-token` |

Expected request:

```json
{
  "workspaceId": "workspace-uuid",
  "phone": "+919999999999",
  "name": "Priya Sharma",
  "text": "I want pricing",
  "mediaUrl": "https://example.com/file.jpg",
  "source": "Instagram"
}
```

This endpoint upserts the contact, stores the inbound message, writes an activity record, and emits `message:new` and `lead:updated`.

## 7. Realtime Architecture

Socket.IO runs on the same HTTP server as Express.

### Authentication

The frontend sends the access token in the socket handshake:

```ts
io(SOCKET_BASE_URL, {
  auth: { token: accessToken }
})
```

The backend verifies the JWT, reads `workspaceId`, and joins:

```text
workspace:<workspaceId>
```

Clients cannot choose their own workspace room.

### Events

| Event | Producer | Consumer |
|---|---|---|
| `message:new` | Outbound message route and inbound integration route | Conversations page |
| `typing` | Conversation typing route | Conversations page |
| `lead:created` | Lead create route | Leads page |
| `lead:updated` | Lead update route and inbound integration route | Leads page |

There is no current presence implementation. The `contacts.online` field exists, but socket connect/disconnect does not update it.

## 8. Database Architecture

The active backend uses `pg` and raw PostgreSQL queries. Prisma is not used by application services.

### Active CRM tables

| Table | Responsibility |
|---|---|
| `workspaces` | Tenant, login identity, OAuth identity, WhatsApp settings, simple automation flags. |
| `refresh_tokens` | Hashed, rotating, revocable refresh tokens. |
| `contacts` | Shared CRM lead and conversation contact record. |
| `messages` | Inbound and outbound conversation messages. |
| `activity_log` | Lead/message/booking/status activity. |
| `bookings` | Snapshot created when a lead first changes to `Booked`. |

### Tenant isolation

The access JWT contains `workspaceId`. `requireAuth` verifies the token and sets:

```text
req.workspaceId
req.workspace.id
req.user.id
```

CRM service queries include the verified workspace ID. The internal inbound endpoint accepts `workspaceId` in its body because it is protected by a separate internal integration token.

## 9. WhatsApp Message Flows

### Current inbound production pattern

```text
Customer sends WhatsApp message
  -> External Meta webhook/BSP/automation bridge
  -> POST /api/v1/integrations/whatsapp/inbound
  -> Contact upsert
  -> Message and activity insert
  -> Socket.IO message:new + lead:updated
  -> Dashboard refreshes in realtime
```

This is the most reliable inbound path in the current codebase.

### Current outbound production pattern

```text
Agent submits the Conversations form
  -> POST /api/v1/conversations/:id/messages
  -> Message stored in PostgreSQL
  -> Optional POST to WHATSAPP_SEND_URL
  -> Socket.IO message:new
```

If `WHATSAPP_SEND_URL` is absent, the message is stored and shown in the dashboard but is not sent to WhatsApp.

If `WHATSAPP_SEND_STRICT=true`, an external delivery failure fails the API request. Otherwise, the failure is logged while the local message remains stored.

## 10. API Gateway Status

The intended TanStack gateway contains:

- Route-to-service registry in `gateway-config.ts`.
- Catch-all proxy in `src/routes/api/[...path].ts`.
- Fetch timeout and response forwarding in `gateway-dispatcher.ts`.
- Health-check cache in `gateway-health.ts`.
- A planned health report at `/api/health`.

### Registered gateway prefixes

```text
/api/v1/auth          -> auth
/api/v1/whatsapp      -> whatsapp
/api/v1/conversations -> conversations
/api/v1/messages      -> whatsapp
/api/v1/leads         -> leads
/api/v1/analytics     -> analytics
/api/v1/settings      -> settings
/api/v1/integrations  -> integrations
```

Current limitations:

- Every service defaults to `http://localhost:4000`; no microservice has been extracted.
- The production build warns that `api/health.ts`, `api/[...path].ts`, and `middleware/gateway.ts` do not export TanStack `Route` objects and are not included in the generated route tree.
- `/api/v1/workspace/profile`, `/api/v1/automation/*`, and `/api/v1/webhooks/*` are not registered.
- The frontend defaults to direct port-4000 requests, so the gateway is bypassed unless `VITE_API_URL` is configured to use it.
- Service health paths such as `/health/auth` do not exist in the Express monolith; only `/health` exists.
- `initializeGateway()` is defined, but it is not called from the current `src/server.ts`.

The gateway should therefore be treated as source-level migration infrastructure, not as a verified production request path.

## 11. AI Automation Architecture and Current Reality

### Intended automation flow

```text
Meta webhook
  -> webhook-handler.js
  -> analyzer.js (Google Gemini)
  -> workflow-engine.js
  -> lead capture / appointment / product / FAQ-feedback workflow
  -> routing-engine.js for escalation
  -> Meta WhatsApp response
```

### Automation source modules

| Module | Intended responsibility |
|---|---|
| `analyzer.js` | Intent, sentiment, confidence, entity extraction, escalation recommendation. |
| `webhook-handler.js` | Parse Meta payload and orchestrate incoming automation. |
| `workflow-engine.js` | Select and run a workflow, record execution. |
| `routing-engine.js` | Create/assign/resolve human escalations. |
| `lead-capture.js` | Capture and qualify leads. |
| `appointment-booking.js` | Availability and appointment workflow. |
| `product-inquiry.js` | Product search and purchase-intent handling. |
| `faq-feedback.js` | FAQ response and feedback collection. |

### Declared automation endpoints

The source declares:

```text
GET    /api/v1/automation/rules
POST   /api/v1/automation/rules
PUT    /api/v1/automation/rules/:ruleId
DELETE /api/v1/automation/rules/:ruleId
POST   /api/v1/automation/analyze
POST   /api/v1/automation/execute
GET    /api/v1/automation/executions
GET    /api/v1/automation/statistics
GET    /api/v1/automation/analyses

GET    /api/v1/automation/leads
GET    /api/v1/automation/leads/:leadId
POST   /api/v1/automation/leads/:leadId/response
GET    /api/v1/automation/leads/statistics/overview

GET    /api/v1/automation/escalations
GET    /api/v1/automation/escalations/:escalationId
POST   /api/v1/automation/escalations/:escalationId/reply
POST   /api/v1/automation/escalations/:escalationId/resolve
GET    /api/v1/automation/escalations/statistics/overview
GET    /api/v1/automation/escalations/wait-time/estimate

GET    /api/v1/webhooks/whatsapp
POST   /api/v1/webhooks/whatsapp
```

### Automation blockers

The automation feature must not currently be described as production-ready:

1. `server.js` imports `automationRoutes` from `webhooks.routes.js` instead of `workflows.routes.js`. The rules/analyze/execute/history routes are therefore not mounted.
2. The automation migration uses MySQL syntax (`ENUM`, `JSON`, `KEY`, `ON UPDATE`, `VARCHAR` IDs), while the active database is PostgreSQL.
3. Automation SQL uses `?` placeholders and MySQL result conventions such as `affectedRows`; `pg` requires `$1` placeholders and returns `rowCount`.
4. Automation services reference tables and columns not created by the active PostgreSQL schema, including agents, escalations, products, FAQs, appointments, WhatsApp connections, and message status metadata.
5. The Meta webhook route is placed behind `express.raw()`, but the handler expects a parsed object in `req.body`.
6. Signature hashing uses `.digest("sha256")`; Node HMAC digest expects an encoding such as `"hex"`.
7. The migration's automation workspace IDs are `VARCHAR(36)`, while active workspace IDs are PostgreSQL UUIDs.
8. There is no frontend route that consumes the automation APIs.
9. The gateway has no automation or webhook route registrations.
10. Automation tests do not establish an end-to-end PostgreSQL + Meta + Gemini workflow.

The safe current label is **prototype/partial integration**.

## 12. Environment Variables

### Frontend

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

### Required backend core

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_dashboard
JWT_SECRET=replace-with-a-strong-secret
ENCRYPTION_KEY=64-hex-characters
INTERNAL_INTEGRATION_TOKEN=replace-with-a-strong-internal-token
```

### Optional authentication

```env
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_DAYS=30
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/api/v1/auth/oauth/google/callback
```

### Optional outbound WhatsApp bridge

```env
WHATSAPP_SEND_URL=
WHATSAPP_SEND_TOKEN=
WHATSAPP_SEND_STRICT=false
```

### Unfinished AI automation

```env
GOOGLE_AI_API_KEY=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_WEBHOOK_SECRET=
WHATSAPP_VERIFY_TOKEN=
API_BASE_URL=
REDIS_URL=
```

### Optional gateway service overrides

```env
AUTH_SERVICE_URL=http://localhost:4000
WHATSAPP_SERVICE_URL=http://localhost:4000
CONVERSATIONS_SERVICE_URL=http://localhost:4000
LEADS_SERVICE_URL=http://localhost:4000
ANALYTICS_SERVICE_URL=http://localhost:4000
SETTINGS_SERVICE_URL=http://localhost:4000
INTEGRATIONS_SERVICE_URL=http://localhost:4000
HEALTH_CHECK_INTERVAL=30000
```

## 13. Local Development

### Database

Create a PostgreSQL database, set `DATABASE_URL`, and run:

```powershell
cd whatsapp-dashboard-backend
psql $env:DATABASE_URL -f db/schema.sql
```

Do not run `db/migrations/002_automation_workflows.sql` against PostgreSQL in its current form.

### Backend

```powershell
cd whatsapp-dashboard-backend
npm install
npm run dev
```

Backend URL:

```text
http://localhost:4000
```

### Frontend

From the repository root:

```powershell
npm install
npm run dev
```

Frontend URL is normally:

```text
http://localhost:5173
```

### Basic verification

```powershell
Invoke-RestMethod http://localhost:4000/health
npm run build
npm run lint
```

Then verify:

1. Create a workspace.
2. Log out and log back in.
3. Call the internal inbound endpoint with a valid token.
4. Confirm the conversation and lead update without a page refresh.
5. Send a dashboard message.
6. Move a lead to `Booked`.
7. Confirm analytics updates.
8. Update and reload settings.

## 14. Security Model

- Passwords are hashed with bcrypt using cost 12.
- Access tokens are signed JWTs.
- Refresh tokens are random, stored as SHA-256 hashes, rotated on refresh, and revoked on logout.
- Login and OAuth initiation/callback routes are rate limited.
- Protected CRM queries are scoped to the workspace from the verified JWT.
- WhatsApp API tokens are encrypted before database storage.
- Internal inbound integration uses `x-internal-token`.
- Socket.IO uses the same JWT and server-selected workspace room as REST.
- Request bodies are validated with Zod.
- Helmet and configured CORS middleware are enabled.

Important remaining security work:

- Use a strong 32-byte hex `ENCRYPTION_KEY`; missing or malformed keys can break settings encryption.
- Add authorization and production hardening to automation routes after their database rewrite.
- Complete and test Meta webhook raw-body signature verification.
- Add audit logging, secret rotation, request IDs, and stronger integration-token management before larger production use.
- Consider HttpOnly secure cookies instead of browser local storage for long-lived session material.

## 15. Known Product and Engineering Gaps

### Frontend

- Dashboard overview is mock data.
- Most sidebar destinations do not have route components.
- Dashboard layout labels, badges, profile details, status, version, and integration state are hardcoded.
- No automation management UI exists.
- No media upload flow exists.
- Attachment, emoji, call, AI, notification, billing, and quick-create controls are placeholders.
- Dashboard route protection is reactive through API 401 handling rather than a route-level guard.

### Backend

- Inbound WhatsApp depends on an external bridge unless the unfinished Meta webhook path is repaired.
- Outbound WhatsApp depends on an external sender.
- No delivery-status columns exist in the active messages schema.
- Contact presence is not maintained.
- Redis is configured but not used in the active CRM flow.
- Prisma is configured but not used.
- No background job processor handles reminders, scheduled automation, retries, or notifications.
- No complete migration runner or versioned PostgreSQL automation schema exists.

### Gateway and migration

- Gateway startup is not wired into the current server entry.
- Health paths do not match the monolith.
- Some active routes are missing from gateway registration.
- The browser bypasses the gateway by default.
- The repository is still a frontend plus monolith, not a deployed microservices system.

## 16. Recommended Implementation Order

1. Stabilize the current CRM with backend integration tests for auth, tenant isolation, conversations, leads, settings, analytics, and Socket.IO.
2. Replace mock overview data with `/analytics/activity`, `/analytics/summary`, and a purpose-built dashboard endpoint.
3. Decide whether the supported WhatsApp entry point is the internal bridge or direct Meta webhook.
4. Rewrite the automation migration and every automation query for PostgreSQL.
5. Fix automation route mounting, webhook parsing/signature verification, and missing schema dependencies.
6. Add an automation frontend route before advertising workflow management as a dashboard feature.
7. Make the gateway the actual browser API path, register all active routes, and wire startup health checks.
8. Extract one service at a time only after contract and integration tests protect the monolith behavior.

## 17. Source-of-Truth Summary

The dependable project today is the PostgreSQL-backed CRM:

```text
Auth + Conversations + Leads + Analytics + Settings
+ Internal inbound bridge
+ Optional outbound sender
+ Socket.IO realtime updates
```

The API Gateway is a migration foundation, not yet the default runtime path.

The AI automation subsystem is a substantial prototype, but it requires a PostgreSQL rewrite, route fixes, missing schema work, webhook repairs, tests, and frontend integration before it can be considered operational.
