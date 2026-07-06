# WhatsApp Automation Platform — Implementation Plan

**Date**: July 6, 2026  
**Status**: Strategic Planning Document  
**Target**: Next.js 15 Monorepo + Microservices Architecture

---

## Executive Overview

### Current State Analysis
- **Frontend**: TanStack Start + React 19, built on Vite
- **Backend**: Single Express.js monolith with PostgreSQL, Redis, Socket.IO
- **Architecture**: Monolithic, tightly coupled frontend/backend
- **Scale**: 11 active clients → targeting 1000+ clients

### Target State
- **Frontend**: Next.js 15 (App Router) monorepo with shadcn/ui
- **Backend**: 6 independent microservices (Auth, WhatsApp, Booking, Leads, Analytics, Notifications)
- **Architecture**: Microservices with API Gateway, event-driven communication
- **Scale**: Multi-tenant isolation, 99.9% uptime SLA, 7-day trial conversion

### Strategic Benefits
| Aspect | Current | Target | Impact |
|--------|---------|--------|--------|
| Deploy Cycle | Full rebuild | Service-specific | Faster iterations |
| Scalability | Monolithic limits | Independent services | Handle 10x growth |
| Reliability | Single point of failure | Isolated failures | Higher uptime |
| Tech Stack | Express-only | Best-fit per service | Optimal performance |
| Team Scaling | Tightly coupled | Bounded contexts | Easier team growth |

---

## Non-Negotiable Requirements (CRITICAL)

These must be in place before public launch:

### 🔴 CRITICAL (Blocking)
1. **One-Click WhatsApp Connect**
   - Meta API Embedded Signup flow
   - Automatic webhook subscription
   - Encrypted token storage
   - Success metrics: < 2 minutes to connect

2. **Real-Time Message Delivery**
   - WebSocket via Socket.IO
   - < 500ms latency for message updates
   - Typing indicators + delivery/read receipts
   - Handles 100+ concurrent connections per workspace

3. **Booking Integration**
   - Calendar sync capability
   - Automatic reminder scheduling
   - Lead-to-booking conversion tracking
   - Revenue attribution per booking

4. **Multi-Tenant Isolation**
   - workspace_id in every query
   - Row-level security policies
   - No cross-tenant data leaks
   - Encryption for sensitive data (tokens, passwords)

### 🟡 HIGH (Pre-Launch)
5. **7-Day Trial System**
   - Auto-created on signup
   - Trial countdown widget
   - Upgrade prompts at day 5
   - Conversion tracking

6. **Audit Logs**
   - All auth events logged (LOGIN, SIGNUP, PASSWORD_CHANGE, etc.)
   - IP address + User-Agent capture
   - JSONB metadata for details
   - Searchable query interface

7. **99.9% Uptime SLA**
   - Health checks on all services
   - Auto-scaling policies
   - Graceful degradation
   - Monitoring & alerting (DataDog/New Relic)

---

## Architecture Design

### High-Level Service Map

```
┌─────────────────────────────────────┐
│   Client Tier: Next.js 15 Dashboard │
│   • App Router (Server Components)  │
│   • shadcn/ui + TailwindCSS v4      │
│   • TanStack Query for data fetch   │
│   • Socket.IO for real-time         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   API Gateway (Next.js Routes)      │
│   • JWT authentication              │
│   • Rate limiting                   │
│   • Request routing                 │
│   • Redis caching                   │
└──────────────┬──────────────────────┘
               │
      ┌────────┼────────┬─────────┬──────────┐
      ▼        ▼        ▼         ▼          ▼
┌──────────┐ ┌──────┐ ┌───────┐ ┌──────┐ ┌──────────┐
│Auth Svc  │ │WA Svc│ │Booking│ │Leads │ │Analytics │
│Port 3001 │ │Port  │ │Svc    │ │Svc   │ │Svc       │
│          │ │3002  │ │Port   │ │Port  │ │Port 3005 │
│          │ │      │ │3003   │ │3004  │ │          │
└──────────┘ └──────┘ └───────┘ └──────┘ └──────────┘
      │        │        │         │          │
      └────────┴────────┴─────────┴──────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │  Data Layer                  │
    │  • PostgreSQL (Primary)      │
    │  • Redis (Cache/Queue)       │
    │  • Cloudflare R2 (Media)     │
    │  • RabbitMQ (Event Bus)      │
    └──────────────────────────────┘
```

