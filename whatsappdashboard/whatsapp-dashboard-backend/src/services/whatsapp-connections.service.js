import pool from "../config/db.js";
import { encrypt } from "../utils/crypto.js";

const DEFAULT_PROVIDER = "META";
const DEFAULT_CONNECTION_MODE = "CLOUD_API_ONLY";

function toConnectionDTO(row) {
  if (!row) {
    return {
      connected: false,
      status: "PENDING",
      webhookStatus: "PENDING",
      connectionMode: DEFAULT_CONNECTION_MODE,
      provider: DEFAULT_PROVIDER,
    };
  }

  return {
    id: row.id,
    connected: row.status === "CONNECTED",
    status: row.status,
    webhookStatus: row.webhook_status,
    connectionMode: row.connection_mode,
    provider: row.provider,
    wabaId: row.waba_id || null,
    phoneNumberId: row.phone_number_id || null,
    displayPhoneNumber: row.display_phone_number || null,
    businessName: row.business_name || null,
    providerAccountId: row.provider_account_id || null,
    webhookUrl: row.webhook_url || null,
    statusReason: row.status_reason || null,
    lastErrorCode: row.last_error_code || null,
    lastErrorMessage: row.last_error_message || null,
    lastHealthCheckAt: row.last_health_check_at || null,
    connectedAt: row.connected_at || null,
    disconnectedAt: row.disconnected_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function localHealthFromRow(row) {
  const checks = {
    credentialStored: Boolean(row?.access_token_encrypted),
    phoneIdentityPresent: Boolean(row?.phone_number_id || row?.display_phone_number),
    webhookConfigured: Boolean(row?.webhook_url),
    webhookSubscribed: row?.webhook_status === "SUBSCRIBED",
  };

  if (!row) {
    return {
      status: "PENDING",
      statusReason: "No WhatsApp connection has been created for this workspace.",
      lastErrorCode: null,
      lastErrorMessage: null,
      checks,
    };
  }

  if (row.status === "DISCONNECTED") {
    return {
      status: "DISCONNECTED",
      statusReason: "Connection was disconnected by the workspace.",
      lastErrorCode: null,
      lastErrorMessage: null,
      checks,
    };
  }

  if (!checks.credentialStored) {
    return {
      status: "ERROR",
      statusReason: "WhatsApp access credentials are missing.",
      lastErrorCode: "MISSING_CREDENTIALS",
      lastErrorMessage: "Save credentials or complete the official connection flow.",
      checks,
    };
  }

  if (!checks.phoneIdentityPresent) {
    return {
      status: "ERROR",
      statusReason: "No WhatsApp phone identity is linked to this workspace.",
      lastErrorCode: "MISSING_PHONE_IDENTITY",
      lastErrorMessage: "A display phone number or Meta phone number ID is required.",
      checks,
    };
  }

  if (!checks.webhookConfigured) {
    return {
      status: "DEGRADED",
      statusReason: "Credentials exist, but webhook configuration is missing.",
      lastErrorCode: "WEBHOOK_NOT_CONFIGURED",
      lastErrorMessage: "Configure the WhatsApp webhook before receiving events.",
      checks,
    };
  }

  if (!checks.webhookSubscribed) {
    return {
      status: "AUTHENTICATED",
      statusReason: "Local credentials exist. Official webhook subscription still needs verification.",
      lastErrorCode: null,
      lastErrorMessage: null,
      checks,
    };
  }

  return {
    status: "CONNECTED",
    statusReason: "Required local connection checks passed.",
    lastErrorCode: null,
    lastErrorMessage: null,
    checks,
  };
}

async function getConnection(workspaceId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM whatsapp_connections
     WHERE workspace_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [workspaceId],
  );

  if (rows[0]) return toConnectionDTO(rows[0]);
  return backfillLegacyConnection(workspaceId);
}

async function backfillLegacyConnection(workspaceId) {
  const { rows } = await pool.query(
    `SELECT id, whatsapp_phone, whatsapp_api_token, whatsapp_webhook_url
     FROM workspaces
     WHERE id = $1`,
    [workspaceId],
  );
  const workspace = rows[0];

  if (
    !workspace ||
    (!workspace.whatsapp_phone && !workspace.whatsapp_api_token && !workspace.whatsapp_webhook_url)
  ) {
    return toConnectionDTO(null);
  }

  const inserted = await pool.query(
    `INSERT INTO whatsapp_connections (
       workspace_id,
       display_phone_number,
       access_token_encrypted,
       webhook_url,
       provider,
       connection_mode,
       status,
       webhook_status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [
      workspaceId,
      workspace.whatsapp_phone,
      workspace.whatsapp_api_token,
      workspace.whatsapp_webhook_url,
      DEFAULT_PROVIDER,
      DEFAULT_CONNECTION_MODE,
      workspace.whatsapp_api_token ? "AUTHENTICATED" : "PENDING",
      workspace.whatsapp_webhook_url ? "UNKNOWN" : "PENDING",
    ],
  );

  if (inserted.rows[0]) return toConnectionDTO(inserted.rows[0]);

  const { rows: existing } = await pool.query(
    `SELECT *
     FROM whatsapp_connections
     WHERE workspace_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [workspaceId],
  );
  return toConnectionDTO(existing[0]);
}

async function saveManualConnection(workspaceId, { phone, apiToken, webhookUrl }) {
  const encryptedToken = apiToken ? encrypt(apiToken) : null;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (apiToken) {
      await client.query(
        `UPDATE workspaces
         SET whatsapp_phone = $1, whatsapp_api_token = $2, whatsapp_webhook_url = $3, updated_at = now()
         WHERE id = $4`,
        [phone, encryptedToken, webhookUrl, workspaceId],
      );
    } else {
      await client.query(
        `UPDATE workspaces
         SET whatsapp_phone = $1, whatsapp_webhook_url = $2, updated_at = now()
         WHERE id = $3`,
        [phone, webhookUrl, workspaceId],
      );
    }

    const existing = await client.query(
      `SELECT *
       FROM whatsapp_connections
       WHERE workspace_id = $1
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [workspaceId],
    );

    let row;
    if (existing.rows[0]) {
      const params = [phone, webhookUrl, workspaceId, existing.rows[0].id];
      const tokenAssignment = encryptedToken
        ? `access_token_encrypted = $${params.push(encryptedToken)},`
        : "";
      const statusAssignment = encryptedToken ? "status = 'AUTHENTICATED'," : "";

      const updated = await client.query(
        `UPDATE whatsapp_connections
         SET display_phone_number = $1,
             webhook_url = $2,
             ${tokenAssignment}
             ${statusAssignment}
             webhook_status = CASE WHEN $2 IS NULL THEN 'PENDING' ELSE webhook_status END,
             status_reason = NULL,
             last_error_code = NULL,
             last_error_message = NULL,
             disconnected_at = NULL,
             updated_at = now()
         WHERE workspace_id = $3 AND id = $4
         RETURNING *`,
        params,
      );
      row = updated.rows[0];
    } else {
      const inserted = await client.query(
        `INSERT INTO whatsapp_connections (
           workspace_id,
           display_phone_number,
           access_token_encrypted,
           webhook_url,
           provider,
           connection_mode,
           status,
           webhook_status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          workspaceId,
          phone,
          encryptedToken,
          webhookUrl,
          DEFAULT_PROVIDER,
          DEFAULT_CONNECTION_MODE,
          encryptedToken ? "AUTHENTICATED" : "PENDING",
          webhookUrl ? "UNKNOWN" : "PENDING",
        ],
      );
      row = inserted.rows[0];
    }

    await client.query("COMMIT");
    return toConnectionDTO(row);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export { getConnection, saveManualConnection, toConnectionDTO };
