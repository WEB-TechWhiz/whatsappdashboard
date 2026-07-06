# Phase 0: Preparation Checklist

**Status**: Complete  
**Date**: July 7, 2026  
**Purpose**: Validate current system health before microservices migration

---

## Safety Verification

- [x] Current system fully tested (Git status clean, working tree clean)
- [x] Git branch correct: `project-and-improvement-plan`
- [x] Working copy has no uncommitted changes
- [x] Environment files present:
  - `.env.development.local` - Present ✓
  - `whatsapp-dashboard-backend/.env.example` - Present ✓

## Current System Assessment

### Frontend
- **Framework**: TanStack Start (Vite)
- **Package Manager**: npm (package-lock.json)
- **Key Dependencies**: React 19, TailwindCSS 4, @tanstack/react-query, socket.io-client
- **Status**: Ready for gateway integration (no changes needed)

### Backend
- **Framework**: Express.js
- **Location**: `whatsapp-dashboard-backend/`
- **Database**: PostgreSQL (via Prisma + schema.sql)
- **Cache**: Redis (ioredis)
- **Real-time**: Socket.IO
- **Status**: Ready to be proxied by API Gateway

### Active Clients
- **Count**: 11 active production users
- **Risk**: Must maintain 100% uptime during migration
- **Strategy**: Strangler Fig Pattern - build new services alongside monolith

---

## Non-Negotiable Requirements (Per Improvement Document)

| Requirement | Service | Status |
|------------|---------|--------|
| One-click WhatsApp connect | WhatsApp Service | Phase 3 |
| Real-time message delivery | WhatsApp Service + Socket.IO | Phase 3 |
| Lead-to-booking conversion | Leads Service | Phase 4 |
| Multi-tenant isolation | All Services | Phase 1 (Gateway) |
| 7-day trial system | Auth Service | Phase 2 |
| Audit logs | Auth Service | Phase 2 |
| 99.9% SLA | DevOps/Monitoring | Phase 5+ |
| Scale to 1000+ clients | All Services | Complete when all phases done |

---

## Key Implementation Details

### Database Strategy
- **Auth Service** (Phase 2): Separate PostgreSQL database OR shared schema with auth tables only
- **WhatsApp Service** (Phase 3): Share schema with Auth Service, new tables for instances & messages
- **Leads Service** (Phase 4): Share schema, new tables for deals & bookings
- **Analytics Service** (Phase 5): Read-heavy, can query all shared schemas
- **Messaging Service** (Phase 6): Queue-focused, minimal DB footprint

### API Gateway Strategy
- **Location**: New Next.js route handlers at `/src/routes/api/[...route].tsx`
- **Service Registry**: `src/lib/gateway-config.ts` with environment-based routing
- **Day 1 Behavior**: All routes proxy to existing Express backend (4000)
- **Gradual Migration**: Update SERVICES config to point to new services as they're built

### Real-Time Architecture
- **Socket.IO Upgrade**: Gateway maintains Socket.IO connection with frontend
- **Redis Pub/Sub**: Services publish events to Redis channels
- **Message Bus**: Multiple services emit real-time updates through shared Redis namespace

---

## Approved Implementation Phases

1. **Phase 1** (Weeks 1-2): API Gateway + Service Registry
2. **Phase 2** (Weeks 3-4): Auth Service Extraction
3. **Phase 3** (Weeks 5-6): WhatsApp Service (One-Click Connect)
4. **Phase 4** (Weeks 7-8): Leads Service
5. **Phase 5** (Weeks 9-10): Analytics Service
6. **Phase 6** (Weeks 11-12): Messaging Service
7. **Phase 7** (Weeks 13-18): Monitoring, Testing, Cleanup

---

## Risk Mitigation Plan

### Risk 1: Data Loss During Migration
- **Mitigation**: Automated daily backups, point-in-time recovery
- **Action**: Before Phase 2, verify backup process works

### Risk 2: Existing Clients Lose Access
- **Mitigation**: Gateway with fallback routing - if new service unavailable, route to monolith
- **Action**: Implement health checks for all services

### Risk 3: Real-Time Updates Break
- **Mitigation**: Redis Pub/Sub message bus, multiple listeners
- **Action**: Test Socket.IO across multiple services

### Risk 4: WhatsApp Token Leakage
- **Mitigation**: Encrypt all tokens in database, audit logging
- **Action**: Use AES-256-CBC encryption for sensitive data

### Risk 5: Cross-Service Authentication Fails
- **Mitigation**: Shared JWT_SECRET across all services
- **Action**: Test JWT verification in each service

---

## Environment Variables (To Be Set)

### Shared (All Services)
```
JWT_SECRET=<generated-during-phase-2>
DATABASE_URL=postgresql://...  # Monolith DB (for now)
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=<64-char-hex>
```

### Frontend
```
VITE_API_URL=http://localhost:3000/api/v1  # Routes through gateway
```

### Backend (Monolith)
```
PORT=4000
# Existing env vars remain unchanged
```

### Services (As Built)
```
AUTH_SERVICE_URL=http://localhost:3001
WHATSAPP_SERVICE_URL=http://localhost:3002
LEADS_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3004
MESSAGING_SERVICE_URL=http://localhost:3005
HEALTH_CHECK_INTERVAL=30000
```

---

## Success Criteria for Phase 0

- [x] Current system validated as healthy
- [x] Git repository clean and ready for changes
- [x] Implementation plan understood and approved
- [x] Risk mitigation strategies documented
- [x] Non-negotiable requirements mapped to services
- [x] Phase 1 ready to begin: API Gateway

**Next**: Phase 1 - API Gateway Implementation (Weeks 1-2)
