import { io, Socket } from "socket.io-client";

// In the browser we call the app's own origin (/api/v1) so requests flow through
// the TanStack Start proxy middleware (see src/start.ts), which forwards them to
// the Express backend. This avoids hardcoding an unreachable localhost:4000 in
// preview/production. Override with VITE_API_URL if you want to call the backend
// directly (e.g. an absolute cross-origin URL).
export const API_BASE_URL =
  typeof window !== "undefined"
    ? import.meta.env.VITE_API_URL || "/api/v1"
    : import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export const SOCKET_BASE_URL =
  typeof window !== "undefined"
    ? import.meta.env.VITE_SOCKET_URL || "http://localhost:4000"
    : "http://localhost:4000";

let socket: Socket | null = null;

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("workspace_access_token") || localStorage.getItem("workspace_token");
  },
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("workspace_refresh_token");
  },
  setToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("workspace_access_token", token);
    localStorage.setItem("workspace_token", token);
  },
  setRefreshToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("workspace_refresh_token", token);
  },
  setSession(session: { accessToken?: string; token?: string; refreshToken?: string; workspace?: any }) {
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
  isAuthenticated(): boolean {
    return !!(this.getToken() || this.getRefreshToken());
  },
  getWorkspace() {
    if (typeof window === "undefined") return null;
    const ws = localStorage.getItem("workspace_profile");
    return ws ? JSON.parse(ws) : null;
  },
  setWorkspace(profile: any) {
    if (typeof window === "undefined") return;
    localStorage.setItem("workspace_profile", JSON.stringify(profile));
  },
  async refreshSession(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
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
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    this.removeToken();
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<Response> {
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
    headers,
  });
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit & { skipAuthRefresh?: boolean } = {},
): Promise<T> {
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
    return {} as T;
  }

  return response.json();
}

export async function startGoogleOAuth(redirect = "/dashboard") {
  const response = await apiFetch<{ url: string }>(
    `/auth/oauth/google?redirect=${encodeURIComponent(redirect)}`,
    { skipAuthRefresh: true },
  );
  window.location.href = response.url;
}

export function getSocket(): Socket {
  const token = auth.getToken();
  if (!token) {
    throw new Error("Cannot initialize socket without authentication token");
  }

  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
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
