const express = require("express");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validators/schemas");
const conversations = require("../services/conversations.service");
const { emitToWorkspace } = require("../realtime/socket");
const { UnauthorizedError } = require("../utils/errors");

const router = express.Router();

function requireInternalToken(req, res, next) {
  const expected = process.env.INTERNAL_INTEGRATION_TOKEN;
  const provided = req.get("x-internal-token");

  if (!expected || provided !== expected) {
    throw new UnauthorizedError("Invalid integration token");
  }

  next();
}

router.post(
  "/integrations/whatsapp/inbound",
  requireInternalToken,
  validate(schemas.inboundWhatsappMessage),
  asyncHandler(async (req, res) => {
    const { workspaceId, ...message } = req.body;
    const result = await conversations.receiveInboundMessage(workspaceId, message);

    emitToWorkspace(workspaceId, "message:new", {
      contactId: result.contact.id,
      message: result.message,
    });
    emitToWorkspace(workspaceId, "lead:updated", result.contact);

    res.status(201).json(result);
  }),
);

module.exports = router;
