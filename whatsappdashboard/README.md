# WhatsApp Dashboard

A full-stack WhatsApp CRM and automation platform designed to help businesses manage WhatsApp conversations, leads, automation workflows, analytics, notifications, billing, and WhatsApp Business integrations from a centralized dashboard.

## Overview

WhatsApp Dashboard provides a web-based interface for managing business communication through WhatsApp.

The project consists of two primary applications:

* **Frontend:** React + TypeScript application built with TanStack Start, TanStack Router, Vite, and Tailwind CSS.
* **Backend:** Node.js + Express API providing authentication, business logic, WhatsApp integrations, automation, billing, analytics, realtime communication, and database access.

```text
┌─────────────────────────────────────────────┐
│              WhatsApp Dashboard             │
│          React + TanStack + Vite            │
└──────────────────────┬──────────────────────┘
                       │
                       │ HTTP / WebSocket
                       ▼
┌─────────────────────────────────────────────┐
│                 Backend API                 │
│             Node.js + Express               │
├─────────────────────────────────────────────┤
│ Auth │ WhatsApp │ Automation │ Analytics    │
│ Leads│ Billing  │ Settings   │ Notifications │
└──────────────────────┬──────────────────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      PostgreSQL               Redis
```

## Core Features

### Dashboard

* Centralized business dashboard
* Analytics and reporting
* Lead management
* Conversation management
* Notifications
* Business settings
* Onboarding workflow

### WhatsApp Integration

The backend contains services and routes for WhatsApp Business functionality, including:

* WhatsApp connections
* WhatsApp messaging
* Webhook processing
* Webhook event handling
* Meta Embedded Signup
* WhatsApp connection lifecycle
* WhatsApp compliance and safety
* WhatsApp pricing
* Usage tracking

### Conversations

* Conversation management
* Message processing
* Realtime communication
* Socket.IO integration
* Message gateway architecture

### Lead Management

* Lead capture
* Lead management
* Lead automation
* Lead-related workflows

### Automation

The backend includes an automation engine with support for:

* Automation workflows
* Workflow execution
* Lead capture
* Product inquiries
* FAQ and feedback
* Appointment booking
* Escalation handling
* Webhook-based automation

### AI Agent Layer

The backend contains an AI-agent architecture including:

* Analyzer
* Routing engine
* Workflow engine
* Webhook handler
* AI-powered workflow processing

### Billing & Usage

The backend includes:

* WhatsApp pricing engine
* Usage tracking
* Billing gateway
* Wallet management
* Ledger management

### Authentication & Security

The application includes:

* User authentication
* JWT-based authorization
* Password hashing with bcrypt
* Request validation with Zod
* Rate limiting
* HTTP security headers through Helmet
* CORS configuration
* Centralized error handling
* Structured logging

## Technology Stack

### Frontend

| Technology           | Purpose                       |
| -------------------- | ----------------------------- |
| React 19             | UI framework                  |
| TypeScript           | Type-safe development         |
| TanStack Start       | Full-stack React framework    |
| TanStack Router      | Application routing           |
| TanStack React Query | Server-state management       |
| Vite                 | Development and build tooling |
| Tailwind CSS         | Styling                       |
| Radix UI             | Accessible UI primitives      |
| React Hook Form      | Form management               |
| Zod                  | Validation                    |
| Recharts             | Charts and analytics          |
| Socket.IO Client     | Realtime communication        |
| Framer Motion        | UI animations                 |
| Lucide React         | Icons                         |

### Backend

| Technology           | Purpose                       |
| -------------------- | ----------------------------- |
| Node.js              | Runtime                       |
| Express              | HTTP API                      |
| PostgreSQL           | Primary database              |
| Redis                | Caching / supporting services |
| Socket.IO            | Realtime communication        |
| JWT                  | Authentication                |
| bcrypt               | Password hashing              |
| Zod                  | Validation                    |
| Pino                 | Application logging           |
| Helmet               | HTTP security                 |
| CORS                 | Cross-origin configuration    |
| Express Rate Limit   | Request rate limiting         |
| Google Generative AI | AI integration                |

