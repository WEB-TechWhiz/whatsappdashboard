import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Send, Paperclip, Smile, Phone, MoreVertical, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/conversations")({
  head: () => ({
    meta: [
      { title: "Conversations — WhatsApp CRM" },
      { name: "description", content: "Chat with leads directly from your dashboard." },
    ],
  }),
  component: ConversationsPage,
});

type Conv = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread?: number;
  online?: boolean;
};

const CONVS: Conv[] = [
  { id: "1", name: "Ayesha Khan", preview: "Perfect, see you at 3!", time: "2m", unread: 2, online: true },
  { id: "2", name: "Marcus Lee", preview: "Sending over the invoice…", time: "9m", online: true },
  { id: "3", name: "Priya Shah", preview: "Not sure, let me think.", time: "1h" },
  { id: "4", name: "Jorge Martinez", preview: "How much for a package?", time: "3h", unread: 1 },
  { id: "5", name: "Sara Ahmed", preview: "Thanks!", time: "1d" },
];

type Msg = { text: string; isAgent: boolean; time: string; read?: boolean };

const INITIAL_MSGS: Msg[] = [
  { text: "Hey! Saw your ad on Instagram — is the Saturday slot still open?", isAgent: false, time: "10:12" },
  { text: "Yes, we still have 3pm and 5pm available on Saturday.", isAgent: true, time: "10:13", read: true },
  { text: "3pm works for me. What do I need to bring?", isAgent: false, time: "10:14" },
  { text: "Just yourself! I'll send the address and a short prep guide.", isAgent: true, time: "10:15", read: true },
  { text: "Perfect, see you at 3!", isAgent: false, time: "10:16" },
];

function ConversationsPage() {
  const [activeId, setActiveId] = useState("1");
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MSGS);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  const active = CONVS.find((c) => c.id === activeId)!;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((m) => [...m, { text, isAgent: true, time: now, read: false }]);
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { text: "Got it — thanks!", isAgent: false, time: now }]);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <Card className="grid grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden h-full p-0">
        <div className="border-r flex flex-col min-h-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search chats..." className="h-9 pl-8" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <ul>
              {CONVS.map((c) => (
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
                          {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {c.online && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">{c.preview}</span>
                        {c.unread ? (
                          <Badge className="h-4 min-w-4 px-1 text-[10px]">{c.unread}</Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-3 border-b px-4 py-2.5">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">
                {active.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{active.name}</p>
              <p className="text-xs text-muted-foreground">
                {active.online ? "online" : "last seen recently"}
              </p>
            </div>
            <Button size="icon" variant="ghost"><Phone className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
          </div>

          <ScrollArea className="flex-1 bg-muted/30">
            <div className="flex flex-col gap-2 p-4">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m.text} isAgent={m.isAgent} time={m.time} read={m.read} />
              ))}
              {typing && <TypingIndicator />}
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t p-3"
          >
            <Button type="button" size="icon" variant="ghost"><Paperclip className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost"><Smile className="h-4 w-4" /></Button>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message"
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}