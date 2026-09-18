import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { M as MessageSquare, d as Sparkles, s as Workflow, T as Gauge, V as ShieldCheck, Y as Twitter, _ as Linkedin, $ as Github, a0 as Youtube, a1 as Figma, C as Chromium, a2 as Slack, a as Mail, a3 as Trello, Z as Zap, a4 as Cloud, a5 as ArrowRight } from "../_libs/lucide-react.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
function Index() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Nav, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Hero, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Features, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CTA, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
function Nav() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-40 border-b bg-background/70 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex h-16 max-w-6xl items-center justify-between px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 font-semibold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4" }) }),
      "Flowly"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden gap-8 text-sm text-muted-foreground md:flex", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#features", className: "hover:text-foreground", children: "Features" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#integrations", className: "hover:text-foreground", children: "Integrations" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#pricing", className: "hover:text-foreground", children: "Pricing" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "ghost", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", children: "Sign in" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", children: "Start free" }) })
    ] })
  ] }) });
}
function Hero() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 pb-24 pt-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 text-primary" }),
        "Automate anything, in one click"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AutomationHub, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-10 max-w-xl text-sm text-muted-foreground", children: "Trusted by 12,000+ teams to run workflows across the tools they already use." })
    ] })
  ] });
}
const LEFT_ICONS = [Figma, Chromium, Slack, Mail];
const RIGHT_ICONS = [Trello, Github, Zap, Cloud];
function AutomationHub() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto mt-14 h-[440px] max-w-5xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute inset-0 h-full w-full", viewBox: "0 0 1000 440", fill: "none", preserveAspectRatio: "none", "aria-hidden": true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "line", x1: "0", y1: "0", x2: "1", y2: "0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "oklch(0.85 0.05 240)", stopOpacity: "0.2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "50%", stopColor: "oklch(0.7 0.12 240)", stopOpacity: "0.9" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "oklch(0.85 0.05 240)", stopOpacity: "0.2" })
      ] }) }),
      [80, 170, 260, 350].map((y, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(motion.path, { d: `M 40 ${y} C 200 ${y}, 260 220, 350 220`, stroke: "url(#line)", strokeWidth: "1.5", initial: {
        pathLength: 0,
        opacity: 0
      }, animate: {
        pathLength: 1,
        opacity: 1
      }, transition: {
        duration: 1.2,
        delay: 0.1 * i,
        ease: "easeOut"
      } }, `l-${i}`)),
      [80, 170, 260, 350].map((y, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(motion.path, { d: `M 960 ${y} C 800 ${y}, 740 220, 650 220`, stroke: "url(#line)", strokeWidth: "1.5", initial: {
        pathLength: 0,
        opacity: 0
      }, animate: {
        pathLength: 1,
        opacity: 1
      }, transition: {
        duration: 1.2,
        delay: 0.1 * i,
        ease: "easeOut"
      } }, `r-${i}`))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 top-0 hidden h-full w-24 flex-col justify-between py-4 md:flex", children: LEFT_ICONS.map((Icon, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(IconBubble, { Icon, delay: 0.15 * i }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-0 hidden h-full w-24 flex-col justify-between py-4 md:flex", children: RIGHT_ICONS.map((Icon, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(IconBubble, { Icon, delay: 0.15 * i + 0.2 }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
      opacity: 0,
      y: 20
    }, animate: {
      opacity: 1,
      y: 0
    }, transition: {
      duration: 0.6
    }, className: "absolute left-1/2 top-1/2 w-[min(92%,480px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-card/95 px-8 py-10 text-center shadow-xl backdrop-blur", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 font-mono text-sm text-muted-foreground", children: "{automations}" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight sm:text-4xl", children: "One-click automation" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-3 max-w-sm text-sm text-muted-foreground", children: "One-click automation solutions to streamline workflows, boost efficiency, and simplify complex tasks effortlessly." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "rounded-full bg-foreground text-background hover:bg-foreground/90", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/signup", children: [
        "Book a demo ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-1 h-4 w-4" })
      ] }) }) })
    ] })
  ] });
}
function IconBubble({
  Icon,
  delay
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: {
    opacity: 0,
    scale: 0.6
  }, animate: {
    opacity: 1,
    scale: 1
  }, transition: {
    duration: 0.4,
    delay
  }, whileHover: {
    scale: 1.1
  }, className: "flex h-12 w-12 items-center justify-center rounded-xl border bg-card shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 text-foreground" }) });
}
function Features() {
  const items = [{
    icon: Workflow,
    title: "Visual workflows",
    desc: "Drag, drop, and connect apps in a canvas built for speed."
  }, {
    icon: Gauge,
    title: "Real-time insights",
    desc: "See every run, every failure, every saved hour — live."
  }, {
    icon: ShieldCheck,
    title: "Enterprise ready",
    desc: "SOC 2, SSO, and granular roles baked in from day one."
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "features", className: "border-t bg-muted/30 py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold tracking-tight sm:text-4xl", children: "Everything you need to ship automations" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-muted-foreground", children: "Replace brittle scripts and manual handoffs with reliable flows your whole team can trust." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-14 grid gap-6 md:grid-cols-3", children: items.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border bg-card p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(it.icon, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-semibold", children: it.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: it.desc })
    ] }, it.title)) })
  ] }) });
}
function CTA() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl rounded-3xl border bg-foreground px-8 py-14 text-center text-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold tracking-tight sm:text-4xl", children: "Ship your first automation today" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-3 max-w-lg text-sm text-background/70", children: "Free for 14 days. No credit card required." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex justify-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", variant: "secondary", className: "rounded-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", children: "Start free" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", variant: "ghost", className: "rounded-full text-background hover:bg-background/10 hover:text-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard", children: "Book a demo" }) })
    ] })
  ] }) });
}
function Footer() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t bg-muted/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-16", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 md:grid-cols-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 font-semibold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4" }) }),
          "Flowly"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-xs text-sm text-muted-foreground", children: "One-click automations that connect the tools your team already uses." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => e.preventDefault(), className: "mt-5 flex max-w-sm items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, placeholder: "you@company.com", className: "h-10 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", size: "sm", className: "h-10 rounded-full px-4", children: "Subscribe" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(FooterCol, { title: "Product", links: [{
        label: "Features",
        href: "#features"
      }, {
        label: "Integrations",
        href: "#integrations"
      }, {
        label: "Pricing",
        href: "#pricing"
      }, {
        label: "Changelog",
        href: "#"
      }] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(FooterCol, { title: "Company", links: [{
        label: "About",
        href: "#"
      }, {
        label: "Customers",
        href: "#"
      }, {
        label: "Careers",
        href: "#"
      }, {
        label: "Contact",
        href: "#"
      }] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(FooterCol, { title: "Resources", links: [{
        label: "Docs",
        href: "#"
      }, {
        label: "Blog",
        href: "#"
      }, {
        label: "Community",
        href: "#"
      }, {
        label: "Support",
        href: "#"
      }] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " Flowly, Inc. All rights reserved."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-foreground", children: "Privacy" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-foreground", children: "Terms" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-foreground", children: "Security" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SocialIcon, { Icon: Twitter, label: "Twitter" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SocialIcon, { Icon: Linkedin, label: "LinkedIn" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SocialIcon, { Icon: Github, label: "GitHub" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SocialIcon, { Icon: Youtube, label: "YouTube" })
      ] })
    ] })
  ] }) });
}
function FooterCol({
  title,
  links
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-4 space-y-3 text-sm text-muted-foreground", children: links.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: l.href, className: "hover:text-foreground", children: l.label }) }, l.label)) })
  ] });
}
function SocialIcon({
  Icon,
  label
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", "aria-label": label, className: "flex h-8 w-8 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }) });
}
export {
  Index as component
};
