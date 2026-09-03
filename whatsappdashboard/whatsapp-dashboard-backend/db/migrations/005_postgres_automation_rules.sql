-- Clean PostgreSQL migration for automation rules and logs

CREATE TABLE IF NOT EXISTS automation_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  trigger_type        TEXT NOT NULL DEFAULT 'message_received',
  workflow_type       TEXT NOT NULL DEFAULT 'custom',
  trigger_keywords    JSONB DEFAULT '[]'::jsonb,
  workflow_config     JSONB DEFAULT '{}'::jsonb,
  enabled             BOOLEAN NOT NULL DEFAULT true,
  created_by          UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_workspace
  ON automation_rules (workspace_id, enabled);

CREATE TABLE IF NOT EXISTS automation_analyses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  message_content     TEXT NOT NULL,
  intent              TEXT,
  sentiment           TEXT,
  confidence_score    NUMERIC(5,2),
  should_escalate     BOOLEAN DEFAULT false,
  raw_analysis        JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_analyses_workspace
  ON automation_analyses (workspace_id, created_at DESC);
