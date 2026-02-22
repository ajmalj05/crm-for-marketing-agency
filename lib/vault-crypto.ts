import crypto from "crypto";

const ALGO = "aes-256-gcm";
const SALT = "growith-vault-iv";

function getKey(): Buffer {
  const secret = process.env.VAULT_SECRET || process.env.SESSION_SECRET || "dev-vault-secret";
  return crypto.scryptSync(secret, SALT, 32);
}

export function encryptPassword(plain: string): string | null {
  if (!plain) return null;
  try {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    let enc = cipher.update(plain, "utf8", "base64");
    enc += cipher.final("base64");
    const authTag = cipher.getAuthTag();
    return [iv.toString("base64"), authTag.toString("base64"), enc].join(":");
  } catch {
    return null;
  }
}

export function decryptPassword(encrypted: string): string | null {
  if (!encrypted) return null;
  try {
    const parts = encrypted.split(":");
    if (parts.length !== 3) return null;
    const [ivB64, authTagB64, enc] = parts;
    const key = getKey();
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    let dec = decipher.update(enc, "base64", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch {
    return null;
  }
}
