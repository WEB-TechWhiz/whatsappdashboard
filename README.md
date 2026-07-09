# WhatsApp CRM Dashboard

A standalone WhatsApp CRM dashboard built with TanStack Start, Vite, React, Tailwind CSS v4, Express, PostgreSQL, Redis, and Socket.IO.

The project is split into two main parts:

- Frontend: a TanStack Start React dashboard for login, signup, conversations, leads, analytics, and workspace settings.
- Backend: an Express API that handles authentication, workspace data, conversations, leads, analytics, WhatsApp integration events, and realtime updates.

## Tech Stack

Frontend:

- TanStack Start and TanStack Router
- React 19
- React Query
- Tailwind CSS v4
- shadcn-style UI components
- Socket.IO client
- Zod, React Hook Form, Sonner, Framer Motion, Recharts

Backend:

- Node.js and Express
- PostgreSQL with `pg`
- Redis with `ioredis`
- Socket.IO
- JWT access tokens and rotating refresh tokens
- Google OAuth 2.0 authorization-code login
- Bcrypt password hashing
- Zod request validation
- Helmet, CORS, rate limiting, Pino logging

## Project Structure

```text
whatsappdashboard/
├── README.md
├── AGENTS.md
├── package.json
├── package-lock.json
├── bun.lock
├── bunfig.toml
├── components.json
├── eslint.config.js
├── tsconfig.json
├── vite.config.ts
├── frontend_api_overview.md
├── public/
│   └── favicon.ico
├── src/
│   ├── start.ts
│   ├── server.ts
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   ├── styles.css
│   ├── lib/
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   ├── error-page.ts
│   │   └── error-capture.ts
│   ├── hooks/
│   │   └── use-mobile.tsx
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── dashboard.tsx
│   │   ├── dashboard.index.tsx
│   │   ├── dashboard.conversations.tsx
│   │   ├── dashboard.leads.tsx
│   │   ├── dashboard.analytics.tsx
│   │   └── dashboard.settings.tsx
│   └── components/
│       ├── dashboard/
│       │   └── AppSidebar.tsx
│       ├── chat/
│       │   ├── MessageBubble.tsx
│       │   └── TypingIndicator.tsx
│       └── ui/
│           └── Reusable UI primitives
└── whatsapp-dashboard-backend/
    ├── README.md
    ├── package.json
    ├── package-lock.json
    ├── test-db.js
    ├── prisma.config.ts
    ├── prisma/
    │   └── schema.prisma
    ├── db/
    │   ├── schema.sql
    │   └── auth_migration.sql
    └── src/
        ├── server.js
        ├── config/
        │   ├── db.js
        │   ├── logger.js
        │   └── redis.js
        ├── middleware/
        │   ├── auth.js
        │   ├── errorHandler.js
        │   └── validate.js
        ├── realtime/
        │   └── socket.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── conversations.routes.js
        │   ├── leads.routes.js
        │   ├── analytics.routes.js
        │   ├── settings.routes.js
        │   └── integrations.routes.js
        ├── services/
        │   ├── analytics.service.js
        │   ├── conversations.service.js
        │   └── leads.service.js
        ├── utils/
        │   ├── asyncHandler.js
        │   ├── crypto.js
        │   └── errors.js
        └── validators/
            └── schemas.js
```

## What Each Part Does

### Frontend

`src/routes/index.tsx`

- Public landing page.
- Sends users to login or signup.

`src/routes/login.tsx`

- Email/password login.
- Google OAuth 2.0 login.
- Reads OAuth callback tokens from the URL hash and stores the session.

`src/routes/signup.tsx`

- Creates a new workspace with name, email, and password.
- Supports Google OAuth signup through the same OAuth flow.

`src/routes/dashboard.tsx`

- Protected dashboard layout.
- Redirects unauthenticated users to `/login`.
- Renders sidebar, top bar, and nested dashboard pages.

`src/routes/dashboard.index.tsx`

- Main dashboard overview.
- Shows summary metrics, recent activity, and business health cards.

`src/routes/dashboard.conversations.tsx`

- Lists WhatsApp conversations.
- Loads messages for a selected contact.
- Sends outbound messages.
- Shows realtime message and typing updates.

