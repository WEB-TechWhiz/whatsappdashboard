import pool from "../config/db.js";

const RANGE_DAYS = { today: 1, week: 7, month: 30, "7d": 7, "30d": 30, "90d": 90 };

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function fillDailySeries(rows, days, valueKey = "value") {
  const map = new Map(rows.map((r) => [dayKey(r.day), Number(r[valueKey])]));
  const out = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, value: map.get(key) ?? 0 });
  }
  return out;
}

export async function getOverview(workspaceId, range = "week") {
  const days = RANGE_DAYS[range] ?? 7;
  const interval = `${days} days`;

  const [kpisRow, revenueSeries, appointmentSeries, customerSeries, funnelRows, activityRows] =
    await Promise.all([
      pool.query(
        `SELECT
           (SELECT COALESCE(SUM(value),0)::numeric FROM bookings
              WHERE workspace_id = $1 AND booked_at::date = CURRENT_DATE) AS revenue_today,
           (SELECT COALESCE(SUM(value),0)::numeric FROM bookings
              WHERE workspace_id = $1 AND booked_at > now() - $2::interval) AS revenue_range,
           (SELECT COUNT(*)::int FROM bookings
              WHERE workspace_id = $1 AND booked_at::date = CURRENT_DATE) AS appointments_today,
           (SELECT COUNT(*)::int FROM bookings
              WHERE workspace_id = $1 AND booked_at > now() - $2::interval) AS appointments_range,
           (SELECT COUNT(*)::int FROM contacts
              WHERE workspace_id = $1) AS active_customers,
           (SELECT COUNT(*)::int FROM contacts
              WHERE workspace_id = $1 AND created_at > now() - $2::interval) AS new_leads,
           (SELECT COUNT(*)::int FROM contacts
              WHERE workspace_id = $1 AND status = 'Hot') AS hot_leads,
           (SELECT COUNT(*)::int FROM messages
              WHERE workspace_id = $1 AND is_agent = false AND read = false) AS unread_messages,
           (SELECT COUNT(*)::int FROM messages
              WHERE workspace_id = $1 AND is_agent = false AND read = false
                AND created_at < now() - interval '5 minutes') AS leaks,
           (SELECT COALESCE(AVG(deal_value),0)::numeric FROM contacts
              WHERE workspace_id = $1) AS avg_deal_value`,
        [workspaceId, interval],
      ),
      pool.query(
        `SELECT date_trunc('day', booked_at)::date AS day, COALESCE(SUM(value),0)::numeric AS value
         FROM bookings
         WHERE workspace_id = $1 AND booked_at > now() - $2::interval
         GROUP BY day ORDER BY day ASC`,
        [workspaceId, interval],
      ),
      pool.query(
        `SELECT date_trunc('day', booked_at)::date AS day, COUNT(*)::int AS value
         FROM bookings
         WHERE workspace_id = $1 AND booked_at > now() - $2::interval
         GROUP BY day ORDER BY day ASC`,
        [workspaceId, interval],
      ),
      pool.query(
        `SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS value
         FROM contacts
         WHERE workspace_id = $1 AND created_at > now() - $2::interval
         GROUP BY day ORDER BY day ASC`,
        [workspaceId, interval],
      ),
      pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM contacts WHERE workspace_id = $1
         GROUP BY status`,
        [workspaceId],
      ),
      pool.query(
        `SELECT a.id, a.type, a.description, a.created_at, c.name AS contact_name
         FROM activity_log a
         LEFT JOIN contacts c ON c.id = a.contact_id
         WHERE a.workspace_id = $1
         ORDER BY a.created_at DESC LIMIT 20`,
        [workspaceId],
      ),
    ]);

  const k = kpisRow.rows[0];
  const totalLeads =
    (funnelRows.rows.find((r) => r.status === "Hot")?.count ?? 0) +
    (funnelRows.rows.find((r) => r.status === "Warm")?.count ?? 0) +
    (funnelRows.rows.find((r) => r.status === "Cold")?.count ?? 0) +
    (funnelRows.rows.find((r) => r.status === "Booked")?.count ?? 0);
  const booked = funnelRows.rows.find((r) => r.status === "Booked")?.count ?? 0;
  const conversion = totalLeads > 0 ? (booked / totalLeads) * 100 : 0;

  return {
    range,
    kpis: {
      revenueToday: Number(k.revenue_today),
      revenueRange: Number(k.revenue_range),
      appointmentsToday: k.appointments_today,
      appointmentsRange: k.appointments_range,
      activeCustomers: k.active_customers,
      newLeads: k.new_leads,
      hotLeads: k.hot_leads,
      unreadMessages: k.unread_messages,
      leaks: k.leaks,
      avgDealValue: Number(k.avg_deal_value),
      conversionRate: Number(conversion.toFixed(1)),
    },
    charts: {
      revenueTrend: fillDailySeries(revenueSeries.rows, days),
      appointmentTrend: fillDailySeries(appointmentSeries.rows, days),
      customerGrowth: fillDailySeries(customerSeries.rows, days),
      leadFunnel: ["Hot", "Warm", "Cold", "Booked"].map((s) => ({
        stage: s,
        value: funnelRows.rows.find((r) => r.status === s)?.count ?? 0,
      })),
    },
    activity: activityRows.rows.map((r) => ({
      id: r.id,
      type: r.type,
      description: r.description,
      contactName: r.contact_name,
      time: r.created_at,
    })),
  };
}