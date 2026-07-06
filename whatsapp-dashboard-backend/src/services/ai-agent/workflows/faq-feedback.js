const logger = require("../../../utils/logger");
const db = require("../../../database");
const { v4: uuidv4 } = require("uuid");
const webhookHandler = require("../webhook-handler");
const aiAnalyzer = require("../analyzer");

/**
 * FAQ Workflow
 * Handles common questions and provides instant answers
 */
class FAQWorkflow {
  /**
   * Execute FAQ workflow
   */
  async execute(params) {
    const {
      workspaceId,
      conversationId,
      phoneNumber,
      message,
      analysis,
      accessToken,
      phoneNumberId,
    } = params;

    const steps = [];

    try {
      // Step 1: Search FAQ database
      const faqResults = await this.searchFAQDatabase(
        workspaceId,
        message,
        analysis?.key_phrases || [],
      );

      steps.push({
        step_name: "search_faq",
        status: "completed",
        results_found: faqResults.length,
      });

      if (faqResults.length === 0) {
        // Step 2a: No FAQ found - Generate AI response
        const aiResponse = await aiAnalyzer.generateResponse(
          message,
          analysis,
          "You are a helpful customer support agent",
        );

        const sendResult = await webhookHandler.sendMessage(
          phoneNumber,
          aiResponse,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_ai_response",
          status: sendResult.success ? "completed" : "failed",
        });

        // Record this as an unanswered question for manual review
        await this.recordUnansweredQuestion(workspaceId, message, analysis);
      } else {
        // Step 2b: Send FAQ answer
        const bestMatch = faqResults[0];
        const sendResult = await webhookHandler.sendMessage(
          phoneNumber,
          bestMatch.answer,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_faq_answer",
          status: sendResult.success ? "completed" : "failed",
          faq_id: bestMatch.id,
        });

        // Record FAQ usage
        await this.recordFAQUsage(workspaceId, bestMatch.id);
      }

      // Step 3: Ask for feedback
      const feedbackMessage =
        "Was this helpful? Reply 'YES' or 'NO' or ask another question!";

      await webhookHandler.sendMessage(
        phoneNumber,
        feedbackMessage,
        accessToken,
        phoneNumberId,
      );

      steps.push({
        step_name: "ask_feedback",
        status: "completed",
      });