`src/routes/dashboard.leads.tsx`

- Lists CRM leads.
- Creates leads.
- Updates lead status and value.

`src/routes/dashboard.analytics.tsx`

- Shows revenue, booking, activity, and performance analytics.

`src/routes/dashboard.settings.tsx`

- Updates workspace profile.
- Saves WhatsApp integration settings.
- Updates automation rules.

`src/lib/api.ts`

- Central API client.
- Stores access token, refresh token, and workspace profile in localStorage.
- Adds `Authorization: Bearer <token>` to API calls.
- Refreshes sessions automatically after a `401`.
- Handles logout and Socket.IO setup.

`src/components/dashboard/AppSidebar.tsx`

- Dashboard navigation.
- Loads workspace profile and unread conversation count.
- Handles logout.

### Backend

`whatsapp-dashboard-backend/src/server.js`

- Creates the Express app.
- Enables Helmet, CORS, JSON parsing, and request logging.
- Mounts all API route groups under `/api/v1`.
- Starts HTTP and Socket.IO servers.
- Exposes `/health`.

`src/config/db.js`

- Creates the PostgreSQL connection pool.

`src/config/redis.js`

- Creates the Redis client used by realtime/integration infrastructure.

`src/config/logger.js`

- Configures Pino logging.

`src/middleware/auth.js`

- Verifies JWT access tokens.
- Places the verified `workspaceId` on `req.workspaceId`.
- All protected routes use this instead of trusting request body/query workspace IDs.

`src/middleware/validate.js`

- Validates request bodies using Zod schemas.
- Replaces `req.body` with parsed and normalized data.

`src/middleware/errorHandler.js`

- Converts app errors into JSON API responses.
- Hides unexpected server error details from clients.

`src/routes/auth.routes.js`

- Signup, login, refresh, logout, Google OAuth 2.0, and workspace profile.

`src/routes/conversations.routes.js`

- Conversation list.
- Conversation messages.
- Send message.
- Typing broadcast.

`src/routes/leads.routes.js`

- Lead list.
- Lead creation.
- Lead status/value updates.

`src/routes/analytics.routes.js`

- Dashboard overview metrics.
- Booking chart data.
- Activity feed.
- Summary stats.

`src/routes/settings.routes.js`

- Workspace profile updates.
- WhatsApp connection settings.
- Automation rules.

`src/routes/integrations.routes.js`

- Internal inbound WhatsApp bridge endpoint.
- This lets an external WhatsApp webhook service push inbound messages into the dashboard database and realtime layer.

`src/services/conversations.service.js`

- Reads conversations and messages.
- Marks inbound messages as read when a conversation is opened.
- Stores outbound agent messages.
- Stores inbound customer messages.
- Optionally forwards outbound messages to another WhatsApp sending service.

`src/services/leads.service.js`

- Lists contacts as leads.
- Creates contacts/leads.
- Updates lead status and deal value.
- Creates booking snapshots when a lead becomes `Booked`.

`src/services/analytics.service.js`

- Computes leaks, cash, on-deck count, response rate, booking rate, booking chart, activity feed, and summary stats.

`src/realtime/socket.js`

- Authenticates Socket.IO clients with JWT.
- Joins clients to workspace-specific rooms.
- Emits workspace events such as new messages, typing, and lead updates.

`db/schema.sql`

- Main PostgreSQL schema for a fresh database.
- Defines workspaces, refresh tokens, contacts, messages, activity log, and bookings.

`db/auth_migration.sql`

- Upgrade script for existing databases.
- Adds auth provider fields and refresh token storage.

`prisma/schema.prisma`

- Minimal Prisma datasource/client configuration.
- The current backend code uses `pg` directly, not Prisma models.

`test-db.js`

- Simple PostgreSQL connection test script.

## Database Tables

`workspaces`

- Tenant and auth table.
- Stores workspace name, email, password hash, OAuth identity, WhatsApp settings, and automation preferences.

`refresh_tokens`

- Stores hashed refresh tokens.
- Tokens are rotated during refresh and revoked on logout.

`contacts`

- Stores leads and conversation contacts.
- Includes phone, source, status, deal value, online state, and follow-up time.