### Service Breakdown & Responsibilities

#### Service 1: Auth Service (Port 3001)
**Purpose**: Tenant isolation, JWT token management, OAuth

**Responsibilities**:
- User signup/login with email/password
- Google OAuth 2.0 flow
- Password reset flow
- JWT + rotating refresh tokens
- Trial period management (7-day auto-assignment)
- Rate limiting (5 attempts per minute per IP)

**Tech Stack**:
- Node.js 22 + Express
- bcrypt (cost factor: 12)
- JWT with 15m access token, 30-day refresh token
- PostgreSQL for workspaces, refresh_tokens, audit_logs

**Key Tables**:
```sql
-- workspaces (Tenant/Core entity)
-- refresh_tokens (Session management)
-- audit_logs (Compliance)
```

**Critical APIs**:
- `POST /api/auth/signup` — Create workspace + trial
- `POST /api/auth/login` — Email/password login
- `POST /api/auth/refresh` — Rotate tokens
- `POST /api/auth/logout` — Revoke session
- `GET /api/auth/oauth/google` — Start OAuth
- `GET /api/auth/oauth/google/callback` — OAuth callback
- `POST /api/auth/forgot-password` — Send reset link
- `POST /api/auth/reset-password` — Reset password
- `POST /api/auth/change-password` — Change password
- `GET /api/auth/session` — Get current session

---

#### Service 2: WhatsApp Service (Port 3002) — **CORE REVENUE**
**Purpose**: Real-time messaging, Meta API integration, automation rules

**Responsibilities**:
- One-click WhatsApp connect (Embedded Signup)
- Inbound/outbound message handling
- Message template management
- Automation rule engine
- Media upload to Cloudflare R2
- Webhook signature verification
- Session management via Redis

**Tech Stack**:
- Node.js 22 + Express
- @meta/wa-api (official Meta client)
- RabbitMQ for async message processing
- Redis for session caching
- Cloudflare R2 for media storage (S3-compatible)

**Key Tables**:
```sql
-- whatsapp_instances (One per workspace, encrypted token)
-- whatsapp_messages (Inbound + outbound, indexed by contact_id)
-- message_templates (Draft, pending approval, approved)
-- automation_rules (Triggers + actions, priority-based execution)
-- whatsapp_sessions (Cache layer, Redis-backed)
```

**Critical APIs**:
- `POST /api/instances/:id/connect` — Initiate Embedded Signup
- `GET /api/instances/:id` — Get instance details
- `DELETE /api/instances/:id` — Deactivate instance
- `POST /api/messages/send` — Send message to contact
- `GET /api/messages/contact/:contactId` — Get conversation history
- `POST /api/webhook/meta` — Receive inbound messages from Meta
- `POST /api/templates` — Create message template
- `GET /api/templates` — List templates
- `POST /api/rules` — Create automation rule
- `GET /api/rules` — List rules for workspace
- `PUT /api/rules/:id` — Update rule
- `POST /api/media/upload` — Upload file to R2

**One-Click Connect Flow** (CRITICAL IMPLEMENTATION):
```
1. User clicks "Connect WhatsApp"
2. Frontend redirects to: POST /api/instances/:id/connect
3. Backend returns: { url: "https://accounts.meta.com/..." }
4. User signs in with Meta account
5. Meta redirects to: GET /api/auth/whatsapp/callback?code=...
6. Backend exchanges code for access_token
7. Backend fetches phone_number_id from Meta API
8. Backend stores encrypted token in whatsapp_instances
9. Backend subscribes webhook: POST /webhook/meta
10. Frontend receives success, Dashboard is enabled
```

---

#### Service 3: Booking Service (Port 3003)
**Purpose**: Calendar integration, booking scheduling, reminder management

**Responsibilities**:
- Lead-to-booking conversion
- Calendar sync (Google Calendar, Outlook)
- Auto-scheduling appointments
- Reminder notifications (SMS, Email)
- Booking analytics (revenue, booking rate)

**Tech Stack**:
- Node.js 22 + Express
- node-cal (for calendar sync)
- Email service (SendGrid or AWS SES)
- Twilio (for SMS reminders)

**Key Tables**:
```sql
-- bookings (Created when lead status → Booked)
-- booking_calendars (Workspace calendar connections)
-- booking_reminders (Scheduled reminders)
-- booking_slots (Available appointment times)
```

