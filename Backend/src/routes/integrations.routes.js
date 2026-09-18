// const express = require("express");
import express from "express";
// const validate = require("../middleware/validate");
import validate from "../middleware/validate.js";
// const asyncHandler = require("../utils/asyncHandler");
import asyncHandler from "../utils/asyncHandler.js";
// const schemas = require("../validators/schemas");
import * as schemas from "../validators/schemas.js";
// const conversations = require("../services/conversations.service");
import * as conversations from "../services/conversations.service.js";
// const { emitToWorkspace } = require("../realtime/socket");
import { emitToWorkspace } from "../realtime/socket.js";
// const { UnauthorizedError } = require("../utils/errors");
import { UnauthorizedError } from "../utils/errors.js";
// const router = express.Router();
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

export default router;
