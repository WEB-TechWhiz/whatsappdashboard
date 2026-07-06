const express = require("express");
const requireAuth = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const analytics = require("../services/analytics.service");

const router = express.Router();
router.use(requireAuth);

const ALLOWED_OVERVIEW_RANGES = ["today", "week", "month"];
const ALLOWED_BOOKING_RANGES = ["7days", "30days"];

router.get(
  "/analytics/overview",
  asyncHandler(async (req, res) => {
    const range = ALLOWED_OVERVIEW_RANGES.includes(req.query.range) ? req.query.range : "today";
    const data = await analytics.getOverview(req.workspaceId, range);
    res.json(data);
  }),
);

router.get(
  "/analytics/bookings",
  asyncHandler(async (req, res) => {
    const range = ALLOWED_BOOKING_RANGES.includes(req.query.range) ? req.query.range : "7days";
    const data = await analytics.getBookingsChart(req.workspaceId, range);
    res.json(data);
  }),
);

router.get(
  "/analytics/activity",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const data = await analytics.getActivity(req.workspaceId, limit);
    res.json(data);
  }),
);

router.get(
  "/analytics/summary",
  asyncHandler(async (req, res) => {
    const data = await analytics.getSummaryStats(req.workspaceId);
    res.json(data);
  }),
);

module.exports = router;
