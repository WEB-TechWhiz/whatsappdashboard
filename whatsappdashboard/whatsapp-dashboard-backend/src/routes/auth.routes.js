// const crypto = require("crypto");
import crypto from "crypto";
// const express = require("express");
import express from "express";
// const bcrypt = require("bcrypt");
import bcrypt from "bcrypt";
// const jwt = require("jsonwebtoken");
import jwt from "jsonwebtoken";
// const rateLimit = require("express-rate-limit");
import rateLimit from "express-rate-limit";
// const pool = require("../config/db");
import pool from "../config/db.js";
// const asyncHandler = require("../utils/asyncHandler");
import asyncHandler from "../utils/asyncHandler.js";
// const validate = require("../middleware/validate");
import validate from "../middleware/validate.js";
// const requireAuth = require("../middleware/auth");
import requireAuth from "../middleware/auth.js";
// const schemas = require("../validators/schemas");
import * as schemas from "../validators/schemas.js";
import { AppError, ConflictError, RateLimitError, UnauthorizedError } from "../utils/errors.js";
import { isAllowedOrigin } from "../config/cors.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new RateLimitError("Too many login attempts. Try again later."));
  },
});

const oauthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new RateLimitError("Too many OAuth attempts. Try again later."));
  },
});

function workspaceDto(workspace) {
  return {
    id: workspace.id,
    name: workspace.name,
    email: workspace.email,
    avatarUrl: workspace.avatar_url || null,
    authProvider: workspace.auth_provider || "password",
  };
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshExpiry() {
  const days = Number(process.env.REFRESH_TOKEN_DAYS || 30);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function signAccessToken(workspaceId) {
  return jwt.sign({ workspaceId, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "15m",
  });
}

async function createRefreshToken(workspaceId, req) {
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  await pool.query(
    `INSERT INTO refresh_tokens (workspace_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      workspaceId,
      tokenHash(refreshToken),
      req.get("user-agent") || null,
      req.ip || null,
      refreshExpiry(),
    ],
  );
  return refreshToken;
}

async function issueSession(workspace, req) {
  const accessToken = signAccessToken(workspace.id);
  const refreshToken = await createRefreshToken(workspace.id, req);
  return {
    accessToken,
    refreshToken,
    token: accessToken,
    workspace: workspaceDto(workspace),
  };
}

function requireOAuthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError("Google OAuth is not configured", 503, "OAUTH_NOT_CONFIGURED");
  }

  return { clientId, clientSecret };
}

function splitList(value) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getRequestOrigin(req) {
  const origin = req.get("origin");
  if (origin) return origin;

  const referer = req.get("referer");
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch (err) {
    return null;
  }
}

function getFallbackFrontendOrigin() {
  return splitList(process.env.FRONTEND_ORIGIN).find((origin) => !origin.includes("*")) || null;
}

function getOAuthFrontendOrigin(req) {
  const requestOrigin = getRequestOrigin(req);
  if (requestOrigin && isAllowedOrigin(requestOrigin)) {
    return requestOrigin;
  }

  const fallbackOrigin = getFallbackFrontendOrigin();
  if (fallbackOrigin) {
    return fallbackOrigin;
  }

  throw new AppError(
    "No allowed frontend origin is configured for OAuth",
    503,
    "OAUTH_FRONTEND_ORIGIN_NOT_CONFIGURED",
  );
}

function normalizeOrigin(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.origin;
  } catch (err) {
    return null;
  }
}

function getApiPublicOrigin(req) {
  const configuredOrigin = normalizeOrigin(
    process.env.API_PUBLIC_ORIGIN ||
      process.env.PUBLIC_API_ORIGIN ||
      process.env.BACKEND_PUBLIC_ORIGIN,
  );

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const host = req.get("host");
  if (!host) {
    throw new AppError(
      "Cannot determine API public origin",
      503,
      "API_PUBLIC_ORIGIN_NOT_CONFIGURED",
    );
  }

  return `${req.protocol}://${host}`;
}

function getOAuthRedirectUri(req) {
  const configuredRedirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();

  if (configuredRedirectUri && configuredRedirectUri.toLowerCase() !== "auto") {
    try {
      const url = new URL(configuredRedirectUri);
      if (url.pathname !== "/api/v1/auth/oauth/google/callback") {
        throw new AppError(
          "GOOGLE_OAUTH_REDIRECT_URI must end with /api/v1/auth/oauth/google/callback",
          503,
          "GOOGLE_OAUTH_REDIRECT_URI_INVALID",
        );
      }
      return url.toString();
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        "GOOGLE_OAUTH_REDIRECT_URI is not a valid URL",
        503,
        "GOOGLE_OAUTH_REDIRECT_URI_INVALID",
      );
    }
  }

  return `${getApiPublicOrigin(req)}/api/v1/auth/oauth/google/callback`;
}

function getOAuthRedirectWarnings(req, redirectUri) {
  const warnings = [];
  const requestHost = req.get("host");

  try {
    const url = new URL(redirectUri);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      warnings.push("Google OAuth redirect URI should use HTTPS outside local development.");
    }
    if (
      requestHost &&
      url.host !== requestHost &&
      !process.env.API_PUBLIC_ORIGIN &&
      !process.env.GOOGLE_OAUTH_REDIRECT_URI
    ) {
      warnings.push(
        "Redirect URI host differs from request host. Set API_PUBLIC_ORIGIN if this is intentional.",
      );
    }
  } catch (err) {
    warnings.push("Redirect URI could not be parsed.");
  }

  return warnings;
}

router.post(
  "/auth/signup",
  loginLimiter,
  validate(schemas.signup),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const { rows } = await pool.query(
        `INSERT INTO workspaces (name, email, password_hash, auth_provider)
         VALUES ($1, $2, $3, 'password')
         RETURNING id, name, email, avatar_url, auth_provider`,
        [name, normalizedEmail, passwordHash],
      );

      res.status(201).json(await issueSession(rows[0], req));
    } catch (err) {
      if (err.code === "23505") {
        throw new ConflictError("A workspace already exists for this email");
      }
      throw err;
    }
  }),
);

