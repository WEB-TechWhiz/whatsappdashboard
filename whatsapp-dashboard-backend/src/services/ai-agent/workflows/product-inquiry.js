const logger = require("../../../utils/logger");
const db = require("../../../database");
const { v4: uuidv4 } = require("uuid");
const webhookHandler = require("../webhook-handler");

/**
 * Product Inquiry Workflow
 * Handles product questions, catalog browsing, and sales
 */
class ProductInquiryWorkflow {
  /**
   * Execute product inquiry workflow
   */
  async execute(params) {
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

    const steps = [];

    try {
      // Step 1: Extract product interest
      const productInterest = analysis?.entities?.product_interest ||
        this.extractProductFromMessage(message) || "general";

      steps.push({
        step_name: "extract_product_interest",
        status: "completed",
        interest: productInterest,
      });

      // Step 2: Search product catalog
      const products = await this.searchProducts(workspaceId, productInterest);

      if (products.length === 0) {
        steps.push({
          step_name: "search_catalog",
          status: "no_results",
        });

        await webhookHandler.sendMessage(
          phoneNumber,
          "Sorry, I couldn't find products matching your interest. Please describe what you're looking for.",
          accessToken,
          phoneNumberId,
        );

        return {
          status: "completed",
          message: "No products found",
          steps,
        };
      }

      steps.push({
        step_name: "search_catalog",
        status: "completed",
        products_found: products.length,
      });

      // Step 3: Send catalog or product details
      const catalogFlow = await this.getCatalogFlow(workspaceId);

      if (catalogFlow && catalogFlow.meta_flow_id) {
        // Send interactive Flow
        const sendResult = await webhookHandler.sendFlow(
          phoneNumber,
          catalogFlow.meta_flow_id,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_catalog_flow",
          status: sendResult.success ? "completed" : "failed",
          result: sendResult,
        });
      } else {
        // Send product details as messages
        const message = this.generateProductMessage(products[0]);

        const sendResult = await webhookHandler.sendMessage(
          phoneNumber,
          message,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_product_message",
          status: sendResult.success ? "completed" : "failed",
          result: sendResult,
        });

        // Send quick reply buttons for more products if multiple found
        if (products.length > 1) {
          const followUpMessage = `I found ${products.length} products matching "${productInterest}". Would you like to see more?`;

          const followUpResult = await webhookHandler.sendMessage(
            phoneNumber,
            followUpMessage,
            accessToken,
            phoneNumberId,
          );

          steps.push({
            step_name: "send_followup_message",
            status: followUpResult.success ? "completed" : "failed",
            result: followUpResult,
          });
        }
      }

      // Step 4: Record inquiry
      const inquiryId = uuidv4();
      await db.query(
        `INSERT INTO product_inquiries 
         (id, workspace_id, conversation_id, phone_number, product_interest, products_shown_count, status)
         VALUES (?, ?, ?, ?, ?, ?, 'shown')`,
        [inquiryId, workspaceId, conversationId, phoneNumber, productInterest, products.length],
      );

      steps.push({
        step_name: "record_inquiry",
        status: "completed",
        inquiry_id: inquiryId,
      });

