import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, UserPlus, MessageSquare, CreditCard, Rocket, Info, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch, auth, getSocket } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  type: "lead" | "message" | "booking" | "system" | "payment" | "campaign";
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
};

const ICON: Record<Notification["type"], typeof Bell> = {
  lead: UserPlus,
  message: MessageSquare,
  booking: Calendar,
  payment: CreditCard,
  campaign: Rocket,
  system: Info,
};

const TONE: Record<Notification["type"], string> = {
  lead: "bg-primary/10 text-primary",
  message: "bg-primary/10 text-primary",
  booking: "bg-success/10 text-success",
  payment: "bg-success/10 text-success",
  campaign: "bg-warning/10 text-warning",
  system: "bg-muted text-muted-foreground",
};

export function NotificationsPopover() {
  const qc = useQueryClient();
  const authed = typeof window !== "undefined" && auth.isAuthenticated();

  const items = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/notifications?limit=25"),
    enabled: authed,
    refetchInterval: 60_000,
  });

  const count = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiFetch("/notifications/unread-count"),
    enabled: authed,
    refetchInterval: 30_000,
  });

  const markOne = useMutation({
    mutationFn: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    if (!authed) return;
    let socket: ReturnType<typeof getSocket> | null = null;
    try {
      socket = getSocket();
    } catch {
      return;
    }
    const handler = () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    };
    socket.on("notification:new", handler);
    return () => {
      socket?.off("notification:new", handler);
    };
  }, [authed, qc]);

  const unread = count.data?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {unread} unread {unread === 1 ? "item" : "items"}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs"
            onClick={() => markAll.mutate()}
            disabled={unread === 0 || markAll.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          {items.isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading…</div>
          ) : (items.data?.length ?? 0) === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">You're all caught up.</div>
          ) : (
            <ul className="divide-y">
              {items.data!.map((n) => {
                const Icon = ICON[n.type] ?? Bell;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "flex gap-2.5 px-3 py-2.5 text-sm hover:bg-muted/50 cursor-pointer",
                      !n.read && "bg-primary/[0.04]",
                    )}
                    onClick={() => !n.read && markOne.mutate(n.id)}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        TONE[n.type],
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{n.title}</p>
                      {n.body && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}