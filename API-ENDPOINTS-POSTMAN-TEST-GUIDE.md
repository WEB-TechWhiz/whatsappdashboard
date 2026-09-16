# API Endpoint Verification & MVP Readiness Guide

This document explains every mounted backend API endpoint, why it exists, which frontend feature depends on it, what breaks if it is missing, and how to verify it in Postman.

Backend base URL:

```text
http://localhost:4000/api/v1
```

Frontend default API client:

```text
VITE_API_URL || http://localhost:4000/api/v1
```

## Postman Setup

Create a Postman environment with these variables:

| Variable | Example |
|---|---|
| `baseUrl` | `http://localhost:4000/api/v1` |
| `accessToken` | set after login/signup |
| `refreshToken` | set after login/signup |
| `workspaceId` | set after login/signup |
| `leadId` | set after creating/listing a lead |
| `conversationId` | set after listing conversations |
| `contactId` | set after listing conversations/messages with a contact |
| `notificationId` | set after listing notifications |
| `ruleId` | set after creating/listing an automation rule |
| `automationLeadId` | set after listing automation leads |
| `escalationId` | set after listing automation escalations |
| `internalToken` | same as backend `INTERNAL_INTEGRATION_TOKEN` |
| `webhookVerifyToken` | same as backend `WHATSAPP_VERIFY_TOKEN` |

For protected endpoints, add this header:

```text
Authorization: Bearer {{accessToken}}
```

For internal inbound integration endpoint, add:

```text
x-internal-token: {{internalToken}}
```

Recommended Postman test script for signup/login:

```js
const json = pm.response.json();
if (json.accessToken) pm.environment.set("accessToken", json.accessToken);
if (json.refreshToken) pm.environment.set("refreshToken", json.refreshToken);
if (json.workspace?.id) pm.environment.set("workspaceId", json.workspace.id);
```

## Complete Mounted Endpoint Inventory

Use this as the master checklist. `{{baseUrl}}` means `http://localhost:4000/api/v1`; `/health` is the only endpoint outside that prefix.

