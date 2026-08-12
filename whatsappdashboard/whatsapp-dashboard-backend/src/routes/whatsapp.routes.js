import express from "express";
import requireAuth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as schemas from "../validators/schemas.js";
import * as whatsappConnections from "../services/whatsapp-connections.service.js";

const router = express.Router();
router.use(requireAuth);

router.get(
  "/whatsapp/connection",
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.getConnection(req.workspaceId));
  }),
);

router.put(
  "/whatsapp/connection/manual",
  validate(schemas.updateWhatsappSettings),
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.saveManualConnection(req.workspaceId, req.body));
  }),
);

export default router;