`messages`

- Stores inbound customer messages and outbound agent messages.

`activity_log`

- Stores timeline events such as lead creation, status changes, bookings, and inbound messages.

`bookings`

- Stores booking snapshots used for revenue and booking analytics.

## Environment Variables

Backend `.env` file:

```env
PORT=4000
NODE_ENV=development

DATABASE_URL=postgres://user:password@localhost:5432/whatsapp_dashboard
REDIS_URL=redis://localhost:6379

JWT_SECRET=replace-with-a-long-random-string
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_DAYS=30

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/api/v1/auth/oauth/google/callback

FRONTEND_ORIGIN=http://localhost:3000

WHATSAPP_WEBHOOK_VERIFY_TOKEN=replace-me
INTERNAL_INTEGRATION_TOKEN=replace-with-a-long-random-string

WHATSAPP_SEND_URL=http://localhost:5000/internal/whatsapp/send
WHATSAPP_SEND_TOKEN=replace-with-your-automation-service-token
WHATSAPP_SEND_STRICT=false

ENCRYPTION_KEY=replace-with-32-byte-hex-key
```

Frontend environment variables:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

## Setup

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
cd whatsapp-dashboard-backend
npm install
```

### 3. Configure Backend Environment

```bash
cd whatsapp-dashboard-backend
cp .env.example .env
```

Fill in `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, and any OAuth or WhatsApp integration values you want to use.

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Create Database Tables

For a fresh database:

```bash
cd whatsapp-dashboard-backend
psql $DATABASE_URL -f db/schema.sql
```

For an existing database:

```bash
cd whatsapp-dashboard-backend
psql $DATABASE_URL -f db/auth_migration.sql
```

### 5. Test Database Connection

```bash
cd whatsapp-dashboard-backend
node test-db.js
```

### 6. Run Backend

```bash
cd whatsapp-dashboard-backend
npm run dev
```

Backend runs at:

```text
http://localhost:4000
```

### 7. Run Frontend

In a second terminal:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

## Authentication Flow

Email/password signup:

1. Frontend sends `name`, `email`, and `password` to `POST /api/v1/auth/signup`.
2. Backend hashes the password with bcrypt.
3. Backend creates the workspace.
4. Backend returns an access token, refresh token, and workspace profile.

Email/password login:

1. Frontend sends `email` and `password` to `POST /api/v1/auth/login`.
2. Backend verifies the bcrypt password hash.
3. Backend returns an access token, refresh token, and workspace profile.

Google OAuth 2.0:

1. Frontend requests `GET /api/v1/auth/oauth/google`.
2. Backend returns a Google authorization URL.
3. User signs in with Google.
4. Google redirects to `GET /api/v1/auth/oauth/google/callback`.
5. Backend exchanges the code for Google tokens and reads the Google profile.
6. Backend creates or updates a workspace.
7. Backend redirects back to `/login#accessToken=...&refreshToken=...`.
8. Frontend stores the session and navigates to the dashboard.

Refresh:

1. Frontend retries expired sessions with `POST /api/v1/auth/refresh`.
2. Backend checks the hashed refresh token.
3. Backend revokes the old refresh token.
4. Backend returns a new access token and refresh token.

Logout:

1. Frontend calls `POST /api/v1/auth/logout`.
2. Backend revokes the refresh token.
3. Frontend clears local session data.

## API Base URL

All backend API routes are mounted under:

```text
/api/v1
```

Protected routes require:

```http
Authorization: Bearer <accessToken>
```

Most errors use this shape:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

Validation errors also include `details`.

## API Endpoints

### Health

| Method | Endpoint  | Auth | Purpose                            |
| ------ | --------- | ---: | ---------------------------------- |
| GET    | `/health` |   No | Checks whether backend is running. |

Response:

```json
{
  "status": "ok"
}
```

### Auth and Workspace

