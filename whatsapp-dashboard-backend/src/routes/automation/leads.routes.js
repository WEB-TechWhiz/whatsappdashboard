// const express = require("express");
import express from "express";
// const requireAuth = require("../../middleware/auth");
import requireAuth from "../../middleware/auth.js";
// const { z } = require("zod");
import z from "zod";
// const { validateRequest } = require("../../middleware/validate");
import { validateRequest } from "../../middleware/validate.js";
// const leadCaptureWorkflow = require("../../services/ai-agent/workflows/lead-capture");
import leadCaptureWorkflow from "../../services/ai-agent/workflows/lead-capture.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { NotFoundError } from "../../utils/errors.js";

// const router = express.Router();
const router = express.Router();

// Apply authentication middleware
router.use(requireAuth);

/**
 * GET /api/v1/automation/leads
 * Get all leads for workspace
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const status = req.query.status || null;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const leads = await leadCaptureWorkflow.listLeads(workspaceId, status, limit, offset);

    res.json({ success: true, data: leads });
  }),
);

/**
 * GET /api/v1/automation/leads/:leadId
 * Get lead details with interaction history
 */
router.get(
  "/:leadId",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const { leadId } = req.params;

    const lead = await leadCaptureWorkflow.getLeadDetails(workspaceId, leadId);

    if (!lead) {
      throw new NotFoundError("Lead");
    }

    res.json({ success: true, data: lead });
  }),
);

/**
 * POST /api/v1/automation/leads/:leadId/response
 * Handle qualification response from lead
 */
router.post(
  "/:leadId/response",
  validateRequest(
    z.object({
      response: z.string().min(1),
      phone_number: z.string(),
      analysis: z.object({}).passthrough().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
      const workspaceId = req.workspace.id;
      const { leadId } = req.params;
      const { response, phone_number, analysis } = req.body;

      const result = await leadCaptureWorkflow.handleQualificationResponse({
        workspaceId,
        leadId,
        phoneNumber: phone_number,
        response,
        analysis,
      });

      res.json({
        success: true,
        message: "Response recorded successfully",
        data: result,
      });
  }),
);

/**
 * GET /api/v1/automation/leads/statistics
 * Get lead statistics
 */
router.get(
  "/statistics/overview",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const daysBack = Math.min(parseInt(req.query.days_back) || 30, 365);

    const stats = await leadCaptureWorkflow.getLeadStatistics(workspaceId, daysBack);

    res.json({ success: true, data: stats });
  }),
);

// module.exports = router;
export default router;
