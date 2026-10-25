import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env["DIRECT_URL"];

if (!connectionString) {
  throw new Error("DIRECT_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });

export const db = new PrismaClient({ adapter });