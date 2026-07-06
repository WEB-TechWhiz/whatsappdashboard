import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Send, Paperclip, Smile, Phone, MoreVertical, Search, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getSocket } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/conversations")({
  head: () => ({
    meta: [
      { title: "Conversations — WhatsApp CRM" },
      { name: "description", content: "Chat with leads directly from your dashboard." },
    ],
  }),
  component: ConversationsPage,
});

function formatTimeShort(dateString: string) {
  try {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  } catch (e) {
    return "";
  }
}

function ConversationsPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [typingContacts, setTypingContacts] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  // 1. Fetch all conversations
  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations", search],
    queryFn: () => apiFetch(`/conversations?search=${search}`),
    refetchInterval: 10000, // backup polling
  });

  // Set default active conversation if none chosen
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const active = conversations?.find((c: any) => c.id === activeId);

  // 2. Fetch messages for active conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => apiFetch(`/conversations/${activeId}/messages`),
    enabled: !!activeId,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) =>
      apiFetch(`/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
    onSuccess: (newMessage) => {
      // Optmistically append or update query
      queryClient.setQueryData(["messages", activeId], (old: any) => [...(old || []), newMessage]);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err) => {
      toast.error("Failed to send message: " + err.message);
    },
  });

  // 4. Send typing status indicator mutation
  const sendTypingMutation = useMutation({
    mutationFn: (isTyping: boolean) =>
      apiFetch(`/conversations/${activeId}/typing`, {
        method: "POST",
        body: JSON.stringify({ isTyping }),
      }),
  });

  // Handle typing triggers (throttle)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleInputChange = (val: string) => {
    setDraft(val);
    if (!activeId) return;

    if (!typingTimeoutRef.current) {
      sendTypingMutation.mutate(true);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingMutation.mutate(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // 5. Connect and handle realtime socket listeners
  useEffect(() => {
    try {
      const socket = getSocket();

      const handleNewMessage = ({ contactId, message }: any) => {
        // Invalidate conversation list so preview / unread badge updates
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        
        // If message is in the open thread, append it dynamically
        if (contactId === activeId) {
          queryClient.setQueryData(["messages", activeId], (old: any) => {
            const list = old || [];
            // prevent duplication if mutation onSuccess already appended it
            if (list.some((m: any) => m.id === message.id)) return list;
            return [...list, message];
          });
        }
      };

      const handleTyping = ({ contactId, isTyping }: any) => {
        setTypingContacts((prev) => ({
          ...prev,
          [contactId]: isTyping,
        }));
      };

      socket.on("message:new", handleNewMessage);
      socket.on("typing", handleTyping);

      return () => {
        socket.off("message:new", handleNewMessage);
        socket.off("typing", handleTyping);
      };
    } catch (e) {
      console.warn("Realtime websockets not connected:", e);
    }
  }, [activeId, queryClient]);

  const send = () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    sendMessageMutation.mutate(text);
    setDraft("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      sendTypingMutation.mutate(false);
      typingTimeoutRef.current = null;
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <Card className="grid grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden h-full p-0">
        {/* Left Contacts Sidebar */}
        <div className="border-r flex flex-col min-h-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                className="h-9 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loadingConvs ? (
              <p className="text-xs text-muted-foreground p-4 text-center">Loading conversations...</p>
            ) : conversations && conversations.length > 0 ? (
              <ul>
                {conversations.map((c: any) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 text-left border-b hover:bg-accent transition-colors",
                        activeId === c.id && "bg-accent"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-xs">
                            {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {c.online && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTimeShort(c.time)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground truncate">
                            {typingContacts[c.id] ? (
                              <span className="text-primary font-medium animate-pulse">typing...</span>
                            ) : (
                              c.preview
                            )}
                          </span>
                          {c.unread ? (
                            <Badge className="h-4 min-w-4 px-1 text-[10px] bg-danger text-danger-foreground">
                              {c.unread}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground p-4 text-center">No active chats found.</p>
            )}
          </ScrollArea>
        </div>

        {/* Right Message Pane */}
        {active ? (
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-3 border-b px-4 py-2.5">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">
                  {active.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{active.name}</p>
                <p className="text-xs text-muted-foreground">
                  {typingContacts[active.id] ? (
                    <span className="text-primary animate-pulse font-medium">typing...</span>
                  ) : active.online ? (
                    "online"
                  ) : (
                    "last seen recently"
                  )}
                </p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Call"><Phone className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Menu"><MoreVertical className="h-4 w-4" /></Button>
            </div>

            <ScrollArea className="flex-1 bg-muted/30">
              <div className="flex flex-col gap-2 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((m: any, i: number) => (
                    <MessageBubble
                      key={m.id || i}
                      message={m.text}
                      isAgent={m.isAgent}
                      time={new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      read={m.read}
                    />
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground p-8 text-center">No messages in this chat. Start the conversation!</p>
                )}
                {typingContacts[active.id] && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t p-3"
            >
              <Button type="button" size="icon" variant="ghost" aria-label="Attach file"><Paperclip className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Insert emoji"><Smile className="h-4 w-4" /></Button>
              <Input
                value={draft}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type a message"
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button type="submit" size="icon" disabled={!draft.trim() || sendMessageMutation.isPending}>
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-muted-foreground p-8">
            <MessageSquare className="h-12 w-12 mb-3 text-muted-foreground/50" />
            <p className="text-sm">Select a contact from the sidebar to begin chatting</p>
          </div>
        )}
      </Card>
    </div>
  );
}
