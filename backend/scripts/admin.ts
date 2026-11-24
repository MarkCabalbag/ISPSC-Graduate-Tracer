/**
 * Admin account CLI. Run from the backend folder:
 *
 *   npm run admin:list
 *   npm run admin:create -- --username mis.jane --password "a-strong-password" --name "Jane Cruz"
 *   npm run admin:create -- --username mis.jane --hash '$2b$12$...'        (plain password never in argv)
 *   npm run admin:reset  -- --username mis.jane --password "a-new-password"   (also ends their open sessions)
 *   npm run admin:signout-all -- --username mis.jane                        (ends their open sessions)
 *   npm run admin:delete -- --username mis.jane
 *
 * A password typed on the command line is visible in your shell history; prefer
 * `--hash` (a bcrypt hash made with
 *   node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"
 * ) on a shared machine. Admins live in the `Admin` table; this never touches
 * the environment variables.
 */
import "dotenv/config";
import prisma from "../lib/prisma.js";
import { normalizeUsername, toPasswordHash } from "../lib/adminAccounts.js";

type Flags = Record<string, string | boolean>;

/** Parses `--key value` and `--flag` pairs from argv. */
const parseFlags = (args: string[]): Flags => {
  const flags: Flags = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i += 1;
    }
  }
  return flags;
};

const str = (value: string | boolean | undefined): string | undefined =>
  typeof value === "string" ? value : undefined;

const USAGE =
  "Usage: admin <list|create|reset|signout-all|delete> [--username x] [--password y | --hash $2b$...] [--name \"...\"]";

const hashFrom = (flags: Flags) =>
  toPasswordHash({ password: str(flags.password), hash: str(flags.hash) });

const run = async (): Promise<void> => {
  const [command, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);

  switch (command) {
    case "list": {
      const admins = await prisma.admin.findMany({
        orderBy: { username: "asc" },
        select: { username: true, displayName: true, createdAt: true, lastLoginAt: true },
      });
      if (admins.length === 0) {
        console.log("No admins yet. Create one with: admin create --username ... --password ...");
        return;
      }
      for (const a of admins) {
        const last = a.lastLoginAt ? a.lastLoginAt.toISOString().slice(0, 10) : "never";
        console.log(`${a.username}${a.displayName ? ` (${a.displayName})` : ""} · last sign-in ${last}`);
      }
      return;
    }

    case "create": {
      const username = normalizeUsername(str(flags.username) ?? "");
      const passwordHash = await hashFrom(flags);
      const existing = await prisma.admin.findUnique({ where: { username } });
      if (existing) throw new Error(`An admin named "${username}" already exists. Use "reset" to change its password.`);
      await prisma.admin.create({
        data: { username, passwordHash, displayName: str(flags.name) ?? null },
      });
      console.log(`Created admin "${username}".`);
      return;
    }

    case "reset": {
      const username = normalizeUsername(str(flags.username) ?? "");
      const passwordHash = await hashFrom(flags);
      // Raising sessionVersion also ends every session signed in with the old password.
      const result = await prisma.admin.updateMany({
        where: { username },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      });
      if (result.count === 0) throw new Error(`No admin named "${username}".`);
      console.log(`Reset the password for "${username}" and ended their open sessions.`);
      return;
    }

    case "signout-all": {
      const username = normalizeUsername(str(flags.username) ?? "");
      const result = await prisma.admin.updateMany({
        where: { username },
        data: { sessionVersion: { increment: 1 } },
      });
      if (result.count === 0) throw new Error(`No admin named "${username}".`);
      console.log(`Ended every open session of "${username}". They can sign in again.`);
      return;
    }

    case "delete": {
      const username = normalizeUsername(str(flags.username) ?? "");
      const count = await prisma.admin.count();
      if (count <= 1) throw new Error("Refusing to delete the last admin. Create another first.");
      const result = await prisma.admin.deleteMany({ where: { username } });
      if (result.count === 0) throw new Error(`No admin named "${username}".`);
      console.log(`Deleted admin "${username}".`);
      return;
    }

    default:
      console.log(USAGE);
      process.exitCode = command ? 1 : 0;
  }
};

run()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error: unknown) => {
    console.error("admin:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
