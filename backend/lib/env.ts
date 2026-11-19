/**
 * Startup check of the environment variables the API cannot work without.
 *
 * Failing at startup with a clear message is safer than failing on the first
 * login or database call. Only variable NAMES are reported, never their values.
 */

const REQUIRED = [
  "DATABASE_URL",
  "JWT_SECRET",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD_HASH",
] as const;

/** A bcrypt hash looks like `$2a$12$...` and is 60 characters long. */
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * @throws If a required variable is missing or `ADMIN_PASSWORD_HASH` is not a
 * bcrypt hash (a common mistake is storing the plain password).
 */
export const assertEnvironment = (): void => {
  const missing = REQUIRED.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  if (!BCRYPT_HASH.test(process.env.ADMIN_PASSWORD_HASH as string)) {
    throw new Error(
      "ADMIN_PASSWORD_HASH must be a bcrypt hash, not a plain password",
    );
  }

  if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
    console.warn(
      "[env] CLIENT_URL is not set: only http://localhost:5173 can call the API.",
    );
  }
};
