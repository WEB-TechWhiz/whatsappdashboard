import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { a as apiFetch } from "./api-BwNEdiC0.mjs";
import "../_libs/socket.io-client.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import { a as format } from "../_libs/date-fns.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/tanstack__query-core.mjs";
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
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
function AnalyticsPage() {
  const [range, setRange] = reactExports.useState("7days");
  const {
    data: overview,
    isLoading: loadingOverview
  } = useQuery({
    queryKey: ["analytics-overview", range],
    queryFn: () => apiFetch(`/analytics/overview?range=${range === "7days" ? "week" : "month"}`),
    refetchInterval: 15e3
  });
  const {
    data: bookings = [],
    isLoading: loadingBookings
  } = useQuery({
    queryKey: ["analytics-bookings", range],
    queryFn: () => apiFetch(`/analytics/bookings?range=${range}`),
    refetchInterval: 15e3
  });
  const maxBookings = Math.max(1, ...bookings.map((point) => point.bookings));
  const totalBookings = bookings.reduce((sum, point) => sum + point.bookings, 0);
  const totalRevenue = bookings.reduce((sum, point) => sum + Number(point.revenue), 0);
  const avgRevenue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const chartPoints = reactExports.useMemo(() => {
    if (bookings.length > 0) return bookings;
    const fallbackDays = range === "7days" ? 7 : 30;
    return Array.from({
      length: fallbackDays
    }, (_, index) => ({
      date: new Date(Date.now() - (fallbackDays - index - 1) * 864e5).toISOString(),
      revenue: "0",
      bookings: 0
    }));
  }, [bookings, range]);
  const stats = [{
    label: "Response rate",
    value: loadingOverview ? "..." : `${overview?.responseRate ?? 0}%`,
    delta: "Live"
  }, {
    label: "Conversion rate",
    value: loadingOverview ? "..." : `${overview?.bookingRate ?? 0}%`,
    delta: "Live"
  }, {
    label: "Revenue",
    value: loadingBookings ? "..." : `$${Math.round(totalRevenue).toLocaleString()}`,
    delta: `${totalBookings} bookings`
  }, {
    label: "Avg booking",
    value: loadingBookings ? "..." : `$${Math.round(avgRevenue).toLocaleString()}`,
    delta: range === "7days" ? "7 days" : "30 days"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Analytics" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Live pipeline performance from backend data." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 rounded-md border bg-card p-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: range === "7days" ? "default" : "ghost", className: "h-7", onClick: () => setRange("7days"), children: "7 days" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: range === "30days" ? "default" : "ghost", className: "h-7", onClick: () => setRange("30days"), children: "30 days" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-4", children: stats.map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: stat.label }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-bold", children: stat.value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-success", children: stat.delta })
      ] }) })
    ] }, stat.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Bookings" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-64 items-end justify-between gap-2", children: chartPoints.map((point, index) => {
          const height = Math.max(4, point.bookings / maxBookings * 100);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: {
              height: 0
            }, animate: {
              height: `${height}%`
            }, transition: {
              delay: index * 0.015,
              duration: 0.45,
              ease: "easeOut"
            }, className: "w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors", title: `${point.bookings} bookings, $${Number(point.revenue).toLocaleString()}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-full truncate text-center text-[10px] text-muted-foreground", children: format(new Date(point.date), range === "7days" ? "EEE" : "d MMM") })
          ] }, `${point.date}-${index}`);
        }) }),
        !loadingBookings && bookings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-center text-sm text-muted-foreground", children: "No bookings recorded for this range yet." }) : null
      ] })
    ] })
  ] });
}
export {
  AnalyticsPage as component
};
