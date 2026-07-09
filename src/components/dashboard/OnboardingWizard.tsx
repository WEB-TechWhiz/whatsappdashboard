import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BusinessConfig,
  FEATURE_META,
  FeatureKey,
  updateBusinessConfig,
  useBusinessConfig,
} from "@/lib/business-config";
import { Sparkles, ChevronRight, ChevronLeft, Check, Building2, ShoppingBag, MessagesSquare, Settings2 } from "lucide-react";

const STEP_GROUPS: {
  title: string;
  subtitle: string;
  icon: any;
  keys: FeatureKey[];
}[] = [
  {
    title: "What you sell",
    subtitle: "Pick the offerings your business runs on.",
    icon: ShoppingBag,
    keys: ["services", "products", "inventory", "appointments"],
  },
  {
    title: "How you talk to customers",
    subtitle: "Choose the channels and growth tools you use.",
    icon: MessagesSquare,
    keys: ["crm", "whatsapp", "email", "sms", "marketing", "campaigns", "ai"],
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
      "documents",
    ],
  },
];

const TEAM_SIZES = ["Just me", "1-5", "6-20", "21-50", "50+"];

export function OnboardingWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const config = useBusinessConfig();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BusinessConfig>(config);

  const totalSteps = 4; // 0: basics, 1-3: feature groups
  const progress = ((step + 1) / totalSteps) * 100;

  const toggle = (key: FeatureKey) =>
    setDraft((d) => ({ ...d, features: { ...d.features, [key]: !d.features[key] } }));

  const complete = () => {
    updateBusinessConfig({ ...draft, onboarded: true });
    onOpenChange(false);
  };

  const skip = () => {
    // Save current progress and mark onboarded so we don't nag.
    updateBusinessConfig({ ...draft, onboarded: true });
    onOpenChange(false);
  };

  const next = () => {
    if (step === totalSteps - 1) complete();
    else setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const currentGroup = step > 0 ? STEP_GROUPS[step - 1] : null;
  const selectedCount = useMemo(
    () => Object.values(draft.features).filter(Boolean).length,
    [draft.features],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogHeader className="space-y-0.5">
                <DialogTitle className="text-lg">Set up your workspace</DialogTitle>
                <DialogDescription>
                  Step {step + 1} of {totalSteps} — this only takes a minute.
                </DialogDescription>
              </DialogHeader>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {selectedCount} modules on
            </Badge>
          </div>
          <Progress value={progress} className="mt-4 h-1.5" />
        </div>

        <div className="px-6 py-5 min-h-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              {step === 0 ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold">Tell us about your business</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label htmlFor="biz-name">Business name</Label>
                      <Input
                        id="biz-name"
                        placeholder="e.g. Acme Wellness"
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="biz-industry">Industry (optional)</Label>
                      <Input
                        id="biz-industry"
                        placeholder="Salon, clinic, agency…"
                        value={draft.industry}
                        onChange={(e) => setDraft((d) => ({ ...d, industry: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Team size</Label>
                      <RadioGroup
                        value={draft.teamSize}
                        onValueChange={(v) => setDraft((d) => ({ ...d, teamSize: v }))}
                        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                      >
                        {TEAM_SIZES.map((size) => (
                          <label
                            key={size}
                            className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-sm cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                          >
                            <RadioGroupItem value={size} />
                            <span>{size}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {currentGroup && <currentGroup.icon className="h-4 w-4 text-primary" />}
                    <div>
                      <h3 className="text-base font-semibold">{currentGroup?.title}</h3>
                      <p className="text-xs text-muted-foreground">{currentGroup?.subtitle}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {currentGroup?.keys.map((k) => {
                      const meta = FEATURE_META[k];
                      const on = draft.features[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toggle(k)}
                          className={
                            "group text-left flex items-start gap-3 rounded-lg border bg-card p-3 transition hover:border-primary/50 " +
                            (on ? "border-primary bg-primary/5" : "")
                          }
                        >
                          <div
                            className={
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border " +
                              (on
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground/30")
                            }
                          >
                            {on && <Check className="h-3.5 w-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{meta.label}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {meta.description}
                            </div>
                          </div>
                          <Checkbox className="sr-only" checked={on} tabIndex={-1} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-3">
          <Button variant="ghost" size="sm" onClick={skip}>
            Skip for now
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={back}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {step === totalSteps - 1 ? "Finish" : "Next"}
              {step === totalSteps - 1 ? (
                <Check className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}