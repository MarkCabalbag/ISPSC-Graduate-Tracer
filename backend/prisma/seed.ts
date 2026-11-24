/**
 * Seeds the first admin from the environment, once.
 *
 * Reads `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (a bcrypt hash) and creates
 * that admin in the `Admin` table if no admin with that username exists yet. It
 * never overwrites an existing account, so running it again is safe and never
 * undoes a password changed with the admin CLI.
 *
 * Run it with `npm run seed` (from the backend folder) after the migration has
 * been applied. `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` are needed only here;
 * the running server does not read them.
 */
import "dotenv/config";
import prisma from "../lib/prisma.js";
import { isBcryptHash, normalizeUsername } from "../lib/adminAccounts.js";

const main = async (): Promise<void> => {
  const rawUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!rawUsername || !passwordHash) {
    throw new Error(
      "Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH before seeding the first admin.",
    );
  }
  if (!isBcryptHash(passwordHash)) {
    throw new Error(
      "ADMIN_PASSWORD_HASH must be a bcrypt hash, not a plain password. " +
        'Create one with: node -e "console.log(require(\'bcryptjs\').hashSync(\'your-password\', 12))"',
    );
  }

  const username = normalizeUsername(rawUsername);
  const existing = await prisma.admin.findUnique({ where: { username } });

  if (existing) {
    console.log(`[seed] Admin "${username}" already exists. Nothing to do.`);
    return;
  }

  await prisma.admin.create({ data: { username, passwordHash } });
  console.log(`[seed] Created the first admin: "${username}".`);
};

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(
      "[seed] Failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  });
