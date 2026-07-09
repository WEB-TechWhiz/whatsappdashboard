import { useEffect, useState, useSyncExternalStore } from "react";

export type FeatureKey =
  | "crm"
  | "appointments"
  | "calendar"
  | "tasks"
  | "ai"
  | "whatsapp"
  | "email"
  | "sms"
  | "marketing"
  | "campaigns"
  | "invoices"
  | "payments"
  | "products"
  | "services"
  | "inventory"
  | "employees"
  | "reports"
  | "analytics"
  | "workflows"
  | "automation"
  | "knowledge"
  | "documents";

export type BusinessConfig = {
  onboarded: boolean;
  name: string;
  industry: string;
  teamSize: string;
  features: Record<FeatureKey, boolean>;
};

export const FEATURE_META: Record<
  FeatureKey,
  { label: string; description: string }
> = {
  crm: { label: "Customers & Leads (CRM)", description: "Track customers, leads, and opportunities." },
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
  documents: { label: "Documents", description: "Store shared documents." },
};

const STORAGE_KEY = "flowly.business.config.v1";

export const DEFAULT_CONFIG: BusinessConfig = {
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
    documents: false,
  },
};

let listeners = new Set<() => void>();
let cache: BusinessConfig | null = null;

function read(): BusinessConfig {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BusinessConfig>;
      cache = {
        ...DEFAULT_CONFIG,
        ...parsed,
        features: { ...DEFAULT_CONFIG.features, ...(parsed.features || {}) },
      };
      return cache;
    }
  } catch {}
  cache = DEFAULT_CONFIG;
  return cache;
}

function write(next: BusinessConfig) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useBusinessConfig() {
  const config = useSyncExternalStore(
    subscribe,
    () => read(),
    () => DEFAULT_CONFIG,
  );
  return config;
}

export function updateBusinessConfig(patch: Partial<BusinessConfig>) {
  const current = read();
  write({
    ...current,
    ...patch,
    features: { ...current.features, ...(patch.features || {}) },
  });
}

export function resetBusinessConfig() {
  write({ ...DEFAULT_CONFIG });
}

export function useIsHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}