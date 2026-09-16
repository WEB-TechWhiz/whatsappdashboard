import pool from "../config/db.js";

function messageDirection(message) {
  return message.direction || (message.is_agent ? "OUTBOUND" : "INBOUND");
}

function usageTimestamp(message, fallback = new Date()) {
  return message.provider_timestamp || message.created_at || fallback;
}

function billingStatusFor({ billable }) {
  if (billable === false) return "IGNORED";
  return "UNRATED";
}

function toUsageDTO(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    connectionId: row.connection_id || null,
    messageId: row.message_id,
    direction: row.direction,
    category: row.category,
    recipientCountry: row.recipient_country || null,
    quantity: row.quantity,
    provider: row.provider,
    providerMessageId: row.provider_message_id || null,
    providerPricingType: row.provider_pricing_type || null,
    billable: row.billable,
    timestamp: row.timestamp,
    billingStatus: row.billing_status,
  };
}

async function recordMessageUsage(message, metadata = {}) {
  if (!message?.workspace_id || !message?.id) return null;

  const category = metadata.category || "UNKNOWN";
  const billable = typeof metadata.billable === "boolean" ? metadata.billable : null;
  const billingStatus = metadata.billingStatus || billingStatusFor({ billable });

  const { rows } = await pool.query(
    `INSERT INTO whatsapp_message_usage (
       workspace_id,
       connection_id,
       message_id,
       direction,
       category,
       recipient_country,
       quantity,
       provider,
       provider_message_id,
       provider_pricing_type,
       billable,
       timestamp,
       billing_status
     )
     VALUES ($1, $2, $3, $4, $5, $6, 1, 'META', $7, $8, $9, $10, $11)
     ON CONFLICT (workspace_id, message_id) DO UPDATE SET
       connection_id = COALESCE(whatsapp_message_usage.connection_id, EXCLUDED.connection_id),
       category = CASE
         WHEN whatsapp_message_usage.category = 'UNKNOWN' THEN EXCLUDED.category
         ELSE whatsapp_message_usage.category
       END,
       recipient_country = COALESCE(whatsapp_message_usage.recipient_country, EXCLUDED.recipient_country),
       provider_message_id = COALESCE(whatsapp_message_usage.provider_message_id, EXCLUDED.provider_message_id),
       provider_pricing_type = COALESCE(
         EXCLUDED.provider_pricing_type,
         whatsapp_message_usage.provider_pricing_type
       ),
       billable = COALESCE(EXCLUDED.billable, whatsapp_message_usage.billable),
       timestamp = COALESCE(whatsapp_message_usage.timestamp, EXCLUDED.timestamp),
       billing_status = CASE
         WHEN whatsapp_message_usage.billing_status IN ('BILLED', 'RATED') THEN whatsapp_message_usage.billing_status
         WHEN EXCLUDED.billing_status = 'IGNORED' THEN 'IGNORED'
         ELSE whatsapp_message_usage.billing_status
       END,
       updated_at = now()
     RETURNING *`,
    [
      message.workspace_id,
      metadata.connectionId || message.connection_id || null,
      message.id,
      metadata.direction || messageDirection(message),
      category,
      metadata.recipientCountry || null,
      metadata.providerMessageId || message.provider_message_id || null,
      metadata.providerPricingType || null,
      billable,
      metadata.timestamp || usageTimestamp(message),
      billingStatus,
    ],
  );

  return toUsageDTO(rows[0]);
}

async function recordUsageFromStatus(workspaceId, status) {
  if (!workspaceId || !status?.id) return null;

  const { rows } = await pool.query(
    `SELECT *
     FROM messages
     WHERE workspace_id = $1 AND provider_message_id = $2
     LIMIT 1`,
    [workspaceId, status.id],
  );
  const message = rows[0];
  if (!message) return null;

  const pricing = status.pricing || {};
  return recordMessageUsage(message, {
    category: pricing.category || "UNKNOWN",
    providerPricingType: pricing.pricing_model || pricing.type || null,
    billable: typeof pricing.billable === "boolean" ? pricing.billable : null,
    timestamp: status.timestamp ? new Date(Number(status.timestamp) * 1000) : null,
  });
}

async function listUsage(workspaceId, { limit = 100, billingStatus } = {}) {
  const params = [workspaceId];
  let statusClause = "";
  if (billingStatus) {
    params.push(String(billingStatus).toUpperCase());
    statusClause = `AND billing_status = $${params.length}`;
  }

  params.push(Math.min(Number(limit) || 100, 500));
  const { rows } = await pool.query(
    `SELECT *
     FROM whatsapp_message_usage
     WHERE workspace_id = $1 ${statusClause}
     ORDER BY timestamp DESC
     LIMIT $${params.length}`,
    params,
  );

  return rows.map(toUsageDTO);
}

async function getUsageSummary(workspaceId, { days = 30 } = {}) {
  const lookbackDays = Math.min(Math.max(Number(days) || 30, 1), 365);
  const { rows } = await pool.query(
    `SELECT
       direction,
       category,
       billing_status,
       COUNT(*)::int AS messages,
       COALESCE(SUM(quantity), 0)::int AS quantity
     FROM whatsapp_message_usage
     WHERE workspace_id = $1
       AND timestamp >= now() - ($2 || ' days')::interval
     GROUP BY direction, category, billing_status
     ORDER BY direction, category, billing_status`,
    [workspaceId, lookbackDays],
  );

  return {
    days: lookbackDays,
    rows,
  };
}

export { getUsageSummary, listUsage, recordMessageUsage, recordUsageFromStatus, toUsageDTO };
