const express = require("express");
const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const billing = require("../services/billing.service");
const pool = require("../config/db");

const router = express.Router();

router.post("/stripe", asyncHandler(async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });
  const Stripe = require("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ error: "INVALID_STRIPE_SIGNATURE" });
  }

  const metadata = event.data.object.metadata || {};
  const workspaceId = metadata.workspaceId;
  const dedupeKey = `stripe:${event.id}`;
  if (workspaceId) {
    const claimed = await billing.recordUsage({ workspaceId, providerEventKey: dedupeKey, direction: "system", category: "stripe_webhook", billable: false });
    if (!claimed) return res.json({ received: true, duplicate: true });
  }
  if (!workspaceId) return res.json({ received: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await billing.upsertSubscription({ workspaceId, customerId: session.customer, subscriptionId: session.subscription, planKey: metadata.planKey || "starter", status: "active" });
  }
  if (["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const subscription = event.data.object;
    await billing.upsertSubscription({ workspaceId, customerId: subscription.customer, subscriptionId: subscription.id, planKey: metadata.planKey || subscription.metadata?.planKey || "starter", status: subscription.status, currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null });
  }

  res.json({ received: true });
}));

module.exports = router;
