const express = require("express");
const requireAuth = require("../../middleware/auth");
const z = require("zod");
const { validateRequest } = require("../../middleware/validation");
const routingEngine = require("../../services/ai-agent/routing-engine");
const db = require("../../database");
const logger = require("../../config/logger");

const router = express.Router();

// Apply authentication middleware
router.use(requireAuth);

/**
 * GET /api/v1/automation/escalations
 * Get active escalations for workspace
 */
router.get("/", async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const escalations = await routingEngine.getActiveEscalations(
      workspaceId,
      limit,
      offset,
    );

    res.json({ success: true, data: escalations });
  } catch (error) {
    logger.error("[Escalations API] Error fetching escalations:", error);
    res.status(500).json({ error: "Failed to fetch escalations" });
  }
});

/**
 * GET /api/v1/automation/escalations/:escalationId
 * Get escalation details
 */
router.get("/:escalationId", async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { escalationId } = req.params;

    const escalation = await routingEngine.getEscalationDetails(
      workspaceId,
      escalationId,
    );

    if (!escalation) {
      return res.status(404).json({ error: "Escalation not found" });
    }

    res.json({ success: true, data: escalation });
  } catch (error) {
    logger.error("[Escalations API] Error fetching escalation:", error);
    res.status(500).json({ error: "Failed to fetch escalation" });
  }
});

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
  async (req, res) => {
    try {
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
    } catch (error) {
      logger.error("[Escalations API] Error sending reply:", error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  },
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
  async (req, res) => {
    try {
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
    } catch (error) {
      logger.error("[Escalations API] Error resolving escalation:", error);
      res.status(500).json({ error: "Failed to resolve escalation" });
    }
  },
);

/**
 * GET /api/v1/automation/escalations/statistics/overview
 * Get escalation statistics
 */
router.get("/statistics/overview", async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const daysBack = Math.min(parseInt(req.query.days_back) || 30, 365);

    const stats = await routingEngine.getStatistics(workspaceId, daysBack);

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error("[Escalations API] Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

/**
 * GET /api/v1/automation/escalations/wait-time
 * Get estimated wait time
 */
router.get("/wait-time/estimate", async (req, res) => {
  try {
    const workspaceId = req.workspace.id;

    const waitTime = await routingEngine.getEstimatedWaitTime(workspaceId);

    res.json({ success: true, data: waitTime });
  } catch (error) {
    logger.error("[Escalations API] Error getting wait time:", error);
    res.status(500).json({ error: "Failed to get wait time" });
  }
});

module.exports = router;
