const logger = require("../../config/logger");
const db = require("../../config/db");
const aiAnalyzer = require("./analyzer");
const workflowEngine = require("./workflow-engine");
const { v4: uuidv4 } = require("uuid");

/**
 * Webhook Handler for incoming WhatsApp messages
 * Processes messages through AI analysis and automation workflows
 */
class WebhookHandler {
  /**
   * Process incoming webhook message from Meta WhatsApp API
   * @param {Object} webhookData - The webhook payload from Meta
   * @returns {Promise<Object>} Processing result
   */
  async handleIncomingMessage(webhookData) {
    try {
      // Extract message data from webhook
      const { phoneNumber, message, senderName, senderPhoneId } =
        this.parseWebhookMessage(webhookData);

      if (!phoneNumber || !message) {
        logger.warn(
          "[Webhook] Invalid webhook data - missing phoneNumber or message",
        );
        return { processed: false, reason: "Invalid webhook data" };
      }

      // Find workspace and conversation
      const { workspaceId, conversationId } =
        await this.findOrCreateConversation(
          phoneNumber,
          senderName,
          senderPhoneId,
        );

      if (!workspaceId) {
        logger.warn(
          `[Webhook] No workspace found for phone ${phoneNumber}`,
        );
        return { processed: false, reason: "Workspace not found" };
      }

      // Create message record
      const messageId = uuidv4();
      await this.recordMessage(
        messageId,
        conversationId,
        message,
        phoneNumber,
        workspaceId,
      );

      // Trigger AI analysis and workflow
      const result = await workflowEngine.executeWorkflow({
        workspaceId,
        conversationId,
        messageId,
        phoneNumber,
        message,
        analysis: null, // Will be analyzed inside workflow
      });

      logger.info(
        `[Webhook] Message processed from ${phoneNumber}: ${result.executed ? "success" : "failed"}`,
      );

      return {
        processed: result.executed,
        workflowExecuted: result.executionId,
        result,
      };
    } catch (error) {
      logger.error("[Webhook] Error processing message:", error);
      return {
        processed: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse webhook message structure from Meta
   * @private
   */
  parseWebhookMessage(webhookData) {
    try {
      // Meta webhook structure for messages
      const message =
        webhookData?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const contact =
        webhookData?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
      const metadata =
        webhookData?.entry?.[0]?.changes?.[0]?.value?.metadata;

      if (!message || !metadata) {
        return {};
      }

      const phoneNumber = message.from;
      const senderPhoneId = metadata.phone_number_id;
      const senderName = contact?.profile?.name || "Unknown";

      let messageText = "";

      // Extract text content based on message type
      if (message.type === "text") {
        messageText = message.text.body;
      } else if (message.type === "button") {
        messageText = message.button.text;
      } else if (message.type === "interactive") {
        const interactive = message.interactive;
        if (interactive.type === "button_reply") {
          messageText = interactive.button_reply.title;
        } else if (interactive.type === "list_reply") {
          messageText = interactive.list_reply.title;
        } else if (interactive.type === "nfm_reply") {
          // WhatsApp Flow response
          messageText = JSON.stringify(interactive.nfm_reply.response_json);
        }
      }

      return {
        phoneNumber,
        message: messageText,
        senderName,
        senderPhoneId,
        messageId: message.id,
        timestamp: message.timestamp,
        messageType: message.type,
      };
    } catch (error) {
      logger.error("[Webhook] Error parsing message:", error);
      return {};
    }
  }

  /**
   * Find or create conversation for the sender
   * @private
   */
  async findOrCreateConversation(phoneNumber, senderName, senderPhoneId) {
    try {
      // Find workspace by phone number ID
      const [workspaces] = await db.query(
        `SELECT wc.workspace_id FROM whatsapp_connections wc
         WHERE wc.phone_number_id = ?
         LIMIT 1`,
        [senderPhoneId],
      );

      if (workspaces.length === 0) {
        return { workspaceId: null, conversationId: null };
      }

      const workspaceId = workspaces[0].workspace_id;

      // Find or create conversation
      const [conversations] = await db.query(
        `SELECT id FROM conversations
         WHERE workspace_id = ? AND customer_phone = ?
         LIMIT 1`,
        [workspaceId, phoneNumber],
      );

      let conversationId;
      if (conversations.length > 0) {
        conversationId = conversations[0].id;
        // Update last message time
        await db.query(
          `UPDATE conversations 
           SET last_message_at = NOW()
           WHERE id = ?`,
          [conversationId],
        );
      } else {
        // Create new conversation
        conversationId = uuidv4();
        await db.query(
          `INSERT INTO conversations 
           (id, workspace_id, customer_phone, customer_name, status)
           VALUES (?, ?, ?, ?, 'active')`,
          [conversationId, workspaceId, phoneNumber, senderName || "Unknown"],
        );
      }

      return { workspaceId, conversationId };
    } catch (error) {
      logger.error("[Webhook] Error finding/creating conversation:", error);
      return { workspaceId: null, conversationId: null };
    }
  }

  /**
   * Record message in database
   * @private
   */
  async recordMessage(messageId, conversationId, message, phoneNumber, workspaceId) {
    try {
      await db.query(
        `INSERT INTO messages 
         (id, conversation_id, sender, content, type, direction, status)
         VALUES (?, ?, ?, ?, 'text', 'inbound', 'received')`,
        [messageId, conversationId, phoneNumber, message],
      );
    } catch (error) {
      logger.error("[Webhook] Error recording message:", error);
    }
  }

  /**
   * Send response back to customer via WhatsApp
   * @param {string} phoneNumber
   * @param {string} message
   * @param {string} accessToken
   * @param {string} phoneNumberId
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(phoneNumber, message, accessToken, phoneNumberId) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: { body: message },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `WhatsApp API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      logger.info(
        `[Webhook] Message sent to ${phoneNumber}: ${data.messages[0].id}`,
      );

      return { success: true, messageId: data.messages[0].id };
    } catch (error) {
      logger.error("[Webhook] Error sending message:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp template message
   * @param {string} phoneNumber
   * @param {string} templateName
   * @param {Array} parameters
   * @param {string} accessToken
   * @param {string} phoneNumberId
   * @returns {Promise<Object>} Send result
   */
  async sendTemplateMessage(
    phoneNumber,
    templateName,
    parameters,
    accessToken,
    phoneNumberId,
  ) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "template",
            template: {
              name: templateName,
              language: { code: "en_US" },
              components: parameters
                ? [
                    {
                      type: "body",
                      parameters: parameters.map((p) => ({ type: "text", text: p })),
                    },
                  ]
                : [],
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `WhatsApp API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      logger.info(
        `[Webhook] Template message sent to ${phoneNumber}: ${data.messages[0].id}`,
      );

      return { success: true, messageId: data.messages[0].id };
    } catch (error) {
      logger.error("[Webhook] Error sending template message:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp Flow
   * @param {string} phoneNumber
   * @param {string} flowId
   * @param {string} accessToken
   * @param {string} phoneNumberId
   * @returns {Promise<Object>} Send result
   */
  async sendFlow(phoneNumber, flowId, accessToken, phoneNumberId) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "interactive",
            interactive: {
              type: "flow",
              body: { text: "Please complete this form" },
              action: { name: "flow", parameters: { flow_id: flowId } },
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `WhatsApp API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      logger.info(
        `[Webhook] Flow sent to ${phoneNumber}: ${data.messages[0].id}`,
      );

      return { success: true, messageId: data.messages[0].id };
    } catch (error) {
      logger.error("[Webhook] Error sending flow:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WebhookHandler();