**Critical APIs**:
- `POST /api/bookings` — Create booking from lead
- `GET /api/bookings` — List bookings for workspace
- `PATCH /api/bookings/:id` — Reschedule booking
- `POST /api/calendars/connect` — Connect calendar (OAuth)
- `GET /api/bookings/availability` — Get available slots

---

#### Service 4: Leads Service (Port 3004)
**Purpose**: CRM functionality, lead pipeline, lead scoring

**Responsibilities**:
- Lead creation, update, deletion
- Lead status management (Hot, Warm, Cold, Booked)
- Lead scoring (based on engagement)
- Segmentation (by source, status, value)
- Tagging system
- Lead-to-contact association

**Tech Stack**:
- Node.js 22 + Express
- PostgreSQL for lead data

**Key Tables**:
```sql
-- contacts/leads (Name, phone, source, status, value)
-- lead_scores (Engagement score, last_interaction)
-- lead_tags (Flexible tagging system)
-- contact_metadata (Custom fields per workspace)
```

**Critical APIs**:
- `POST /api/leads` — Create lead
- `GET /api/leads` — List leads (filterable by status, search)
- `PATCH /api/leads/:id` — Update lead status/value
- `DELETE /api/leads/:id` — Delete lead
- `GET /api/leads/:id/history` — Lead interaction history
- `POST /api/leads/:id/tags` — Add tag to lead
- `PUT /api/leads/:id/score` — Update lead score

---

#### Service 5: Analytics Service (Port 3005)
**Purpose**: Metrics, dashboards, reporting, forecasting

**Responsibilities**:
- Real-time dashboard metrics (Leaks, Cash, On Deck)
- Booking chart data (Revenue over time)
- Activity feed (Recent events)
- Response rate, booking rate calculations
- Performance summaries
- Forecasting (basic trend analysis)

**Tech Stack**:
- Node.js 22 + Express
- PostgreSQL (read replica for reporting)
- Redis for real-time metric caching

**Key Tables**:
```sql
-- analytics_snapshots (Point-in-time metrics)
-- activity_log (Timeline events)
-- booking_snapshots (Historical booking data)
```

**Critical APIs**:
- `GET /api/analytics/overview` — Dashboard cards (Leaks, Cash, On Deck, Response Rate, Booking Rate)
- `GET /api/analytics/bookings` — Chart data (revenue + count by date)
- `GET /api/analytics/activity` — Activity feed (limit=10)
- `GET /api/analytics/summary` — Summary counters (Weekly, Monthly, Annual bookings, Hot leads)

---

#### Service 6: Notifications Service (Port 3006)
**Purpose**: Multi-channel notifications (Email, Push, Webhook, SMS future)

**Responsibilities**:
- Email notifications (SendGrid)
- Push notifications (Firebase Cloud Messaging)
- Webhook callbacks (Custom integrations)
- SMS (Twilio, future phase)
- Notification preferences per workspace

**Tech Stack**:
- Node.js 22 + Express
- SendGrid for email
- FCM for push
- Redis queue for async processing

**Critical APIs**:
- `POST /api/notifications/send` — Send notification
- `GET /api/notifications` — List notifications
- `PUT /api/notifications/preferences` — Update preferences

---

### API Gateway (Next.js Routes)

Runs in Next.js 15 and acts as the single entry point:

**Responsibilities**:
- JWT token validation
- workspace_id extraction from token
- Request routing to microservices
- Rate limiting (per workspace, per IP)
- Response caching (Redis)
- Error formatting

**Flow**:
```
Client Request
    ↓
Next.js API Route (/api/v2/[...slug])
    ↓
Verify JWT + Extract workspace_id
    ↓
Check Rate Limit
    ↓
Check Cache
    ↓
Forward to Service
    ↓
Cache Response (if cacheable)
    ↓
Return to Client
```

---

## Database Design

### Multi-Service Database Strategy

**Option A (Recommended): Per-Service Databases**
- Each service owns its database (schema)
- Shared PostgreSQL instance but separate schemas
- Services can read shared read replica for cross-service queries
- Isolates data at schema level

**Option B: Single Shared Database**
- All services share same database
- Separate tables per service
- Stricter access control via database roles
- Simpler ops, less isolated

**Recommendation**: **Option A** — Per-service is cleaner for microservices growth.

### Shared Infrastructure

**PostgreSQL (Primary)**
- Host: RDS Multi-AZ or managed Postgres
- Services: Auth, WhatsApp, Leads, Booking, Analytics
- Read Replica: For analytics/reporting queries

