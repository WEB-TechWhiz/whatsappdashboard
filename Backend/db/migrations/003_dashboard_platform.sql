-- Per-workspace onboarding + feature flags + notifications center.
-- Safe to run multiple times (idempotent).

CREATE TABLE IF NOT EXISTS workspace_settings (
  workspace_id           UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  business_name          TEXT,
  industry               TEXT,
  team_size              TEXT,
  features               JSONB NOT NULL DEFAULT '{}'::jsonb,
  onboarding_completed   BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('lead', 'message', 'booking', 'system', 'payment', 'campaign');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type          notification_type NOT NULL DEFAULT 'system',
  title         TEXT NOT NULL,
  body          TEXT,
  link          TEXT,
  read          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_workspace_time
  ON notifications (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (workspace_id) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_messages_workspace_time
  ON messages (workspace_id, created_at DESC);