/**
 * Read-only check to run BEFORE applying the `integrity_constraints` migration
 * (unique email on Responses, unique year + program on Total).
 *
 *   npm run db:check-duplicates
 *
 * It changes nothing. Exit code 1 means duplicates exist: resolve them first
 * (the MIS office decides which response to keep; for totals keep the row with
 * the highest `totalGraduates`), then run the migration.
 *
 * It prints counts and ids only, never names or email addresses.
 */
import "dotenv/config";
import prisma from "../lib/prisma.js";

const run = async (): Promise<number> => {
  const duplicateEmails = await prisma.$queryRaw<{ n: bigint; ids: number[] }[]>`
    SELECT count(*) AS n, array_agg(id ORDER BY id) AS ids
    FROM "Responses"
    WHERE email IS NOT NULL
    GROUP BY lower(trim(email))
    HAVING count(*) > 1`;

  const duplicateTotals = await prisma.$queryRaw<
    { yearOfGraduation: number | null; program: string | null; n: bigint; ids: number[] }[]
  >`
    SELECT "yearOfGraduation", program, count(*) AS n, array_agg(id ORDER BY id) AS ids
    FROM "Total"
    GROUP BY "yearOfGraduation", program
    HAVING count(*) > 1`;

  const [{ n: unnormalized }] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM "Responses" WHERE email IS NOT NULL AND email <> lower(trim(email))`;

  console.log(`Responses whose email is not lower-cased/trimmed: ${unnormalized} (the migration fixes these)`);
  console.log(`Email addresses used by more than one response: ${duplicateEmails.length}`);
  for (const row of duplicateEmails) console.log(`  response ids ${row.ids.join(", ")}`);
  console.log(`Year + program pairs with more than one total: ${duplicateTotals.length}`);
  for (const row of duplicateTotals) {
    console.log(`  ${row.yearOfGraduation ?? "?"} ${row.program ?? "?"}: total ids ${row.ids.join(", ")}`);
  }

  return duplicateEmails.length + duplicateTotals.length > 0 ? 1 : 0;
};

run()
  .then((code) => {
    if (code === 0) console.log("No duplicates. The migration is safe to apply.");
    else console.log("Resolve the duplicates above before applying the migration.");
    return prisma.$disconnect().then(() => process.exit(code));
  })
  .catch((error: unknown) => {
    console.error("check-duplicates:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
