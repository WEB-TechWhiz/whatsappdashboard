const express = require("express");
const crypto = require("crypto");
const logger = require("../../utils/logger");
const webhookHandler = require("../../services/ai-agent/webhook-handler");
const db = require("../../database");

const router = express.Router();

/**
 * Verify webhook signature from Meta
 * @private
 */
function getRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  return Buffer.from(req.rawBody || JSON.stringify(req.body || {}));
}

function parseWebhookBody(req) {
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8"));
  return req.body;
}

function verifyWebhookSignature(req, signature) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!secret || typeof signature !== "string") return false;
  const expected = crypto.createHmac("sha256", secret).update(getRawBody(req)).digest("hex");
  const provided = signature.replace(/^sha256=/, "");
  return provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

async function claimWebhookEvent(connectionId, providerEventId, eventType, payload) {
  const result = await db.query(
    `INSERT INTO public.whatsapp_webhook_events (connection_id, provider_event_id, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (connection_id, provider_event_id) DO NOTHING
     RETURNING id`,
    [connectionId, providerEventId, eventType, JSON.stringify(payload)],
  );
  return Boolean(result.rows[0]);
}

function getProviderEventId(change) {
  return change?.value?.messages?.[0]?.id || change?.value?.statuses?.[0]?.id ||
    crypto.createHash("sha256").update(JSON.stringify(change || {})).digest("hex");
}

/**
 * POST /webhooks/whatsapp
 * Receives incoming WhatsApp messages from Meta
 * 
 * This is the main entry point for:
 * - Incoming customer messages
 * - Message delivery confirmations
 * - Message read receipts
 */
router.post("/whatsapp", async (req, res) => {
  try {
    // Verify webhook signature for security
    const signature = req.headers["x-hub-signature-256"];
    if (!verifyWebhookSignature(req, signature)) {
      logger.warn("[Webhook] Invalid signature - possible tampering");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const webhookData = parseWebhookBody(req);

    // Handle different webhook event types
    const entry = webhookData?.entry?.[0];
    if (!entry) {
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    const change = entry?.changes?.[0];
    const field = change?.field;
    const phoneNumberId = change?.value?.metadata?.phone_number_id;
    const connectionResult = await db.query(
      `SELECT id FROM public.whatsapp_connections WHERE phone_number_id = $1 AND status <> 'DISCONNECTED' LIMIT 1`,
      [phoneNumberId],
    );
    if (!connectionResult.rows[0]) return res.status(200).json({ success: true });

    const claimed = await claimWebhookEvent(
      connectionResult.rows[0].id,
      getProviderEventId(change),
      field || "unknown",
      webhookData,
    );
    if (!claimed) return res.status(200).json({ success: true, duplicate: true });

    // Route to appropriate handler
    if (field === "messages") {
      // Handle incoming messages
      const result = await webhookHandler.handleIncomingMessage(webhookData);

      if (!result.processed) {
        logger.warn("[Webhook] Message not processed:", result.reason);
      }

      await db.query(`UPDATE public.whatsapp_webhook_events SET processed_at = now() WHERE connection_id = $1 AND provider_event_id = $2`, [connectionResult.rows[0].id, getProviderEventId(change)]);
      res.status(200).json({ success: true });
    } else if (field === "message_status") {
      // Handle delivery/read status
      const status = change?.value?.statuses?.[0];
      if (status) {
        await handleMessageStatus(status);
      }

      await db.query(`UPDATE public.whatsapp_webhook_events SET processed_at = now() WHERE connection_id = $1 AND provider_event_id = $2`, [connectionResult.rows[0].id, getProviderEventId(change)]);
      res.status(200).json({ success: true });
    } else {
      logger.info("[Webhook] Unknown field:", field);
      res.status(200).json({ success: true });
    }
  } catch (error) {
    logger.error("[Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /webhooks/whatsapp
 * Webhook verification challenge from Meta
 * 
 * Meta sends this to verify the webhook is responding correctly
 */
router.get("/whatsapp", async (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    const phoneNumberId = req.query.phone_number_id;
    const connectionResult = phoneNumberId
      ? await db.query(`SELECT webhook_verify_token_hash FROM public.whatsapp_connections WHERE phone_number_id = $1 AND status <> 'DISCONNECTED' LIMIT 1`, [phoneNumberId])
      : { rows: [] };
    const validToken = connectionResult.rows[0]?.webhook_verify_token_hash
      ? crypto.createHash("sha256").update(String(token || "")).digest("hex") === connectionResult.rows[0].webhook_verify_token_hash
      : Boolean(verifyToken && token === verifyToken);

    if (mode === "subscribe" && validToken) {
      logger.info("[Webhook] Webhook verified by Meta");
      res.status(200).send(challenge);
    } else {
      logger.warn("[Webhook] Invalid verification token");
      res.status(403).json({ error: "Invalid token" });
    }
  } catch (error) {
    logger.error("[Webhook] Error verifying webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Handle message delivery/read status updates
 * @private
 */
async function handleMessageStatus(status) {
  try {
    const { id, status: messageStatus, timestamp } = status;

    logger.info(`[Webhook] Message ${id} status: ${messageStatus}`);

    // Update message status in database
    await db.query(
      `UPDATE messages 
       SET status = ?, updated_at = NOW()
       WHERE meta_message_id = ?`,
      [messageStatus, id],
    );
  } catch (error) {
    logger.error("[Webhook] Error handling status:", error);
  }
}

module.exports = router;
