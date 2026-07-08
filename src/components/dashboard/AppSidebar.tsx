import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  MessageCircle,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, auth } from "@/lib/api";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Fetch workspace profile details
  const { data: profile } = useQuery({
    queryKey: ["workspace-profile"],
    queryFn: () => apiFetch("/workspace/profile"),
    enabled: auth.isAuthenticated(),
  });

  // Fetch conversations to calculate dynamic unread badge count
  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiFetch("/conversations"),
    enabled: auth.isAuthenticated(),
    refetchInterval: 10000, // poll periodically for updates in sidebar
  });

  const totalUnread = conversations?.reduce((acc: number, c: any) => acc + (c.unread || 0), 0) || 0;

  const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, exact: true },
    {
      title: "Conversations",
      url: "/dashboard/conversations",
      icon: MessageSquare,
      badge: totalUnread > 0 ? String(totalUnread) : undefined,
    },
    { title: "Leads", url: "/dashboard/leads", icon: Users },
    { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  const handleLogout = async () => {
    await auth.logout();
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
            <span className="text-sm font-semibold leading-none">{profile?.name || "WhatsApp CRM"}</span>
            <span className="text-xs text-muted-foreground mt-1">Team workspace</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex items-center justify-between w-full p-1">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium truncate">{profile?.name || "Admin"}</span>
              <span className="text-xs text-muted-foreground truncate">{profile?.email || "admin@example.com"}</span>
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
