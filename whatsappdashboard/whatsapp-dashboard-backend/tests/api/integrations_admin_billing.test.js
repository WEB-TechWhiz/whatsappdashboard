import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import request from "supertest";
import crypto from "node:crypto";
import { createTestApp } from "../helpers/createTestApp.js";
import { generateTestToken, TEST_WORKSPACE_ID } from "../helpers/testToken.js";
import { mockDbState } from "../helpers/mockDbState.js";

const app = createTestApp();
const token = generateTestToken();

describe("Integrations, Admin & Billing Routes", () => {
  beforeEach(() => {
    mockDbState.reset();
    process.env.INTERNAL_INTEGRATION_TOKEN = "internal-token-secret";
    process.env.WHATSAPP_VERIFY_TOKEN = "verify-token-123";
    process.env.WHATSAPP_WEBHOOK_SECRET = "webhook-secret-456";
  });

  describe("Inbound Integration Bridge", () => {
    it("POST /integrations/whatsapp/inbound - receives inbound message from internal bridge", async () => {
      const res = await request(app)
        .post("/api/v1/integrations/whatsapp/inbound")
        .set("x-internal-token", "internal-token-secret")
        .send({
          workspaceId: TEST_WORKSPACE_ID,
          phone: "+15550123456",
          name: "Aisha Khan",
          text: "Inbound message via internal bridge",
        });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.contact);
      assert.ok(res.body.message);
    });
  });

  describe("Meta Webhooks", () => {
    it("GET /webhooks/whatsapp - satisfies meta verification challenge", async () => {
      const res = await request(app)
        .get("/api/v1/webhooks/whatsapp")
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": "verify-token-123",
          "hub.challenge": "challenge_code_999",
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.text, "challenge_code_999");
    });

    it("POST /webhooks/whatsapp - processes signed meta webhook payload", async () => {
      const bodyPayload = JSON.stringify({
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                field: "messages",
                value: {
                  messages: [
                    {
                      from: "15550123456",
                      id: "wamid.test123",
                      timestamp: "1600000000",
                      type: "text",
                      text: { body: "Webhook message" },
                    },
                  ],
                  contacts: [{ profile: { name: "Aisha Khan" }, wa_id: "15550123456" }],
                  metadata: { phone_number_id: "123456" },
                },
              },
            ],
          },
        ],
      });

      const signature = "sha256=" + crypto.createHmac("sha256", "webhook-secret-456").update(bodyPayload).digest("hex");

      const res = await request(app)
        .post("/api/v1/webhooks/whatsapp")
        .set("x-hub-signature-256", signature)
        .set("Content-Type", "application/json")
        .send(bodyPayload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });
  });

  describe("Admin API", () => {
    it("GET /admin/overview - returns system admin stats", async () => {
      const res = await request(app)
        .get("/api/v1/admin/overview")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.ok(typeof res.body === "object");
    });

    it("GET /admin/connections - lists connections", async () => {
      const res = await request(app)
        .get("/api/v1/admin/connections")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
    });

    it("POST /admin/kill-switch - activates emergency pause", async () => {
      const res = await request(app)
        .post("/api/v1/admin/kill-switch")
        .set("Authorization", `Bearer ${token}`)
        .send({ workspaceId: TEST_WORKSPACE_ID, paused: true, reason: "Maintenance test" });

      assert.strictEqual(res.status, 200);
    });

    it("GET /admin/audit-logs - lists system audit logs", async () => {
      const res = await request(app)
        .get("/api/v1/admin/audit-logs")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
    });

    it("GET /admin/pricing/rates - lists rate table", async () => {
      const res = await request(app)
        .get("/api/v1/admin/pricing/rates")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
    });

    it("POST /admin/pricing/rates - sets pricing rate", async () => {
      const res = await request(app)
        .post("/api/v1/admin/pricing/rates")
        .set("Authorization", `Bearer ${token}`)
        .send({ countryCode: "US", category: "MARKETING", rate: 0.03, currency: "USD", provider: "META" });

      assert.strictEqual(res.status, 201);
    });
  });

  describe("Billing API", () => {
    it("GET /billing/wallet - returns workspace balance", async () => {
      const res = await request(app)
        .get("/api/v1/billing/wallet")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.ok("balance" in res.body);
    });

    it("GET /billing/ledger - returns transaction history", async () => {
      const res = await request(app)
        .get("/api/v1/billing/ledger")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
    });

    it("POST /billing/topup/initiate - starts topup request", async () => {
      const res = await request(app)
        .post("/api/v1/billing/topup/initiate")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 50, currency: "USD" });

      assert.strictEqual(res.status, 201);
    });

    it("POST /billing/topup/webhook - receives payment processor webhook", async () => {
      const res = await request(app)
        .post("/api/v1/billing/topup/webhook")
        .send({ providerPaymentId: "pay_999", workspaceId: TEST_WORKSPACE_ID, amount: 50, status: "COMPLETED" });

      assert.strictEqual(res.status, 200);
    });

    it("GET /billing/pricing/rates - returns current pricing rates", async () => {
      const res = await request(app)
        .get("/api/v1/billing/pricing/rates")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
    });
  });
});
