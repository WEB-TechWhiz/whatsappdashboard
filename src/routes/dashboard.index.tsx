import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Calendar,
  CreditCard,
  Users,
  UserPlus,
  Sparkles,
  ListChecks,
  TrendingUp,
  Smile,
  CalendarX,
  BadgeCheck,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Rocket,
  Star,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

// ---------------- Mock data ----------------
const KPIS = [
  { label: "Revenue Today", value: "$4,280", delta: 12.4, up: true, icon: DollarSign, tone: "success" },
  { label: "Monthly Revenue", value: "$78.2k", delta: 8.1, up: true, icon: TrendingUp, tone: "success" },
  { label: "Appointments Today", value: 24, delta: 3, up: true, icon: Calendar, tone: "primary" },
  { label: "Pending Payments", value: "$2,140", delta: 5.2, up: false, icon: CreditCard, tone: "warning" },
  { label: "Active Customers", value: "1,284", delta: 2.3, up: true, icon: Users, tone: "primary" },
  { label: "New Leads", value: 46, delta: 18, up: true, icon: UserPlus, tone: "success" },
  { label: "AI Conversations", value: 312, delta: 24, up: true, icon: Sparkles, tone: "primary" },
  { label: "Open Tasks", value: 17, delta: 4, up: false, icon: ListChecks, tone: "warning" },
  { label: "Conversion Rate", value: "28.6%", delta: 1.8, up: true, icon: BadgeCheck, tone: "success" },
  { label: "CSAT Score", value: "4.7", delta: 0.2, up: true, icon: Smile, tone: "success" },
  { label: "Missed Appointments", value: 5, delta: 2, up: false, icon: CalendarX, tone: "danger" },
  { label: "Renewals Due", value: 12, delta: 3, up: true, icon: Star, tone: "warning" },
] as const;

const toneMap: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary/10 text-primary",
};

const revenueTrend = [
  { m: "Jan", revenue: 42000, customers: 820 },
  { m: "Feb", revenue: 48000, customers: 890 },
  { m: "Mar", revenue: 51000, customers: 940 },
  { m: "Apr", revenue: 58000, customers: 1020 },
  { m: "May", revenue: 62000, customers: 1080 },
  { m: "Jun", revenue: 69000, customers: 1150 },
  { m: "Jul", revenue: 78200, customers: 1284 },
];

const leadFunnel = [
  { stage: "New", value: 320 },
  { stage: "Contacted", value: 210 },
  { stage: "Qualified", value: 140 },
  { stage: "Proposal", value: 78 },
  { stage: "Won", value: 46 },
];

const serviceMix = [
  { name: "Massage", value: 34 },
  { name: "Facial", value: 22 },
  { name: "Hair", value: 18 },
  { name: "Nails", value: 14 },
  { name: "Other", value: 12 },
];

const appointmentTrend = [
  { d: "Mon", booked: 18, completed: 15 },
  { d: "Tue", booked: 22, completed: 20 },
  { d: "Wed", booked: 19, completed: 17 },
  { d: "Thu", booked: 26, completed: 24 },
  { d: "Fri", booked: 31, completed: 28 },
  { d: "Sat", booked: 34, completed: 30 },
  { d: "Sun", booked: 24, completed: 21 },
];

const staff = [
  { name: "Sara Khan", role: "Therapist", score: 96, revenue: 12400 },
  { name: "Ali Raza", role: "Stylist", score: 91, revenue: 10800 },
  { name: "Zara Sheikh", role: "Trainer", score: 88, revenue: 9600 },
  { name: "Omar Ali", role: "Aesthetician", score: 84, revenue: 8300 },
];

const activity = [
  { icon: Calendar, tone: "primary", text: "Aisha M. booked a facial for tomorrow 3:00 PM", ago: "2m ago", tag: "Appointment" },
  { icon: CreditCard, tone: "success", text: "Payment received from Bilal K. — $180", ago: "6m ago", tag: "Payment" },
  { icon: UserPlus, tone: "primary", text: "New lead: Sana R. via WhatsApp campaign", ago: "12m ago", tag: "Lead" },
  { icon: Users, tone: "primary", text: "Customer registered: Hamza A.", ago: "24m ago", tag: "Customer" },
  { icon: Sparkles, tone: "success", text: "AI resolved 3 inquiries and booked 1 demo", ago: "31m ago", tag: "AI" },
  { icon: Workflow, tone: "warning", text: "Workflow 'Post-visit follow-up' executed 12 times", ago: "48m ago", tag: "Workflow" },
  { icon: Rocket, tone: "primary", text: "Campaign 'Summer Glow' sent to 842 contacts", ago: "1h ago", tag: "Campaign" },
  { icon: Star, tone: "success", text: "New 5-star review from Nadia T.", ago: "2h ago", tag: "Review" },
];

const chartColors = ["var(--primary)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function DashboardOverview() {
  const [range, setRange] = useState<"today" | "week" | "month">("today");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">Good afternoon, Admin 👋</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening at Acme Wellness today.</p>
        </div>
        <div className="flex gap-1 rounded-md border bg-card p-1 shrink-0">
          {(["today", "week", "month"] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "default" : "ghost"}
              className="h-7 capitalize"
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {KPIS.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {k.label}
                  </CardTitle>
                  <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", toneMap[k.tone])}>
                    <k.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{k.value}</div>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-1 text-xs",
                    k.up ? "text-success" : "text-danger",
                  )}
                >
                  {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="font-medium">{k.delta}%</span>
                  <span className="text-muted-foreground">vs last {range}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Revenue trend</CardTitle>
              <p className="text-xs text-muted-foreground">Last 7 months</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" /> +18.6%
            </Badge>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service popularity</CardTitle>
            <p className="text-xs text-muted-foreground">Revenue share by service</p>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={serviceMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {serviceMix.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 -mt-6 text-xs">
              {serviceMix.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: chartColors[i % chartColors.length] }} />
                  <span className="text-muted-foreground truncate">{s.name}</span>
                  <span className="ml-auto font-medium">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead funnel</CardTitle>
            <p className="text-xs text-muted-foreground">Conversion by stage</p>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadFunnel} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="stage" type="category" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appointments</CardTitle>
            <p className="text-xs text-muted-foreground">Booked vs completed</p>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="booked" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer growth</CardTitle>
            <p className="text-xs text-muted-foreground">Cumulative</p>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="customers" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Activity + Staff + Pipeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Activity feed
              </CardTitle>
              <p className="text-xs text-muted-foreground">Real-time across your business</p>
            </div>
            <Button variant="ghost" size="sm">View all</Button>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", toneMap[a.tone])}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.ago}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{a.tag}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top staff</CardTitle>
              <p className="text-xs text-muted-foreground">By performance this month</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {s.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${s.revenue.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">{s.score}% CSAT</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Response rate", value: 87 },
                { label: "Booking rate", value: 62 },
                { label: "Marketing ROI", value: 74 },
                { label: "Retention", value: 91 },
              ].map((p) => (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="font-medium">{p.value}%</span>
                  </div>
                  <Progress value={p.value} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

