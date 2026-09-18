import express from "express";
import { v4 as uuidv4 } from "uuid";
import requireAuth from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validate.js";
import z from "zod";
import pool from "../../config/db.js";
import aiAnalyzer from "../../services/ai-agent/analyzer.js";
import workflowEngine from "../../services/ai-agent/workflow-engine.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/v1/automation/rules
 * List all automation rules for a workspace
 */
router.get(
  "/rules",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspaceId;

    const { rows } = await pool.query(
      `SELECT id, name, description, trigger_type, workflow_type, enabled, created_at, updated_at
       FROM automation_rules
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [workspaceId],
    );

    res.json({ success: true, data: rows });
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
    const workspaceId = req.workspaceId;
    const { name, description, trigger_type, workflow_type, trigger_keywords, workflow_config } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO automation_rules 
       (workspace_id, name, description, trigger_type, workflow_type, 
        trigger_keywords, workflow_config, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        workspaceId,
        name,
        description || null,
        trigger_type,
        workflow_type,
        JSON.stringify(trigger_keywords || []),
        JSON.stringify(workflow_config),
      ],
    );

    res.status(201).json({
      success: true,
      message: "Automation rule created successfully",
      data: rows[0],
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
    const workspaceId = req.workspaceId;
    const { name, description, enabled, workflow_config } = req.body;

    const existing = await pool.query(
      `SELECT id FROM automation_rules WHERE id = $1 AND workspace_id = $2`,
      [ruleId, workspaceId],
    );

    if (existing.rows.length === 0) {
      throw new NotFoundError("Automation rule");
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      params.push(name);
      updates.push(`name = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${params.length}`);
    }
    if (enabled !== undefined) {
      params.push(enabled);
      updates.push(`enabled = $${params.length}`);
    }
    if (workflow_config !== undefined) {
      params.push(JSON.stringify(workflow_config));
      updates.push(`workflow_config = $${params.length}`);
    }

    if (updates.length === 0) {
      throw new BadRequestError("No fields to update", "NO_FIELDS_TO_UPDATE");
    }

    params.push(ruleId);
    const ruleIdIdx = params.length;
    params.push(workspaceId);
    const workspaceIdIdx = params.length;

    await pool.query(
      `UPDATE automation_rules 
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${ruleIdIdx} AND workspace_id = $${workspaceIdIdx}`,
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
    const workspaceId = req.workspaceId;

    const { rows } = await pool.query(
      `DELETE FROM automation_rules WHERE id = $1 AND workspace_id = $2 RETURNING id`,
      [ruleId, workspaceId],
    );

    if (rows.length === 0) {
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
    const { message, sender_name, phone_number } = req.body;

    const analysis = await aiAnalyzer.analyzeMessage({
      message,
      senderName: sender_name || "Unknown",
      phoneNumber: phone_number || "Unknown",
      businessContext: req.workspace?.name || "",
    });

    res.json({ success: true, data: analysis });
  }),
);

/**
 * GET /api/v1/automation/analyses
 * Get message analyses
 */
router.get(
  "/analyses",
  asyncHandler(async (req, res) => {
    const workspaceId = req.workspaceId;
    const limit = Math.min(Number.parseInt(req.query.limit) || 50, 100);
    const offset = Number.parseInt(req.query.offset) || 0;

    const { rows } = await pool.query(
      `SELECT id, message_content, intent, sentiment, confidence_score, 
              should_escalate, created_at
       FROM automation_analyses
       WHERE workspace_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [workspaceId, limit, offset],
    );

    res.json({ success: true, data: rows });
  }),
);

export default router;
