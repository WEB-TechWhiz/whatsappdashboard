import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useMemo, useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics - WhatsApp CRM" },
      { name: "description", content: "Response times, conversion rates, and channel breakdown." },
    ],
  }),
  component: AnalyticsPage,
});

type Overview = {
  leaks: number;
  todaysCash: string;
  onDeck: number;
  responseRate: number;
  bookingRate: number;
};

type BookingPoint = {
  date: string;
  revenue: string;
  bookings: number;
};

function AnalyticsPage() {
  const [range, setRange] = useState<"7days" | "30days">("7days");

  const { data: overview, isLoading: loadingOverview } = useQuery<Overview>({
    queryKey: ["analytics-overview", range],
    queryFn: () => apiFetch(`/analytics/overview?range=${range === "7days" ? "week" : "month"}`),
    refetchInterval: 15000,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery<BookingPoint[]>({
    queryKey: ["analytics-bookings", range],
    queryFn: () => apiFetch(`/analytics/bookings?range=${range}`),
    refetchInterval: 15000,
  });

  const maxBookings = Math.max(1, ...bookings.map((point) => point.bookings));
  const totalBookings = bookings.reduce((sum, point) => sum + point.bookings, 0);
  const totalRevenue = bookings.reduce((sum, point) => sum + Number(point.revenue), 0);
  const avgRevenue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  const chartPoints = useMemo(() => {
    if (bookings.length > 0) return bookings;

    const fallbackDays = range === "7days" ? 7 : 30;
    return Array.from({ length: fallbackDays }, (_, index) => ({
      date: new Date(Date.now() - (fallbackDays - index - 1) * 86400000).toISOString(),
      revenue: "0",
      bookings: 0,
    }));
  }, [bookings, range]);

  const stats = [
    {
      label: "Response rate",
      value: loadingOverview ? "..." : `${overview?.responseRate ?? 0}%`,
      delta: "Live",
    },
    {
      label: "Conversion rate",
      value: loadingOverview ? "..." : `${overview?.bookingRate ?? 0}%`,
      delta: "Live",
    },
    {
      label: "Revenue",
      value: loadingBookings ? "..." : `$${Math.round(totalRevenue).toLocaleString()}`,
      delta: `${totalBookings} bookings`,
    },
    {
      label: "Avg booking",
      value: loadingBookings ? "..." : `$${Math.round(avgRevenue).toLocaleString()}`,
      delta: range === "7days" ? "7 days" : "30 days",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Live pipeline performance from backend data.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border bg-card p-1">
          <Button
            size="sm"
            variant={range === "7days" ? "default" : "ghost"}
            className="h-7"
            onClick={() => setRange("7days")}
          >
            7 days
          </Button>
          <Button
            size="sm"
            variant={range === "30days" ? "default" : "ghost"}
            className="h-7"
            onClick={() => setRange("30days")}
          >
            30 days
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className="text-xs font-medium text-success">{stat.delta}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-end justify-between gap-2">
            {chartPoints.map((point, index) => {
              const height = Math.max(4, (point.bookings / maxBookings) * 100);
              return (
                <div
                  key={`${point.date}-${index}`}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.015, duration: 0.45, ease: "easeOut" }}
                    className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                    title={`${point.bookings} bookings, $${Number(point.revenue).toLocaleString()}`}
                  />
                  <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                    {format(new Date(point.date), range === "7days" ? "EEE" : "d MMM")}
                  </span>
                </div>
              );
            })}
          </div>
          {!loadingBookings && bookings.length === 0 ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No bookings recorded for this range yet.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
