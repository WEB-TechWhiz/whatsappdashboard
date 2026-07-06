import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — WhatsApp CRM" },
      { name: "description", content: "Response times, conversion rates, and channel breakdown." },
    ],
  }),
  component: AnalyticsPage,
});

const bars = [40, 65, 48, 72, 58, 88, 74];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Last 7 days at a glance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Avg response time", value: "2m 14s", delta: "-18%" },
          { label: "Conversion rate", value: "34%", delta: "+4%" },
          { label: "Revenue", value: "$8,420", delta: "+12%" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{s.value}</span>
                <span className="text-xs font-medium text-success">{s.delta}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings this week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-3 h-56">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                  className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                />
                <span className="text-xs text-muted-foreground">{days[i]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}