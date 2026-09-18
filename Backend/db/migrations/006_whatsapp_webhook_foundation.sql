-- F4 Webhook Foundation.
-- Adds provider message metadata and retry-safe webhook event storage.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS direction TEXT,
  ADD COLUMN IF NOT EXISTS message_source TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_code TEXT,
  ADD COLUMN IF NOT EXISTS failure_message TEXT;

UPDATE messages
SET direction = CASE WHEN is_agent THEN 'OUTBOUND' ELSE 'INBOUND' END
WHERE direction IS NULL;

UPDATE messages
SET message_source = CASE WHEN is_agent THEN 'CRM_AGENT' ELSE 'CUSTOMER' END
WHERE message_source IS NULL;

UPDATE messages
SET provider_status = CASE WHEN is_agent THEN 'LOCAL_ONLY' ELSE 'RECEIVED' END
WHERE provider_status IS NULL;

DO $$ BEGIN
  ALTER TABLE messages
    ADD CONSTRAINT messages_direction_check
      CHECK (direction IS NULL OR direction IN ('INBOUND', 'OUTBOUND'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE messages
    ADD CONSTRAINT messages_source_check
      CHECK (
        message_source IS NULL OR message_source IN (
          'CUSTOMER',
          'CRM_AGENT',
          'BUSINESS_APP',
          'AUTOMATION',
          'AI',
          'SYSTEM'
        )
      );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_provider_message_unique
  ON messages (workspace_id, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_connection_time
  ON messages (connection_id, created_at DESC)
  WHERE connection_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_provider_event
  ON whatsapp_webhook_events (provider, event_type, provider_event_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_workspace_time
  ON whatsapp_webhook_events (workspace_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_status
  ON whatsapp_webhook_events (processing_status, received_at);
