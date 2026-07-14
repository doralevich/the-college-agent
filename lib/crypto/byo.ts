import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// Encryption at rest for student-supplied (BYO) model API keys — setup_submissions
// .anthropic_key / .openai_key. AES-256-GCM with a key derived from the BYO_ENC_KEY env
// var (set in Vercel; never in the repo or the database). Keeping the key out of Postgres
// means a database dump alone can't reveal the plaintext.
//
// Stored format (a single text column): "v1:<iv-b64>:<authTag-b64>:<ciphertext-b64>".
// The "v1:" prefix lets isEncrypted() distinguish new ciphertext from any legacy plaintext
// during the migration window, so reads can transparently handle both.

const PREFIX = "v1:";

function key(): Buffer {
  const raw = process.env.BYO_ENC_KEY;
  if (!raw) throw new Error("BYO_ENC_KEY is not set");
  // Accept any-length secret; derive a stable 32-byte key via SHA-256.
  return createHash("sha256").update(raw, "utf8").digest();
}

export function byoEncConfigured(): boolean {
  return !!process.env.BYO_ENC_KEY;
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

// Encrypt a plaintext secret. Returns the "v1:..." envelope. Empty/undefined passes through
// as null (nothing to store).
export function encryptSecret(plaintext: string | null | undefined): string | null {
  const s = (plaintext ?? "").trim();
  if (!s) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(s, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

// Migration-safe write path: encrypt when BYO_ENC_KEY is configured, otherwise store
// plaintext with a warning. Lets the code ship BEFORE David adds the env var (writes stay
// plaintext, exactly as today); once the var is set, every new write is encrypted and the
// existing plaintext is backfilled by scripts/backfill-byo-encryption.mjs.
export function encryptForStorage(plaintext: string | null | undefined): string | null {
  const s = (plaintext ?? "").trim();
  if (!s) return null;
  if (!byoEncConfigured()) {
    console.warn("[byo] BYO_ENC_KEY not set — storing model key as plaintext; set the env var and run the backfill to encrypt.");
    return s;
  }
  return encryptSecret(s);
}

// Decrypt a stored value. Transparently returns legacy plaintext (no "v1:" prefix)
// unchanged, so reads work before and after the backfill. Returns null for empty input;
// throws only on a corrupt/undecryptable envelope.
export function decryptSecret(stored: string | null | undefined): string | null {
  if (stored == null || stored === "") return null;
  if (!isEncrypted(stored)) return stored; // legacy plaintext during migration window
  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("byo: malformed ciphertext envelope");
  const [ivB64, tagB64, ctB64] = parts;
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]);
  return pt.toString("utf8");
}
