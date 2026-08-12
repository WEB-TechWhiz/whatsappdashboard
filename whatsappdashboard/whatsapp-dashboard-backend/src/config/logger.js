// const pino = require("pino");
import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: [
    "req.headers.authorization",
    "*.password",
    "*.password_hash",
    "*.apiToken",
    "*.whatsapp_api_token",
  ],
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
});
export default logger;
