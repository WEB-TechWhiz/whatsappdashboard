const { ValidationError } = require("../utils/errors");

// Usage: router.post('/x', validate(schemas.createLead), handler)
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.flatten());
    }
    req.body = result.data; // parsed + defaults applied
    next();
  };
}

module.exports = validate;
module.exports.validateRequest = validate;
