import pool from "../config/db.js";
import { decrypt } from "../utils/crypto.js";
import { BadRequestError, ServiceUnavailableError } from "../utils/errors.js";
import { sendTextMessage } from "./meta-embedded-signup.service.js";
import { assertCanSend } from "./whatsapp-compliance.service.js";
import { recordMessageUsage } from "./whatsapp-usage.service.js";

function normalizeRecipient(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

async function getUsableConnection(workspaceId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM whatsapp_connections
     WHERE workspace_id = $1
       AND access_token_encrypted IS NOT NULL
       AND phone_number_id IS NOT NULL
       AND status NOT IN ('PENDING', 'ERROR', 'DISCONNECTED')
     ORDER BY
       CASE status
         WHEN 'CONNECTED' THEN 1
         WHEN 'WEBHOOK_SUBSCRIBED' THEN 2
         WHEN 'ASSETS_DISCOVERED' THEN 3
         WHEN 'AUTHENTICATED' THEN 4
         ELSE 5
       END,
       updated_at DESC
     LIMIT 1`,
    [workspaceId],
  );
  return rows[0] || null;
}

async function sendOutboundText({ workspaceId, messageId, contact, text }) {
  const recipient = normalizeRecipient(contact.phone);
  if (!recipient) {
    throw new BadRequestError("Contact phone number is invalid", "INVALID_RECIPIENT_PHONE");
  }
  await assertCanSend(workspaceId, { contact, messageId, source: "CRM_AGENT" });

  const connection = await getUsableConnection(workspaceId);
  if (!connection) {
    throw new ServiceUnavailableError(
      "No usable WhatsApp connection is available for this workspace",
      "WHATSAPP_CONNECTION_NOT_READY",
    );
  }

  await pool.query(
    `UPDATE messages
     SET connection_id = $1,
         provider_status = 'SENDING',
         direction = 'OUTBOUND',
         message_source = 'CRM_AGENT'
     WHERE id = $2 AND workspace_id = $3`,
    [connection.id, messageId, workspaceId],
  );

  try {
    const result = await sendTextMessage(decrypt(connection.access_token_encrypted), connection.phone_number_id, {
      to: recipient,
      text,
    });
    const providerMessageId = result.messages?.[0]?.id || null;

    const { rows } = await pool.query(
      `UPDATE messages
       SET provider_message_id = $1,
           provider_status = 'SENT',
           failure_code = NULL,
           failure_message = NULL
       WHERE id = $2 AND workspace_id = $3
       RETURNING *`,
      [providerMessageId, messageId, workspaceId],
    );
    await recordMessageUsage(rows[0]);

    return rows[0];
  } catch (error) {
    await pool.query(
      `UPDATE messages
       SET provider_status = 'FAILED',
           failure_code = $1,
           failure_message = $2
       WHERE id = $3 AND workspace_id = $4`,
      [error?.code || "WHATSAPP_SEND_FAILED", error?.message || String(error), messageId, workspaceId],
    );
    throw error;
  }
}

async function sendLegacyBridge({ workspaceId, contact, text, mediaUrl }) {
  if (!process.env.WHATSAPP_SEND_URL) return null;

  const response = await fetch(process.env.WHATSAPP_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.WHATSAPP_SEND_TOKEN
        ? { Authorization: `Bearer ${process.env.WHATSAPP_SEND_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      workspaceId,
      contactId: contact.id,
      phone: contact.phone,
      text,
      mediaUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`WhatsApp sender returned ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

export { sendLegacyBridge, sendOutboundText };
