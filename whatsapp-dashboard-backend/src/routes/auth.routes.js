const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const schemas = require("../validators/schemas");
const { AppError, ConflictError, UnauthorizedError } = require("../utils/errors");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Too many login attempts. Try again later." },
});

const oauthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Too many OAuth attempts. Try again later." },
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
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const frontendOrigin = process.env.FRONTEND_ORIGIN;

  if (!clientId || !clientSecret || !redirectUri || !frontendOrigin) {
    throw new AppError("Google OAuth is not configured", 503, "OAUTH_NOT_CONFIGURED");
  }

  return { clientId, clientSecret, redirectUri, frontendOrigin };
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
  "/auth/oauth/google",
  oauthLimiter,
  asyncHandler(async (req, res) => {
    const { clientId, redirectUri } = requireOAuthConfig();
    const redirectPath = typeof req.query.redirect === "string" ? req.query.redirect : "/dashboard";
    const state = jwt.sign(
      {
        nonce: crypto.randomBytes(16).toString("hex"),
        redirectPath: redirectPath.startsWith("/") ? redirectPath : "/dashboard",
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
    const { clientId, clientSecret, redirectUri, frontendOrigin } = requireOAuthConfig();
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
      throw new UnauthorizedError("Google OAuth token exchange failed");
    }

    const googleTokens = await tokenResponse.json();
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${googleTokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedError("Google OAuth profile lookup failed");
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

module.exports = router;
