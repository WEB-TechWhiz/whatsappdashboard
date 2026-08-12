# F0 Audit Report - WhatsApp CRM Master Roadmap

Date: 2026-08-12
Project: `whatsappdashboard`
Roadmap source: `WhatsApp_CRM_Master_Feature_Wise_Implementation_Roadmap.docx`

## Executive Summary

The repository already contains a working CRM-style vertical slice: workspace authentication, tenant-scoped contacts, messages, leads, analytics, notifications, a conversation inbox, Socket.IO realtime updates, and a Meta-shaped WhatsApp webhook route.

The project is not yet aligned with the master roadmap's official WhatsApp connection model. The current app stores WhatsApp settings directly on `workspaces` and supports manual credential/webhook bridge configuration. The roadmap requires a dedicated, secure `whatsapp_connections` foundation, a connection lifecycle, Meta Embedded Signup, idempotent webhook processing, and a central message gateway before automation, AI, campaigns, billing, or scale work.

Primary recommendation: preserve the existing CRM inbox and tenant-scoped core, but replace the WhatsApp connection/messaging internals phase-by-phase. Do not expand automation, AI, campaigns, or billing until F1-F7 are complete.

## Current Architecture

### Frontend

- Framework: TanStack Start / Vite / React.
- API client: `src/lib/api.ts`.
- API gateway catch-all: `src/routes/api/[...path].ts`.
- Dashboard routes:
  - `src/routes/dashboard.index.tsx`
  - `src/routes/dashboard.conversations.tsx`
  - `src/routes/dashboard.leads.tsx`
  - `src/routes/dashboard.analytics.tsx`
  - `src/routes/dashboard.settings.tsx`
- Realtime client: Socket.IO via `getSocket()` in `src/lib/api.ts`.
- WhatsApp UI today:
  - Conversation inbox is already implemented.
  - Settings page manually accepts business phone, webhook URL, and API token.

### Backend

- Framework: Express.
- Database: Postgres through `pg`.
- Realtime: Socket.IO.
- Auth: JWT access token plus refresh token table.
- Validation: Zod schemas.
- Logging: Pino with some redaction.
- Backend entry: `whatsapp-dashboard-backend/src/server.js`.
- Main route groups:
  - Auth: `src/routes/auth.routes.js`
  - Conversations: `src/routes/conversations.routes.js`
  - Leads: `src/routes/leads.routes.js`
  - Analytics/dashboard: `src/routes/analytics.routes.js`, `src/routes/dashboard.routes.js`
  - Settings: `src/routes/settings.routes.js`
  - Internal inbound integration: `src/routes/integrations.routes.js`
  - WhatsApp webhook: `src/routes/automation/webhooks.routes.js`
  - Automation/AI routes: `src/routes/automation/*.js`

### Database

Base schema is in `whatsapp-dashboard-backend/db/schema.sql`.

Current core tables:

- `workspaces`
- `refresh_tokens`
- `contacts`
- `messages`
- `activity_log`
- `bookings`

Additional platform migration:

- `workspace_settings`
- `notifications`

Existing WhatsApp fields are currently embedded on `workspaces`:

- `whatsapp_phone`
- `whatsapp_api_token`
- `whatsapp_webhook_url`

This is the main schema gap for F1.

## What Already Exists And Should Be Preserved

### Auth And Tenant Isolation

The backend derives `req.workspaceId` from a verified JWT in `src/middleware/auth.js`. Most current REST routes use this server-derived workspace ID instead of trusting client-supplied workspace IDs.

Preserve:

- JWT auth middleware.
- Refresh token rotation.
- Per-query `workspace_id` filtering.
- Socket room isolation by workspace.

Watch:

- `src/routes/integrations.routes.js` accepts `workspaceId` in the request body behind `INTERNAL_INTEGRATION_TOKEN`. That is acceptable only as an internal bridge. It should not become the official Meta webhook path.

### CRM Inbox

The conversation model is already usable:

