const logger = require("../../config/logger");
const db = require("../../database");
const { v4: uuidv4 } = require("uuid");
const leadCaptureWorkflow = require("./workflows/lead-capture");
const appointmentBookingWorkflow = require("./workflows/appointment-booking");
const productInquiryWorkflow = require("./workflows/product-inquiry");
const { FAQWorkflow, FeedbackWorkflow } = require("./workflows/faq-feedback");

/**
 * Workflow Engine Service
 * Orchestrates automation workflows based on AI analysis
 */
class WorkflowEngine {
  /**
   * Execute a workflow based on message analysis
   * @param {Object} params
   * @returns {Promise<Object>} Workflow execution result
   */
  async executeWorkflow(params) {
    const {
      workspaceId,
      conversationId,
      messageId,
      phoneNumber,
      message,
      analysis,
    } = params;

    const startTime = Date.now();

    try {
      // 1. Find matching automation rule
      const rule = await this.findMatchingRule(workspaceId, analysis);

      if (!rule) {
        logger.info(
          `[Workflow] No matching rule for intent: ${analysis.intent}`,
        );
        return {
          executed: false,
          reason: "No matching workflow rule",
        };
      }

      // 2. Create analysis record
      const analysisId = await this.recordAnalysis(
        workspaceId,
        conversationId,
        messageId,
        phoneNumber,
        message,
        analysis,
      );

      // 3. Start workflow execution
      const executionId = uuidv4();
      await this.recordExecutionStart(executionId, workspaceId, rule.id, conversationId, analysisId);

      // 4. Execute workflow steps
      const result = await this.executeWorkflowSteps(
        workspaceId,
        rule,
        analysis,
        phoneNumber,
        conversationId,
      );

      // 5. Record execution result
      await this.recordExecutionResult(
        executionId,
        result,
        Date.now() - startTime,
      );

      // 6. Update automation usage metrics
      await this.updateUsageMetrics(workspaceId, rule.workflow_type, result.status);

      logger.info(
        `[Workflow] Executed ${rule.workflow_type} in ${Date.now() - startTime}ms`,
      );

      return {
        executed: true,
        executionId,
        workflowType: rule.workflow_type,
        result,
      };
    } catch (error) {
      logger.error("[Workflow] Execution error:", error);
      return {
        executed: false,
        error: error.message,
      };
    }
  }

  /**
   * Find matching automation rule for the analysis
   * @private
   */
  async findMatchingRule(workspaceId, analysis) {
    try {
      const [rules] = await db.query(
        `SELECT * FROM automation_rules 
         WHERE workspace_id = ? AND enabled = true
         ORDER BY FIELD(workflow_type, ?), created_at DESC
         LIMIT 1`,
        [workspaceId, analysis.suggested_workflow],
      );

      if (rules.length === 0) {
        // Fallback to FAQ rule
        const [faqRules] = await db.query(
          `SELECT * FROM automation_rules 
           WHERE workspace_id = ? AND workflow_type = 'faq' AND enabled = true
           LIMIT 1`,
          [workspaceId],
        );
        return faqRules[0] || null;
      }

      return rules[0];
    } catch (error) {
      logger.error("[Workflow] Error finding rule:", error);
      return null;
    }
  }

