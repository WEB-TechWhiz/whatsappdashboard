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
// const pool = require("../config/db");
import pool from "../config/db.js";
import * as workspaceSettings from "../services/settings.service.js";
import * as whatsappConnections from "../services/whatsapp-connections.service.js";

// const router = express.Router();
const router = express.Router();
router.use(requireAuth);

router.get(
  "/settings/workspace",
  asyncHandler(async (req, res) => {
    res.json(await workspaceSettings.getSettings(req.workspaceId));
  }),
);

router.put(
  "/settings/workspace",
  validate(schemas.updateWorkspaceSettings),
  asyncHandler(async (req, res) => {
    res.json(await workspaceSettings.upsertSettings(req.workspaceId, req.body));
  }),
);

router.put(
  "/settings/profile",
  validate(schemas.updateProfile),
  asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const { rows } = await pool.query(
      `UPDATE workspaces SET name = $1, email = $2, updated_at = now()
       WHERE id = $3 RETURNING id, name, email`,
      [name, email, req.workspaceId],
    );
    res.json(rows[0]);
  }),
);

router.put(
  "/settings/whatsapp",
  validate(schemas.updateWhatsappSettings),
  asyncHandler(async (req, res) => {
    res.json(await whatsappConnections.saveManualConnection(req.workspaceId, req.body));
  }),
);

router.put(
  "/settings/rules",
  validate(schemas.updateRules),
  asyncHandler(async (req, res) => {
    const { autoReply, notifyNewLeads, flagLeaks } = req.body;

    const fields = [];
    const params = [];

    if (autoReply !== undefined) {
      params.push(autoReply);
      fields.push(`auto_reply = $${params.length}`);
    }
    if (notifyNewLeads !== undefined) {
      params.push(notifyNewLeads);
      fields.push(`notify_new_leads = $${params.length}`);
    }
    if (flagLeaks !== undefined) {
      params.push(flagLeaks);
      fields.push(`flag_leaks = $${params.length}`);
    }
    fields.push("updated_at = now()");

    params.push(req.workspaceId);
    const { rows } = await pool.query(
      `UPDATE workspaces SET ${fields.join(", ")}
       WHERE id = $${params.length}
       RETURNING auto_reply, notify_new_leads, flag_leaks`,
      params,
    );

    res.json(rows[0]);
  }),
);

export default router;
