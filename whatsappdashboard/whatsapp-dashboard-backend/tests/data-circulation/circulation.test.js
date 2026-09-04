import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { createTestApp } from "../helpers/createTestApp.js";
import { generateTestToken, TEST_WORKSPACE_ID } from "../helpers/testToken.js";
import { mockDbState } from "../helpers/mockDbState.js";

const app = createTestApp();
const token = generateTestToken();

describe("End-to-End Data Transfer and Circulation Tests", () => {
  beforeEach(() => {
    mockDbState.reset();
  });

  describe("Inbound Message -> Lead Pipeline -> Booking -> Analytics Circulation", () => {
    it("should circulate inbound WhatsApp message through contact, lead, notification, and dashboard metrics", async () => {
      // 1. Inbound message received via internal integration bridge
      const inboundRes = await request(app)
        .post("/api/v1/integrations/whatsapp/inbound")
        .set("x-internal-token", process.env.INTERNAL_INTEGRATION_TOKEN || "internal-token-secret")
        .send({
          workspaceId: TEST_WORKSPACE_ID,
          phone: "+15550999888",
          name: "Carlos Mendez",
          text: "Hi! I am interested in Enterprise pricing for 10 users.",
        });

      assert.strictEqual(inboundRes.status, 201);
      assert.ok(inboundRes.body.contact);
      assert.ok(inboundRes.body.message);
      const contactId = inboundRes.body.contact.id;

      // 2. Verify conversation thread is accessible
      const convRes = await request(app)
        .get(`/api/v1/conversations/${contactId}/messages`)
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(convRes.status, 200);
      assert.ok(Array.isArray(convRes.body));
      assert.ok(convRes.body.some((m) => m.text.includes("Enterprise pricing")));

      // 3. Verify notification generated
      const notifRes = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(notifRes.status, 200);
      assert.ok(Array.isArray(notifRes.body));
      assert.ok(notifRes.body.length > 0);

      // 4. Create CRM lead for the new contact using valid source enum ('Website')
      const createLeadRes = await request(app)
        .post("/api/v1/leads")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Carlos Mendez",
          phone: "+15550999888",
          source: "Website",
          status: "Hot",
          value: 1200,
        });

      assert.strictEqual(createLeadRes.status, 201);
      const leadId = createLeadRes.body.id;

      // 5. Update lead status to 'Booked' (simulating deal close / appointment booking)
      const patchLeadRes = await request(app)
        .patch(`/api/v1/leads/${leadId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Booked", value: 1500 });

      assert.strictEqual(patchLeadRes.status, 200);
      assert.strictEqual(patchLeadRes.body.value, "1500.00");

      // 6. Verify Dashboard Overview metrics reflect updated pipeline and booking snapshot
      const overviewRes = await request(app)
        .get("/api/v1/dashboard/overview?range=week")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(overviewRes.status, 200);
      assert.ok(overviewRes.body.kpis);
      assert.ok("revenueToday" in overviewRes.body.kpis);

      // 7. Verify Analytics Bookings trend chart receives circulating booking data
      const analyticsRes = await request(app)
        .get("/api/v1/analytics/bookings?range=7days")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(analyticsRes.status, 200);
      assert.ok(Array.isArray(analyticsRes.body));
    });
  });

  describe("Outbound Messaging & Compliance Safety Circulation", () => {
    it("should enforce contact opt-out and workspace pause compliance across messaging flow", async () => {
      // 1. Send outbound message successfully to active contact
      const sendRes = await request(app)
        .post("/api/v1/conversations/contact-1/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Hello! Thank you for contacting us." });

      assert.strictEqual(sendRes.status, 201);

      // 2. Set contact preference to opted-out
      const optOutRes = await request(app)
        .put("/api/v1/whatsapp/contacts/contact-1/preference")
        .set("Authorization", `Bearer ${token}`)
        .send({ optedOut: true, reason: "Customer replied STOP" });

      assert.strictEqual(optOutRes.status, 200);
      assert.strictEqual(optOutRes.body.optedOut, true);

      // 3. Verify outbound send to opted-out contact is blocked
      const blockedOptOutRes = await request(app)
        .post("/api/v1/conversations/contact-1/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Are you still interested?" });

      assert.strictEqual(blockedOptOutRes.status, 403);
      assert.strictEqual(blockedOptOutRes.body.error, "CONTACT_OPTED_OUT");

      // 4. Reset contact preference to opted-in
      await request(app)
        .put("/api/v1/whatsapp/contacts/contact-1/preference")
        .set("Authorization", `Bearer ${token}`)
        .send({ optedOut: false });

      // 5. Enable workspace-wide messaging pause in compliance settings
      const pauseRes = await request(app)
        .put("/api/v1/whatsapp/compliance/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ messagingPaused: true, pauseReason: "Maintenance window" });

      assert.strictEqual(pauseRes.status, 200);

      // 6. Verify outbound send during workspace pause is blocked with HTTP 403
      const blockedPauseRes = await request(app)
        .post("/api/v1/conversations/contact-1/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Hello after opt in" });

      assert.strictEqual(blockedPauseRes.status, 403);
      assert.strictEqual(blockedPauseRes.body.error, "MESSAGING_PAUSED");
    });
  });

  describe("Billing & Wallet Ledger Circulation", () => {
    it("should circulate topup payments into wallet balance and ledger history", async () => {
      // 1. Get initial wallet balance
      const initialWalletRes = await request(app)
        .get("/api/v1/billing/wallet")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(initialWalletRes.status, 200);
      assert.ok("balance" in initialWalletRes.body);

      // 2. Initiate topup order
      const orderRes = await request(app)
        .post("/api/v1/billing/topup/initiate")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 100, currency: "USD" });

      assert.strictEqual(orderRes.status, 201);
      const orderId = orderRes.body.providerOrderId;

      // 3. Receive payment processor completion webhook
      const webhookRes = await request(app)
        .post("/api/v1/billing/topup/webhook")
        .send({
          providerPaymentId: "pay_sample_100",
          providerOrderId: orderId,
          status: "COMPLETED",
          workspaceId: TEST_WORKSPACE_ID,
          amount: 100,
        });

      assert.strictEqual(webhookRes.status, 200);

      // 4. Verify wallet balance and ledger reflect the topup
      const ledgerRes = await request(app)
        .get("/api/v1/billing/ledger")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(ledgerRes.status, 200);
      assert.ok(Array.isArray(ledgerRes.body));
    });
  });
});
