import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { A as Avatar, a as AvatarFallback } from "./avatar-BJDbbUeP.mjs";
import { S as Select$1, a as SelectValue$1, b as SelectTrigger$1, c as SelectIcon, d as SelectPortal, e as SelectContent$1, f as SelectViewport, g as SelectItem$1, h as SelectItemIndicator, i as SelectItemText, j as SelectScrollUpButton$1, k as SelectScrollDownButton$1, l as SelectLabel$1, m as SelectSeparator$1 } from "../_libs/radix-ui__react-select.mjs";
import { D as Dialog, e as DialogTrigger, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, f as DialogFooter } from "./dialog-CqFFmKRU.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { g as getSocket, a as apiFetch } from "./api-BwNEdiC0.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/socket.io-client.mjs";
import { P as Plus, L as LoaderCircle, S as Search, ac as ChevronDown, H as Check, ad as ChevronUp } from "../_libs/lucide-react.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
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
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-effect-event+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-label.mjs";
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
const Table = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("table", { ref, className: cn("w-full caption-bottom text-sm", className), ...props }) })
);
Table.displayName = "Table";
const TableHeader = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { ref, className: cn("[&_tr:last-child]:border-0", className), ...props }));
TableBody.displayName = "TableBody";
const TableFooter = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tfoot",
  {
    ref,
    className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "tr",
    {
      ref,
      className: cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      ),
      ...props
    }
  )
);
TableRow.displayName = "TableRow";
const TableHead = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "th",
  {
    ref,
    className: cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "td",
  {
    ref,
    className: cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("caption", { ref, className: cn("mt-4 text-sm text-muted-foreground", className), ...props }));
TableCaption.displayName = "TableCaption";
const Select = Select$1;
const SelectValue = SelectValue$1;
const SelectTrigger = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SelectTrigger$1,
  {
    ref,
    className: cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectIcon, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectTrigger$1.displayName;
const SelectScrollUpButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SelectScrollUpButton$1,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
const SelectScrollDownButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SelectScrollDownButton$1,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
const SelectContent = reactExports.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectPortal, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SelectContent$1,
  {
    ref,
    className: cn(
      "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SelectViewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectContent$1.displayName;
const SelectLabel = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SelectLabel$1,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectLabel$1.displayName;
const SelectItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SelectItem$1,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItemIndicator, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectItem$1.displayName;
const SelectSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SelectSeparator$1,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectSeparator$1.displayName;
const statusStyles = {
  Hot: "bg-danger/10 text-danger border-danger/20",
  Warm: "bg-warning/10 text-warning border-warning/20",
  Cold: "bg-muted text-muted-foreground border-border",
  Booked: "bg-success/10 text-success border-success/20"
};
const emptyLead = {
  name: "",
  phone: "",
  source: "Website",
  status: "Warm",
  value: ""
};
function LeadsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = reactExports.useState("");
  const [status, setStatus] = reactExports.useState("all");
  const [open, setOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState(emptyLead);
  const params = new URLSearchParams();
  if (query.trim()) params.set("search", query.trim());
  if (status !== "all") params.set("status", status);
  const queryString = params.toString();
  const {
    data: leads = [],
    isLoading
  } = useQuery({
    queryKey: ["leads", queryString],
    queryFn: () => apiFetch(`/leads${queryString ? `?${queryString}` : ""}`)
  });
  const createLead = useMutation({
    mutationFn: () => apiFetch("/leads", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        value: Number(form.value || 0)
      })
    }),
    onSuccess: () => {
      toast.success("Lead created");
      setOpen(false);
      setForm(emptyLead);
      queryClient.invalidateQueries({
        queryKey: ["leads"]
      });
      queryClient.invalidateQueries({
        queryKey: ["analytics-overview"]
      });
      queryClient.invalidateQueries({
        queryKey: ["analytics-activity"]
      });
    },
    onError: (err) => toast.error(err.message || "Failed to create lead")
  });
  const updateLead = useMutation({
    mutationFn: ({
      id,
      patch
    }) => apiFetch(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["leads"]
      });
      queryClient.invalidateQueries({
        queryKey: ["analytics-overview"]
      });
      queryClient.invalidateQueries({
        queryKey: ["analytics-activity"]
      });
      queryClient.invalidateQueries({
        queryKey: ["analytics-bookings"]
      });
    },
    onError: (err) => toast.error(err.message || "Failed to update lead")
  });
  reactExports.useEffect(() => {
    try {
      const socket = getSocket();
      const refresh = () => {
        queryClient.invalidateQueries({
          queryKey: ["leads"]
        });
        queryClient.invalidateQueries({
          queryKey: ["analytics-overview"]
        });
      };
      socket.on("lead:created", refresh);
      socket.on("lead:updated", refresh);
      return () => {
        socket.off("lead:created", refresh);
        socket.off("lead:updated", refresh);
      };
    } catch (err) {
      console.warn("Lead realtime updates unavailable:", err);
    }
  }, [queryClient]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Leads" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: isLoading ? "Loading leads..." : `${leads.length} leads` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
          " Add lead"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add lead" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Create a contact in the CRM pipeline." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 py-2 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "lead-name", children: "Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "lead-name", value: form.name, onChange: (e) => setForm((prev) => ({
                ...prev,
                name: e.target.value
              })) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "lead-phone", children: "Phone" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "lead-phone", value: form.phone, onChange: (e) => setForm((prev) => ({
                ...prev,
                phone: e.target.value
              })) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Source" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.source, onValueChange: (value) => setForm((prev) => ({
                ...prev,
                source: value
              })), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Instagram", children: "Instagram" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Website", children: "Website" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Facebook", children: "Facebook" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Referral", children: "Referral" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Status" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.status, onValueChange: (value) => setForm((prev) => ({
                ...prev,
                status: value
              })), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Hot", children: "Hot" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Warm", children: "Warm" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Cold", children: "Cold" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Booked", children: "Booked" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 sm:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "lead-value", children: "Deal value" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "lead-value", type: "number", min: "0", step: "0.01", value: form.value, onChange: (e) => setForm((prev) => ({
                ...prev,
                value: e.target.value
              })) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => createLead.mutate(), disabled: !form.name.trim() || !form.phone.trim() || createLead.isPending, children: createLead.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Create lead" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "All leads" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search name...", className: "h-9 w-64 pl-8" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: status, onValueChange: setStatus, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-36", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All statuses" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Hot", children: "Hot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Warm", children: "Warm" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Cold", children: "Cold" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Booked", children: "Booked" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Phone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Source" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Last message" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Value" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 6, className: "text-center text-sm text-muted-foreground py-10", children: "Loading leads..." }) }) : leads.length > 0 ? leads.map((lead) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-8 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-xs", children: lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: lead.name })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs text-muted-foreground", children: lead.phone }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: lead.source }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: lead.status, onValueChange: (value) => updateLead.mutate({
            id: lead.id,
            patch: {
              status: value
            }
          }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 w-32 border-0 bg-transparent p-0 shadow-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: statusStyles[lead.status], children: lead.status }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Hot", children: "Hot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Warm", children: "Warm" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Cold", children: "Cold" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Booked", children: "Booked" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: lead.lastMessage || "No messages yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", step: "0.01", defaultValue: Number(lead.value).toFixed(2), className: "ml-auto h-8 w-28 text-right", onBlur: (e) => {
            const value = Number(e.target.value || 0);
            if (value !== Number(lead.value)) {
              updateLead.mutate({
                id: lead.id,
                patch: {
                  value
                }
              });
            }
          } }) })
        ] }, lead.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 6, className: "text-center text-sm text-muted-foreground py-10", children: "No leads match your filters." }) }) })
      ] }) }) })
    ] })
  ] });
}
export {
  LeadsPage as component
};
