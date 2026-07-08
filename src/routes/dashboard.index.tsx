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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getSocket } from "@/lib/api";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

const toneStyles: Record<string, string> = {
  danger: "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

function DashboardOverview() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<"today" | "week" | "month">("today");

  // Fetch overview metrics from backend
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["analytics-overview", range],
    queryFn: () => apiFetch(`/analytics/overview?range=${range}`),
    refetchInterval: 15000,
  });

  // Fetch recent activity logs from backend
  const { data: activities, isLoading: loadingActivity } = useQuery({
    queryKey: ["analytics-activity"],
    queryFn: () => apiFetch("/analytics/activity?limit=10"),
    refetchInterval: 15000,
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => apiFetch("/analytics/summary"),
    refetchInterval: 15000,
  });

  // Listen to realtime socket updates
  useEffect(() => {
    try {
      const socket = getSocket();

      const handleRealtimeUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
        queryClient.invalidateQueries({ queryKey: ["analytics-activity"] });
        queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      };

      socket.on("message:new", handleRealtimeUpdate);
      socket.on("lead:created", handleRealtimeUpdate);
      socket.on("lead:updated", handleRealtimeUpdate);

      return () => {
        socket.off("message:new", handleRealtimeUpdate);
        socket.off("lead:created", handleRealtimeUpdate);
        socket.off("lead:updated", handleRealtimeUpdate);
      };
    } catch (err) {
      console.warn("Realtime updates not available:", err);
    }
  }, [queryClient]);

  const bigStats = [
    {
      label: "Leaks",
      value: overview?.leaks ?? 0,
      hint: "Unread > 5 mins",
      icon: AlertTriangle,
      tone: "danger" as const,
    },
    {
      label: "Today's Cash",
      value: overview?.todaysCash ? `$${Number(overview.todaysCash).toLocaleString()}` : "$0",
      hint: "Cash collections from booked leads",
      icon: DollarSign,
      tone: "success" as const,
    },
    {
      label: "On Deck",
      value: overview?.onDeck ?? 0,
      hint: "Follow-ups due in 2 hrs",
      icon: Clock,
      tone: "warning" as const,
    },
  ];

  const smallStats = [
    { label: "Weekly Bookings", value: summary?.weeklyBookings ?? 0, icon: Calendar },
    { label: "Monthly Bookings", value: summary?.monthlyBookings ?? 0, icon: CalendarDays },
    { label: "Annual Bookings", value: summary?.annualBookings ?? 0, icon: CalendarRange },
    { label: "Hot Leads", value: summary?.hotLeads ?? 0, icon: Flame },
  ];

  const getTagFromActivityType = (type: string) => {
    switch (type) {
      case "demo_booked":
        return "Booking";
      case "pricing_requested":
        return "Hot";
      case "lead_created":
        return "Lead";
      case "status_changed":
        return "Status";
      case "message_received":
        return "Reply";
      default:
        return "Event";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">What matters most, right now.</p>
        </div>
        <div className="flex gap-1 rounded-md border bg-card p-1">
          <Button
            size="sm"
            variant={range === "today" ? "default" : "ghost"}
            className="h-7"
            onClick={() => setRange("today")}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={range === "week" ? "default" : "ghost"}
            className="h-7"
            onClick={() => setRange("week")}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={range === "month" ? "default" : "ghost"}
            className="h-7"
            onClick={() => setRange("month")}
          >
            Month
          </Button>
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
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      toneStyles[s.tone],
                    )}
                  >
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight">
                  {loadingOverview ? "..." : s.value}
                </div>
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
              <div className="text-2xl font-semibold">{loadingSummary ? "..." : s.value}</div>
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
            {loadingActivity ? (
              <p className="text-sm text-muted-foreground py-4">Loading activity logs...</p>
            ) : activities && activities.length > 0 ? (
              <ul className="divide-y">
                {activities.map((r: any, i: number) => (
                  <li key={r.id || i} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">{r.description}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.time), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="secondary">{getTagFromActivityType(r.type)}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent activity found.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pipeline health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Response rate", value: overview?.responseRate ?? 0 },
              { label: "Booking rate", value: overview?.bookingRate ?? 0 },
              { label: "Cold recovery (Est.)", value: 21 },
            ].map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="font-medium">{loadingOverview ? "..." : `${p.value}%`}</span>
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
