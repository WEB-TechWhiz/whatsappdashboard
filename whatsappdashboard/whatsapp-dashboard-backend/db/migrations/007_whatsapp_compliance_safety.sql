-- F7 Compliance & Safety.
-- Adds server-side opt-out suppression, workspace pause controls, and audit trail.

CREATE TABLE IF NOT EXISTS whatsapp_compliance_settings (
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

CREATE TABLE IF NOT EXISTS whatsapp_contact_preferences (
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

CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_preferences_opted_out
  ON whatsapp_contact_preferences (workspace_id, opted_out)
  WHERE opted_out = true;

CREATE TABLE IF NOT EXISTS whatsapp_audit_log (
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

CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_workspace_time
  ON whatsapp_audit_log (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_event_type
  ON whatsapp_audit_log (workspace_id, event_type, created_at DESC);