| Area | Method | Endpoint | Auth/Test Header | Notes |
|---|---:|---|---|---|
| Health | `GET` | `http://localhost:4000/health` | none | Server liveness check |
| Auth | `POST` | `/auth/signup` | none | Create workspace and tokens |
| Auth | `POST` | `/auth/login` | none | Create session tokens |
| Auth | `POST` | `/auth/refresh` | none | Rotate refresh token |
| Auth | `POST` | `/auth/logout` | none | Revoke refresh token |
| Auth | `GET` | `/auth/oauth/google/debug` | none | Debug OAuth config/redirect URI |
| Auth | `GET` | `/auth/oauth/google` | none | Start Google OAuth |
| Auth | `GET` | `/auth/oauth/google/callback` | none | Google redirects here |
| Workspace | `GET` | `/workspace/profile` | `Authorization` | Current workspace/account |
| Settings | `GET` | `/settings/workspace` | `Authorization` | Read onboarding/settings |
| Settings | `PUT` | `/settings/workspace` | `Authorization` | Update onboarding/settings |
| Settings | `PUT` | `/settings/profile` | `Authorization` | Update workspace name/email |
| Settings | `PUT` | `/settings/whatsapp` | `Authorization` | Manual WhatsApp settings compatibility alias |
| Settings | `PUT` | `/settings/rules` | `Authorization` | Workspace notification/rule toggles |
| WhatsApp | `GET` | `/whatsapp/connection` | `Authorization` | Current WhatsApp connection |
| WhatsApp | `GET` | `/whatsapp/embedded-signup/config` | `Authorization` | Public Embedded Signup config |
| WhatsApp | `POST` | `/whatsapp/embedded-signup/complete` | `Authorization` | Finish Embedded Signup token exchange |
| WhatsApp | `POST` | `/whatsapp/connect` | `Authorization` | Start connection flow placeholder |
| WhatsApp | `POST` | `/whatsapp/disconnect` | `Authorization` | Mark connection disconnected |
| WhatsApp | `POST` | `/whatsapp/reconnect` | `Authorization` | Move disconnected connection to connecting |
| WhatsApp | `POST` | `/whatsapp/health-check` | `Authorization` | Check configured Meta assets |
| WhatsApp | `POST` | `/whatsapp/discover-assets` | `Authorization` | Discover WABA/phone assets through Graph API |
| WhatsApp | `POST` | `/whatsapp/subscribe-webhook` | `Authorization` | Subscribe app to WABA webhooks |
| WhatsApp | `GET` | `/whatsapp/compliance/settings` | `Authorization` | Messaging pause/rate-limit settings |
| WhatsApp | `PUT` | `/whatsapp/compliance/settings` | `Authorization` | Update pause/rate-limit settings |
| WhatsApp | `PUT` | `/whatsapp/contacts/:id/preference` | `Authorization` | Opt contact in/out |
| WhatsApp | `GET` | `/whatsapp/usage` | `Authorization` | Usage records list |
| WhatsApp | `GET` | `/whatsapp/usage/summary` | `Authorization` | Usage totals by direction/category |
| WhatsApp | `PUT` | `/whatsapp/connection/manual` | `Authorization` | Save manual connection details |
| Leads | `GET` | `/leads` | `Authorization` | List CRM leads |
| Leads | `POST` | `/leads` | `Authorization` | Create CRM lead |
| Leads | `PATCH` | `/leads/:id` | `Authorization` | Update CRM lead status/value |
| Conversations | `GET` | `/conversations` | `Authorization` | List conversations |
| Conversations | `GET` | `/conversations/:id/messages` | `Authorization` | Paginated messages |
| Conversations | `POST` | `/conversations/:id/messages` | `Authorization` | Send outbound WhatsApp message |
| Conversations | `POST` | `/conversations/:id/typing` | `Authorization` | Broadcast typing state |
| Dashboard | `GET` | `/dashboard/overview` | `Authorization` | KPI/report overview |
| Analytics | `GET` | `/analytics/overview` | `Authorization` | Dashboard KPI cards |
| Analytics | `GET` | `/analytics/bookings` | `Authorization` | Booking chart data |
| Analytics | `GET` | `/analytics/activity` | `Authorization` | Activity feed |
| Analytics | `GET` | `/analytics/summary` | `Authorization` | Summary totals |
| Notifications | `GET` | `/notifications` | `Authorization` | Notification list |
| Notifications | `GET` | `/notifications/unread-count` | `Authorization` | Unread badge count |
| Notifications | `POST` | `/notifications/:id/read` | `Authorization` | Mark one notification read |
| Notifications | `POST` | `/notifications/read-all` | `Authorization` | Mark all notifications read |
| Internal Integration | `POST` | `/integrations/whatsapp/inbound` | `x-internal-token` | Internal inbound bridge |
| Meta Webhook | `GET` | `/webhooks/whatsapp` | verify token query | Meta verification challenge |
| Meta Webhook | `POST` | `/webhooks/whatsapp` | `x-hub-signature-256` | Signed Meta webhook receiver |
| Automation Webhook Alias | `GET` | `/automation/whatsapp` | verify token query | Same router mounted under automation |
| Automation Webhook Alias | `POST` | `/automation/whatsapp` | `x-hub-signature-256` | Same router mounted under automation |
| Automation Workflows | `GET` | `/automation/rules` | `Authorization` | List automation rules |
| Automation Workflows | `POST` | `/automation/rules` | `Authorization` | Create automation rule |
| Automation Workflows | `PUT` | `/automation/rules/:ruleId` | `Authorization` | Update automation rule |
| Automation Workflows | `DELETE` | `/automation/rules/:ruleId` | `Authorization` | Delete automation rule |
| Automation Workflows | `POST` | `/automation/analyze` | `Authorization` | AI intent/entity analysis |
| Automation Workflows | `POST` | `/automation/execute` | `Authorization` | Execute workflow for a message |
| Automation Workflows | `GET` | `/automation/executions` | `Authorization` | Workflow execution history |
| Automation Workflows | `GET` | `/automation/statistics` | `Authorization` | Workflow stats |
| Automation Workflows | `GET` | `/automation/analyses` | `Authorization` | Message analysis history |
| Automation Leads | `GET` | `/automation/leads` | `Authorization` | List AI-captured leads |
| Automation Leads | `GET` | `/automation/leads/:leadId` | `Authorization` | AI lead details |
| Automation Leads | `POST` | `/automation/leads/:leadId/response` | `Authorization` | Record qualification response |
| Automation Leads | `GET` | `/automation/leads/statistics/overview` | `Authorization` | AI lead statistics |
| Automation Escalations | `GET` | `/automation/escalations` | `Authorization` | List active escalations |
| Automation Escalations | `GET` | `/automation/escalations/:escalationId` | `Authorization` | Escalation details |
| Automation Escalations | `POST` | `/automation/escalations/:escalationId/reply` | `Authorization` | Send human reply |
| Automation Escalations | `POST` | `/automation/escalations/:escalationId/resolve` | `Authorization` | Resolve escalation |
| Automation Escalations | `GET` | `/automation/escalations/statistics/overview` | `Authorization` | Escalation stats |
| Automation Escalations | `GET` | `/automation/escalations/wait-time/estimate` | `Authorization` | Estimated wait time |

## MVP Readiness Summary

The core MVP API is real and connected for:

- Authentication and session refresh.
- Workspace profile and onboarding settings.
- Leads and lead status changes.
- Conversations and message storage.
- WhatsApp connection lifecycle, Embedded Signup, webhook ingestion, compliance controls, and usage reporting.
- Dashboard KPIs, charts, reports, analytics, and activity from real workspace data.
- Notifications.
- Internal inbound WhatsApp bridge.
- Mounted automation workflow, lead, escalation, and webhook routes.

