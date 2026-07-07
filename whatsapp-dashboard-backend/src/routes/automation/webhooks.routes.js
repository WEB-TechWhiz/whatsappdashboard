const express = require("express");
const crypto = require("crypto");
const logger = require("../../config/logger");
const webhookHandler = require("../../services/ai-agent/webhook-handler");
const db = require("../../config/db");

const router = express.Router();

/**
 * Verify webhook signature from Meta
 * @private
 */
function verifyWebhookSignature(req, signature) {
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.warn("[Webhook] No webhook secret configured");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.rawBody || JSON.stringify(req.body))
    .digest("sha256");

  const expectedSignature = `sha256=${hash}`;
  return signature === expectedSignature;
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

    const webhookData = req.body;

    // Handle different webhook event types
    const entry = webhookData?.entry?.[0];
    if (!entry) {
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    const change = entry?.changes?.[0];
    const field = change?.field;

    // Route to appropriate handler
    if (field === "messages") {
      // Handle incoming messages
      const result = await webhookHandler.handleIncomingMessage(webhookData);

      if (!result.processed) {
        logger.warn("[Webhook] Message not processed:", result.reason);
      }

      res.status(200).json({ success: true });
    } else if (field === "message_status") {
      // Handle delivery/read status
      const status = change?.value?.statuses?.[0];
      if (status) {
        await handleMessageStatus(status);
      }

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
router.get("/whatsapp", (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
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