router.post(
  "/auth/login",
  loginLimiter,
  validate(schemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { rows } = await pool.query(`SELECT * FROM workspaces WHERE email = $1`, [
      email.toLowerCase(),
    ]);
    const workspace = rows[0];

    if (!workspace || !workspace.password_hash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, workspace.password_hash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    res.json(await issueSession(workspace, req));
  }),
);

router.post(
  "/auth/refresh",
  validate(schemas.refreshToken),
  asyncHandler(async (req, res) => {
    const hash = tokenHash(req.body.refreshToken);
    const { rows } = await pool.query(
      `SELECT rt.id AS refresh_id, w.*
       FROM refresh_tokens rt
       JOIN workspaces w ON w.id = rt.workspace_id
       WHERE rt.token_hash = $1
         AND rt.revoked_at IS NULL
         AND rt.expires_at > now()`,
      [hash],
    );

    const workspace = rows[0];
    if (!workspace) throw new UnauthorizedError("Invalid or expired refresh token");

    await pool.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`, [
      workspace.refresh_id,
    ]);

    res.json(await issueSession(workspace, req));
  }),
);

router.post(
  "/auth/logout",
  validate(schemas.logout),
  asyncHandler(async (req, res) => {
    if (req.body.refreshToken) {
      await pool.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [
        tokenHash(req.body.refreshToken),
      ]);
    }
    res.status(204).send();
  }),
);

router.get(
  "/auth/oauth/google/debug",
  asyncHandler(async (req, res) => {
    const { clientId } = requireOAuthConfig();
    const redirectUri = getOAuthRedirectUri(req);
    const frontendOrigin = getOAuthFrontendOrigin(req);

    res.json({
      configured: true,
      clientId,
      redirectUri,
      frontendOrigin,
      apiPublicOrigin: getApiPublicOrigin(req),
      requestOrigin: getRequestOrigin(req),
      requestProtocol: req.protocol,
      requestHost: req.get("host"),
      warnings: getOAuthRedirectWarnings(req, redirectUri),
      callbackUrlMustBeAuthorizedInGoogleCloud: redirectUri,
    });
  }),
);

router.get(
  "/auth/oauth/google",
  oauthLimiter,
  asyncHandler(async (req, res) => {
    const { clientId } = requireOAuthConfig();
    const redirectUri = getOAuthRedirectUri(req);
    const frontendOrigin = getOAuthFrontendOrigin(req);
    const redirectPath = typeof req.query.redirect === "string" ? req.query.redirect : "/dashboard";
    const state = jwt.sign(
      {
        nonce: crypto.randomBytes(16).toString("hex"),
        redirectPath: redirectPath.startsWith("/") ? redirectPath : "/dashboard",
        frontendOrigin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");

    res.json({ url: url.toString() });
  }),
);

router.get(
  "/auth/oauth/google/callback",
  oauthLimiter,
  asyncHandler(async (req, res) => {
    const { clientId, clientSecret } = requireOAuthConfig();
    const redirectUri = getOAuthRedirectUri(req);
    const { code, state } = req.query;
    if (typeof code !== "string" || typeof state !== "string") {
      throw new AppError("Missing OAuth callback parameters", 400, "OAUTH_CALLBACK_INVALID");
    }

    let parsedState;
    try {
      parsedState = jwt.verify(state, process.env.JWT_SECRET);
    } catch (err) {
      throw new UnauthorizedError("Invalid OAuth state");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const details = await tokenResponse.json().catch(() => ({}));
      throw new AppError(
        "Google OAuth token exchange failed",
        502,
        "GOOGLE_OAUTH_TOKEN_EXCHANGE_FAILED",
        {
          status: tokenResponse.status,
          error: details.error,
          errorDescription: details.error_description,
        },
      );
    }

    const googleTokens = await tokenResponse.json();
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${googleTokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new AppError(
        "Google OAuth profile lookup failed",
        502,
        "GOOGLE_OAUTH_PROFILE_LOOKUP_FAILED",
        {
          status: profileResponse.status,
        },
      );
    }

    const profile = await profileResponse.json();
    if (!profile.email || profile.email_verified === false) {
      throw new UnauthorizedError("Google account email is not verified");
    }

    const email = profile.email.toLowerCase();
    const { rows } = await pool.query(
      `INSERT INTO workspaces (name, email, auth_provider, oauth_provider, oauth_subject, avatar_url)
       VALUES ($1, $2, 'google', 'google', $3, $4)
       ON CONFLICT (email) DO UPDATE SET
         oauth_provider = COALESCE(workspaces.oauth_provider, 'google'),
         oauth_subject = COALESCE(workspaces.oauth_subject, EXCLUDED.oauth_subject),
         avatar_url = EXCLUDED.avatar_url,
         updated_at = now()
       RETURNING id, name, email, avatar_url, auth_provider`,
      [profile.name || email.split("@")[0], email, profile.sub, profile.picture || null],
    );

    const session = await issueSession(rows[0], req);
    const fragment = new URLSearchParams({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      workspace: JSON.stringify(session.workspace),
      redirect: parsedState.redirectPath || "/dashboard",
    });

    const frontendOrigin = parsedState.frontendOrigin || getFallbackFrontendOrigin();
    if (!frontendOrigin || !isAllowedOrigin(frontendOrigin)) {
      throw new AppError(
        "OAuth frontend origin is no longer allowed",
        400,
        "OAUTH_FRONTEND_ORIGIN_INVALID",
      );
    }

    res.redirect(`${frontendOrigin}/login#${fragment.toString()}`);
  }),
);

router.get(
  "/workspace/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, name, email, avatar_url, auth_provider, whatsapp_phone, whatsapp_webhook_url,
              auto_reply, notify_new_leads, flag_leaks, created_at
       FROM workspaces WHERE id = $1`,
      [req.workspaceId],
    );
    res.json(rows[0]);
  }),
);

export default router;
