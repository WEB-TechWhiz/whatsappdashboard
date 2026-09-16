// const { GoogleGenerativeAI } = require("@google/generative-ai");
import { GoogleGenerativeAI } from "@google/generative-ai";
// const logger = require("../../config/logger");
import logger from "../../config/logger.js";

/**
 * AI Agent Service for message analysis and intent detection
 * Powers intelligent WhatsApp automation workflows
 */
class AIAnalyzer {
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Analyze incoming WhatsApp message for intent and entities
   * @param {Object} params - Analysis parameters
   * @param {string} params.message - The message content
   * @param {string} params.senderName - Sender's name
   * @param {string} params.phoneNumber - Sender's phone number
   * @param {string} params.businessContext - Context about the business (optional)
   * @returns {Promise<Object>} Analysis result with intent, sentiment, entities, etc.
   */
  async analyzeMessage(params) {
    const { message, senderName, phoneNumber, businessContext } = params;

    try {
      const analysisPrompt = this.buildAnalysisPrompt(message, businessContext);

      const response = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for consistent analysis
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2000,
        },
      });

      const analysisText = response.response.candidates[0].content.parts[0].text;
      const analysis = this.parseAnalysisResponse(analysisText);

      // Add confidence score based on response quality
      analysis.confidence_score = this.calculateConfidenceScore(message, analysis);
      analysis.sender_name = senderName;
      analysis.phone_number = phoneNumber;

      logger.info(
        `[AI-Agent] Message analyzed: intent=${analysis.intent}, confidence=${analysis.confidence_score}`,
      );

      return analysis;
    } catch (error) {
      logger.error("[AI-Agent] Analysis error:", error);
      return this.getDefaultAnalysis(message, senderName, phoneNumber);
    }
  }

  /**
   * Build the analysis prompt for the AI model
   * @private
   */
  buildAnalysisPrompt(message, businessContext) {
    return `You are an expert WhatsApp customer service AI assistant. Analyze the following customer message and provide structured analysis in JSON format.

Customer Message: "${message}"

${businessContext ? `Business Context: ${businessContext}` : ""}

Analyze and return ONLY valid JSON (no markdown, no code blocks, just plain JSON) with the following structure:
{
  "intent": "one of: greeting, inquiry, complaint, booking_request, product_question, feedback, unknown",
  "sentiment": "one of: positive, neutral, negative",
  "entities": {
    "email": "extracted email if present",
    "phone": "extracted phone if present",
    "product_interest": "if customer mentions specific products",
    "budget": "if customer mentions budget",
    "name": "customer's name if mentioned",
    "date_mentioned": "if booking date is mentioned"
  },
  "action_required": "specific next step to take",
  "should_escalate": true or false,
  "escalation_reason": "reason for escalation if applicable",
  "suggested_workflow": "one of: lead_capture, appointment_booking, product_inquiry, faq, feedback_collection",
  "key_phrases": ["important phrases from message"],
  "urgency_level": "low, medium, or high"
}

Respond ONLY with the JSON object, nothing else.`;
  }

  /**
   * Parse AI response into structured analysis
   * @private
   */
  parseAnalysisResponse(responseText) {
    try {
      // Extract JSON from response (handles cases where model adds extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Normalize values
      return {
        intent: analysis.intent || "unknown",
        sentiment: analysis.sentiment || "neutral",
        entities: analysis.entities || {},
        action_required: analysis.action_required || "No action",
        should_escalate: analysis.should_escalate || false,
        escalation_reason: analysis.escalation_reason || null,
        suggested_workflow: analysis.suggested_workflow || "faq",
        key_phrases: analysis.key_phrases || [],
        urgency_level: analysis.urgency_level || "low",
      };
    } catch (error) {
      logger.warn("[AI-Agent] Failed to parse AI response, returning default");
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Calculate confidence score based on analysis quality
   * @private
   */
  calculateConfidenceScore(message, analysis) {
    let score = 0.5; // Base score

    // Increase if entities are extracted
    if (Object.keys(analysis.entities || {}).length > 0) score += 0.15;

    // Increase if intent is not "unknown"
    if (analysis.intent !== "unknown") score += 0.15;

    // Increase if message is clear (no typos detected, reasonable length)
    if (message.length > 10 && message.length < 1000) score += 0.1;

    // Cap at 0.99 (no 100% confidence)
    return Math.min(0.99, Math.max(0.1, score));
  }

  /**
   * Get default analysis response (fallback)
   * @private
   */
  getDefaultAnalysis() {
    return {
      intent: "unknown",
      sentiment: "neutral",
      entities: {},
      action_required: "Route to support team",
      should_escalate: true,
      escalation_reason: "Could not determine intent",
      suggested_workflow: "faq",
      key_phrases: [],
      urgency_level: "medium",
    };
  }

  /**
   * Extract specific intent from user message
   * Useful for simple pattern matching before AI analysis
   * @param {string} message
   * @returns {string} Intent type
   */
  extractQuickIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Greeting patterns
    if (/^(hi|hello|hey|howdy|greetings)/.test(lowerMessage)) {
      return "greeting";
    }

    // Booking patterns
    if (/(book|schedule|appointment|reservation|available|time)/.test(lowerMessage)) {
      return "booking_request";
    }

    // Product patterns
    if (/(price|cost|product|what do you offer|services|package)/.test(lowerMessage)) {
      return "product_question";
    }

    // Complaint patterns
    if (/(problem|issue|complain|broken|not working|bad|terrible)/.test(lowerMessage)) {
      return "complaint";
    }

    // Feedback patterns
    if (/(feedback|review|rate|experience|good|bad|happy|sad)/.test(lowerMessage)) {
      return "feedback";
    }

    return "inquiry";
  }

  /**
   * Generate AI-powered response based on analysis
   * Used for FAQ and general inquiries
   * @param {string} message - Customer message
   * @param {Object} analysis - Message analysis result
   * @param {string} businessContext - Business information
   * @returns {Promise<string>} AI-generated response
   */
  async generateResponse(message, analysis, businessContext) {
    try {
      const responsePrompt = `You are a professional customer service assistant for a WhatsApp Business.

Customer Message: "${message}"
Detected Intent: ${analysis.intent}
Business Info: ${businessContext || "Not provided"}

Generate a professional, helpful, and concise response (max 160 characters for WhatsApp) that:
1. Addresses the customer's needs based on the detected intent
2. Is friendly and professional
3. Includes a clear next step

Respond with ONLY the response message, nothing else.`;

      const response = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: responsePrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
      });

      return response.response.candidates[0].content.parts[0].text;
    } catch (error) {
      logger.error("[AI-Agent] Response generation error:", error);
      return "Thank you for your message. Our team will get back to you shortly.";
    }
  }

  /**
   * Batch analyze multiple messages (for bulk operations)
   * @param {Array} messages - Array of message objects
   * @returns {Promise<Array>} Analysis results
   */
  async batchAnalyzeMessages(messages) {
    const results = await Promise.all(
      messages.map((msg) =>
        this.analyzeMessage({
          message: msg.content,
          senderName: msg.senderName,
          phoneNumber: msg.phoneNumber,
          businessContext: msg.businessContext,
        }),
      ),
    );

    return results;
  }
}

// module.exports = new AIAnalyzer();
export default AIAnalyzer;
