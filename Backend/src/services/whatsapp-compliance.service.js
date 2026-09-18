import pool from "../config/db.js";
import { AppError } from "../utils/errors.js";

const OPT_OUT_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const OPT_IN_KEYWORDS = new Set(["START", "UNSTOP"]);

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function normalizeKeyword(text) {
  return String(text || "").trim().toUpperCase();
}

function isOptOutText(text) {
  return OPT_OUT_KEYWORDS.has(normalizeKeyword(text));
}

function isOptInText(text) {
  return OPT_IN_KEYWORDS.has(normalizeKeyword(text));
}

function toSettingsDTO(row) {
  return {
    messagingPaused: row.messaging_paused,
    pauseReason: row.pause_reason || null,
    dailyOutboundLimit: row.daily_outbound_limit,
    perMinuteOutboundLimit: row.per_minute_outbound_limit,
    updatedAt: row.updated_at,
  };
}

async function audit(workspaceId, event) {
  await pool.query(
    `INSERT INTO whatsapp_audit_log (
       workspace_id,
       actor_type,
       actor_id,
       event_type,
       resource_type,
       resource_id,
       contact_id,
       phone,
       details
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      workspaceId,
      event.actorType || "SYSTEM",
      event.actorId || null,
      event.eventType,
      event.resourceType || null,
      event.resourceId || null,
      event.contactId || null,
      event.phone || null,
      event.details || {},
    ],
  );
}

async function getSettings(workspaceId) {
  const { rows } = await pool.query(
    `INSERT INTO whatsapp_compliance_settings (workspace_id)
     VALUES ($1)
     ON CONFLICT (workspace_id) DO UPDATE
       SET updated_at = whatsapp_compliance_settings.updated_at
     RETURNING *`,
    [workspaceId],
  );
  return toSettingsDTO(rows[0]);
}

async function updateSettings(workspaceId, patch, actor = {}) {
  const current = await getSettings(workspaceId);
  const next = {
    messagingPaused: patch.messagingPaused ?? current.messagingPaused,
    pauseReason: Object.prototype.hasOwnProperty.call(patch, "pauseReason")
      ? patch.pauseReason
      : current.pauseReason,
    dailyOutboundLimit: patch.dailyOutboundLimit ?? current.dailyOutboundLimit,
    perMinuteOutboundLimit: patch.perMinuteOutboundLimit ?? current.perMinuteOutboundLimit,
  };

  const { rows } = await pool.query(
    `INSERT INTO whatsapp_compliance_settings (
       workspace_id,
       messaging_paused,
       pause_reason,
       daily_outbound_limit,
       per_minute_outbound_limit
     )
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (workspace_id) DO UPDATE SET
       messaging_paused = EXCLUDED.messaging_paused,
       pause_reason = EXCLUDED.pause_reason,
       daily_outbound_limit = EXCLUDED.daily_outbound_limit,
       per_minute_outbound_limit = EXCLUDED.per_minute_outbound_limit,
       updated_at = now()
     RETURNING *`,
    [
      workspaceId,
      next.messagingPaused,
      next.pauseReason,
      next.dailyOutboundLimit,
      next.perMinuteOutboundLimit,
    ],
  );

  await audit(workspaceId, {
    actorType: actor.actorType || "WORKSPACE_USER",
    actorId: actor.actorId,
    eventType: "COMPLIANCE_SETTINGS_UPDATED",
    resourceType: "whatsapp_compliance_settings",
    details: next,
  });

  return toSettingsDTO(rows[0]);
}

async function setContactPreference(
  workspaceId,
  { contactId, phone, optedOut, source = "SYSTEM", reason = null },
) {
  const normalizedPhone = normalizePhone(phone);
  const { rows } = await pool.query(
    `INSERT INTO whatsapp_contact_preferences (
       workspace_id,
       contact_id,
       phone,
       opted_out,
       opt_out_source,
       opt_out_reason,
       opted_out_at,
       opted_in_at
     )
     VALUES ($1, $2, $3, $4, $5, $6,
             CASE WHEN $4 THEN now() ELSE NULL END,
             CASE WHEN $4 THEN NULL ELSE now() END)
     ON CONFLICT (workspace_id, phone) DO UPDATE SET
       contact_id = COALESCE(EXCLUDED.contact_id, whatsapp_contact_preferences.contact_id),
       opted_out = EXCLUDED.opted_out,
       opt_out_source = EXCLUDED.opt_out_source,
       opt_out_reason = EXCLUDED.opt_out_reason,
       opted_out_at = CASE WHEN EXCLUDED.opted_out THEN now() ELSE whatsapp_contact_preferences.opted_out_at END,
       opted_in_at = CASE WHEN EXCLUDED.opted_out THEN whatsapp_contact_preferences.opted_in_at ELSE now() END,
       updated_at = now()
     RETURNING *`,
    [workspaceId, contactId || null, normalizedPhone, optedOut, source, reason],
  );

  await audit(workspaceId, {
    eventType: optedOut ? "CONTACT_OPTED_OUT" : "CONTACT_OPTED_IN",
    resourceType: "whatsapp_contact_preferences",
    resourceId: rows[0].id,
    contactId,
    phone: normalizedPhone,
    details: { source, reason },
  });

  return {
    id: rows[0].id,
    contactId: rows[0].contact_id,
    phone: rows[0].phone,
    optedOut: rows[0].opted_out,
    optedOutAt: rows[0].opted_out_at,
    optedInAt: rows[0].opted_in_at,
  };
}

async function handleInboundPreference(workspaceId, { contactId, phone, text, providerMessageId }) {
  if (isOptOutText(text)) {
    return {
      action: "OPTED_OUT",
      preference: await setContactPreference(workspaceId, {
        contactId,
        phone,
        optedOut: true,
        source: "INBOUND_MESSAGE",
        reason: `Keyword: ${normalizeKeyword(text)}`,
      }),
    };
  }

  if (isOptInText(text)) {
    return {
      action: "OPTED_IN",
      preference: await setContactPreference(workspaceId, {
        contactId,
        phone,
        optedOut: false,
        source: "INBOUND_MESSAGE",
        reason: `Keyword: ${normalizeKeyword(text)}`,
      }),
    };
  }

  return { action: null, preference: null };
}

async function assertCanSend(workspaceId, { contact, messageId = null, source = "CRM_AGENT" }) {
  const settings = await getSettings(workspaceId);
  const normalizedPhone = normalizePhone(contact.phone);

  if (settings.messagingPaused) {
    await audit(workspaceId, {
      eventType: "SEND_BLOCKED",
      resourceType: "message",
      resourceId: messageId,
      contactId: contact.id,
      phone: normalizedPhone,
      details: { reason: "MESSAGING_PAUSED", source },
    });
    throw new AppError("WhatsApp messaging is paused for this workspace", 403, "MESSAGING_PAUSED");
  }

  const preference = await pool.query(
    `SELECT opted_out
     FROM whatsapp_contact_preferences
     WHERE workspace_id = $1 AND phone = $2
     LIMIT 1`,
    [workspaceId, normalizedPhone],
  );

  if (preference.rows[0]?.opted_out) {
    await audit(workspaceId, {
      eventType: "SEND_BLOCKED",
      resourceType: "message",
      resourceId: messageId,
      contactId: contact.id,
      phone: normalizedPhone,
      details: { reason: "CONTACT_OPTED_OUT", source },
    });
    throw new AppError("Contact has opted out of WhatsApp messages", 403, "CONTACT_OPTED_OUT");
  }

  const usage = await pool.query(
    `SELECT
       COUNT(*) FILTER (
         WHERE created_at >= date_trunc('day', now())
           AND ($2::uuid IS NULL OR id <> $2::uuid)
       )::int AS sent_today,
       COUNT(*) FILTER (
         WHERE created_at >= now() - interval '1 minute'
           AND ($2::uuid IS NULL OR id <> $2::uuid)
       )::int AS sent_last_minute
     FROM messages
     WHERE workspace_id = $1
       AND is_agent = true
       AND COALESCE(provider_status, '') <> 'FAILED'`,
    [workspaceId, messageId],
  );

  const sentToday = usage.rows[0]?.sent_today || 0;
  const sentLastMinute = usage.rows[0]?.sent_last_minute || 0;

  if (sentToday >= settings.dailyOutboundLimit) {
    await audit(workspaceId, {
      eventType: "SEND_BLOCKED",
      resourceType: "message",
      resourceId: messageId,
      contactId: contact.id,
      phone: normalizedPhone,
      details: { reason: "DAILY_LIMIT_REACHED", sentToday, limit: settings.dailyOutboundLimit, source },
    });
    throw new AppError("Daily WhatsApp outbound limit reached", 429, "DAILY_OUTBOUND_LIMIT_REACHED");
  }

  if (sentLastMinute >= settings.perMinuteOutboundLimit) {
    await audit(workspaceId, {
      eventType: "SEND_BLOCKED",
      resourceType: "message",
      resourceId: messageId,
      contactId: contact.id,
      phone: normalizedPhone,
      details: {
        reason: "PER_MINUTE_LIMIT_REACHED",
        sentLastMinute,
        limit: settings.perMinuteOutboundLimit,
        source,
      },
    });
    throw new AppError("Per-minute WhatsApp outbound limit reached", 429, "PER_MINUTE_LIMIT_REACHED");
  }

  return true;
}

export {
  assertCanSend,
  audit,
  getSettings,
  handleInboundPreference,
  isOptInText,
  isOptOutText,
  setContactPreference,
  updateSettings,
};
