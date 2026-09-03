// const express = require("express");
import express from "express";
// const requireAuth = require("../../middleware/auth");
import requireAuth from "../../middleware/auth.js";
// const { z } = require("zod");
import z from "zod";
// const { validateRequest } = require("../../middleware/validate");
import { validateRequest } from "../../middleware/validate.js";
// const routingEngine = require("../../services/ai-agent/routing-engine");
import routingEngine from "../../services/ai-agent/routing-engine.js";
// const db = require("../../config/db");
import db from "../../database.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { NotFoundError } from "../../utils/errors.js";

// const router = express.Router();
const router = express.Router();

// Apply authentication middleware
router.use(requireAuth);

/**
 * GET /api/v1/automation/escalations
 * Get active escalations for workspace
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const escalations = await routingEngine.getActiveEscalations(workspaceId, limit, offset);

    res.json({ success: true, data: escalations });
  }),
);

/**
 * GET /api/v1/automation/escalations/:escalationId
 * Get escalation details
 */
router.get(
  "/:escalationId",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const { escalationId } = req.params;

    const escalation = await routingEngine.getEscalationDetails(workspaceId, escalationId);

    if (!escalation) {
      throw new NotFoundError("Escalation");
    }

    res.json({ success: true, data: escalation });
  }),
);

/**
 * POST /api/v1/automation/escalations/:escalationId/reply
 * Agent sends reply to escalated conversation
 */
router.post(
  "/:escalationId/reply",
  validateRequest(
    z.object({
      message: z.string().min(1),
      phone_number: z.string(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const { escalationId } = req.params;
    const { message, phone_number } = req.body;
    const agentId = req.user.id;

    // Get WhatsApp connection details
    const [connections] = await db.query(
      `SELECT access_token, phone_number_id FROM whatsapp_connections
         WHERE workspace_id = ? LIMIT 1`,
      [workspaceId],
    );

    const accessToken = connections[0]?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = connections[0]?.phone_number_id || process.env.WHATSAPP_PHONE_ID;

    const result = await routingEngine.handleAgentReply({
      workspaceId,
      escalationId,
      agentId,
      replyMessage: message,
      phoneNumber: phone_number,
      accessToken,
      phoneNumberId,
    });

    res.json({
      success: true,
      message: "Reply sent successfully",
      data: result,
    });
  }),
);

/**
 * POST /api/v1/automation/escalations/:escalationId/resolve
 * Agent resolves escalation
 */
router.post(
  "/:escalationId/resolve",
  validateRequest(
    z.object({
      resolution: z.string().min(1),
    }),
  ),
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const { escalationId } = req.params;
    const { resolution } = req.body;
    const agentId = req.user.id;

    const result = await routingEngine.resolveEscalation({
      escalationId,
      resolution,
      agentId,
    });

    res.json({
      success: true,
      message: "Escalation resolved successfully",
      data: result,
    });
  }),
);

/**
 * GET /api/v1/automation/escalations/statistics/overview
 * Get escalation statistics
 */
router.get(
  "/statistics/overview",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const daysBack = Math.min(parseInt(req.query.days_back) || 30, 365);

    const stats = await routingEngine.getStatistics(workspaceId, daysBack);

    res.json({ success: true, data: stats });
  }),
);

/**
 * GET /api/v1/automation/escalations/wait-time
 * Get estimated wait time
 */
router.get(
  "/wait-time/estimate",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;

    const waitTime = await routingEngine.getEstimatedWaitTime(workspaceId);

    res.json({ success: true, data: waitTime });
  }),
);

export default router;
