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

-- WhatsApp Business connection records.
-- F1 foundation for official Meta connection lifecycle.
CREATE TABLE whatsapp_connections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  waba_id                 TEXT,
  phone_number_id         TEXT,
  display_phone_number    TEXT,
  business_name           TEXT,

  provider                TEXT NOT NULL DEFAULT 'META',
  provider_account_id     TEXT,
  connection_mode         TEXT NOT NULL DEFAULT 'CLOUD_API_ONLY',
  access_token_encrypted  TEXT,
  webhook_url             TEXT,

  status                  TEXT NOT NULL DEFAULT 'PENDING',
  webhook_status          TEXT NOT NULL DEFAULT 'PENDING',
  status_reason           TEXT,
  last_error_code         TEXT,
  last_error_message      TEXT,
  last_health_check_at    TIMESTAMPTZ,
  connected_at            TIMESTAMPTZ,
  disconnected_at         TIMESTAMPTZ,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_connections_mode_check
    CHECK (connection_mode IN ('CLOUD_API_ONLY', 'COEXISTENCE')),
  CONSTRAINT whatsapp_connections_status_check
    CHECK (status IN (
      'PENDING',
      'AUTHENTICATED',
      'ASSETS_DISCOVERED',
      'PHONE_REGISTERED',
      'WEBHOOK_SUBSCRIBED',
      'CONNECTED',
      'ERROR',
      'DEGRADED',
      'DISCONNECTED',
      'RECONNECTING'
    )),
  CONSTRAINT whatsapp_connections_webhook_status_check
    CHECK (webhook_status IN ('PENDING', 'SUBSCRIBED', 'FAILED', 'UNKNOWN'))
);

CREATE INDEX idx_whatsapp_connections_workspace
  ON whatsapp_connections (workspace_id);

CREATE INDEX idx_whatsapp_connections_phone_number_id
  ON whatsapp_connections (phone_number_id)
  WHERE phone_number_id IS NOT NULL;

CREATE INDEX idx_whatsapp_connections_waba_id
  ON whatsapp_connections (waba_id)
  WHERE waba_id IS NOT NULL;

CREATE UNIQUE INDEX idx_whatsapp_connections_workspace_phone_unique
  ON whatsapp_connections (workspace_id, phone_number_id)
  WHERE phone_number_id IS NOT NULL;

CREATE UNIQUE INDEX idx_whatsapp_connections_workspace_display_phone_unique
  ON whatsapp_connections (workspace_id, display_phone_number)
  WHERE phone_number_id IS NULL AND display_phone_number IS NOT NULL;

CREATE INDEX idx_whatsapp_connections_status
  ON whatsapp_connections (workspace_id, status);

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
  connection_id   UUID REFERENCES whatsapp_connections(id) ON DELETE SET NULL,

  text            TEXT NOT NULL,
  media_url       TEXT,
  is_agent        BOOLEAN NOT NULL DEFAULT false, -- false = inbound from customer
  read            BOOLEAN NOT NULL DEFAULT false,
  provider_message_id TEXT,
  direction       TEXT,
  message_source  TEXT,
  provider_status TEXT,
  provider_timestamp TIMESTAMPTZ,
  failure_code    TEXT,
  failure_message TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT messages_direction_check
    CHECK (direction IS NULL OR direction IN ('INBOUND', 'OUTBOUND')),
  CONSTRAINT messages_source_check
    CHECK (
      message_source IS NULL OR message_source IN (
        'CUSTOMER',
        'CRM_AGENT',
        'BUSINESS_APP',
        'AUTOMATION',
        'AI',
        'SYSTEM'
      )
    )
);

CREATE INDEX idx_messages_contact_time ON messages (contact_id, created_at DESC);
CREATE UNIQUE INDEX idx_messages_provider_message_unique
  ON messages (workspace_id, provider_message_id)
  WHERE provider_message_id IS NOT NULL;
CREATE INDEX idx_messages_connection_time
  ON messages (connection_id, created_at DESC)
  WHERE connection_id IS NOT NULL;

-- Drives the "LEAKS" metric: inbound, unread, older than 5 minutes
CREATE INDEX idx_messages_leaks ON messages (workspace_id, created_at)
  WHERE is_agent = false AND read = false;

