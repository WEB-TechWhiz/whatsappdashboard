import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { S as Switch$1, a as SwitchThumb } from "../_libs/radix-ui__react-switch.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { O as OnboardingWizard, S as Separator } from "./OnboardingWizard-dHzLZp4x.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as apiFetch, b as auth } from "./api-BwNEdiC0.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as useBusinessConfig, F as FEATURE_META, c as updateBusinessConfig } from "./progress-ClA1o_dN.mjs";
import "../_libs/socket.io-client.mjs";
import { L as LoaderCircle, w as MessageCircle } from "../_libs/lucide-react.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-separator.mjs";
import "./dialog-CqFFmKRU.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-effect-event+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/radix-ui__react-checkbox.mjs";
import "../_libs/radix-ui__react-radio-group.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "./badge-DyfXZgLs.mjs";
import "../_libs/framer-motion.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/radix-ui__react-progress.mjs";
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
const Switch = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Switch$1,
  {
    className: cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      SwitchThumb,
      {
        className: cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = Switch$1.displayName;
function loadFacebookSdk(config) {
  return new Promise((resolve, reject) => {
    if (!config.appId) {
      reject(new Error("Meta App ID is not configured"));
      return;
    }
    const initialize = () => {
      window.FB?.init({
        appId: config.appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: config.graphApiVersion || "v23.0"
      });
      resolve();
    };
    if (window.FB) {
      initialize();
      return;
    }
    window.fbAsyncInit = initialize;
    if (document.getElementById("facebook-jssdk")) return;
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.onerror = () => reject(new Error("Could not load Facebook SDK"));
    document.body.appendChild(script);
  });
}
function SettingsPage() {
  const queryClient = useQueryClient();
  const business = useBusinessConfig();
  const [wizardOpen, setWizardOpen] = reactExports.useState(false);
  const [name, setName] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [apiToken, setApiToken] = reactExports.useState("");
  const [webhookUrl, setWebhookUrl] = reactExports.useState("");
  const [autoReply, setAutoReply] = reactExports.useState(false);
  const [notifyNewLeads, setNotifyNewLeads] = reactExports.useState(true);
  const [flagLeaks, setFlagLeaks] = reactExports.useState(true);
  const signupSessionRef = reactExports.useRef(null);
  const {
    data: profile,
    isLoading
  } = useQuery({
    queryKey: ["workspace-profile"],
    queryFn: () => apiFetch("/workspace/profile")
  });
  const {
    data: embeddedConfig
  } = useQuery({
    queryKey: ["whatsapp-embedded-signup-config"],
    queryFn: () => apiFetch("/whatsapp/embedded-signup/config")
  });
  reactExports.useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setEmail(profile.email || "");
    setPhone(profile.whatsapp_phone || "");
    setWebhookUrl(profile.whatsapp_webhook_url || "");
    setAutoReply(profile.auto_reply);
    setNotifyNewLeads(profile.notify_new_leads);
    setFlagLeaks(profile.flag_leaks);
  }, [profile]);
  const saveProfile = useMutation({
    mutationFn: () => apiFetch("/settings/profile", {
      method: "PUT",
      body: JSON.stringify({
        name,
        email
      })
    }),
    onSuccess: (updated) => {
      auth.setWorkspace(updated);
      queryClient.invalidateQueries({
        queryKey: ["workspace-profile"]
      });
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(err.message || "Failed to update profile")
  });
  const saveWhatsapp = useMutation({
    mutationFn: () => apiFetch("/settings/whatsapp", {
      method: "PUT",
      body: JSON.stringify({
        phone,
        apiToken,
        webhookUrl
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-profile"]
      });
      setApiToken("");
      toast.success("WhatsApp integration saved");
    },
    onError: (err) => toast.error(err.message || "Failed to save WhatsApp settings")
  });
  const saveRules = useMutation({
    mutationFn: () => apiFetch("/settings/rules", {
      method: "PUT",
      body: JSON.stringify({
        autoReply,
        notifyNewLeads,
        flagLeaks
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-profile"]
      });
      toast.success("Automation rules updated");
    },
    onError: (err) => toast.error(err.message || "Failed to update rules")
  });
  const completeEmbeddedSignup = useMutation({
    mutationFn: (payload) => apiFetch("/whatsapp/embedded-signup/complete", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
    onSuccess: (connection) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-profile"]
      });
      queryClient.invalidateQueries({
        queryKey: ["whatsapp-embedded-signup-config"]
      });
      if (connection.displayPhoneNumber) setPhone(connection.displayPhoneNumber);
      toast.success("WhatsApp authorization completed");
    },
    onError: (err) => toast.error(err.message || "WhatsApp authorization failed")
  });
  const saving = saveProfile.isPending || saveWhatsapp.isPending || saveRules.isPending;
  const connecting = completeEmbeddedSignup.isPending;
  reactExports.useEffect(() => {
    const listener = (event) => {
      if (event.origin !== "https://www.facebook.com") return;
      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (payload?.type === "WA_EMBEDDED_SIGNUP") {
          signupSessionRef.current = payload;
        }
      } catch {
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);
  const connectWithEmbeddedSignup = async () => {
    if (!embeddedConfig?.enabled || !embeddedConfig.configId) {
      toast.error("Meta Embedded Signup is not configured");
      return;
    }
    try {
      await loadFacebookSdk(embeddedConfig);
      window.FB?.login((response) => {
        const code = response.authResponse?.code;
        if (!code) {
          toast.error("WhatsApp authorization was cancelled");
          return;
        }
        completeEmbeddedSignup.mutate({
          code,
          wabaId: signupSessionRef.current?.data?.waba_id,
          phoneNumberId: signupSessionRef.current?.data?.phone_number_id,
          businessId: signupSessionRef.current?.data?.business_id,
          displayPhoneNumber: signupSessionRef.current?.data?.display_phone_number,
          businessName: signupSessionRef.current?.data?.business_name,
          event: signupSessionRef.current?.event,
          version: signupSessionRef.current?.version
        });
      }, {
        config_id: embeddedConfig.configId,
        auth_type: "rerequest",
        response_type: "code",
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: embeddedConfig.sessionInfoVersion || "3",
          setup: embeddedConfig.solutionId ? {
            solutionID: embeddedConfig.solutionId
          } : {}
        }
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start WhatsApp signup");
    }
  };
  const saveAll = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    await saveProfile.mutateAsync();
    await saveRules.mutateAsync();
    const wantsWhatsappSave = apiToken.trim() || phone.trim() !== (profile?.whatsapp_phone || "") || webhookUrl.trim() !== (profile?.whatsapp_webhook_url || "");
    if (wantsWhatsappSave) {
      if (!phone.trim() || !webhookUrl.trim()) {
        toast.error("Phone and webhook URL are required to save WhatsApp settings");
        return;
      }
      await saveWhatsapp.mutateAsync();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Settings" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: isLoading ? "Loading workspace settings..." : "Workspace preferences and integrations." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-start justify-between gap-4 space-y-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Business modules" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Turn features on or off. Only enabled modules appear in the sidebar and dashboard." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => setWizardOpen(true), children: "Re-run setup" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "grid gap-2 sm:grid-cols-2", children: Object.keys(FEATURE_META).map((k) => {
        const meta = FEATURE_META[k];
        const on = business.features[k];
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 rounded-md border bg-card px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: meta.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground line-clamp-2", children: meta.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: on, onCheckedChange: (v) => updateBusinessConfig({
            features: {
              [k]: v
            }
          }) })
        ] }, k);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OnboardingWizard, { open: wizardOpen, onOpenChange: setWizardOpen }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Profile" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "How your team sees this workspace." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Display name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "name", value: name, onChange: (e) => setName(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "WhatsApp integration" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Connect your Business number and webhook bridge." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Official Meta connection" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Use Embedded Signup to authorize WhatsApp Cloud API assets." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: connectWithEmbeddedSignup, disabled: !embeddedConfig?.enabled || connecting, children: [
            connecting ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4" }),
            "Connect WhatsApp"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "phone", children: "Business phone" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "phone", placeholder: "+1 555 000 0000", value: phone, onChange: (e) => setPhone(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "webhook-url", children: "Webhook URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "webhook-url", placeholder: "https://example.com/webhook", value: webhookUrl, onChange: (e) => setWebhookUrl(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "api-token", children: "WhatsApp API token" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "api-token", type: "password", placeholder: profile?.whatsapp_phone ? "Leave blank to keep existing token" : "Paste API token", value: apiToken, onChange: (e) => setApiToken(e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Auto-reply outside business hours" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Send a friendly note when your team is away." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: autoReply, onCheckedChange: setAutoReply })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Notify me on new leads" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Surface every new conversation as a lead event." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: notifyNewLeads, onCheckedChange: setNotifyNewLeads })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Flag leaks after 5 min" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Count unread inbound threads after five minutes." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: flagLeaks, onCheckedChange: setFlagLeaks })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => queryClient.invalidateQueries({
        queryKey: ["workspace-profile"]
      }), disabled: saving, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveAll, disabled: saving || isLoading, children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Save changes" })
    ] })
  ] });
}
export {
  SettingsPage as component
};
