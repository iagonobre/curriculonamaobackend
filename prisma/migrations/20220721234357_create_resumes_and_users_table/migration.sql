-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT,
    "admin" BOOLEAN,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "staticURL" TEXT,
    "authorId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "bornDate" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "maritalStatus" TEXT NOT NULL,
    "linkedin" TEXT,
    "cep" TEXT,
    "address" TEXT,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "number" INTEGER,
    "cvPhotoURL" TEXT,
    "cidNumber" INTEGER,
    "deficiencyLevel" TEXT,
    "haveCertificate" BOOLEAN,
    "addaptationDescription" TEXT,
    "limitationDescription" TEXT,
    "aditionalInformation" TEXT,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalExperiences" (
    "id" SERIAL NOT NULL,
    "businessName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "nowExperience" BOOLEAN NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "resumeId" INTEGER NOT NULL,

    CONSTRAINT "ProfessionalExperiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolEducation" (
    "id" SERIAL NOT NULL,
    "position" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "nowCoursing" BOOLEAN NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "resumeId" INTEGER NOT NULL,

    CONSTRAINT "SchoolEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AditionalCourses" (
    "id" SERIAL NOT NULL,
    "courseName" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "totalTime" TEXT NOT NULL,
    "nowCoursing" BOOLEAN NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "resumeId" INTEGER NOT NULL,

    CONSTRAINT "AditionalCourses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "resumeId" INTEGER,

    CONSTRAINT "Ability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalExperiences" ADD CONSTRAINT "ProfessionalExperiences_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolEducation" ADD CONSTRAINT "SchoolEducation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AditionalCourses" ADD CONSTRAINT "AditionalCourses_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability" ADD CONSTRAINT "Ability_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
