import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "../../src/routes/auth.routes.js";
import conversationsRoutes from "../../src/routes/conversations.routes.js";
import leadsRoutes from "../../src/routes/leads.routes.js";
import analyticsRoutes from "../../src/routes/analytics.routes.js";
import settingsRoutes from "../../src/routes/settings.routes.js";
import integrationsRoutes from "../../src/routes/integrations.routes.js";
import whatsappRoutes from "../../src/routes/whatsapp.routes.js";
import automationRoutes from "../../src/routes/automation/workflows.routes.js";
import webhookRoutes from "../../src/routes/automation/webhooks.routes.js";
import leadsAutomationRoutes from "../../src/routes/automation/leads.routes.js";
import escalationsRoutes from "../../src/routes/automation/escalations.routes.js";
import dashboardRoutes from "../../src/routes/dashboard.routes.js";
import notificationsRoutes from "../../src/routes/notifications.routes.js";
import billingRoutes from "../../src/routes/billing.routes.js";
import adminRoutes from "../../src/routes/admin.routes.js";
import { errorHandler, notFoundHandler } from "../../src/middleware/errorHandler.js";

export function createTestApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());

  // Raw body handling for webhooks
  app.use("/api/v1/webhooks", express.raw({ type: "application/json", limit: "1mb" }));
  app.use((req, res, next) => {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      req.rawBody = JSON.stringify(req.body);
    }
    next();
  });

  app.use(express.json({ limit: "1mb" }));

  const API_PREFIX = "/api/v1";
  app.use(`${API_PREFIX}/webhooks`, webhookRoutes);
  app.use(API_PREFIX, integrationsRoutes);
  app.use(API_PREFIX, authRoutes);
  app.use(API_PREFIX, billingRoutes);
  app.use(API_PREFIX, conversationsRoutes);
  app.use(API_PREFIX, leadsRoutes);
  app.use(API_PREFIX, analyticsRoutes);
  app.use(API_PREFIX, settingsRoutes);
  app.use(API_PREFIX, whatsappRoutes);
  app.use(API_PREFIX, dashboardRoutes);
  app.use(API_PREFIX, notificationsRoutes);
  app.use(API_PREFIX, adminRoutes);
  app.use(`${API_PREFIX}/automation`, automationRoutes);
  app.use(`${API_PREFIX}/automation/leads`, leadsAutomationRoutes);
  app.use(`${API_PREFIX}/automation/escalations`, escalationsRoutes);

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
