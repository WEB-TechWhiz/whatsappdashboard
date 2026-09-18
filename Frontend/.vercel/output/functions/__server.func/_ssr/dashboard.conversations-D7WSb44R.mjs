import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { C as Card } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { A as Avatar, a as AvatarFallback } from "./avatar-BJDbbUeP.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { S as ScrollArea } from "./scroll-area-D8k9ckMT.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { g as getSocket, a as apiFetch } from "./api-BwNEdiC0.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/socket.io-client.mjs";
import { S as Search, ae as Phone, af as EllipsisVertical, L as LoaderCircle, ag as Paperclip, ah as Smile, ai as Send, M as MessageSquare, aj as CircleAlert, ak as Clock, D as CheckCheck, H as Check } from "../_libs/lucide-react.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-scroll-area.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/engine.io-client.mjs";
import "../_libs/xmlhttprequest-ssl.mjs";
import "fs";
import "url";
import "child_process";
import "http";
import "https";
import "../_libs/engine.io-parser.mjs";
import "../_libs/socket.io__component-emitter.mjs";
import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "tty";
import "../_libs/supports-color.mjs";
import "os";
import "../_libs/has-flag.mjs";
import "../_libs/ws.mjs";
import "events";
import "net";
import "tls";
import "zlib";
import "buffer";
import "../_libs/socket.io-parser.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
function MessageBubble({
  message,
  isAgent,
  time,
  read,
  providerStatus,
  failureMessage
}) {
  const normalizedStatus = providerStatus?.toUpperCase();
  const failed = normalizedStatus === "FAILED";
  const pending = normalizedStatus === "QUEUED" || normalizedStatus === "SENDING";
  const delivered = normalizedStatus === "DELIVERED" || normalizedStatus === "READ";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 6, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.18 },
      className: cn("flex w-full", isAgent ? "justify-end" : "justify-start"),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: cn(
            "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
            isAgent ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap leading-relaxed", children: message }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: cn(
                  "mt-1 flex items-center justify-end gap-1 text-[10px]",
                  isAgent ? "text-primary-foreground/80" : "text-muted-foreground"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: time }),
                  isAgent && failed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-32 truncate", children: failureMessage || "Failed" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3 w-3" })
                  ] }) : null,
                  isAgent && !failed && pending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }) : null,
                  isAgent && !failed && !pending ? delivered || read ? /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }) : null
                ]
              }
            )
          ]
        }
      )
    }
  );
}
function TypingIndicator() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 rounded-2xl rounded-bl-sm border bg-card px-3 py-2 w-fit", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.span,
    {
      className: "h-1.5 w-1.5 rounded-full bg-muted-foreground",
      animate: { y: [0, -3, 0], opacity: [0.4, 1, 0.4] },
      transition: { duration: 0.9, repeat: Infinity, delay: i * 0.15 }
    },
    i
  )) });
}
function formatTimeShort(dateString) {
  try {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
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
  const [activeId, setActiveId] = reactExports.useState(null);
  const [draft, setDraft] = reactExports.useState("");
  const [typingContacts, setTypingContacts] = reactExports.useState({});
  const messagesEndRef = reactExports.useRef(null);
  const [search, setSearch] = reactExports.useState("");
  const {
    data: conversations,
    isLoading: loadingConvs
  } = useQuery({
    queryKey: ["conversations", search],
    queryFn: () => apiFetch(`/conversations?search=${search}`),
    refetchInterval: 1e4
    // backup polling
  });
  reactExports.useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);
  const active = conversations?.find((c) => c.id === activeId);
  const {
    data: messages = [],
    isLoading: loadingMessages
  } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => apiFetch(`/conversations/${activeId}/messages`),
    enabled: !!activeId
  });
  reactExports.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  const sendMessageMutation = useMutation({
    mutationFn: (text) => apiFetch(`/conversations/${activeId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        text
      })
    }),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(["messages", activeId], (old) => [...old || [], newMessage]);
      queryClient.invalidateQueries({
        queryKey: ["conversations"]
      });
      if (newMessage.providerStatus === "FAILED") {
        toast.error(newMessage.failureMessage || "Message could not be sent");
      }
    },
    onError: (err) => {
      toast.error("Failed to send message: " + err.message);
    }
  });
  const sendTypingMutation = useMutation({
    mutationFn: (isTyping) => apiFetch(`/conversations/${activeId}/typing`, {
      method: "POST",
      body: JSON.stringify({
        isTyping
      })
    })
  });
  const typingTimeoutRef = reactExports.useRef(null);
  const handleInputChange = (val) => {
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
    }, 2e3);
  };
  reactExports.useEffect(() => {
    try {
      const socket = getSocket();
      const handleNewMessage = ({
        contactId,
        message
      }) => {
        queryClient.invalidateQueries({
          queryKey: ["conversations"]
        });
        if (contactId === activeId) {
          queryClient.setQueryData(["messages", activeId], (old) => {
            const list = old || [];
            if (list.some((m) => m.id === message.id)) return list;
            return [...list, message];
          });
        }
      };
      const handleUpdatedMessage = ({
        contactId,
        message
      }) => {
        queryClient.invalidateQueries({
          queryKey: ["conversations"]
        });
        if (contactId === activeId) {
          queryClient.setQueryData(["messages", activeId], (old) => {
            const list = old || [];
            return list.map((m) => m.id === message.id ? {
              ...m,
              ...message
            } : m);
          });
        }
      };
      const handleTyping = ({
        contactId,
        isTyping
      }) => {
        setTypingContacts((prev) => ({
          ...prev,
          [contactId]: isTyping
        }));
      };
      socket.on("message:new", handleNewMessage);
      socket.on("message:updated", handleUpdatedMessage);
      socket.on("typing", handleTyping);
      return () => {
        socket.off("message:new", handleNewMessage);
        socket.off("message:updated", handleUpdatedMessage);
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-[calc(100vh-8rem)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "grid grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden h-full p-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-r flex flex-col min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Search chats...", className: "h-9 pl-8", value: search, onChange: (e) => setSearch(e.target.value) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: loadingConvs ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground p-4 text-center", children: "Loading conversations..." }) : conversations && conversations.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { children: conversations.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveId(c.id), className: cn("w-full flex items-center gap-3 px-3 py-3 text-left border-b hover:bg-accent transition-colors", activeId === c.id && "bg-accent"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-10 w-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-xs", children: c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() }) }),
          c.online && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm truncate", children: c.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground shrink-0", children: formatTimeShort(c.time) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground truncate", children: typingContacts[c.id] ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-medium animate-pulse", children: "typing..." }) : c.preview }),
            c.unread ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "h-4 min-w-4 px-1 text-[10px] bg-danger text-danger-foreground", children: c.unread }) : null
          ] })
        ] })
      ] }) }, c.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground p-4 text-center", children: "No active chats found." }) })
    ] }),
    active ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 border-b px-4 py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-9 w-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-xs", children: active.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: active.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: typingContacts[active.id] ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary animate-pulse font-medium", children: "typing..." }) : active.online ? "online" : "last seen recently" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", "aria-label": "Call", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", "aria-label": "Menu", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1 bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 p-4", children: [
        loadingMessages ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : messages.length > 0 ? messages.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(MessageBubble, { message: m.text, isAgent: m.isAgent, time: new Date(m.time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }), read: m.read, providerStatus: m.providerStatus, failureMessage: m.failureMessage }, m.id || i)) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground p-8 text-center", children: "No messages in this chat. Start the conversation!" }),
        typingContacts[active.id] && /* @__PURE__ */ jsxRuntimeExports.jsx(TypingIndicator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: messagesEndRef })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        send();
      }, className: "flex items-center gap-2 border-t p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "icon", variant: "ghost", "aria-label": "Attach file", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Paperclip, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "icon", variant: "ghost", "aria-label": "Insert emoji", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Smile, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: draft, onChange: (e) => handleInputChange(e.target.value), placeholder: "Type a message", className: "flex-1", disabled: sendMessageMutation.isPending }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", size: "icon", disabled: !draft.trim() || sendMessageMutation.isPending, children: sendMessageMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }) })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full bg-muted/20 text-muted-foreground p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-12 w-12 mb-3 text-muted-foreground/50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Select a contact from the sidebar to begin chatting" })
    ] })
  ] }) });
}
export {
  ConversationsPage as component
};
