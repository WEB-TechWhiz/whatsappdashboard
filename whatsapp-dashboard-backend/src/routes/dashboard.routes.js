import express from "express";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as dashboard from "../services/dashboard.service.js";

const router = express.Router();
router.use(requireAuth);

const ALLOWED = new Set(["today", "week", "month", "7d", "30d", "90d"]);

router.get(
  "/dashboard/overview",
  asyncHandler(async (req, res) => {
    const range = ALLOWED.has(req.query.range) ? req.query.range : "week";
    const data = await dashboard.getOverview(req.workspaceId, range);
    res.json(data);
  }),
);

export default router;