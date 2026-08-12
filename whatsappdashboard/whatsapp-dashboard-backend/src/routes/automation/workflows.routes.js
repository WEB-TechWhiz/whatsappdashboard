// const express = require("express");
import express from "express";
// const { v4: uuidv4 } = require("uuid");
import { v4 as uuidv4 } from "uuid";
// const requireAuth = require("../../middleware/auth");
import requireAuth from "../../middleware/auth.js";
// const { validateRequest } = require("../../middleware/validate.js");
import { validateRequest } from "../../middleware/validate.js";
// const { z } = require("zod");
import z from "zod";
// const db = require("../../config/db.js");
// const db = require("../../../db")
import db from "../../database.js";
// const aiAnalyzer = require("../../services/ai-agent/analyzer");
import aiAnalyzer from "../../services/ai-agent/analyzer.js";
// const workflowEngine = require("../../services/ai-agent/workflow-engine");
import workflowEngine from "../../services/ai-agent/workflow-engine.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";

const router = express.Router();

// Apply authentication middleware
router.use(requireAuth);

/**
 * GET /api/v1/automation/rules
 * List all automation rules for a workspace
 */
router.get(
  "/rules",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;

    const [rules] = await db.query(
      `SELECT id, name, description, trigger_type, workflow_type, enabled, created_at, updated_at
       FROM automation_rules
       WHERE workspace_id = ?
       ORDER BY created_at DESC`,
      [workspaceId],
    );

    res.json({ success: true, data: rules });
  }),
);

/**
 * POST /api/v1/automation/rules
 * Create a new automation rule
 */
router.post(
  "/rules",
  validateRequest(
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      trigger_type: z.enum(["message_received", "keyword_match", "time_based", "manual"]),
      workflow_type: z.enum([
        "lead_capture",
        "appointment_booking",
        "product_inquiry",
        "faq",
        "feedback_collection",
        "custom",
      ]),
      trigger_keywords: z.array(z.string()).optional(),
      workflow_config: z.record(z.any()),
    }),
  ),
  asyncHandler(async (req, res) => {
      const workspaceId = req.workspace.id;
      const { name, description, trigger_type, workflow_type, trigger_keywords, workflow_config } =
        req.body;

      const ruleId = uuidv4();

      await db.query(
        `INSERT INTO automation_rules 
         (id, workspace_id, name, description, trigger_type, workflow_type, 
          trigger_keywords, workflow_config, enabled, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, ?)`,
        [
          ruleId,
          workspaceId,
          name,
          description || null,
          trigger_type,
          workflow_type,
          JSON.stringify(trigger_keywords || []),
          JSON.stringify(workflow_config),
          req.user.id,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Automation rule created successfully",
        data: { id: ruleId },
      });
  }),
);

/**
 * PUT /api/v1/automation/rules/:ruleId
 * Update an automation rule
 */
router.put(
  "/rules/:ruleId",
  asyncHandler(async (req, res) => {
    const { ruleId } = req.params;
    const workspaceId = req.workspace.id;
    const { name, description, enabled, workflow_config } = req.body;

    // Verify rule belongs to workspace
    const [rules] = await db.query(
      `SELECT id FROM automation_rules WHERE id = ? AND workspace_id = ?`,
      [ruleId, workspaceId],
    );

    if (rules.length === 0) {
      throw new NotFoundError("Automation rule");
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }
    if (enabled !== undefined) {
      updates.push("enabled = ?");
      params.push(enabled);
    }
    if (workflow_config !== undefined) {
      updates.push("workflow_config = ?");
      params.push(JSON.stringify(workflow_config));
    }

    if (updates.length === 0) {
      throw new BadRequestError("No fields to update", "NO_FIELDS_TO_UPDATE");
    }

    params.push(ruleId);
    params.push(workspaceId);

    await db.query(
      `UPDATE automation_rules 
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = ? AND workspace_id = ?`,
      params,
    );

    res.json({
      success: true,
      message: "Automation rule updated successfully",
    });
  }),
);

/**
 * DELETE /api/v1/automation/rules/:ruleId
 * Delete an automation rule
 */
router.delete(
  "/rules/:ruleId",
  asyncHandler(async (req, res) => {
    const { ruleId } = req.params;
    const workspaceId = req.workspace.id;

    const [deleted] = await db.query(
      `DELETE FROM automation_rules WHERE id = ? AND workspace_id = ? RETURNING id`,
      [ruleId, workspaceId],
    );

    if (deleted.length === 0) {
      throw new NotFoundError("Automation rule");
    }

    res.json({ success: true, message: "Automation rule deleted successfully" });
  }),
);

/**
 * POST /api/v1/automation/analyze
 * Analyze a message for intent and entities
 */
router.post(
  "/analyze",
  validateRequest(
    z.object({
      message: z.string().min(1),
      sender_name: z.string().optional(),
      phone_number: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
      const workspaceId = req.workspace.id;
      const { message, sender_name, phone_number } = req.body;

      const analysis = await aiAnalyzer.analyzeMessage({
        message,
        senderName: sender_name || "Unknown",
        phoneNumber: phone_number || "Unknown",
        businessContext: req.workspace.business_name || "",
      });

      res.json({ success: true, data: analysis });
  }),
);

/**
 * POST /api/v1/automation/execute
 * Execute a workflow based on message analysis
 */
router.post(
  "/execute",
  validateRequest(
    z.object({
      conversation_id: z.string(),
      message_id: z.string(),
      phone_number: z.string(),
      message: z.string(),
      analysis: z.object({}).passthrough().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
      const workspaceId = req.workspace.id;
      const {
        conversation_id,
        message_id,
        phone_number,
        message,
        analysis: providedAnalysis,
      } = req.body;

      // Analyze message if not provided
      let analysis = providedAnalysis;
      if (!analysis) {
        analysis = await aiAnalyzer.analyzeMessage({
          message,
          senderName: "Customer",
          phoneNumber: phone_number,
          businessContext: req.workspace.business_name || "",
        });
      }

      // Execute workflow
      const result = await workflowEngine.executeWorkflow({
        workspaceId,
        conversationId: conversation_id,
        messageId: message_id,
        phoneNumber: phone_number,
        message,
        analysis,
      });

      res.json({
        success: true,
        message: "Workflow execution completed",
        data: result,
      });
  }),
);

/**
 * GET /api/v1/automation/executions
 * Get workflow execution history
 */
router.get(
  "/executions",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const executions = await workflowEngine.getExecutionHistory(workspaceId, limit, offset);

    res.json({ success: true, data: executions });
  }),
);

/**
 * GET /api/v1/automation/statistics
 * Get automation statistics
 */
router.get(
  "/statistics",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const daysBack = Math.min(parseInt(req.query.days_back) || 30, 365);

    const stats = await workflowEngine.getStatistics(workspaceId, daysBack);

    res.json({ success: true, data: stats });
  }),
);

/**
 * GET /api/v1/automation/analyses
 * Get message analyses
 */
router.get(
  "/analyses",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspace.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const [analyses] = await db.query(
      `SELECT id, message_content, intent, sentiment, confidence_score, 
              should_escalate, created_at
       FROM automation_analyses
       WHERE workspace_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [workspaceId, limit, offset],
    );

    res.json({ success: true, data: analyses });
  }),
);

export default router;
