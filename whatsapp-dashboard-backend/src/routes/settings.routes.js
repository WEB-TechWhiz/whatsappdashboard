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
// const { encrypt } = require("../utils/crypto");
import { encrypt } from "../utils/crypto.js";

// const router = express.Router();
const router = express.Router();
router.use(requireAuth);

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
    const { phone, apiToken, webhookUrl } = req.body;

    if (apiToken) {
      const encryptedToken = encrypt(apiToken);
      await pool.query(
        `UPDATE workspaces
         SET whatsapp_phone = $1, whatsapp_api_token = $2, whatsapp_webhook_url = $3, updated_at = now()
         WHERE id = $4`,
        [phone, encryptedToken, webhookUrl, req.workspaceId],
      );
    } else {
      await pool.query(
        `UPDATE workspaces
         SET whatsapp_phone = $1, whatsapp_webhook_url = $2, updated_at = now()
         WHERE id = $3`,
        [phone, webhookUrl, req.workspaceId],
      );
    }

    res.json({ phone, webhookUrl, connected: true });
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
