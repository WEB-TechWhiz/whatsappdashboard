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
| `notificationId` | set after listing notifications |
| `internalToken` | same as backend `INTERNAL_INTEGRATION_TOKEN` |

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

## MVP Readiness Summary

The core MVP API is real and connected for:

- Authentication and session refresh.
- Workspace profile and onboarding settings.
- Leads and lead status changes.
- Conversations and message storage.
- Dashboard KPIs, charts, reports, analytics, and activity from real workspace data.
- Notifications.
- Internal inbound WhatsApp bridge.

Important benchmark notes:

- Dashboard fake/demo data has been removed from the main overview and reports route.
- Staff performance, service popularity, task counts, renewals, invoice aging, and product/service mix need real database tables before those widgets should be considered MVP-ready.
- `src/routes/automation/workflows.routes.js` exists but is not mounted in `server.js`; it is not currently reachable as written.
- Mounted automation lead/escalation routes rely on `req.workspace.id`; current auth middleware sets both `req.workspaceId` and `req.workspace.id`, so they can authenticate, but some automation services use `src/database.js` and MySQL-style `?` SQL while the main app uses Postgres. Treat automation as integration-candidate, not fully benchmarked MVP, until runtime-tested against the actual configured DB.

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
<!-- please check it twice -->
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
hub.verify_token={{WHATSAPP_VERIFY_TOKEN}}
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

### Not Currently Mounted: Automation Workflow Rules

File exists:

```text
src/routes/automation/workflows.routes.js
```

But it is not mounted by `server.js`. Therefore these documented routes are not currently reachable:

- `GET /automation/rules`
- `POST /automation/rules`
- `PUT /automation/rules/:ruleId`
- `DELETE /automation/rules/:ruleId`
- `POST /automation/analyze`
- `POST /automation/execute`
- `GET /automation/executions`
- `GET /automation/statistics`
- `GET /automation/analyses`

Recommendation: If these are part of your MVP, mount `workflows.routes.js` separately and runtime-test against the actual DB schema.

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
4. `POST /leads`
5. `GET /leads`
6. `PATCH /leads/:id` with `status = Booked`
7. `GET /dashboard/overview?range=week`
8. `GET /analytics/bookings?range=7days`
9. `GET /analytics/summary`
10. `POST /integrations/whatsapp/inbound`
11. `GET /conversations`
12. `GET /conversations/:id/messages`
13. `POST /conversations/:id/messages`
14. `GET /notifications`
15. `GET /notifications/unread-count`
16. `POST /notifications/read-all`
17. `POST /auth/refresh`
18. `POST /auth/logout`

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
- Mount and verify automation workflow routes or remove them from the MVP claim.
- Runtime-test Meta webhook raw-body signature handling.
- Add automated API tests for the suggested Postman flow.
- Export a Postman collection after validating the above manually.
