import express from "express";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as notifications from "../services/notifications.service.js";

const router = express.Router();
router.use(requireAuth);

router.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const unreadOnly = req.query.unreadOnly === "true";
    res.json(await notifications.listNotifications(req.workspaceId, { limit, unreadOnly }));
  }),
);

router.get(
  "/notifications/unread-count",
  asyncHandler(async (req, res) => {
    res.json({ count: await notifications.unreadCount(req.workspaceId) });
  }),
);

router.post(
  "/notifications/:id/read",
  asyncHandler(async (req, res) => {
    await notifications.markRead(req.workspaceId, req.params.id);
    res.status(204).end();
  }),
);

router.post(
  "/notifications/read-all",
  asyncHandler(async (req, res) => {
    await notifications.markAllRead(req.workspaceId);
    res.status(204).end();
  }),
);

export default router;