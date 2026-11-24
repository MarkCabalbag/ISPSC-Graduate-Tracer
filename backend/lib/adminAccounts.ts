/**
 * Shared helpers for creating and resetting admin accounts, used by the seed
 * script (prisma/seed.ts) and the admin CLI (scripts/admin.ts).
 */
import bcrypt from "bcryptjs";

/** Cost of the bcrypt hash for a new admin password. */
export const BCRYPT_COST = 12;

/** Shape of a bcrypt hash, e.g. `$2b$12$...` (60 characters). */
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export const isBcryptHash = (value: string): boolean => BCRYPT_HASH.test(value);

export const MIN_PASSWORD_LENGTH = 10;

/**
 * Turns a plain password or an existing hash into a bcrypt hash to store.
 *
 * @param input - `{ password }` to hash a plain password, or `{ hash }` to use
 * a bcrypt hash made elsewhere (so the plain password never touches this code).
 * @throws If the password is too short or the hash is not a bcrypt hash.
 */
export const toPasswordHash = async (input: {
  password?: string;
  hash?: string;
}): Promise<string> => {
  if (input.hash) {
    if (!isBcryptHash(input.hash)) {
      throw new Error("The password hash is not a bcrypt hash.");
    }
    return input.hash;
  }
  if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `The password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    );
  }
  return bcrypt.hash(input.password, BCRYPT_COST);
};

/** Checks a username: 3-50 characters, letters, digits, dot, dash, underscore. */
export const normalizeUsername = (value: string): string => {
  const username = value.trim();
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
    throw new Error(
      "The username must be 3 to 50 characters: letters, digits, dot, dash or underscore.",
    );
  }
  return username;
};
