import { l as lookup } from "../_libs/socket.io-client.mjs";
const API_BASE_URL = typeof window !== "undefined" ? `${window.location.origin}/api/v1` : `${process.env.BACKEND_URL ?? "http://localhost:4000"}/api/v1`;
const SOCKET_BASE_URL = typeof window !== "undefined" ? "http://localhost:4000" : "http://localhost:4000";
let socket = null;
const auth = {
  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("workspace_access_token") || localStorage.getItem("workspace_token");
  },
  getRefreshToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("workspace_refresh_token");
  },
  setToken(token) {
    if (typeof window === "undefined") return;
    localStorage.setItem("workspace_access_token", token);
    localStorage.setItem("workspace_token", token);
  },
  setRefreshToken(token) {
    if (typeof window === "undefined") return;
    localStorage.setItem("workspace_refresh_token", token);
  },
  setSession(session) {
    const accessToken = session.accessToken || session.token;
    if (accessToken) this.setToken(accessToken);
    if (session.refreshToken) this.setRefreshToken(session.refreshToken);
    if (session.workspace) this.setWorkspace(session.workspace);
  },
  removeToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("workspace_access_token");
    localStorage.removeItem("workspace_token");
    localStorage.removeItem("workspace_refresh_token");
    localStorage.removeItem("workspace_profile");
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  isAuthenticated() {
    return !!(this.getToken() || this.getRefreshToken());
  },
  getWorkspace() {
    if (typeof window === "undefined") return null;
    const ws = localStorage.getItem("workspace_profile");
    return ws ? JSON.parse(ws) : null;
  },
  setWorkspace(profile) {
    if (typeof window === "undefined") return;
    localStorage.setItem("workspace_profile", JSON.stringify(profile));
  },
  async refreshSession() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) {
      this.removeToken();
      return false;
    }
    this.setSession(await response.json());
    return true;
  },
  async logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      }).catch(() => void 0);
    }
    this.removeToken();
  }
};
async function request(endpoint, options = {}) {
  const token = auth.getToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
}
async function apiFetch(endpoint, options = {}) {
  let response = await request(endpoint, options);
  if (response.status === 401 && !options.skipAuthRefresh && auth.getRefreshToken()) {
    const refreshed = await auth.refreshSession();
    if (refreshed) {
      response = await request(endpoint, options);
    }
  }
  if (!response.ok) {
    if (response.status === 401) {
      auth.removeToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return {};
  }
  return response.json();
}
async function startGoogleOAuth(redirect = "/dashboard") {
  const response = await apiFetch(
    `/auth/oauth/google?redirect=${encodeURIComponent(redirect)}`,
    { skipAuthRefresh: true }
  );
  window.location.href = response.url;
}
function getSocket() {
  const token = auth.getToken();
  if (!token) {
    throw new Error("Cannot initialize socket without authentication token");
  }
  if (!socket) {
    socket = lookup(SOCKET_BASE_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      transports: ["websocket", "polling"]
    });
    socket.on("connect", () => {
      console.log("Realtime socket connected successfully");
    });
    socket.on("disconnect", (reason) => {
      console.warn("Realtime socket disconnected:", reason);
    });
  }
  return socket;
}
export {
  apiFetch as a,
  auth as b,
  getSocket as g,
  startGoogleOAuth as s
};