| Method | Endpoint                             | Auth | Purpose                                         |
| ------ | ------------------------------------ | ---: | ----------------------------------------------- |
| POST   | `/api/v1/auth/signup`                |   No | Create a new workspace with email/password.     |
| POST   | `/api/v1/auth/login`                 |   No | Login with email/password.                      |
| POST   | `/api/v1/auth/refresh`               |   No | Rotate refresh token and get a new session.     |
| POST   | `/api/v1/auth/logout`                |   No | Revoke refresh token.                           |
| GET    | `/api/v1/auth/oauth/google`          |   No | Get Google OAuth authorization URL.             |
| GET    | `/api/v1/auth/oauth/google/callback` |   No | Google OAuth callback endpoint.                 |
| GET    | `/api/v1/workspace/profile`          |  Yes | Get the current workspace profile and settings. |

`POST /api/v1/auth/signup`

Request:

```json
{
  "name": "Acme Sales",
  "email": "owner@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "token": "jwt-access-token",
  "workspace": {
    "id": "workspace-uuid",
    "name": "Acme Sales",
    "email": "owner@example.com",
    "avatarUrl": null,
    "authProvider": "password"
  }
}
```

`POST /api/v1/auth/login`

Request:

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

Response is the same session shape as signup.

`POST /api/v1/auth/refresh`

Request:

```json
{
  "refreshToken": "refresh-token"
}
```

Response is a new session object with a new access token and refresh token.

`POST /api/v1/auth/logout`

Request:

```json
{
  "refreshToken": "refresh-token"
}
```

Response:

```text
204 No Content
```

`GET /api/v1/auth/oauth/google?redirect=/dashboard`

Response:

