import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function adminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return password;
}

// Deterministic token derivable only by someone who knows ADMIN_PASSWORD -
// no session store needed, and it can be recomputed to verify the cookie.
function sessionToken(): string {
  return crypto.createHmac("sha256", adminPassword()).update("admin-session").digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(candidate: string): boolean {
  return timingSafeStringEqual(candidate, adminPassword());
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdminSessionValid(): Promise<boolean> {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  return timingSafeStringEqual(cookie, sessionToken());
}

// Call at the top of every admin server action - a form's action endpoint is
// directly invocable over HTTP, so the layout's redirect alone isn't enough.
export async function assertAdminSession(): Promise<void> {
  if (!(await isAdminSessionValid())) {
    throw new Error("Not authenticated");
  }
}
