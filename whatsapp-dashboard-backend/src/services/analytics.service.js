// const pool = require("../config/db");
import pool from "../config/db.js";

const RANGE_TO_INTERVAL = {
  today: "1 day",
  week: "7 days",
  month: "30 days",
};

async function getOverview(workspaceId, range = "today") {
  // LEAKS — inbound messages, unread, older than 5 minutes.
  const leaksQuery = pool.query(
    `SELECT COUNT(*)::int AS count
     FROM messages m
     JOIN contacts c ON c.id = m.contact_id
     WHERE m.workspace_id = $1
       AND m.is_agent = false
       AND m.read = false
       AND m.created_at < now() - interval '5 minutes'`,
    [workspaceId],
  );

  // TODAY'S CASH — sum of bookings recorded today.
  const cashQuery = pool.query(
    `SELECT COALESCE(SUM(value), 0)::numeric AS total
     FROM bookings
     WHERE workspace_id = $1 AND booked_at::date = CURRENT_DATE`,
    [workspaceId],
  );

  // ON DECK — contacts with a follow-up due in the next 2 hours.
  const onDeckQuery = pool.query(
    `SELECT COUNT(*)::int AS count
     FROM contacts
     WHERE workspace_id = $1
       AND next_followup_at IS NOT NULL
       AND next_followup_at BETWEEN now() AND now() + interval '2 hours'`,
    [workspaceId],
  );

  // Pipeline health — response rate (agent replies / inbound in range) and
  // booking rate (booked leads / total leads in range).
  const interval = RANGE_TO_INTERVAL[range] || RANGE_TO_INTERVAL.today;
  const pipelineQuery = pool.query(
    `SELECT
       (SELECT COUNT(*) FROM messages WHERE workspace_id = $1 AND is_agent = false AND created_at > now() - $2::interval) AS inbound,
       (SELECT COUNT(*) FROM messages WHERE workspace_id = $1 AND is_agent = true AND created_at > now() - $2::interval) AS agent_replies,
       (SELECT COUNT(*) FROM contacts WHERE workspace_id = $1 AND created_at > now() - $2::interval) AS total_leads,
       (SELECT COUNT(*) FROM contacts WHERE workspace_id = $1 AND status = 'Booked' AND updated_at > now() - $2::interval) AS booked_leads`,
    [workspaceId, interval],
  );

  const [leaks, cash, onDeck, pipeline] = await Promise.all([
    leaksQuery,
    cashQuery,
    onDeckQuery,
    pipelineQuery,
  ]);

  const p = pipeline.rows[0];
  const responseRate = p.inbound > 0 ? Math.min(100, (p.agent_replies / p.inbound) * 100) : 100;
  const bookingRate = p.total_leads > 0 ? (p.booked_leads / p.total_leads) * 100 : 0;

  return {
    leaks: leaks.rows[0].count,
    todaysCash: Number(cash.rows[0].total).toFixed(2),
    onDeck: onDeck.rows[0].count,
    responseRate: Number(responseRate.toFixed(1)),
    bookingRate: Number(bookingRate.toFixed(1)),
  };
}

async function getBookingsChart(workspaceId, range = "7days") {
  const days = range === "7days" ? 7 : range === "30days" ? 30 : 7;

  const { rows } = await pool.query(
    `SELECT date_trunc('day', booked_at)::date AS day, COALESCE(SUM(value), 0)::numeric AS total, COUNT(*)::int AS count
     FROM bookings
     WHERE workspace_id = $1 AND booked_at > now() - ($2 || ' days')::interval
     GROUP BY day
     ORDER BY day ASC`,
    [workspaceId, days],
  );

  return rows.map((r) => ({
    date: r.day,
    revenue: Number(r.total).toFixed(2),
    bookings: r.count,
  }));
}

async function getActivity(workspaceId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT a.*, c.name AS contact_name
     FROM activity_log a
     LEFT JOIN contacts c ON c.id = a.contact_id
     WHERE a.workspace_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2`,
    [workspaceId, limit],
  );

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    description: r.description,
    contactName: r.contact_name,
    time: r.created_at,
  }));
}

async function getSummaryStats(workspaceId) {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM bookings
        WHERE workspace_id = $1 AND booked_at > now() - interval '7 days') AS weekly_bookings,
       (SELECT COUNT(*)::int FROM bookings
        WHERE workspace_id = $1 AND booked_at > now() - interval '30 days') AS monthly_bookings,
       (SELECT COUNT(*)::int FROM bookings
        WHERE workspace_id = $1 AND booked_at > now() - interval '365 days') AS annual_bookings,
       (SELECT COUNT(*)::int FROM contacts
        WHERE workspace_id = $1 AND status = 'Hot') AS hot_leads`,
    [workspaceId],
  );

  const row = rows[0];
  return {
    weeklyBookings: row.weekly_bookings,
    monthlyBookings: row.monthly_bookings,
    annualBookings: row.annual_bookings,
    hotLeads: row.hot_leads,
  };
}

export { getOverview, getBookingsChart, getActivity, getSummaryStats };
