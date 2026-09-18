import pool from "../config/db.js";
import { updateSettings } from "./whatsapp-compliance.service.js";

/**
 * List all WhatsApp connections across all customer workspaces.
 */
async function listSystemConnections({ status, limit = 100 } = {}) {
  const params = [];
  let statusClause = "";

  if (status) {
    params.push(status.toUpperCase());
    statusClause = `WHERE c.status = $${params.length}`;
  }

  params.push(Math.min(Number(limit) || 100, 500));

  const { rows } = await pool.query(
    `SELECT
       c.id,
       c.workspace_id,
       w.name AS workspace_name,
       w.email AS workspace_email,
       c.waba_id,
       c.phone_number_id,
       c.display_phone_number,
       c.business_name,
       c.connection_mode,
       c.status,
       c.webhook_status,
       c.last_error_code,
       c.last_error_message,
       c.last_health_check_at,
       c.updated_at
     FROM whatsapp_connections c
     JOIN workspaces w ON w.id = c.workspace_id
     ${statusClause}
     ORDER BY c.updated_at DESC
     LIMIT $${params.length}`,
    params,
  );

  return rows;
}

/**
 * System-wide platform overview for operators.
 */
async function getPlatformOverview() {
  const connectionsRes = await pool.query(
    `SELECT status, COUNT(*)::int AS count
     FROM whatsapp_connections
     GROUP BY status`,
  );

  const messagesTodayRes = await pool.query(
    `SELECT
       direction,
       provider_status,
       COUNT(*)::int AS count
     FROM messages
     WHERE created_at >= CURRENT_DATE
     GROUP BY direction, provider_status`,
  );

  const financialSummaryRes = await pool.query(
    `SELECT
       COALESCE(SUM(balance), 0)::numeric(12,2) AS total_client_wallets,
       COUNT(DISTINCT workspace_id)::int AS total_wallets
     FROM whatsapp_wallets`,
  );

  return {
    connectionsByStatus: connectionsRes.rows,
    messagesToday: messagesTodayRes.rows,
    financialOverview: financialSummaryRes.rows[0] || { total_client_wallets: 0, total_wallets: 0 },
  };
}

/**
 * Super-admin emergency kill-switch toggle for a specific workspace or global.
 */
async function toggleWorkspaceKillSwitch(adminUserId, { workspaceId, paused, reason }) {
  const result = await updateSettings(
    workspaceId,
    { messagingPaused: paused, pauseReason: reason || "Emergency admin intervention" },
    { actorType: "SUPER_ADMIN", actorId: adminUserId },
  );
  return result;
}

/**
 * System audit log lookup across all workspaces.
 */
async function listSystemAuditLogs({ workspaceId, eventType, limit = 100 } = {}) {
  const params = [];
  const clauses = [];

  if (workspaceId) {
    params.push(workspaceId);
    clauses.push(`l.workspace_id = $${params.length}`);
  }

  if (eventType) {
    params.push(eventType);
    clauses.push(`l.event_type = $${params.length}`);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  params.push(Math.min(Number(limit) || 100, 500));

  const { rows } = await pool.query(
    `SELECT
       l.*,
       w.name AS workspace_name
     FROM whatsapp_audit_log l
     LEFT JOIN workspaces w ON w.id = l.workspace_id
     ${whereClause}
     ORDER BY l.created_at DESC
     LIMIT $${params.length}`,
    params,
  );

  return rows;
}

export {
  getPlatformOverview,
  listSystemAuditLogs,
  listSystemConnections,
  toggleWorkspaceKillSwitch,
};
