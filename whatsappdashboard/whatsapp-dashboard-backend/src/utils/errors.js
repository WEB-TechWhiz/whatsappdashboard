class AppError extends Error {
  constructor(message, statusCode, code, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || "APP_ERROR";
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(details) {
    super("Validation failed", 400, "VALIDATION_ERROR", details);
  }
}

class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST", details = undefined) {
    super(message, 400, code, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMITED");
  }
}

class PaymentRequiredError extends AppError {
  constructor(message = "Payment required", code = "PAYMENT_REQUIRED", details = undefined) {
    super(message, 402, code, details);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", code = "SERVICE_UNAVAILABLE") {
    super(message, 503, code);
  }
}

class ExternalServiceError extends AppError {
  constructor(
    message = "External service failed",
    code = "EXTERNAL_SERVICE_ERROR",
    details = undefined,
  ) {
    super(message, 502, code, details);
  }
}

export {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PaymentRequiredError,
  RateLimitError,
  ServiceUnavailableError,
  ExternalServiceError,
};
