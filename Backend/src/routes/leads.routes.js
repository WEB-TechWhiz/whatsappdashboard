// const express = require("express");
import express from "express";
// const requireAuth = require("../middleware/auth");
import requireAuth from "../middleware/auth.js";
// const validate = require("../middleware/validate");
import validate from "../middleware/validate.js";
// const asyncHandler = require("../utils/asyncHandler");
import asyncHandler from "../utils/asyncHandler.js";
// const schemas = require("../validators/schemas");
import * as schemas from "../validators/schemas.js";
// const leads = require("../services/leads.service");
import * as leads from "../services/leads.service.js";
// const { emitToWorkspace } = require("../realtime/socket");
import { emitToWorkspace } from "../realtime/socket.js";

const router = express.Router();
router.use(requireAuth);

router.get(
  "/leads",
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const data = await leads.listLeads(req.workspaceId, { status, search });
    res.json(data);
  }),
);

router.post(
  "/leads",
  validate(schemas.createLead),
  asyncHandler(async (req, res) => {
    const lead = await leads.createLead(req.workspaceId, req.body);
    emitToWorkspace(req.workspaceId, "lead:created", lead);
    res.status(201).json(lead);
  }),
);

router.patch(
  "/leads/:id",
  validate(schemas.updateLead),
  asyncHandler(async (req, res) => {
    const lead = await leads.updateLead(req.workspaceId, req.params.id, req.body);
    emitToWorkspace(req.workspaceId, "lead:updated", lead);
    res.json(lead);
  }),
);

export default router;
