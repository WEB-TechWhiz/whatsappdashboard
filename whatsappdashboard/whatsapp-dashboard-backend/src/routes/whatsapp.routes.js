import express from "express";
import pool from "../config/db.js";
import requireAuth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { NotFoundError } from "../utils/errors.js";
import * as schemas from "../validators/schemas.js";
import * as compliance from "../services/whatsapp-compliance.service.js";
import * as whatsappConnections from "../services/whatsapp-connections.service.js";
import * as embeddedSignup from "../services/meta-embedded-signup.service.js";
import * as usage from "../services/whatsapp-usage.service.js";

const router = express.Router();
router.use(requireAuth);

router.get(
  "/whatsapp/connection",
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.getConnection(req.workspaceId));
  }),
);

router.get(
  "/whatsapp/embedded-signup/config",
  asyncHandler(async (req, res) => {
    res.json(embeddedSignup.getPublicConfig());
  }),
);

router.post(
  "/whatsapp/embedded-signup/complete",
  validate(schemas.completeEmbeddedSignup),
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.completeEmbeddedSignup(req.workspaceId, req.body));
  }),
);

router.post(
  "/whatsapp/connect",
  asyncHandler(async (req, res) => {
    res.status(202).json(await whatsappConnections.initiateConnection(req.workspaceId));
  }),
);

router.post(
  "/whatsapp/disconnect",
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.disconnectConnection(req.workspaceId));
  }),
);

router.post(
  "/whatsapp/reconnect",
  asyncHandler(async (req, res) => {
    res.status(202).json(await whatsappConnections.reconnectConnection(req.workspaceId));
  }),
);

router.post(
  "/whatsapp/health-check",
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.healthCheckConnection(req.workspaceId));
  }),
);

router.post(
  "/whatsapp/discover-assets",
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.discoverAssets(req.workspaceId));
  }),
);

router.post(
  "/whatsapp/subscribe-webhook",
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.subscribeWebhook(req.workspaceId));
  }),
);

router.get(
  "/whatsapp/compliance/settings",
  asyncHandler(async (req, res) => {
    res.json(await compliance.getSettings(req.workspaceId));
  }),
);

router.put(
  "/whatsapp/compliance/settings",
  validate(schemas.updateComplianceSettings),
  asyncHandler(async (req, res) => {
    res.json(
      await compliance.updateSettings(req.workspaceId, req.body, {
        actorType: "WORKSPACE_USER",
        actorId: req.user?.id,
      }),
    );
  }),
);

router.put(
  "/whatsapp/contacts/:id/preference",
  validate(schemas.updateContactPreference),
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, phone FROM contacts WHERE id = $1 AND workspace_id = $2`,
      [req.params.id, req.workspaceId],
    );
    const contact = rows[0];
    if (!contact) throw new NotFoundError("Contact");

    res.json(
      await compliance.setContactPreference(req.workspaceId, {
        contactId: contact.id,
        phone: contact.phone,
        optedOut: req.body.optedOut,
        source: "WORKSPACE_USER",
        reason: req.body.reason || null,
      }),
    );
  }),
);

router.get(
  "/whatsapp/usage",
  asyncHandler(async (req, res) => {
    res.json(
      await usage.listUsage(req.workspaceId, {
        limit: req.query.limit,
        billingStatus: req.query.billingStatus,
      }),
    );
  }),
);

router.get(
  "/whatsapp/usage/summary",
  asyncHandler(async (req, res) => {
    res.json(await usage.getUsageSummary(req.workspaceId, { days: req.query.days }));
  }),
);

router.put(
  "/whatsapp/connection/manual",
  validate(schemas.updateWhatsappSettings),
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.saveManualConnection(req.workspaceId, req.body));
  }),
);

export default router;
