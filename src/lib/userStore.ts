// ─── In-Memory User Store ───
// This is a development-only store. Replace with a real database in production.

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  userId: string; // e.g. STU-2026-001
  role: "student" | "teacher" | "admin";
  passwordHash: string;
  createdAt: Date;
}

// In-memory store (resets on server restart)
const users = new Map<string, StoredUser>();

// Index by email for fast lookups
const emailIndex = new Map<string, string>();

// Index by userId for fast lookups
const userIdIndex = new Map<string, string>();

export function createUser(user: StoredUser): void {
  users.set(user.id, user);
  emailIndex.set(user.email.toLowerCase(), user.id);
  userIdIndex.set(user.userId.toLowerCase(), user.id);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const id = emailIndex.get(email.toLowerCase());
  return id ? users.get(id) : undefined;
}

export function findUserByUserId(userId: string): StoredUser | undefined {
  const id = userIdIndex.get(userId.toLowerCase());
  return id ? users.get(id) : undefined;
}

export function findUserById(id: string): StoredUser | undefined {
  return users.get(id);
}

export function emailExists(email: string): boolean {
  return emailIndex.has(email.toLowerCase());
}

export function userIdExists(userId: string): boolean {
  return userIdIndex.has(userId.toLowerCase());
}

// Generate a unique ID
export function generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
