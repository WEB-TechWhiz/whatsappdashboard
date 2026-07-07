const logger = require("../../../config/logger");
const db = require("../../../config/db");
const { v4: uuidv4 } = require("uuid");
const webhookHandler = require("../webhook-handler");

/**
 * Lead Capture Workflow
 * Captures customer information and creates lead records
 */
class LeadCaptureWorkflow {
  /**
   * Execute lead capture workflow
   */
  async execute(params) {
    const {
      workspaceId,
      conversationId,
      phoneNumber,
      senderName,
      analysis,
      accessToken,
      phoneNumberId,
    } = params;

    const steps = [];

    try {
      // Step 1: Extract lead information from message analysis
      const leadData = this.extractLeadData(phoneNumber, senderName, analysis);
      steps.push({
        step_name: "extract_lead_info",
        status: "completed",
        data: leadData,
      });

      // Step 2: Check if lead already exists
      const existingLead = await this.findExistingLead(
        workspaceId,
        phoneNumber,
      );
      steps.push({
        step_name: "check_duplicate",
        status: "completed",
        is_new_lead: !existingLead,
      });

      // Step 3: Create or update lead record
      const leadId = existingLead
        ? existingLead.id
        : await this.createLead(workspaceId, conversationId, leadData);

      steps.push({
        step_name: "create_lead",
        status: "completed",
        lead_id: leadId,
      });

      // Step 4: Send welcome message with qualification questions
      const qualificationFlow = await this.getQualificationFlow(workspaceId);
      let responseMessage = "";

      if (qualificationFlow && qualificationFlow.meta_flow_id) {
        // Send WhatsApp Flow if configured
        const sendResult = await webhookHandler.sendFlow(
          phoneNumber,
          qualificationFlow.meta_flow_id,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_qualification_flow",
          status: sendResult.success ? "completed" : "failed",
          result: sendResult,
        });

        responseMessage = "Thank you! Please complete the form below.";
      } else {
        // Send text message with qualification questions
        responseMessage = this.generateQualificationMessage(leadData);

        const sendResult = await webhookHandler.sendMessage(
          phoneNumber,
          responseMessage,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_qualification_message",
          status: sendResult.success ? "completed" : "failed",
          result: sendResult,
        });
      }

      // Step 5: Update lead status
      await db.query(
        `UPDATE leads 
         SET status = 'qualified', qualification_date = NOW()
         WHERE id = ?`,
        [leadId],
      );

      steps.push({
        step_name: "update_lead_status",
        status: "completed",
      });