- Contacts double as conversation rows.
- Messages are linked by `workspace_id` and `contact_id`.
- Conversation list and message history APIs exist.
- Inbound messages create/update contacts and emit realtime events.
- Outbound agent messages are stored and emitted.

Preserve:

- `contacts` as the current conversation/contact entity unless later requirements prove a separate `conversations` table is necessary.
- Current frontend conversation API contract where practical.
- Socket events: `message:new`, `lead:updated`, `typing`, `notification:new`.

### Webhook Skeleton

`src/routes/automation/webhooks.routes.js` already implements:

- Meta verification GET endpoint.
- Raw-body handling for signature verification.
- `x-hub-signature-256` validation.
- Basic message extraction.
- Basic status event logging.

Preserve and extend this route. Do not create a duplicate webhook system.

### Credential Encryption

`src/utils/crypto.js` provides AES-256-GCM encryption and settings route encrypts manually supplied WhatsApp tokens.

Preserve:

- Encryption helper.
- Secret redaction direction.

Improve:

- Validate `ENCRYPTION_KEY` is exactly 32 bytes at startup.
- Redact broader token names, including `access_token`, `accessToken`, `authorization`, `app_secret`, and provider responses.

## Gaps Against Master Roadmap

### F1 - WhatsApp Data Foundation

Missing:

- `whatsapp_connections` table.
- `waba_id`.
- `phone_number_id`.
- `display_phone_number`.
- `business_name`.
- `provider`.
- `provider_account_id`.
- `connection_mode`.
- `access_token_encrypted`.
- `status`.
- `webhook_status`.
- `last_health_check_at`.

Current state:

- WhatsApp connection fields are stored on `workspaces`.
- Existing webhook workspace resolution tries env fallback and phone matching against `workspaces.whatsapp_phone`.

Required:

- Add dedicated connection table.
- Migrate or backfill existing workspace WhatsApp settings.
- Update webhook lookup to resolve by `phone_number_id` from `whatsapp_connections`.

### F2 - Secure Connection Lifecycle

Missing:

- Connection state machine.
- Connect/disconnect/reconnect endpoints.
- Health check job/service.
- Degraded/error states.
- Ownership validation around connection resources.

Current state:

- Settings save returns `{ connected: true }` after storing manual values.
- No technical verification is performed before saying connected.

Required:

- `CONNECTED` must mean token, WABA, phone number, webhook subscription, and health checks passed.

### F3 - Meta Embedded Signup

Missing:

- Embedded Signup frontend flow.
- Backend callback/session handling.
- WABA and phone asset discovery.
- Phone registration/subscription lifecycle.
- Meta App Review/permission readiness checklist in code/docs.

Current state:

- User manually pastes token and webhook URL.

Required:

- Replace manual setup with "Connect WhatsApp" flow.
- Keep manual fields only as an admin/dev fallback if truly needed.
- Verify current official Meta documentation at implementation time.

### F4 - Webhook Foundation

Partially exists, but incomplete.

Missing:

- Persistent webhook event envelope table.
- Idempotency keys for inbound messages/statuses.
- Fast acknowledgement with queued processing.
- Status updates persisted into messages.
- Account/template/connection event handling.
- Workspace lookup by official connection table.

Risk:

- Current webhook handler processes inline and can duplicate messages on Meta retries.
- Status webhooks are logged but not applied.

### F5 - Message Engine

Partially exists, but not official.

Current state:

- Outbound messages are inserted locally.
- Optional `WHATSAPP_SEND_URL` bridge can forward messages elsewhere.
- No central official Cloud API gateway exists in this backend.

Missing:

- Provider message ID.
- Message direction enum.
- Message source enum.
- Provider status.
- Failure code/details.
- Connection linkage.
- Compliance pre-check hook.
- Official Cloud API send implementation.

Required:

- Extend `messages` without breaking the current inbox.
- Put every outbound send through one message gateway.

### F6 - CRM Inbox / Conversation Sync

Partially exists.

Missing or incomplete:

- Delivery/read/failed state display from provider statuses.
- Assignment/ownership.
- Rich contact mapping.
- Better search/filter metadata.
- Idempotent inbound sync.