Important benchmark notes:

- Dashboard fake/demo data has been removed from the main overview and reports route.
- Staff performance, service popularity, task counts, renewals, invoice aging, and product/service mix need real database tables before those widgets should be considered MVP-ready.
- `src/routes/automation/workflows.routes.js` is now mounted at `/api/v1/automation`.
- Mounted automation routes rely on `req.workspace.id`; current auth middleware sets both `req.workspaceId` and `req.workspace.id`, so they can authenticate, but some automation services use `src/database.js` and MySQL-style `?` SQL while the main app uses Postgres. Treat automation as integration-candidate, not fully benchmarked MVP, until runtime-tested against the actual configured DB.

## Health

### `GET /health`

Full URL:

```text
http://localhost:4000/health
```

Purpose: Confirms the Express server is running.

Frontend dependency: Not directly used by the dashboard UI.

If missing: Operators cannot quickly distinguish API-down from frontend/API-client issues.

Postman verification:

- Method: `GET`
- URL: `http://localhost:4000/health`
- Expected: `200 OK`

Example response:

```json
{ "status": "ok" }
```

## Authentication & Workspace Session

### `POST /auth/signup`

Purpose: Creates a workspace account and returns access/refresh tokens.

Frontend dependency: `src/routes/signup.tsx`.

If missing: New users cannot create a workspace; onboarding cannot start.

Body:

```json
{
  "name": "Test Workspace",
  "email": "owner@example.com",
  "password": "password123"
}
```

Expected:

- `201 Created`
- `accessToken`
- `refreshToken`
- `workspace`

Postman verification:

1. Send the request.
2. Save `accessToken`, `refreshToken`, and `workspace.id` into environment variables.
3. Use `GET /workspace/profile` with the token to confirm the account exists.

### `POST /auth/login`

Purpose: Authenticates an existing workspace.

Frontend dependency: `src/routes/login.tsx`.

If missing: Existing users cannot access the dashboard.

Body:

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

Expected: `200 OK` with session tokens.

Negative tests:

- Wrong password returns `401`.
- Password under 8 characters returns validation error.

### `POST /auth/refresh`

Purpose: Rotates refresh token and returns a new session when the access token expires.

Frontend dependency: `src/lib/api.ts`, automatic retry after `401`.

If missing: Users are logged out after access-token expiry; long dashboard sessions fail.

Body:

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

Expected: `200 OK` with new `accessToken` and `refreshToken`.

Postman verification:

1. Login.
2. Call refresh with `refreshToken`.
3. Replace saved tokens with the new response values.
4. Confirm old refresh token no longer works.

### `POST /auth/logout`

Purpose: Revokes refresh token.

Frontend dependency: `auth.logout()` from `src/lib/api.ts`, sidebar logout.

If missing: Refresh tokens remain active after logout.

Body:

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

Expected: `204 No Content`.

### `GET /auth/oauth/google/debug`

Purpose: Confirms the backend's Google OAuth origins, redirect URI, and client ID wiring before testing browser OAuth.

Frontend dependency: Debug/support endpoint for OAuth setup.

If missing: OAuth can still work, but diagnosing redirect URI mismatches is slower.

Expected:

```json
{
  "configured": true,
  "clientId": "google-client-id",
  "redirectUri": "http://localhost:4000/api/v1/auth/oauth/google/callback",
  "frontendOrigin": "http://localhost:5173",
  "warnings": []
}
```

### `GET /auth/oauth/google`

Purpose: Starts Google OAuth by returning a Google authorization URL.

Frontend dependency: `startGoogleOAuth()` in `src/lib/api.ts` if OAuth login is used.

If missing: Google login/signup cannot work.

Query:

```text
redirect=/dashboard
```

Expected:

```json
{ "url": "https://accounts.google.com/..." }
```

Requires backend env:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `FRONTEND_ORIGIN`
- `JWT_SECRET`

### `GET /auth/oauth/google/callback`

Purpose: Receives Google OAuth callback, creates/updates workspace, redirects to frontend login with tokens in URL fragment.

Frontend dependency: OAuth login flow.

If missing: OAuth redirect never completes.

Postman note: Usually tested through browser OAuth, not plain Postman, because Google requires a real code.

### `GET /workspace/profile`

Purpose: Returns authenticated workspace profile and WhatsApp/rules settings.

Frontend dependency: `src/routes/dashboard.settings.tsx`.

If missing: Settings page cannot load profile or current WhatsApp/rules values.

Headers:

```text
Authorization: Bearer {{accessToken}}
```

Expected fields:

- `id`
- `name`
- `email`
- `whatsapp_phone`
- `whatsapp_webhook_url`
- `auto_reply`
- `notify_new_leads`
- `flag_leaks`

## Workspace Settings & Onboarding
### `GET /settings/workspace`

Purpose: Loads onboarding state, business details, and selected dashboard feature flags.

Frontend dependency:

