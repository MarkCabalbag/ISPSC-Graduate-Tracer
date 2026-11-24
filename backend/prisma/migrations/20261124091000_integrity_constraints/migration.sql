-- Data integrity: one survey answer per email, one total per year and program, plus indexes.
--
-- BEFORE applying this to production, run `npm run db:check-duplicates`.
-- If it reports duplicate emails or duplicate totals, the unique indexes below will FAIL.
-- Resolve them first (the MIS office decides which response to keep).

-- Old rows were not always stored lower-cased; new rows already are.
UPDATE "Responses" SET "email" = lower(trim("email")) WHERE "email" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Responses_email_key" ON "Responses"("email");

-- CreateIndex
CREATE INDEX "Responses_yearOfGraduation_program_idx" ON "Responses"("yearOfGraduation", "program");

-- CreateIndex
CREATE INDEX "Responses_department_idx" ON "Responses"("department");

-- CreateIndex
CREATE UNIQUE INDEX "Total_yearOfGraduation_program_key" ON "Total"("yearOfGraduation", "program");

-- CreateIndex
CREATE INDEX "Program_departmentId_idx" ON "Program"("departmentId");

-- CreateIndex
CREATE INDEX "Major_programId_idx" ON "Major"("programId");
