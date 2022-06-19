/*
  Warnings:

  - You are about to drop the column `finishedAt` on the `runs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "runs" DROP COLUMN "finishedAt",
ADD COLUMN     "finishDate" TIMESTAMP(3);
