import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, auth } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

type WhatsAppConnection = {
  id: string;
  status: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  phoneNumberId?: string | null;
  tokenLast4?: string | null;
  connectedAt?: string | null;
};

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
  const [connectionName, setConnectionName] = useState("");
  const [connectionPhone, setConnectionPhone] = useState("");
  const [connectionPhoneId, setConnectionPhoneId] = useState("");
  const [connectionWabaId, setConnectionWabaId] = useState("");
  const [connectionToken, setConnectionToken] = useState("");
  const [billingPlan, setBillingPlan] = useState("growth");

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["workspace-profile"],
    queryFn: () => apiFetch("/workspace/profile"),
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

  const { data: billingData } = useQuery<{ plan_key: string; subscription_status: string; usage: number; usage_limit: number }>({
    queryKey: ["workspace-billing"],
    queryFn: () => apiFetch("/billing"),
  });

  const startCheckout = useMutation({
    mutationFn: () => apiFetch("/billing/checkout", { method: "POST", body: JSON.stringify({ planKey: billingPlan }) }),
    onSuccess: ({ url }: { url: string }) => { window.location.assign(url); },
    onError: (err) => toast.error(err.message || "Unable to start checkout"),
  });

  const { data: connectionData, isLoading: connectionsLoading } = useQuery<{ connections: WhatsAppConnection[] }>({
    queryKey: ["whatsapp-connections"],
    queryFn: () => apiFetch("/whatsapp/connections"),
  });

  const createConnection = useMutation({
    mutationFn: () => apiFetch("/whatsapp/connections", {
      method: "POST",
      body: JSON.stringify({
        displayName: connectionName,
        phoneNumber: connectionPhone,
        phoneNumberId: connectionPhoneId,
        wabaId: connectionWabaId,
        accessToken: connectionToken,
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-connections"] });
      setConnectionToken("");
      toast.success("WhatsApp connection added");
    },
    onError: (err) => toast.error(err.message || "Failed to add connection"),
  });

  const disconnectConnection = useMutation({
    mutationFn: (id: string) => apiFetch(`/whatsapp/connections/${id}/disconnect`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-connections"] });
      toast.success("Connection disconnected");
    },
    onError: (err) => toast.error(err.message || "Failed to disconnect connection"),
  });

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

  const saving = saveProfile.isPending || saveWhatsapp.isPending || saveRules.isPending;

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
          <CardTitle>Billing and usage</CardTitle>
          <CardDescription>Choose a workspace plan and monitor this month&apos;s billable WhatsApp usage.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium capitalize">{billingData?.plan_key || "starter"} plan</p>
              <p className="text-xs text-muted-foreground">{billingData?.usage || 0} / {billingData?.usage_limit || 1000} billable messages this month · {billingData?.subscription_status || "inactive"}</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="h-9 rounded-md border bg-background px-3 text-sm" value={billingPlan} onChange={(e) => setBillingPlan(e.target.value)} aria-label="Billing plan">
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="scale">Scale</option>
              </select>
              <Button onClick={() => startCheckout.mutate()} disabled={startCheckout.isPending}>
                {startCheckout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <CardTitle>WhatsApp Business connections</CardTitle>
          <CardDescription>Connect Cloud API numbers securely. Access tokens are encrypted and never shown again.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Connection name" value={connectionName} onChange={(e) => setConnectionName(e.target.value)} />
            <Input placeholder="Business phone" value={connectionPhone} onChange={(e) => setConnectionPhone(e.target.value)} />
            <Input placeholder="Phone number ID" value={connectionPhoneId} onChange={(e) => setConnectionPhoneId(e.target.value)} />
            <Input placeholder="WhatsApp Business Account ID" value={connectionWabaId} onChange={(e) => setConnectionWabaId(e.target.value)} />
            <Input className="sm:col-span-2" type="password" placeholder="Permanent access token" value={connectionToken} onChange={(e) => setConnectionToken(e.target.value)} />
          </div>
          <Button onClick={() => createConnection.mutate()} disabled={createConnection.isPending || !connectionToken.trim()}>
            {createConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add WhatsApp connection"}
          </Button>
          <div className="grid gap-2">
            {connectionsLoading ? <p className="text-sm text-muted-foreground">Loading connections...</p> : null}
            {!connectionsLoading && !connectionData?.connections?.length ? <p className="text-sm text-muted-foreground">No WhatsApp connections yet.</p> : null}
            {connectionData?.connections?.map((connection) => (
              <div key={connection.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{connection.displayName || connection.phoneNumber || "Unnamed connection"}</p>
                  <p className="text-xs text-muted-foreground">{connection.status} · {connection.phoneNumberId || "Phone ID pending"}{connection.tokenLast4 ? ` · token ending ${connection.tokenLast4}` : ""}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => disconnectConnection.mutate(connection.id)} disabled={disconnectConnection.isPending || connection.status === "DISCONNECTED"}>Disconnect</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legacy WhatsApp bridge</CardTitle>
          <CardDescription>Connect your Business number and webhook bridge.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
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
