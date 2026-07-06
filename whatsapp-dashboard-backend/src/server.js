require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");

const logger = require("./config/logger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { initSocket } = require("./realtime/socket");

const authRoutes = require("./routes/auth.routes");
const conversationsRoutes = require("./routes/conversations.routes");
const leadsRoutes = require("./routes/leads.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const settingsRoutes = require("./routes/settings.routes");
const integrationsRoutes = require("./routes/integrations.routes");
const automationRoutes = require("./routes/automation/workflows.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

const API_PREFIX = "/api/v1";
app.use(API_PREFIX, authRoutes);
app.use(API_PREFIX, conversationsRoutes);
app.use(API_PREFIX, leadsRoutes);
app.use(API_PREFIX, analyticsRoutes);
app.use(API_PREFIX, settingsRoutes);
app.use(API_PREFIX, integrationsRoutes);
app.use(`${API_PREFIX}/automation`, automationRoutes);

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
