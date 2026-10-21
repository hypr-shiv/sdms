/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCHOLARPULSE API CLIENT CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ SECURITY POLICY: ZERO SECRETS ON FRONTEND
 * All API keys, secrets, database credentials, and cryptographic signing keys
 * reside strictly on the backend (sdms-backend/.env).
 * The frontend communicates with the backend exclusively via public HTTP/REST
 * and server-sent events using the user's ephemeral session bearer token.
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

/**
 * Build a full API URL given a route path
 * @example apiUrl('/auth/login') -> 'http://localhost:3001/auth/login'
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Standard authenticated headers using client localStorage token
 */
export function authHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("accessToken")
      : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}
