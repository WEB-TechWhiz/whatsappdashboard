-- F2 Secure Connection Management.
-- Adds explainable lifecycle state details for health checks and operator support.

ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_error_code TEXT,
  ADD COLUMN IF NOT EXISTS last_error_message TEXT,
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status
  ON whatsapp_connections (workspace_id, status);
