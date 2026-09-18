import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, auth } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";
import {
  FEATURE_META,
  FeatureKey,
  updateBusinessConfig,
  useBusinessConfig,
} from "@/lib/business-config";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings - WhatsApp CRM" },
      { name: "description", content: "Manage your CRM workspace and notification preferences." },
    ],
  }),
  component: SettingsPage,
});

type Profile = {
  id: string;
  name: string;
  email: string;
  whatsapp_phone?: string | null;
  whatsapp_webhook_url?: string | null;
  auto_reply: boolean;
  notify_new_leads: boolean;
  flag_leaks: boolean;
};

type EmbeddedSignupConfig = {
  appId: string | null;
  configId: string | null;
  graphApiVersion: string;
  solutionId: string | null;
  sessionInfoVersion: string;
  enabled: boolean;
};

type WhatsAppSignupSession = {
  event?: string;
  version?: string | number;
  data?: {
    waba_id?: string;
    phone_number_id?: string;
    business_id?: string;
    display_phone_number?: string;
    business_name?: string;
  };
};

declare global {
  interface Window {
    FB?: {
      init: (options: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        options: Record<string, unknown>,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function loadFacebookSdk(config: EmbeddedSignupConfig) {
  return new Promise<void>((resolve, reject) => {
    if (!config.appId) {
      reject(new Error("Meta App ID is not configured"));
      return;
    }

    const initialize = () => {
      window.FB?.init({
        appId: config.appId!,
        autoLogAppEvents: true,
        xfbml: true,
        version: config.graphApiVersion || "v23.0",
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [autoReply, setAutoReply] = useState(false);
  const [notifyNewLeads, setNotifyNewLeads] = useState(true);
  const [flagLeaks, setFlagLeaks] = useState(true);
  const signupSessionRef = useRef<WhatsAppSignupSession | null>(null);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["workspace-profile"],
    queryFn: () => apiFetch("/workspace/profile"),
  });

  const { data: embeddedConfig } = useQuery<EmbeddedSignupConfig>({
    queryKey: ["whatsapp-embedded-signup-config"],
    queryFn: () => apiFetch("/whatsapp/embedded-signup/config"),
  });

  useEffect(() => {
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
    mutationFn: () =>
      apiFetch("/settings/profile", {
        method: "PUT",
        body: JSON.stringify({ name, email }),
      }),
    onSuccess: (updated: any) => {
      auth.setWorkspace(updated);
      queryClient.invalidateQueries({ queryKey: ["workspace-profile"] });
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(err.message || "Failed to update profile"),
  });

  const saveWhatsapp = useMutation({
    mutationFn: () =>
      apiFetch("/settings/whatsapp", {
        method: "PUT",
        body: JSON.stringify({ phone, apiToken, webhookUrl }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-profile"] });
      setApiToken("");
      toast.success("WhatsApp integration saved");
    },
    onError: (err) => toast.error(err.message || "Failed to save WhatsApp settings"),
  });

  const saveRules = useMutation({
    mutationFn: () =>
      apiFetch("/settings/rules", {
        method: "PUT",
        body: JSON.stringify({ autoReply, notifyNewLeads, flagLeaks }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-profile"] });
      toast.success("Automation rules updated");
    },
    onError: (err) => toast.error(err.message || "Failed to update rules"),
  });

  const completeEmbeddedSignup = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch("/whatsapp/embedded-signup/complete", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (connection: any) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-profile"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-embedded-signup-config"] });
      if (connection.displayPhoneNumber) setPhone(connection.displayPhoneNumber);
      toast.success("WhatsApp authorization completed");
    },
    onError: (err) => toast.error(err.message || "WhatsApp authorization failed"),
  });

  const saving = saveProfile.isPending || saveWhatsapp.isPending || saveRules.isPending;
  const connecting = completeEmbeddedSignup.isPending;

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com") return;
      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (payload?.type === "WA_EMBEDDED_SIGNUP") {
          signupSessionRef.current = payload;
        }
      } catch {
        // Ignore non-JSON SDK messages.
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
      window.FB?.login(
        (response) => {
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
            version: signupSessionRef.current?.version,
          });
        },
        {
          config_id: embeddedConfig.configId,
          auth_type: "rerequest",
          response_type: "code",
          override_default_response_type: true,
          extras: {
            sessionInfoVersion: embeddedConfig.sessionInfoVersion || "3",
            setup: embeddedConfig.solutionId ? { solutionID: embeddedConfig.solutionId } : {},
          },
        },
      );
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

    const wantsWhatsappSave =
      apiToken.trim() ||
      phone.trim() !== (profile?.whatsapp_phone || "") ||
      webhookUrl.trim() !== (profile?.whatsapp_webhook_url || "");
    if (wantsWhatsappSave) {
      if (!phone.trim() || !webhookUrl.trim()) {
        toast.error("Phone and webhook URL are required to save WhatsApp settings");
        return;
      }
      await saveWhatsapp.mutateAsync();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading workspace settings..." : "Workspace preferences and integrations."}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Business modules</CardTitle>
            <CardDescription>
              Turn features on or off. Only enabled modules appear in the sidebar and dashboard.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
            Re-run setup
          </Button>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(FEATURE_META) as FeatureKey[]).map((k) => {
            const meta = FEATURE_META[k];
            const on = business.features[k];
            return (
              <div
                key={k}
                className="flex items-start justify-between gap-3 rounded-md border bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{meta.description}</p>
                </div>
                <Switch
                  checked={on}
                  onCheckedChange={(v) => updateBusinessConfig({ features: { [k]: v } as any })}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <OnboardingWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How your team sees this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp integration</CardTitle>
          <CardDescription>Connect your Business number and webhook bridge.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Official Meta connection</p>
              <p className="text-xs text-muted-foreground">
                Use Embedded Signup to authorize WhatsApp Cloud API assets.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={connectWithEmbeddedSignup}
              disabled={!embeddedConfig?.enabled || connecting}
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              Connect WhatsApp
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phone">Business phone</Label>
              <Input
                id="phone"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://example.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="api-token">WhatsApp API token</Label>
              <Input
                id="api-token"
                type="password"
                placeholder={
                  profile?.whatsapp_phone ? "Leave blank to keep existing token" : "Paste API token"
                }
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Auto-reply outside business hours</p>
              <p className="text-xs text-muted-foreground">
                Send a friendly note when your team is away.
              </p>
            </div>
            <Switch checked={autoReply} onCheckedChange={setAutoReply} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Notify me on new leads</p>
              <p className="text-xs text-muted-foreground">
                Surface every new conversation as a lead event.
              </p>
            </div>
            <Switch checked={notifyNewLeads} onCheckedChange={setNotifyNewLeads} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Flag leaks after 5 min</p>
              <p className="text-xs text-muted-foreground">
                Count unread inbound threads after five minutes.
              </p>
            </div>
            <Switch checked={flagLeaks} onCheckedChange={setFlagLeaks} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["workspace-profile"] })}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button onClick={saveAll} disabled={saving || isLoading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