Preserve:

- Existing inbox UI and APIs as the first usable CRM surface.

### F7 - Compliance And Safety

Mostly missing.

Current state:

- `auto_reply`, `notify_new_leads`, and `flag_leaks` are simple settings.
- "Leaks after 5 min" is an analytics concept, not a safety engine.

Missing:

- Opt-out suppression.
- Server-side send blocking.
- Rate/volume controls.
- Failure detection.
- Abuse/risk signals.
- Campaign pause.
- Emergency kill switch.
- Safety audit trail.

Required before:

- Campaigns.
- Automation sends.
- AI sends.
- Billing scale.

### F8-F11 - Usage, Pricing, Wallet, Billing

Missing:

- Usage table.
- Effective-dated pricing rates.
- Wallet balance.
- Immutable ledger.
- Payment/top-up callbacks.
- Idempotent payment handling.

Current state:

- UI has payment/campaign labels in places, but no financial backend foundation.

### F12 - Coexistence

Missing.

Required:

- Must wait until F3-F6 are stable.
- Must verify current Meta eligibility and behavior before implementation.

### F13-F14 - Automation And AI

Code exists too early and is not production-aligned.

Current automation/AI issues:

- `db/migrations/002_automation_workflows.sql` uses MySQL syntax, not Postgres syntax.
- Automation routes use `?` placeholders through a Postgres pool wrapper.
- Several services reference tables that are not in the current base schema, such as `whatsapp_connections`, `conversations`, `leads`, `appointments`, `products`, `escalations`, and `escalation_messages`.
- Tests use CommonJS `require` while backend package has `"type": "module"`.
- Some send code uses `graph.instagram.com` endpoints; official WhatsApp Cloud API implementation must be verified against current Meta docs before use.

Recommendation:

- Treat automation/AI code as experimental scaffolding.
- Do not expand or wire it into official production paths until F1-F7 are complete.
- Later, port it to Postgres and force it through the central compliance/message gateway.

### F15-F20 - Admin, Observability, Security, Meta Readiness, Pilot, Scale

Mostly missing.

Partially exists:

- Pino logging.
- Request IDs.
- Socket workspace isolation.
- Some auth/security middleware.

Missing:

- Admin operations dashboard.
- Structured audit log table.
- Provider operation logs.
- Sensitive log audit.
- Security hardening checklist.
- Meta production readiness checklist.
- Pilot metrics.
- Scale/load testing plan.

## Conflicts And Risks

### Duplicate Or Conflicting WhatsApp Paths

There are at least three WhatsApp-related paths:

- Manual settings on `workspaces`.
- Internal inbound bridge at `/api/v1/integrations/whatsapp/inbound`.
- Meta webhook route at `/api/v1/webhooks/whatsapp`.

Decision:

- Keep `/api/v1/webhooks/whatsapp` as the official Meta webhook.
- Keep internal bridge only for local/dev or legacy integration.
- Move connection state out of `workspaces` into `whatsapp_connections`.

### Automation Is Ahead Of Foundation

The master roadmap explicitly says not to build AI/automation before core messaging and compliance. This repo already has automation/AI files and routes.

Decision:

- Do not delete them during F1-F7.
- Do not depend on them for the official messaging lifecycle.
- Mark them as out-of-phase until the foundation catches up.

### Postgres/MySQL Mismatch

The project uses Postgres, but automation migration and automation services contain MySQL patterns.

Examples:

- Inline `ENUM(...)`.
- `KEY idx_name (...)`.
- `UNIQUE KEY`.
- `ON UPDATE CURRENT_TIMESTAMP`.
- SQL `?` placeholders.
- MySQL `FIELD(...)`.

Decision:

- Do not run `002_automation_workflows.sql` against Postgres.
- Create new Postgres migrations for F1-F7.
- Later port automation migrations if/when F13 starts.

### Message Idempotency Missing

Inbound webhook retries can create duplicate messages because current messages do not store provider message IDs or idempotency keys.

Decision:

- F4 must add webhook event storage and unique provider event/message constraints before production traffic.