  /**
   * Record message analysis in database
   * @private
   */
  async recordAnalysis(
    workspaceId,
    conversationId,
    messageId,
    phoneNumber,
    message,
    analysis,
  ) {
    const analysisId = uuidv4();

    try {
      await db.query(
        `INSERT INTO automation_analyses 
         (id, workspace_id, conversation_id, message_id, phone_number, message_content,
          intent, sentiment, confidence_score, entities, action_required, 
          should_escalate, escalation_reason, suggested_workflow_type, analyzed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          analysisId,
          workspaceId,
          conversationId,
          messageId,
          phoneNumber,
          message,
          analysis.intent,
          analysis.sentiment,
          analysis.confidence_score,
          JSON.stringify(analysis.entities),
          analysis.action_required,
          analysis.should_escalate,
          analysis.escalation_reason,
          analysis.suggested_workflow,
        ],
      );

      return analysisId;
    } catch (error) {
      logger.error("[Workflow] Error recording analysis:", error);
      throw error;
    }
  }

  /**
   * Record workflow execution start
   * @private
   */
  async recordExecutionStart(
    executionId,
    workspaceId,
    ruleId,
    conversationId,
    analysisId,
  ) {
    try {
      await db.query(
        `INSERT INTO workflow_executions
         (id, workspace_id, automation_rule_id, conversation_id, analysis_id, status, input_data)
         VALUES (?, ?, ?, ?, ?, 'running', ?)`,
        [
          executionId,
          workspaceId,
          ruleId,
          conversationId,
          analysisId,
          JSON.stringify({}),
        ],
      );
    } catch (error) {
      logger.error("[Workflow] Error recording execution start:", error);
    }
  }

  /**
   * Execute workflow-specific steps
   * @private
   */
  async executeWorkflowSteps(
    workspaceId,
    rule,
    analysis,
    phoneNumber,
    conversationId,
  ) {
    const config = rule.workflow_config;

    try {
      // Get metadata needed for workflows
      const [connections] = await db.query(
        `SELECT access_token, phone_number_id FROM whatsapp_connections
         WHERE workspace_id = ? LIMIT 1`,
        [workspaceId],
      );

      const accessToken = connections[0]?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = connections[0]?.phone_number_id || process.env.WHATSAPP_PHONE_ID;

      switch (rule.workflow_type) {
        case "lead_capture":
          return await leadCaptureWorkflow.execute({
            workspaceId,
            conversationId,
            phoneNumber,
            senderName: "Customer",
            analysis,
            accessToken,
            phoneNumberId,
          });

        case "appointment_booking":
          return await appointmentBookingWorkflow.execute({
            workspaceId,
            conversationId,
            phoneNumber,
            senderName: "Customer",
            analysis,
            accessToken,
            phoneNumberId,
          });

        case "product_inquiry":
          return await productInquiryWorkflow.execute({
            workspaceId,
            conversationId,
            phoneNumber,
            senderName: "Customer",
            message: analysis?.message_content || "",
            analysis,
            accessToken,
            phoneNumberId,
          });

        case "faq":
          return await FAQWorkflow.execute({
            workspaceId,
            conversationId,
            phoneNumber,
            message: analysis?.message_content || "",
            analysis,
            accessToken,
            phoneNumberId,
          });

        case "feedback_collection":
          return await FeedbackWorkflow.execute({
            workspaceId,
            conversationId,
            phoneNumber,
            senderName: "Customer",
            accessToken,
            phoneNumberId,
          });

        default:
          return {
            status: "completed",
            message: "Workflow type not implemented",
            steps: [],
          };
      }
    } catch (error) {
      logger.error("[Workflow] Error in workflow steps:", error);

      return {
        status: "failed",
        message: error.message,
        steps: [
          {
            step_name: "error_handler",
            status: "failed",
            error: error.message,
          },
        ],
      };
    }
  }



  /**
   * Record workflow execution result
   * @private
   */
  async recordExecutionResult(executionId, result, duration) {
    try {
      await db.query(
        `UPDATE workflow_executions 
         SET status = ?, execution_duration_ms = ?, 
             output_data = ?, steps_executed = ?, completed_at = NOW()
         WHERE id = ?`,
        [result.status, duration, JSON.stringify(result), JSON.stringify(result.steps), executionId],
      );
    } catch (error) {
      logger.error("[Workflow] Error recording result:", error);
    }
  }

  /**
   * Update automation usage metrics
   * @private
   */
  async updateUsageMetrics(workspaceId, workflowType, executionStatus) {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Determine which metric to increment based on workflow type
      let updateQuery = `messages_analyzed = messages_analyzed + 1`;

      if (executionStatus === "completed") {
        updateQuery += `, automations_triggered = automations_triggered + 1`;

        if (workflowType === "lead_capture") {
          updateQuery += `, lead_captures = lead_captures + 1`;
        } else if (workflowType === "appointment_booking") {
          updateQuery += `, appointments_booked = appointments_booked + 1`;
        } else if (workflowType === "product_inquiry") {
          updateQuery += `, products_inquired = products_inquired + 1`;
        }
      }

      await db.query(
        `INSERT INTO automation_usage (id, workspace_id, date_recorded, ${updateQuery.split("=")[0].trim()})
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE ${updateQuery}`,
        [uuidv4(), workspaceId, today],
      );
    } catch (error) {
      logger.error("[Workflow] Error updating usage metrics:", error);
    }
  }

  /**
   * Get workflow execution history for a workspace
   */
  async getExecutionHistory(workspaceId, limit = 50, offset = 0) {
    try {
      const [executions] = await db.query(
        `SELECT we.*, ar.name as rule_name, ar.workflow_type
         FROM workflow_executions we
         LEFT JOIN automation_rules ar ON we.automation_rule_id = ar.id
         WHERE we.workspace_id = ?
         ORDER BY we.created_at DESC
         LIMIT ? OFFSET ?`,
        [workspaceId, limit, offset],
      );

      return executions;
    } catch (error) {
      logger.error("[Workflow] Error fetching execution history:", error);
      return [];
    }
  }

  /**
   * Get automation statistics
   */
  async getStatistics(workspaceId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [stats] = await db.query(
        `SELECT 
          SUM(messages_analyzed) as total_messages,
          SUM(automations_triggered) as total_automations,
          SUM(lead_captures) as total_leads,
          SUM(appointments_booked) as total_bookings,
          AVG(ai_response_time_avg_ms) as avg_response_time
         FROM automation_usage
         WHERE workspace_id = ? AND date_recorded >= ?`,
        [workspaceId, startDate.toISOString().split("T")[0]],
      );

      return stats[0] || {};
    } catch (error) {
      logger.error("[Workflow] Error fetching statistics:", error);
      return {};
    }
  }
}

module.exports = new WorkflowEngine();