- `src/lib/business-config.ts`
- `OnboardingWizard`
- sidebar and dashboard module filtering

If missing: The app falls back to local defaults; onboarding and selected modules will not reliably sync across sessions/devices.

Expected: `200 OK`.

### `PUT /settings/workspace`

Purpose: Saves onboarding completion, business metadata, and enabled/disabled modules.

Frontend dependency:

- `OnboardingWizard`
- Settings page “Business modules”

If missing: Users cannot persist chosen dashboard modules; dashboard customization breaks.

Body example:

```json
{
  "businessName": "Test Workspace",
  "industry": "Agency",
  "teamSize": "1-5",
  "onboardingCompleted": true,
  "features": {
    "crm": true,
    "whatsapp": true,
    "analytics": true,
    "reports": true
  }
}
```

Expected: saved workspace settings.

### `PUT /settings/profile`

Purpose: Updates workspace display name and email.

Frontend dependency: Settings profile form.

If missing: User cannot update identity shown in the app.

Body:

```json
{
  "name": "New Workspace Name",
  "email": "new-owner@example.com"
}
```

Expected: updated `id`, `name`, `email`.

### `PUT /settings/whatsapp`

Purpose: Stores WhatsApp phone, API token, and webhook URL.

Frontend dependency: Settings WhatsApp integration form.

If missing: User cannot connect/update WhatsApp configuration from the dashboard.

Body:

```json
{
  "phone": "+15550000000",
  "apiToken": "sample-token-12345",
  "webhookUrl": "https://example.com/webhook"
}
```

Expected:

```json
{
  "phone": "+15550000000",
  "webhookUrl": "https://example.com/webhook",
  "connected": true
}
```

### `PUT /settings/rules`

Purpose: Updates workspace automation preferences.

Frontend dependency: Settings rules toggles.

If missing: Auto-reply, new-lead notifications, and leak flag preferences cannot be saved.

Body:

```json
{
  "autoReply": true,
  "notifyNewLeads": true,
  "flagLeaks": true
}
```

Expected: updated rule flags.

## WhatsApp Connection, Embedded Signup, Compliance & Usage

All endpoints in this section require:

```text
Authorization: Bearer {{accessToken}}
```

### `GET /whatsapp/connection`

Purpose: Returns the current WhatsApp connection state for the workspace.

Postman verification:

- Method: `GET`
- URL: `{{baseUrl}}/whatsapp/connection`
- Expected: `connected`, `status`, `webhookStatus`, `connectionMode`, and provider/account fields when configured.

Example response when nothing is configured:

```json
{
  "connected": false,
  "status": "PENDING",
  "webhookStatus": "PENDING",
  "connectionMode": "CLOUD_API_ONLY",
  "provider": "META"
}
```

### `GET /whatsapp/embedded-signup/config`

Purpose: Returns frontend-safe Meta Embedded Signup config.

Requires backend env for `enabled: true`:

- `META_APP_ID` or `WHATSAPP_APP_ID`
- `META_EMBEDDED_SIGNUP_CONFIG_ID`

Expected:

```json
{
  "appId": "1234567890",
  "configId": "9876543210",
  "graphApiVersion": "v23.0",
  "solutionId": null,
  "sessionInfoVersion": "3",
  "enabled": true
}
```

### `POST /whatsapp/embedded-signup/complete`

Purpose: Completes the official Meta Embedded Signup flow by exchanging the returned code for an access token and saving discovered business/phone identifiers.

Requires backend env:

- `META_APP_ID` or `WHATSAPP_APP_ID`
- `META_APP_SECRET` or `WHATSAPP_APP_SECRET`

Body:

```json
{
  "code": "meta-authorization-code",
  "wabaId": "123456789012345",
  "phoneNumberId": "987654321098765",
  "businessId": "112233445566778",
  "displayPhoneNumber": "+15550000000",
  "businessName": "Test Business",
  "event": "FINISH",
  "version": "3"
}
```

Expected: saved WhatsApp connection with status `ASSETS_DISCOVERED` or `AUTHENTICATED`.

### `POST /whatsapp/connect`

Purpose: Initializes a connection row and marks disconnected connections ready for reauthorization.

Body: none.

Expected:

- `202 Accepted`
- connection status `PENDING`, `RECONNECTING`, or existing state.

### `POST /whatsapp/disconnect`

Purpose: Marks the current WhatsApp connection as disconnected.

Body: none.

Expected: connection status `DISCONNECTED`.

### `POST /whatsapp/reconnect`

Purpose: Moves a disconnected or pending connection back toward a reconnect flow.

Body: none.

Expected:

- `202 Accepted`
- connection status `RECONNECTING` when credentials exist, otherwise `PENDING`.

### `POST /whatsapp/health-check`

Purpose: Checks whether local connection requirements are present: credentials, phone identity, webhook URL, and webhook subscription status.

Body: none.

Expected:

