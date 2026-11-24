-- Ends every session of an admin at once (password reset, sign-out-all).
ALTER TABLE "Admin" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
