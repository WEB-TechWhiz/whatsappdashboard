import pool from "../config/db.js";
import { emitToWorkspace } from "../realtime/socket.js";

function toDTO(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body || "",
    link: row.link || null,
    read: row.read,
    createdAt: row.created_at,
  };
}

export async function listNotifications(workspaceId, { limit = 30, unreadOnly = false } = {}) {
  const clauses = ["workspace_id = $1"];
  const params = [workspaceId];
  if (unreadOnly) clauses.push("read = false");
  params.push(Math.min(limit, 100));
  const { rows } = await pool.query(
    `SELECT * FROM notifications
     WHERE ${clauses.join(" AND ")}
     ORDER BY created_at DESC LIMIT $${params.length}`,
    params,
  );
  return rows.map(toDTO);
}

export async function unreadCount(workspaceId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE workspace_id = $1 AND read = false`,
    [workspaceId],
  );
  return rows[0].count;
}

export async function markRead(workspaceId, id) {
  await pool.query(
    `UPDATE notifications SET read = true WHERE id = $1 AND workspace_id = $2`,
    [id, workspaceId],
  );
}

export async function markAllRead(workspaceId) {
  await pool.query(
    `UPDATE notifications SET read = true WHERE workspace_id = $1 AND read = false`,
    [workspaceId],
  );
}

export async function createNotification(workspaceId, { type, title, body, link }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (workspace_id, type, title, body, link)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [workspaceId, type, title, body || null, link || null],
  );
  const dto = toDTO(rows[0]);
  emitToWorkspace(workspaceId, "notification:new", dto);
  return dto;
}