import express from "express";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as service from "../services/whatsapp-connections.service.js";

const router = express.Router();
router.use(requireAuth);

router.get("/whatsapp/connections", asyncHandler(async (req, res) => {
  res.json({ connections: await service.listConnections(req.workspaceId) });
}));

router.post("/whatsapp/connections", asyncHandler(async (req, res) => {
  const { connection, webhookVerifyToken } = await service.createConnection(req.workspaceId, req.body || {});
  res.status(201).json({ connection, webhookVerifyToken });
}));

router.post("/whatsapp/connections/:id/disconnect", asyncHandler(async (req, res) => {
  res.json({ connection: await service.disconnectConnection(req.workspaceId, req.params.id) });
}));

export default router;