### Outbound Delivery Is Not Official

Current outbound send path stores a local message and optionally calls `WHATSAPP_SEND_URL`.

Decision:

- F5 must replace this with a central gateway using stored `whatsapp_connections`.
- The bridge can remain as dev/legacy fallback only.

## Environment Audit

Expected env names from `.env.example`:

- `PORT`
- `NODE_ENV`
- `TRUST_PROXY_HOPS`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `REFRESH_TOKEN_DAYS`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `API_PUBLIC_ORIGIN`
- `FRONTEND_ORIGIN`
- `FRONTEND_ORIGIN_PATTERNS`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_WEBHOOK_SECRET`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_WORKSPACE_ID`
- `INTERNAL_INTEGRATION_TOKEN`
- `WHATSAPP_SEND_URL`
- `WHATSAPP_SEND_TOKEN`
- `WHATSAPP_SEND_STRICT`
- `CF_TUNNEL_ORIGIN`

Additional keys seen in local `.env` key scan:

- `JWT_EXPIRES_IN`
- `WHATSAPP_Callback_URL`
- `WHATSAPP_APP_ID`
- `VITE_API_URL`
- `VITE_SOCKET_URL`

Do not expose `.env` values in reports or logs.

Required env cleanup:

- Add `ENCRYPTION_KEY` to `.env.example`; README references it but example omits it.
- Standardize JWT expiry naming.
- Standardize WhatsApp naming casing.
- Add future Meta Embedded Signup envs only when official implementation starts.

## Recommended Implementation Sequence After F0

### F1 - Data Foundation

1. Add Postgres migration for `whatsapp_connections`.
2. Add enums or check constraints for connection mode/status.
3. Backfill from existing `workspaces.whatsapp_*` columns if present.
4. Add indexes:
   - `(workspace_id)`
   - `(phone_number_id)`
   - `(waba_id)`
   - unique active phone connection where appropriate.
5. Add backend connection repository/service.
6. Update settings/profile DTOs to expose safe connection state, not secrets.

### F2 - Connection Lifecycle

1. Add connection state transition service.
2. Add authenticated endpoints:
   - `GET /api/v1/whatsapp/connection`
   - `POST /api/v1/whatsapp/connect`
   - `POST /api/v1/whatsapp/disconnect`
   - `POST /api/v1/whatsapp/reconnect`
   - `POST /api/v1/whatsapp/health-check`
3. Ensure all endpoints use `req.workspaceId`.
4. Ensure no token is returned to frontend.

### F3 - Embedded Signup

1. Verify current official Meta docs.
2. Add frontend connect button.
3. Add backend signup session/callback flow.
4. Discover WABA and phone assets.
5. Store encrypted credentials in `whatsapp_connections`.
6. Subscribe/check webhook and mark final state.

### F4 - Webhook Foundation

1. Add `whatsapp_webhook_events`.
2. Store safe event envelope and processing status.
3. Add idempotency constraints.
4. Resolve workspace by `phone_number_id`.
5. Apply statuses to messages.
6. Keep handler fast and retry-safe.

### F5 - Message Engine

1. Extend `messages` with provider fields and status.
2. Add central WhatsApp gateway service.
3. Route all outbound sends through gateway.
4. Persist provider response IDs.
5. Add failure handling and status updates.

### F6 - Inbox Sync

1. Update frontend message DTO to display provider status.
2. Add assignment/ownership when required.
3. Keep realtime updates workspace-scoped.
4. Add tests around send/receive/status flows.

### F7 - Compliance

1. Add opt-out model.
2. Add compliance service.
3. Enforce compliance before gateway send.
4. Add audit log table.
5. Add admin pause/kill switch foundation.

Only after F7 should F8-F14 work begin.

## Definition Of Done For F0

- Existing architecture identified.
- Existing WhatsApp-related paths identified.
- Current schema and migration risks identified.
- Existing functionality to preserve identified.
- Roadmap gaps mapped to repo realities.
- Next implementation sequence defined.

Status: Complete.