      return {
        status: "completed",
        message: "FAQ response sent successfully",
        steps,
      };
    } catch (error) {
      logger.error("[FAQ] Workflow error:", error);

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
   * Search FAQ database
   * @private
   */
  async searchFAQDatabase(workspaceId, question, keywords = []) {
    try {
      // Create search query
      let query =
        `SELECT id, question, answer FROM faq_items 
         WHERE workspace_id = ? AND published = true AND (`;

      const params = [workspaceId];

      // Search by question similarity
      query += `question LIKE ?`;
      params.push(`%${question}%`);

      // Also search by keywords
      for (const keyword of keywords.slice(0, 3)) {
        query += ` OR answer LIKE ?`;
        params.push(`%${keyword}%`);
      }

      query += `) ORDER BY relevance_score DESC LIMIT 3`;

      const [results] = await db.query(query, params);

      return results;
    } catch (error) {
      logger.error("[FAQ] Error searching database:", error);
      return [];
    }
  }

  /**
   * Record unanswered question for manual review
   * @private
   */
  async recordUnansweredQuestion(workspaceId, question, analysis) {
    try {
      const recordId = uuidv4();

      await db.query(
        `INSERT INTO faq_unanswered_questions 
         (id, workspace_id, question, intent, sentiment, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [recordId, workspaceId, question, analysis?.intent, analysis?.sentiment],
      );
    } catch (error) {
      logger.error("[FAQ] Error recording unanswered question:", error);
    }
  }

  /**
   * Record FAQ usage
   * @private
   */
  async recordFAQUsage(workspaceId, faqId) {
    try {
      await db.query(
        `UPDATE faq_items SET usage_count = usage_count + 1 WHERE id = ?`,
        [faqId],
      );
    } catch (error) {
      logger.error("[FAQ] Error recording usage:", error);
    }
  }

  /**
   * Get FAQ statistics
   */
  async getStatistics(workspaceId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [stats] = await db.query(
        `SELECT 
          COUNT(*) as total_faq_items,
          SUM(usage_count) as total_usage,
          AVG(usage_count) as avg_usage,
          COUNT(DISTINCT CASE WHEN usage_count = 0 THEN id END) as unused_items
         FROM faq_items
         WHERE workspace_id = ?`,
        [workspaceId],
      );

      return stats[0] || {};
    } catch (error) {
      logger.error("[FAQ] Error fetching statistics:", error);
      return {};
    }
  }
}

/**
 * Feedback Collection Workflow
 * Collects customer satisfaction and feedback
 */
class FeedbackWorkflow {
  /**
   * Execute feedback collection workflow
   */
  async execute(params) {
    const {
      workspaceId,
      conversationId,
      phoneNumber,
      senderName,
      accessToken,
      phoneNumberId,
    } = params;

    const steps = [];

    try {
      // Step 1: Send feedback form/flow
      const feedbackFlow = await this.getFeedbackFlow(workspaceId);

      if (feedbackFlow && feedbackFlow.meta_flow_id) {
        // Send WhatsApp Flow
        const sendResult = await webhookHandler.sendFlow(
          phoneNumber,
          feedbackFlow.meta_flow_id,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_feedback_flow",
          status: sendResult.success ? "completed" : "failed",
          result: sendResult,
        });
      } else {
        // Send text-based feedback request
        const message = this.generateFeedbackMessage();

        const sendResult = await webhookHandler.sendMessage(
          phoneNumber,
          message,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_feedback_request",
          status: sendResult.success ? "completed" : "failed",
          result: sendResult,
        });
      }

      // Step 2: Create feedback record
      const feedbackId = uuidv4();

      await db.query(
        `INSERT INTO customer_feedback 
         (id, workspace_id, conversation_id, phone_number, customer_name, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [feedbackId, workspaceId, conversationId, phoneNumber, senderName],
      );

      steps.push({
        step_name: "create_feedback_record",
        status: "completed",
        feedback_id: feedbackId,
      });

      return {
        status: "completed",
        feedback_id: feedbackId,
        message: "Feedback form sent successfully",
        steps,
      };
    } catch (error) {
      logger.error("[Feedback] Workflow error:", error);

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
   * Get feedback flow for workspace
   * @private
   */
  async getFeedbackFlow(workspaceId) {
    try {
      const [flows] = await db.query(
        `SELECT * FROM whatsapp_flows
         WHERE workspace_id = ? AND flow_type = 'feedback_form' 
         AND status = 'published'
         LIMIT 1`,
        [workspaceId],
      );

      return flows[0] || null;
    } catch (error) {
      logger.error("[Feedback] Error fetching flow:", error);
      return null;
    }
  }

  /**
   * Generate feedback message
   * @private
   */
  generateFeedbackMessage() {
    return `We'd love your feedback! 🙏\n\nPlease rate your experience:\n\n⭐⭐⭐⭐⭐ Excellent\n⭐⭐⭐⭐ Good\n⭐⭐⭐ OK\n⭐⭐ Poor\n\nReply with the stars or use the form above.`;
  }

  /**
   * Record feedback response
   */
  async recordFeedback(params) {
    const {
      workspaceId,
      feedbackId,
      rating,
      comment,
      responseText,
      analysis,
    } = params;

    try {
      await db.query(
        `UPDATE customer_feedback 
         SET rating = ?, comment = ?, sentiment = ?, status = 'completed', 
             submitted_at = NOW()
         WHERE id = ? AND workspace_id = ?`,
        [rating, comment || responseText, analysis?.sentiment, feedbackId, workspaceId],
      );

      // Record in automation usage for metrics
      await this.recordFeedbackMetric(workspaceId, rating);

      return { status: "success" };
    } catch (error) {
      logger.error("[Feedback] Error recording feedback:", error);
      throw error;
    }
  }

  /**
   * Record feedback metric
   * @private
   */
  async recordFeedbackMetric(workspaceId, rating) {
    try {
      const today = new Date().toISOString().split("T")[0];

      await db.query(
        `INSERT INTO automation_usage (id, workspace_id, date_recorded, messages_analyzed)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE messages_analyzed = messages_analyzed + 1`,
        [uuidv4(), workspaceId, today],
      );
    } catch (error) {
      logger.error("[Feedback] Error recording metric:", error);
    }
  }

  /**
   * Get feedback summary
   */
  async getFeedbackSummary(workspaceId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [summary] = await db.query(
        `SELECT 
          COUNT(*) as total_feedback,
          AVG(rating) as avg_rating,
          SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_sentiment,
          SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral_sentiment,
          SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_sentiment
         FROM customer_feedback
         WHERE workspace_id = ? AND submitted_at >= ?`,
        [workspaceId, startDate.toISOString().split("T")[0]],
      );

      return summary[0] || {};
    } catch (error) {
      logger.error("[Feedback] Error fetching summary:", error);
      return {};
    }
  }
}

module.exports = { FAQWorkflow: new FAQWorkflow(), FeedbackWorkflow: new FeedbackWorkflow() };
