import express from "express";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ForbiddenError } from "../utils/errors.js";
import * as adminOps from "../services/admin-operations.service.js";
import * as pricingService from "../services/whatsapp-pricing.service.js";

const router = express.Router();

router.use(requireAuth);

// Admin authorization check middleware
router.use((req, res, next) => {
  // In initial build, workspace user or superadmin flag is checked
  if (req.user && req.user.is_admin === false) {
    throw new ForbiddenError("Super-admin privileges required for platform operations", "ADMIN_REQUIRED");
  }
  next();
});

router.get(
  "/admin/overview",
  asyncHandler(async (req, res) => {
    res.json(await adminOps.getPlatformOverview());
  }),
);

router.get(
  "/admin/connections",
  asyncHandler(async (req, res) => {
    res.json(
      await adminOps.listSystemConnections({
        status: req.query.status,
        limit: req.query.limit,
      }),
    );
  }),
);

router.post(
  "/admin/kill-switch",
  asyncHandler(async (req, res) => {
    const { workspaceId, paused, reason } = req.body;
    res.json(
      await adminOps.toggleWorkspaceKillSwitch(req.user.id, {
        workspaceId,
        paused: Boolean(paused),
        reason,
      }),
    );
  }),
);

router.get(
  "/admin/audit-logs",
  asyncHandler(async (req, res) => {
    res.json(
      await adminOps.listSystemAuditLogs({
        workspaceId: req.query.workspaceId,
        eventType: req.query.eventType,
        limit: req.query.limit,
      }),
    );
  }),
);

router.get(
  "/admin/pricing/rates",
  asyncHandler(async (req, res) => {
    res.json(
      await pricingService.listRates({
        countryCode: req.query.countryCode,
        category: req.query.category,
      }),
    );
  }),
);

router.post(
  "/admin/pricing/rates",
  asyncHandler(async (req, res) => {
    const { countryCode, category, rate, currency, provider } = req.body;
    res.status(201).json(
      await pricingService.upsertRate({
        countryCode,
        category,
        rate,
        currency,
        provider,
      }),
    );
  }),
);

export default router;