**Redis (Cache + Queue)**
- Session caching
- Rate limiting
- Real-time data (presence, typing)
- Job queue (RabbitMQ alternative)

**Cloudflare R2 (Object Storage)**
- Message attachments
- Profile images
- Document uploads
- Public URLs via CDN

**RabbitMQ (Message Queue)**
- Async processing (Webhook deliveries, emails)
- Event-driven communication between services
- Dead letter queue for failed jobs
- Retry logic with exponential backoff

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
**Goal**: Set up monorepo structure and core services

#### Tasks:
1. **Monorepo Setup**
   - Create `packages/` directory
   - Move frontend → `packages/dashboard` (Next.js 15)
   - Create backend services directories
   - Set up shared package (`packages/shared-types`)
   - Configure root `turbo.json` for build orchestration

2. **Shared Infrastructure**
   - Set up PostgreSQL (separate schemas per service)
   - Set up Redis
   - Set up Cloudflare R2 account & buckets
   - Set up RabbitMQ (local Docker or managed service)

3. **API Gateway**
   - Create `packages/dashboard/app/api/v2/[...slug]/route.ts`
   - Implement JWT verification middleware
   - Implement workspace_id extraction
   - Implement rate limiting (Redis-backed)
   - Implement request routing to services

4. **Auth Service (Port 3001)**
   - Create Express app structure
   - Implement signup (with 7-day trial assignment)
   - Implement login (email/password)
   - Implement JWT + refresh token rotation
   - Implement Google OAuth 2.0
   - Create database schema (workspaces, refresh_tokens, audit_logs)
   - Write integration tests

**Deliverable**: Monorepo compiles, Auth service can signup/login, API Gateway routes requests

---

### Phase 2: Core WhatsApp (Weeks 4-6)
**Goal**: Implement WhatsApp messaging and one-click connect

#### Tasks:
1. **WhatsApp Service (Port 3002) — CRITICAL**
   - Create Express app structure
   - Implement Meta API client integration
   - Implement Embedded Signup flow
   - Implement webhook receiver (signature verification)
   - Implement message sending (to Meta API)
   - Create database schema (whatsapp_instances, messages, templates, automation_rules)
   - Implement message storage (inbound/outbound)
   - Implement real-time Socket.IO events

2. **One-Click Connect Flow**
   - Frontend button → `POST /api/instances/:id/connect`
   - Backend redirects to Meta OAuth
   - Handle callback, exchange code for token
   - Encrypt and store token
   - Subscribe webhook

3. **Automation Rules Engine**
   - Implement rule matching (trigger evaluation)
   - Implement action execution (send reply, assign agent, create lead)
   - Priority-based rule processing
   - Logging & debugging

4. **Cloudflare R2 Integration**
   - Media upload endpoint
   - Signed URLs for downloads
   - Cleanup old files (lifecycle policy)

**Deliverable**: Users can connect WhatsApp in < 2 minutes, send/receive messages, automation rules work

---

### Phase 3: CRM & Booking (Weeks 7-9)
**Goal**: Lead management and booking integration

#### Tasks:
1. **Leads Service (Port 3004)**
   - Create Express app structure
   - CRUD operations (Create, Read, Update, Delete leads)
   - Status management (Hot, Warm, Cold, Booked)
   - Segmentation & filtering
   - Create database schema

2. **Booking Service (Port 3003)**
   - Create Express app structure
   - Calendar connection (Google Calendar OAuth)
   - Booking creation from leads
   - Availability checking
   - Reminder scheduling

3. **Front-End Lead Management Pages**
   - Lead pipeline table (sortable, filterable)
   - Lead detail view
   - Lead creation form
   - Booking calendar widget

**Deliverable**: Leads can be created, managed, and converted to bookings with calendar sync

---

### Phase 4: Analytics & Monitoring (Weeks 10-12)
**Goal**: Metrics, dashboards, and operational visibility

#### Tasks:
1. **Analytics Service (Port 3005)**
   - Implement metric calculations (Leaks, Cash, On Deck, Response Rate, Booking Rate)
   - Implement booking chart data
   - Implement activity feed
   - Caching layer for performance

2. **Dashboard Analytics Page**
   - Real-time overview cards
   - Booking chart (Recharts)
   - Activity feed
   - Date range filters

3. **Monitoring & Alerts**
   - Health checks on all services
   - Log aggregation (DataDog or ELK)
   - Performance monitoring (APM)
   - Alert rules

