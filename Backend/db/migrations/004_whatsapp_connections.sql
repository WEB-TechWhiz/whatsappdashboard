-- F1 WhatsApp Data Foundation.
-- Adds tenant-scoped connection records without removing legacy workspace fields.

CREATE TABLE IF NOT EXISTS whatsapp_connections (
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
  last_health_check_at    TIMESTAMPTZ,

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

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_workspace
  ON whatsapp_connections (workspace_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_phone_number_id
  ON whatsapp_connections (phone_number_id)
  WHERE phone_number_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_waba_id
  ON whatsapp_connections (waba_id)
  WHERE waba_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_connections_workspace_phone_unique
  ON whatsapp_connections (workspace_id, phone_number_id)
  WHERE phone_number_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_connections_workspace_display_phone_unique
  ON whatsapp_connections (workspace_id, display_phone_number)
  WHERE phone_number_id IS NULL AND display_phone_number IS NOT NULL;

INSERT INTO whatsapp_connections (
  workspace_id,
  display_phone_number,
  access_token_encrypted,
  webhook_url,
  provider,
  connection_mode,
  status,
  webhook_status
)
SELECT
  w.id,
  w.whatsapp_phone,
  w.whatsapp_api_token,
  w.whatsapp_webhook_url,
  'META',
  'CLOUD_API_ONLY',
  CASE
    WHEN w.whatsapp_api_token IS NOT NULL THEN 'AUTHENTICATED'
    ELSE 'PENDING'
  END,
  CASE
    WHEN w.whatsapp_webhook_url IS NOT NULL THEN 'UNKNOWN'
    ELSE 'PENDING'
  END
FROM workspaces w
WHERE (w.whatsapp_phone IS NOT NULL OR w.whatsapp_api_token IS NOT NULL OR w.whatsapp_webhook_url IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1
    FROM whatsapp_connections wc
    WHERE wc.workspace_id = w.id
  );
