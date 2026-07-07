const express = require("express");
const { v4: uuidv4 } = require("uuid");
const requireAuth = require("../../middleware/auth");
const { validateRequest } = require("../../middleware/validate.js");
const { z } = require("zod");
const db = require("../../config/db.js");
// const db = require("../../../db")
const aiAnalyzer = require("../../services/ai-agent/analyzer");
const workflowEngine = require("../../services/ai-agent/workflow-engine");
const logger = require("../../config/logger.js");

const router = express.Router();

// Apply authentication middleware
router.use(requireAuth);

/**
 * GET /api/v1/automation/rules
 * List all automation rules for a workspace
 */
router.get("/rules", async (req, res) => {
  try {
    const workspaceId = req.workspace.id;

    const [rules] = await db.query(
      `SELECT id, name, description, trigger_type, workflow_type, enabled, created_at, updated_at
       FROM automation_rules
       WHERE workspace_id = ?
       ORDER BY created_at DESC`,
      [workspaceId],
    );

    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error("[Automation] Error fetching rules:", error);
    res.status(500).json({ error: "Failed to fetch automation rules" });
  }
});

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
      trigger_type: z.enum([
        "message_received",
        "keyword_match",
        "time_based",
        "manual",
      ]),
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
  async (req, res) => {
    try {
      const workspaceId = req.workspace.id;
      const {
        name,
        description,
        trigger_type,
        workflow_type,
        trigger_keywords,
        workflow_config,
      } = req.body;

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
    } catch (error) {
      logger.error("[Automation] Error creating rule:", error);
      res.status(500).json({ error: "Failed to create automation rule" });
    }
  },
);

/**
 * PUT /api/v1/automation/rules/:ruleId
 * Update an automation rule
 */
router.put("/rules/:ruleId", async (req, res) => {
  try {
    const { ruleId } = req.params;
    const workspaceId = req.workspace.id;
    const { name, description, enabled, workflow_config } = req.body;

    // Verify rule belongs to workspace
    const [rules] = await db.query(
      `SELECT id FROM automation_rules WHERE id = ? AND workspace_id = ?`,
      [ruleId, workspaceId],
    );

    if (rules.length === 0) {
      return res.status(404).json({ error: "Automation rule not found" });
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
      return res.status(400).json({ error: "No fields to update" });
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
  } catch (error) {
    logger.error("[Automation] Error updating rule:", error);
    res.status(500).json({ error: "Failed to update automation rule" });
  }
});

/**
 * DELETE /api/v1/automation/rules/:ruleId
 * Delete an automation rule
 */
router.delete("/rules/:ruleId", async (req, res) => {
  try {
    const { ruleId } = req.params;
    const workspaceId = req.workspace.id;

    const result = await db.query(
      `DELETE FROM automation_rules WHERE id = ? AND workspace_id = ?`,
      [ruleId, workspaceId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Automation rule not found" });
    }

    res.json({ success: true, message: "Automation rule deleted successfully" });
  } catch (error) {
    logger.error("[Automation] Error deleting rule:", error);
    res.status(500).json({ error: "Failed to delete automation rule" });
  }
});

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
  async (req, res) => {
    try {
      const workspaceId = req.workspace.id;
      const { message, sender_name, phone_number } = req.body;

      const analysis = await aiAnalyzer.analyzeMessage({
        message,
        senderName: sender_name || "Unknown",
        phoneNumber: phone_number || "Unknown",
        businessContext: req.workspace.business_name || "",
      });

      res.json({ success: true, data: analysis });
    } catch (error) {
      logger.error("[Automation] Error analyzing message:", error);
      res.status(500).json({ error: "Failed to analyze message" });
    }
  },
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
  async (req, res) => {
    try {
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
    } catch (error) {
      logger.error("[Automation] Error executing workflow:", error);
      res.status(500).json({ error: "Failed to execute workflow" });
    }
  },
);

/**
 * GET /api/v1/automation/executions
 * Get workflow execution history
 */
router.get("/executions", async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const executions = await workflowEngine.getExecutionHistory(
      workspaceId,
      limit,
      offset,
    );

    res.json({ success: true, data: executions });
  } catch (error) {
    logger.error("[Automation] Error fetching executions:", error);
    res.status(500).json({ error: "Failed to fetch executions" });
  }
});

/**
 * GET /api/v1/automation/statistics
 * Get automation statistics
 */
router.get("/statistics", async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const daysBack = Math.min(parseInt(req.query.days_back) || 30, 365);

    const stats = await workflowEngine.getStatistics(workspaceId, daysBack);

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error("[Automation] Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

/**
 * GET /api/v1/automation/analyses
 * Get message analyses
 */
router.get("/analyses", async (req, res) => {
  try {
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
  } catch (error) {
    logger.error("[Automation] Error fetching analyses:", error);
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

module.exports = router;
