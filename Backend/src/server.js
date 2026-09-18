import "dotenv/config.js";
import { randomUUID } from "crypto";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import logger from "./config/logger.js";
import { corsOptions } from "./config/cors.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { initSocket } from "./realtime/socket.js";

import authRoutes from "./routes/auth.routes.js";
import conversationsRoutes from "./routes/conversations.routes.js";
import leadsRoutes from "./routes/leads.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import integrationsRoutes from "./routes/integrations.routes.js";
import whatsappRoutes from "./routes/whatsapp.routes.js";
import automationRoutes from "./routes/automation/workflows.routes.js";
import webhookRoutes from "./routes/automation/webhooks.routes.js";
import leadsAutomationRoutes from "./routes/automation/leads.routes.js";
import escalationsRoutes from "./routes/automation/escalations.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

const TRUST_PROXY_HOPS = Number.parseInt(process.env.TRUST_PROXY_HOPS || "1", 10);
app.set("trust proxy", Number.isFinite(TRUST_PROXY_HOPS) ? TRUST_PROXY_HOPS : 1);

app.use(helmet());
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.get("x-request-id") || randomUUID(),
  }),
);
app.use(cors(corsOptions));

// Webhook routes need raw body for signature verification
app.use("/api/v1/webhooks", express.raw({ type: "application/json", limit: "1mb" }));
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.rawBody = JSON.stringify(req.body);
  }
  next();
});

app.use(express.json({ limit: "1mb" }));

const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/webhooks`, webhookRoutes);
app.use(API_PREFIX, authRoutes);
app.use(API_PREFIX, conversationsRoutes);
app.use(API_PREFIX, leadsRoutes);
app.use(API_PREFIX, analyticsRoutes);
app.use(API_PREFIX, settingsRoutes);
app.use(API_PREFIX, integrationsRoutes);
app.use(API_PREFIX, whatsappRoutes);
app.use(API_PREFIX, dashboardRoutes);
app.use(API_PREFIX, notificationsRoutes);
app.use(API_PREFIX, billingRoutes);
app.use(API_PREFIX, adminRoutes);
app.use(`${API_PREFIX}/automation`, automationRoutes);
app.use(`${API_PREFIX}/automation/leads`, leadsAutomationRoutes);
app.use(`${API_PREFIX}/automation/escalations`, escalationsRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(notFoundHandler);
app.use(errorHandler); // must be last

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`WhatsApp Dashboard backend listening on port ${PORT}`);
});

// Don't let one bad promise silently kill the process
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
