const express = require("express");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validators/schemas");
const conversations = require("../services/conversations.service");
const { emitToWorkspace } = require("../realtime/socket");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const data = await conversations.listConversations(req.workspaceId, search);
    res.json(data);
  })
);

router.get(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200); // cap to prevent unbounded pulls
    const offset = Number(req.query.offset) || 0;
    const data = await conversations.getMessages(req.workspaceId, req.params.id, limit, offset);

    // Mark as read on fetch — simplest read-receipt model for a v1
    await conversations.markRead(req.workspaceId, req.params.id);

    res.json(data);
  })
);

router.post(
  "/conversations/:id/messages",
  validate(schemas.sendMessage),
  asyncHandler(async (req, res) => {
    const message = await conversations.sendMessage(req.workspaceId, req.params.id, req.body);

    // Push to any other connected dashboard tab/agent viewing this workspace
    emitToWorkspace(req.workspaceId, "message:new", { contactId: req.params.id, message });

    res.status(201).json(message);
  })
);

router.post(
  "/conversations/:id/typing",
  validate(schemas.typing),
  asyncHandler(async (req, res) => {
    // Typing status is ephemeral — broadcast only, no DB write needed.
    emitToWorkspace(req.workspaceId, "typing", {
      contactId: req.params.id,
      isTyping: req.body.isTyping,
    });
    res.status(204).end();
  })
);

module.exports = router;
