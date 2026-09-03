import logger from "../config/logger.js";
import { AppError } from "../utils/errors.js";

const PG_ERROR_MAP = {
  23502: [400, "DB_NOT_NULL_VIOLATION", "A required value is missing"],
  23503: [409, "DB_FOREIGN_KEY_VIOLATION", "Referenced record does not exist"],
  23505: [409, "DB_UNIQUE_VIOLATION", "Record already exists"],
  23514: [400, "DB_CHECK_VIOLATION", "Request violates a data constraint"],
  "22P02": [400, "DB_INVALID_TEXT_REPRESENTATION", "Invalid identifier or value format"],
  22001: [400, "DB_VALUE_TOO_LONG", "One of the provided values is too long"],
  42601: [500, "DB_SYNTAX_ERROR", "Database query syntax error"],
  42703: [500, "DB_UNDEFINED_COLUMN", "Database schema mismatch"],
  "42P01": [500, "DB_UNDEFINED_TABLE", "Database schema is missing a required table"],
  "28P01": [503, "DB_AUTH_FAILED", "Database authentication failed"],
  "3D000": [503, "DB_NOT_FOUND", "Configured database does not exist"],
  "08000": [503, "DB_CONNECTION_ERROR", "Database connection failed"],
  "08003": [503, "DB_CONNECTION_ERROR", "Database connection is not open"],
  "08006": [503, "DB_CONNECTION_ERROR", "Database connection failed"],
  53300: [503, "DB_TOO_MANY_CONNECTIONS", "Database is temporarily overloaded"],
  "57P01": [503, "DB_CONNECTION_TERMINATED", "Database connection was interrupted"],
};

function requestId(req) {
  return req.id || req.requestId || req.get?.("x-request-id") || null;
}

function normalizeError(err) {
  if (err instanceof AppError) {
    return err;
  }

  if (err?.statusCode && err?.code) {
    return new AppError(err.message, err.statusCode, err.code, err.details);
  }

  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return new AppError("Malformed JSON request body", 400, "MALFORMED_JSON");
  }

  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    return new AppError("Invalid or expired token", 401, "UNAUTHORIZED");
  }

  if (err?.code && PG_ERROR_MAP[err.code]) {
    const [statusCode, code, message] = PG_ERROR_MAP[err.code];
    return new AppError(message, statusCode, code, {
      constraint: err.constraint,
      table: err.table,
      column: err.column,
    });
  }

  if (err?.code === "ECONNREFUSED" || err?.code === "ETIMEDOUT" || err?.code === "ENOTFOUND") {
    return new AppError("A required upstream service is unavailable", 503, "UPSTREAM_UNAVAILABLE", {
      causeCode: err.code,
    });
  }

  if (
    err?.message?.startsWith("WhatsApp API error") ||
    err?.message?.startsWith("WhatsApp sender returned")
  ) {
    return new AppError("WhatsApp upstream request failed", 502, "WHATSAPP_UPSTREAM_ERROR", {
      cause: err.message,
    });
  }

  if (err?.code === "ENCRYPTION_NOT_CONFIGURED" || err?.message === "ENCRYPTION_KEY is not set") {
    return new AppError("Server encryption is not configured", 503, "ENCRYPTION_NOT_CONFIGURED");
  }

  return new AppError("Internal server error", 500, "INTERNAL_ERROR");
}

function responseBody(normalized, req, originalError) {
  const body = {
    error: normalized.code,
    message: normalized.message,
    statusCode: normalized.statusCode,
    requestId: requestId(req),
    path: req.originalUrl || req.path,
  };

  if (normalized.details) {
    body.details = normalized.details;
  }

  if (process.env.NODE_ENV !== "production" && normalized.code === "INTERNAL_ERROR") {
    body.debug = {
      name: originalError?.name,
      message: originalError?.message,
      code: originalError?.code,
    };
  }

  return body;
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const normalized = normalizeError(err);
  const logPayload = {
    err,
    normalized: {
      code: normalized.code,
      statusCode: normalized.statusCode,
      details: normalized.details,
    },
    requestId: requestId(req),
    method: req.method,
    path: req.originalUrl || req.path,
    ip: req.ip,
  };

  if (normalized.statusCode >= 500) {
    logger.error(logPayload, normalized.message);
  } else {
    logger.warn(logPayload, normalized.message);
  }

  res.status(normalized.statusCode).json(responseBody(normalized, req, err));
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: "ROUTE_NOT_FOUND",
    message: `No route: ${req.method} ${req.originalUrl || req.path}`,
    statusCode: 404,
    requestId: requestId(req),
    path: req.originalUrl || req.path,
  });
}

export { errorHandler, notFoundHandler, normalizeError };
