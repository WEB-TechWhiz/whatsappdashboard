import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  Calendar,
  DollarSign,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiFetch, auth, getSocket } from "@/lib/api";
import { FeatureKey, useBusinessConfig } from "@/lib/business-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

type OverviewResponse = {
  range: string;
  kpis: {
    revenueToday: number;
    revenueRange: number;
    appointmentsToday: number;
    appointmentsRange: number;
    activeCustomers: number;
    newLeads: number;
    hotLeads: number;
    unreadMessages: number;
    leaks: number;
    avgDealValue: number;
    conversionRate: number;
    responseRate: number;
    bookingRate: number;
  };
  charts: {
    revenueTrend: { date: string; value: number }[];
    appointmentTrend: { date: string; value: number }[];
    customerGrowth: { date: string; value: number }[];
    leadFunnel: { stage: string; value: number }[];
  };
  activity: {
    id: string;
    type: string;
    description: string;
    contactName: string | null;
    time: string;
  }[];
};

type Kpi = {
  label: string;
  valueKey: keyof OverviewResponse["kpis"];
  format: (value: number) => string | number;
  icon: LucideIcon;
  tone: string;
  feature?: FeatureKey;
};

const ACTIVITY_ICON: Record<string, { icon: LucideIcon; tone: string; tag: string }> = {
  demo_booked: { icon: Calendar, tone: "primary", tag: "Appointment" },
  lead_created: { icon: UserPlus, tone: "primary", tag: "Lead" },
  status_changed: { icon: BadgeCheck, tone: "success", tag: "Lead" },
  message_received: { icon: MessageSquare, tone: "primary", tag: "Message" },
  pricing_requested: { icon: DollarSign, tone: "warning", tag: "Sales" },
};

const KPIS: Kpi[] = [
  {
    label: "Revenue Today",
    valueKey: "revenueToday",
    format: (value) => `$${Math.round(value).toLocaleString()}`,
    icon: DollarSign,
    tone: "success",
    feature: "payments",
  },
  {
    label: "Range Revenue",
    valueKey: "revenueRange",
    format: (value) => `$${Math.round(value).toLocaleString()}`,
    icon: TrendingUp,
    tone: "success",
    feature: "payments",
  },
  {
    label: "Appointments Today",
    valueKey: "appointmentsToday",
    format: (value) => value,
    icon: Calendar,
    tone: "primary",
    feature: "appointments",
  },
  {
    label: "Active Customers",
    valueKey: "activeCustomers",
    format: (value) => value.toLocaleString(),
    icon: Users,
    tone: "primary",
    feature: "crm",
  },
  {
    label: "New Leads",
    valueKey: "newLeads",
    format: (value) => value,
    icon: UserPlus,
    tone: "success",
    feature: "crm",
  },
  {
    label: "Unread Messages",
    valueKey: "unreadMessages",
    format: (value) => value,
    icon: MessageSquare,
    tone: "primary",
    feature: "whatsapp",
  },
  {
    label: "Conversion Rate",
    valueKey: "conversionRate",
    format: (value) => `${value}%`,
    icon: BadgeCheck,
    tone: "success",
    feature: "analytics",
  },
  {
    label: "Message Leaks",
    valueKey: "leaks",
    format: (value) => value,
    icon: MessageSquare,
    tone: "danger",
    feature: "whatsapp",
  },
];

const toneMap: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary/10 text-primary",
};

