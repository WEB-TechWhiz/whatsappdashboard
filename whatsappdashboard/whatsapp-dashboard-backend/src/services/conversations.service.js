// const pool = require("../config/db");
import pool from "../config/db.js";
// const logger = require("../config/logger");
import logger from "../config/logger.js";
// const { NotFoundError } = require("../utils/errors");
import { NotFoundError } from "../utils/errors.js";
import { createNotification } from "./notifications.service.js";
import { assertCanSend } from "./whatsapp-compliance.service.js";
import { sendLegacyBridge, sendOutboundText } from "./whatsapp-message-gateway.service.js";
import { recordMessageUsage } from "./whatsapp-usage.service.js";

function toConversationDTO(row) {
  return {
    id: row.id,
    name: row.name,
    preview: row.last_message_preview || "",
    time: row.last_message_at || row.updated_at,
    unread: Number(row.unread_count) || 0,
    online: row.online,
  };
}

function toMessageDTO(row) {
  return {
    id: row.id,
    text: row.text,
    isAgent: row.is_agent,
    time: row.created_at,
    read: row.read,
    mediaUrl: row.media_url || undefined,
    providerMessageId: row.provider_message_id || undefined,
    providerStatus: row.provider_status || undefined,
    failureCode: row.failure_code || undefined,
    failureMessage: row.failure_message || undefined,
    direction: row.direction || (row.is_agent ? "OUTBOUND" : "INBOUND"),
    source: row.message_source || (row.is_agent ? "CRM_AGENT" : "CUSTOMER"),
  };
}

