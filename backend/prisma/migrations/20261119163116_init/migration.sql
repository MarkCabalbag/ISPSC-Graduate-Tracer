-- CreateTable
CREATE TABLE "Responses" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "yearOfGraduation" INTEGER,
    "yearOfSurvey" INTEGER,
    "department" TEXT,
    "program" TEXT,
    "major" TEXT,
    "isEmployed" TEXT,
    "isJobAligned" TEXT,
    "isSelfEmployed" TEXT,
    "isFurtherStudies" TEXT,
    "typeOfOrganization" TEXT,
    "currentJobLocated" TEXT,

    CONSTRAINT "Responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Total" (
    "id" SERIAL NOT NULL,
    "yearOfGraduation" INTEGER,
    "program" TEXT,
    "department" TEXT,
    "totalGraduates" INTEGER DEFAULT 0,

    CONSTRAINT "Total_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "department" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "program" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Major" (
    "id" SERIAL NOT NULL,
    "major" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,

    CONSTRAINT "Major_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Major" ADD CONSTRAINT "Major_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
