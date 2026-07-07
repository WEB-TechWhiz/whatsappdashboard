const logger = require("../../config/logger");
const db = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const webhookHandler = require("./webhook-handler");

/**
 * Human Routing & Escalation Engine
 * Routes complex queries to appropriate human agents
 */
class RoutingEngine {
  /**
   * Determine if message should be escalated to human
   */
  async shouldEscalate(params) {
    const { workspaceId, analysis, conversationId, phoneNumber } = params;

    // Escalation triggers
    const triggers = [
      // AI marked for escalation
      () => analysis.should_escalate,

      // Negative sentiment with high confidence
      () =>
        analysis.sentiment === "negative" && analysis.confidence_score > 0.8,

      // Intent unknown or classified as complaint
      () => ["unknown", "complaint"].includes(analysis.intent),

      // Urgency level is high
      () => analysis.urgency_level === "high",
    ];

    for (const trigger of triggers) {
      if (trigger()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Route conversation to appropriate agent
   */
  async routeToAgent(params) {
    const {
      workspaceId,
      conversationId,
      phoneNumber,
      senderName,
      message,
      analysis,
      accessToken,
      phoneNumberId,
    } = params;

    try {
      // Step 1: Find best agent for this issue
      const agent = await this.findBestAgent(workspaceId, analysis);

      if (!agent) {
        logger.warn("[Routing] No available agents for routing");
        return {
          routed: false,
          reason: "No available agents",
        };
      }

      // Step 2: Create escalation record
      const escalationId = uuidv4();

      await db.query(
        `INSERT INTO escalations 
         (id, workspace_id, conversation_id, phone_number, customer_name, 
          agent_id, reason, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          escalationId,
          workspaceId,
          conversationId,
          phoneNumber,
          senderName,
          agent.id,
          analysis.escalation_reason || analysis.intent,
        ],
      );

      // Step 3: Update conversation to assign agent
      await db.query(
        `UPDATE conversations SET assigned_agent_id = ?, status = 'escalated'
         WHERE id = ?`,
        [agent.id, conversationId],
      );

      // Step 4: Notify agent (via email, slack, dashboard, etc.)
      await this.notifyAgent(agent, {
        customerName: senderName,
        phoneNumber,
        message,
        analysis,
      });

      // Step 5: Send acknowledgment to customer
      const acknowledgment =
        `Thanks for your message! An agent will respond shortly. Your case #${escalationId.substring(0, 8).toUpperCase()}.`;

      await webhookHandler.sendMessage(
        phoneNumber,
        acknowledgment,
        accessToken,
        phoneNumberId,
      );

      logger.info(
        `[Routing] Conversation routed to agent ${agent.id}: ${escalationId}`,
      );

      return {
        routed: true,
        escalation_id: escalationId,
        agent: agent.name,
      };
    } catch (error) {
      logger.error("[Routing] Error routing to agent:", error);
      return {
        routed: false,
        error: error.message,
      };
    }
  }

  /**
   * Find best available agent for the conversation
   * @private
   */
  async findBestAgent(workspaceId, analysis) {
    try {
      // Find agents who specialize in this intent/category
      const specialty = this.getAgentSpecialty(analysis.intent);

      const [agents] = await db.query(
        `SELECT u.id, u.name, u.email, 
                COUNT(e.id) as active_conversations
         FROM users u
         LEFT JOIN escalations e ON u.id = e.agent_id 
           AND e.status NOT IN ('resolved', 'closed')
         WHERE u.workspace_id = ? 
         AND u.role IN ('agent', 'admin')
         AND u.status = 'active'
         ${specialty ? `AND (u.specialties LIKE ? OR u.role = 'admin')` : ""}
         GROUP BY u.id
         ORDER BY active_conversations ASC
         LIMIT 1`,
        specialty
          ? [workspaceId, `%${specialty}%`]
          : [workspaceId],
      );

      return agents[0] || null;
    } catch (error) {
      logger.error("[Routing] Error finding agent:", error);
      return null;
    }
  }

  /**
   * Get agent specialty for intent
   * @private
   */
  getAgentSpecialty(intent) {
    const specialtyMap = {
      complaint: "complaints",
      booking_request: "scheduling",
      product_question: "sales",
      billing: "billing",
      technical: "support",
    };

    return specialtyMap[intent] || null;
  }

  /**
   * Notify agent of new escalation
   * @private
   */
  async notifyAgent(agent, context) {
    try {
      // Send via email
      logger.info(
        `[Routing] Would send email to ${agent.email} about ${context.customerName}`,
      );

      // In production, integrate with email service
      // await emailService.sendEscalationNotification(agent.email, context);

      // Could also integrate with Slack, Teams, etc.
      // logger.info(`[Routing] New escalation: ${context.customerName}`);
    } catch (error) {
      logger.error("[Routing] Error notifying agent:", error);
    }
  }

  /**
   * Get estimated wait time
   */
  async getEstimatedWaitTime(workspaceId) {
    try {
      // Get avg resolution time
      const [stats] = await db.query(
        `SELECT 
          AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_resolution_minutes,
          COUNT(*) as total_escalations
         FROM escalations
         WHERE workspace_id = ? AND resolved_at IS NOT NULL`,
        [workspaceId],
      );

      const avgTime = stats[0]?.avg_resolution_minutes || 15;

      // Count active escalations
      const [active] = await db.query(
        `SELECT COUNT(*) as count FROM escalations
         WHERE workspace_id = ? AND status = 'pending'`,
        [workspaceId],
      );

      const activeCount = active[0]?.count || 0;

      // Estimate: (activeCount * avgTime) + buffer
      const estimatedMinutes = activeCount * avgTime + 2;

      return {
        estimated_minutes: Math.max(1, Math.min(60, estimatedMinutes)),
        queue_size: activeCount,
        avg_resolution_time: Math.round(avgTime),
      };
    } catch (error) {
      logger.error("[Routing] Error calculating wait time:", error);
      return {
        estimated_minutes: 5,
        queue_size: 0,
        avg_resolution_time: 15,
      };
    }
  }

  /**
   * Handle agent assignment/reply
   */
  async handleAgentReply(params) {
    const {
      workspaceId,
      escalationId,
      agentId,
      replyMessage,
      phoneNumber,
      accessToken,
      phoneNumberId,
    } = params;

    try {
      // Send agent's message to customer
      const sendResult = await webhookHandler.sendMessage(
        phoneNumber,
        replyMessage,
        accessToken,
        phoneNumberId,
      );

      if (!sendResult.success) {
        throw new Error("Failed to send message to customer");
      }

      // Record agent message
      await db.query(
        `INSERT INTO escalation_messages 
         (id, escalation_id, agent_id, message, direction, status)
         VALUES (?, ?, ?, ?, 'outbound', 'sent')`,
        [uuidv4(), escalationId, agentId, replyMessage],
      );

      return { success: true, message_id: sendResult.messageId };
    } catch (error) {
      logger.error("[Routing] Error handling agent reply:", error);
      throw error;
    }
  }

  /**
   * Resolve escalation
   */
  async resolveEscalation(params) {
    const { escalationId, resolution, agentId } = params;

    try {
      await db.query(
        `UPDATE escalations 
         SET status = 'resolved', resolution_notes = ?, 
             resolved_at = NOW(), resolved_by = ?
         WHERE id = ?`,
        [resolution, agentId, escalationId],
      );

      logger.info(`[Routing] Escalation resolved: ${escalationId}`);

      return { success: true };
    } catch (error) {
      logger.error("[Routing] Error resolving escalation:", error);
      throw error;
    }
  }

  /**
   * Get escalation details
   */
  async getEscalationDetails(workspaceId, escalationId) {
    try {
      const [escalations] = await db.query(
        `SELECT e.*, u.name as agent_name
         FROM escalations e
         LEFT JOIN users u ON e.agent_id = u.id
         WHERE e.id = ? AND e.workspace_id = ?`,
        [escalationId, workspaceId],
      );

      if (escalations.length === 0) return null;

      const escalation = escalations[0];

      // Get conversation messages
      const [messages] = await db.query(
        `SELECT * FROM messages WHERE conversation_id = ?
         ORDER BY created_at ASC LIMIT 50`,
        [escalation.conversation_id],
      );

      // Get escalation-specific messages
      const [escalationMessages] = await db.query(
        `SELECT * FROM escalation_messages WHERE escalation_id = ?
         ORDER BY created_at ASC`,
        [escalationId],
      );

      return {
        ...escalation,
        conversation_messages: messages,
        escalation_messages: escalationMessages,
      };
    } catch (error) {
      logger.error("[Routing] Error fetching escalation:", error);
      return null;
    }
  }

  /**
   * Get active escalations for workspace
   */
  async getActiveEscalations(workspaceId, limit = 50, offset = 0) {
    try {
      const [escalations] = await db.query(
        `SELECT e.*, u.name as agent_name,
                COUNT(em.id) as message_count
         FROM escalations e
         LEFT JOIN users u ON e.agent_id = u.id
         LEFT JOIN escalation_messages em ON e.id = em.escalation_id
         WHERE e.workspace_id = ? AND e.status IN ('pending', 'in_progress')
         GROUP BY e.id
         ORDER BY e.created_at ASC
         LIMIT ? OFFSET ?`,
        [workspaceId, limit, offset],
      );

      return escalations;
    } catch (error) {
      logger.error("[Routing] Error fetching escalations:", error);
      return [];
    }
  }

  /**
   * Get escalation statistics
   */
  async getStatistics(workspaceId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [stats] = await db.query(
        `SELECT 
          COUNT(*) as total_escalations,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
          AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_resolution_time_minutes
         FROM escalations
         WHERE workspace_id = ? AND created_at >= ?`,
        [workspaceId, startDate.toISOString().split("T")[0]],
      );

      return stats[0] || {};
    } catch (error) {
      logger.error("[Routing] Error fetching statistics:", error);
      return {};
    }
  }
}

module.exports = new RoutingEngine();
