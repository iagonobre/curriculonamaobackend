-- DropForeignKey
ALTER TABLE "Ability" DROP CONSTRAINT "Ability_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "AditionalCourses" DROP CONSTRAINT "AditionalCourses_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalExperiences" DROP CONSTRAINT "ProfessionalExperiences_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolEducation" DROP CONSTRAINT "SchoolEducation_resumeId_fkey";

-- AddForeignKey
ALTER TABLE "ProfessionalExperiences" ADD CONSTRAINT "ProfessionalExperiences_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolEducation" ADD CONSTRAINT "SchoolEducation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AditionalCourses" ADD CONSTRAINT "AditionalCourses_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability" ADD CONSTRAINT "Ability_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
