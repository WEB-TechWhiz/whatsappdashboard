import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  DollarSign,
  Clock,
  Flame,
  TrendingUp,
  Calendar,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

const bigStats = [
  {
    label: "Leaks",
    value: "3",
    hint: "Unread > 5 mins",
    icon: AlertTriangle,
    tone: "danger" as const,
  },
  {
    label: "Today's Cash",
    value: "$1,250",
    hint: "↑ 12% from yesterday",
    icon: DollarSign,
    tone: "success" as const,
  },
  {
    label: "On Deck",
    value: "5",
    hint: "Follow-ups due in 2 hrs",
    icon: Clock,
    tone: "warning" as const,
  },
];

const smallStats = [
  { label: "Weekly Bookings", value: "12", icon: Calendar },
  { label: "Monthly Bookings", value: "47", icon: CalendarDays },
  { label: "Annual Bookings", value: "512", icon: CalendarRange },
  { label: "Hot Leads", value: "8", icon: Flame },
];

const toneStyles: Record<string, string> = {
  danger: "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

function DashboardOverview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            What matters most, right now.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border bg-card p-1">
          <Button size="sm" variant="default" className="h-7">Today</Button>
          <Button size="sm" variant="ghost" className="h-7">Week</Button>
          <Button size="sm" variant="ghost" className="h-7">Month</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {bigStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {s.label}
                  </CardTitle>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneStyles[s.tone])}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight">{s.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {smallStats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {[
                { who: "Ayesha K.", what: "booked a demo", when: "2m ago", tag: "Booking" },
                { who: "Marcus L.", what: "replied to follow-up", when: "9m ago", tag: "Reply" },
                { who: "Priya S.", what: "went cold — 3 days", when: "1h ago", tag: "Leak" },
                { who: "Jorge M.", what: "requested pricing", when: "3h ago", tag: "Hot" },
              ].map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{r.who}</span>{" "}
                      <span className="text-muted-foreground">{r.what}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{r.when}</p>
                  </div>
                  <Badge variant="secondary">{r.tag}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pipeline health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Response rate", value: 82 },
              { label: "Booking rate", value: 34 },
              { label: "Cold recovery", value: 21 },
            ].map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="font-medium">{p.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.value}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}