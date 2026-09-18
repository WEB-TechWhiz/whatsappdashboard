import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { a as apiFetch } from "./api-BwNEdiC0.mjs";
import "../_libs/socket.io-client.mjs";
import { j as CalendarCheck, a7 as TrendingUp, aa as Activity, ab as Flame } from "../_libs/lucide-react.mjs";
import { a as format } from "../_libs/date-fns.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/class-variance-authority.mjs";
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
import "util";
import "../_libs/supports-color.mjs";
import "os";
import "../_libs/has-flag.mjs";
import "../_libs/ws.mjs";
import "events";
import "net";
import "tls";
import "zlib";
import "buffer";
import "crypto";
import "stream";
import "../_libs/socket.io-parser.mjs";
function ReportsPage() {
  const {
    data: summary,
    isLoading: loadingSummary
  } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => apiFetch("/analytics/summary"),
    refetchInterval: 3e4
  });
  const {
    data: bookings = [],
    isLoading: loadingBookings
  } = useQuery({
    queryKey: ["analytics-bookings", "30days"],
    queryFn: () => apiFetch("/analytics/bookings?range=30days"),
    refetchInterval: 3e4
  });
  const {
    data: activity = [],
    isLoading: loadingActivity
  } = useQuery({
    queryKey: ["analytics-activity", "reports"],
    queryFn: () => apiFetch("/analytics/activity?limit=20"),
    refetchInterval: 3e4
  });
  const totalRevenue = bookings.reduce((sum, point) => sum + Number(point.revenue), 0);
  const totalBookings = bookings.reduce((sum, point) => sum + point.bookings, 0);
  const stats = [{
    label: "Weekly bookings",
    value: summary?.weeklyBookings ?? 0,
    icon: CalendarCheck
  }, {
    label: "Monthly bookings",
    value: summary?.monthlyBookings ?? 0,
    icon: TrendingUp
  }, {
    label: "Annual bookings",
    value: summary?.annualBookings ?? 0,
    icon: Activity
  }, {
    label: "Hot leads",
    value: summary?.hotLeads ?? 0,
    icon: Flame
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex max-w-6xl flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Reports" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Live workspace reports from bookings, leads, and activity records." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: stats.map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: stat.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(stat.icon, { className: "h-4 w-4 text-primary" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold", children: loadingSummary ? "..." : stat.value.toLocaleString() }) })
    ] }, stat.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "30-day revenue" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold", children: loadingBookings ? "..." : `$${Math.round(totalRevenue).toLocaleString()}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
            totalBookings.toLocaleString(),
            " bookings recorded"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Recent activity" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: loadingActivity ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading activity..." }) : activity.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y", children: activity.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "shrink-0 capitalize", children: item.type.replaceAll("_", " ") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm", children: item.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: format(new Date(item.time), "PPp") })
          ] })
        ] }, item.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No report activity has been recorded for this workspace yet." }) })
      ] })
    ] })
  ] });
}
export {
  ReportsPage as component
};
