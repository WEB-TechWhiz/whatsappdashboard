// const pino = require("pino");
import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: [
    "req.headers.authorization",
    "*.password",
    "*.password_hash",
    "*.apiToken",
    "*.accessToken",
    "*.access_token",
    "*.whatsapp_api_token",
    "*.access_token_encrypted",
    "*.appSecret",
    "*.app_secret",
    "*.client_secret",
    "*.code",
  ],
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
});
export default logger;