```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

`GET /api/v1/workspace/profile`

Response:

```json
{
  "id": "workspace-uuid",
  "name": "Acme Sales",
  "email": "owner@example.com",
  "avatar_url": null,
  "auth_provider": "password",
  "whatsapp_phone": "+15550000000",
  "whatsapp_webhook_url": "https://example.com/webhook",
  "auto_reply": false,
  "notify_new_leads": true,
  "flag_leaks": true,
  "created_at": "2026-07-06T10:00:00.000Z"
}
```

### Conversations

| Method | Endpoint                             | Auth | Purpose                                                           |
| ------ | ------------------------------------ | ---: | ----------------------------------------------------------------- |
| GET    | `/api/v1/conversations`              |  Yes | List conversations for the workspace.                             |
| GET    | `/api/v1/conversations/:id/messages` |  Yes | Get messages for one conversation and mark inbound messages read. |
| POST   | `/api/v1/conversations/:id/messages` |  Yes | Send an agent message.                                            |
| POST   | `/api/v1/conversations/:id/typing`   |  Yes | Broadcast typing state over Socket.IO.                            |

`GET /api/v1/conversations`

Query params:

- `search` optional. Searches contact name or phone.

Response:

```json
[
  {
    "id": "contact-uuid",
    "name": "Priya Sharma",
    "preview": "Can you send pricing?",
    "time": "2026-07-06T10:00:00.000Z",
    "unread": 2,
    "online": false
  }
]
```

`GET /api/v1/conversations/:id/messages?limit=50&offset=0`

Query params:

- `limit` optional, default `50`, max `200`.
- `offset` optional, default `0`.

Response:

```json
[
  {
    "id": "message-uuid",
    "text": "Hello",
    "isAgent": false,
    "time": "2026-07-06T10:00:00.000Z",
    "read": true,
    "mediaUrl": "https://example.com/file.jpg"
  }
]
```

`POST /api/v1/conversations/:id/messages`

Request:

```json
{
  "text": "Thanks for reaching out.",
  "mediaUrl": "https://example.com/file.jpg"
}
```

`mediaUrl` is optional.

Response:

```json
{
  "id": "message-uuid",
  "text": "Thanks for reaching out.",
  "isAgent": true,
  "time": "2026-07-06T10:00:00.000Z",
  "read": true,
  "mediaUrl": "https://example.com/file.jpg"
}
```

`POST /api/v1/conversations/:id/typing`

Request:

```json
{
  "isTyping": true
}
```

Response:

```text
204 No Content
```

### Leads

| Method | Endpoint            | Auth | Purpose                          |
| ------ | ------------------- | ---: | -------------------------------- |
| GET    | `/api/v1/leads`     |  Yes | List leads.                      |
| POST   | `/api/v1/leads`     |  Yes | Create a lead.                   |
| PATCH  | `/api/v1/leads/:id` |  Yes | Update lead status and/or value. |

`GET /api/v1/leads`

Query params:

- `status` optional: `Hot`, `Warm`, `Cold`, `Booked`.
- `search` optional. Searches lead name.

Response:

```json
[
  {
    "id": "contact-uuid",
    "name": "Priya Sharma",
    "phone": "+919999999999",
    "source": "Instagram",
    "status": "Hot",
    "lastMessage": "Can you send pricing?",
    "value": "25000.00"
  }
]
```

`POST /api/v1/leads`

Request:

```json
{
  "name": "Priya Sharma",
  "phone": "+919999999999",
  "source": "Instagram",
  "status": "Warm",
  "value": 25000
}
```

Response:

```json
{
  "id": "contact-uuid",
  "name": "Priya Sharma",
  "phone": "+919999999999",
  "source": "Instagram",
  "status": "Warm",
  "lastMessage": "",
  "value": "25000.00"
}
```

`PATCH /api/v1/leads/:id`

Request:

```json
{
  "status": "Booked",
  "value": 30000
}
```

Notes:

- At least one of `status` or `value` is required.
- When status changes to `Booked`, the backend creates a row in `bookings`.

Response:

```json
{
  "id": "contact-uuid",
  "name": "Priya Sharma",
  "phone": "+919999999999",
  "source": "Instagram",
  "status": "Booked",
  "lastMessage": "Can you send pricing?",
  "value": "30000.00"
}
```

### Analytics

| Method | Endpoint                     | Auth | Purpose                         |
| ------ | ---------------------------- | ---: | ------------------------------- |
| GET    | `/api/v1/analytics/overview` |  Yes | Get dashboard overview metrics. |
| GET    | `/api/v1/analytics/bookings` |  Yes | Get booking chart data.         |
| GET    | `/api/v1/analytics/activity` |  Yes | Get recent activity feed.       |
| GET    | `/api/v1/analytics/summary`  |  Yes | Get summary counters.           |

`GET /api/v1/analytics/overview?range=today`

Query params:

- `range`: `today`, `week`, or `month`. Defaults to `today`.

Response:

```json
{
  "leaks": 3,
  "todaysCash": "50000.00",
  "onDeck": 4,
  "responseRate": 92.5,
  "bookingRate": 18.2
}
```

`GET /api/v1/analytics/bookings?range=7days`

Query params:

- `range`: `7days` or `30days`. Defaults to `7days`.

Response:

```json
[
  {
    "date": "2026-07-06T00:00:00.000Z",
    "revenue": "50000.00",
    "bookings": 2
  }
]
```

`GET /api/v1/analytics/activity?limit=10`

Query params:

- `limit` optional, default `10`, max `50`.

Response:

```json
[
  {
    "id": "activity-uuid",
    "type": "lead_created",
    "description": "New lead: Priya Sharma",
    "contactName": "Priya Sharma",
    "time": "2026-07-06T10:00:00.000Z"
  }
]
```

`GET /api/v1/analytics/summary`

Response:

```json
{
  "weeklyBookings": 5,
  "monthlyBookings": 20,
  "annualBookings": 180,
  "hotLeads": 12
}
```

### Settings

| Method | Endpoint                    | Auth | Purpose                                            |
| ------ | --------------------------- | ---: | -------------------------------------------------- |
| PUT    | `/api/v1/settings/profile`  |  Yes | Update workspace name and email.                   |
| PUT    | `/api/v1/settings/whatsapp` |  Yes | Update WhatsApp phone, API token, and webhook URL. |
| PUT    | `/api/v1/settings/rules`    |  Yes | Update automation preferences.                     |

`PUT /api/v1/settings/profile`

Request:

```json
{
  "name": "Acme Sales",
  "email": "owner@example.com"
}
```

Response:

```json
{
  "id": "workspace-uuid",
  "name": "Acme Sales",
  "email": "owner@example.com"
}
```

`PUT /api/v1/settings/whatsapp`

Request:

```json
{
  "phone": "+15550000000",
  "apiToken": "whatsapp-api-token",
  "webhookUrl": "https://example.com/webhook"
}
```

Notes:

- `apiToken` is optional.
- If provided, it is encrypted before storage.

Response:

```json
{
  "phone": "+15550000000",
  "webhookUrl": "https://example.com/webhook",
  "connected": true
}
```

`PUT /api/v1/settings/rules`

Request:

```json
{
  "autoReply": true,
  "notifyNewLeads": true,
  "flagLeaks": true
}
```

Response:

```json
{
  "auto_reply": true,
  "notify_new_leads": true,
  "flag_leaks": true
}
```

### Integrations

| Method | Endpoint                                |           Auth | Purpose                                                 |
| ------ | --------------------------------------- | -------------: | ------------------------------------------------------- |
| POST   | `/api/v1/integrations/whatsapp/inbound` | Internal token | Receive inbound WhatsApp messages from another service. |

This route is not for normal browser users. It is for your WhatsApp webhook or automation service.

Required header:

```http
x-internal-token: <INTERNAL_INTEGRATION_TOKEN>
```

Request:

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

Response:

```json
{
  "contact": {
    "id": "contact-uuid",
    "name": "Priya Sharma",
    "preview": "I want pricing",
    "time": "2026-07-06T10:00:00.000Z",
    "unread": 1,
    "online": false
  },
  "message": {
    "id": "message-uuid",
    "text": "I want pricing",
    "isAgent": false,
    "time": "2026-07-06T10:00:00.000Z",
    "read": false,
    "mediaUrl": "https://example.com/file.jpg"
  }
}
```

## Realtime Socket.IO Events

Frontend connects with:

```ts
io("http://localhost:4000", {
  auth: {
    token: accessToken,
  },
});
```

Server emits:

| Event          | Payload                   | Purpose                                       |
| -------------- | ------------------------- | --------------------------------------------- |
| `message:new`  | `{ contactId, message }`  | A new inbound or outbound message was stored. |
| `typing`       | `{ contactId, isTyping }` | A user is typing in a conversation.           |
| `lead:created` | `lead`                    | A new lead was created.                       |
| `lead:updated` | `lead`                    | A lead was updated.                           |

## WhatsApp Integration Flow

This backend is the dashboard API, not the public Meta webhook receiver.

Expected production flow:

1. Customer sends a WhatsApp message.
2. Your WhatsApp automation/webhook service receives it from Meta or your BSP.
3. That service calls `POST /api/v1/integrations/whatsapp/inbound`.
4. Dashboard backend stores or updates the contact.
5. Dashboard backend stores the inbound message.
6. Dashboard backend emits `message:new` and `lead:updated` over Socket.IO.
7. Frontend updates conversations in realtime.

Outbound flow:

1. Agent sends a message from the dashboard.
2. Frontend calls `POST /api/v1/conversations/:id/messages`.
3. Backend stores the message.
4. Backend emits `message:new`.
5. If `WHATSAPP_SEND_URL` is configured, backend forwards the message to your WhatsApp sending service.
6. If `WHATSAPP_SEND_STRICT=true`, outbound delivery failure causes the API request to fail.

## Security Notes

- Passwords are hashed with bcrypt.
- Access tokens are JWTs.
- Refresh tokens are randomly generated, hashed in the database, rotated on refresh, and revoked on logout.
- Google OAuth uses the authorization-code flow.
- Protected API data is scoped by `workspaceId` from the verified JWT.
- Request bodies are validated with Zod.
- Login, signup, and OAuth endpoints are rate limited.
- WhatsApp API tokens are encrypted at rest.
- Internal integration endpoint requires `x-internal-token`.

## Common Commands

Frontend:

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```

Backend:

```bash
cd whatsapp-dashboard-backend
npm run dev
npm start
npm run migrate
node test-db.js
```

## Current Limitations

- Media upload is not built yet. The API expects `mediaUrl` to already point to a hosted file.
- The Prisma schema is currently only datasource/client configuration; the backend uses raw SQL through `pg`.
- Inbound WhatsApp delivery depends on an external webhook or automation service calling the internal integration endpoint.
- Outbound WhatsApp sending depends on `WHATSAPP_SEND_URL` and the external sending service.
