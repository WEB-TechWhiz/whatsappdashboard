import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Activity, CalendarCheck, Flame, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/dashboard/reports")({
  head: () => ({
    meta: [
      { title: "Reports - Flowly CRM" },
      { name: "description", content: "Workspace reports generated from live account data." },
    ],
  }),
  component: ReportsPage,
});

type Summary = {
  weeklyBookings: number;
  monthlyBookings: number;
  annualBookings: number;
  hotLeads: number;
};

type BookingPoint = {
  date: string;
  revenue: string;
  bookings: number;
};

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  contactName: string | null;
  time: string;
};

function ReportsPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery<Summary>({
    queryKey: ["analytics-summary"],
    queryFn: () => apiFetch("/analytics/summary"),
    refetchInterval: 30_000,
  });
  const { data: bookings = [], isLoading: loadingBookings } = useQuery<BookingPoint[]>({
    queryKey: ["analytics-bookings", "30days"],
    queryFn: () => apiFetch("/analytics/bookings?range=30days"),
    refetchInterval: 30_000,
  });
  const { data: activity = [], isLoading: loadingActivity } = useQuery<ActivityItem[]>({
    queryKey: ["analytics-activity", "reports"],
    queryFn: () => apiFetch("/analytics/activity?limit=20"),
    refetchInterval: 30_000,
  });

  const totalRevenue = bookings.reduce((sum, point) => sum + Number(point.revenue), 0);
  const totalBookings = bookings.reduce((sum, point) => sum + point.bookings, 0);

  const stats = [
    {
      label: "Weekly bookings",
      value: summary?.weeklyBookings ?? 0,
      icon: CalendarCheck,
    },
    {
      label: "Monthly bookings",
      value: summary?.monthlyBookings ?? 0,
      icon: TrendingUp,
    },
    {
      label: "Annual bookings",
      value: summary?.annualBookings ?? 0,
      icon: Activity,
    },
    {
      label: "Hot leads",
      value: summary?.hotLeads ?? 0,
      icon: Flame,
    },
  ];

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Live workspace reports from bookings, leads, and activity records.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingSummary ? "..." : stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">30-day revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loadingBookings ? "..." : `$${Math.round(totalRevenue).toLocaleString()}`}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalBookings.toLocaleString()} bookings recorded
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <p className="text-sm text-muted-foreground">Loading activity...</p>
            ) : activity.length > 0 ? (
              <ul className="divide-y">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {item.type.replaceAll("_", " ")}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.time), "PPp")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No report activity has been recorded for this workspace yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
