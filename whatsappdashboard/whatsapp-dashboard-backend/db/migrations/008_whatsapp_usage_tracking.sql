-- F8 Usage Tracking.
-- Records message-level WhatsApp usage exactly once per message.

CREATE TABLE IF NOT EXISTS whatsapp_message_usage (
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

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_usage_workspace_time
  ON whatsapp_message_usage (workspace_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_usage_connection_time
  ON whatsapp_message_usage (connection_id, timestamp DESC)
  WHERE connection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_usage_billing_status
  ON whatsapp_message_usage (workspace_id, billing_status, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_usage_provider_message
  ON whatsapp_message_usage (provider_message_id)
  WHERE provider_message_id IS NOT NULL;