CREATE TABLE whatsapp_webhook_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  connection_id       UUID REFERENCES whatsapp_connections(id) ON DELETE SET NULL,
  provider_event_id   TEXT NOT NULL,
  event_type          TEXT NOT NULL,
  provider            TEXT NOT NULL DEFAULT 'META',
  payload             JSONB NOT NULL,
  processing_status   TEXT NOT NULL DEFAULT 'PENDING',
  retry_count         INTEGER NOT NULL DEFAULT 0,
  processed_at        TIMESTAMPTZ,
  last_error_code     TEXT,
  last_error_message  TEXT,
  received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_webhook_events_status_check
    CHECK (processing_status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'SKIPPED', 'FAILED'))
);

CREATE UNIQUE INDEX idx_whatsapp_webhook_events_provider_event
  ON whatsapp_webhook_events (provider, event_type, provider_event_id);

CREATE INDEX idx_whatsapp_webhook_events_workspace_time
  ON whatsapp_webhook_events (workspace_id, received_at DESC);

CREATE INDEX idx_whatsapp_webhook_events_status
  ON whatsapp_webhook_events (processing_status, received_at);

-- ────────────────────────────────────────────────────────────
-- Activity log (Overview page "Recent Activity" feed)
-- ────────────────────────────────────────────────────────────
CREATE TABLE whatsapp_compliance_settings (
  workspace_id              UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  messaging_paused          BOOLEAN NOT NULL DEFAULT false,
  pause_reason              TEXT,
  daily_outbound_limit      INTEGER NOT NULL DEFAULT 1000,
  per_minute_outbound_limit INTEGER NOT NULL DEFAULT 60,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_compliance_daily_limit_check
    CHECK (daily_outbound_limit > 0),
  CONSTRAINT whatsapp_compliance_minute_limit_check
    CHECK (per_minute_outbound_limit > 0)
);

CREATE TABLE whatsapp_contact_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  phone           TEXT NOT NULL,
  opted_out       BOOLEAN NOT NULL DEFAULT false,
  opt_out_source  TEXT,
  opt_out_reason  TEXT,
  opted_out_at    TIMESTAMPTZ,
  opted_in_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (workspace_id, phone)
);

CREATE INDEX idx_whatsapp_contact_preferences_opted_out
  ON whatsapp_contact_preferences (workspace_id, opted_out)
  WHERE opted_out = true;

CREATE TABLE whatsapp_audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_type     TEXT NOT NULL DEFAULT 'SYSTEM',
  actor_id       UUID,
  event_type     TEXT NOT NULL,
  resource_type  TEXT,
  resource_id    UUID,
  contact_id     UUID REFERENCES contacts(id) ON DELETE SET NULL,
  phone          TEXT,
  details        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_audit_workspace_time
  ON whatsapp_audit_log (workspace_id, created_at DESC);

CREATE INDEX idx_whatsapp_audit_event_type
  ON whatsapp_audit_log (workspace_id, event_type, created_at DESC);

CREATE TABLE whatsapp_message_usage (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  connection_id         UUID REFERENCES whatsapp_connections(id) ON DELETE SET NULL,
  message_id            UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  direction             TEXT NOT NULL,
  category              TEXT NOT NULL DEFAULT 'UNKNOWN',
  recipient_country     TEXT,
  quantity              INTEGER NOT NULL DEFAULT 1,
  provider              TEXT NOT NULL DEFAULT 'META',
  provider_message_id   TEXT,
  provider_pricing_type TEXT,
  billable              BOOLEAN,
  timestamp             TIMESTAMPTZ NOT NULL DEFAULT now(),
  billing_status        TEXT NOT NULL DEFAULT 'UNRATED',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_message_usage_direction_check
    CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  CONSTRAINT whatsapp_message_usage_quantity_check
    CHECK (quantity > 0),
  CONSTRAINT whatsapp_message_usage_billing_status_check
    CHECK (billing_status IN ('UNRATED', 'RATED', 'BILLED', 'IGNORED', 'ERROR')),
  UNIQUE (workspace_id, message_id)
);

CREATE INDEX idx_whatsapp_message_usage_workspace_time
  ON whatsapp_message_usage (workspace_id, timestamp DESC);

CREATE INDEX idx_whatsapp_message_usage_connection_time
  ON whatsapp_message_usage (connection_id, timestamp DESC)
  WHERE connection_id IS NOT NULL;

CREATE INDEX idx_whatsapp_message_usage_billing_status
  ON whatsapp_message_usage (workspace_id, billing_status, timestamp DESC);

CREATE INDEX idx_whatsapp_message_usage_provider_message
  ON whatsapp_message_usage (provider_message_id)
  WHERE provider_message_id IS NOT NULL;

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