```json
{
  "connection": {
    "status": "AUTHENTICATED"
  },
  "checks": {
    "credentialStored": true,
    "phoneIdentityPresent": true,
    "webhookConfigured": true,
    "webhookSubscribed": false
  }
}
```

### `POST /whatsapp/discover-assets`

Purpose: Calls Meta Graph API to fetch WABA info and phone numbers, then stores the primary phone identity.

Preconditions:

- A saved connection has an encrypted access token.
- The saved connection has `wabaId`.

Body: none.

Expected: `connection`, `waba`, and `phoneNumbers`.

Common negative tests:

- Missing credentials returns `WHATSAPP_CREDENTIALS_MISSING`.
- Missing WABA ID returns `WABA_ID_MISSING`.
- Invalid/expired Meta token returns `META_GRAPH_REQUEST_FAILED`.

### `POST /whatsapp/subscribe-webhook`

Purpose: Calls Meta Graph API to subscribe the app to the saved WABA webhooks and updates local webhook status.

Preconditions:

- A saved connection has an encrypted access token.
- The saved connection has `wabaId`.

Body: none.

Expected: `connection.webhookStatus` becomes `SUBSCRIBED` and response includes Meta subscription data.

### `GET /whatsapp/compliance/settings`

Purpose: Reads workspace WhatsApp safety controls.

Expected:

```json
{
  "messagingPaused": false,
  "pauseReason": null,
  "dailyOutboundLimit": 1000,
  "perMinuteOutboundLimit": 60,
  "updatedAt": "2026-08-12T00:00:00.000Z"
}
```

### `PUT /whatsapp/compliance/settings`

Purpose: Updates outbound messaging pause and rate-limit controls.

Body:

```json
{
  "messagingPaused": false,
  "pauseReason": null,
  "dailyOutboundLimit": 1000,
  "perMinuteOutboundLimit": 60
}
```

Expected: updated compliance settings plus an audit-log entry.

Negative tests:

- `dailyOutboundLimit` must be a positive integer up to `100000`.
- `perMinuteOutboundLimit` must be a positive integer up to `10000`.

### `PUT /whatsapp/contacts/:id/preference`

Purpose: Opts a contact out of or back into outbound WhatsApp messages.

Body:

```json
{
  "optedOut": true,
  "reason": "Customer requested no more WhatsApp messages."
}
```

Expected:

```json
{
  "id": "preference-id",
  "contactId": "{{contactId}}",
  "phone": "15550123456",
  "optedOut": true,
  "optedOutAt": "2026-08-12T00:00:00.000Z",
  "optedInAt": null
}
```

Negative test: unknown contact ID returns `404 Not Found`.

### `GET /whatsapp/usage`

Purpose: Lists recorded WhatsApp message usage rows for the workspace.

Query examples:

```text
limit=100
billingStatus=UNRATED
```

Expected: array of usage records with `direction`, `category`, `quantity`, `provider`, `billable`, and `billingStatus`.

### `GET /whatsapp/usage/summary`

Purpose: Summarizes WhatsApp usage by direction, category, and billing status.

Query:

```text
days=30
```

Expected:

```json
{
  "days": 30,
  "rows": [
    {
      "direction": "OUTBOUND",
      "category": "UNKNOWN",
      "billing_status": "UNRATED",
      "messages": 3,
      "quantity": 3
    }
  ]
}
```

### `PUT /whatsapp/connection/manual`

Purpose: Saves manual Cloud API connection details. This is the preferred explicit WhatsApp endpoint; `PUT /settings/whatsapp` remains a compatibility alias.

Body:

```json
{
  "phone": "+15550000000",
  "apiToken": "sample-token-12345",
  "webhookUrl": "https://example.com/api/v1/webhooks/whatsapp"
}
```

Expected: saved connection DTO with `displayPhoneNumber`, `webhookUrl`, and `status` set to `AUTHENTICATED` when `apiToken` is supplied.

## Leads

### `GET /leads`

Purpose: Lists CRM leads from the authenticated workspace.

Frontend dependency: `src/routes/dashboard.leads.tsx`.

If missing: Leads table/page cannot render.

Query options:

```text
status=Hot
search=ali
```

Expected: array of leads.

### `POST /leads`

Purpose: Creates a lead/contact and writes activity/notification records.

Frontend dependency: Leads page create modal.

If missing: Users cannot create leads manually; dashboard activity and notifications lose this source.

Body:

```json
{
  "name": "Aisha Khan",
  "phone": "+15550123456",
  "source": "Website",
  "status": "Warm",
  "value": 250
}
```

Expected:

- `201 Created`
- lead object
- realtime event: `lead:created`

### `PATCH /leads/:id`

Purpose: Updates lead status/value. When status changes to `Booked`, creates a booking snapshot used by revenue and appointment charts.

Frontend dependency:

- Leads status/value updates.
- Dashboard revenue trend.
- Dashboard appointments chart.
- Reports and analytics bookings.

If missing: Lead pipeline cannot move; revenue/bookings charts do not get booking records.

Body:

