import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  Zap,
  Slack,
  Github,
  Figma,
  Trello,
  Chrome,
  Mail,
  Cloud,
  Sparkles,
  Workflow,
  ShieldCheck,
  Gauge,
  Twitter,
  Linkedin,
  Youtube,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="h-4 w-4" />
          </span>
          Flowly
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#integrations" className="hover:text-foreground">Integrations</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/dashboard">Book a demo</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft blue blobs like the reference */}
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Automate anything, in one click
        </div>

        <AutomationHub />

        <p className="mx-auto mt-10 max-w-xl text-sm text-muted-foreground">
          Trusted by 12,000+ teams to run workflows across the tools they already use.
        </p>
      </div>
    </section>
  );
}

const LEFT_ICONS = [Figma, Chrome, Slack, Mail] as const;
const RIGHT_ICONS = [Trello, Github, Zap, Cloud] as const;

function AutomationHub() {
  return (
    <div className="relative mx-auto mt-14 h-[440px] max-w-5xl">
      {/* SVG lines connecting side icons to central card */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 440"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.85 0.05 240)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="oklch(0.7 0.12 240)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.85 0.05 240)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Left side curves into left edge of card (x=350) */}
        {[80, 170, 260, 350].map((y, i) => (
          <motion.path
            key={`l-${i}`}
            d={`M 40 ${y} C 200 ${y}, 260 220, 350 220`}
            stroke="url(#line)"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.1 * i, ease: "easeOut" }}
          />
        ))}
        {/* Right side curves into right edge of card (x=650) */}
        {[80, 170, 260, 350].map((y, i) => (
          <motion.path
            key={`r-${i}`}
            d={`M 960 ${y} C 800 ${y}, 740 220, 650 220`}
            stroke="url(#line)"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.1 * i, ease: "easeOut" }}
          />
        ))}
      </svg>

      {/* Left icons column */}
      <div className="absolute left-0 top-0 hidden h-full w-24 flex-col justify-between py-4 md:flex">
        {LEFT_ICONS.map((Icon, i) => (
          <IconBubble key={i} Icon={Icon} delay={0.15 * i} />
        ))}
      </div>

      {/* Right icons column */}
      <div className="absolute right-0 top-0 hidden h-full w-24 flex-col justify-between py-4 md:flex">
        {RIGHT_ICONS.map((Icon, i) => (
          <IconBubble key={i} Icon={Icon} delay={0.15 * i + 0.2} />
        ))}
      </div>

      {/* Central card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute left-1/2 top-1/2 w-[min(92%,480px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-card/95 px-8 py-10 text-center shadow-xl backdrop-blur"
      >
        <div className="mb-3 font-mono text-sm text-muted-foreground">
          {"{automations}"}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          One-click automation
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
          One-click automation solutions to streamline workflows, boost efficiency, and simplify complex tasks effortlessly.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            <Link to="/dashboard">
              Book a demo <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function IconBubble({
  Icon,
  delay,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.1 }}
      className="flex h-12 w-12 items-center justify-center rounded-xl border bg-card shadow-sm"
    >
      <Icon className="h-5 w-5 text-foreground" />
    </motion.div>
  );
}

function Features() {
  const items = [
    {
      icon: Workflow,
      title: "Visual workflows",
      desc: "Drag, drop, and connect apps in a canvas built for speed.",
    },
    {
      icon: Gauge,
      title: "Real-time insights",
      desc: "See every run, every failure, every saved hour — live.",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise ready",
      desc: "SOC 2, SSO, and granular roles baked in from day one.",
    },
  ];
  return (
    <section id="features" className="border-t bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to ship automations
          </h2>
          <p className="mt-3 text-muted-foreground">
            Replace brittle scripts and manual handoffs with reliable flows your whole team can trust.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl rounded-3xl border bg-foreground px-8 py-14 text-center text-background">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ship your first automation today
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-background/70">
          Free for 14 days. No credit card required.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild size="lg" variant="secondary" className="rounded-full">
            <Link to="/dashboard">Start free</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full text-background hover:bg-background/10 hover:text-background">
            <Link to="/dashboard">Book a demo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="h-4 w-4" />
              </span>
              Flowly
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              One-click automations that connect the tools your team already uses.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-5 flex max-w-sm items-center gap-2"
            >
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="h-10 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button type="submit" size="sm" className="h-10 rounded-full px-4">
                Subscribe
              </Button>
            </form>
          </div>
          <FooterCol
            title="Product"
            links={[
              { label: "Features", href: "#features" },
              { label: "Integrations", href: "#integrations" },
              { label: "Pricing", href: "#pricing" },
              { label: "Changelog", href: "#" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About", href: "#" },
              { label: "Customers", href: "#" },
              { label: "Careers", href: "#" },
              { label: "Contact", href: "#" },
            ]}
          />
          <FooterCol
            title="Resources"
            links={[
              { label: "Docs", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Community", href: "#" },
              { label: "Support", href: "#" },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Flowly, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
          <div className="flex items-center gap-3">
            <SocialIcon Icon={Twitter} label="Twitter" />
            <SocialIcon Icon={Linkedin} label="LinkedIn" />
            <SocialIcon Icon={Github} label="GitHub" />
            <SocialIcon Icon={Youtube} label="YouTube" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="hover:text-foreground">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({
  Icon,
  label,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
