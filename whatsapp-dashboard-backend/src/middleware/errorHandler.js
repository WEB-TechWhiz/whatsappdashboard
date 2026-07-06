const logger = require("../config/logger");
const { AppError } = require("../utils/errors");

// Must be registered LAST, after all routes.
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    logger.warn({ err, path: req.path }, err.message);
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Unexpected error — log full detail server-side, never leak stack traces to the client
  logger.error({ err, path: req.path }, "Unhandled error");
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Something went wrong. Please try again.",
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: "NOT_FOUND", message: `No route: ${req.method} ${req.path}` });
}

module.exports = { errorHandler, notFoundHandler };