```json
{
  "status": "Booked",
  "value": 500
}
```

Expected:

- updated lead
- realtime event: `lead:updated`
- if first move to `Booked`, row in `bookings`

Postman verification chain:

1. Create lead.
2. Save `id` as `leadId`.
3. Patch status to `Booked`.
4. Call `GET /dashboard/overview?range=week`.
5. Confirm revenue/appointment values increased.

## Conversations & Messages

### `GET /conversations`

Purpose: Lists conversation sidebar items from contacts and latest messages.

Frontend dependency: `src/routes/dashboard.conversations.tsx`.

If missing: WhatsApp conversations page cannot show contacts/threads.

Query:

```text
search=Aisha
```

Expected: array with `id`, `name`, `preview`, `time`, `unread`, `online`.

### `GET /conversations/:id/messages`

Purpose: Fetches messages for a conversation and marks inbound unread messages as read.

Frontend dependency: Conversation message pane.

If missing: User can see conversation list but cannot open/read thread history.

Query:

```text
limit=50&offset=0
```

Expected: array of messages.

### `POST /conversations/:id/messages`

Purpose: Stores an outbound agent message and optionally forwards it to configured WhatsApp sender.

Frontend dependency: Message composer.

If missing: Agents cannot reply from the dashboard.

Body:

```json
{
  "text": "Thanks for contacting us. How can I help?",
  "mediaUrl": "https://example.com/file.png"
}
```

Expected:

- `201 Created`
- message object
- realtime event: `message:new`

Env behavior:

- If `WHATSAPP_SEND_URL` is configured, backend attempts external delivery.
- If `WHATSAPP_SEND_STRICT=true`, external delivery failure can fail the API call.

### `POST /conversations/:id/typing`

Purpose: Broadcasts typing state over Socket.io; no DB write.

Frontend dependency: conversation typing indicator.

If missing: Typing indicator does not work; message storage still works.

Body:

```json
{
  "isTyping": true
}
```

Expected: `204 No Content`.

## Dashboard, Analytics & Reports

### `GET /dashboard/overview`

Purpose: Returns all real-time overview KPIs/charts for the main dashboard.

Frontend dependency: `src/routes/dashboard.index.tsx`.

If missing: dashboard overview cards, revenue graph, appointments graph, lead funnel, customer growth, activity feed, and pipeline health cannot render from real data.

Query:

```text
range=today
range=week
range=month
range=7d
range=30d
range=90d
```

Expected response sections:

- `kpis`
- `charts.revenueTrend`
- `charts.appointmentTrend`
- `charts.customerGrowth`
- `charts.leadFunnel`
- `activity`

Postman verification:

1. Create a lead.
2. Mark it `Booked`.
3. Send or ingest messages.
4. Call this endpoint.
5. Verify dashboard data changes without demo values.

### `GET /analytics/overview`

Purpose: Returns leak count, today’s cash, on-deck follow-ups, response rate, and booking rate.

Frontend dependency: `src/routes/dashboard.analytics.tsx`.

If missing: Analytics stat cards cannot load.

Query:

```text
range=today
range=week
range=month
```

Expected:

```json
{
  "leaks": 0,
  "todaysCash": "0.00",
  "onDeck": 0,
  "responseRate": 0,
  "bookingRate": 0
}
```

### `GET /analytics/bookings`

Purpose: Returns bookings/revenue time series.

Frontend dependency:

- Analytics bookings bar chart.
- Reports 30-day revenue summary.

If missing: bookings chart and report revenue cannot load.

Query:

```text
range=7days
range=30days
```

Expected: array of `{ date, revenue, bookings }`.

### `GET /analytics/activity`

Purpose: Returns recent workspace activity.

Frontend dependency: Reports recent activity.

If missing: Reports page cannot show event history.

Query:

```text
limit=20
```

Expected: activity array.

### `GET /analytics/summary`

Purpose: Returns summary report counts.

Frontend dependency: `src/routes/dashboard.reports.tsx`.

If missing: Reports page top cards cannot load.

Expected:

```json
{
  "weeklyBookings": 0,
  "monthlyBookings": 0,
  "annualBookings": 0,
  "hotLeads": 0
}
```

## Notifications

### `GET /notifications`

Purpose: Lists notification center items.

Frontend dependency: `NotificationsPopover`.

If missing: notification popover cannot show notification history.

Query:

```text
limit=25
unreadOnly=true
```

Expected: notification array.

### `GET /notifications/unread-count`

Purpose: Returns unread badge count.

Frontend dependency: notification bell badge.

If missing: user cannot see pending notification count.

Expected:

```json
{ "count": 0 }
```

### `POST /notifications/:id/read`

Purpose: Marks one notification as read.

Frontend dependency: clicking/reading a notification.

If missing: individual notifications stay unread forever.

Expected: `204 No Content`.

### `POST /notifications/read-all`

Purpose: Marks all notifications as read.

Frontend dependency: “mark all read” action.

