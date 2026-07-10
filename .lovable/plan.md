## Goal
Wire the leftover dashboard frontend (Overview KPIs, charts, activity feed, onboarding wizard, notifications center, settings module toggles) to the existing Express backend under `whatsapp-dashboard-backend/`, replacing localStorage + mock data with real, per-workspace persistence.

## Backend (whatsapp-dashboard-backend/)

### 1. Schema migration — `db/migrations/003_dashboard_platform.sql`
- `workspace_settings` — one row per workspace
  - `workspace_id UUID PK REFERENCES workspaces ON DELETE CASCADE`
  - `business_name TEXT`, `industry TEXT`, `team_size TEXT`
  - `features JSONB NOT NULL DEFAULT '{}'` — flat map of feature-flag booleans (leads, appointments, inventory, marketing, campaigns, payments, whatsapp, ai_center, analytics, workflows, services, employees, knowledge_base, …)
  - `onboarding_completed BOOLEAN DEFAULT false`, timestamps
- `notifications`
  - `id UUID PK`, `workspace_id UUID FK`, `type TEXT` (`lead`, `message`, `booking`, `system`, `payment`, `campaign`), `title TEXT`, `body TEXT`, `link TEXT NULL`, `read BOOLEAN DEFAULT false`, `created_at`
  - indexes: `(workspace_id, created_at DESC)`, partial on unread
- Additive KPI helpers: index on `messages(workspace_id, created_at)` for time-bucketing (if missing).

### 2. Services
- `services/settings.service.js` — `getSettings`, `upsertSettings`, `updateFeatures`, `completeOnboarding`. Auto-create row on first read.
- `services/notifications.service.js` — `list`, `unreadCount`, `markRead`, `markAllRead`, `create` (used internally by lead/message hooks).
- `services/dashboard.service.js` — aggregate KPIs & charts in one round-trip:
  - KPIs: total revenue (sum bookings.value in range), appointments count, new leads, hot leads, unread messages, leaks (>5 min), conversion rate, avg deal value, active conversations.
  - Charts: revenue trend (bookings grouped by day, last 30d), lead funnel (counts by status), appointment trend (bookings/day), service popularity (mock derived — flagged), customer growth (contacts created per day), top staff (placeholder until employees exist).
  - Activity feed: last 20 rows from `activity_log` joined with contact name.

### 3. Routes (mounted in `src/server.js`)
- `GET  /api/v1/dashboard/overview?range=7d|30d|90d` → `{ kpis, charts, activity }`
- `GET  /api/v1/settings/workspace` → settings row (auto-created)
- `PUT  /api/v1/settings/workspace` → update business info + features + onboarding flag
- `GET  /api/v1/notifications?limit&unreadOnly`
- `GET  /api/v1/notifications/unread-count`
- `POST /api/v1/notifications/:id/read`
- `POST /api/v1/notifications/read-all`
- Socket emit `notification:new` to workspace room when created.
- Zod schemas added to `validators/schemas.js`; all routes behind `requireAuth`.

### 4. Hooks into existing flows
- On lead created / status → 'Booked' / inbound message: also insert a notification + activity_log row (small additions in existing services).

## Frontend (src/)

### 1. `src/lib/business-config.ts`
- Replace localStorage store with a Zustand-style store hydrated from `GET /settings/workspace` on dashboard mount; `save()` calls `PUT /settings/workspace`. Keep same public API (`useBusinessConfig`, `isFeatureEnabled`) so existing components keep working. Fall back to localStorage cache for offline first paint.

### 2. `src/routes/dashboard.tsx`
- On mount, fetch settings via TanStack Query; open `OnboardingWizard` only when `!onboarding_completed`.

### 3. `src/routes/dashboard.index.tsx`
- Replace hardcoded KPI/chart arrays with `useQuery(['dashboard-overview', range], …)` calling `/dashboard/overview`. Skeleton loaders during fetch. Range selector wired to query key.

### 4. `src/components/dashboard/OnboardingWizard.tsx`
- Submit via settings PUT; close on success.

### 5. `src/routes/dashboard.settings.tsx`
- Bind module toggles + business info to server state; save button + toast.

### 6. Notifications
- New component `NotificationsPopover` in top navbar: bell with unread badge, list, mark-as-read, mark-all. Uses TanStack Query + socket `notification:new` to invalidate.

### 7. API client
- Add typed helpers in `src/lib/api.ts` (or new `src/lib/api/*.ts`): `dashboardApi.getOverview`, `settingsApi.get/put`, `notificationsApi.list/unread/markRead/markAllRead`.

## Verification
- `tsgo --noEmit` clean.
- Manually hit each new endpoint with `curl` against the running backend (auth token from login) — confirmed via `invoke-server-function` is not applicable (Express backend runs separately); use the sandbox `code--exec` with curl if backend is reachable, otherwise verify via UI in preview.
- Confirm: onboarding persists across reload; toggling a module in Settings hides sidebar/dashboard sections without wizard rerun; KPI cards render numbers from DB (seed a booking + lead if empty); notifications bell shows unread count and clears on click.

## Out of scope (called out, not built)
- Real Employees / Services / Inventory / Payments / Marketing modules — those pages remain placeholders. Feature flags exist so enabling them later just flips visibility.
- WhatsApp send-message backend integration (already exists via `conversations.routes.js`; not re-touched).

Reply "go" to implement, or tell me which parts to trim.