/**
 * Test environment. Runs before every test file, before any app code is
 * imported, so the app sees these (fake) settings. Nothing here is a real
 * secret.
 */
import bcrypt from "bcryptjs";

export const TEST_ADMIN_USERNAME = "test-admin";
export const TEST_ADMIN_PASSWORD = "correct-horse-battery";
export const TEST_JWT_SECRET = "test-secret-test-secret-test-secret-123456";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.ADMIN_USERNAME = TEST_ADMIN_USERNAME;
// Cost 4 keeps the tests fast; production uses 12.
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(TEST_ADMIN_PASSWORD, 4);
process.env.CLIENT_URL = "http://localhost:5173";
