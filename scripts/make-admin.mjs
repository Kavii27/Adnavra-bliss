/**
 * Create (or promote) a platform admin account.
 * Needed every time you stand up a fresh database — there is no admin
 * self-signup, and the login page offers none in admin mode.
 *
 * Usage: npm run make-admin -- you@adnavra.com "a-strong-password" "Founder"
 * (args after -- are forwarded: email, password, optional name)
 *
 * Plain .mjs on purpose: uses only @prisma/client + bcryptjs, both already
 * installed — no extra runner dependency needed.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const [rawEmail, password, name] = process.argv.slice(2);
  if (!rawEmail || !password) {
    console.error('Usage: npm run make-admin -- <email> "<password>" [name]');
    process.exit(1);
  }
  // Login (lib/auth.ts) lowercases the submitted email before lookup —
  // store it lowercase here too, or sign-in won't match a mixed-case address.
  const email = rawEmail.toLowerCase().trim();
  const db = new PrismaClient();
  try {
    const hashed = await bcrypt.hash(password, 12);
    await db.user.upsert({
      where: { email },
      update: { role: "ADMIN", password: hashed },
      create: { email, password: hashed, name: name ?? "Admin", role: "ADMIN" },
    });
    console.log(`Admin account ready: ${email}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("[make-admin] failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
