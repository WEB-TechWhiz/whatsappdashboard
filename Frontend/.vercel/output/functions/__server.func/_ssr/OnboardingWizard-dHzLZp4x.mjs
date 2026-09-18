import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { R as Root } from "../_libs/radix-ui__react-separator.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription } from "./dialog-CqFFmKRU.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { C as Checkbox$1, a as CheckboxIndicator } from "../_libs/radix-ui__react-checkbox.mjs";
import { R as RadioGroup$1, a as RadioGroupItem$1, b as RadioGroupIndicator } from "../_libs/radix-ui__react-radio-group.mjs";
import { u as useBusinessConfig, P as Progress, F as FEATURE_META, c as updateBusinessConfig } from "./progress-ClA1o_dN.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { d as Sparkles, B as Building2, K as ShoppingBag, N as MessagesSquare, O as Settings2, H as Check, Q as ChevronLeft, x as ChevronRight, J as Circle } from "../_libs/lucide-react.mjs";
import { A as AnimatePresence, m as motion } from "../_libs/framer-motion.mjs";
const Separator = reactExports.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    ref,
    decorative,
    orientation,
    className: cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    ),
    ...props
  }
));
Separator.displayName = Root.displayName;
const Checkbox = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Checkbox$1,
  {
    ref,
    className: cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxIndicator, { className: cn("grid place-content-center text-current"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = Checkbox$1.displayName;
const RadioGroup = reactExports.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroup$1, { className: cn("grid gap-2", className), ...props, ref });
});
RadioGroup.displayName = RadioGroup$1.displayName;
const RadioGroupItem = reactExports.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    RadioGroupItem$1,
    {
      ref,
      className: cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupIndicator, { className: "flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-3.5 w-3.5 fill-primary" }) })
    }
  );
});
RadioGroupItem.displayName = RadioGroupItem$1.displayName;
const STEP_GROUPS = [
  {
    title: "What you sell",
    subtitle: "Pick the offerings your business runs on.",
    icon: ShoppingBag,
    keys: ["services", "products", "inventory", "appointments"]
  },
  {
    title: "How you talk to customers",
    subtitle: "Choose the channels and growth tools you use.",
    icon: MessagesSquare,
    keys: ["crm", "whatsapp", "email", "sms", "marketing", "campaigns", "ai"]
  },
  {
    title: "Operations & finance",
    subtitle: "Turn on the back-office tools you need.",
    icon: Settings2,
    keys: [
      "invoices",
      "payments",
      "employees",
      "tasks",
      "calendar",
      "analytics",
      "reports",
      "workflows",
      "automation",
      "knowledge",
      "documents"
    ]
  }
];
const TEAM_SIZES = ["Just me", "1-5", "6-20", "21-50", "50+"];
function OnboardingWizard({
  open,
  onOpenChange,
  mandatory = false
}) {
  const config = useBusinessConfig();
  const [step, setStep] = reactExports.useState(0);
  const [draft, setDraft] = reactExports.useState(config);
  const totalSteps = 4;
  const progress = (step + 1) / totalSteps * 100;
  const toggle = (key) => setDraft((d) => ({ ...d, features: { ...d.features, [key]: !d.features[key] } }));
  const complete = () => {
    updateBusinessConfig({ ...draft, onboarded: true });
    onOpenChange(false);
  };
  const skip = () => {
    updateBusinessConfig({ ...draft, onboarded: true });
    onOpenChange(false);
  };
  const next = () => {
    if (step === totalSteps - 1) complete();
    else setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));
  const currentGroup = step > 0 ? STEP_GROUPS[step - 1] : null;
  const selectedCount = reactExports.useMemo(
    () => Object.values(draft.features).filter(Boolean).length,
    [draft.features]
  );
  reactExports.useEffect(() => {
    if (open) {
      setStep(0);
      setDraft(config);
    }
  }, [config, open]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: (nextOpen) => !mandatory && onOpenChange(nextOpen), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      className: "flex max-h-[calc(100vh-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0",
      hideClose: mandatory,
      onEscapeKeyDown: mandatory ? (e) => e.preventDefault() : void 0,
      onInteractOutside: mandatory ? (e) => e.preventDefault() : void 0,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 bg-gradient-to-br from-primary/10 via-background to-background px-6 pt-6 pb-4 border-b", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-lg", children: "Set up your workspace" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
                "Step ",
                step + 1,
                " of ",
                totalSteps,
                " — this only takes a minute."
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "hidden sm:inline-flex", children: [
              selectedCount,
              " modules on"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: progress, className: "mt-4 h-1.5" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-y-auto px-6 py-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.div,
          {
            initial: { opacity: 0, x: 16 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -16 },
            transition: { duration: 0.18 },
            children: step === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold", children: "Tell us about your business" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1.5 sm:col-span-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "biz-name", children: "Business name" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "biz-name",
                      placeholder: "e.g. Acme Wellness",
                      value: draft.name,
                      onChange: (e) => setDraft((d) => ({ ...d, name: e.target.value }))
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "biz-industry", children: "Industry (optional)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "biz-industry",
                      placeholder: "Salon, clinic, agency…",
                      value: draft.industry,
                      onChange: (e) => setDraft((d) => ({ ...d, industry: e.target.value }))
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Team size" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    RadioGroup,
                    {
                      value: draft.teamSize,
                      onValueChange: (v) => setDraft((d) => ({ ...d, teamSize: v })),
                      className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
                      children: TEAM_SIZES.map((size) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "label",
                        {
                          className: "flex items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-sm cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: size }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: size })
                          ]
                        },
                        size
                      ))
                    }
                  )
                ] })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                currentGroup && /* @__PURE__ */ jsxRuntimeExports.jsx(currentGroup.icon, { className: "h-4 w-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold", children: currentGroup?.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: currentGroup?.subtitle })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: currentGroup?.keys.map((k) => {
                const meta = FEATURE_META[k];
                const on = draft.features[k];
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => toggle(k),
                    className: "group text-left flex items-start gap-3 rounded-lg border bg-card p-3 transition hover:border-primary/50 " + (on ? "border-primary bg-primary/5" : ""),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border " + (on ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"),
                          children: on && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: meta.label }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground line-clamp-2", children: meta.description })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { className: "sr-only", checked: on, tabIndex: -1 })
                    ]
                  },
                  k
                );
              }) })
            ] })
          },
          step
        ) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center justify-between border-t bg-muted/30 px-6 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: skip, children: "Skip for now" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            step > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: back, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
              "Back"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: next, children: [
              "Next",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
            ] })
          ] })
        ] })
      ]
    }
  ) });
}
export {
  OnboardingWizard as O,
  Separator as S
};
