import crypto from "crypto";
import express from "express";
import logger from "../../config/logger.js";
import pool from "../../config/db.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  AppError,
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../../utils/errors.js";
import * as conversations from "../../services/conversations.service.js";
import { emitToWorkspace } from "../../realtime/socket.js";

const router = express.Router();

function parseJsonBody(req) {
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body;
    return JSON.parse(req.body.toString("utf8"));
  }

  if (req.body && typeof req.body === "object") {
    req.rawBody = Buffer.from(JSON.stringify(req.body));
    return req.body;
  }

  throw new BadRequestError("Invalid webhook body", "INVALID_WEBHOOK_BODY");
}

function verifyWebhookSignature(req) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const signature = req.get("x-hub-signature-256");

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("WhatsApp webhook secret is not configured", 503, "WEBHOOK_SECRET_NOT_CONFIGURED");
    }
    logger.warn("[Webhook] WHATSAPP_WEBHOOK_SECRET is not set; skipping signature verification in development");
    return;
  }

  if (!signature?.startsWith("sha256=")) {
    throw new UnauthorizedError("Missing or malformed WhatsApp webhook signature");
  }

  const rawBody = Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody || "");
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new UnauthorizedError("Invalid WhatsApp webhook signature");
  }
}

function extractMessageText(message) {
  if (!message) return "";

  if (message.type === "text") return message.text?.body || "";
  if (message.type === "button") return message.button?.text || message.button?.payload || "";

  if (message.type === "interactive") {
    const interactive = message.interactive;
    if (interactive?.type === "button_reply") return interactive.button_reply?.title || "";
    if (interactive?.type === "list_reply") return interactive.list_reply?.title || "";
    if (interactive?.type === "nfm_reply") {
      return JSON.stringify(interactive.nfm_reply?.response_json || {});
    }
  }

  if (message.type === "image") return message.image?.caption || "[image]";
  if (message.type === "video") return message.video?.caption || "[video]";
  if (message.type === "audio") return "[audio]";
  if (message.type === "document") return message.document?.filename || "[document]";

  return `[${message.type || "unsupported"}]`;
}

function extractMediaUrl(message) {
  if (!message) return null;
  return message.image?.id || message.video?.id || message.audio?.id || message.document?.id || null;
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

async function resolveWorkspaceId(metadata) {
  const configuredWorkspaceId = process.env.WHATSAPP_WORKSPACE_ID;
  const configuredPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const payloadPhoneNumberId = metadata?.phone_number_id;

  if (
    configuredWorkspaceId &&
    (!configuredPhoneNumberId || configuredPhoneNumberId === payloadPhoneNumberId)
  ) {
    return configuredWorkspaceId;
  }

  const candidates = [metadata?.phone_number_id, metadata?.display_phone_number]
    .map(normalizePhone)
    .filter(Boolean);

  if (candidates.length > 0) {
    const { rows } = await pool.query(
      `SELECT id FROM workspaces
       WHERE regexp_replace(COALESCE(whatsapp_phone, ''), '[^0-9]', '', 'g') = ANY($1::text[])
       LIMIT 1`,
      [candidates],
    );
    if (rows[0]) return rows[0].id;
  }

  const { rows } = await pool.query(`SELECT id FROM workspaces LIMIT 2`);
  if (rows.length === 1) {
    logger.warn("[Webhook] Falling back to the only workspace for inbound WhatsApp webhook");
    return rows[0].id;
  }

  return null;
}

async function handleIncomingMessages(value) {
  const workspaceId = await resolveWorkspaceId(value?.metadata);

  if (!workspaceId) {
    logger.warn({ metadata: value?.metadata }, "[Webhook] Could not resolve workspace for WhatsApp webhook");
    return { processed: false, reason: "WORKSPACE_NOT_FOUND" };
  }

  const contactsByWaId = new Map((value?.contacts || []).map((contact) => [contact.wa_id, contact]));
  const processed = [];

  for (const message of value?.messages || []) {
    const phone = message.from;
    const contact = contactsByWaId.get(phone);
    const text = extractMessageText(message);

    if (!phone || !text) {
      logger.warn({ messageId: message?.id, type: message?.type }, "[Webhook] Skipping unsupported WhatsApp message");
      continue;
    }

    const result = await conversations.receiveInboundMessage(workspaceId, {
      phone,
      name: contact?.profile?.name || phone,
      text,
      mediaUrl: extractMediaUrl(message),
      source: "Facebook",
    });

    emitToWorkspace(workspaceId, "message:new", {
      contactId: result.contact.id,
      message: result.message,
    });
    emitToWorkspace(workspaceId, "lead:updated", result.contact);

    processed.push({ messageId: message.id || null, contactId: result.contact.id });
  }

  return { processed: processed.length > 0, messages: processed };
}

async function handleStatuses(value) {
  const statuses = value?.statuses || [];
  if (statuses.length > 0) {
    logger.info({ statuses }, "[Webhook] Received WhatsApp message status update");
  }
  return { processed: true, statuses: statuses.length };
}

router.get(
  "/whatsapp",
  asyncHandler(async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;

    if (!verifyToken) {
      throw new AppError("WhatsApp webhook verify token is not configured", 503, "WEBHOOK_VERIFY_TOKEN_NOT_CONFIGURED");
    }

    if (mode === "subscribe" && token === verifyToken && typeof challenge === "string") {
      logger.info("[Webhook] WhatsApp webhook verified by Meta");
      return res.status(200).type("text/plain").send(challenge);
    }

    throw new ForbiddenError("Invalid WhatsApp webhook verification token", "INVALID_WEBHOOK_TOKEN");
  }),
);

router.post(
  "/whatsapp",
  asyncHandler(async (req, res) => {
    const webhookData = parseJsonBody(req);
    verifyWebhookSignature(req);

    if (webhookData.object && webhookData.object !== "whatsapp_business_account") {
      throw new BadRequestError("Unsupported webhook object", "UNSUPPORTED_WEBHOOK_OBJECT");
    }

    const results = [];
    for (const entry of webhookData.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") {
          logger.info({ field: change.field }, "[Webhook] Ignoring unsupported WhatsApp webhook field");
          continue;
        }

        const value = change.value || {};
        if (Array.isArray(value.messages) && value.messages.length > 0) {
          results.push(await handleIncomingMessages(value));
        } else if (Array.isArray(value.statuses) && value.statuses.length > 0) {
          results.push(await handleStatuses(value));
        }
      }
    }

    res.status(200).json({ success: true, results });
  }),
);

export default router;
