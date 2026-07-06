import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        Live WhatsApp CRM
      </div>
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
        <MessageSquare className="h-7 w-7" />
      </div>
      <h1 className="max-w-2xl text-4xl sm:text-5xl font-bold tracking-tight">
        Close more leads, one message at a time.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        A focused dashboard for your WhatsApp pipeline — leaks, today&apos;s cash, and on‑deck follow‑ups at a glance.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg">
          <Link to="/dashboard">
            Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/dashboard/conversations">View conversations</Link>
        </Button>
      </div>
    </div>
  );
}
