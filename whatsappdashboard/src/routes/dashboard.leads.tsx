import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getSocket } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/leads")({
  head: () => ({
    meta: [
      { title: "Leads - WhatsApp CRM" },
      { name: "description", content: "Track and manage every lead in your pipeline." },
    ],
  }),
  component: LeadsPage,
});

type Status = "Hot" | "Warm" | "Cold" | "Booked";
type Source = "Instagram" | "Website" | "Facebook" | "Referral";

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: Source;
  status: Status;
  lastMessage: string;
  value: string;
};

const statusStyles: Record<Status, string> = {
  Hot: "bg-danger/10 text-danger border-danger/20",
  Warm: "bg-warning/10 text-warning border-warning/20",
  Cold: "bg-muted text-muted-foreground border-border",
  Booked: "bg-success/10 text-success border-success/20",
};

const emptyLead = {
  name: "",
  phone: "",
  source: "Website" as Source,
  status: "Warm" as Status,
  value: "",
};

function LeadsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyLead);

  const params = new URLSearchParams();
  if (query.trim()) params.set("search", query.trim());
  if (status !== "all") params.set("status", status);
  const queryString = params.toString();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["leads", queryString],
    queryFn: () => apiFetch(`/leads${queryString ? `?${queryString}` : ""}`),
  });

  const createLead = useMutation({
    mutationFn: () =>
      apiFetch<Lead>("/leads", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          value: Number(form.value || 0),
        }),
      }),
    onSuccess: () => {
      toast.success("Lead created");
      setOpen(false);
      setForm(emptyLead);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-activity"] });
    },
    onError: (err) => toast.error(err.message || "Failed to create lead"),
  });

  const updateLead = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Lead, "status">> & { value?: number };
    }) =>
      apiFetch<Lead>(`/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-activity"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-bookings"] });
    },
    onError: (err) => toast.error(err.message || "Failed to update lead"),
  });

  useEffect(() => {
    try {
      const socket = getSocket();
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      };

      socket.on("lead:created", refresh);
      socket.on("lead:updated", refresh);

      return () => {
        socket.off("lead:created", refresh);
        socket.off("lead:updated", refresh);
      };
    } catch (err) {
      console.warn("Lead realtime updates unavailable:", err);
    }
  }, [queryClient]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading leads..." : `${leads.length} leads`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Add lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add lead</DialogTitle>
              <DialogDescription>Create a contact in the CRM pipeline.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="lead-name">Name</Label>
                <Input
                  id="lead-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-phone">Phone</Label>
                <Input
                  id="lead-phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(value: Source) => setForm((prev) => ({ ...prev, source: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: Status) => setForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hot">Hot</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="Cold">Cold</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="lead-value">Deal value</Label>
                <Input
                  id="lead-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createLead.mutate()}
                disabled={!form.name.trim() || !form.phone.trim() || createLead.isPending}
              >
                {createLead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create lead"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">All leads</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name..."
                className="h-9 w-64 pl-8"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Hot">Hot</SelectItem>
                <SelectItem value="Warm">Warm</SelectItem>
                <SelectItem value="Cold">Cold</SelectItem>
                <SelectItem value="Booked">Booked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last message</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      Loading leads...
                    </TableCell>
                  </TableRow>
                ) : leads.length > 0 ? (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {lead.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{lead.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {lead.phone}
                      </TableCell>
                      <TableCell>{lead.source}</TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value: Status) =>
                            updateLead.mutate({ id: lead.id, patch: { status: value } })
                          }
                        >
                          <SelectTrigger className="h-8 w-32 border-0 bg-transparent p-0 shadow-none">
                            <Badge variant="outline" className={statusStyles[lead.status]}>
                              {lead.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hot">Hot</SelectItem>
                            <SelectItem value="Warm">Warm</SelectItem>
                            <SelectItem value="Cold">Cold</SelectItem>
                            <SelectItem value="Booked">Booked</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.lastMessage || "No messages yet"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={Number(lead.value).toFixed(2)}
                          className="ml-auto h-8 w-28 text-right"
                          onBlur={(e) => {
                            const value = Number(e.target.value || 0);
                            if (value !== Number(lead.value)) {
                              updateLead.mutate({ id: lead.id, patch: { value } });
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      No leads match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