      return {
        status: "completed",
        inquiry_id: inquiryId,
        products_shown: products.length,
        message: "Product information sent successfully",
        steps,
      };
    } catch (error) {
      logger.error("[Product Inquiry] Workflow error:", error);

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
   * Extract product name from message
   * @private
   */
  extractProductFromMessage(message) {
    const keywords = message.toLowerCase().split(" ");
    // Look for product-related keywords
    const productKeywords = [
      "premium",
      "standard",
      "basic",
      "pro",
      "enterprise",
      "plan",
      "package",
      "service",
    ];

    for (const keyword of keywords) {
      if (productKeywords.includes(keyword)) {
        return keyword;
      }
    }

    return null;
  }

  /**
   * Search products in workspace catalog
   * @private
   */
  async searchProducts(workspaceId, searchTerm, limit = 5) {
    try {
      let query =
        `SELECT id, name, description, price, image_url, category FROM products 
         WHERE workspace_id = ? AND status = 'active'`;
      const params = [workspaceId];

      if (searchTerm && searchTerm !== "general") {
        query += ` AND (name LIKE ? OR category LIKE ? OR description LIKE ?)`;
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      query += ` LIMIT ?`;
      params.push(limit);

      const [products] = await db.query(query, params);

      return products;
    } catch (error) {
      logger.error("[Product Inquiry] Error searching products:", error);
      return [];
    }
  }

  /**
   * Get catalog flow for workspace
   * @private
   */
  async getCatalogFlow(workspaceId) {
    try {
      const [flows] = await db.query(
        `SELECT * FROM whatsapp_flows
         WHERE workspace_id = ? AND flow_type = 'product_selection' 
         AND status = 'published'
         LIMIT 1`,
        [workspaceId],
      );

      return flows[0] || null;
    } catch (error) {
      logger.error("[Product Inquiry] Error fetching flow:", error);
      return null;
    }
  }

  /**
   * Generate product message
   * @private
   */
  generateProductMessage(product) {
    let message = `✨ *${product.name}*\n\n`;
    message += `${product.description}\n\n`;
    message += `💰 Price: $${product.price}\n\n`;
    message += `🔗 React with 'BUY' to purchase or ask for more details!`;

    return message;
  }

  /**
   * Handle product selection/purchase
   */
  async handleProductSelection(params) {
    const { workspaceId, inquiryId, productId, phoneNumber, action } = params;

    try {
      // Get product details
      const [products] = await db.query(
        `SELECT * FROM products WHERE id = ? AND workspace_id = ?`,
        [productId, workspaceId],
      );

      if (products.length === 0) {
        throw new Error("Product not found");
      }

      const product = products[0];

      // Update inquiry
      await db.query(
        `UPDATE product_inquiries 
         SET selected_product_id = ?, action = ?, updated_at = NOW()
         WHERE id = ?`,
        [productId, action, inquiryId],
      );

      if (action === "purchase") {
        // Create order/cart
        const orderId = uuidv4();

        await db.query(
          `INSERT INTO product_orders 
           (id, workspace_id, inquiry_id, phone_number, product_id, quantity, status)
           VALUES (?, ?, ?, ?, ?, 1, 'pending')`,
          [orderId, workspaceId, inquiryId, phoneNumber, productId],
        );

        // Generate payment link
        const paymentLink = await this.generatePaymentLink(
          orderId,
          product,
          phoneNumber,
        );

        return {
          status: "success",
          order_id: orderId,
          payment_link: paymentLink,
        };
      } else if (action === "more_info") {
        return {
          status: "success",
          message: `Here are more details about ${product.name}...`,
          product,
        };
      }

      return { status: "success" };
    } catch (error) {
      logger.error("[Product Inquiry] Error handling selection:", error);
      throw error;
    }
  }

  /**
   * Generate payment link
   * @private
   */
  async generatePaymentLink(orderId, product, phoneNumber) {
    try {
      // This would integrate with payment provider (Stripe, PayPal, etc.)
      // For now, generate a mock link
      const baseUrl = process.env.API_BASE_URL || "https://api.example.com";
      const link = `${baseUrl}/pay?order_id=${orderId}&phone=${phoneNumber}`;

      return link;
    } catch (error) {
      logger.error("[Product Inquiry] Error generating payment link:", error);
      return null;
    }
  }

  /**
   * Get product inquiry details
   */
  async getInquiryDetails(workspaceId, inquiryId) {
    try {
      const [inquiries] = await db.query(
        `SELECT * FROM product_inquiries 
         WHERE id = ? AND workspace_id = ?`,
        [inquiryId, workspaceId],
      );

      if (inquiries.length === 0) return null;

      const inquiry = inquiries[0];

      // Get associated product if selected
      if (inquiry.selected_product_id) {
        const [products] = await db.query(
          `SELECT * FROM products WHERE id = ?`,
          [inquiry.selected_product_id],
        );
        inquiry.product = products[0] || null;
      }

      return inquiry;
    } catch (error) {
      logger.error("[Product Inquiry] Error fetching inquiry:", error);
      return null;
    }
  }

  /**
   * Get product inquiries for workspace
   */
  async getInquiries(workspaceId, limit = 50, offset = 0) {
    try {
      const [inquiries] = await db.query(
        `SELECT id, phone_number, product_interest, action, status, created_at
         FROM product_inquiries
         WHERE workspace_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [workspaceId, limit, offset],
      );

      return inquiries;
    } catch (error) {
      logger.error("[Product Inquiry] Error fetching inquiries:", error);
      return [];
    }
  }

  /**
   * Get product sales statistics
   */
  async getSalesStatistics(workspaceId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [stats] = await db.query(
        `SELECT 
          COUNT(DISTINCT pi.id) as total_inquiries,
          COUNT(DISTINCT po.id) as total_orders,
          SUM(p.price) as total_revenue,
          AVG(p.price) as avg_order_value,
          COUNT(DISTINCT CASE WHEN pi.action = 'purchase' THEN pi.id END) as purchase_attempts
         FROM product_inquiries pi
         LEFT JOIN product_orders po ON pi.id = po.inquiry_id
         LEFT JOIN products p ON po.product_id = p.id
         WHERE pi.workspace_id = ? AND pi.created_at >= ?`,
        [workspaceId, startDate.toISOString().split("T")[0]],
      );

      return stats[0] || {};
    } catch (error) {
      logger.error("[Product Inquiry] Error fetching statistics:", error);
      return {};
    }
  }
}

module.exports = new ProductInquiryWorkflow();
