import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Search,
  Plus,
  Sparkles,
  Moon,
  Sun,
  Building2,
  ChevronDown,
  Wifi,
  CircleDot,
  Zap,
  Command as CommandIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { useBusinessConfig, useIsHydrated } from "@/lib/business-config";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Flowly CRM" },
      { name: "description", content: "All-in-one CRM: leads, appointments, AI conversations, and revenue." },
    ],
  }),
  component: DashboardLayout,
});

const CRUMBS: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/conversations": "WhatsApp",
  "/dashboard/leads": "Leads",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = CRUMBS[pathname] ?? "Overview";
  const [dark, setDark] = useState(false);
  const [business, setBusiness] = useState("Acme Wellness");
  const config = useBusinessConfig();
  const hydrated = useIsHydrated();
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !config.onboarded) setWizardOpen(true);
  }, [hydrated, config.onboarded]);

  useEffect(() => {
    if (config.name) setBusiness(config.name);
  }, [config.name]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col min-h-screen">
          {/* Top Navbar */}
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{current}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Global AI Search */}
            <div className="relative ml-2 hidden md:block flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ask AI or search anything..."
                className="h-9 pl-8 pr-14 bg-muted/40"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline-flex">
                <CommandIcon className="h-3 w-3" />K
              </kbd>
            </div>

            <div className="ml-auto flex items-center gap-1">
              {/* Business Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 hidden lg:inline-flex">
                    <Building2 className="h-4 w-4" />
                    <span className="max-w-[120px] truncate">{business}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Switch business</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["Acme Wellness", "Acme Salon", "Acme Fitness"].map((b) => (
                    <DropdownMenuItem key={b} onClick={() => setBusiness(b)}>
                      <Building2 className="h-4 w-4" />
                      {b}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quick Create */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-9 gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Quick create</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>New Lead</DropdownMenuItem>
                  <DropdownMenuItem>New Appointment</DropdownMenuItem>
                  <DropdownMenuItem>New Invoice</DropdownMenuItem>
                  <DropdownMenuItem>New Campaign</DropdownMenuItem>
                  <DropdownMenuItem>New Task</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AI Assistant */}
              <Button size="icon" variant="ghost" className="relative" aria-label="AI Assistant">
                <Sparkles className="h-4 w-4 text-primary" />
              </Button>

              {/* Notifications */}
              <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
              </Button>

              {/* Theme Switch */}
              <Button
                size="icon"
                variant="ghost"
                aria-label="Toggle theme"
                onClick={() => setDark((d) => !d)}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">AD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Admin</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 pb-14">
            <Outlet />
          </main>

        <OnboardingWizard open={wizardOpen} onOpenChange={setWizardOpen} />

          {/* Bottom Status Bar */}
          <footer className="sticky bottom-0 z-10 flex h-9 items-center gap-4 border-t bg-card/95 px-4 text-xs text-muted-foreground backdrop-blur">
            <span className="flex items-center gap-1.5">
              <CircleDot className="h-3 w-3 text-success" />
              All systems operational
            </span>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <span className="hidden sm:flex items-center gap-1.5">
              <Wifi className="h-3 w-3" />
              WhatsApp API connected
            </span>
            <Separator orientation="vertical" className="h-4 hidden md:block" />
            <span className="hidden md:flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-warning" />
              AI: 82% budget used
            </span>
            <div className="ml-auto flex items-center gap-3">
              <Badge variant="secondary" className="h-5 text-[10px]">v2.4.1</Badge>
              <span className="hidden sm:inline">Last sync 12s ago</span>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}