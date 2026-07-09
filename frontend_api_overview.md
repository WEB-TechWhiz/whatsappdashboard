# WhatsApp Dashboard — Frontend & API Overview

This document provides a detailed overview of the frontend architecture for the WhatsApp Dashboard project, detailing current routes, UI components, mock data structures, and the required backend API endpoints for database/real-time integration.

---

## 1. Frontend Architecture & Routing

The frontend is built on **TanStack Start**, using modern file-based routing. All route routes are registered under [src/routes](file:///c:/Users/dell/OneDrive/Desktop/Clones%20Repo/whatsapp%20Automations/whatsappdashboard/src/routes/).

### Route Directory Structure

```
src/routes/
├── __root.tsx                    # Global root layout containing QueryClientProvider
├── index.tsx                     # Landing Page ("Flowly" brand)
├── dashboard.tsx                 # Dashboard Shell layout (Sidebar, Breadcrumbs, Headers)
├── dashboard.index.tsx           # /dashboard - Overview page
├── dashboard.conversations.tsx   # /dashboard/conversations - Chat interface
├── dashboard.leads.tsx           # /dashboard/leads - Pipeline table
├── dashboard.analytics.tsx       # /dashboard/analytics - Metrics and charts
└── dashboard.settings.tsx        # /dashboard/settings - Workspace config
```

### Key Shared UI Components

- **Sidebar ([AppSidebar.tsx](file:///c:/Users/dell/OneDrive/Desktop/Clones%20Repo/whatsapp%20Automations/whatsappdashboard/src/components/dashboard/AppSidebar.tsx)):** Provides navigation across all dashboard routes, listing counts of unread conversations.
- **Chat Bubbles ([MessageBubble.tsx](file:///c:/Users/dell/OneDrive/Desktop/Clones%20Repo/whatsapp%20Automations/whatsappdashboard/src/components/chat/MessageBubble.tsx)):** Renders formatted text messages, timestamps, and receipt statuses (read/unread checks).
- **Typing Indicator ([TypingIndicator.tsx](file:///c:/Users/dell/OneDrive/Desktop/Clones%20Repo/whatsapp%20Automations/whatsappdashboard/src/components/chat/TypingIndicator.tsx)):** Animation indicator mimicking actual WhatsApp typing feedback.

---

## 2. Detailed Page Breakdowns

### 📊 Overview Page (`/dashboard`)

Displays the most critical real-time alerts.

- **Key Metrics:** Leaks (unread messages > 5 mins), Today's cash/revenue, On deck followups.
- **Widgets:** Recent Activity feed (e.g. booked demo, request pricing), Pipeline health percentages (Response rate, Booking rate).

### 💬 Conversations Page (`/dashboard/conversations`)

A fully-featured chat interface split into two panes.

- **Contacts Sidebar:** Search input and list of active/past chats with unread counts and online presence indicator.
- **Chat Thread Window:** Renders message history bubbles, message inputs, smile/attachment buttons, and automated bot response simulations.

### 👥 Leads Page (`/dashboard/leads`)

A sortable, filterable table summarizing sales pipeline progress.

- **Grid Headers:** Name, Phone, Source (Instagram, Website, Facebook, Referral), Status (Hot, Warm, Cold, Booked), Last Message, Deal Value.
- **Controls:** Query searches and Status drop-down selectors.

### 📈 Analytics Page (`/dashboard/analytics`)

Visualizes productivity, conversion, and revenue tracking.

- **Cards:** Avg response time, Conversion rate, Total revenue.
- **Visuals:** Bar charts representing weekly bookings using Framer Motion animations.

---

## 3. Mock Data Structure (Current State)

Currently, the client side implements local React states (`useState`) loaded with mock arrays. To swap this with actual API calls, the backend should return data matching these types:

```typescript
// Contacts/Conversation Sidebar Item
type Conversation = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread?: number;
  online?: boolean;
};

// Message Log Inside Chat Threads
type Message = {
  text: string;
  isAgent: boolean;
  time: string;
  read?: boolean;
};

// Lead Pipeline Row
type Lead = {
  name: string;
  phone: string;
  source: string;
  status: "Hot" | "Warm" | "Cold" | "Booked";
  lastMessage: string;
  value: string;
};
```

---

## 4. Proposed REST API Endpoints

To transition the dashboard into a fully functional production application, the following backend endpoints are expected to be integrated using TanStack Query (`useQuery` / `useMutation`):

### 🔑 Authentication / Workspace

| Method | Endpoint                    | Description                   | Payload / Query       |
| :----- | :-------------------------- | :---------------------------- | :-------------------- |
| `POST` | `/api/v1/auth/login`        | Workspace admin login         | `{ email, password }` |
| `GET`  | `/api/v1/workspace/profile` | Fetch display info & settings | None                  |

### 💬 Conversations & Messaging

| Method | Endpoint                             | Description                            | Payload / Query         |
| :----- | :----------------------------------- | :------------------------------------- | :---------------------- |
| `GET`  | `/api/v1/conversations`              | Retrieve all active chat threads       | `?search=xyz`           |
| `GET`  | `/api/v1/conversations/:id/messages` | Retrieve message history for a contact | `?limit=50&offset=0`    |
| `POST` | `/api/v1/conversations/:id/messages` | Send a WhatsApp message to contact     | `{ text, mediaUrl? }`   |
| `POST` | `/api/v1/conversations/:id/typing`   | Broadcast typing status indicator      | `{ isTyping: boolean }` |

### 👥 Leads Management

| Method  | Endpoint            | Description                             | Payload / Query                          |
| :------ | :------------------ | :-------------------------------------- | :--------------------------------------- |
| `GET`   | `/api/v1/leads`     | Retrieve leads matching filter criteria | `?status=Hot&search=name`                |
| `POST`  | `/api/v1/leads`     | Create a new lead manually              | `{ name, phone, source, status, value }` |
| `PATCH` | `/api/v1/leads/:id` | Update lead pipeline status or value    | `{ status?: string, value?: number }`    |

### 📈 Analytics & Metrics

| Method | Endpoint                     | Description                                    | Payload / Query             |
| :----- | :--------------------------- | :--------------------------------------------- | :-------------------------- |
| `GET`  | `/api/v1/analytics/overview` | Dashboard summary cards (Leaks, Cash, On Deck) | `?range=today\|week\|month` |
| `GET`  | `/api/v1/analytics/bookings` | Retrieve bookings data for charting            | `?range=7days`              |
| `GET`  | `/api/v1/analytics/activity` | Activity logs list                             | `?limit=10`                 |

### ⚙️ Workspace Configuration

| Method | Endpoint                    | Description                                    | Payload / Query                                                       |
| :----- | :-------------------------- | :--------------------------------------------- | :-------------------------------------------------------------------- |
| `PUT`  | `/api/v1/settings/profile`  | Update profile settings                        | `{ name, email }`                                                     |
| `PUT`  | `/api/v1/settings/whatsapp` | Connect / update Business WhatsApp credentials | `{ phone, apiToken, webhookUrl }`                                     |
| `PUT`  | `/api/v1/settings/rules`    | Update CRM automation flags                    | `{ autoReply: boolean, notifyNewLeads: boolean, flagLeaks: boolean }` |
