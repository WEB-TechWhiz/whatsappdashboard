const crypto = require("crypto");
const pool = require("../config/db");
const { encrypt } = require("../utils/crypto");
const { NotFoundError, ConflictError } = require("../utils/errors");

function hashVerifyToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function redact(row) {
  return {
    id: row.id,
    provider: row.provider,
    mode: row.mode,
    status: row.status,
    displayName: row.display_name,
    phoneNumber: row.phone_number,
    phoneNumberId: row.phone_number_id,
    wabaId: row.waba_id,
    businessId: row.business_id,
    tokenLast4: row.token_last4,
    connectedAt: row.connected_at,
    lastHealthCheckAt: row.last_health_check_at,
    lastHealthError: row.last_health_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listConnections(organizationId) {
  const { rows } = await pool.query(
    `SELECT * FROM public.whatsapp_connections
     WHERE organization_id = $1 ORDER BY created_at DESC`,
    [organizationId],
  );
  return rows.map(redact);
}

async function createConnection(organizationId, input) {
  const token = input.accessToken?.trim();
  if (!token) throw new ConflictError("An access token is required");

  const encryptedToken = encrypt(token);
  const verifyToken = input.webhookVerifyToken?.trim() || crypto.randomBytes(24).toString("hex");
  const { rows } = await pool.query(
    `INSERT INTO public.whatsapp_connections
      (organization_id, provider, mode, status, display_name, phone_number, phone_number_id,
       waba_id, business_id, encrypted_access_token, token_last4, webhook_verify_token_hash)
     VALUES ($1, 'meta', $2, 'PENDING', $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      organizationId,
      input.mode || "cloud_api",
      input.displayName || null,
      input.phoneNumber || null,
      input.phoneNumberId || null,
      input.wabaId || null,
      input.businessId || null,
      encryptedToken,
      token.slice(-4),
      hashVerifyToken(verifyToken),
    ],
  );
  return { connection: redact(rows[0]), webhookVerifyToken: verifyToken };
}

async function disconnectConnection(organizationId, id) {
  const { rows } = await pool.query(
    `UPDATE public.whatsapp_connections
     SET status = 'DISCONNECTED', disconnected_at = now(), updated_at = now(), encrypted_access_token = NULL
     WHERE id = $1 AND organization_id = $2 RETURNING *`,
    [id, organizationId],
  );
  if (!rows[0]) throw new NotFoundError("WhatsApp connection");
  return redact(rows[0]);
}

module.exports = { listConnections, createConnection, disconnectConnection };
