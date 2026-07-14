#!/usr/bin/env node
// Backfill: encrypt existing plaintext BYO model keys in setup_submissions.
//
// Item 2 of the security hardening pass. The app writes new keys encrypted once BYO_ENC_KEY
// is set (lib/crypto/byo.ts -> encryptForStorage). This one-shot script encrypts the rows
// that were written BEFORE the env var existed, so no plaintext key survives at rest.
//
// The envelope is intentionally identical to lib/crypto/byo.ts:
//   "v1:<iv-b64>:<authTag-b64>:<ciphertext-b64>", AES-256-GCM, key = SHA-256(BYO_ENC_KEY).
// Keep the two in sync if either changes.
//
// Idempotent: a value already starting with "v1:" is left untouched, so re-running is safe.
// It never NULLs a column it couldn't encrypt, so a failure can't lose a student's key.
//
// Usage (run once, after BYO_ENC_KEY is set in the environment):
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... BYO_ENC_KEY=... \
//     node scripts/backfill-byo-encryption.mjs [--dry-run]

import { createClient } from "@supabase/supabase-js";
import { createCipheriv, randomBytes, createHash } from "node:crypto";

const PREFIX = "v1:";
const DRY_RUN = process.argv.includes("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encKeyRaw = process.env.BYO_ENC_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!encKeyRaw) {
  console.error("Missing BYO_ENC_KEY — nothing to encrypt with. Set it and re-run.");
  process.exit(1);
}

const encKey = createHash("sha256").update(encKeyRaw, "utf8").digest();

function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(PREFIX);
}

function encryptSecret(plaintext) {
  const s = (plaintext ?? "").trim();
  if (!s) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey, iv);
  const ct = Buffer.concat([cipher.update(s, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: rows, error } = await db
  .from("setup_submissions")
  .select("id, anthropic_key, openai_key");
if (error) {
  console.error("Failed to read setup_submissions:", error.message);
  process.exit(1);
}

let scanned = 0;
let updated = 0;
let alreadyEncrypted = 0;

for (const row of rows ?? []) {
  scanned++;
  const patch = {};

  for (const col of ["anthropic_key", "openai_key"]) {
    const val = row[col];
    if (val == null || val === "") continue;
    if (isEncrypted(val)) {
      alreadyEncrypted++;
      continue;
    }
    patch[col] = encryptSecret(val);
  }

  if (Object.keys(patch).length === 0) continue;

  if (DRY_RUN) {
    console.log(`[dry-run] would encrypt row ${row.id}: ${Object.keys(patch).join(", ")}`);
    updated++;
    continue;
  }

  const { error: upErr } = await db.from("setup_submissions").update(patch).eq("id", row.id);
  if (upErr) {
    // Never NULL or drop the key on failure — leave the plaintext in place and report it.
    console.error(`  ! row ${row.id}: update failed (${upErr.message}) — left as-is`);
    continue;
  }
  updated++;
  console.log(`  ✓ row ${row.id}: encrypted ${Object.keys(patch).join(", ")}`);
}

console.log(
  `\nDone. scanned=${scanned} updated=${updated} already-encrypted-fields=${alreadyEncrypted}${
    DRY_RUN ? " (dry run — no writes)" : ""
  }`
);
