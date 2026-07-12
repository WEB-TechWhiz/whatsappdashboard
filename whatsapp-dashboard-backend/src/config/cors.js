const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";

function splitList(value) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

const allowedOrigins = splitList(process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN);
const allowedOriginPatterns = splitList(process.env.FRONTEND_ORIGIN_PATTERNS);

// Quick-tunnel origins (*.trycloudflare.com) are always allowed in development.
if (process.env.NODE_ENV !== "production") {
  allowedOriginPatterns.push("https://*.trycloudflare.com");
}

// Named-tunnel origin: if CF_TUNNEL_ORIGIN is set, add it as an allowed origin.
// This supports both quick-tunnel dev and named-tunnel production setups.
if (process.env.CF_TUNNEL_ORIGIN) {
  splitList(process.env.CF_TUNNEL_ORIGIN).forEach((origin) => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

const allowedOriginRegexes = allowedOriginPatterns.map(wildcardToRegExp);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return allowedOriginRegexes.some((regex) => regex.test(origin));
}

function corsOrigin(origin, callback) {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin not allowed by CORS: ${origin}`));
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
};

export { corsOptions, isAllowedOrigin };