function hasAnyValue<T extends Record<string, number>>(rows: T[], key: keyof T) {
  return rows.some((row) => Number(row[key]) > 0);
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function DashboardOverview() {
  const [range, setRange] = useState<"today" | "week" | "month">("today");
  const config = useBusinessConfig();
  const queryClient = useQueryClient();
  const authed = typeof window !== "undefined" && auth.isAuthenticated();
  const overview = useQuery<OverviewResponse>({
    queryKey: ["dashboard-overview", range],
    queryFn: () => apiFetch(`/dashboard/overview?range=${range}`),
    enabled: authed,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!authed) return;
    let socket: ReturnType<typeof getSocket> | null = null;
    try {
      socket = getSocket();
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
        queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
        queryClient.invalidateQueries({ queryKey: ["analytics-bookings"] });
      };
      socket.on("message:new", refresh);
      socket.on("lead:created", refresh);
      socket.on("lead:updated", refresh);
      socket.on("notification:new", refresh);
      return () => {
        socket?.off("message:new", refresh);
        socket?.off("lead:created", refresh);
        socket?.off("lead:updated", refresh);
        socket?.off("notification:new", refresh);
      };
    } catch {
      return;
    }
  }, [authed, queryClient]);

  const on = (feature?: FeatureKey) => !feature || config.features[feature];
  const kpis = KPIS.filter((kpi) => on(kpi.feature));
  const showRevenue = on("payments") || on("invoices");
  const showLeadFunnel = on("crm");
  const showAppointments = on("appointments");
  const showAnalytics = on("analytics");
  const showActivity =
    on("crm") || on("appointments") || on("whatsapp") || on("payments") || on("workflows");
  const businessName = config.name || auth.getWorkspace()?.name || "your workspace";

  const revenueSeries =
    overview.data?.charts.revenueTrend.map((row) => ({
      m: row.date.slice(5),
      revenue: row.value,
    })) ?? [];
  const funnelSeries =
    overview.data?.charts.leadFunnel.map((row) => ({ stage: row.stage, value: row.value })) ?? [];
  const appointmentSeries =
    overview.data?.charts.appointmentTrend.map((row) => ({
      d: row.date.slice(5),
      booked: row.value,
    })) ?? [];
  const growthSeries =
    overview.data?.charts.customerGrowth.map((row, index, rows) => ({
      m: row.date.slice(5),
      customers: rows.slice(0, index + 1).reduce((sum, item) => sum + item.value, 0),
    })) ?? [];
  const activityFeed =
    overview.data?.activity.map((item) => {
      const meta = ACTIVITY_ICON[item.type] ?? {
        icon: MessageSquare,
        tone: "primary",
        tag: "Event",
      };
      return {
        icon: meta.icon,
        tone: meta.tone,
        text: item.description,
        ago: formatDistanceToNow(new Date(item.time), { addSuffix: true }),
        tag: meta.tag,
      };
    }) ?? [];
  const pipelineMetrics = overview.data
    ? [
        { label: "Response rate", value: overview.data.kpis.responseRate },
        { label: "Booking rate", value: overview.data.kpis.bookingRate },
        { label: "Conversion", value: overview.data.kpis.conversionRate },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">Good afternoon, Admin</h1>
          <p className="text-sm text-muted-foreground">
            Real-time account data for {businessName}.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border bg-card p-1 shrink-0">
          {(["today", "week", "month"] as const).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={range === option ? "default" : "ghost"}
              className="h-7 capitalize"
              onClick={() => setRange(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {kpis.map((kpi, index) => {
          const raw = overview.data?.kpis[kpi.valueKey] ?? 0;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                      {kpi.label}
                    </CardTitle>
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        toneMap[kpi.tone],
                      )}
                    >
                      <kpi.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">
                    {overview.isLoading ? "..." : kpi.format(raw)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {overview.isFetching ? "Syncing live data" : `From ${range} account records`}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {showRevenue && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Revenue trend</CardTitle>
              <p className="text-xs text-muted-foreground">Bookings revenue for this range</p>
            </div>
            <Badge variant="secondary">{range}</Badge>
          </CardHeader>
          <CardContent className="h-64">
            {hasAnyValue(revenueSeries, "revenue") ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No booking revenue recorded for this range yet." />
            )}
          </CardContent>
        </Card>
      )}

      {(showLeadFunnel || showAppointments || showAnalytics) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {showLeadFunnel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead funnel</CardTitle>
                <p className="text-xs text-muted-foreground">Current contacts by status</p>
              </CardHeader>
              <CardContent className="h-56">
                {hasAnyValue(funnelSeries, "value") ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelSeries} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        horizontal={false}
                      />
                      <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        width={70}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No leads have been captured for this workspace yet." />
                )}
              </CardContent>
            </Card>
          )}

          {showAppointments && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appointments</CardTitle>
                <p className="text-xs text-muted-foreground">Bookings created in this range</p>
              </CardHeader>
              <CardContent className="h-56">
                {hasAnyValue(appointmentSeries, "booked") ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentSeries}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="booked" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No appointments recorded for this range yet." />
                )}
              </CardContent>
            </Card>
          )}

          {showAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer growth</CardTitle>
                <p className="text-xs text-muted-foreground">Cumulative contacts in this range</p>
              </CardHeader>
              <CardContent className="h-56">
                {hasAnyValue(growthSeries, "customers") ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthSeries}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="customers"
                        stroke="var(--chart-2)"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No new customers recorded for this range yet." />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {(showActivity || showAnalytics) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {showActivity && (
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Activity feed
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Latest account events</p>
                </div>
              </CardHeader>
              <CardContent>
                {activityFeed.length > 0 ? (
                  <ul className="divide-y">
                    {activityFeed.map((item, index) => (
                      <li key={`${item.text}-${index}`} className="flex items-center gap-3 py-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            toneMap[item.tone],
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{item.text}</p>
                          <p className="text-xs text-muted-foreground">{item.ago}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {item.tag}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyChart label="No activity has been recorded for this workspace yet." />
                )}
              </CardContent>
            </Card>
          )}

          {showAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pipeline health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipelineMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium">{metric.value}%</span>
                    </div>
                    <Progress value={metric.value} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