**Deliverable**: Full analytics dashboard operational, 99.9% uptime monitoring in place

---

### Phase 5: Trial & Monetization (Weeks 13-15)
**Goal**: Implement trial system and upgrade flow

#### Tasks:
1. **Trial System**
   - 7-day trial auto-assignment on signup
   - Trial countdown in UI
   - Upgrade prompts at day 5
   - Conversion tracking

2. **Pricing Pages**
   - Create pricing tier definitions
   - Implement Stripe integration (if using Stripe)
   - Subscription management

3. **Audit Logs Dashboard**
   - View auth events
   - Search by date, action, IP
   - Export audit logs

**Deliverable**: Trial conversion funnel working, audit logs visible to admins

---

### Phase 6: Quality & Scale (Weeks 16-18)
**Goal**: Testing, optimization, and production readiness

#### Tasks:
1. **Testing**
   - Unit tests for critical paths (Auth, WhatsApp, Automation)
   - Integration tests for service-to-service flows
   - End-to-end tests (signup → connect → send → receive)

2. **Performance Optimization**
   - Database query optimization
   - Caching layer tuning
   - Load testing (1000 concurrent users)

3. **Security Hardening**
   - Token encryption review
   - SQL injection prevention (parameterized queries)
   - CORS policies
   - Rate limiting tweaking

4. **Deployment Automation**
   - CI/CD pipeline per service
   - Automated testing on PR
   - Blue-green deployment strategy

**Deliverable**: Production-ready, tested, scalable, secure platform

---

## Technology Stack Selection

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: shadcn/ui + TailwindCSS v4
- **Data Fetching**: TanStack Query (React Query)
- **Real-Time**: Socket.IO client
- **Form Handling**: React Hook Form + Zod
- **Charts**: Recharts
- **Notifications**: Sonner (toast library)

### Backend Services
- **Runtime**: Node.js 22 (LTS)
- **Framework**: Express (lightweight)
- **Language**: JavaScript (ES6+) or TypeScript (recommended)
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Queues**: RabbitMQ or AWS SQS
- **Storage**: Cloudflare R2 (S3-compatible)

### DevOps
- **Monorepo Tool**: Turborepo
- **Container**: Docker
- **Orchestration**: Kubernetes (or Docker Swarm for small scale)
- **CI/CD**: GitHub Actions
- **Monitoring**: DataDog / New Relic
- **Logging**: ELK Stack or DataDog

---

## Data Flow Diagrams

### Send Message Flow
```
User in Chat UI
    ↓
Frontend: POST /api/v2/messages/send
    ↓
API Gateway (JWT verify, rate limit)
    ↓
WhatsApp Service: POST /api/messages/send
    ↓
Fetch WhatsApp Instance (encrypted token)
    ↓
Call Meta API: POST /graph.facebook.com/v21.0/{phone_number_id}/messages
    ↓
Store Message (whatsapp_messages table)
    ↓
Emit Socket.IO event: "message:sent"
    ↓
Frontend receives real-time update
    ↓
Message appears in chat UI
```

### Receive Message Flow
```
Meta webhook: POST /api/webhook/meta
    ↓
WhatsApp Service: Verify signature, parse message
    ↓
Store message in whatsapp_messages
    ↓
Create/Update contact if needed
    ↓
Check automation_rules
    ↓
Execute matching action (send reply, assign agent, etc.)
    ↓
Emit Socket.IO event: "message:received"
    ↓
Emit Socket.IO event: "message:created_activity_log"
    ↓
Frontend receives updates in real-time
    ↓
Chat UI updates, notification shows
```

### Lead-to-Booking Flow
```
User creates/updates lead status → Booked
    ↓
Leads Service: PATCH /api/leads/:id
    ↓
Check if status changed to "Booked"
    ↓
Booking Service: POST /api/bookings (async via queue)
    ↓
Create booking_snapshots (for analytics)
    ↓
Emit Socket.IO: "lead:status_changed"
    ↓
Analytics Service recalculates metrics
    ↓
Dashboard updates in real-time
```

---

## Risk Mitigation

### Risk: Data Isolation Breach
**Mitigation**:
- All queries include `WHERE workspace_id = $1` (parameterized)
- Code review checklist for every query
- Database role permissions (read-only for analytics replica)
- Regular security audits

