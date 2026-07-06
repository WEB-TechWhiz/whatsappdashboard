import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Search, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/leads")({
  head: () => ({
    meta: [
      { title: "Leads — WhatsApp CRM" },
      { name: "description", content: "Track and manage every lead in your pipeline." },
    ],
  }),
  component: LeadsPage,
});

type Status = "Hot" | "Warm" | "Cold" | "Booked";

const LEADS: Array<{
  name: string;
  phone: string;
  source: string;
  status: Status;
  lastMessage: string;
  value: string;
}> = [
  { name: "Ayesha Khan", phone: "+92 300 1234567", source: "Instagram", status: "Hot", lastMessage: "2 min ago", value: "$1,200" },
  { name: "Marcus Lee", phone: "+1 415 555 0134", source: "Website", status: "Booked", lastMessage: "9 min ago", value: "$3,400" },
  { name: "Priya Shah", phone: "+91 98765 43210", source: "Referral", status: "Cold", lastMessage: "3 days ago", value: "$800" },
  { name: "Jorge Martinez", phone: "+34 611 223 344", source: "Facebook", status: "Warm", lastMessage: "1 hr ago", value: "$2,100" },
  { name: "Sara Ahmed", phone: "+971 50 111 2222", source: "Instagram", status: "Hot", lastMessage: "12 min ago", value: "$1,900" },
  { name: "David Kim", phone: "+82 10 5555 8888", source: "Website", status: "Warm", lastMessage: "4 hr ago", value: "$950" },
  { name: "Fatima Noor", phone: "+92 321 8880011", source: "Referral", status: "Cold", lastMessage: "5 days ago", value: "$500" },
  { name: "Liam O'Connor", phone: "+353 87 654 3210", source: "Facebook", status: "Booked", lastMessage: "30 min ago", value: "$4,200" },
];

const statusStyles: Record<Status, string> = {
  Hot: "bg-danger/10 text-danger border-danger/20",
  Warm: "bg-warning/10 text-warning border-warning/20",
  Cold: "bg-muted text-muted-foreground border-border",
  Booked: "bg-success/10 text-success border-success/20",
};

function LeadsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = LEADS.filter((l) => {
    if (status !== "all" && l.status !== status) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.source.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {LEADS.length} leads</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1" /> Add lead</Button>
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
                placeholder="Search name, phone, source..."
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
                {filtered.map((l) => (
                  <TableRow key={l.phone}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {l.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{l.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.phone}</TableCell>
                    <TableCell>{l.source}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[l.status]}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.lastMessage}</TableCell>
                    <TableCell className="text-right font-semibold">{l.value}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
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