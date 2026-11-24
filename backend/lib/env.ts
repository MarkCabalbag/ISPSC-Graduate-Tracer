/**
 * Validated configuration. Every setting the API reads comes from `env`.
 *
 * Failing at startup with a clear message is safer than failing on the first
 * login or database call, or running with a weaker setting than intended
 * (for example a cookie that is not `Secure` because `NODE_ENV` was mistyped).
 * Only variable NAMES and the rule they broke are reported, never their values.
 *
 * `dotenv/config` must be imported before this file (app.ts does).
 */
import { z } from "zod";

const csvOrigins = z
  .string()
  .default("http://localhost:5173")
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin !== ""),
  )
  .pipe(
    z
      .array(
        z
          .string()
          .url()
          .refine((origin) => !origin.endsWith("/"), "must not end with a slash"),
      )
      .min(1),
  );

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).catch(7000),
    DATABASE_URL: z.string().startsWith("postgres", "must be a PostgreSQL URL"),
    JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
    CLIENT_URL: csvOrigins,
    TRUST_PROXY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().int().min(0).max(5).optional(),
    ),
    LOG_LEVEL: z
      .preprocess(
        (value) => (value === "" ? undefined : value),
        z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),
      ),
    // The confirmation email is optional: without these the survey still saves.
    EMAIL_FROM: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
    EMAIL_PASS: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "production") return;

    if (value.CLIENT_URL.some((origin) => !origin.startsWith("https://"))) {
      ctx.addIssue({
        code: "custom",
        path: ["CLIENT_URL"],
        message: "must use https in production",
      });
    }
    if (value.TRUST_PROXY === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["TRUST_PROXY"],
        message: "must be set in production (2 on Render behind the Vercel rewrite)",
      });
    }
    // A database reached over the internet must use TLS. A host without a dot
    // (Render's internal address, e.g. `dpg-abc123-a`) stays on the private network.
    let host = "";
    try {
      host = new URL(value.DATABASE_URL).hostname;
    } catch {
      /* the startsWith check above already reports a bad URL */
    }
    const requiresTls = host.includes(".");
    if (requiresTls && !/[?&]sslmode=(require|verify-full|verify-ca)\b/.test(value.DATABASE_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "must require TLS in production (add ?sslmode=require)",
      });
    }
  });

export type Env = z.infer<typeof schema>;

/**
 * Parses and checks a set of environment variables.
 *
 * @throws With the names of the missing or invalid variables and the rule each
 * one broke. Values are never included.
 */
export const parseEnv = (source: NodeJS.ProcessEnv = process.env): Env => {
  const result = schema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Missing or invalid environment variables: ${problems}`);
  }
  return Object.freeze(result.data);
};

/** Kept for existing callers and tests: checks the current environment. */
export const assertEnvironment = (): void => {
  parseEnv(process.env);
};

export const env: Env = parseEnv(process.env);

export const emailConfigured = Boolean(env.EMAIL_FROM && env.EMAIL_PASS);
