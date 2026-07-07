const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../utils/errors");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Everything downstream trusts req.workspaceId — it comes ONLY from the
    // verified token, never from req.body/req.params/req.query.
    req.workspaceId = payload.workspaceId;
    req.workspace = { id: payload.workspaceId };
    req.user = { id: payload.workspaceId };
    next();
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

module.exports = requireAuth;
