import "dotenv/config.js";

// const http = require("http");
import http from "http";
// const express = require("express");
import express from "express";
// const cors = require("cors");
import cors from "cors";
// const helmet = require("helmet");
import helmet from "helmet";
// const pinoHttp = require("pino-http");
import pinoHttp from "pino-http";

// const logger = require("./config/logger");
import logger from "./config/logger.js";
// const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
// const { initSocket } = require("./realtime/socket");
import { initSocket } from "./realtime/socket.js";

// const authRoutes = require("./routes/auth.routes");
import authRoutes from "./routes/auth.routes.js";
// const conversationsRoutes = require("./routes/conversations.routes");
import conversationsRoutes from "./routes/conversations.routes.js";
// const leadsRoutes = require("./routes/leads.routes");
import leadsRoutes from "./routes/leads.routes.js";
// const analyticsRoutes = require("./routes/analytics.routes");
import analyticsRoutes from "./routes/analytics.routes.js";
// const settingsRoutes = require("./routes/settings.routes");
import settingsRoutes from "./routes/settings.routes.js";
// const integrationsRoutes = require("./routes/integrations.routes");
import integrationsRoutes from "./routes/integrations.routes.js";
// const automationRoutes = require("./routes/automation/workflows.routes");
import automationRoutes from "./routes/automation/webhooks.routes.js";
// const webhookRoutes = require("./routes/automation/webhooks.routes");
import webhookRoutes from "./routes/automation/webhooks.routes.js";
// const leadsAutomationRoutes = require("./routes/automation/leads.routes");
import leadsAutomationRoutes from "./routes/automation/leads.routes.js";
// const escalationsRoutes = require("./routes/automation/escalations.routes");
import escalationsRoutes from "./routes/automation/escalations.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));

// Webhook routes need raw body for signature verification
app.use("/api/v1/webhooks", express.raw({ type: "application/json", limit: "1mb" }));
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.rawBody = JSON.stringify(req.body);
  }
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/webhooks`, webhookRoutes);
app.use(API_PREFIX, authRoutes);
app.use(API_PREFIX, conversationsRoutes);
app.use(API_PREFIX, leadsRoutes);
app.use(API_PREFIX, analyticsRoutes);
app.use(API_PREFIX, settingsRoutes);
app.use(API_PREFIX, integrationsRoutes);
app.use(API_PREFIX, dashboardRoutes);
app.use(API_PREFIX, notificationsRoutes);
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
