// const pool = require("../config/db");
import pool from "../config/db.js";
// const { NotFoundError } = require("../utils/errors");
import { NotFoundError } from "../utils/errors.js";
import { createNotification } from "./notifications.service.js";
function toLeadDTO(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    source: row.source,
    status: row.status,
    lastMessage: row.last_message_preview || "",
    value: Number(row.deal_value).toFixed(2),
  };
}

async function listLeads(workspaceId, { status, search }) {
  const params = [workspaceId];
  const clauses = [];

  if (status) {
    params.push(status);
    clauses.push(`c.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    clauses.push(`c.name ILIKE $${params.length}`);
  }

  const where = clauses.length ? `AND ${clauses.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT c.*,
       (SELECT text FROM messages m WHERE m.contact_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_preview
     FROM contacts c
     WHERE c.workspace_id = $1 ${where}
     ORDER BY c.updated_at DESC`,
    params,
  );

  return rows.map(toLeadDTO);
}

async function createLead(workspaceId, { name, phone, source, status, value }) {
  const { rows } = await pool.query(
    `INSERT INTO contacts (workspace_id, name, phone, source, status, deal_value)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [workspaceId, name, phone, source, status, value],
  );

  await pool.query(
    `INSERT INTO activity_log (workspace_id, contact_id, type, description)
     VALUES ($1, $2, 'lead_created', $3)`,
    [workspaceId, rows[0].id, `New lead: ${name}`],
  );

  await createNotification(workspaceId, {
    type: "lead",
    title: "New lead",
    body: `${name} came in via ${source}`,
    link: `/dashboard/leads`,
  });

  return toLeadDTO(rows[0]);
}

async function updateLead(workspaceId, contactId, { status, value }) {
  const existing = await pool.query(`SELECT * FROM contacts WHERE id = $1 AND workspace_id = $2`, [
    contactId,
    workspaceId,
  ]);
  if (existing.rows.length === 0) throw new NotFoundError("Lead");

  const fields = [];
  const params = [];

  if (status !== undefined) {
    params.push(status);
    fields.push(`status = $${params.length}`);
  }
  if (value !== undefined) {
    params.push(value);
    fields.push(`deal_value = $${params.length}`);
  }
  fields.push(`updated_at = now()`);

  params.push(contactId, workspaceId);
  const { rows } = await pool.query(
    `UPDATE contacts SET ${fields.join(", ")}
     WHERE id = $${params.length - 1} AND workspace_id = $${params.length}
     RETURNING *`,
    params,
  );

  const updated = rows[0];

  // Assumption: a booking snapshot is recorded whenever status flips TO 'Booked'.
  // This is what powers "Today's Cash" and the weekly bookings chart.
  if (status === "Booked" && existing.rows[0].status !== "Booked") {
    await pool.query(`INSERT INTO bookings (workspace_id, contact_id, value) VALUES ($1, $2, $3)`, [
      workspaceId,
      contactId,
      updated.deal_value,
    ]);
    await pool.query(
      `INSERT INTO activity_log (workspace_id, contact_id, type, description)
       VALUES ($1, $2, 'demo_booked', $3)`,
      [workspaceId, contactId, `${updated.name} booked`],
    );
    await createNotification(workspaceId, {
      type: "booking",
      title: "Booking confirmed",
      body: `${updated.name} — $${Number(updated.deal_value).toFixed(2)}`,
      link: `/dashboard/leads`,
    });
  } else if (status !== undefined) {
    await pool.query(
      `INSERT INTO activity_log (workspace_id, contact_id, type, description)
       VALUES ($1, $2, 'status_changed', $3)`,
      [workspaceId, contactId, `${updated.name} moved to ${status}`],
    );
  }

  return toLeadDTO(updated);
}

export { listLeads, createLead, updateLead };
