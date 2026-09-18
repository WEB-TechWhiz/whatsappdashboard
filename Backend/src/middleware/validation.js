// const { ValidationError } = require("../utils/errors");
import { ValidationError } from "../utils/errors.js";

/**
 * Validation middleware factory using Zod schemas
 * @param {object} schema - Zod schema for validation
 * @returns {function} Express middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.flatten());
    }
    req.body = result.data; // parsed + defaults applied
    next();
  };
}

export default validateRequest;
