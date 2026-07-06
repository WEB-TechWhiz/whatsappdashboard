const express = require("express");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validators/schemas");
const leads = require("../services/leads.service");
const { emitToWorkspace } = require("../realtime/socket");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/leads",
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const data = await leads.listLeads(req.workspaceId, { status, search });
    res.json(data);
  })
);

router.post(
  "/leads",
  validate(schemas.createLead),
  asyncHandler(async (req, res) => {
    const lead = await leads.createLead(req.workspaceId, req.body);
    emitToWorkspace(req.workspaceId, "lead:created", lead);
    res.status(201).json(lead);
  })
);

router.patch(
  "/leads/:id",
  validate(schemas.updateLead),
  asyncHandler(async (req, res) => {
    const lead = await leads.updateLead(req.workspaceId, req.params.id, req.body);
    emitToWorkspace(req.workspaceId, "lead:updated", lead);
    res.json(lead);
  })
);

module.exports = router;
