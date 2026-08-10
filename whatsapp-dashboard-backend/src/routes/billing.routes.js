const express = require("express");
const requireAuth = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const pool = require("../config/db");
const billing = require("../services/billing.service");

const router = express.Router();

router.get("/billing", requireAuth, asyncHandler(async (req, res) => {
  const state = await billing.getBilling(req.workspaceId);
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(quantity), 0)::int AS used
     FROM public.whatsapp_usage_events
     WHERE workspace_id = $1 AND billable = true AND occurred_at >= date_trunc('month', now())`,
    [req.workspaceId],
  );
  res.json({ ...state, usage: Number(rows[0]?.used || 0) });
}));

router.post("/billing/checkout", requireAuth, asyncHandler(async (req, res) => {
  const planKey = String(req.body?.planKey || "");
  if (!billing.PLANS[planKey]) return res.status(400).json({ error: "INVALID_PLAN", message: "Unknown billing plan" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED", message: "Stripe billing is not configured" });

  const Stripe = require("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { rows } = await pool.query(`SELECT email FROM workspaces WHERE id = $1`, [req.workspaceId]);
  const billingState = await billing.getBilling(req.workspaceId);
  const customer = billingState.stripe_customer_id
    ? await stripe.customers.retrieve(billingState.stripe_customer_id)
    : await stripe.customers.create({ email: rows[0]?.email, metadata: { workspaceId: req.workspaceId } });
  const priceId = process.env[`STRIPE_PRICE_${planKey.toUpperCase()}`];
  if (!priceId) return res.status(503).json({ error: "STRIPE_PRICE_NOT_CONFIGURED", message: `Missing Stripe price for ${planKey}` });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_ORIGIN}/settings?billing=success`,
    cancel_url: `${process.env.FRONTEND_ORIGIN}/settings?billing=cancelled`,
    metadata: { workspaceId: req.workspaceId, planKey },
    subscription_data: { metadata: { workspaceId: req.workspaceId, planKey } },
  });
  res.json({ url: session.url });
}));

module.exports = router;
