// const crypto = require("crypto");
import crypto from "crypto";

// AES-256-GCM. ENCRYPTION_KEY must be a 32-byte value (base64 or hex), set via env.
// Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || "", "hex");

function encrypt(plaintext) {
  if (!KEY.length) throw new Error("ENCRYPTION_KEY is not set");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

function decrypt(payload) {
  if (!KEY.length) throw new Error("ENCRYPTION_KEY is not set");
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export { encrypt, decrypt };