### Infrastructure

* Cloudflare Wrangler
* Cloudflare Tunnel
* PostgreSQL
* Redis
* Environment-based configuration

## Project Structure

```text
whatsappdashboard/
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── components/
│   │   ├── chat/
│   │   ├── dashboard/
│   │   └── ui/
│   │
│   ├── hooks/
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── business-config.ts
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── gateway-config.ts
│   │   ├── gateway-dispatcher.ts
│   │   ├── gateway-health.ts
│   │   ├── gateway-startup.ts
│   │   └── utils.ts
│   │
│   ├── routes/
│   │   ├── api/
│   │   ├── middleware/
│   │   ├── dashboard.analytics.tsx
│   │   ├── dashboard.conversations.tsx
│   │   ├── dashboard.index.tsx
│   │   ├── dashboard.leads.tsx
│   │   ├── dashboard.reports.tsx
│   │   ├── dashboard.settings.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   │
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
│
├── whatsapp-dashboard-backend/
│   │
│   ├── db/
│   │   ├── migrations/
│   │   ├── auth_migration.sql
│   │   └── schema.sql
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── realtime/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai-agent/
│   │   │   ├── analytics.service.js
│   │   │   ├── billing-gateway.service.js
│   │   │   ├── conversations.service.js
│   │   │   ├── dashboard.service.js
│   │   │   ├── leads.service.js
│   │   │   ├── meta-embedded-signup.service.js
│   │   │   ├── notifications.service.js
│   │   │   ├── settings.service.js
│   │   │   ├── whatsapp-compliance.service.js
│   │   │   ├── whatsapp-connections.service.js
│   │   │   ├── whatsapp-message-gateway.service.js
│   │   │   ├── whatsapp-pricing.service.js
│   │   │   ├── whatsapp-usage.service.js
│   │   │   ├── whatsapp-wallet.service.js
│   │   │   └── whatsapp-webhook-events.service.js
│   │   ├── utils/
│   │   ├── validators/
│   │   └── server.js
│   │
│   ├── tests/
│   ├── package.json
│   └── test-db.js
│
├── setup-tunnel.ps1
├── start-tunnel.ps1
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

## Prerequisites

Install the following before running the project:

* Node.js
* npm
* PostgreSQL
* Redis
* Cloudflare `cloudflared` if tunnel functionality is required

## Installation

Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd whatsappdashboard
```

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd whatsapp-dashboard-backend
npm install
cd ..
```

## Environment Configuration

Create the required environment files from the provided examples.

### Frontend

```text
.env.example
```

Create:

```text
.env
```

### Backend

```text
whatsapp-dashboard-backend/.env.example
```

Create:

```text
whatsapp-dashboard-backend/.env
```

Do not commit real environment files or API credentials.

## Database

The backend uses PostgreSQL.

Database schema and migrations are located in:

```text
whatsapp-dashboard-backend/db/
```

The backend provides a migration command:

```bash
cd whatsapp-dashboard-backend
npm run migrate
```

The migration command expects `DATABASE_URL` to be configured.

## Running the Frontend

From the project root:

```bash
npm run dev
```

The frontend development server is configured through Vite.

## Running the Backend

Open another terminal:

```bash
cd whatsapp-dashboard-backend
npm run dev
```

The backend development server uses Nodemon.

For production-style execution:

```bash
npm start
```

## Building the Frontend

```bash
npm run build
```

For a development-mode build:

```bash
npm run build:dev
```

Preview the production build:

```bash
npm run preview
```

## Code Quality

Run ESLint:

```bash
npm run lint
```

Format the project:

```bash
npm run format
```

## Cloudflare Tunnel

The project contains scripts for Cloudflare Tunnel development.

Quick tunnel:

```bash
npm run tunnel
```

Setup a named tunnel:

```bash
npm run tunnel:setup
```

Run the development tunnel:

```bash
npm run tunnel:dev
```

Run the configured named tunnel:

```bash
npm run tunnel:run
```

Cloudflare tunnel configuration should never expose private credentials or secrets in Git.

## Backend API Areas

The backend currently contains route groups for:

```text
/admin
/analytics
/auth
/automation
/billing
/conversations
/dashboard
/integrations
/leads
/notifications
/settings
/whatsapp
```

The project also provides a health endpoint through the API layer.

For detailed endpoint testing, refer to:

```text
API-ENDPOINTS-POSTMAN-TEST-GUIDE.md
```

## Database Migrations

Database migrations are stored under:

```text
whatsapp-dashboard-backend/db/migrations/
```

Current migration areas include:

* Automation workflows
* Dashboard platform
* WhatsApp connections
* Automation rules
* WhatsApp webhook foundation
* WhatsApp compliance and safety
* WhatsApp usage tracking
* WhatsApp pricing
* Wallet and billing ledger

Always review database changes before applying migrations to a production database.

## Security

Never commit:

```text
.env
.env.*
.dev.vars
.wrangler/
*-credentials.json
```

Use environment variables for:

* Database credentials
* JWT secrets
* Redis credentials
* WhatsApp / Meta credentials
* API keys
* AI provider credentials
* Cloudflare credentials

The repository's `.gitignore` is configured to prevent sensitive and generated files from being committed.

## Development Guidelines

When modifying the project:

1. Keep frontend and backend responsibilities separated.
2. Validate external input before processing it.
3. Never expose secrets in source code.
4. Use structured logging for backend operations.
5. Handle API and database errors centrally.
6. Keep WhatsApp webhook processing reliable and idempotent.
7. Test database changes before deployment.
8. Keep generated build files out of version control.
9. Run linting and formatting before committing.
10. Review security-sensitive changes carefully.

## Realtime Architecture

Realtime communication is implemented using Socket.IO.

The frontend uses:

```text
socket.io-client
```

The backend uses:

```text
socket.io
```

This layer is intended for realtime dashboard updates and communication-related events.

## Error Handling & Observability

The project includes dedicated error handling and logging components.

Frontend includes error capture and error-page utilities.

Backend uses:

* Pino
* Pino HTTP
* Centralized error middleware
* Structured application logging

## Testing

Backend tests are located under:

```text
whatsapp-dashboard-backend/tests/
```

Run the project's configured test commands from the backend directory as additional test coverage is added.

## Deployment

The project can be deployed by separating the frontend application and backend API according to the target infrastructure.

Before production deployment:

* Configure production environment variables.
* Configure PostgreSQL.
* Configure Redis if required.
* Apply database migrations.
* Configure WhatsApp / Meta credentials.
* Configure webhook URLs.
* Configure Cloudflare infrastructure if required.
* Run the production frontend build.
* Verify backend health.
* Verify authentication.
* Verify WhatsApp webhook delivery.
* Verify realtime communication.
* Verify billing and usage functionality.

## Repository Safety

Generated files, local configuration, credentials, dependencies, and build output should remain outside Git version control.

Important files that should remain version controlled include:

```text
src/
whatsapp-dashboard-backend/src/
whatsapp-dashboard-backend/db/
whatsapp-dashboard-backend/prisma/
package.json
whatsapp-dashboard-backend/package.json
.env.example
whatsapp-dashboard-backend/.env.example
.gitignore
```

## Project Status

This repository contains an actively developed full-stack WhatsApp CRM and automation platform.

The architecture is organized around separate frontend, backend, database, integration, automation, realtime, and billing responsibilities to allow the platform to evolve as additional WhatsApp Business features are implemented.

## License

No open-source license has been specified for this repository yet.

````
