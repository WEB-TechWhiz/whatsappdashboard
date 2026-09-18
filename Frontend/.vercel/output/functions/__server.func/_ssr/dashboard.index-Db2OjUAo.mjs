import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { u as useBusinessConfig, P as Progress } from "./progress-ClA1o_dN.mjs";
import { b as auth, g as getSocket, a as apiFetch } from "./api-BwNEdiC0.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "../_libs/socket.io-client.mjs";
import { a6 as DollarSign, a7 as TrendingUp, E as Calendar, a8 as Users, G as UserPlus, M as MessageSquare, a9 as BadgeCheck } from "../_libs/lucide-react.mjs";
import { f as formatDistanceToNow } from "../_libs/date-fns.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import { R as ResponsiveContainer, A as AreaChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, a as Area, B as BarChart, b as Bar, L as LineChart, c as Line } from "../_libs/recharts.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-progress.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/tailwind-merge.mjs";
import "../_libs/engine.io-client.mjs";
import "../_libs/xmlhttprequest-ssl.mjs";
import "fs";
import "url";
import "child_process";
import "http";
import "https";
import "../_libs/engine.io-parser.mjs";
import "../_libs/socket.io__component-emitter.mjs";
import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "tty";
import "../_libs/supports-color.mjs";
import "os";
import "../_libs/has-flag.mjs";
import "../_libs/ws.mjs";
import "events";
import "net";
import "tls";
import "zlib";
import "buffer";
import "../_libs/socket.io-parser.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
import "../_libs/lodash.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
const ACTIVITY_ICON = {
  demo_booked: {
    icon: Calendar,
    tone: "primary",
    tag: "Appointment"
  },
  lead_created: {
    icon: UserPlus,
    tone: "primary",
    tag: "Lead"
  },
  status_changed: {
    icon: BadgeCheck,
    tone: "success",
    tag: "Lead"
  },
  message_received: {
    icon: MessageSquare,
    tone: "primary",
    tag: "Message"
  },
  pricing_requested: {
    icon: DollarSign,
    tone: "warning",
    tag: "Sales"
  }
};
const KPIS = [{
  label: "Revenue Today",
  valueKey: "revenueToday",
  format: (value) => `$${Math.round(value).toLocaleString()}`,
  icon: DollarSign,
  tone: "success",
  feature: "payments"
}, {
  label: "Range Revenue",
  valueKey: "revenueRange",
  format: (value) => `$${Math.round(value).toLocaleString()}`,
  icon: TrendingUp,
  tone: "success",
  feature: "payments"
}, {
  label: "Appointments Today",
  valueKey: "appointmentsToday",
  format: (value) => value,
  icon: Calendar,
  tone: "primary",
  feature: "appointments"
}, {
  label: "Active Customers",
  valueKey: "activeCustomers",
  format: (value) => value.toLocaleString(),
  icon: Users,
  tone: "primary",
  feature: "crm"
}, {
  label: "New Leads",
  valueKey: "newLeads",
  format: (value) => value,
  icon: UserPlus,
  tone: "success",
  feature: "crm"
}, {
  label: "Unread Messages",
  valueKey: "unreadMessages",
  format: (value) => value,
  icon: MessageSquare,
  tone: "primary",
  feature: "whatsapp"
}, {
  label: "Conversion Rate",
  valueKey: "conversionRate",
  format: (value) => `${value}%`,
  icon: BadgeCheck,
  tone: "success",
  feature: "analytics"
}, {
  label: "Message Leaks",
  valueKey: "leaks",
  format: (value) => value,
  icon: MessageSquare,
  tone: "danger",
  feature: "whatsapp"
}];
const toneMap = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary/10 text-primary"
};
function hasAnyValue(rows, key) {
  return rows.some((row) => Number(row[key]) > 0);
}
function EmptyChart({
  label
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full min-h-40 items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground", children: label });
}
function DashboardOverview() {
  const [range, setRange] = reactExports.useState("today");
  const config = useBusinessConfig();
  const queryClient = useQueryClient();
  const authed = typeof window !== "undefined" && auth.isAuthenticated();
  const overview = useQuery({
    queryKey: ["dashboard-overview", range],
    queryFn: () => apiFetch(`/dashboard/overview?range=${range}`),
    enabled: authed,
    refetchInterval: 6e4
  });
  reactExports.useEffect(() => {
    if (!authed) return;
    let socket = null;
    try {
      socket = getSocket();
      const refresh = () => {
        queryClient.invalidateQueries({
          queryKey: ["dashboard-overview"]
        });
        queryClient.invalidateQueries({
          queryKey: ["analytics-overview"]
        });
        queryClient.invalidateQueries({
          queryKey: ["analytics-bookings"]
        });
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
  const on = (feature) => !feature || config.features[feature];
  const kpis = KPIS.filter((kpi) => on(kpi.feature));
  const showRevenue = on("payments") || on("invoices");
  const showLeadFunnel = on("crm");
  const showAppointments = on("appointments");
  const showAnalytics = on("analytics");
  const showActivity = on("crm") || on("appointments") || on("whatsapp") || on("payments") || on("workflows");
  const businessName = config.name || auth.getWorkspace()?.name || "your workspace";
  const revenueSeries = overview.data?.charts.revenueTrend.map((row) => ({
    m: row.date.slice(5),
    revenue: row.value
  })) ?? [];
  const funnelSeries = overview.data?.charts.leadFunnel.map((row) => ({
    stage: row.stage,
    value: row.value
  })) ?? [];
  const appointmentSeries = overview.data?.charts.appointmentTrend.map((row) => ({
    d: row.date.slice(5),
    booked: row.value
  })) ?? [];
  const growthSeries = overview.data?.charts.customerGrowth.map((row, index, rows) => ({
    m: row.date.slice(5),
    customers: rows.slice(0, index + 1).reduce((sum, item) => sum + item.value, 0)
  })) ?? [];
  const activityFeed = overview.data?.activity.map((item) => {
    const meta = ACTIVITY_ICON[item.type] ?? {
      icon: MessageSquare,
      tone: "primary",
      tag: "Event"
    };
    return {
      icon: meta.icon,
      tone: meta.tone,
      text: item.description,
      ago: formatDistanceToNow(new Date(item.time), {
        addSuffix: true
      }),
      tag: meta.tag
    };
  }) ?? [];
  const pipelineMetrics = overview.data ? [{
    label: "Response rate",
    value: overview.data.kpis.responseRate
  }, {
    label: "Booking rate",
    value: overview.data.kpis.bookingRate
  }, {
    label: "Conversion",
    value: overview.data.kpis.conversionRate
  }] : [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate text-2xl font-bold tracking-tight", children: "Good afternoon, Admin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Real-time account data for ",
          businessName,
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 rounded-md border bg-card p-1 shrink-0", children: ["today", "week", "month"].map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: range === option ? "default" : "ghost", className: "h-7 capitalize", onClick: () => setRange(option), children: option }, option)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4", children: kpis.map((kpi, index) => {
      const raw = overview.data?.kpis[kpi.valueKey] ?? 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: {
        opacity: 0,
        y: 8
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        delay: index * 0.03
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate", children: kpi.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", toneMap[kpi.tone]), children: /* @__PURE__ */ jsxRuntimeExports.jsx(kpi.icon, { className: "h-3.5 w-3.5" }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold tracking-tight", children: overview.isLoading ? "..." : kpi.format(raw) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: overview.isFetching ? "Syncing live data" : `From ${range} account records` })
        ] })
      ] }) }, kpi.label);
    }) }),
    showRevenue && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Revenue trend" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Bookings revenue for this range" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: range })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-64", children: hasAnyValue(revenueSeries, "revenue") ? /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: revenueSeries, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "rev", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "var(--primary)", stopOpacity: 0.35 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "var(--primary)", stopOpacity: 0 })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)", vertical: false }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "m", stroke: "var(--muted-foreground)", fontSize: 11 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "var(--muted-foreground)", fontSize: 11 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
          background: "var(--popover)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          fontSize: 12
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Area, { type: "monotone", dataKey: "revenue", stroke: "var(--primary)", strokeWidth: 2, fill: "url(#rev)" })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyChart, { label: "No booking revenue recorded for this range yet." }) })
    ] }),
    (showLeadFunnel || showAppointments || showAnalytics) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-3", children: [
      showLeadFunnel && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Lead funnel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Current contacts by status" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-56", children: hasAnyValue(funnelSeries, "value") ? /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: funnelSeries, layout: "vertical", margin: {
          left: 8
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)", horizontal: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { type: "number", stroke: "var(--muted-foreground)", fontSize: 11 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { dataKey: "stage", type: "category", stroke: "var(--muted-foreground)", fontSize: 11, width: 70 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "value", fill: "var(--primary)", radius: [0, 4, 4, 0] })
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyChart, { label: "No leads have been captured for this workspace yet." }) })
      ] }),
      showAppointments && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Appointments" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Bookings created in this range" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-56", children: hasAnyValue(appointmentSeries, "booked") ? /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: appointmentSeries, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)", vertical: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "d", stroke: "var(--muted-foreground)", fontSize: 11 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "var(--muted-foreground)", fontSize: 11 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "booked", fill: "var(--primary)", radius: [4, 4, 0, 0] })
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyChart, { label: "No appointments recorded for this range yet." }) })
      ] }),
      showAnalytics && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Customer growth" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Cumulative contacts in this range" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-56", children: hasAnyValue(growthSeries, "customers") ? /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: growthSeries, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)", vertical: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "m", stroke: "var(--muted-foreground)", fontSize: 11 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "var(--muted-foreground)", fontSize: 11 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "customers", stroke: "var(--chart-2)", strokeWidth: 2.5, dot: {
            r: 3
          } })
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyChart, { label: "No new customers recorded for this range yet." }) })
      ] })
    ] }),
    (showActivity || showAnalytics) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-3", children: [
      showActivity && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "flex flex-row items-center justify-between space-y-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4 text-primary" }),
            "Activity feed"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Latest account events" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: activityFeed.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y", children: activityFeed.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", toneMap[item.tone]), children: /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm truncate", children: item.text }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: item.ago })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "shrink-0", children: item.tag })
        ] }, `${item.text}-${index}`)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyChart, { label: "No activity has been recorded for this workspace yet." }) })
      ] }),
      showAnalytics && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Pipeline health" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: pipelineMetrics.map((metric) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs mb-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: metric.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
              metric.value,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: metric.value, className: "h-1.5" })
        ] }, metric.label)) })
      ] })
    ] })
  ] });
}
export {
  DashboardOverview as component
};