      return {
        status: "completed",
        lead_id: leadId,
        is_new_lead: !existingLead,
        message: "Lead captured and qualified successfully",
        steps,
      };
    } catch (error) {
      logger.error("[Lead Capture] Workflow error:", error);

      steps.push({
        step_name: "error_handler",
        status: "failed",
        error: error.message,
      });

      return {
        status: "failed",
        message: error.message,
        steps,
      };
    }
  }

  /**
   * Extract lead information from analysis
   * @private
   */
  extractLeadData(phoneNumber, senderName, analysis) {
    return {
      phone: phoneNumber,
      name: senderName || analysis?.entities?.name || "Unknown",
      email:
        analysis?.entities?.email || "",
      interest:
        analysis?.entities?.product_interest || analysis?.key_phrases?.[0] || "",
      budget:
        analysis?.entities?.budget || "",
      message_content: analysis?.action_required || "",
      intent: analysis?.intent || "inquiry",
      sentiment: analysis?.sentiment || "neutral",
    };
  }

  /**
   * Find existing lead by phone number
   * @private
   */
  async findExistingLead(workspaceId, phoneNumber) {
    try {
      const [leads] = await db.query(
        `SELECT id, status FROM leads 
         WHERE workspace_id = ? AND phone = ?
         LIMIT 1`,
        [workspaceId, phoneNumber],
      );

      return leads[0] || null;
    } catch (error) {
      logger.error("[Lead Capture] Error finding existing lead:", error);
      return null;
    }
  }

  /**
   * Create new lead record
   * @private
   */
  async createLead(workspaceId, conversationId, leadData) {
    try {
      const leadId = uuidv4();

      await db.query(
        `INSERT INTO leads 
         (id, workspace_id, conversation_id, name, email, phone, 
          interest, budget, status, source, captured_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', 'whatsapp', NOW())`,
        [
          leadId,
          workspaceId,
          conversationId,
          leadData.name,
          leadData.email || null,
          leadData.phone,
          leadData.interest || null,
          leadData.budget || null,
        ],
      );

      logger.info(`[Lead Capture] Created new lead: ${leadId}`);

      return leadId;
    } catch (error) {
      logger.error("[Lead Capture] Error creating lead:", error);
      throw error;
    }
  }

  /**
   * Get qualification flow for workspace
   * @private
   */
  async getQualificationFlow(workspaceId) {
    try {
      const [flows] = await db.query(
        `SELECT * FROM whatsapp_flows
         WHERE workspace_id = ? AND flow_type = 'lead_capture' 
         AND status = 'published'
         LIMIT 1`,
        [workspaceId],
      );

      return flows[0] || null;
    } catch (error) {
      logger.error("[Lead Capture] Error fetching qualification flow:", error);
      return null;
    }
  }

  /**
   * Generate qualification message
   * @private
   */
  generateQualificationMessage(leadData) {
    let message = `Thanks for reaching out${leadData.name ? ", " + leadData.name : ""}! 👋\n\n`;
    message +=
      "To help you better, could you please tell us more about your needs?\n\n";
    message +=
      "1. What product/service interests you most?\n";
    message +=
      "2. What's your timeline?\n";
    message +=
      "3. What's your budget range?\n\n";
    message +=
      "Reply with any details, or reply 'DETAILS' to fill out a form.";

    return message;
  }

  /**
   * Handle follow-up responses to qualification questions
   */
  async handleQualificationResponse(params) {
    const { workspaceId, leadId, phoneNumber, response, analysis } = params;

    try {
      // Extract additional information from response
      const updateData = {
        additional_info: response,
        last_interaction: new Date(),
      };

      // Update lead with new information
      if (analysis?.entities?.budget) {
        updateData.budget = analysis.entities.budget;
      }
      if (analysis?.entities?.email) {
        updateData.email = analysis.entities.email;
      }

      await db.query(
        `UPDATE leads 
         SET ${Object.keys(updateData)
           .map((k) => `${k} = ?`)
           .join(", ")}
         WHERE id = ? AND workspace_id = ?`,
        [...Object.values(updateData), leadId, workspaceId],
      );

      // Update lead status based on information completeness
      const completeness = this.calculateLeadCompleteness(updateData);
      const newStatus =
        completeness > 0.7 ? "ready_for_sales" : "qualified";

      await db.query(
        `UPDATE leads SET status = ? WHERE id = ?`,
        [newStatus, leadId],
      );

      return {
        status: "completed",
        lead_status: newStatus,
        completeness,
      };
    } catch (error) {
      logger.error("[Lead Capture] Error handling response:", error);
      throw error;
    }
  }

  /**
   * Calculate lead information completeness score
   * @private
   */
  calculateLeadCompleteness(leadData) {
    let score = 0;
    let totalFields = 5;

    if (leadData.name) score++;
    if (leadData.email) score++;
    if (leadData.phone) score++;
    if (leadData.interest) score++;
    if (leadData.budget) score++;

    return score / totalFields;
  }

  /**
   * Get lead by ID with full history
   */
  async getLeadDetails(workspaceId, leadId) {
    try {
      const [leads] = await db.query(
        `SELECT * FROM leads WHERE id = ? AND workspace_id = ?`,
        [leadId, workspaceId],
      );

      if (leads.length === 0) return null;

      const lead = leads[0];

      // Get interaction history
      const [interactions] = await db.query(
        `SELECT id, content, direction, created_at FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at DESC
         LIMIT 20`,
        [lead.conversation_id],
      );

      return {
        ...lead,
        interactions,
      };
    } catch (error) {
      logger.error("[Lead Capture] Error fetching lead details:", error);
      return null;
    }
  }

  /**
   * List leads for workspace
   */
  async listLeads(workspaceId, status = null, limit = 50, offset = 0) {
    try {
      let query = `SELECT id, name, email, phone, interest, budget, status, captured_at
                   FROM leads WHERE workspace_id = ?`;
      const params = [workspaceId];

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }

      query += ` ORDER BY captured_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [leads] = await db.query(query, params);

      return leads;
    } catch (error) {
      logger.error("[Lead Capture] Error listing leads:", error);
      return [];
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStatistics(workspaceId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [stats] = await db.query(
        `SELECT 
          COUNT(*) as total_leads,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
          SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified_leads,
          SUM(CASE WHEN status = 'ready_for_sales' THEN 1 ELSE 0 END) as ready_for_sales,
          SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
          AVG(DATEDIFF(updated_at, captured_at)) as avg_days_to_conversion
         FROM leads
         WHERE workspace_id = ? AND captured_at >= ?`,
        [workspaceId, startDate.toISOString().split("T")[0]],
      );

      return stats[0] || {};
    } catch (error) {
      logger.error("[Lead Capture] Error fetching statistics:", error);
      return {};
    }
  }
}

module.exports = new LeadCaptureWorkflow();
