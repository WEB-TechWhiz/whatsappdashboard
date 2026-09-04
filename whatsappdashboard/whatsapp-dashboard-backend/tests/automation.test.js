/**
 * Automation System Integration Tests
 * Tests for WhatsApp AI automation workflows
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import AIAnalyzer from "../src/services/ai-agent/analyzer.js";
import RoutingEngine from "../src/services/ai-agent/routing-engine.js";
import LeadCaptureWorkflow from "../src/services/ai-agent/workflows/lead-capture.js";

const aiAnalyzer = new AIAnalyzer();
const routingEngine = new RoutingEngine();
const leadCaptureWorkflow = new LeadCaptureWorkflow();

// Mock workspace and conversation IDs
const testWorkspaceId = "test-workspace-123";
const testConversationId = "test-conv-123";
const testPhoneNumber = "+1234567890";

describe("WhatsApp Automation System", () => {
  describe("AI Analyzer", () => {
    it("should extract quick intent correctly", () => {
      const intent = aiAnalyzer.extractQuickIntent("Hi there, how are you?");
      assert.strictEqual(intent, "greeting");
    });

    it("should calculate confidence score", () => {
      const score = aiAnalyzer.calculateConfidenceScore("What are your business hours?", {
        intent: "inquiry",
        entities: { topic: "hours" },
      });
      assert.ok(score > 0.5);
    });

    it("should parse analysis response JSON", () => {
      const rawJson = '{"intent": "booking_request", "sentiment": "positive", "entities": {}}';
      const parsed = aiAnalyzer.parseAnalysisResponse(rawJson);
      assert.strictEqual(parsed.intent, "booking_request");
      assert.strictEqual(parsed.sentiment, "positive");
    });
  });

  describe("Lead Capture Workflow", () => {
    it("should extract lead data correctly", () => {
      const analysis = {
        entities: {
          name: "John Doe",
          email: "john@example.com",
          product_interest: "Enterprise Plan",
          budget: "$10,000",
        },
        intent: "inquiry",
        sentiment: "positive",
        key_phrases: ["Enterprise", "budget"],
      };

      const leadData = leadCaptureWorkflow.extractLeadData(testPhoneNumber, "John Doe", analysis);

      assert.strictEqual(leadData.phone, testPhoneNumber);
      assert.strictEqual(leadData.name, "John Doe");
      assert.strictEqual(leadData.email, "john@example.com");
      assert.ok(leadData.interest);
    });
  });

  describe("Routing Engine", () => {
    it("should evaluate escalation triggers", async () => {
      const analysis = {
        should_escalate: true,
        escalation_reason: "Customer is angry",
        sentiment: "negative",
        intent: "complaint",
        confidence_score: 0.95,
        urgency_level: "high",
      };

      const shouldEscalate = await routingEngine.shouldEscalate({
        workspaceId: testWorkspaceId,
        analysis,
        conversationId: testConversationId,
        phoneNumber: testPhoneNumber,
      });

      assert.strictEqual(typeof shouldEscalate, "boolean");
    });
  });
});