If missing: users cannot clear notification backlog in bulk.

Expected: `204 No Content`.

## Internal WhatsApp Integration

### `POST /integrations/whatsapp/inbound`

Purpose: Internal bridge endpoint for another WhatsApp webhook service to insert inbound messages into this dashboard database.

Frontend dependency:

- Conversations list/message pane.
- Dashboard unread/leak metrics.
- Activity feed.
- Notifications.

If missing: external WhatsApp messages never reach dashboard UI.

Headers:

```text
x-internal-token: {{internalToken}}
```

Body:

```json
{
  "workspaceId": "{{workspaceId}}",
  "phone": "+15550123456",
  "name": "Aisha Khan",
  "text": "Hi, I want pricing.",
  "source": "Website"
}
```

Expected:

- `201 Created`
- created/updated contact
- created inbound message
- realtime events: `message:new`, `lead:updated`, `notification:new`

## Meta Webhook Endpoints

Mounted at:

```text
{{baseUrl}}/webhooks/whatsapp
```

and also currently under:

```text
{{baseUrl}}/automation/whatsapp
```

because `server.js` imports `automationRoutes` from `automation/webhooks.routes.js`.

### `GET /webhooks/whatsapp`

Purpose: Meta webhook verification challenge.

If missing: Meta cannot verify the webhook URL.

Query:

```text
hub.mode=subscribe
hub.verify_token={{webhookVerifyToken}}
hub.challenge=12345
```

Expected: raw challenge response, e.g. `12345`.

### `POST /webhooks/whatsapp`

Purpose: Receives signed Meta webhook payloads.

If missing: direct Meta webhook ingestion cannot work.

Required header:

```text
x-hub-signature-256: sha256=<hmac>
```

Important verification note:

- This route verifies `WHATSAPP_WEBHOOK_SECRET`.
- Postman testing requires generating the HMAC from the exact raw request body.
- The project also provides `/integrations/whatsapp/inbound`, which is easier to test for MVP dashboard ingestion.

## Automation Routes

These are mounted, but should be treated as advanced/secondary until runtime-tested with the actual automation schema and DB adapter.

### Mounted Automation Webhook Alias

Because of current `server.js` wiring:

```js
import automationRoutes from "./routes/automation/webhooks.routes.js";
app.use(`${API_PREFIX}/automation`, automationRoutes);
```

These endpoints exist:

- `GET /automation/whatsapp`
- `POST /automation/whatsapp`

They behave the same as `/webhooks/whatsapp`.

### Mounted Automation Leads

Base:

```text
{{baseUrl}}/automation/leads
```

Endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/automation/leads` | List AI-captured leads |
| `GET` | `/automation/leads/:leadId` | Lead detail/history |
| `POST` | `/automation/leads/:leadId/response` | Record lead qualification response |
| `GET` | `/automation/leads/statistics/overview` | AI lead statistics |

Postman body for response:

```json
{
  "response": "My budget is $500",
  "phone_number": "+15550123456",
  "analysis": {}
}
```

MVP caution: These routes call AI-agent workflow services and automation tables. Verify schema/migrations before relying on them in production.

### Mounted Automation Escalations

Base:

```text
{{baseUrl}}/automation/escalations
```

Endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/automation/escalations` | List active escalations |
| `GET` | `/automation/escalations/:escalationId` | Escalation detail |
| `POST` | `/automation/escalations/:escalationId/reply` | Agent reply to escalated conversation |
| `POST` | `/automation/escalations/:escalationId/resolve` | Resolve escalation |
| `GET` | `/automation/escalations/statistics/overview` | Escalation stats |
| `GET` | `/automation/escalations/wait-time/estimate` | Estimated wait time |

Body for reply:

```json
{
  "message": "A human agent is reviewing this now.",
  "phone_number": "+15550123456"
}
```

Body for resolve:

```json
{
  "resolution": "Answered customer pricing question."
}
```

### Mounted Automation Workflow Rules

Base:

```text
{{baseUrl}}/automation
```

Endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/automation/rules` | List automation rules |
| `POST` | `/automation/rules` | Create automation rule |
| `PUT` | `/automation/rules/:ruleId` | Update automation rule |
| `DELETE` | `/automation/rules/:ruleId` | Delete automation rule |
| `POST` | `/automation/analyze` | Analyze a message for intent/entities |
| `POST` | `/automation/execute` | Execute workflow for a message |
| `GET` | `/automation/executions` | Workflow execution history |
| `GET` | `/automation/statistics` | Workflow statistics |
| `GET` | `/automation/analyses` | Message analysis history |

Body for creating a rule:

```json
{
  "name": "Lead capture from pricing keywords",
  "description": "Qualify customers asking about price",
  "trigger_type": "keyword_match",
  "workflow_type": "lead_capture",
  "trigger_keywords": ["price", "pricing", "cost"],
  "workflow_config": {
    "qualificationQuestions": ["What budget range are you considering?"]
  }
}
```

Body for updating a rule:

```json
{
  "name": "Updated rule name",
  "description": "Updated description",
  "enabled": true,
  "workflow_config": {
    "qualificationQuestions": ["When do you want to start?"]
  }
}
```

Body for analyze:

```json
{
  "message": "Hi, I want pricing for a team of five.",
  "sender_name": "Aisha Khan",
  "phone_number": "+15550123456"
}
```

Body for execute:

```json
{
  "conversation_id": "{{conversationId}}",
  "message_id": "message-id-from-db",
  "phone_number": "+15550123456",
  "message": "Hi, I want pricing for a team of five.",
  "analysis": {}
}
```

Query examples:

```text
/automation/executions?limit=50&offset=0
/automation/statistics?days_back=30
/automation/analyses?limit=50&offset=0
```

MVP caution: These routes are mounted, but they use the automation DB/service layer. Runtime-test against the actual configured database before treating them as benchmark-ready.

## Realtime Socket Events

Socket URL:

```text
http://localhost:4000
```

Client auth:

```js
io(SOCKET_BASE_URL, { auth: { token: accessToken } })
```

Events used by frontend:

| Event | Emitted When | Used By |
|---|---|---|
| `message:new` | inbound/outbound message created | conversations, dashboard refresh |
| `typing` | typing endpoint called | conversation typing indicator |
| `lead:created` | lead created | leads page, dashboard refresh |
| `lead:updated` | lead updated or inbound message updates contact | leads page, dashboard refresh |
| `notification:new` | notification created | notification popover, dashboard refresh |

If socket is missing: REST pages still load, but UI will not update in real time without refresh/refetch.

## Suggested Postman Test Order

Use this sequence to verify MVP business flow end to end:

1. `POST /auth/signup`
2. `GET /workspace/profile`
3. `PUT /settings/workspace`
4. `GET /whatsapp/embedded-signup/config`
5. `PUT /whatsapp/connection/manual`
6. `GET /whatsapp/connection`
7. `POST /whatsapp/health-check`
8. `GET /whatsapp/compliance/settings`
9. `PUT /whatsapp/compliance/settings`
10. `POST /leads`
11. `GET /leads`
12. `PATCH /leads/:id` with `status = Booked`
13. `GET /dashboard/overview?range=week`
14. `GET /analytics/bookings?range=7days`
15. `GET /analytics/summary`
16. `POST /integrations/whatsapp/inbound`
17. `GET /conversations`
18. `GET /conversations/:id/messages`
19. `POST /conversations/:id/messages`
20. `PUT /whatsapp/contacts/:id/preference`
21. `GET /whatsapp/usage`
22. `GET /whatsapp/usage/summary?days=30`
23. `GET /notifications`
24. `GET /notifications/unread-count`
25. `POST /notifications/read-all`
26. `GET /webhooks/whatsapp?hub.mode=subscribe&hub.verify_token={{webhookVerifyToken}}&hub.challenge=12345`
27. `GET /automation/rules`
28. `POST /automation/analyze`
29. `POST /auth/refresh`
30. `POST /auth/logout`

## Benchmark Acceptance Checklist

Authentication:

- Signup creates a workspace.
- Login returns access and refresh tokens.
- Refresh rotates refresh token.
- Logout revokes refresh token.
- Protected endpoint without token returns `401`.

Workspace setup:

- Onboarding settings persist in `workspace_settings`.
- Feature choices affect sidebar/dashboard.

CRM:

- Leads are scoped to current workspace.
- Creating a lead creates activity and notification.
- Updating status to `Booked` creates a booking snapshot.

Messaging:

- Inbound integration creates/updates contact.
- Inbound integration creates unread inbound message.
- Fetching messages marks inbound messages read.
- Sending message writes agent message.
- Compliance pause and contact opt-out block outbound sends.
- WhatsApp usage records are created for inbound/outbound/status events where applicable.

WhatsApp connection:

- Manual connection saves encrypted credentials.
- Connection lifecycle endpoints return the correct status.
- Health check reports missing credentials, phone identity, webhook URL, and subscription status.
- Embedded Signup config reflects Meta env values.
- Discover-assets and subscribe-webhook work when real Meta credentials are present.

Dashboard:

- Overview values change after creating leads/bookings/messages.
- Empty charts show honest empty states, not demo data.
- Reports page uses analytics endpoints only.

Notifications:

- Notification count increases after lead/message events.
- Mark read and mark all read clear unread state.

Realtime:

- Connected dashboard receives `message:new`, `lead:created`, `lead:updated`, and `notification:new`.

Production readiness gaps to close before claiming full benchmark parity:

- Add real schemas/endpoints for tasks, invoices, payments, products, services, employees, and staff performance if those modules remain selectable.
- Runtime-test automation workflow routes against the actual automation schema and DB adapter.
- Runtime-test Meta webhook raw-body signature handling.
- Add automated API tests for the suggested Postman flow.
- Export a Postman collection after validating the above manually.
