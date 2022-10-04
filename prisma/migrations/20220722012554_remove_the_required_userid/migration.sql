-- DropForeignKey
ALTER TABLE "Resume" DROP CONSTRAINT "Resume_authorId_fkey";

-- AlterTable
ALTER TABLE "Resume" ALTER COLUMN "authorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
