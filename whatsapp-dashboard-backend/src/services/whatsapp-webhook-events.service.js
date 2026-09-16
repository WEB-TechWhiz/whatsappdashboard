import crypto from "crypto";
import pool from "../config/db.js";

function stableEventId(prefix, payload) {
  const hash = crypto.createHash("sha256").update(JSON.stringify(payload || {})).digest("hex");
  return `${prefix}:${hash}`;
}

function inboundMessageEventId(message) {
  return message?.id || stableEventId("message", message);
}

function statusEventId(status) {
  return status?.id
    ? `${status.id}:${status.status || "status"}:${status.timestamp || ""}`
    : stableEventId("status", status);
}

async function resolveConnectionByMetadata(metadata) {
  const phoneNumberId = metadata?.phone_number_id;
  if (!phoneNumberId) return null;

  const { rows } = await pool.query(
    `SELECT id, workspace_id
     FROM whatsapp_connections
     WHERE phone_number_id = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [phoneNumberId],
  );

  return rows[0] || null;
}

async function createWebhookEvent({ workspaceId, connectionId, eventType, providerEventId, payload }) {
  const { rows } = await pool.query(
    `INSERT INTO whatsapp_webhook_events (
       workspace_id,
       connection_id,
       event_type,
       provider_event_id,
       payload,
       processing_status
     )
     VALUES ($1, $2, $3, $4, $5, 'PROCESSING')
     ON CONFLICT (provider, event_type, provider_event_id)
     DO UPDATE SET retry_count = whatsapp_webhook_events.retry_count + 1,
                   updated_at = now()
     RETURNING *,
       (xmax = 0) AS inserted`,
    [workspaceId || null, connectionId || null, eventType, providerEventId, payload],
  );

  return {
    event: rows[0],
    shouldProcess: rows[0]?.inserted === true,
  };
}

async function markWebhookEventProcessed(id) {
  await pool.query(
    `UPDATE whatsapp_webhook_events
     SET processing_status = 'PROCESSED',
         processed_at = now(),
         updated_at = now(),
         last_error_code = NULL,
         last_error_message = NULL
     WHERE id = $1`,
    [id],
  );
}

async function markWebhookEventSkipped(id, reason) {
  await pool.query(
    `UPDATE whatsapp_webhook_events
     SET processing_status = 'SKIPPED',
         processed_at = now(),
         updated_at = now(),
         last_error_message = $2
     WHERE id = $1`,
    [id, reason || null],
  );
}

async function markWebhookEventFailed(id, error) {
  await pool.query(
    `UPDATE whatsapp_webhook_events
     SET processing_status = 'FAILED',
         updated_at = now(),
         last_error_code = $2,
         last_error_message = $3
     WHERE id = $1`,
    [id, error?.code || "WEBHOOK_PROCESSING_FAILED", error?.message || String(error)],
  );
}

async function updateMessageProviderStatus(workspaceId, status) {
  if (!workspaceId || !status?.id) return null;

  const normalizedStatus = String(status.status || "").toUpperCase() || null;
  const { rows } = await pool.query(
    `UPDATE messages
     SET provider_status = $1,
         failure_code = $2,
         failure_message = $3,
         provider_timestamp = COALESCE($4, provider_timestamp),
         read = CASE WHEN $1 = 'READ' THEN true ELSE read END
     WHERE workspace_id = $5 AND provider_message_id = $6
     RETURNING *`,
    [
      normalizedStatus,
      status.errors?.[0]?.code ? String(status.errors[0].code) : null,
      status.errors?.[0]?.message || status.errors?.[0]?.title || null,
      status.timestamp ? new Date(Number(status.timestamp) * 1000) : null,
      workspaceId,
      status.id,
    ],
  );

  if (!rows[0]) return null;

  return {
    contactId: rows[0].contact_id,
    message: {
      id: rows[0].id,
      text: rows[0].text,
      isAgent: rows[0].is_agent,
      time: rows[0].created_at,
      read: rows[0].read,
      mediaUrl: rows[0].media_url || undefined,
      providerMessageId: rows[0].provider_message_id || undefined,
      providerStatus: rows[0].provider_status || undefined,
      failureCode: rows[0].failure_code || undefined,
      failureMessage: rows[0].failure_message || undefined,
      direction: rows[0].direction || (rows[0].is_agent ? "OUTBOUND" : "INBOUND"),
      source: rows[0].message_source || (rows[0].is_agent ? "CRM_AGENT" : "CUSTOMER"),
    },
  };
}

export {
  createWebhookEvent,
  inboundMessageEventId,
  markWebhookEventFailed,
  markWebhookEventProcessed,
  markWebhookEventSkipped,
  resolveConnectionByMetadata,
  statusEventId,
  updateMessageProviderStatus,
};
