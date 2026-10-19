/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCHOLARPULSE CLIENT AUTHENTICATION UTILITIES
 * ⚠️ SECURITY POLICY: ZERO API KEYS / SECRETS ON FRONTEND
 * All password hashing, JWT signing, and signature verification are executed
 * strictly on the backend (sdms-backend). The client only handles form
 * validation and safe payload inspection.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Email Validation ───
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

// ─── Password Requirements Check ───
export interface PasswordCheck {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordCheck {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Must be at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Must contain a lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Must contain a number");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    errors.push("Must contain a special character");

  return { isValid: errors.length === 0, errors };
}

// ─── Client-Side Safe JWT Payload Parser (No Secrets Needed) ───
export interface TokenPayload {
  id?: string;
  sub?: string;
  email?: string;
  role?: string;
  userId?: string;
  studentId?: string;
  name?: string;
  exp?: number;
  iat?: number;
}

/**
 * Safely parses the claims payload of a JWT for client display without
 * requiring the server's private JWT_SECRET. Cryptographic signature verification
 * is performed exclusively by the backend on every API request.
 */
export function parseTokenPayload(token: string): TokenPayload | null {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64URL to Base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload =
      typeof window !== "undefined"
        ? decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          )
        : Buffer.from(base64, "base64").toString("utf8");

    return JSON.parse(jsonPayload) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if the stored JWT is expired based on its client exp timestamp
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseTokenPayload(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Get active session token from browser storage
 */
export function getClientAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  );
}
