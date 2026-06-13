/**
 * Seed users from CSV export into Supabase Auth + profiles table.
 * Run: node scripts/seed-users.mjs
 *
 * Requirements: .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ── Load env vars from .env.local ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const envPath = join(__dir, "../.env.local");

const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── User data from CSV ────────────────────────────────────────────────────────
// Temporary password — users should reset via "Forgot Password" on first login.
const TEMP_PASSWORD = "Move37@2026!";

const USERS = [
  { email: "ranjit@deviceint.com",  first_name: "Ranjit B",      last_name: "",          type: "admin",    country: "Brunei",    picture: null },
  { email: "douglas@move37.fun",     first_name: "Douglas",       last_name: "Gouveia",   type: "manager",  country: "Brazil",    picture: "https://8d6d318cb1c67bc0b84ee11b83349e08.cdn.bubble.io/f1756438439474x634837500110274400/1724603304101.jpeg" },
  { email: "ranjit@move37.fun",      first_name: "Ranjit",        last_name: "Bhinge",    type: "admin",    country: "Brunei",    picture: "https://8d6d318cb1c67bc0b84ee11b83349e08.cdn.bubble.io/f1756471667959x387678722100177400/ranjit.jpeg" },
  { email: "richard_dev@gmail.com",  first_name: "Richard",       last_name: "Developer", type: "developer",country: "Cameroon",  picture: null },
  { email: "sarah_client@gmail.com", first_name: "Sarah",         last_name: "Client",    type: "client",   country: "Australia", picture: null },
  { email: "marcos_qa@gmail.com",    first_name: "Marcos",        last_name: "QA",        type: "qa",       country: "Brunei",    picture: null },
  { email: "mike_dev@gmail.com",     first_name: "Mike",          last_name: "Dev",       type: "developer",country: "Brunei",    picture: null },
  { email: "jessica_client@gmail.com",first_name: "Jessica",      last_name: "Client",    type: "client",   country: "Cameroon",  picture: null },
  { email: "fred_qa@gmail.com",      first_name: "Fred",          last_name: "QA",        type: "qa",       country: "Burundi",   picture: null },
  { email: "jhonniedoe@gmail.com",   first_name: "Jhonnie",       last_name: "Doe",       type: "lead",     country: "Australia", picture: null },
  { email: "test-123@gmail.com",     first_name: "Test",          last_name: "123",       type: "client",   country: "Australia", picture: null },
  { email: "client-64@gmail.com",    first_name: "Client",        last_name: "64",        type: "lead",     country: "Argentina", picture: null },
  { email: "client-1034@gmail.com",  first_name: "Client 1034",   last_name: "Test",      type: "lead",     country: "Algeria",   picture: null },
  { email: "client-134@gmail.com",   first_name: "Client",        last_name: "134",       type: "lead",     country: "Brazil",    picture: null },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nSeeding ${USERS.length} users into Supabase...\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of USERS) {
    process.stdout.write(`  ${user.email.padEnd(40)} `);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: TEMP_PASSWORD,
      email_confirm: true,  // skip email verification
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });

    if (authError) {
      if (authError.message?.includes("already been registered") || authError.code === "email_exists") {
        console.log("⏭  already exists");
        skipped++;

        // Still try to update the profile in case it's missing data
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const existing = existingUser?.users?.find((u) => u.email === user.email);
        if (existing) {
          await supabase.from("profiles").upsert({
            id: existing.id,
            first_name: user.first_name || null,
            last_name: user.last_name || null,
            type: user.type,
            picture: user.picture ?? null,
          }, { onConflict: "id" });
        }
        continue;
      }
      console.log(`✗  ERROR: ${authError.message}`);
      failed++;
      continue;
    }

    const userId = authData.user.id;

    // 2. Upsert profile (trigger may have already created a row)
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      type: user.type,
      picture: user.picture ?? null,
    }, { onConflict: "id" });

    if (profileError) {
      console.log(`⚠  Auth OK but profile failed: ${profileError.message}`);
    } else {
      console.log(`✓  created (${user.type})`);
    }

    created++;
  }

  console.log(`\n── Summary ──────────────────────────────────`);
  console.log(`  Created : ${created}`);
  console.log(`  Skipped : ${skipped} (already existed, profile updated)`);
  console.log(`  Failed  : ${failed}`);
  console.log(`\nTemporary password for all new users: ${TEMP_PASSWORD}`);
  console.log(`Users should reset their password via the "Forgot Password" flow.\n`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
