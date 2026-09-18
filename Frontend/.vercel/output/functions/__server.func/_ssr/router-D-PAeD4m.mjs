import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
const appCss = "/assets/styles-CDA2_fRI.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$a = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "WhatsApp CRM — Leads, Conversations & Insights" },
      {
        name: "description",
        content: "A modern WhatsApp CRM dashboard to track leads, conversations, and revenue in real time."
      },
      { property: "og:title", content: "WhatsApp CRM — Leads, Conversations & Insights" },
      {
        property: "og:description",
        content: "A modern WhatsApp CRM dashboard to track leads, conversations, and revenue in real time."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "WhatsApp CRM — Leads, Conversations & Insights" },
      {
        name: "twitter:description",
        content: "A modern WhatsApp CRM dashboard to track leads, conversations, and revenue in real time."
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$a.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
}
const $$splitComponentImporter$9 = () => import("./signup-B5jJIfcB.mjs");
const Route$9 = createFileRoute("/signup")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./login-ZEs7ICkr.mjs");
const Route$8 = createFileRoute("/login")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./dashboard-ChKXMVqf.mjs");
const Route$7 = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{
      title: "Dashboard — Flowly CRM"
    }, {
      name: "description",
      content: "All-in-one CRM: leads, appointments, AI conversations, and revenue."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./index-CAqvVEFf.mjs");
const Route$6 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./dashboard.index-Db2OjUAo.mjs");
const Route$5 = createFileRoute("/dashboard/")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./dashboard.settings-BFBGvE2m.mjs");
const Route$4 = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [{
      title: "Settings - WhatsApp CRM"
    }, {
      name: "description",
      content: "Manage your CRM workspace and notification preferences."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./dashboard.reports-D079NJiI.mjs");
const Route$3 = createFileRoute("/dashboard/reports")({
  head: () => ({
    meta: [{
      title: "Reports - Flowly CRM"
    }, {
      name: "description",
      content: "Workspace reports generated from live account data."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./dashboard.leads-5zzBUihG.mjs");
const Route$2 = createFileRoute("/dashboard/leads")({
  head: () => ({
    meta: [{
      title: "Leads - WhatsApp CRM"
    }, {
      name: "description",
      content: "Track and manage every lead in your pipeline."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./dashboard.conversations-D7WSb44R.mjs");
const Route$1 = createFileRoute("/dashboard/conversations")({
  head: () => ({
    meta: [{
      title: "Conversations — WhatsApp CRM"
    }, {
      name: "description",
      content: "Chat with leads directly from your dashboard."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./dashboard.analytics-CbVI8zhA.mjs");
const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({
    meta: [{
      title: "Analytics - WhatsApp CRM"
    }, {
      name: "description",
      content: "Response times, conversion rates, and channel breakdown."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SignupRoute = Route$9.update({
  id: "/signup",
  path: "/signup",
  getParentRoute: () => Route$a
});
const LoginRoute = Route$8.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$a
});
const DashboardRoute = Route$7.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$a
});
const IndexRoute = Route$6.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$a
});
const DashboardIndexRoute = Route$5.update({
  id: "/",
  path: "/",
  getParentRoute: () => DashboardRoute
});
const DashboardSettingsRoute = Route$4.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => DashboardRoute
});
const DashboardReportsRoute = Route$3.update({
  id: "/reports",
  path: "/reports",
  getParentRoute: () => DashboardRoute
});
const DashboardLeadsRoute = Route$2.update({
  id: "/leads",
  path: "/leads",
  getParentRoute: () => DashboardRoute
});
const DashboardConversationsRoute = Route$1.update({
  id: "/conversations",
  path: "/conversations",
  getParentRoute: () => DashboardRoute
});
const DashboardAnalyticsRoute = Route.update({
  id: "/analytics",
  path: "/analytics",
  getParentRoute: () => DashboardRoute
});
const DashboardRouteChildren = {
  DashboardAnalyticsRoute,
  DashboardConversationsRoute,
  DashboardLeadsRoute,
  DashboardReportsRoute,
  DashboardSettingsRoute,
  DashboardIndexRoute
};
const DashboardRouteWithChildren = DashboardRoute._addFileChildren(
  DashboardRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  DashboardRoute: DashboardRouteWithChildren,
  LoginRoute,
  SignupRoute
};
const routeTree = Route$a._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router;
};
export {
  getRouter
};
