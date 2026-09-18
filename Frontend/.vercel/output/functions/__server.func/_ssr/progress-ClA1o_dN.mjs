import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { b as auth, a as apiFetch } from "./api-BwNEdiC0.mjs";
import { R as Root, I as Indicator } from "../_libs/radix-ui__react-progress.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
const FEATURE_META = {
  crm: {
    label: "Customers & Leads (CRM)",
    description: "Track customers, leads, and opportunities."
  },
  appointments: { label: "Appointments", description: "Bookings, scheduling, and calendars." },
  calendar: { label: "Team Calendar", description: "Shared team calendar view." },
  tasks: { label: "Tasks", description: "Assign and track internal work." },
  ai: { label: "AI Center", description: "AI assistant, auto-replies, insights." },
  whatsapp: { label: "WhatsApp", description: "WhatsApp conversations inbox." },
  email: { label: "Email", description: "Email inbox and sending." },
  sms: { label: "SMS", description: "SMS conversations." },
  marketing: { label: "Marketing", description: "Segments, broadcasts, funnels." },
  campaigns: { label: "Campaigns", description: "Multi-channel marketing campaigns." },
  invoices: { label: "Invoices", description: "Create and manage invoices." },
  payments: { label: "Payments", description: "Collect and track payments." },
  products: { label: "Products", description: "Sell physical or digital products." },
  services: { label: "Services", description: "Offer bookable services." },
  inventory: { label: "Inventory", description: "Track stock and warehouses." },
  employees: { label: "Employees / Staff", description: "Team roster and roles." },
  reports: { label: "Reports", description: "Business reports and exports." },
  analytics: { label: "Analytics", description: "Charts, KPIs, and trends." },
  workflows: { label: "Workflow Builder", description: "Custom automations and flows." },
  automation: { label: "Automation", description: "Triggers and scheduled actions." },
  knowledge: { label: "Knowledge Base", description: "Internal wiki / help docs." },
  documents: { label: "Documents", description: "Store shared documents." }
};
const STORAGE_KEY = "flowly.business.config.v1";
const DEFAULT_CONFIG = {
  onboarded: false,
  name: "",
  industry: "",
  teamSize: "1-5",
  features: {
    crm: true,
    appointments: true,
    calendar: false,
    tasks: true,
    ai: true,
    whatsapp: true,
    email: false,
    sms: false,
    marketing: true,
    campaigns: false,
    invoices: true,
    payments: true,
    products: false,
    services: true,
    inventory: false,
    employees: true,
    reports: false,
    analytics: true,
    workflows: false,
    automation: false,
    knowledge: false,
    documents: false
  }
};
let listeners = /* @__PURE__ */ new Set();
let cache = null;
let hydrated = false;
let hydrating = null;
function read() {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cache = {
        ...DEFAULT_CONFIG,
        ...parsed,
        features: { ...DEFAULT_CONFIG.features, ...parsed.features || {} }
      };
      return cache;
    }
  } catch {
  }
  cache = DEFAULT_CONFIG;
  return cache;
}
function write(next) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
    }
  }
  listeners.forEach((l) => l());
}
function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function useBusinessConfig() {
  const config = reactExports.useSyncExternalStore(
    subscribe,
    () => read(),
    () => DEFAULT_CONFIG
  );
  return config;
}
function toServerPayload(cfg) {
  const out = {};
  if (cfg.name !== void 0) out.businessName = cfg.name;
  if (cfg.industry !== void 0) out.industry = cfg.industry;
  if (cfg.teamSize !== void 0) out.teamSize = cfg.teamSize;
  if (cfg.features !== void 0) out.features = cfg.features;
  if (cfg.onboarded !== void 0) out.onboardingCompleted = cfg.onboarded;
  return out;
}
function fromServer(row) {
  return {
    onboarded: !!row?.onboardingCompleted,
    name: row?.businessName ?? "",
    industry: row?.industry ?? "",
    teamSize: row?.teamSize ?? "1-5",
    features: { ...DEFAULT_CONFIG.features, ...row?.features || {} }
  };
}
async function hydrateBusinessConfig() {
  if (typeof window === "undefined") return;
  if (hydrated) return;
  if (hydrating) return hydrating;
  if (!auth.isAuthenticated()) return;
  hydrating = (async () => {
    try {
      const row = await apiFetch("/settings/workspace");
      write(fromServer(row));
      hydrated = true;
    } catch {
    } finally {
      hydrating = null;
    }
  })();
  return hydrating;
}
function useHydrateBusinessConfig() {
  reactExports.useEffect(() => {
    void hydrateBusinessConfig();
  }, []);
}
function updateBusinessConfig(patch) {
  const current = read();
  const next = {
    ...current,
    ...patch,
    features: { ...current.features, ...patch.features || {} }
  };
  write(next);
  if (typeof window !== "undefined" && auth.isAuthenticated()) {
    void apiFetch("/settings/workspace", {
      method: "PUT",
      body: JSON.stringify(toServerPayload(patch))
    }).catch(() => void 0);
  }
}
function useIsHydrated() {
  const [ready, setReady] = reactExports.useState(false);
  reactExports.useEffect(() => setReady(true), []);
  return ready;
}
const Progress = reactExports.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    ref,
    className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Indicator,
      {
        className: "h-full w-full flex-1 bg-primary transition-all",
        style: { transform: `translateX(-${100 - (value || 0)}%)` }
      }
    )
  }
));
Progress.displayName = Root.displayName;
export {
  FEATURE_META as F,
  Progress as P,
  useIsHydrated as a,
  useHydrateBusinessConfig as b,
  updateBusinessConfig as c,
  useBusinessConfig as u
};
