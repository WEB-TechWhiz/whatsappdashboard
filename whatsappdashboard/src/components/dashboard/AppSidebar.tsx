import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  MessageCircle,
  LogOut,
  UserCircle2,
  Target,
  Handshake,
  BookUser,
  CalendarCheck,
  CalendarDays,
  ListChecks,
  Sparkles,
  Mail,
  Send,
  Megaphone,
  Rocket,
  FileText,
  CreditCard,
  Package,
  Wrench,
  Boxes,
  UsersRound,
  FileBarChart,
  Workflow,
  Zap,
  BookOpen,
  Files,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { auth } from "@/lib/api";
import { FeatureKey, useBusinessConfig } from "@/lib/business-config";

type NavItem = {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  exact?: boolean;
  feature?: FeatureKey;
  children?: { title: string; url: string; feature?: FeatureKey }[];
};

type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "CRM",
    items: [
      {
        title: "CRM",
        url: "/dashboard/crm",
        icon: UserCircle2,
        feature: "crm",
        children: [
          { title: "Customers", url: "/dashboard/crm/customers" },
          { title: "Leads", url: "/dashboard/leads" },
          { title: "Opportunities", url: "/dashboard/crm/opportunities" },
          { title: "Contacts", url: "/dashboard/crm/contacts" },
        ],
      },
      {
        title: "Appointments",
        url: "/dashboard/appointments",
        icon: CalendarCheck,
        feature: "appointments",
      },
      { title: "Calendar", url: "/dashboard/calendar", icon: CalendarDays, feature: "calendar" },
      { title: "Tasks", url: "/dashboard/tasks", icon: ListChecks, feature: "tasks" },
    ],
  },
  {
    label: "AI & Comms",
    items: [
      { title: "AI Center", url: "/dashboard/ai", icon: Sparkles, feature: "ai" },
      {
        title: "Communication",
        url: "/dashboard/communication",
        icon: MessageSquare,
        children: [
          { title: "WhatsApp", url: "/dashboard/conversations", feature: "whatsapp" },
          { title: "Email", url: "/dashboard/communication/email", feature: "email" },
          { title: "SMS", url: "/dashboard/communication/sms", feature: "sms" },
        ],
      },
      { title: "Marketing", url: "/dashboard/marketing", icon: Megaphone, feature: "marketing" },
      { title: "Campaigns", url: "/dashboard/campaigns", icon: Rocket, feature: "campaigns" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { title: "Invoices", url: "/dashboard/invoices", icon: FileText, feature: "invoices" },
      { title: "Payments", url: "/dashboard/payments", icon: CreditCard, feature: "payments" },
      { title: "Products", url: "/dashboard/products", icon: Package, feature: "products" },
      { title: "Services", url: "/dashboard/services", icon: Wrench, feature: "services" },
      { title: "Inventory", url: "/dashboard/inventory", icon: Boxes, feature: "inventory" },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Employees", url: "/dashboard/employees", icon: UsersRound, feature: "employees" },
      { title: "Reports", url: "/dashboard/reports", icon: FileBarChart, feature: "reports" },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, feature: "analytics" },
      {
        title: "Workflow Builder",
        url: "/dashboard/workflows",
        icon: Workflow,
        feature: "workflows",
      },
      { title: "Automation", url: "/dashboard/automation", icon: Zap, feature: "automation" },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        title: "Knowledge Base",
        url: "/dashboard/knowledge",
        icon: BookOpen,
        feature: "knowledge",
      },
      { title: "Documents", url: "/dashboard/documents", icon: Files, feature: "documents" },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const config = useBusinessConfig();
  const workspace = auth.getWorkspace();
  const businessName = config.name || workspace?.name || "Workspace";
  const userEmail = workspace?.email || "";
  const initials = businessName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const isEnabled = (feature?: FeatureKey) => !feature || config.features[feature];

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items
      .map((i) =>
        i.children ? { ...i, children: i.children.filter((child) => isEnabled(child.feature)) } : i,
      )
      .filter((i) => isEnabled(i.feature) && (!i.children || i.children.length > 0)),
  })).filter((g) => g.items.length > 0);

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch {}
    window.location.href = "/login";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-none">Flowly CRM</span>
            <span className="text-xs text-muted-foreground mt-1 truncate">{businessName}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (item.children) {
                    const anyActive = item.children.some((c) => isActive(c.url));
                    return (
                      <Collapsible
                        key={item.title}
                        defaultOpen={anyActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.title}>
                              <item.icon />
                              <span>{item.title}</span>
                              {item.badge ? (
                                <Badge className="ml-auto h-5 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden bg-danger text-danger-foreground">
                                  {item.badge}
                                </Badge>
                              ) : null}
                              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((c) => (
                                <SidebarMenuSubItem key={c.title}>
                                  <SidebarMenuSubButton asChild isActive={isActive(c.url)}>
                                    <Link to={c.url}>{c.title}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url, item.exact)}
                        tooltip={item.title}
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                          {item.badge ? (
                            <Badge className="ml-auto h-5 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden bg-danger text-danger-foreground">
                              {item.badge}
                            </Badge>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex items-center justify-between w-full p-1">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials || "WS"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium truncate">{businessName}</span>
              <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 group-data-[collapsible=icon]:hidden text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleLogout}
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
