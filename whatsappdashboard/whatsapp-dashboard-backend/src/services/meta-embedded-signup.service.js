import { ExternalServiceError, ServiceUnavailableError } from "../utils/errors.js";

function graphVersion() {
  return process.env.META_GRAPH_API_VERSION || process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
}

function graphBaseUrl() {
  return `https://graph.facebook.com/${graphVersion()}`;
}

function getPublicConfig() {
  return {
    appId: process.env.META_APP_ID || process.env.WHATSAPP_APP_ID || null,
    configId: process.env.META_EMBEDDED_SIGNUP_CONFIG_ID || null,
    graphApiVersion: graphVersion(),
    solutionId: process.env.META_PARTNER_SOLUTION_ID || null,
    sessionInfoVersion: process.env.META_EMBEDDED_SIGNUP_SESSION_VERSION || "3",
    enabled: Boolean(
      (process.env.META_APP_ID || process.env.WHATSAPP_APP_ID) &&
      process.env.META_EMBEDDED_SIGNUP_CONFIG_ID,
    ),
  };
}

function requireExchangeConfig() {
  const appId = process.env.META_APP_ID || process.env.WHATSAPP_APP_ID;
  const appSecret = process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET;

  if (!appId || !appSecret) {
    throw new ServiceUnavailableError(
      "Meta Embedded Signup is not configured",
      "META_EMBEDDED_SIGNUP_NOT_CONFIGURED",
    );
  }

  return { appId, appSecret };
}

function authorizationHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function graphRequest(path, { accessToken, method = "GET", searchParams } = {}) {
  const url = new URL(`${graphBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method,
    headers: authorizationHeaders(accessToken),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ExternalServiceError("Meta Graph API request failed", "META_GRAPH_REQUEST_FAILED", {
      status: response.status,
      path,
      error: body.error?.code || body.error?.type,
      message: body.error?.message,
    });
  }

  return body;
}

async function exchangeCodeForToken(code) {
  const { appId, appSecret } = requireExchangeConfig();
  const url = new URL(`${graphBaseUrl()}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("code", code);

  const response = await fetch(url, { method: "GET" });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.access_token) {
    throw new ExternalServiceError(
      "Meta authorization code exchange failed",
      "META_CODE_EXCHANGE_FAILED",
      {
        status: response.status,
        error: body.error?.code || body.error?.type,
        message: body.error?.message,
      },
    );
  }

  return {
    accessToken: body.access_token,
    tokenType: body.token_type || null,
    expiresIn: body.expires_in || null,
  };
}

async function fetchWabaInfo(accessToken, wabaId) {
  return graphRequest(`/${wabaId}`, {
    accessToken,
    searchParams: {
      fields: "id,name,currency,timezone_id,account_review_status,message_template_namespace",
    },
  });
}

async function fetchPhoneNumbers(accessToken, wabaId) {
  return graphRequest(`/${wabaId}/phone_numbers`, {
    accessToken,
    searchParams: {
      fields: "id,display_phone_number,verified_name,code_verification_status,quality_rating",
    },
  });
}

async function subscribeAppToWaba(accessToken, wabaId) {
  return graphRequest(`/${wabaId}/subscribed_apps`, {
    accessToken,
    method: "POST",
  });
}

async function sendTextMessage(accessToken, phoneNumberId, { to, text, previewUrl = false }) {
  const response = await fetch(`${graphBaseUrl()}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      ...authorizationHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: previewUrl,
        body: text,
      },
    }),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.messages?.[0]?.id) {
    throw new ExternalServiceError("WhatsApp message send failed", "WHATSAPP_SEND_FAILED", {
      status: response.status,
      error: body.error?.code || body.error?.type,
      message: body.error?.message,
    });
  }

  return body;
}

export {
  exchangeCodeForToken,
  fetchPhoneNumbers,
  fetchWabaInfo,
  getPublicConfig,
  graphVersion,
  sendTextMessage,
  subscribeAppToWaba,
};
