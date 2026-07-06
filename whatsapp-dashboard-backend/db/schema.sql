-- WhatsApp Dashboard — Database Schema
-- Postgres 14+. Run via: psql -d your_db -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ────────────────────────────────────────────────────────────
-- Workspaces (also acts as the auth/tenant table)
-- ────────────────────────────────────────────────────────────
CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT,
  auth_provider   TEXT NOT NULL DEFAULT 'password',
  oauth_provider  TEXT,
  oauth_subject   TEXT,
  avatar_url      TEXT,

  -- WhatsApp Business connection (Settings page)
  whatsapp_phone      TEXT,
  whatsapp_api_token  TEXT,      -- store encrypted at rest in production (see README)
  whatsapp_webhook_url TEXT,

  -- Automation rules (Settings page)
  auto_reply        BOOLEAN NOT NULL DEFAULT false,
  notify_new_leads  BOOLEAN NOT NULL DEFAULT true,
  flag_leaks        BOOLEAN NOT NULL DEFAULT true,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_workspaces_oauth_identity
  ON workspaces (oauth_provider, oauth_subject)
  WHERE oauth_provider IS NOT NULL AND oauth_subject IS NOT NULL;

CREATE TABLE refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  token_hash      TEXT UNIQUE NOT NULL,
  user_agent      TEXT,
  ip_address      INET,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_workspace ON refresh_tokens (workspace_id);
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens (token_hash)
  WHERE revoked_at IS NULL;

-- ────────────────────────────────────────────────────────────
-- Contacts (doubles as Conversation sidebar item + Lead row —
-- the frontend's `Conversation` and `Lead` types are two views
-- of the same underlying entity, so one table avoids duplicated
-- state between the Conversations page and the Leads page)
-- ────────────────────────────────────────────────────────────
CREATE TYPE lead_status AS ENUM ('Hot', 'Warm', 'Cold', 'Booked');
CREATE TYPE lead_source AS ENUM ('Instagram', 'Website', 'Facebook', 'Referral');

CREATE TABLE contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name              TEXT NOT NULL,
  phone             TEXT NOT NULL,
  source            lead_source NOT NULL DEFAULT 'Website',
  status            lead_status NOT NULL DEFAULT 'Warm',
  deal_value        NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Conversation sidebar fields
  online            BOOLEAN NOT NULL DEFAULT false,
  last_seen_at      TIMESTAMPTZ,

  -- Drives the "ON DECK" metric (assumption: no follow-up scheduling
  -- exists in the original spec, so this column is new — set it
  -- whenever an agent marks a contact for follow-up)
  next_followup_at  TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (workspace_id, phone)
);

CREATE INDEX idx_contacts_workspace_status ON contacts (workspace_id, status);
CREATE INDEX idx_contacts_workspace_followup ON contacts (workspace_id, next_followup_at)
  WHERE next_followup_at IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- Messages
-- ────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  text            TEXT NOT NULL,
  media_url       TEXT,
  is_agent        BOOLEAN NOT NULL DEFAULT false, -- false = inbound from customer
  read            BOOLEAN NOT NULL DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_contact_time ON messages (contact_id, created_at DESC);

-- Drives the "LEAKS" metric: inbound, unread, older than 5 minutes
CREATE INDEX idx_messages_leaks ON messages (workspace_id, created_at)
  WHERE is_agent = false AND read = false;

-- ────────────────────────────────────────────────────────────
-- Activity log (Overview page "Recent Activity" feed)
-- ────────────────────────────────────────────────────────────
CREATE TYPE activity_type AS ENUM ('demo_booked', 'pricing_requested', 'lead_created', 'status_changed', 'message_received');

CREATE TABLE activity_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,

  type            activity_type NOT NULL,
  description     TEXT NOT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_workspace_time ON activity_log (workspace_id, created_at DESC);

-- ────────────────────────────────────────────────────────────
-- Booking snapshots (drives Analytics "weekly bookings" chart +
-- "Today's Cash" — assumption: a booking is created whenever a
-- contact's status flips to 'Booked', see leads.service.js)
-- ────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  value           NUMERIC(12,2) NOT NULL DEFAULT 0,
  booked_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_workspace_time ON bookings (workspace_id, booked_at);
