import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, CheckCheck, Clock } from "lucide-react";

export function MessageBubble({
  message,
  isAgent,
  time,
  read,
  providerStatus,
  failureMessage,
}: {
  message: string;
  isAgent: boolean;
  time: string;
  read?: boolean;
  providerStatus?: string;
  failureMessage?: string;
}) {
  const normalizedStatus = providerStatus?.toUpperCase();
  const failed = normalizedStatus === "FAILED";
  const pending = normalizedStatus === "QUEUED" || normalizedStatus === "SENDING";
  const delivered = normalizedStatus === "DELIVERED" || normalizedStatus === "READ";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={cn("flex w-full", isAgent ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isAgent
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border rounded-bl-sm",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            isAgent ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          <span>{time}</span>
          {isAgent && failed ? (
            <>
              <span className="max-w-32 truncate">{failureMessage || "Failed"}</span>
              <AlertCircle className="h-3 w-3" />
            </>
          ) : null}
          {isAgent && !failed && pending ? <Clock className="h-3 w-3" /> : null}
          {isAgent && !failed && !pending ? (
            delivered || read ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