async function listConversations(workspaceId, search) {
  const params = [workspaceId];
  let searchClause = "";

  if (search) {
    params.push(`%${search}%`);
    searchClause = `AND (c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
  }

  const { rows } = await pool.query(
    `SELECT
       c.id, c.name, c.online, c.updated_at,
       (SELECT text FROM messages m WHERE m.contact_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_preview,
       (SELECT created_at FROM messages m WHERE m.contact_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
       (SELECT COUNT(*) FROM messages m WHERE m.contact_id = c.id AND m.is_agent = false AND m.read = false) AS unread_count
     FROM contacts c
     WHERE c.workspace_id = $1 ${searchClause}
     ORDER BY last_message_at DESC NULLS LAST`,
    params,
  );

  return rows.map(toConversationDTO);
}

async function getMessages(workspaceId, contactId, limit = 50, offset = 0) {
  const contact = await pool.query(`SELECT id FROM contacts WHERE id = $1 AND workspace_id = $2`, [
    contactId,
    workspaceId,
  ]);
  if (contact.rows.length === 0) throw new NotFoundError("Conversation");

  const { rows } = await pool.query(
    `SELECT * FROM messages WHERE contact_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [contactId, limit, offset],
  );

  return rows.reverse().map(toMessageDTO);
}

async function sendMessage(workspaceId, contactId, { text, mediaUrl }) {
  const contactResult = await pool.query(
    `SELECT id, name, phone FROM contacts WHERE id = $1 AND workspace_id = $2`,
    [contactId, workspaceId],
  );
  if (contactResult.rows.length === 0) throw new NotFoundError("Conversation");
  const contact = contactResult.rows[0];
  await assertCanSend(workspaceId, { contact, source: "CRM_AGENT" });

  const { rows } = await pool.query(
    `INSERT INTO messages (
       workspace_id,
       contact_id,
       text,
       media_url,
       is_agent,
       read,
       direction,
       message_source,
       provider_status
     )
     VALUES ($1, $2, $3, $4, true, true, 'OUTBOUND', 'CRM_AGENT', 'QUEUED')
     RETURNING *`,
    [workspaceId, contactId, text, mediaUrl || null],
  );
  let message = rows[0];

  await pool.query(`UPDATE contacts SET updated_at = now() WHERE id = $1`, [contactId]);

  try {
    if (mediaUrl) {
      await deliverOutboundMessage(workspaceId, contact, { text, mediaUrl });
      const updated = await pool.query(
        `UPDATE messages SET provider_status = 'LEGACY_BRIDGE' WHERE id = $1 RETURNING *`,
        [message.id],
      );
      message = updated.rows[0];
      await recordMessageUsage(message);
    } else {
      message = await sendOutboundText({ workspaceId, messageId: message.id, contact, text });
    }
  } catch (err) {
    logger.error(
      { err, workspaceId, contactId: contact.id, messageId: message.id },
      "Outbound WhatsApp delivery failed",
    );
    await pool.query(
      `UPDATE messages
       SET provider_status = 'FAILED',
           failure_code = $1,
           failure_message = $2
       WHERE id = $3 AND workspace_id = $4`,
      [err?.code || "WHATSAPP_SEND_FAILED", err?.message || String(err), message.id, workspaceId],
    );
    if (process.env.WHATSAPP_SEND_STRICT === "true") throw err;
    const failed = await pool.query(`SELECT * FROM messages WHERE id = $1 AND workspace_id = $2`, [
      message.id,
      workspaceId,
    ]);
    message = failed.rows[0] || message;
  }

  return toMessageDTO(message);
}

async function receiveInboundMessage(
  workspaceId,
  {
    phone,
    name,
    text,
    mediaUrl,
    source,
    connectionId,
    providerMessageId,
    providerTimestamp,
    messageSource = "CUSTOMER",
  },
) {
  const contactResult = await pool.query(
    `INSERT INTO contacts (workspace_id, name, phone, source)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (workspace_id, phone)
     DO UPDATE SET name = COALESCE(EXCLUDED.name, contacts.name), updated_at = now()
     RETURNING *`,
    [workspaceId, name || phone, phone, source],
  );
  const contact = contactResult.rows[0];

  const { rows } = await pool.query(
    `INSERT INTO messages (
       workspace_id,
       contact_id,
       connection_id,
       text,
       media_url,
       is_agent,
       read,
       provider_message_id,
       direction,
       message_source,
       provider_status,
       provider_timestamp
     )
     VALUES ($1, $2, $3, $4, $5, false, false, $6, 'INBOUND', $7, 'RECEIVED', $8)
     ON CONFLICT (workspace_id, provider_message_id)
     WHERE provider_message_id IS NOT NULL
     DO UPDATE SET provider_status = 'RECEIVED'
     RETURNING *`,
    [
      workspaceId,
      contact.id,
      connectionId || null,
      text,
      mediaUrl || null,
      providerMessageId || null,
      messageSource,
      providerTimestamp ? new Date(Number(providerTimestamp) * 1000) : null,
    ],
  );
  await recordMessageUsage(rows[0]);

  await pool.query(
    `INSERT INTO activity_log (workspace_id, contact_id, type, description)
     VALUES ($1, $2, 'message_received', $3)`,
    [workspaceId, contact.id, `New message from ${contact.name}`],
  );

  await createNotification(workspaceId, {
    type: "message",
    title: `New message — ${contact.name}`,
    body: text.slice(0, 140),
    link: `/dashboard/conversations`,
  });

  return {
    contact: toConversationDTO({
      ...contact,
      last_message_preview: text,
      last_message_at: rows[0].created_at,
      unread_count: 1,
    }),
    message: toMessageDTO(rows[0]),
  };
}

async function deliverOutboundMessage(workspaceId, contact, payload) {
  if (!process.env.WHATSAPP_SEND_URL) {
    throw new Error(
      "Media sends require WHATSAPP_SEND_URL until media Cloud API support is implemented",
    );
  }

  await sendLegacyBridge({
    workspaceId,
    contact,
    text: payload.text,
    mediaUrl: payload.mediaUrl,
  });
}

async function markRead(workspaceId, contactId) {
  await pool.query(
    `UPDATE messages SET read = true
     WHERE contact_id = $1 AND workspace_id = $2 AND is_agent = false AND read = false`,
    [contactId, workspaceId],
  );
}

export { listConversations, getMessages, sendMessage, receiveInboundMessage, markRead };
