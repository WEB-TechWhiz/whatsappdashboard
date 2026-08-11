import express from "express";
import Stripe from "stripe";
import asyncHandler from "../utils/asyncHandler.js";
import * as billing from "../services/billing.service.js";
import pool from "../config/db.js";

const router = express.Router();

router.post("/stripe", asyncHandler(async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ error: "INVALID_STRIPE_SIGNATURE" });
  }

  const object = event.data.object;
  const metadata = object.metadata || {};
  const workspaceId = metadata.workspaceId;
  const customerId = object.customer || object.customer_id || null;
  const claimed = await pool.query(
    `INSERT INTO public.stripe_webhook_events (event_id, event_type, customer_id, payload)
     VALUES ($1, $2, $3, $4::jsonb) ON CONFLICT (event_id) DO NOTHING RETURNING id`,
    [event.id, event.type, customerId, JSON.stringify(event)],
  );
  if (!claimed.rows[0]) return res.json({ received: true, duplicate: true });

  let resolvedWorkspaceId = workspaceId;
  if (!resolvedWorkspaceId && customerId) {
    const billingRow = await pool.query("SELECT workspace_id FROM public.workspace_billing WHERE stripe_customer_id = $1 LIMIT 1", [customerId]);
    resolvedWorkspaceId = billingRow.rows[0]?.workspace_id;
  }
  if (!resolvedWorkspaceId) return res.json({ received: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await billing.upsertSubscription({ workspaceId: resolvedWorkspaceId, customerId: session.customer, subscriptionId: session.subscription, planKey: metadata.planKey || "starter", status: "active" });
  }
  if (["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const subscription = event.data.object;
    await billing.upsertSubscription({ workspaceId: resolvedWorkspaceId, customerId: subscription.customer, subscriptionId: subscription.id, planKey: metadata.planKey || subscription.metadata?.planKey || "starter", status: subscription.status, currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null });
  }

  await pool.query("UPDATE public.stripe_webhook_events SET processed_at = now() WHERE event_id = $1", [event.id]);
  res.json({ received: true });
}));

export default router;
