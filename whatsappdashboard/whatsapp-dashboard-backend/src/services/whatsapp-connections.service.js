import pool from "../config/db.js";
import { decrypt, encrypt } from "../utils/crypto.js";
import {
  exchangeCodeForToken,
  fetchPhoneNumbers,
  fetchWabaInfo,
  subscribeAppToWaba,
} from "./meta-embedded-signup.service.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

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
      statusReason:
        "Local credentials exist. Official webhook subscription still needs verification.",
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

async function getConnectionRowForUpdate(client, workspaceId) {
  const { rows } = await client.query(
    `SELECT *
     FROM whatsapp_connections
     WHERE workspace_id = $1
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [workspaceId],
  );
  return rows[0] || null;
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

async function initiateConnection(workspaceId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await getConnectionRowForUpdate(client, workspaceId);
    let row;

    if (existing) {
      const updated = await client.query(
        `UPDATE whatsapp_connections
         SET status = CASE
               WHEN status = 'DISCONNECTED' THEN 'RECONNECTING'
               ELSE status
             END,
             status_reason = CASE
               WHEN status = 'DISCONNECTED' THEN 'Connection is ready to be re-authorized.'
               ELSE COALESCE(status_reason, 'Connection setup has been initialized.')
             END,
             last_error_code = NULL,
             last_error_message = NULL,
             disconnected_at = NULL,
             updated_at = now()
         WHERE workspace_id = $1 AND id = $2
         RETURNING *`,
        [workspaceId, existing.id],
      );
      row = updated.rows[0];
    } else {
      const inserted = await client.query(
        `INSERT INTO whatsapp_connections (
           workspace_id,
           provider,
           connection_mode,
           status,
           webhook_status,
           status_reason
         )
         VALUES ($1, $2, $3, 'PENDING', 'PENDING', 'Connection setup has been initialized.')
         RETURNING *`,
        [workspaceId, DEFAULT_PROVIDER, DEFAULT_CONNECTION_MODE],
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

async function disconnectConnection(workspaceId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await getConnectionRowForUpdate(client, workspaceId);
    if (!existing) {
      const inserted = await client.query(
        `INSERT INTO whatsapp_connections (
           workspace_id,
           provider,
           connection_mode,
           status,
           webhook_status,
           status_reason,
           disconnected_at
         )
         VALUES ($1, $2, $3, 'DISCONNECTED', 'PENDING', 'Connection was disconnected by the workspace.', now())
         RETURNING *`,
        [workspaceId, DEFAULT_PROVIDER, DEFAULT_CONNECTION_MODE],
      );
      await client.query("COMMIT");
      return toConnectionDTO(inserted.rows[0]);
    }

    const { rows } = await client.query(
      `UPDATE whatsapp_connections
       SET status = 'DISCONNECTED',
           webhook_status = CASE WHEN webhook_status = 'SUBSCRIBED' THEN 'UNKNOWN' ELSE webhook_status END,
           status_reason = 'Connection was disconnected by the workspace.',
           last_error_code = NULL,
           last_error_message = NULL,
           connected_at = NULL,
           disconnected_at = now(),
           updated_at = now()
       WHERE workspace_id = $1 AND id = $2
       RETURNING *`,
      [workspaceId, existing.id],
    );

    await client.query("COMMIT");
    return toConnectionDTO(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function reconnectConnection(workspaceId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await getConnectionRowForUpdate(client, workspaceId);
    if (!existing) {
      const inserted = await client.query(
        `INSERT INTO whatsapp_connections (
           workspace_id,
           provider,
           connection_mode,
           status,
           webhook_status,
           status_reason
         )
         VALUES ($1, $2, $3, 'PENDING', 'PENDING', 'Connection setup has been initialized.')
         RETURNING *`,
        [workspaceId, DEFAULT_PROVIDER, DEFAULT_CONNECTION_MODE],
      );
      await client.query("COMMIT");
      return toConnectionDTO(inserted.rows[0]);
    }

    const targetStatus = existing.access_token_encrypted ? "RECONNECTING" : "PENDING";
    const { rows } = await client.query(
      `UPDATE whatsapp_connections
       SET status = $1,
           status_reason = CASE
             WHEN $1 = 'RECONNECTING' THEN 'Connection is queued for health verification.'
             ELSE 'Connection needs credentials before it can reconnect.'
           END,
           last_error_code = NULL,
           last_error_message = NULL,
           disconnected_at = NULL,
           updated_at = now()
       WHERE workspace_id = $2 AND id = $3
       RETURNING *`,
      [targetStatus, workspaceId, existing.id],
    );

    await client.query("COMMIT");
    return toConnectionDTO(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function healthCheckConnection(workspaceId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await getConnectionRowForUpdate(client, workspaceId);
    if (!existing) {
      const inserted = await client.query(
        `INSERT INTO whatsapp_connections (
           workspace_id,
           provider,
           connection_mode,
           status,
           webhook_status,
           status_reason,
           last_health_check_at
         )
         VALUES ($1, $2, $3, 'PENDING', 'PENDING', 'No WhatsApp connection has been created for this workspace.', now())
         RETURNING *`,
        [workspaceId, DEFAULT_PROVIDER, DEFAULT_CONNECTION_MODE],
      );
      await client.query("COMMIT");
      return {
        connection: toConnectionDTO(inserted.rows[0]),
        checks: localHealthFromRow(inserted.rows[0]).checks,
      };
    }

    const health = localHealthFromRow(existing);
    const { rows } = await client.query(
      `UPDATE whatsapp_connections
       SET status = $1,
           status_reason = $2,
           last_error_code = $3,
           last_error_message = $4,
           last_health_check_at = now(),
           connected_at = CASE WHEN $1 = 'CONNECTED' THEN COALESCE(connected_at, now()) ELSE connected_at END,
           disconnected_at = CASE WHEN $1 = 'DISCONNECTED' THEN COALESCE(disconnected_at, now()) ELSE disconnected_at END,
           updated_at = now()
       WHERE workspace_id = $5 AND id = $6
       RETURNING *`,
      [
        health.status,
        health.statusReason,
        health.lastErrorCode,
        health.lastErrorMessage,
        workspaceId,
        existing.id,
      ],
    );

    await client.query("COMMIT");
    return {
      connection: toConnectionDTO(rows[0]),
      checks: health.checks,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function completeEmbeddedSignup(workspaceId, payload) {
  const token = await exchangeCodeForToken(payload.code);
  const encryptedToken = encrypt(token.accessToken);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await getConnectionRowForUpdate(client, workspaceId);
    let row;

    if (existing) {
      const { rows } = await client.query(
        `UPDATE whatsapp_connections
         SET waba_id = COALESCE($1, waba_id),
             phone_number_id = COALESCE($2, phone_number_id),
             provider_account_id = COALESCE($3, provider_account_id),
             display_phone_number = COALESCE($4, display_phone_number),
             business_name = COALESCE($5, business_name),
             access_token_encrypted = $6,
             provider = $7,
             connection_mode = 'CLOUD_API_ONLY',
             status = CASE
               WHEN COALESCE($1, waba_id) IS NOT NULL OR COALESCE($2, phone_number_id) IS NOT NULL
                 THEN 'ASSETS_DISCOVERED'
               ELSE 'AUTHENTICATED'
             END,
             webhook_status = CASE
               WHEN webhook_status IS NULL THEN 'PENDING'
               ELSE webhook_status
             END,
             status_reason = 'Embedded Signup authorization completed. Webhook subscription still needs verification.',
             last_error_code = NULL,
             last_error_message = NULL,
             disconnected_at = NULL,
             updated_at = now()
         WHERE workspace_id = $8 AND id = $9
         RETURNING *`,
        [
          payload.wabaId || null,
          payload.phoneNumberId || null,
          payload.businessId || null,
          payload.displayPhoneNumber || null,
          payload.businessName || null,
          encryptedToken,
          DEFAULT_PROVIDER,
          workspaceId,
          existing.id,
        ],
      );
      row = rows[0];
    } else {
      const { rows } = await client.query(
        `INSERT INTO whatsapp_connections (
           workspace_id,
           waba_id,
           phone_number_id,
           provider_account_id,
           display_phone_number,
           business_name,
           access_token_encrypted,
           provider,
           connection_mode,
           status,
           webhook_status,
           status_reason
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CLOUD_API_ONLY', $9, 'PENDING',
                 'Embedded Signup authorization completed. Webhook subscription still needs verification.')
         RETURNING *`,
        [
          workspaceId,
          payload.wabaId || null,
          payload.phoneNumberId || null,
          payload.businessId || null,
          payload.displayPhoneNumber || null,
          payload.businessName || null,
          encryptedToken,
          DEFAULT_PROVIDER,
          payload.wabaId || payload.phoneNumberId ? "ASSETS_DISCOVERED" : "AUTHENTICATED",
        ],
      );
      row = rows[0];
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

async function getConnectionSecret(workspaceId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM whatsapp_connections
     WHERE workspace_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [workspaceId],
  );
  const row = rows[0];
  if (!row) throw new NotFoundError("WhatsApp connection");
  if (!row.access_token_encrypted) {
    throw new BadRequestError(
      "WhatsApp connection is missing credentials",
      "WHATSAPP_CREDENTIALS_MISSING",
    );
  }
  return { row, accessToken: decrypt(row.access_token_encrypted) };
}

async function discoverAssets(workspaceId) {
  const { row, accessToken } = await getConnectionSecret(workspaceId);
  if (!row.waba_id) {
    throw new BadRequestError("WhatsApp Business Account ID is missing", "WABA_ID_MISSING");
  }

  const waba = await fetchWabaInfo(accessToken, row.waba_id);
  const phones = await fetchPhoneNumbers(accessToken, row.waba_id);
  const primaryPhone =
    phones.data?.find((phone) => phone.id === row.phone_number_id) || phones.data?.[0];

  const { rows } = await pool.query(
    `UPDATE whatsapp_connections
     SET business_name = COALESCE($1, business_name),
         phone_number_id = COALESCE(phone_number_id, $2),
         display_phone_number = COALESCE(display_phone_number, $3),
         status = CASE
           WHEN COALESCE(phone_number_id, $2) IS NOT NULL THEN 'ASSETS_DISCOVERED'
           ELSE 'AUTHENTICATED'
         END,
         status_reason = 'WhatsApp assets were discovered from Meta.',
         last_error_code = NULL,
         last_error_message = NULL,
         updated_at = now()
     WHERE workspace_id = $4 AND id = $5
     RETURNING *`,
    [
      waba.name || null,
      primaryPhone?.id || null,
      primaryPhone?.display_phone_number || null,
      workspaceId,
      row.id,
    ],
  );

  return {
    connection: toConnectionDTO(rows[0]),
    waba,
    phoneNumbers: phones.data || [],
  };
}

async function subscribeWebhook(workspaceId) {
  const { row, accessToken } = await getConnectionSecret(workspaceId);
  if (!row.waba_id) {
    throw new BadRequestError("WhatsApp Business Account ID is missing", "WABA_ID_MISSING");
  }

  const subscription = await subscribeAppToWaba(accessToken, row.waba_id);
  const { rows } = await pool.query(
    `UPDATE whatsapp_connections
     SET webhook_status = 'SUBSCRIBED',
         status = CASE
           WHEN phone_number_id IS NOT NULL OR display_phone_number IS NOT NULL THEN 'WEBHOOK_SUBSCRIBED'
           ELSE status
         END,
         status_reason = 'App is subscribed to the WhatsApp Business Account webhook.',
         last_error_code = NULL,
         last_error_message = NULL,
         updated_at = now()
     WHERE workspace_id = $1 AND id = $2
     RETURNING *`,
    [workspaceId, row.id],
  );

  return {
    connection: toConnectionDTO(rows[0]),
    subscription,
  };
}

export {
  completeEmbeddedSignup,
  disconnectConnection,
  discoverAssets,
  getConnection,
  healthCheckConnection,
  initiateConnection,
  reconnectConnection,
  saveManualConnection,
  subscribeWebhook,
  toConnectionDTO,
};
