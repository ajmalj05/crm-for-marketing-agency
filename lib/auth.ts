import { cookies } from "next/headers";

const SESSION_COOKIE = "arm_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getEnvCredentials(): { username: string; password: string } | null {
  const username = process.env.LOGIN_USERNAME;
  const password = process.env.LOGIN_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}

export function verifyCredentials(username: string, password: string): boolean {
  const creds = getEnvCredentials();
  if (!creds) return false;
  return creds.username === username && creds.password === password;
}

export async function setSession(): Promise<void> {
  const secret = process.env.SESSION_SECRET || "arm-default-secret-change-in-production";
  const cookieStore = await cookies();
  const value = Buffer.from(JSON.stringify({ ok: true, at: Date.now() })).toString("base64");
  const signature = await sign(value, secret);
  cookieStore.set(SESSION_COOKIE, `${value}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

async function sign(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret.slice(0, 32).padEnd(32, "0")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value)
  );
  return Buffer.from(sig).toString("base64url");
}

async function verify(value: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(value, secret);
  return expected === signature;
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return false;
  const [value, signature] = raw.split(".");
  if (!value || !signature) return false;
  const secret = process.env.SESSION_SECRET || "arm-default-secret-change-in-production";
  if (!(await verify(value, signature, secret))) return false;
  try {
    const payload = JSON.parse(Buffer.from(value, "base64").toString());
    if (payload?.ok && payload?.at && Date.now() - payload.at < SESSION_MAX_AGE * 1000) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