### Risk: WhatsApp API Rate Limits
**Mitigation**:
- Redis-backed queue for message sending
- Exponential backoff retry logic
- Monitor rate limit headers from Meta
- Batch small messages when possible

### Risk: Message Loss
**Mitigation**:
- Durable message queue (RabbitMQ with persistence)
- Database backup strategy (daily snapshots)
- Webhook retry logic (exponential backoff)
- Dead letter queue for failed webhooks

### Risk: Service Failure Cascade
**Mitigation**:
- Circuit breaker pattern between services
- Graceful degradation (e.g., show cached analytics if service down)
- Health checks on all services
- Auto-restart policies

### Risk: Unscalable Database
**Mitigation**:
- Separate read replica for analytics queries
- Indexing strategy on workspace_id, contact_id, created_at
- Partition messages table by date (if > 10M rows)
- Regular query performance reviews

---

## Monitoring & Observability

### Key Metrics to Track
- **Service Uptime**: % uptime per service (target: 99.9%)
- **Message Latency**: Time from send to delivery (target: < 500ms)
- **API Response Time**: By endpoint (target: p95 < 500ms)
- **Error Rate**: % of requests resulting in 5xx (target: < 0.1%)
- **Database Query Time**: By query type (target: p95 < 100ms)
- **Queue Depth**: Messages waiting in RabbitMQ (target: < 1000)
- **Webhook Retry Rate**: % of webhooks requiring retry (target: < 1%)

### Alerting Rules
- Service down: Trigger PagerDuty immediately
- Error rate > 1%: Alert engineering team
- Message latency > 2s: Investigation
- Database CPU > 80%: Scale up or optimize
- Queue depth > 10,000: Investigate consumer lag

### Logging Strategy
- Structured logging (JSON) from all services
- Log levels: ERROR, WARN, INFO, DEBUG
- Include: workspace_id, request_id, service_name, duration
- Retention: 30 days hot, 1 year cold storage

---

## Migration Path from Monolith

### Step 1: Parallel Run (Weeks 1-4)
- Deploy microservices alongside monolith
- Routes point to microservices (via API Gateway)
- Monolith acts as fallback
- Both write to same database

### Step 2: Gradual Cutover (Weeks 5-8)
- Disable monolith routes one by one
- Monitor metrics closely
- Keep rollback plan ready

### Step 3: Monolith Deprecation (Week 9+)
- Archive monolith code
- Keep database snapshots
- Document deprecation

---

## Success Criteria

### Technical Success
- ✅ All 6 services deployed and healthy
- ✅ Message latency < 500ms p95
- ✅ API response time < 500ms p95
- ✅ 99.9% uptime SLA met
- ✅ Zero data isolation breaches
- ✅ Automated testing coverage > 80%

### Business Success
- ✅ One-click connect < 2 minutes
- ✅ 7-day trial conversion rate > 25%
- ✅ Support ticket reduction (self-service)
- ✅ 1000+ active workspaces within 12 months
- ✅ Multi-tenant stability proven

### Operational Success
- ✅ Service deployments < 5 minutes per service
- ✅ MTTR (mean time to recovery) < 15 minutes
- ✅ On-call runbooks documented
- ✅ Chaos engineering tests passing

---

## Timeline Summary

```
Week 1-3:   Foundation (Monorepo, API Gateway, Auth Service)
Week 4-6:   WhatsApp Service (One-click connect, messaging)
Week 7-9:   Leads & Booking Services
Week 10-12: Analytics & Monitoring
Week 13-15: Trial & Monetization
Week 16-18: Quality & Scale

Total: ~18 weeks to production-ready
```

---

## Next Steps

1. **Approve Architecture** — Review and sign off on microservices design
2. **Set Up Monorepo** — Initialize Turborepo structure
3. **Create Services** — Start with Auth service (Phase 1)
4. **Establish CI/CD** — GitHub Actions pipeline per service
5. **Begin Development** — Follow phased rollout plan
6. **Weekly Sync** — Align on blockers and adjustments

---

## Questions for Stakeholder Alignment

- [ ] Is 18-week timeline acceptable?
- [ ] Should we use TypeScript or JavaScript for services?
- [ ] Which payment processor (Stripe, Paddle, custom)?
- [ ] On-premises or cloud deployment?
- [ ] Which observability platform (DataDog, Sentry, New Relic)?
- [ ] Support team size for launch?

---

**Document Version**: 1.0  
**Last Updated**: July 6, 2026  
**Approval Status**: Pending
