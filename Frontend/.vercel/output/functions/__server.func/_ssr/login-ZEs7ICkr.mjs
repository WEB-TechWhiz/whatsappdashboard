import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { b as auth, s as startGoogleOAuth, a as apiFetch } from "./api-BwNEdiC0.mjs";
import "../_libs/socket.io-client.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import { M as MessageSquare, L as LoaderCircle, C as Chromium, a as Mail, b as Lock } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
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
function LoginRoute() {
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [oauthLoading, setOauthLoading] = reactExports.useState(false);
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const workspace = params.get("workspace");
    const redirect = params.get("redirect") || "/dashboard";
    if (!accessToken || !refreshToken || !workspace) return;
    try {
      auth.setSession({
        accessToken,
        refreshToken,
        workspace: JSON.parse(workspace)
      });
      window.history.replaceState(null, "", "/login");
      toast.success("Signed in with Google");
      navigate({
        to: redirect
      });
    } catch (err) {
      toast.error("Could not finish Google sign in");
    }
  }, [navigate]);
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      });
      auth.setSession(response);
      toast.success(`Welcome back, ${response.workspace.name}!`);
      navigate({
        to: "/dashboard"
      });
    } catch (err) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleGoogle = async () => {
    setOauthLoading(true);
    try {
      await startGoogleOAuth("/dashboard");
    } catch (err) {
      toast.error(err.message || "Google sign in is not configured yet");
      setOauthLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
    opacity: 0,
    y: 20
  }, animate: {
    opacity: 1,
    y: 0
  }, transition: {
    duration: 0.4
  }, className: "z-10 w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-col items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 text-2xl font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-5 w-5" }) }),
        "Flowly"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Sign in to your WhatsApp CRM workspace" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border bg-card/95 shadow-lg backdrop-blur-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-xl", children: "Welcome back" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Use Google OAuth 2.0 or your workspace password." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", className: "w-full", onClick: handleGoogle, disabled: loading || oauthLoading, children: [
          oauthLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Chromium, { className: "mr-2 h-4 w-4" }),
          "Continue with Google"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" }),
          "or",
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleLogin, className: "grid gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "email", className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-3.5 w-3.5 text-muted-foreground" }),
              " Email"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", type: "email", placeholder: "admin@example.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: loading, required: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "password", className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3.5 w-3.5 text-muted-foreground" }),
              " Password"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "password", type: "password", placeholder: "********", value: password, onChange: (e) => setPassword(e.target.value), disabled: loading, required: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "mt-2 w-full", disabled: loading || oauthLoading, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
            "Signing in..."
          ] }) : "Sign in" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-sm text-muted-foreground", children: [
          "New workspace?",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", className: "font-medium text-foreground hover:underline", children: "Create an account" })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  LoginRoute as component
};
