const pool = require("../config/db");

const PLANS = Object.freeze({
  starter: { usageLimit: 1000 },
  growth: { usageLimit: 10000 },
  scale: { usageLimit: 100000 },
});

function getPlan(planKey) {
  return PLANS[planKey] || PLANS.starter;
}

async function getBilling(workspaceId) {
  const { rows } = await pool.query(
    `SELECT workspace_id, stripe_customer_id, stripe_subscription_id, plan_key, subscription_status, current_period_end, usage_limit
     FROM public.workspace_billing WHERE workspace_id = $1`,
    [workspaceId],
  );
  return rows[0] || { workspace_id: workspaceId, plan_key: "starter", subscription_status: "inactive", usage_limit: PLANS.starter.usageLimit };
}

async function recordUsage({ workspaceId, connectionId, providerEventKey, direction, category, billable = false, quantity = 1 }) {
  const { rows } = await pool.query(
    `INSERT INTO public.whatsapp_usage_events
      (workspace_id, connection_id, provider_event_key, direction, category, quantity, billable)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (workspace_id, provider_event_key) DO NOTHING
     RETURNING id`,
    [workspaceId, connectionId || null, providerEventKey, direction, category || null, quantity, billable],
  );
  return Boolean(rows[0]);
}

async function assertUsageAvailable(workspaceId, quantity = 1) {
  const billing = await getBilling(workspaceId);
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(quantity), 0)::int AS used
     FROM public.whatsapp_usage_events
     WHERE workspace_id = $1 AND billable = true
       AND occurred_at >= date_trunc('month', now())`,
    [workspaceId],
  );
  const used = Number(rows[0]?.used || 0);
  if (used + quantity > billing.usage_limit) {
    const error = new Error("Monthly WhatsApp usage limit reached");
    error.statusCode = 402;
    error.code = "USAGE_LIMIT_REACHED";
    throw error;
  }
  return { used, limit: billing.usage_limit };
}

async function upsertSubscription({ workspaceId, customerId, subscriptionId, planKey, status, currentPeriodEnd }) {
  const plan = getPlan(planKey);
  await pool.query(
    `INSERT INTO public.workspace_billing
      (workspace_id, stripe_customer_id, stripe_subscription_id, plan_key, subscription_status, current_period_end, usage_limit)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (workspace_id) DO UPDATE SET
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       plan_key = EXCLUDED.plan_key,
       subscription_status = EXCLUDED.subscription_status,
       current_period_end = EXCLUDED.current_period_end,
       usage_limit = EXCLUDED.usage_limit,
       updated_at = now()`,
    [workspaceId, customerId || null, subscriptionId || null, planKey, status, currentPeriodEnd || null, plan.usageLimit],
  );
}

module.exports = { PLANS, getBilling, recordUsage, assertUsageAvailable, upsertSubscription };
