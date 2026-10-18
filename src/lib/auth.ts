import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ─── Constants ───
const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret";
const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_SHORT = "1d";
const REFRESH_TOKEN_LONG = "7d"; // "Remember Me" expiry

// ─── Email Validation ───
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

// ─── Password Validation ───
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

// ─── Password Hashing ───
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Token Generation ───
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  userId: string;
  name: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(
  payload: TokenPayload,
  rememberMe: boolean = false
): string {
  const expiry = rememberMe ? REFRESH_TOKEN_LONG : REFRESH_TOKEN_SHORT;
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: expiry });
}

// ─── JWT Token Verification ───
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
